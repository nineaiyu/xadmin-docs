# 权限体系（速览）

> 权限是二开最需要理解的框架能力之一。**权威文档在 xadmin-server 仓库**（随代码发布、与实现同步）：
>
> - [权限体系设计](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/architecture/permission.md)（API / 数据 / 字段三层 + 应用级授权，含调试指引与测试地图）；
> - [数据权限配置教程](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/architecture/data-permission.md)、
>   [字段权限配置教程](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/architecture/field-permission.md)（配图操作步骤）；
> - 完整索引见[二次开发文档地图](/guide/index#二次开发文档地图)。
>
> 本页只给"速记 + 排障入口"，具体语义以权威文档为准。

## 一、三层模型（速记）

| 层 | 控制什么 | 配置入口 | 关键约定 |
|----|----------|----------|----------|
| API / 菜单权限 | 页面可达性 + 接口调用（method + path 匹配） | 菜单管理（目录 / 菜单 / 权限码） | 权限码 = `动作:组件名`（如 `list:SystemUser`）；**必须关联模型** |
| 数据权限 | 数据行可见范围（16 种规则，且 / 或组合） | 数据权限页（新增/编辑抽屉里配置规则，生效范围绑定到接口权限码） | **fail-closed**：无适用授权 = 空集；多条授权取并集（最宽生效），授权只放宽不收窄 |
| 字段权限 | 字段可见性（角色 × 菜单维度） | 角色管理页勾选字段白名单 | 「详情菜单」需单独配白名单，否则详情空白 |

> 5.x 起菜单与字段权限**按角色生效**：账号没有任何角色时拿不到菜单与字段（升级自 4.x 的存量库常见），
> 需要绑定角色或使用超管。

## 二、前端怎么用（二开最常用）

- **页面级**：权限由后端菜单下发——没有权限就没有路由（前端不需要写判断）；
- **按钮级**：`hasAuth("动作:组件名")` 或 `<Auth value="...">`（**没有 `v-auth` 指令**）；
- **RePlusPage 页面**：`usePageAuth([...自定义动作])` 一次生成 `auth` 对象传入 `:auth`；
- **组件名**：取自 `defineOptions({ name })`，与后端权限码的 `:` 后半段必须**一字不差**。

## 三、后端怎么用

- 新增端点必须登记权限点：`python manage.py sync_menu_permissions`（详见
  [框架开发遵循准则](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/%E6%A1%86%E6%9E%B6%E5%BC%80%E5%8F%91%E9%81%B5%E5%BE%AA%E5%87%86%E5%88%99.md)）；
- 查询集过滤统一走 `get_filter_queryset`，**不要手写裸 `filter()`**（会绕过数据权限与审计口径）；
- 字段裁剪由 `BaseModelSerializer` 自动完成（继承即有，无需业务代码处理）。

## 四、排障入口

| 现象 | 处理 |
|------|------|
| 非超管 403 / 整页不渲染 | 权限点未入库或未授权：`python manage.py doctor` → `sync_menu_permissions` → 角色授权 |
| 列表空集但用户确有授权 | `python manage.py audit_data_permission_rules`（非法规则 + 不生效提示）；数据权限页「试算」按用户实跑 |
| 详情抽屉空白 | 给**详情菜单**（`retrieve` 权限码所在菜单）配字段白名单 |
| 按钮不显示 | 核对 `hasAuth` 的权限码与组件名是否一致 |
| 搜索引擎类下拉为空 | 搜索组件同样受权限码控制（如 `list:SearchUser`），需登记权限点并授权 |
| 升级后「有菜单、没有列」 | `python manage.py post_upgrade`（自动补「权限菜单 → 模型」绑定与字段白名单，只加不减） |
| 改权限不生效 | 菜单 / 角色改动有缓存：确认经 API 或 ORM 正常写入；绕过 ORM 直改需手动失效缓存 |

## 五、与其他能力的联动

- **审批**：敏感操作可配「操作前审批」（多级规则）；数据权限决定谁能被审批、菜单权限决定审批入口可见性；
- **MFA**：登录策略可按时间段 / 风险要求二次验证（与权限码无关，属认证层）；
- **脱敏**：脱敏规则在字段权限**之内**再收一层——先可见、再脱敏；
- **开放平台**：API 应用另有一层「接口范围」授权（应用级），与用户三层权限叠加收敛。

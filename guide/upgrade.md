# 版本升级与回滚

> **先判定，再动手**：升级方式取决于你的库结构，判定命令是 `python manage.py upgrade_check`。

## 一、选择升级方式

| 部署方式 | 库的情况 | 升级方式 | 详细步骤 |
|----------|----------|----------|----------|
| 安装器一键部署 | 5.x，或**按域分表之后**的 4.x 库 | 原地升级（脚本自动完成预检 / 备份 / 认领 / 迁移 / 收尾） | [安装器升级（自动）](./upgrade-installer.md) |
| 安装器一键部署 | **更早的 4.x 库**（表名仍是 `system_userinfo` / `system_uploadfile` 等） | 备份 → 清库重建 → 导出 / 回灌 → 验收 | [手动升级 · 重建与回灌](./upgrade-manual.md#二4x--5x清库重建--数据回灌) |
| 手工 compose / 源码部署 | 任意 | 原地升级，或重建 + 回灌 | [手动升级（compose / 源码）](./upgrade-manual.md) |

`upgrade_check` 的结论与对应动作：

| 结论 | 含义 | 动作 |
|------|------|------|
| `up-to-date` | 迁移记录与表结构都与当前代码一致 | 无需处理 |
| `needs-migrate` | 存在待应用迁移（含全新空库） | 执行 `migrate` |
| `legacy-chain-reconcilable` | 等价链的库，迁移账本待认领 | `upgrade_ledger --apply` → `migrate` |
| `legacy-chain-pre-split` | 库结构停留在**按域分表之前**（旧表名、列集更少） | **不要 migrate**，走清库重建 + 回灌 |
| `legacy-chain` / `schema-drift` | 其他旧链路 / 表结构漂移 | 人工排查，通常也需要清库重建 |

> 为什么更早的 4.x 库不能原地升级：5.0 起按域划分了表名（用户 / 文件 / 日志 / 任务分别落到
> `identity_*` / `file_*` / `audit_*` / `task_*`），而账本认领只写迁移记录、不会重命名表与补列；
> 且 4.x 的 PG 数据目录（16）与 5.0 的镜像（`pgvector:pg17`）大版本不兼容。

## 二、两种方式都要做的准备

1. **备份三件套**（回滚的唯一退路）：数据库（`pg_dump`）、媒体与数据目录（含附件物理文件）、配置文件；
2. **停机窗口**：数据库迁移期间短暂停服，避开业务高峰；
3. **升级后验证**：`GET /api/common/api/health` 各项 `true`；登录抽查核心功能（列表、上传、消息、审批）；
   若出现「新菜单 / 按钮 403」或「界面文案回退英文」，补跑 `python manage.py post_upgrade`；
4. **回滚**：停服 → 恢复数据库备份 → 恢复媒体与配置 → 回退代码/镜像版本 → 起服验证。

> 各步骤的完整命令、验收清单与常见问题见
> [安装器升级](./upgrade-installer.md) 与 [手动升级](./upgrade-manual.md)。

## 三、5.0 升级要点（相对 4.2.5）

> 以下为 **5.0 相对 4.2.5（上一个正式版）** 的核对项。5.0 是「迁移链合并 + 累积能力整批发布」
> 的大版本，逐项变更见服务端 [CHANGELOG](https://github.com/nineaiyu/xadmin-server/blob/dev/CHANGELOG.md)、
> 完整升级步骤见 [升级到 5.0](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/upgrade-5.0.md)。

1. **迁移链合并与账本认领**：各业务 app 的分散迁移收敛为初始迁移，**与「按域分表之后」的 4.x 链
   逐行等价**（更早的库表名与列集都不同，不在等价范围内，需清库重建 + 回灌）。
   等价链的升级路径 = 体检（`upgrade_check`，预期 `legacy-chain-reconcilable`）→ 认领
   （`upgrade_ledger --apply`）→ `migrate`（预期 `No migrations to apply`）→ `post_upgrade`。
   安装器已把这几步串进 `./xadmin.sh upgrade`；更早版本的库按
   [手动升级 · 重建与回灌](./upgrade-manual.md#二4x--5x清库重建--数据回灌) 执行。
2. **新增权限点**：`availableForms:FormMySubmission`、`resubmit:FormMySubmission`、
   `submit:FormMySubmission`、`urge:SystemApprovalInstance` 等已写入种子，`post_upgrade` 会补齐。
   - `available-forms` 与 list 权限同口径：存量角色未重新授权也能正常填报；
   - `resubmit` / `submit` / `urge` 属新增动作，角色勾选后对应按钮才可用（超管不受影响）。
3. **站点级外观配置改为全局生效**：站点标题 / Logo 品牌位 / 登录页布局写系统配置（仅超管可改），
   个人配置里的同名历史值不再生效。
4. **媒体文件鉴权**：`/media/` 不再有匿名直链，统一走应用鉴权 + `X-Accel-Redirect` 内转——
   使用自带 nginx 配置的部署需同步更新（安装器/官方镜像已内置）。
5. **表单采集与审批（功能变更）**：
   - 填报页数据源切换为 `available-forms`（定义类资源），普通员工无需设计器权限即可填报；
   - 动态表单提交类的审批单在审批通过后由服务端自动落库，申请人无需再次提交（multipart 或超大
     请求体仍按原协议由客户端携令牌重放）；
   - 表单草稿（轻校验、跳过审批，可继续编辑 / 提交）、表单模板（同表 `is_template`，不进可填报表单
     列表、不可绑定审批流程）、数据字典驱动下拉选项（与内联选项互斥，字典清空时提交 fail-closed）；
   - 数据分析卡片与报表新增「度量字段」选择器，卡片加载失败可重试，数据集预览支持导出 CSV；
   - 审批中心：通过/批量通过可填审批意见（入时间线）、「我的申请」支持催办（10 分钟节流）与驳回后
     「重新提交」（按原流程/原内容预填）、轨迹显示「由 X 代理」（委托代审来源）。
6. **演示模式（可选，体验/演示环境用）**：新装系统执行 `python manage.py seed_demo_all`（或安装器
   `WITH_DEMO_DATA=1 ./xadmin.sh install`）可一键灌入演示数据：演示账号 `admin / admin123`（挂
   「演示模式」角色，破坏性写操作已裁剪）、示例组织与四层权限角色（`demo_staff` / `demo_lead` /
   `demo_fin`，初始密码 `Demo@2026!`）、示例审批与表单数据；随时可用
   `python manage.py seed_demo_all --reset` 重置为初始状态。

> 注：`load_init_json` 是「库内数据优先、种子让位」的语义，但其冲突预检只覆盖 `unique=True` 字段；
> 若库内审批节点被 UI 编辑过（节点行会整批重建、主键变化），种子文件按 `(流程, 顺序)` 会撞唯一约束导致
> **整次导入回滚**。此时改用按主键的定向补齐或对账后再重跑种子（该工具的预检缺口已登记）。

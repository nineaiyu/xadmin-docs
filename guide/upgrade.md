# 版本升级与回滚

> 适用于 **Docker Compose 部署**（安装见 [容器化部署](./installation-docker.md)）。
> 升级脚本按「预检 → 备份 → 迁移 → 重建」执行，并在结束时给出回滚指引。

## 一、升级前检查（预检）

`7_upgrade.sh` 会自动完成以下检查，异常时中止或要求人工确认：

- **磁盘空间**：目标目录可用空间 ≥ 5 GiB（镜像加载 + 数据库增量余量）；
- **关键容器**：`xadmin-postgresql` / `xadmin-redis` 状态（unhealthy 时需人工确认）；
- **备份目录**：`/backups` 可写（升级流程依赖数据库备份产物）；
- **版本门槛**：当前版本满足最低升级要求。

手动确认项：

- 最近一次数据库备份时间（默认 RPO 6h，见备份相关配置 `BACKUP_INTERVAL`）；
- 如跨大版本升级，先阅读对应 Release Notes。

## 二、执行升级

```bash
# 升级到最新版本
bash scripts/7_upgrade.sh

# 指定版本
bash scripts/7_upgrade.sh v4.x.y
```

脚本流程（每步失败会给出中止/继续选项）：

1. 加载新版本 Docker 镜像；
2. **数据库备份**（失败时强烈建议中止排查，不要跳过）；
3. 配置文件备份（输出路径会打印在终端）；
4. 执行数据库迁移（结构变更，期间短暂停服）；
5. 旧镜像清理（可选）；
6. 完成提示 + **回滚指引**。

## 三、升级后验证

```bash
# 健康检查：db_status / redis_status / celery_status 应均为 true
curl http://<你的地址>/api/common/api/health

# 容器状态：全部 healthy
docker ps
```

再登录系统抽查核心功能（列表、上传、消息、审批）。

## 四、回滚（新版本异常时）

```bash
# 1. 停止服务
bash ./xadmin.sh stop

# 2. 恢复数据库（选择升级前的备份）
bash scripts/6_db_restore.sh

# 3. 恢复配置
cp <终端打印的配置备份路径> config.txt

# 4. 回退版本并重新加载镜像
#    编辑 static.env 将 VERSION 改回旧版本号
bash scripts/3_load_images.sh
bash ./xadmin.sh start
```

## 五、注意事项

- **备份优先**：没有可用备份的升级不得执行（脚本的备份失败询问在生产环境应选择中止）；
- **升级窗口**：数据库迁移期间短暂停服，请避开业务高峰；
- **数据卷**：升级不触碰数据卷（数据库 / 媒体文件），仅替换容器与镜像；
- **PITR 兜底**：若启用 WAL 归档（见部署配置），可在极端情况下按时间点恢复。

### 动态表单与审批（随版本升级的变更）

1. **新增权限点**：`availableForms:FormMySubmission`、`resubmit:FormMySubmission`，已写入种子；存量库用
   `python manage.py loaddata loadjson/menu.json loadjson/menumeta.json` 补齐（或重跑 `load_init_json`）。
   - `available-forms` 与 list 权限同口径：存量角色未重新授权也能正常填报；
   - `resubmit` 属新增功能，角色勾选后「重新提交」按钮才可用。
2. **填报页数据源切换**：由「表单设计器列表接口」改为 `available-forms`（定义类资源），普通员工无需设计器权限即可填报。
3. **审批自动完成**：动态表单提交类的审批单在审批通过后由服务端自动落库，申请人无需再次提交；
   multipart 或超大请求体仍按原协议由客户端携令牌重放。
4. **开箱模板**（可选）：新装系统执行 `python manage.py seed_demo_org` 一键生成示例组织、预置角色（四层权限）
   与场景模板，账号 `demo_staff` / `demo_lead` / `demo_fin`。

### 数据库迁移结构（2026 年度变更合并）

自 4.2.5（`main`）以来的全部结构变更已合并为 **4 个新增迁移文件**，`main` 既有迁移文件保持原样：

| 应用 | 新增迁移 | 覆盖内容 |
| --- | --- | --- |
| `system` | `0004_aiknowledgechunk_aiknowledgedocument_aiprofile_and_more` | AI 档案/知识库、审批中心、数据分析、动态表单、开放平台、会话与审计增强、模块裁剪、检索索引（受控执行）与种子时间戳回填 |
| `notifications` | `0003_messagecontent_deleted_at_and_more` | 消息软删除与列表索引 |
| `message` | `0001_initial` | 聊天室模型（会话/成员/消息） |
| `common` | `0002_alter_monitor_created_time` | 监控时间字段对齐 |

- 从 4.2.5 升级：`migrate` 按常规执行（升级脚本自动完成），无需任何手工步骤；
- 使用过内测 / `dev` 版本的库：同样直接 `migrate`——同名迁移不会重跑，被合并的旧文件记录仅留存于
  `django_migrations` 表，对后续迁移无影响；
- 检索索引（pg_trgm）采用受控执行：扩展不可用或单索引失败只告警不阻断迁移，检索自动回退顺序扫描。

### 表单采集 / 数据分析 / 审批中心（深度完善）

> 相关结构变更（`DynamicForm.is_template`、提交状态 `DRAFT`、节点任务 `delegate_from`）随上表
> `system` 合并迁移一并落地；三条新增均为向后兼容的可空/默认值字段，无需数据回填。

1. **新增权限点**：`submit:FormMySubmission`（提交草稿）、`urge:SystemApprovalInstance`（催办），已写入种子；
   存量库用 `python manage.py loaddata loadjson/menu.json loadjson/menumeta.json` 补齐，或对两个权限点按主键
   单独补齐（`load_init_json` 在库内已有与种子同「流程+顺序」的审批节点时会整体失败，属历史库漂移，见下注）。
   - 未重新授权时：超管不受影响；自定义角色需勾选后才能看到「提交草稿 / 催办」按钮。
2. **表单草稿**：填报弹窗新增「存为草稿」（轻校验、跳过审批），列表出现「草稿」状态，可「继续编辑 / 提交」；
   提交时服务端按 schema 严格校验后再走 流程引擎 / 操作审批 / 直接生效。
3. **表单模板**：设计器行内「存为模板」、工具栏「从模板新建」；模板与表单同表（`is_template`），
   不进入可填报表单列表、不接受提交、不可绑定审批流程。**无需新增权限点**（复用表单列表/创建权限）。
4. **数据字典驱动选项**：设计器字段属性弹窗可给下拉/单选/多选绑定字典类型（与内联选项互斥），
   填报选项由字典维护；字典清空时该字段提交会失败（fail-closed 设计）。
5. **数据分析**：卡片与报表新增「度量字段」选择器（`sum/avg` 的数值列候选来自数据集 `numeric_columns`）；
   卡片加载失败会显示原因并可重试；仪表盘支持「刷新」与「设置」（重命名/可见性）；数据集预览支持导出 CSV。
6. **审批中心**：通过/批量通过可填审批意见（入流转记录时间线）；「我的申请」支持催办（10 分钟节流）与
   驳回后「重新提交」（按原流程/原内容预填）；审批轨迹显示「由 X 代理」（委托代审来源）。

> 注：`load_init_json` 是「库内数据优先、种子让位」的语义，但其冲突预检只覆盖 `unique=True` 字段；
> 若库内审批节点被 UI 编辑过（节点行会整批重建、主键变化），种子文件按 `(流程, 顺序)` 会撞唯一约束导致
> **整次导入回滚**。此时改用按主键的定向补齐（如上）或对账后再重跑种子（该工具的预检缺口已登记）。

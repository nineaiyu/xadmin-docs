# 版本升级与回滚

> 适用于 **xadmin-installer 一键部署**（安装见 [一键部署](./demo.md)）。
> 升级脚本按「预检 → 加载镜像 → 备份 → 迁移收尾」执行，并在结束时给出回滚指引。
> 手工 compose 部署（见 [容器化部署](./installation-docker.md)）的升级见文末「六、手工部署升级」。

## 一、升级前检查（预检）

`./xadmin.sh upgrade` 会自动完成以下检查（脚本 `scripts/7_upgrade.sh`），异常时中止或要求人工确认：

- **磁盘空间**：`VOLUME_DIR` 所在分区可用空间 ≥ 5 GiB（镜像加载 + 数据库增量余量）；
- **关键容器**：`xadmin-postgresql` / `xadmin-redis` 状态（unhealthy 时需人工确认；未运行视为冷升级放行）；
- **备份目录**：`${VOLUME_DIR}/db_backup` 可写（升级流程依赖数据库备份产物）；
- **版本门槛**：当前版本 ≥ `v4.2.5`（更早版本的库不支持原地升级，请走「备份 + 清库重建 + 数据回灌」，见服务端 `docs/ops/upgrade-stock.md`）。

手动确认项：

- 最近一次数据库备份时间（默认 RPO 6h，见备份相关配置 `BACKUP_INTERVAL`）；
- 如跨大版本升级，先阅读对应 Release Notes。

## 二、执行升级

```bash
# 升级到 static.env 指定版本（默认最新）
./xadmin.sh upgrade

# 升级到指定版本
./xadmin.sh upgrade v4.x.y
```

脚本流程（每步失败会给出中止/继续选项）：

1. 预检（磁盘 / 容器健康 / 备份目录）；
2. 加载新版本 Docker 镜像（`scripts/3_load_images.sh`）；
3. **数据库备份**（失败时强烈建议中止排查，不要跳过）；
4. 配置文件备份（路径打印在终端，位于 `${VOLUME_DIR}/db_backup/config-<旧版本>-<时间>.conf`）；
5. **迁移前体检与账本认领**（5.0 起）：先跑 `python manage.py upgrade_check` 判定库能否原地升级，
   再由 `python manage.py upgrade_ledger --apply` 认领迁移账本（4.x 链 → 5.0 合并链，只写迁移记录、
   不执行 DDL），随后执行数据库迁移；
6. 自动执行 `python manage.py post_upgrade`（账本认领 / API 前缀平移 / 种子 / 权限点 / 语言包 / 缓存，
   幂等；漏做会出现「新入口 403 / 文案回退英文」）；
7. 旧镜像清理（可选）；
8. 完成提示 + **回滚指引**，之后执行 `./xadmin.sh start` 启动。

## 三、升级后验证

```bash
# 健康检查：db_status / redis_status / celery_status 应均为 true
curl http://<你的地址>/api/common/api/health

# 容器状态：全部 healthy
docker ps
```

若出现「新菜单/按钮 403」或「界面文案回退英文」，在容器内补跑一次：

```bash
docker exec -i xadmin-server python manage.py post_upgrade
```

再登录系统抽查核心功能（列表、上传、消息、审批）。

## 四、回滚（新版本异常时）

```bash
# 1. 停止服务
./xadmin.sh stop

# 2. 恢复数据库（选择升级前第 3 步产生的备份文件）
./xadmin.sh restore_db <备份文件路径>

# 3. 恢复配置（使用第 4 步打印的配置备份路径）
cp <配置备份文件> /opt/xadmin/config/config.txt

# 4. 回退版本并重新加载镜像
#    编辑 static.env 将 VERSION 改回旧版本号
./xadmin.sh load_image
./xadmin.sh start
```

## 五、注意事项

- **备份优先**：没有可用备份的升级不得执行（脚本的备份失败询问在生产环境应选择中止）；
- **升级窗口**：数据库迁移期间短暂停服，请避开业务高峰；
- **数据卷**：升级不触碰数据卷（数据库 / 媒体文件），仅替换容器与镜像；
- **PITR 兜底**：若启用 WAL 归档（见部署配置），可在极端情况下按时间点恢复。

## 六、手工部署升级（git clone + compose）

不使用安装器时，手工升级：

```bash
cd /data/xadmin/xadmin-server
git pull
docker compose build          # pyproject.toml / uv.lock 有变更时
docker compose up -d          # 重建并启动
docker exec -i xadmin-server python manage.py post_upgrade   # 幂等：种子/语言包/缓存/权限扫描
```

回滚：`git checkout <旧版本 tag>` 后重跑上面三步；数据库从升级前的备份恢复
（备份方法见 [容器化部署](./installation-docker.md)，或使用 `pg_dump` / `mariadb-dump`）。

### 5.0 升级要点（相对 4.2.5）

> 以下为 **5.0 相对 4.2.5（上一个正式版）** 的核对项。5.0 是「迁移链合并 + 累积能力整批发布」
> 的大版本，逐项变更见服务端 [CHANGELOG](https://github.com/nineaiyu/xadmin-server/blob/dev/CHANGELOG.md)、
> 完整升级步骤见 [升级到 5.0](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/upgrade-5.0.md)。

1. **迁移链合并与账本认领**：各业务 app 的分散迁移收敛为初始迁移，**表结构与 4.2.5 逐行等价**。
   4.2.5 起的库升级路径 = 体检（`upgrade_check`，预期 `legacy-chain-reconcilable`）→ 认领
   （`upgrade_ledger --apply`）→ `migrate`（预期 `No migrations to apply`）→ `post_upgrade`。
   安装器已把四步串进 `./xadmin.sh upgrade`，无需手工操作；更早版本的库仍走清库重建。
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

# 手动升级（compose / 源码部署）

> 适用于**手工部署**：`git clone` + `docker compose`（见 [容器化部署](./installation-docker.md)），
> 或源码运行（见 [本地部署](./installation-local.md)）。用安装器一键部署的请走
> [安装器升级](./upgrade-installer.md)。
>
> 升级分两类，**先判定再动手**：
>
> | 你的库 | 升级方式 | 本章节 |
> |--------|----------|--------|
> | 5.x 之间的库，或「按域分表之后」的 4.x 库 | 原地升级（换代码 + 迁移） | [一、原地升级](#一原地升级) |
> | 更早的 4.x 库（表名还是 `system_userinfo` 等） | **清库重建 + 数据回灌** | [二、4.x → 5.x：清库重建 + 回灌](#二4x--5x清库重建--数据回灌) |

## 一、原地升级

适用于库结构与当前版本一致（迁移链只被"合并/认领"过，没有表名与字段的整体搬迁）：

```bash
cd /data/xadmin/xadmin-server
git fetch --tags && git checkout <目标版本 tag>

# 1) 升级前体检：结论决定后续动作
docker compose run --rm --entrypoint bash server -c "python manage.py upgrade_check"
#    up-to-date / needs-migrate        → 直接下一步
#    legacy-chain-reconcilable         → 先认领账本再迁移（下面第 2 步）
#    legacy-chain-pre-split / legacy-chain / schema-drift → 中止，转第二节

# 2) 账本认领（仅 legacy-chain-reconcilable 需要；只写迁移记录，不执行 DDL）
docker compose run --rm --entrypoint bash server -c "python manage.py upgrade_ledger --apply"

# 3) 迁移 + 收尾（post_upgrade 幂等：种子 / 语言包 / 缓存 / 权限扫描）
docker compose run --rm --entrypoint bash server -c "python manage.py migrate"
docker compose run --rm --entrypoint bash server -c "python manage.py post_upgrade"

# 4) 重建并启动
docker compose build          # 依赖或 Dockerfile 有变更时
docker compose up -d
```

> **PostgreSQL 大版本**：4.x 的 PG 数据目录由 `postgres:16.8` 初始化，5.0 起镜像是
> `pgvector:pg17`（知识库向量检索需要 `vector` 扩展）。**大版本的数据目录不兼容**，直接换镜像
> 启动会得到 `FATAL: database files are incompatible with server` 并循环重启（此时 server /
> worker 因依赖 PG 健康也起不来）。处置：

```bash
# ① 用旧镜像导出（数据目录仍挂在原路径）
docker run --rm -v "${VOLUME_DIR}/postgresql/data:/var/lib/postgresql/data" \
  registry.cn-beijing.aliyuncs.com/nineaiyu/postgres:16.8 \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > /tmp/xadmin-pg16.dump

# ② 归档旧目录，让 pg17 初始化新目录（空目录即可，容器会自动 initdb）
mv "${VOLUME_DIR}/postgresql/data" "${VOLUME_DIR}/postgresql/data.pg16-$(date +%F)"
mkdir -p "${VOLUME_DIR}/postgresql/data"

# ③ 起 pg17 并恢复（DB_USER / DB_DATABASE 与配置一致）
docker compose up -d postgresql && sleep 15
docker exec -i xadmin-postgresql pg_restore -U <DB_USER> -d <DB_DATABASE> \
  --no-owner --no-acl < /tmp/xadmin-pg16.dump
```

Redis 7.4 → 8.10 的数据目录兼容，无需处置；数据量很大时可改用 `pg_upgrade` 原地升级。

## 二、4.x → 5.x：清库重建 + 回灌

5.0 起按域划分了表名（用户 / 文件 / 日志 / 任务分别落到 `identity_*` / `file_*` / `audit_*` /
`task_*`），**更早的 4.x 库**（表名仍是 `system_userinfo` / `system_uploadfile` …）无法原地升级
——账本认领只写迁移记录，既不会重命名表也不会补列。官方路径是：

**备份 → 清库重建 → 导出/回灌 → 验收**。

### 第 1 步：备份（回滚的唯一退路）

```bash
# ① 数据库
pg_dump -U <DB_USER> -d <DB_DATABASE> | gzip > backup-$(date +%F_%H%M).sql.gz
# ② 媒体与数据目录（附件物理文件在其中）
tar czf data-$(date +%F_%H%M).tar.gz -C <VOLUME_DIR>/server data
# ③ 配置文件（SECRET_KEY / 数据库口令）
cp <配置文件> config-backup-$(date +%F_%H%M).conf
```

### 第 2 步：导出旧库数据

导出用**独立脚本** `ops/legacy_export.py`（只依赖 `psycopg` / `psycopg2`，因此放进旧版本容器
或任意能连库的机器都能跑）：把新版本仓库里的这个文件拷过去执行。

```bash
python ops/legacy_export.py \
    --dsn "postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:5432/<DB_DATABASE>" \
    --output /tmp/xadmin-legacy \
    --media-root <VOLUME_DIR>/server/data/upload
```

- 产物：`export.json`（业务数据）+ `files/`（附件与用户头像等物理文件，按原存储路径组织）；
- `--include users,depts` 可只导出部分实体；
- 结束时会打印各实体行数与附件拷贝 / 缺失数量——**附件缺失只导出记录**，回灌时跳过该记录。

> 附件使用远程存储（S3 等）时 `--media-root` 无效：先把文件取回本地目录再导出，或导出后手工补齐
> `files/` 目录。

### 第 3 步：清库重建

```bash
# ① PostgreSQL：重建库（PG 大版本不兼容时先按第一节的三步迁移数据目录）
psql -U <DB_USER> -c "drop database if exists <DB_DATABASE>;" \
                   -c "create database <DB_DATABASE>;"

# ② 迁移
docker compose run --rm --entrypoint bash server -c "python manage.py migrate"

# ③ 先建超级管理员，再灌种子
#    种子文件引用了 creator_id=1，空库直接灌种子会外键失败
docker compose run --rm --entrypoint bash server -c \
  "python manage.py shell -c \"from identity.models import UserInfo; u,_=UserInfo.objects.get_or_create(username='xadmin'); u.is_superuser=True; u.is_staff=True; u.set_password('<新密码>'); u.save()\""
docker compose run --rm --entrypoint bash server -c "python manage.py load_init_json"
docker compose run --rm --entrypoint bash server -c "python manage.py post_upgrade"

# ④ 启动服务
docker compose up -d
```

### 第 4 步：回灌数据

```bash
docker compose run --rm --entrypoint bash server -c \
  "python manage.py legacy_import --input /tmp/xadmin-legacy --dry-run"   # 先空跑核对
docker compose run --rm --entrypoint bash server -c \
  "python manage.py legacy_import --input /tmp/xadmin-legacy"
```

行为说明：

- **幂等**：按自然键（`code` / `username` / `name`）upsert，重复执行只更新不重复建；同名记录若在
  回收站（软删）会被恢复；
- **引用缺失会告警不中断**：例如旧库角色绑定了新库种子中已调整/移除的权限点，会按
  `roles.menu=<权限码>` 列出（跨版本正常差异，核对后可忽略）；
- **单实体失败只跳过该实体**，其余实体与收尾步骤照常执行，错误在末尾统一列出。

### 第 5 步：验收

| # | 检查项 | 命令 / 位置 | 期望 |
|---|--------|-------------|------|
| 1 | 迁移与账本 | `python manage.py upgrade_check` | `up-to-date`（无待应用 / 无游离记录） |
| 2 | 权限点缺口 | `python manage.py sync_menu_permissions --dry-run` | 缺口 0 |
| 3 | 组织与账号 | 用户 / 部门 / 角色列表 | 层级、数量、禁用状态与旧库一致 |
| 4 | 角色授权 | 角色管理 → 菜单授权 | 授权项数量与旧库一致 |
| 5 | 数据权限 | 用户 / 部门的「数据权限」 | 规则内容一致 |
| 6 | 系统配置 | 系统管理 → 系统配置 | 自定义配置键值一致 |
| 7 | 个人配置 | 对应账号登录后的个人偏好 | 与旧库一致 |
| 8 | 附件 | 文件管理 + 下载 | 记录与物理文件可下载 |
| 9 | 公告 | 我的通知 | 正文、目标（用户/部门/角色）、已读状态、附件一致 |
| 10 | 登录 | 用**旧密码**登录 | 成功（密码哈希原样搬运） |
| 11 | 健康检查 | `GET /api/common/api/health` | `status` / `db_status` / `redis_status` / `storage_status` 为 `true`（未起 worker 时 `celery_status` 为 false 属正常） |
| 12 | 冒烟 | 登录 → 菜单 → 列表页 → 导入导出 | 无 403 / 404 / 500 |

### 搬运范围

| 会搬运 | 不搬运 |
|--------|--------|
| 部门（含层级 / 停用 / 部门角色与数据权限） | 登录日志、操作日志 |
| 角色（含停用）与其菜单授权 | 导出记录、任务执行历史 |
| 用户（密码哈希、状态、加入时间、超管标记、多角色、数据权限、头像） | 临时文件与上传分片 |
| 数据权限规则、系统配置、个人配置 | 会话 / 令牌 / 缓存 |
| 附件记录与物理文件 | 菜单与权限点（由 `load_init_json` 种子提供） |
| 公告（正文 / 目标用户·部门·角色 / 附件 / 已读状态） | |

> 库是**重建**的：自增主键、UUID、`created_time` 由新库重新生成，请按业务自然键核对数据。

### 回滚

1. 停服；
2. 恢复数据库：`psql -U <DB_USER> -d <DB_DATABASE> < backup-*.sql.gz`；
3. 恢复媒体目录与配置文件（`tar xzf data-*.tar.gz`、`cp config-backup-*.conf <配置文件>`）；
4. 代码 / 镜像回退到升级前版本，起服验证。

### 常见问题

| 现象 | 原因与处置 |
|------|-----------|
| `upgrade_check` 报 `legacy-chain-pre-split` | 预期：库停留在按域分表之前，按本章节升级 |
| 回灌提示 `files.missing=...` | 旧库里该附件的物理文件已丢失（记录在、文件不在），已跳过该记录，不影响其他数据 |
| 回灌提示 `roles.menu=xxx: N` | 旧库角色绑定的权限点在当前种子中已调整/移除，属跨版本正常差异；需要保留请在角色管理重新勾选 |
| 用旧密码登录失败 | 确认导出包含 `users` 实体、回灌后未改过该账号密码；PBKDF2 / argon2 哈希都支持 |
| 数据都在但 ID / 时间戳变了 | 预期：库重建后主键与时间戳由新库生成，按自然键核对 |
| 想要「原地升级」并保留原 UUID / 时间戳 | 需要额外的跨版本数据搬迁迁移（表重命名 + 补列 + 逐表映射），当前未提供 |

> 服务端权威细节（判定实现、迁移账本、回灌工具的字段映射）见
> [docs/ops/upgrade-stock.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/upgrade-stock.md)
> 与 [docs/ops/upgrade-4x-to-5x.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/upgrade-4x-to-5x.md)。

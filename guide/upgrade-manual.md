# 手动升级（compose / 源码部署）

> 适用于**手工部署**：`git clone` + `docker compose`（见 [容器化部署](./installation-docker.md)），
> 或源码运行（见 [本地部署](./installation-local.md)）。用安装器一键部署的请走
> [安装器升级](./upgrade-installer.md)。
>
> 升级分两类，**先判定再动手**：
>
> | 你的库 | 升级方式 | 本章节 |
> |--------|----------|--------|
> | 5.x 之间的库，或「按域分表之后」的 4.x 库 | 原地升级（换代码 + 迁移） | [一、原地升级](#一、原地升级) |
> | 更早的 4.x 库（表名还是 `system_userinfo` 等） | **原地升级（推荐）**，判阻断时清库重建 + 回灌 | [二、4.x → 5.x：原地升级](#二、4-x-→-5-x-原地升级-推荐-清库重建-回灌-兜底) |

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

## 二、4.x → 5.x：原地升级（推荐）/ 清库重建 + 回灌（兜底）

5.0 起按域划分了表名（用户 / 文件 / 日志 / 任务分别落到 `identity_*` / `file_*` / `audit_*` /
`task_*`），**更早的 4.x 库**（表名仍是 `system_userinfo` / `system_uploadfile` …）结构不同。

**2026-10 起支持原地升级**：在同一个库里对齐结构（表改名 / 补列 / 补表 / 内容类型与存量引用重指 /
迁移账本重写），**数据、主键、UUID、附件与二开表全部保留**，不需要清库重建；PostgreSQL 16 → 17 的
数据目录由安装器自动迁移。

### 原地升级（安装器一键，已验证）

```bash
# 1) 预检（只读）：结论必须是 legacy-inplace-capable
cd /opt/xa-installer-5x
docker run --rm --network xadmin_net --env-file /opt/xadmin/config/config.txt \
  -e ALLOWED_HOSTS='["<本机IP>","127.0.0.1"]' \
  --entrypoint python registry.cn-beijing.aliyuncs.com/nineaiyu/xadmin-server:5.0.1 \
  -c "import os,sys; sys.path.insert(0,'/data/xadmin-server'); os.chdir('/data/xadmin-server'); \
      os.environ.setdefault('DJANGO_SETTINGS_MODULE','server.settings'); import django; django.setup(); \
      from django.core.management import call_command; call_command('upgrade_check', tag='v4.2.5')"

# 2) 备份（安装器也会自动备份，这里是双保险）
docker exec xadmin-postgresql pg_dump -U postgres -Fc -f /tmp/pre.dump xadmin
docker cp xadmin-postgresql:/tmp/pre.dump /root/xa-pre-$(date +%F).dump

# 3) 一条命令完成升级（判定 → 预演 → 执行 → 复检 → 账本 → migrate → 收尾）
INPLACE_ALIGN=1 ./xadmin.sh upgrade 5.0.1

# 4) 启动与验收
./xadmin.sh start
docker exec xadmin-server python manage.py upgrade_check   # 期望 up-to-date
```

非安装器部署可用手工三步（都在 5.x 的 server 容器内执行）：

```bash
python manage.py legacy_align --tag v4.2.5           # 预演（只读）
python manage.py legacy_align --tag v4.2.5 --apply   # 执行（单事务）
python manage.py upgrade_ledger --apply && python manage.py migrate && python manage.py post_upgrade
```

**验收**：`upgrade_check` = `up-to-date`；5 个容器 healthy、首页 200；用户/部门/角色/公告/附件/日志
行数与升级前一致；二开表行数与关联不变（外键自动指向新表名）。

::: warning 升级后「有菜单、没有列」
5.x 的列表列由接口下发并按**字段权限**裁剪（未配置 = 零字段）。升级收尾的 `post_upgrade` 会自动补
「权限菜单 → 模型」绑定与字段白名单并清缓存；若仍无列，手工再跑一次 `docker exec xadmin-server
python manage.py post_upgrade`。另外 5.x 的菜单/字段权限**按角色**生效——**没有任何角色的账号**
（4.x 里常见）升级后拿不到字段与菜单，需要绑定角色或使用超管。
:::

### 兜底路径：清库重建 + 回灌

原地升级被判**阻断**（体检输出 `legacy-chain-pre-split` 且列了阻断项）、或结构已被人为破坏时，才走
下面的重建路径。注意它对二开不友好：二开 app 的旧迁移引用需人工改写、二开表物理文件不随库搬运，
审批/表单/数据集/日志/任务/PAT 等也不在回灌范围内。

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
| 系统设置（`Setting`）；**加密项只搬元信息**，取值需在新库重新填写 | 菜单与权限点（由 `load_init_json` 种子提供） |
| 字段权限（角色 × 菜单 × 字段树） | 性能监控、验证码等临时数据 |
| 用户 / 系统消息订阅（通知渠道偏好） | 二开 app 的表（用 `--extra-tables auto` 整表搬运，见文末附录） |
| 附件记录与物理文件 | |
| 公告（正文 / 目标用户·部门·角色 / 附件 / 已读状态） | |

> 库是**重建**的：自增主键、UUID、`created_time` 由新库重新生成，请按业务自然键核对数据。

### 回滚

1. 停服；
2. 恢复数据库：`psql -U <DB_USER> -d <DB_DATABASE> < backup-*.sql.gz`；
3. 恢复媒体目录与配置文件（`tar xzf data-*.tar.gz`、`cp config-backup-*.conf <配置文件>`）；
4. 代码 / 镜像回退到升级前版本，起服验证。

## 附：做过二次开发（自定义 app / 自定义字段）的升级

框架自带的数据按前文回灌即可；**二开部分**按下表处理：

| 你的改动 | 处理方式 |
|----------|----------|
| 自己写的 app（自带模型与迁移） | 导出时加 `--extra-tables auto`（自动识别非框架表），导入时**整表原样写回**（保留主键） |
| 指向框架对象的外键（`user_id` / `dept_id` / `role_id` 等） | **无需处理**：回灌沿用旧库主键（`UserInfo` 自增、部门/角色 UUID），外键值与外部系统保存的 ID 都保持有效 |
| 在框架模型上新增的字段 | 需要你自己的迁移处理：5.0 把 `system` 域拆成了 `identity` / `file` / `audit` / `task`，原迁移里的 `app_label` 与表名要一起改（如 `system.UserInfo` → `identity.UserInfo`、`system_userinfo` → `identity_userinfo`） |
| 二开表里的文件字段 | 当前工具只搬框架附件（`UploadFile`）的物理文件；二开表的文件请手工同步媒体目录 |
| 改了框架自带的 app 名 / 表名 | 属于深度定制：表名对不上时导入会**告警跳过**（不会写错数据），需要你自行扩展映射 |

用法（导出侧）：

```bash
python ops/legacy_export.py --dsn "postgresql://..." --output /tmp/xadmin-legacy \
    --media-root <VOLUME_DIR>/server/data/upload --extra-tables auto
```

> `--extra-tables auto` 会列出识别到的二开表；也可以显式写表名（逗号分隔）。
> 导入侧（`manage.py legacy_import`）自动处理 `export.json` 里的 `extra_tables` 段：
> 目标库存在同名表就整表写回（主键相同的行跳过），不存在则告警跳过。
>
> 回灌结束会**自动重置自增序列**（按原值写入主键后必须把序列推到最大值，否则新建记录会撞主键）。


### 常见问题

| 现象 | 原因与处置 |
|------|-----------|
| `upgrade_check` 报 `legacy-chain-pre-split` | 预期：库停留在按域分表之前，按本章节升级 |
| 回灌提示 `files.missing=...` | 旧库里该附件的物理文件已丢失（记录在、文件不在），已跳过该记录，不影响其他数据 |
| 回灌提示 `roles.menu=xxx: N` | 旧库角色绑定的权限点在当前种子中已调整/移除，属跨版本正常差异；需要保留请在角色管理重新勾选 |
| 用旧密码登录失败 | 确认导出包含 `users` 实体、回灌后未改过该账号密码；PBKDF2 / argon2 哈希都支持 |
| 回灌提示「加密设置 N 项未搬运取值」 | 这类设置的密文由旧库 `SECRET_KEY` 签发，换库后无法解密；记录本身已建（含分类与开关），请在设置页重新填写取值。若沿用相同 `SECRET_KEY`，也可选择不删除旧值后手工核对 |
| 数据都在但 ID / 时间戳变了 | 预期：库重建后主键与时间戳由新库生成，按自然键核对 |
| 想要「原地升级」并保留原 UUID / 时间戳 | **已具备**：服务端 `docs/plans/原地升级立项与方案-2026.10.md`（决策 `docs/adr/ADR-094-inplace-upgrade-for-legacy-libraries.md`）用「同库结构对齐」替代清库重建——表改名 / 补列 / 补表 / 内容类型与存量引用重指 / 账本重写，数据、主键、附件与二开表都保留；安装器已接线（体检判 `legacy-inplace-capable` 时先预演再执行），也可手动跑 `python manage.py legacy_align --dsn "<旧库连接串>" --tag <旧版本 tag>` 看预演。二开 app 的旧引用用 `python manage.py legacy_rewrite_app_refs --app-path <你的 app> --tag <旧版本 tag>` 改写。**升级前务必备份**；真实客户库建议先看体检判定与阻断项 |

> 服务端权威细节（判定实现、迁移账本、回灌工具的字段映射）见
> [docs/ops/upgrade-stock.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/upgrade-stock.md)
> 与 [docs/ops/upgrade-4x-to-5x.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/upgrade-4x-to-5x.md)。

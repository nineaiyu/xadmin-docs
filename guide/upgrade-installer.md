# 安装器升级（自动）

> 适用于 **xadmin-installer 一键部署**（安装见 [一键部署](./demo.md)）。脚本按
> **预检 → 加载镜像 → 备份 → 迁移收尾** 执行，逐步给出中止/继续选项，结束时打印回滚指引。
>
> 手工 compose / 源码部署请看 [手动升级](./upgrade-manual.md)；升级路径的判定与选择见
> [版本升级与回滚](./upgrade.md)。

## 一、升级前准备

1. **拿到新版本安装包**：解压后在原安装目录执行（升级脚本读当前目录的 `static.env` 与 `compose/`）；
2. **确认版本门槛**：当前版本需 ≥ `v4.2.5`（更早的库需走
   [清库重建 + 回灌](./upgrade-manual.md#二4x--5x清库重建--数据回灌)）；
3. **留出窗口**：迁移期间短暂停服；
4. 建议先看该版本 Release Notes / [升级到 5.0](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/upgrade-5.0.md)
   的变更核对项。

## 二、执行升级

```bash
# 升级到 static.env 指定版本（默认最新）
./xadmin.sh upgrade

# 升级到指定版本（推荐：明确写出版本号）
./xadmin.sh upgrade v5.0.1
```

脚本逐步执行（每步失败会给出中止 / 继续选项，生产环境建议中止排查）：

| 步骤 | 内容 | 说明 |
|------|------|------|
| 1 | **预检** | 磁盘空间 ≥ 5 GiB；`xadmin-postgresql` / `xadmin-redis` 健康（未运行视为冷升级放行）；`${VOLUME_DIR}/db_backup` 可写；版本门槛 |
| 2 | **加载新版本镜像** | `scripts/3_load_images.sh`，镜像可从阿里云镜像仓拉取或本地包加载 |
| 3 | **数据库备份** | 产物在 `${VOLUME_DIR}/db_backup/`；**备份失败不要跳过** |
| 4 | **配置备份** | 路径打印在终端：`${VOLUME_DIR}/db_backup/config-<旧版本>-<时间>.conf` |
| 5 | **PostgreSQL 大版本迁移**（按需） | 见第三节：数据目录 16 → 17 时自动导出 / 重建 / 恢复 |
| 6 | **迁移前体检与账本认领** | 先 `upgrade_check` 判定库能否原地升级，再由 `upgrade_ledger --apply` 认领迁移账本（只写迁移记录、不执行 DDL），随后执行 `migrate` |
| 7 | **升级后收尾** | 自动执行 `post_upgrade`（账本 / API 前缀平移 / 种子 / 权限点 / 语言包 / 缓存，幂等） |
| 8 | 旧镜像清理（可选）+ 完成提示 | 之后执行 `./xadmin.sh start` 启动，或让脚本直接启动 |

```bash
./xadmin.sh start          # 启动服务
```

## 三、PostgreSQL 大版本自动迁移

4.x 的 PG 数据目录由 `postgres:16.8` 初始化，5.0 起镜像是 `pgvector:pg17`（知识库向量检索需要
`vector` 扩展），**大版本的数据目录不兼容**。升级脚本在内置步骤 5 里自动处理：

1. 停服前记录当前运行的 PG 镜像；
2. 用该镜像导出逻辑备份（`pg_dump -Fc`）到 `${VOLUME_DIR}/db_backup/`；
3. 归档旧数据目录为 `.../postgresql/data.pg16-<时间>`，用新镜像初始化空目录；
4. `pg_restore` 回灌并打印迁移记录数校验；
5. 继续后续迁移步骤。

相关开关与产物：

| 项 | 说明 |
|----|------|
| `SKIP_PG_DATA_MIGRATION=1 ./xadmin.sh upgrade vX.Y.Z` | 跳过该步骤（自行处理过数据目录迁移时使用） |
| 归档目录 | `${VOLUME_DIR}/postgresql/data.pg16-<时间>`（确认升级成功后可自行清理） |
| 逻辑备份 | `${VOLUME_DIR}/db_backup/pg16-to-pg17-<时间>.dump` |
| 数据目录版本高于目标镜像 | 直接中止（不支持降级），需用匹配的大版本备份恢复 |

> Redis 7.4 → 8.10 的数据目录兼容，脚本不做处置。

## 四、预检未通过时怎么办

升级流程会先跑 `python manage.py upgrade_check`，按结论分流：

| 体检结论 | 脚本行为 |
|----------|----------|
| `up-to-date` / `needs-migrate` | 直接继续 `migrate` |
| `legacy-chain-reconcilable` | 自动先 `upgrade_ledger --apply` 认领账本，再 `migrate` |
| `legacy-chain-pre-split` | **中止**：库停留在按域分表之前（表名仍是 `system_userinfo` 等），原地升级不可行 |
| `legacy-chain` / `schema-drift` | **中止**：迁移链路不匹配或表结构漂移，需人工排查 |

`legacy-chain-pre-split` 的处置：先 `./xadmin.sh stop`，再按
[手动升级 · 4.x → 5.x](./upgrade-manual.md#二4x--5x清库重建--数据回灌) 的
**备份 → 清库重建 → 导出/回灌 → 验收** 执行（导出脚本 `ops/legacy_export.py` 随新版本发布）。
确需强行继续可设 `SKIP_UPGRADE_CHECK=1`，但会得到一个结构不完整的库，**不推荐**。

## 五、升级后验证

```bash
curl http://<你的地址>/api/common/api/health
# status / db_status / redis_status / storage_status 应为 true（未起 worker 时 celery_status 为 false 正常）

docker ps          # 容器全部 healthy
```

若出现「新菜单 / 按钮 403」或「界面文案回退英文」，补跑一次收尾：

```bash
docker exec -i xadmin-server python manage.py post_upgrade
```

随后登录抽查核心功能（列表、上传、消息、审批、报表）。

## 六、回滚

```bash
# 1. 停止服务
./xadmin.sh stop

# 2. 恢复数据库（用第 3 步产生的备份文件）
./xadmin.sh restore_db <备份文件路径>

# 3. 恢复配置（用第 4 步打印的配置备份路径）
cp <配置备份文件> /opt/xadmin/config/config.txt

# 4. 回退版本并重新加载镜像
#    编辑 static.env 将 VERSION 改回旧版本号
./xadmin.sh load_image
./xadmin.sh start
```

> 若升级过程中执行过 PostgreSQL 大版本迁移，回滚时还需把数据目录换回归档的
> `data.pg16-<时间>`（并让旧版本镜像使用它）。

## 七、注意事项

- **备份优先**：没有可用备份的升级不得执行；脚本询问「备份失败是否继续」时应选择中止；
- **停机窗口**：数据库迁移期间短暂停服，避开业务高峰；
- **数据卷**：升级不触碰数据卷（数据库 / 媒体文件），仅替换容器与镜像；
- **PITR 兜底**：若启用 WAL 归档，可在极端情况下按时间点恢复；
- **跨大版本**：4.x → 5.x 若体检判为 `legacy-chain-pre-split`，请走
  [手动升级](./upgrade-manual.md) 的重建 + 回灌路径，脚本不会替你重建数据。

> 服务端权威细节见
> [docs/ops/deployment-upgrade.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/deployment-upgrade.md)
> 与 [docs/ops/upgrade-stock.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/upgrade-stock.md)。

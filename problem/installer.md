# 安装器（xadmin.sh）常见问题

> 适用于 [一键部署](../guide/demo.md)（xadmin-installer）场景；通用安装问题见[常见问题](./one.md)。

## 命令速查

```bash
./xadmin.sh install               # 安装（版本在 static.env 指定）
./xadmin.sh start                 # 启动
./xadmin.sh status                # 容器状态
./xadmin.sh restart               # 重启（stop + start）
./xadmin.sh close                 # 仅停业务容器（保留数据库运行）
./xadmin.sh stop                  # 停止并移除全部容器（含数据库容器）
./xadmin.sh upgrade [版本]         # 升级（省略版本则升级到最新）
./xadmin.sh backup_db             # 数据库备份
./xadmin.sh restore_db <备份文件>  # 数据库恢复
./xadmin.sh tail [服务名]          # 查看日志
./xadmin.sh uninstall             # 卸载（全程交互确认）
```

## 常见问题

### 1. 安装脚本提示操作系统不支持

- 仅支持 Linux x86_64（Kernel > 4.0）；macOS / Windows 请改用 Docker 方式本地体验
  （见[快速体验](../guide/quick-start.md)）。

### 2. 安装 / 升级时提示磁盘空间不足

- 预检要求 `VOLUME_DIR` 所在分区可用空间 ≥ 5 GiB（镜像加载 + 数据库增量余量，见 `scripts/7_upgrade.sh`）；
- 清理旧镜像（`docker image prune`）或扩容后重试。

### 3. 升级时提示当前版本过低

- 版本门槛为 `v4.2.5`（低于该版本的库需走「备份 + 清库重建 + 数据回灌」，见[手动升级 · 重建与回灌](../guide/upgrade-manual.md#二、4-x-→-5-x-原地升级-推荐-清库重建-回灌-兜底)）。
  **版本号达标不等于结构达标**：库结构是否可原地升级由升级流程的前置体检判定（`legacy-chain-pre-split` 表示库仍停留在按域分表之前，同样要重建 + 回灌）。

### 4. 升级中途失败，如何回滚

见[安装器升级 · 回滚](../guide/upgrade-installer.md#六、回滚)：停服 → `restore_db` 恢复备份 → 恢复配置 →
`static.env` 回退版本并重新加载镜像。

### 5. 备份文件在哪里

- 数据库备份：`${VOLUME_DIR}/db_backup/`（`VOLUME_DIR` 以 `/opt/xadmin/config/config.txt` 为准）；
- 升级时的配置备份同目录：`config-<旧版本>-<时间>.conf`。

### 6. 容器 unhealthy / 服务起不来

```bash
./xadmin.sh status                                          # 容器状态
./xadmin.sh tail server                                     # 某服务日志
docker inspect --format '{{.State.Health.Status}}' xadmin-postgresql
```

- 数据库 / Redis 未就绪时其余服务会等待；按日志定位后 `./xadmin.sh restart`。

### 7. 升级后新入口 403 / 文案变英文

```bash
docker exec -i xadmin-server python manage.py post_upgrade    # 幂等：种子/权限点/语言包/缓存
```

执行后 `./xadmin.sh restart`。

### 8. 卸载时数据会被删除吗

- `./xadmin.sh uninstall` 全程交互确认：停服 → **可选**清理 `VOLUME_DIR` 数据目录与 `/opt/xadmin/config`
  配置目录 → **可选**清理镜像；
- **数据删除不可逆**：清理前请先 `./xadmin.sh backup_db` 并把备份文件拷出数据目录。

### 9. 数据库备份 / 恢复怎么做

```bash
./xadmin.sh backup_db                 # 备份到 ${VOLUME_DIR}/db_backup/
./xadmin.sh restore_db <备份文件路径>   # 从备份恢复（会停服，恢复后需重启）
```

备份只是兜底的一部分。媒体文件（附件物理文件）在 `${VOLUME_DIR}/server/data`，
与数据库**分开**存放——完整的数据安全策略（备份频率 / 保留 / 演练 / PITR）见服务端仓库
[ops/pitr.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/pitr.md) 与
[ops/backup-drill-2026-Q4.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/backup-drill-2026-Q4.md)。

### 10. 数据目录 / 配置目录在哪里

| 内容 | 路径 |
|------|------|
| 数据卷根目录（`VOLUME_DIR`） | 以 `/opt/xadmin/config/config.txt` 为准（安装时选定） |
| 数据库备份（安装器命令） | `${VOLUME_DIR}/db_backup/` |
| 容器级定时备份（db-backup 容器） | `${VOLUME_DIR}/xadmin-db-backups/`（默认 6 小时一次、保留 7 天，含媒体目录） |
| 媒体与运行数据 | `${VOLUME_DIR}/server/data`（日志 / 附件 / 临时文件） |
| 安装配置 | `/opt/xadmin/config/`（`config.txt` 含初始管理员密码） |

### 11. 想定期自动备份数据库

后端 compose 自带 `db-backup` 容器（随栈启动）：默认每 6 小时做一次逻辑备份、保留 7 天，
并可选把媒体目录一并纳入、同步到异地副本（`BACKUP_REMOTE_TYPE=local/rsync/rclone`）。
需要更短的恢复窗口（RPO）时，走 WAL 归档 / PITR，见服务端仓库
[ops/pitr.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/pitr.md)；
备份策略与演练记录见
[ops/backup-drill-2026-Q4.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/ops/backup-drill-2026-Q4.md)。

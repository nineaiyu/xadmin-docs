## Demo 快速部署体验

> 在**开发机**上想几分钟看到完整系统？见[快速体验（一键启动）](./quick-start.md)——一条
> `bash utils/dev_up.sh --with-demo` 起全栈并灌演示数据。
> 本文是**生产服务器**上的一键部署（xadmin-installer）。

准备一台 2核4G（最低）且可以访问互联网的 64 位 Linux 主机；

以 root 用户执行如下命令一键安装

```shell
VERSION=v4.2.5
curl -sSL https://github.com/nineaiyu/xadmin-server/releases/download/${VERSION}/quick_start.sh |bash
```

> 版本号以 [Releases 最新页](https://github.com/nineaiyu/xadmin-server/releases/latest) 为准
> （`VERSION` 需与 xadmin-installer 同名 tag 同时存在）。

## 首次登录

| 项 | 值 |
|----|-----|
| 账号 | `xadmin` |
| 密码 | 安装输出中**仅打印一次**，并写入 `/opt/xadmin/config/config.txt` |

忘记密码：`docker exec -it xadmin-server python manage.py changepassword xadmin`

## 日常管理（xadmin.sh）

```bash
./xadmin.sh start / restart / status   # 启动 / 重启 / 状态
./xadmin.sh close                      # 仅停业务容器（保留数据库）
./xadmin.sh stop                       # 停止并移除全部容器（含数据库容器）
./xadmin.sh backup_db                  # 数据库备份（${VOLUME_DIR}/db_backup/）
./xadmin.sh tail server                # 查看日志
```

升级与回滚见[版本升级与回滚](./upgrade.md)；更多安装器问题见[安装器 FAQ](/problem/installer)。

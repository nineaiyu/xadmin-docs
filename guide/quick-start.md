# 快速体验（一键启动）

> 适合想「几分钟看到完整系统」的场景：一条命令起后端全栈 + 初始化 + 前端，并可选灌入演示数据。
> 生产部署见[一键部署](./demo.md) / [容器化部署](./installation-docker.md)。

## 前置条件

- Docker（含 compose v2）；
- Node.js ≥ 22.22.1、pnpm ≥ 11（不启动前端可不需要）。

## 一键启动

```bash
cd xadmin-server
bash utils/dev_up.sh --with-demo   # 启动后端全栈 + 幂等初始化 + 演示数据 + 前端 dev server
```

启动流程（幂等，可重复执行）：

1. `docker compose up -d` 起后端全栈（nginx / postgresql / redis / server / celery / beat / 备份容器）；
   **首次运行会自动构建镜像，需要数分钟**；
2. 等待健康检查（`/api/common/api/health`）通过，自动执行 `python utils/init_data.py`
   （migrate + 创建超管 + 导入默认种子）；
3. 追加执行 `doctor` 环境自检（八项检查，失败不阻塞启动，按输出中的修复命令处理）；
4. 存在 `../xadmin-client` 时自动 `pnpm install`（首次）并启动前端 dev server。

启动完成后：

- 前端：<http://127.0.0.1:8848>（Ctrl+C 仅退出前端，后端容器保持运行）；
- 后端：<http://127.0.0.1:8896>（API 文档：`/api-docs/swagger/`）。

## 首次登录

| 项 | 值 |
|----|-----|
| 账号 | `xadmin` |
| 密码 | `init_data` 输出中**仅打印一次**（随机生成；可用 `XADMIN_ADMIN_PASSWORD=xxx` 显式指定） |

忘记密码（已有环境）：

```bash
docker exec -it xadmin-server python manage.py changepassword xadmin
```

## 演示数据

- `--with-demo`：初始化后追加演示数据（组织 / 审批 / 表单 / 聊天 / 知识库等，约 1-2 分钟）；
  手动补装 `python manage.py seed_demo_all`，一键卸载 `python manage.py seed_demo_clean`；
- 不需要演示数据：去掉 `--with-demo`；
- 只要后端（前端本地另起）：`bash utils/dev_up.sh --backend-only`。

## 停止与清理

```bash
bash utils/dev_down.sh    # 停止全部容器（数据保留；下次 dev_up.sh 数秒恢复）

# 彻底清理（含数据库/媒体数据，谨慎执行）：
cd xadmin-server && docker compose down -v
```

## 常见问题

| 现象 | 处理 |
|------|------|
| 8896 / 8848 端口被占用 | 后端改 `config.yml` 的 `HTTP_LISTEN_PORT`；前端改 `.env` 的 `VITE_PORT` |
| 首次启动很慢 | 首次需构建镜像 / 安装依赖；后续启动为数秒级 |
| 修改后端代码不生效 | 代码挂载但不热加载：`docker compose restart server celery-worker celery-heavy celery-beat` |
| 升级后新菜单 403 / 文案变英文 | `docker exec -i xadmin-server python manage.py post_upgrade` 后重启 |
| 环境异常想自检 | `docker exec -i xadmin-server python manage.py doctor`（八项检查 + 修复命令） |

更多疑难见[常见问题](/problem/one)。

# AGENTS.md — xadmin-docs（对外文档站）

> 继承工作区根 `../AGENTS.md`。本仓库是**对外的产品文档站**（VitePress），
> 内容口径必须与两个代码仓库的当前实现一致——文档站写错比不写更糟。

## 一、仓库地图

| 路径 | 内容 |
|------|------|
| `.vitepress/config.mts` | 站点配置与侧栏分组（新增页面必须挂进侧栏） |
| `index.md` | 首页 |
| `guide/` | 快速开始 / 安装部署（docker · local · nginx · mariadb）/ 一键部署与升级 |
| `advanced/` | 进阶：权限 / 存储 / 表单上传 / 模块裁剪 |
| `components/` | 组件库章节（容器与数据展示 / 表单元件与弹层 / AI 与聊天域） |
| `example/` | 二开示例（新建 app 的 API / 前端 / 菜单 / 数据权限 / 测试） |
| `problem/` | 常见问题（含安装器 FAQ） |
| `devguidelines/` | 开发规范（client / server / windows） |
| `public/` `build.sh` `Dockerfile` `nginx.conf` | 站点资源与构建部署 |

## 二、写作与一致性约定

1. **文档站不重复实现细节**：权威口径在代码仓库内（`xadmin-server/docs/` 是文档中心），
   本站写「怎么用」，细节链回仓库文档或 GitHub 源码（跨仓库引用用
   `https://github.com/nineaiyu/xadmin-server/blob/dev/...` 绝对链接——相对路径指向仓库外文件会
   让 `docs:build` 报死链）。
2. **命令与路径必须真的存在**：示例里的脚本路径（如 `ops/init_data.py` / `ops/dev_up.sh`）、
   manage.py 命令、端口、账号口径要与代码一致；服务端有 `check_tutorial_mirror.py` 守护
   「教程里的命令/参数与代码一致」，改示例命令时两边一起改。
3. **版本号不要写死到易漂移的位置**：站点标题 / 徽章（Python / Node / Django 版本）由服务端
   `scripts/check_doc_facts.py` 跨仓校验，改站点徽章需同步核对该门禁。
4. **受保护的升级脚本版本串**：`guide/demo.md` 里的 `VERSION=vX.Y.Z` 与平台版本强绑定
   （服务端 `check_doc_facts.py` 会在版本不一致时报红）。
5. 新增页面：① 放进对应目录；② 挂进 `.vitepress/config.mts` 侧栏；③ 跑构建确认无死链。

## 三、构建与验证

```bash
pnpm install
pnpm docs:dev        # 本地预览
pnpm docs:build      # 构建（死链会让构建失败——这是本站的主要门禁）
```

构建通过即视为门禁通过；涉及版本 / 命令 / 徽章的改动，另在 `xadmin-server` 仓库跑一次
`python scripts/check_doc_facts.py` 与 `python scripts/check_tutorial_mirror.py` 确认跨仓一致。

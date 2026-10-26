# AGENTS.md — xadmin-docs（对外文档站）

> 继承工作区根 `../AGENTS.md`。本仓库是**对外的产品文档站**（VitePress），
> 内容口径必须与两个代码仓库的当前实现一致——文档站写错比不写更糟。

## 一、仓库地图

| 路径 | 内容 |
|------|------|
| `.vitepress/config.mts` | 站点配置与侧栏分组（新增页面必须挂进侧栏）；图片的 fancybox 灯箱渲染规则也在这 |
| `index.md` | 首页（tagline 受跨仓事实校验） |
| `guide/` | 快速开始 / 功能特性（`features.md`，模块清单以 server 仓 `common/core/modules/catalog.py` 为唯一事实源）/ 安装部署（docker · local · nginx · mariadb）/ 升级三篇（总览 · 安装器 · 手动） |
| `advanced/` | 进阶：权限 / 存储 / 表单上传 / 模块裁剪 |
| `components/` | 组件库章节（容器与数据展示 / 表单元件与弹层 / AI 与聊天域） |
| `example/` | 二开示例（新建 app 的 API / 前端 / 菜单 / 数据权限 / 测试） |
| `problem/` | 常见问题（含安装器 FAQ） |
| `devguidelines/` | 开发规范（client / server / windows） |
| `public/` `build.sh` `Dockerfile` `nginx.conf` | 站点资源（fancybox 等静态资源在 `public/static/`）与构建部署 |
| `.github/` | 7 个 workflow：`docs-build.yml`（push/PR 校验门禁）、`build-image.yml`（tag v* 出镜像）、`release-drafter.yml`、issue-* ×4 |

**内容定位**（README 承载）：本站只写「安装部署与入门演示」，权威细节链回仓库文档；
在线体验、二开文档地图、技术栈、交流群等信息统一维护在 `guide/index.md`——别在第二处重复，
改了这边就不改那边必然漂移。线上站点 docs.dvcloud.xin，演示平台 xadmin.dvcloud.xin。

## 二、写作与一致性约定

1. **文档站不重复实现细节**：权威口径在代码仓库内（`xadmin-server/docs/` 是文档中心），
   本站写「怎么用」，细节链回仓库文档或 GitHub 源码（跨仓库引用用
   `https://github.com/nineaiyu/xadmin-server/blob/dev/...` 绝对链接——相对路径指向仓库外文件会
   让 `docs:build` 报死链）。
2. **命令与路径必须真的存在**：示例里的脚本路径（如 `ops/init_data.py` / `ops/dev_up.sh`）、
   manage.py 命令、端口、账号口径要与代码一致。服务端 `check_tutorial_mirror.py`（server 仓
   CI 门禁）守护二开教程四篇：`example/new-app-{api,client,menu,test}.md` 的命令/参数与代码
   一致——`new-app-data-permission.md` 与 `guide/` 下页面**不在**它的覆盖内，改那些更要自己核对。
3. **版本事实守护位置**（server 仓 `check_doc_facts.py` 跨仓校验，改这些位置必须同步事实源）：
   首页 `index.md` tagline 与 `guide/index.md` / `README.md` 的 Python/Django/Node 徽章；
   `guide/demo.md` 的 `VERSION=vX.Y.Z`（**构建时由 `build.sh`/Dockerfile 按发布版本自动 sed，
   平时发版不需要手改**）；`guide/upgrade-installer.md` 与 `problem/installer.md` 的升级版本
   门槛（事实源：installer `scripts/7_upgrade.sh` 的 `required_version`）；
   `devguidelines/client.md` 的 Node/pnpm 要求、`example/new-app-test.md` 的
   `--cov-fail-under=`、`guide/installation-{local,docker}.md` 的 Python 版本。
4. **新增页面三步 + CI 硬门禁**：① 放进对应目录；② 挂进 `.vitepress/config.mts` 侧栏
   （`check_docs_site_nav.py` 拦孤儿页面）；③ 跑构建 + `check_docs_site_links.py`
   （锚点级死链与跨仓路径引用，vitepress 自身不校验 `#fragment`）。
5. **图片与静态资源**：全站 markdown 图片由 `config.mts` 内联渲染规则挂 fancybox 灯箱，
   head 注入 `public/static/{fancybox.css,styles.css,fancybox.umd.js}`；改图片行为动
   `config.mts`，不要加依赖。图片按目录就近存放。
6. **依赖升级先读 `pnpm-workspace.yaml`**：里面有供应链治理政策——overrides 强制若干
   「最小跳版修复线」（vite / esbuild 等），仅范围内升级，升完必须 `pnpm docs:build` 验证，
   上游包含修复后删除条目（pnpm 11 起 overrides 只认这个文件）。
7. **版本示例不写死旧版本**：升级/安装命令里的版本号统一写成 `vX.Y.Z` 占位或当前发布版本
   （与 server `const.py` 一致）；`check_doc_facts` 只守护升级门槛，不守护示例版本。
   新增/修改示例时不要写死即将过期的补丁版本号。
8. **站点 nginx 安全头**：`nginx.conf` 已在 server 级声明 `server_tokens off` /
   `X-Content-Type-Options` / `Referrer-Policy`；新增头同样集中写在 server 级，改完用
   `curl -I` 复验（与 web 仓同一 `add_header` 继承规则）。`/assets/` 只用 `expires`，
   不要加 location 级 `add_header`，否则 assets 会丢掉 server 级安全头。CSP 暂不开启：
   VitePress 产物含内联脚本/样式，需先做 hash/nonce 或隔离验证。静态目录必须用
   `root`，`try_files` + `alias` 会让全站 404（已实测）。

## 三、构建与验证

```bash
pnpm install
pnpm docs:dev        # 本地预览
pnpm docs:build      # 构建（页级死链会让构建失败——ignoreDeadLinks 未豁免）
pnpm docs:preview    # 本地预览构建产物
```

**「构建通过」不等于门禁通过**：CI（`docs-build.yml`）在构建之后还有一串校验——
`check_docs_site_links.py --require-dist`（对构建产物核对锚点级死链）→ `check_doc_facts.py`
（三仓检出，本仓 CI 自动执行，**不需要**另去 server 仓跑）→ `check_doc_index.py` /
`check_doc_paths.py` → `check_docs_site_nav.py`（孤儿页面）。涉及二开教程改动时，
server 仓的 `check_tutorial_mirror.py`（属 server 仓 CI）会在那边把关。

工具链：Node 24 + pnpm 11.25.0（corepack 激活，`build.sh` / Dockerfile 同版本），
VitePress ^1.6.4，产物 `dist/`。发布链路：tag `v*` → `build-image.yml` 多架构
（amd64 + arm64）构建镜像推 Docker Hub `nineaiyu/xadmin-docs`——`provenance: false`
不能动（阿里云镜像仓拒绝 OCI provenance manifest，同步会整 tag 判败）。

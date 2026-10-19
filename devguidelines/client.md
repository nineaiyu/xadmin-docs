# 客户端开发不限平台

> 环境要求以仓库为准：Node **≥ 24**（`.nvmrc` 为 v24.20.0）、pnpm **≥ 11**；完整步骤与门禁清单见
> [xadmin-client README](https://github.com/nineaiyu/xadmin-client/blob/dev/README.md)。

## 0. 环境准备

```bash
# 按 .nvmrc 锁定 Node 版本（推荐用 nvm / fnm 管理）
nvm install            # 读取 .nvmrc（v24.20.0）
corepack enable pnpm   # 或 npm install -g pnpm
```

## 1. 客户端 WebStorm 配置使用

本地需要安装 nodejs 环境，推荐使用 [.nvmrc](https://github.com/nineaiyu/xadmin-client/blob/dev/.nvmrc) 指定的 LTS 版本 [下载](https://nodejs.org/zh-cn/download/prebuilt-installer)

安装全局 pnpm 命令

```shell
npm install -g pnpm
```

## 2. visual studio code 配置使用

参考链接 <https://pure-admin.github.io/pure-admin-doc/pages/vscode/>

## 3. 本地开发流程

```bash
pnpm install          # 安装依赖
pnpm dev              # 开发服务器 :8848（代理 /api → 后端 :8896）
```

vite 已内置默认代理（`/api`、`/media`、`/api-docs` → `http://127.0.0.1:8896`，`/ws` → `ws://127.0.0.1:8896`），
后端按默认端口启动即可直接联调，**无需手工修改配置**；后端不在 8896 时用环境变量 `E2E_API_PORT` 覆盖代理目标。

提交前跑一遍门禁（与 CI 同口径）：

```bash
pnpm lint             # eslint + prettier + stylelint（--max-warnings 0）
pnpm typecheck        # tsc + vue-tsc
pnpm test:run         # vitest 单测
```

## 4. 页面怎么写（元数据驱动）

列表页不手写 `el-table`，统一用 `RePlusPage` 消费后端元数据：页面只保留
`utils/hook.tsx`（api / auth / 列格式化 / 按钮）+ 一行模板。逐层拆解见
[前端操作](../example/new-app-client)；组件职责与扩展点见
[组件库](../components/)。

## 5. 目录约定（速记）

| 目录 | 放什么 |
|------|--------|
| `src/views/<域>/<模块>/` | 业务页面：`index.vue` + `utils/{api.ts,hook.tsx}` |
| `src/components/` | 通用组件（`Re` 前缀；barrel 入口按需引入） |
| `src/api/` | 接口封装（`BaseApi` 子类） |
| `locales/` | 国际化词条（zh-CN.yaml / en.yaml 必须对称） |
| `contract/` | 后端契约镜像（`pnpm sync:contract` 同步，勿手改） |
| `e2e/` | Playwright E2E（纪律见 `e2e/README.md`） |

## 6. 如何快速定位到相关代码？

在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置：

- Mac 默认组合键 Option + Shift；
- Windows 默认组合键 Alt + Shift。

更多用法见 <https://inspector.fe-dev.cn/guide/start.html>。

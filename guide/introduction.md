# 项目目录

## server 整体目录结构

```shell
├── captcha                     # 图片验证码应用
├── common                      # 项目工具类库，包含各种封装方法
├── config.yml                  # 运行配置文件（由 config_example.yml 复制而来）
├── data                        # 运行数据目录（日志 data/logs、临时文件等）
├── demo                        # 官方示例 app（Book 四件套 + 上架审批/二次确认；教程见 docs/guide/）
├── docker-compose.yml          # docker compose 运行文件
├── Dockerfile                  # 用于构建容器镜像文件
├── docs                        # 文档中心（二开必读见 docs/README.md）
├── loadjson                    # 默认的菜单，权限，字段配置（种子）
├── locale                      # 国际化配置，支持中文和英语
├── manage.py
├── mfa                         # 多因素认证应用
├── message                     # websocket 消息
├── notifications               # 站内信，消息通知推送应用
├── requirements.txt            # Django 运行依赖（开发另加 requirements-dev.txt）
├── scripts                     # 门禁 / 自检脚本
├── server                      # 项目主应用（settings / urls / asgi）
├── settings                    # 系统设置应用
├── system                      # 系统应用，包含用户，菜单，日志，角色等
├── tests                       # 测试（unit / integration）
└── utils                       # 一键启动与初始化脚本（dev_up.sh / init_data.py）

```

## 项目配置模板文件 config_example.yml（节选）

```shell
# SECURITY WARNING: keep the secret key used in production secret!
# 加密密钥 生产服必须保证唯一性，你必须保证这个值的安全，否则攻击者可以用它来生成自己的签名值
# $ cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 49;echo
SECRET_KEY:

# Development env open this, when error occur display the full process track, Production disable it
# DEBUG 模式 开启DEBUG后遇到错误时可以看到更多日志，正式服要禁用
# DEBUG: true

# DEBUG, INFO, WARNING, ERROR, CRITICAL can set. See https://docs.djangoproject.com/zh-hans/6.0/topics/logging/
# 日志级别
# LOG_LEVEL: DEBUG

# 用于DEBUG模式下，输出sql日志
# DEBUG_DEV = true

# Database setting, Support sqlite3, mysql, postgres ....
# 数据库设置
# ### 更多数据库配置，参考官方文档：https://docs.djangoproject.com/zh-hans/6.0/ref/databases/
# 创建竖数据库sql
# create database xadmin default character set utf8mb4 COLLATE utf8mb4_bin;
# grant all on xadmin.* to server@'127.0.0.1' identified by 'KGzKjZpWBp4R4RSa';

# SQLite setting:
# 使用单文件sqlite数据库
# DB_ENGINE: sqlite3
# DB_NAME:
# MySQL or postgres setting like:
# DB_ENGINE can set mysql, oracle, postgresql, sqlite3

# 使用 Mariadb 作为数据库
#DB_ENGINE: mysql
#DB_HOST: mysql
#DB_PORT: 3306

# 使用 postgresql 作为数据库[默认数据库]
DB_ENGINE: postgresql
DB_HOST: postgresql
DB_PORT: 5432

DB_USER: server
DB_DATABASE: xadmin
#DB_PASSWORD: KGzKjZpWBp4R4RSa


# Use Redis as broker for celery and web socket
# Redis配置
REDIS_HOST: redis
REDIS_PORT: 6379
#REDIS_PASSWORD: nineven
#DEFAULT_CACHE_ID: 1
#CHANNEL_LAYERS_CACHE_ID: 2
#CELERY_BROKER_CACHE_ID: 3

# When Django start it will bind this host and port
# ./manage.py runserver 127.0.0.1:8896
# 运行时绑定端口
HTTP_BIND_HOST: 0.0.0.0
HTTP_LISTEN_PORT: 8896
GUNICORN_MAX_WORKER: 4

# 功能模块裁剪（可选）：full（默认全功能）/ standard（内核+标配，推荐二开起点）/ core（仅内核）
# 也可用 MODULE_ENABLE / MODULE_DISABLE 在预设基础上增减，如 MODULE_DISABLE: [analysis, chat]
# 模块清单与裁剪范围见「进阶开发 → [功能裁剪（模块化）](/advanced/module-trim)」
# MODULE_PRESET: full

# 需要将创建的应用写到里面（config_example.yml 开发兜底默认 XADMIN_APPS: [demo]）
XADMIN_APPS:
```

> 以上为节选（完整键与注释以仓库 `config_example.yml` 为准，另含 Celery / 日志 / 邮件 / 短信 / 监控等配置段）。

## client 整体目录结构

```shell
├── build
├── build.sh                            # 构建脚本
├── commitlint.config.js
├── contract                            # 后端契约镜像（pnpm sync:contract 同步）
├── docker-compose.yml                  # docker compose 运行文件
├── Dockerfile                          # 用与构建容器镜像文件
├── e2e                                 # Playwright E2E（纪律见 e2e/README.md）
├── eslint.config.js
├── index.html
├── LICENSE
├── locales                             # 国际化
├── mock
├── package.json                        # 环境依赖
├── pnpm-lock.yaml
├── postcss.config.js
├── public
├── src                                 # 主要源码
│   ├── api                 # 接口api
│   ├── App.vue
│   ├── assets
│   ├── components          # 组件库
│       ├── RePlusSearch    # 后端对应搜索组件-重要！！！
│       ├── RePlusPage      # 页面组件-重要！！！
│   ├── config              # 项目配置
│   ├── constants
│   ├── directives
│   ├── layout              # 项目框架
│   ├── main.ts
│   ├── plugins
│   ├── router              # 路由
│   ├── store
│   ├── style
│   ├── utils           
│   └── views               #页面
├── playwright.config.ts
├── scripts                             # 校验脚本（版本 / 契约 / 体积等）
├── stylelint.config.js
├── tsconfig.json
├── types
├── vite.config.ts
└── vitest.config.ts

```

## 核心代码

前端需要悉知 RePlusSearch 和 RePlusPage 组件

## RePlusPage

前端页面基于自封装的 RePlusPage 组件（真源：`src/components/RePlusPage/src/utils/types.ts`，随版本演进；本页不再复制易漂移的类型快照）。

核心输入：

| 参数 | 说明 |
|---|---|
| `api` | BaseApi 实例（如 `new BaseApi("/api/demo/book")`），列表查询与增删改查 / 导入导出都走它 |
| `auth` | 权限对象（`getDefaultAuths` 生成，键与后端权限动作对应），控制页面 / 按钮显隐 |
| `localeName` | 国际化前缀（对应前端 `locales/zh-CN.yaml` 下的节点） |
| `listColumnsFormat` / `searchColumnsFormat` / `detailColumnsFormat` | 列装配出口（在框架默认渲染之后执行，可覆盖渲染器 / 宽度 / valueType） |
| `addOrEditOptions` | 新增 / 编辑弹窗配置（可重写列组件，如 autocomplete） |
| `operationButtonsProps` / `tableBarButtonsProps` | 行操作 / 工具栏按钮组 |
| `searchResultFormat` / `beforeSearchSubmit` | 请求结果 / 提交参数加工 |
| `pagination` / `pureTableProps` / `plusSearchProps` / `plusDescriptionsProps` | 透传底层组件 props |

最小示例：

```vue
<script lang="ts" setup>
import { ref } from "vue";
import { RePlusPage } from "@/components/RePlusPage";
import { useDemoBook } from "./utils/hook";

defineOptions({ name: "DemoBook" }); // 必须与菜单组件名一致

const tableRef = ref();
const { api, auth } = useDemoBook(tableRef);
</script>

<template>
  <RePlusPage ref="tableRef" :api="api" :auth="auth" locale-name="demoBook" />
</template>
```

> 完整类型（含回收站 `recycleBin`、变更历史 `changeHistory`、异步导出 `allowAsyncExport` 等）
> 以真源 `types.ts` 为准；逐层用法见 [前端教程](/example/new-app-client)，组件职责与扩展点见
> 服务端组件手册（[component-handbook](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/architecture/component-handbook.md)）。
>
> 后端配合：`common/core/` 提供 `BaseModelSet` / `BaseModelSerializer` 与元数据接口（`search-columns` /
> `search-fields`），页面列与搜索项由后端元数据驱动（见服务端文档中心 `docs/README.md`）。

# 项目目录

## server 整体目录结构

```shell
├── captcha                     #图片验证码应用
├── common                      # 项目工具类库，包含各种封装方法
├── config.py                   # 运行配置文件，包含数据库，Redis等配置信息
├── docker-compose-sqlite.yml
├── docker-compose.yml          # docker compose 运行文件
├── Dockerfile                  # 用与构建容器镜像文件
├── LICENSE
├── loadjson                  # 默认的菜单，权限，字段配置
├── locale                    # 国际化配置，支持中文和英语
├── logs                      # 运行日志
├── manage.py
├── message                   # websocket 消息
├── notifications             # 站内信，消息通知推送应用
├── README.md
├── requirements.txt          # Django 运行依赖
├── server                    # 项目主应用
├── settings                  # 项目相关配置应用
└── system                    # 系统应用，包含用户，菜单，日志，角色等

```

## 项目配置文件```config.py```

```shell

# debug为false的时候，如果遇到静态文件无法访问，比如api文档无法正常打开，需要通过下面命令收集静态文件
# python manage.py collectstatic

DEBUG = False

ALLOWED_HOSTS = ["*"]

# SECURITY WARNING: keep the secret key used in production secret!
# 加密密钥 生产服必须保证唯一性，你必须保证这个值的安全，否则攻击者可以用它来生成自己的签名值
# $ cat /dev/urandom | tr -dc A-Za-z0-9 | head -c 49;echo
SECRET_KEY = 'django-insecure-mlq6(#a^2vk!1=7=xhp#$i=o5d%namfs=+b26$m#sh_2rco7j^'

### 更多数据库配置，参考官方文档：https://docs.djangoproject.com/zh-hans/5.0/ref/databases/

# # mysql 数据库配置
# # create database xadmin default character set utf8mb4 COLLATE utf8mb4_bin;
# # grant all on xadmin.* to server@'127.0.0.1' identified by 'KGzKjZpWBp4R4RSa';
DB_ENGINE = 'django.db.backends.mysql'
DB_HOST = 'mariadb'
DB_PORT = 3306
DB_USER = 'server'
DB_DATABASE = 'xadmin'
DB_PASSWORD = 'KGzKjZpWBp4R4RSa'
DB_OPTIONS = {'init_command': 'SET sql_mode="STRICT_TRANS_TABLES"', 'charset': 'utf8mb4', 'collation': 'utf8mb4_bin'}


# sqlite3 配置，和 mysql配置 二选一, 默认sqlite数据库
# DB_ENGINE = 'django.db.backends.sqlite3'

# 缓存配置
REDIS_HOST = "redis"
REDIS_PORT = 6379
REDIS_PASSWORD = "nineven"

# 需要将创建的应用写到里面
XADMIN_APPS = []

# 速率限制配置
DEFAULT_THROTTLE_RATES = {}

# redis key，建议开发的时候，配置到自己的app里面
CACHE_KEY_TEMPLATE = {}

# 定时任务
CELERY_BEAT_SCHEDULE = {}

# api服务监听端口，通过 python manage.py start all 命令启动时的监听端口
HTTP_LISTEN_PORT = 8896
GUNICORN_MAX_WORKER = 4 # API服务最多启动的worker数量
```

## client 整体目录结构

```shell
├── build
├── build.sh                            # 构建就脚本
├── commitlint.config.js
├── docker-compose.yml                  # docker compose 运行文件
├── Dockerfile                          # 用与构建容器镜像文件
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
├── stylelint.config.js
├── tailwind.config.ts
├── tsconfig.json
├── types
└── vite.config.ts

```

## 核心代码

前端需要悉知 RePlusSearch 和 RePlusPage 组件

后端common/core里面的相关代码
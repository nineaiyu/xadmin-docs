# 项目目录

## server 整体目录结构

```shell
├── captcha                     #图片验证码应用
├── common                      # 项目工具类库，包含各种封装方法
├── config.yml                   # 运行配置文件，包含数据库，Redis等配置信息
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

## 项目配置文件```config.yml```

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

## RePlusPage

### 使用了自封装的RePlusPage组件```src/components/RePlusPage/src/utils/types.ts```，参数如下

```ts
import type {
    PlusColumn,
    PlusDescriptionsProps,
    PlusSearchProps,
    RecordType
} from "plus-pro-components";
import type {
    PaginationProps,
    PureTableProps,
    TableColumnRenderer,
    TableColumns
} from "@pureadmin/table";
import type {BaseApi} from "@/api/base";
import type {formDialogOptions} from "./handle";
import type {OperationProps} from "@/components/RePlusPage";
import type {PureTableBarProps} from "@/components/RePureTableBar";
import type {VNode} from "vue";
import type {Mutable} from "@vueuse/core";
import type {SearchColumnsResult, SearchFieldsResult} from "@/api/types";

interface TableColumn {
    /** 是否隐藏 */
    hide?: boolean | CallableFunction;
    /** 自定义列的内容插槽 */
    slot?: string;
    /** 自定义表头的内容插槽 */
    headerSlot?: string;
    /** 多级表头，内部实现原理：嵌套 `el-table-column` */
    children?: Array<TableColumn>;
    /** 自定义单元格渲染器（`jsx`语法） */
    cellRenderer?: (data: TableColumnRenderer) => VNode | string;
    /** 自定义头部渲染器（`jsx`语法） */
    headerRenderer?: (data: TableColumnRenderer) => VNode | string;
}

interface PageColumn extends PlusColumn, TableColumn {
    // columns: Partial<Mutable<TableColumn> & { _column: object }>[]
    _column: Partial<
        Mutable<SearchFieldsResult["data"][0]> &
        Mutable<SearchColumnsResult["data"][0]>
    >;
}

interface PageColumnList extends TableColumns {
    prop?: string;
    _column: Partial<
        Mutable<SearchFieldsResult["data"][0]> &
        Mutable<SearchColumnsResult["data"][0]>
    >;
}

interface ApiAuthProps {
    list?: string | boolean | null | BaseApi["list"];
    importData?: string | boolean | null | BaseApi["importData"];
    exportData?: string | boolean | null | BaseApi["exportData"];
    create?: string | boolean | null | BaseApi["create"];
    destroy?: string | boolean | null | BaseApi["destroy"];
    update?: string | boolean | null | BaseApi["update"];
    retrieve?: string | boolean | null | BaseApi["retrieve"];
    partialUpdate?: string | boolean | null | BaseApi["partialUpdate"];
    fields?: string | boolean | null | BaseApi["fields"];
    batchDestroy?: string | boolean | null | BaseApi["batchDestroy"];
}

interface RePlusPageProps {
    api: Partial<BaseApi>;
    title?: string;
    auth: Partial<ApiAuthProps>;
    /**
     * 是否有多选框， 一般为第一列
     */
    selection?: boolean;
    /**
     * 加载组件是否同时加载数据
     */
    immediate?: boolean;
    /**
     * 是否有 操作列， 一般为最后一列
     */
    operation?: boolean;
    /**
     * 是否是 树 表格
     */
    isTree?: boolean;
    /**
     * 是否有 工具栏
     */
    tableBar?: boolean;
    /**
     * 国际化，对应 locales 中
     */
    localeName?: string;
    /**
     * PlusSearchProps， 参考文档：https://plus-pro-components.com/components/search.html#search-attributes
     */
    plusSearchProps?: Partial<PlusSearchProps>;
    /**
     * pureTableProps， 参考源码：https://github.com/pure-admin/pure-admin-table
     */
    pureTableProps?: Partial<PureTableProps>;
    /**
     * pureTableBarProps
     */
    pureTableBarProps?: Partial<PureTableBarProps>;
    /**
     * plusDescriptionsProps， 参考文档：https://plus-pro-components.com/components/descriptions.html
     */
    plusDescriptionsProps?: Partial<PlusDescriptionsProps>;
    /**
     * 对通过 request 获取的数据进行处理
     * @param data
     */
    searchResultFormat?: <T = RecordType[]>(data: T[]) => T[];
    /**
     * pure table 的 columns, 并返回
     * @param columns
     */
    listColumnsFormat?: (columns: PageColumnList[]) => PageColumnList[];
    /**
     * plus pro descriptions 的 columns, 并返回
     * @param columns
     */
    detailColumnsFormat?: (columns: PageColumn[]) => PageColumn[];
    /**
     * plus pro search 的 columns, 并返回
     * @param columns
     */
    searchColumnsFormat?: (columns: PageColumn[]) => PageColumn[];
    baseColumnsFormat?: ({
                             listColumns,
                             detailColumns,
                             searchColumns,
                             addOrEditRules,
                             addOrEditColumns,
                             searchDefaultValue,
                             addOrEditDefaultValue
                         }) => void;
    /**
     * 搜索之前进行一些修改
     * @param params
     */
    beforeSearchSubmit?: <T = RecordType>(params: T) => T;
    /**
     * 分页组件
     */
    pagination?: Partial<PaginationProps>;
    /**
     * 默认的添加，更新 方法
     */
    addOrEditOptions?: {
        title?: "";
        props?: Partial<formDialogOptions>;
        form?: undefined;
        apiReq?: (
            formOptions: Partial<formDialogOptions> & { formData: RecordType }
        ) => BaseApi | any;
    };
    /**
     * 操作栏 按钮组方法
     */
    operationButtonsProps?: Partial<OperationProps>;
    /**
     * 工具栏 按钮组方法
     */
    tableBarButtonsProps?: Partial<OperationProps>;
}

export type {ApiAuthProps, RePlusPageProps, PageColumn, PageColumnList};

```

后端common/core里面的相关代码
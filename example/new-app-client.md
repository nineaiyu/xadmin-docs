# 前端操作

## 本地开发运行，记得在`vite.config.ts` 添加proxy代理，要不然无法访问api服务

```ts
  proxy: {
    "/api": {
      target: "http://127.0.0.1:8896",
      changeOrigin: true,
      rewrite: path => path
    },
    "/media": {
      target: "http://127.0.0.1:8896",
      changeOrigin: true,
      rewrite: path => path
    },
    "/ws": {
      target: "ws://127.0.0.1:8896"
    },
    "/api-docs": {
      target: "http://127.0.0.1:8896",
      changeOrigin: true,
      rewrite: path => path
    }
  },
```

## 1.在 ```src/views/```目录下创建```demo```目录，目录结构如下

```shell
└── book
    └── index.vue
    └── utils
        ├── api.ts
        └── hook.tsx
```

## 2.```api.ts``` 内容如下，主要用于接口访问

```ts
import { BaseApi } from "@/api/base";

const bookApi = new BaseApi("/api/demo/book");
bookApi.update = bookApi.patch;
export { bookApi };

```

## 3. ```hook.tsx```内容如下

```tsx
import { bookApi } from "./api";
import {getCurrentInstance, reactive} from "vue";
import {getDefaultAuths} from "@/router/utils";

export function useDemoBook() {
    // 权限判断，用于判断是否有该权限
    const api = reactive(bookApi);
    const auth = reactive({
        ...getDefaultAuths(getCurrentInstance())
    });

    return {
        api,
        auth
    };
}

```

## 4.编写table页面```index.vue```

```vue
<script lang="ts" setup>
  import {RePlusPage} from "@/components/RePlusPage";
  import {useDemoBook} from "./utils/hook";

  defineOptions({
    name: "DemoBook" // 必须定义，用于菜单自动匹配组件
  });
  const {api, auth} = useDemoBook();
</script>
<template>
  <RePlusPage :api="api" :auth="auth" locale-name="demoBook"/>
</template>

```

# 合并写法-如果业务比较简单，可以把上面的2，3，4步代码合并为一个文件里面```index.vue```
```vue
<script lang="ts" setup>
  import {RePlusPage} from "@/components/RePlusPage";
  import {getDefaultAuths} from "@/router/utils";
  import {getCurrentInstance, reactive} from "vue";
import { BaseApi } from "@/api/base";

  defineOptions({
    name: "DemoBook" // 必须定义，用于菜单自动匹配组件
  });
const bookApi = new BaseApi("/api/demo/book");

// 权限判断，用于判断是否有该权限
const auth = reactive({
  ...getDefaultAuths(getCurrentInstance())
});
</script>
<template>
  <RePlusPage :api="bookApi" :auth="auth" locale-name="demoBook"/>
</template>

```

## 5.添加中英字段名称【可选操作，前端会自动获取后端的label】

```locales/zh-CN.yaml```

```yaml
demoBook:
  book: 书籍
  name: 书籍名称
  isbn: ISBN书号
  author: 作者
  publisher: 出版社
  publication_date: 出版日期
  price: 售价
  is_active: 是否启用
```

```locales/en.yaml```

```yaml
demoBook:
  book: Book
  name: Name
  isbn: ISBN
  author: Author
  publisher: Publisher
  publication_date: Publication date
  price: Price
  is_active: Active
```

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
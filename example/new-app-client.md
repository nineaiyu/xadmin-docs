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
    ├── index.vue
    └── utils
        ├── api.ts
        └── hook.tsx
```

## 2.```api.ts``` 内容如下，主要用于接口访问

```ts
import { BaseApi } from "@/api/base";

const bookApi = new BaseApi("/api/demo/book");
bookApi.update = bookApi.patch;
export {bookApi};

```

## 3. ```hook.tsx```内容如下

```tsx
import dayjs from "dayjs";
import {useI18n} from "vue-i18n";
import {bookApi} from "./api";
import {hasAuth} from "@/router/utils";
import {reactive, ref, type Ref, shallowRef} from "vue";
import {renderOption, renderSwitch} from "@/views/system/render";

export function useDemoBook(tableRef: Ref) {
    const {t} = useI18n();

    const api = reactive(bookApi);

    // 权限判断，用于判断是否有该权限
    const auth = reactive({
        list: hasAuth("list:demoBook"),
        create: hasAuth("create:demoBook"),
        delete: hasAuth("delete:demoBook"),
        update: hasAuth("update:demoBook"),
        export: hasAuth("export:demoBook"),
        import: hasAuth("import:demoBook"),
        batchDelete: hasAuth("batchDelete:demoBook")
    });

    // 新增或更新的form表单
    const editForm = shallowRef({
        title: t("demoBook.book"),
        formProps: {
            rules: {
                name: [
                    {
                        required: true,
                        message: t("demoBook.name"),
                        trigger: "blur"
                    }
                ]
            }
        },
        row: {
            is_active: row => {
                return row?.is_active ?? true;
            }
        },
        columns: () => {
            return [
                {
                    prop: "name",
                    valueType: "input"
                },
                {
                    prop: "isbn",
                    valueType: "input"
                },
                {
                    prop: "author",
                    valueType: "input"
                },
                {
                    prop: "publisher",
                    valueType: "input"
                },
                {
                    prop: "price",
                    valueType: "input-number"
                },
                {
                    prop: "publication_date",
                    valueType: "date-picker"
                },
                {
                    prop: "is_active",
                    valueType: "radio",
                    renderField: renderOption()
                },
                {
                    prop: "description",
                    valueType: "textarea"
                }
            ];
        }
    });
    //用于前端table字段展示，前两个，selection是固定的，用与控制多选
    const columns = ref<TableColumnList>([
        {
            type: "selection",
            fixed: "left",
            reserveSelection: true
        },
        {
            prop: "pk",
            minWidth: 100
        },
        {
            prop: "name",
            minWidth: 120,
            cellRenderer: ({row}) => <span v-copy={row.name}>{row.name}</span>
        },
        {
            prop: "isbn",
            minWidth: 150,
            cellRenderer: ({row}) => <span v-copy={row.isbn}>{row.isbn}</span>
        },
        {
            prop: "is_active",
            minWidth: 130,
            cellRenderer: renderSwitch(auth.update, tableRef, "is_active", scope => {
                return scope.row.name;
            })
        },
        {
            prop: "author",
            minWidth: 150
        },
        {
            prop: "publisher",
            minWidth: 150
        },
        {
            prop: "author",
            minWidth: 150
        },
        {
            prop: "price",
            minWidth: 150
        },
        {
            minWidth: 180,
            prop: "publication_date",
            formatter: ({publication_date}) =>
                dayjs(publication_date).format("YYYY-MM-DD HH:mm:ss")
        },
        {
            minWidth: 180,
            prop: "created_time",
            formatter: ({created_time}) =>
                dayjs(created_time).format("YYYY-MM-DD HH:mm:ss")
        },
        {
            fixed: "right",
            width: 160,
            slot: "operation",
            hide: !(auth.update || auth.delete)
        }
    ]);

    return {
        t,
        api,
        auth,
        columns,
        editForm
    };
}
```

## 4.编写table页面```index.vue```

```vue
<script lang="ts" setup>
  import { ref } from "vue";
  import { useDemoBook } from "./utils/hook";
  import ReBaseTable from "@/components/ReBaseTable";

  defineOptions({
    name: "DemoBook"
  });

  const tableRef = ref();

  const { api, auth, columns, editForm } = useDemoBook(tableRef);
</script>

<template>
  <ReBaseTable
      ref="tableRef"
      :api="api"
      :auth="auth"
      :edit-form="editForm"
      :table-columns="columns"
      locale-name="demoBook"
  />
</template>
```

## 5.添加中英字段名称

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
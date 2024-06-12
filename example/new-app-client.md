# 前端操作

### 1.在 ```src/views/```目录下创建```demo```目录，目录结构如下
```shell
└── book
    ├── form.vue
    ├── index.vue
    └── utils
        ├── api.ts
        ├── hook.tsx
        └── types.ts
```

### 2.```api.ts``` 内容如下，主要用于接口访问
```ts
import { BaseApi } from "@/api/base";
export const bookApi = new BaseApi("/api/demo/book");
```
### 3. ```hook.tsx```内容如下
```tsx
import dayjs from "dayjs";
import Form from "../form.vue";
import { useI18n } from "vue-i18n";
import { bookApi } from "./api";
import { hasAuth } from "@/router/utils";
import type { PlusColumn } from "plus-pro-components";
import { reactive, ref, type Ref, shallowRef } from "vue";
import { formatFormColumns } from "@/views/system/hooks";
import { renderOption, renderSwitch } from "@/views/system/render";

export function useDemoBook(tableRef: Ref) {
  const { t } = useI18n();

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
    form: Form,
    row: {
      is_active: row => {
        return row?.is_active ?? true;
      }
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
      cellRenderer: ({ row }) => <span v-copy={row.name}>{row.name}</span>
    },
    {
      prop: "isbn",
      minWidth: 150,
      cellRenderer: ({ row }) => <span v-copy={row.isbn}>{row.isbn}</span>
    },
    {
      prop: "is_active",
      minWidth: 130,
      cellRenderer: renderSwitch(auth.update, tableRef, "is_active", scope => {
        return scope.row.key;
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
      formatter: ({ publication_date }) =>
        dayjs(publication_date).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      minWidth: 180,
      prop: "created_time",
      formatter: ({ created_time }) =>
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

export function useDemoBookForm(props) {
  const { t, te } = useI18n();
  //用于新增和更新的form表单字段配置
  const columns: PlusColumn[] = [
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
  // 自动格式化字段名称
  formatFormColumns(props, columns, t, te, "demoBook");
  return {
    t,
    columns
  };
}


```
### 4. ```types.ts``` 
```ts
interface FormItemProps {}

interface FormProps {
    formInline: FormItemProps;
    showColumns: any[];
    isAdd?: boolean;
}

export type { FormItemProps, FormProps };
```
### 5.编写新增更新的form页面```form.vue```
```vue
<script lang="ts" setup>
  import { ref } from "vue";
  import { FormProps } from "./utils/types";
  import { useDemoBookForm } from "./utils/hook";

  const props = withDefaults(defineProps<FormProps>(), {
    isAdd: () => true,
    showColumns: () => [],
    formInline: () => ({})
  });

  const formRef = ref();
  const { columns } = useDemoBookForm(props);
  const newFormInline = ref(props.formInline);

  function getRef() {
    return formRef.value?.formInstance;
  }

  defineExpose({ getRef });
</script>

<template>
  <PlusForm
      ref="formRef"
      v-model="newFormInline"
      :columns="columns"
      :hasFooter="false"
      :row-props="{ gutter: 24 }"
      label-position="right"
      label-width="120px"
  />
</template>

```

### 6.编写table页面```index.vue```
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
### 7.添加中英字段名称 
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
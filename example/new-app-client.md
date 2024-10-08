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
import { reactive } from "vue";
import { hasAuth } from "@/router/utils";

export function useDemoBook() {
    const api = reactive(bookApi);
    // 权限判断，用于判断是否有该权限，下面权限定义要和菜单中的权限保持一致
    const auth = reactive({
        list: hasAuth("list:demoBook"),
        create: hasAuth("create:demoBook"),
        delete: hasAuth("delete:demoBook"),
        update: hasAuth("update:demoBook"),
        export: hasAuth("export:demoBook"),
        import: hasAuth("import:demoBook"),
        batchDelete: hasAuth("batchDelete:demoBook")
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
import { reactive } from "vue";
import { hasAuth } from "@/router/utils";

import { BaseApi } from "@/api/base";

const bookApi = new BaseApi("/api/demo/book");
bookApi.update = bookApi.patch;

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
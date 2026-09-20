# 前端操作

> **教程定位**：手写理解版（逐层拆解"为什么这么写"）。**快速上手优先走生成器主线**：
> [《30 分钟：开发第一个业务模块》](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/guide/first-module-30min.md)；
> 权威文档索引见[二次开发文档地图](/guide/index#二次开发文档地图)（组件手册 / 扩展流程 / 选型对比）。
> 本文创建的前端三件套与生成器产物同源，可对照修改。
>
> 注：本文示例对应的仓库自带 demo app（Book）为**官方示例**（与框架同步演进）；
> 新项目请以《30 分钟》的生成器（`generate_crud`）产物为准（图标统一走 `~icons/` 离线集）。

## 本地开发运行

`vite.config.ts` **已内置默认代理**（`/api`、`/media`、`/api-docs` → `http://127.0.0.1:8896`，`/ws` → `ws://127.0.0.1:8896`），后端按默认端口启动即可直接联调，**无需手工修改配置**（后端不在 8896 时，用环境变量 `E2E_API_PORT` 覆盖代理目标；详见 xadmin-client 仓库 README）。

如需自定义代理，改 `createProxyConfig` 的入参即可：

```shell
      proxy: createProxyConfig({
        "http://127.0.0.1:8896": ["/api", "/media", "/api-docs"],
        "ws://127.0.0.1:8896": ["/ws"]
      }),
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
import type {BaseResult} from "@/api/types";

class BookApi extends BaseApi {
    push = (pk: number | string) => {
        return this.request<BaseResult>(
            "post",
            {},
            {},
            `${this.baseApi}/${pk}/push`
        );
    };
}

const bookApi = new BookApi("/api/demo/book");
export { bookApi };

```

## 3. ```hook.tsx```内容如下

```tsx
import { bookApi } from "./api";
import {getCurrentInstance, h, reactive, type Ref, shallowRef} from "vue";
import {getDefaultAuths} from "@/router/utils";
import type {
    OperationProps,
    PageColumn,
    PageTableColumn,
    RePlusPageProps
} from "@/components/RePlusPage";
import {useRenderIcon} from "@/components/ReIcon/src/hooks";
import CircleClose from "~icons/ep/circle-close";
import {handleOperation} from "@/components/RePlusPage";
import {useI18n} from "vue-i18n";
import Success from "~icons/ep/success-filled";
import {message} from "@/utils/message";
import {ElTag} from "element-plus";

export function useDemoBook(tableRef: Ref) {
    // 权限判断，用于判断是否有该权限
    const api = reactive(bookApi);
    const auth = reactive({
        push: false,
        ...getDefaultAuths(getCurrentInstance(), ["push"])
    });
    const {t} = useI18n();

    /**
     * 添加一个推送书籍的自定义操作按钮，用于控制书籍推送
     */
    const operationButtonsProps = shallowRef<OperationProps>({
        width: 300,
        showNumber: 4,
        buttons: [
            {
                text: t("demoBook.pushBook"),
                code: "push",
                confirm: {
                    title: row => {
                        return t("demoBook.confirmPushBook", {name: row.name});
                    }
                },
                props: {
                    type: "success",
                    icon: useRenderIcon(CircleClose),
                    link: true
                },
                onClick: ({row, loading}) => {
                    loading.value = true;
                    handleOperation({
                        t,
                        apiReq: api.push(row?.pk ?? row?.id),
                        success() {
                            tableRef.value.handleGetData();
                        },
                        requestEnd() {
                            loading.value = false;
                        }
                    });
                },
                show: auth.push && 6
            }
        ]
    });

    /**
     * 新增表格标题栏按钮
     */
    const tableBarButtonsProps = shallowRef<OperationProps>({
        buttons: [
            {
                text: "全部推送",
                code: "batchPush",
                props: {
                    type: "success",
                    icon: useRenderIcon(Success),
                    plain: true
                },
                onClick: () => {
                    // 这里写处理逻辑
                    message("操作成功");
                },
                confirm: {
                    title: "确定操作？"
                },
                show: auth.push
            }
        ]
    });

    /**
     * 自定义新增或编辑
     */
    const addOrEditOptions = shallowRef<RePlusPageProps["addOrEditOptions"]>({
        props: {
            columns: {
                /**
                 * 重写 publisher 组件，可参考 https://plus-pro-components.com/components/config.html
                 * @param column
                 */
                publisher: ({column}) => {
                    column.valueType = "autocomplete";
                    column["fieldProps"]["fetchSuggestions"] = (
                        queryString: string,
                        cb: any
                    ) => {
                        const queryList = [
                            {value: "人民出版社"},
                            {value: "中华书局"},
                            {value: "科学出版社"}
                        ];

                        let results = [];
                        results = queryString
                            ? queryList.filter(
                                item =>
                                    item.value
                                        .toLowerCase()
                                        .indexOf(queryString.toLowerCase()) === 0
                            )
                            : queryList;
                        cb(results);
                    };
                    return column;
                }
            }
        }
    });

    /**
     * 自定义搜索
     * @param columns
     */
    const searchColumnsFormat = (columns: PageColumn[]) => {
        columns.forEach(column => {
            switch (column._column?.key) {
                case "publisher":
                    /**
                     * 重写 publisher 组件，可参考 https://plus-pro-components.com/components/config.html
                     */
                    column.valueType = "autocomplete";
                    column["fieldProps"]["fetchSuggestions"] = (
                        queryString: string,
                        cb: any
                    ) => {
                        const queryList = [
                            {value: "人民出版社"},
                            {value: "中华书局"},
                            {value: "科学出版社"}
                        ];

                        let results = [];
                        results = queryString
                            ? queryList.filter(
                                item =>
                                    item.value
                                        .toLowerCase()
                                        .indexOf(queryString.toLowerCase()) === 0
                            )
                            : queryList;
                        cb(results);
                    };
                    break;
            }
        });
        return columns;
    };
    /**
     * 表格列操作
     * @param columns
     */
    const listColumnsFormat = (columns: PageTableColumn[]) => {
        columns.forEach(column => {
            switch (column._column?.key) {
                case "category":
                    column["cellRenderer"] = ({row}) => {
                        return h(ElTag, {type: "success"}, () => row.category.label);
                    };
                    break;
            }
        });
        return columns;
    };

    return {
        api,
        auth,
        addOrEditOptions,
        listColumnsFormat,
        searchColumnsFormat,
        tableBarButtonsProps,
        operationButtonsProps
    };
}

```

## 4.编写table页面```index.vue```

```vue
<script lang="ts" setup>
  import {RePlusPage} from "@/components/RePlusPage";
  import {useDemoBook} from "./utils/hook";
  import {ref} from "vue";

  defineOptions({
    name: "DemoBook" // 必须定义，用于菜单自动匹配组件
  });
  const tableRef = ref();
  const {
    api,
    auth,
    addOrEditOptions,
    listColumnsFormat,
    searchColumnsFormat,
    tableBarButtonsProps,
    operationButtonsProps
  } = useDemoBook(tableRef);
</script>
<template>
  <RePlusPage
      ref="tableRef"
      :api="api"
      :auth="auth"
      locale-name="demoBook"
      :search-columns-format="searchColumnsFormat"
      :add-or-edit-options="addOrEditOptions"
      :list-columns-format="listColumnsFormat"
      :tableBarButtonsProps="tableBarButtonsProps"
      :operationButtonsProps="operationButtonsProps"
  />
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
  pushBook: 推送书籍
  confirmPushBook: 确定将该书籍 {name} 推送到推荐服务？
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
  pushBook: Push book
  confirmPushBook: Are you sure to push {name} book?
```
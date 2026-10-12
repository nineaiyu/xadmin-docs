# 页面容器与数据展示

列表页与内容页的骨架、状态容器与常用展示组件。示例取自仓库内真实页面。

## RePlusPage：元数据驱动列表页

xadmin 的列表页统一由「后端下发的字段元数据 + `RePlusPage`」渲染：搜索区、表格列、工具栏按钮
均由元数据装配，页面只保留业务侧的格式化与操作逻辑。页面薄壳 + `utils/hook.tsx` 是标准形态：

```vue
<script lang="ts" setup>
import { useApiApplication } from "./utils/hook";

defineOptions({ name: "IntegrationApiApp" });

const tableRef = ref();
const {
  api,
  auth,
  listColumnsFormat,
  operationButtonsProps,
  tableBarButtonsProps
} = useApiApplication(tableRef);
</script>

<template>
  <RePlusPage
    ref="tableRef"
    :api="api"
    :auth="auth"
    locale-name="apiApp"
    :selection="false"
    :listColumnsFormat="listColumnsFormat"
    :operationButtonsProps="operationButtonsProps"
    :tableBarButtonsProps="tableBarButtonsProps"
  />
</template>
```

要点：

- `api`：列表/删除等接口集合（由 `usePlusPage` 家族 hook 装配，路径与后端 ViewSet 对齐）；
- `auth`：权限点（`list` / `create` / `update` / `destroy` / `batchDestroy`…）决定工具栏与行操作按钮的显隐；
- `listColumnsFormat`：列格式化（标签渲染、状态色、格式化函数）；
- `operationButtonsProps` / `tableBarButtonsProps`：行内与工具栏自定义按钮（含显隐与权重）；
- 内建能力：搜索区（含高级筛选、我的视图）、分页、行选择、列设置、密度、导出/导入、
  回收站（删除走软删的页面自动出现）、变更历史弹窗。

## RePage：通用内容骨架

非列表页（详情页、仪表盘、设置类）的统一骨架：页头（标题/描述/右侧操作）+ 内容区 + 页脚。

```vue
<RePage title="关于系统" description="版本与运行环境">
  <el-card>…</el-card>
</RePage>
```

- `autoContentHeight`：内容区自管滚动（配合 `heightOffset` 扣减头部高度）；
- `footerFixed`：页脚固定在容器底部。

## ReStateContainer：loading / empty / error / ready 四态

把页面的四种状态收敛到一处渲染，内部统一消费 `ReSkeleton` / `ReEmpty` / `el-alert`。

```vue
<ReStateContainer
  :state="loading ? 'loading' : 'empty'"
  loading-variant="spinner"
  :empty-hint="t('apiApp.usage.empty')"
  :min-height="180"
/>
```

- `loadingVariant`：`skeleton`（默认，骨架屏）/ `spinner`（转圈 + `loadingText`）；
- `minLoadingTime`：加载占位延迟展示窗口（默认 50ms）——数据在窗口内就绪时不渲染 loading 占位，
  避免快速请求的瞬时闪现；`0` 表示立即展示；
- `minHeight`：多态切换时保持占位高度，避免跳动；
- 各态可经同名插槽（`#loading` / `#empty` / `#error`）整体替换，`ready` 走默认插槽。

## ReResult：居中式结果态

提交成功、无权限、模块停用等「结果页」场景：

```vue
<ReResult status="403" title="无权限" sub-title="请联系管理员开通">
  <template #extra><el-button @click="goHome">返回首页</el-button></template>
</ReResult>
```

`status` 支持 `success` / `info` / `warning` / `error` / `403` / `404` / `500` / `coming-soon` / `offline`；
插槽：`#icon` / `#title` / `#subTitle` / `#extra` 与默认内容区。

## ReTableAction：操作列

供非 `RePlusPage` 表格（自定义表格、抽屉内表格）使用的操作列组件：

```vue
<ReTableAction
  :actions="rowActions"
  :dropdown-actions="moreActions"
  :auth="auth"
  more-text="更多"
/>
```

操作项支持 `danger`（危险色）、`icon`、`ifShow`（显隐）、`popConfirm`（行内二次确认）；
图标按钮自动按 `tooltip` / 文本补可访问名。

## ReReadonlyTable：只读表格

详情弹窗、预览面板里展示数组数据，避免手写 `el-table` 列：

```vue
<ReReadonlyTable :columns="columns" :rows="rows" :loading="loading" label="调用明细" />
```

## RePureTableBar：表格工具栏

`RePlusPage` 内部使用，也可独立接入自绘表格：列设置、密度、全屏、刷新与自定义按钮组。

## ReJsonViewer：JSON 查看器

配置预览、AI 动作入参出参、审计详情等结构化数据的展开查看（基于 `vue-json-pretty` 懒加载）：

```vue
<ReJsonViewer :value="payload" :expand-depth="2" copyable />
```

- `expandDepth`：初始展开层级；`copyable`：复制按钮；`boxed`：带边框背景；
- 事件 `copied`，其余（`toggle` / `click` 等）经 `$attrs` 透传；
- 大整数场景请在传入前自行序列化处理。

## ReText：省略文本

单/多行省略 + 悬浮提示（仅截断时提示），可选点击展开：

```vue
<ReText :line-clamp="2" expand>很长的描述文本…</ReText>
```

## ReCountTo：数字滚动

```vue
<ReNormalCountTo :end-val="1234.5" :decimals="1" :duration="1200" separator="," />
```

支持 `started` / `finished` 事件、`prefix` / `suffix` 插槽与 `transition` 缓动预设。

## ReSplitPane：分栏

桌面上常见的「左树右表」分栏，宽度比例受控并支持持久化：

```vue
<ReSplitPane v-model:percent="percent" @drag-end="saveConfig">
  <template #left>…</template>
  <template #right>…</template>
</ReSplitPane>
```

事件：`update:percent`（拖拽中实时）/ `resize` / `drag-end`（落盘时机）/ `reset`。

## 布局与图标

- `ReIcon`：离线图标渲染入口（`useRenderIcon`），图标集按需懒加载、不回退在线请求；
  菜单图标选择器 `Select.vue` 亦基于它；
- `ReAuth`：按权限点渲染插槽内容（`<ReAuth :value="['create:SystemUser']">…</ReAuth>`）；
- `ReCol`：`el-col` 的短写；
- `ReResize`：绝对定位拖拽缩放盒（自由定位编辑场景使用）。

## 四期新增：ReScrollbar / ReRenderContent

两个通用件（在库待用，接入场景成熟时按需引入）：

- `ReScrollbar`：增强滚动条（底层仍是 `el-scrollbar`）——派发四向到达态 `scroll-at`
  （top / bottom / left / right），供「滚动到底加载更多」「新消息提示」等逻辑消费；
  未到边界的一侧显示渐变遮罩（`shadow`，默认开）；暴露 `scrollTo` / `setScrollTop` /
  `updateArrival`。滚动容器带 `role="region"` 与 `tabindex="0"`（方向键 / `PageUp` /
  `PageDown` 可滚动），可访问名经 `label` 传入：

  ```vue
  <ReScrollbar label="消息列表" shadow @scroll-at="onArrival">
    <MessageList />
  </ReScrollbar>
  ```

  接入条件：需要「滚动到底加载更多」或遮罩提示的列表（通知中心 / 聊天 / 抽屉）。

- `ReRenderContent`：把字符串 / 数字按**纯文本**渲染（不解析 HTML，无 XSS 面），
  组件与 VNode 交给 `h()`，`renderBr` 可按换行拆段——适合「后端返回文案片段但需要
  安全渲染」的场景。

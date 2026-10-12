# 表单、输入与弹层

表单类组件围绕「后端元数据 / 实体接口」取数，弹层统一走 `ReDialog` / `ReDrawer` 的
「内容组件 + 收尾契约」模式。

## SearchPicker：实体搜索选择器

面向项目内实体（用户 / 部门 / 角色 / 岗位 / 菜单）的弹窗式搜索选择，字段元数据与权限点
由 `entity` 预设决定：

```vue
<SearchPicker
  :entity="'user'"
  :modelValue="form.data"
  @change="data => (form.data = data)"
/>
```

- `entity`：实体预设（决定接口、权限码、列渲染）；
- `multiple`：多选（默认 `true`）；
- `v-model` + `change` 事件（载荷为该实体的行数据）。

## ReApiSelect / ReApiTreeSelect：通用远程下拉

把「接口 → 选项」的取数逻辑收敛为一个组合函数（缓存 / 参数变更重取 / 结果归一），
适用于非实体的业务远程下拉（如「审批流程」「数据集」等）：

```vue
<ReApiSelect
  v-model="form.flow"
  :api="flowApi.list"
  :params="{ limit: 1000 }"
  label-field="name"
  value-field="pk"
  @change="onFlowChange"
/>
```

- 常用 props：`api` / `params` / `labelField` / `valueField` / `childrenField`（树形）/ `resultField` /
  `immediate` / `alwaysLoad`（缓存策略）/ `numberToString` / `beforeFetch` / `afterFetch` / `autoSelect`；
- 经 `expose` 提供 `getOptions` / `getValue` / `reload` / `updateParam`（适合父组件在提交前取全量值）；
- 树形场景使用 `ReApiTreeSelect`（同参数面，`childrenField` 生效）。

## 人机校验

| 组件 | 场景 | 要点 |
| --- | --- | --- |
| `ReSliderCaptcha` | 拖动滑块通过 | `v-model` 布尔；`isSlot` 交外部（服务端）校验；`resume()` 复位；键盘可达（方向键步进、`Home` / `End` 直达） |
| `ReSliderRotateCaptcha` | 旋转图片对位 | 复用 `ReSliderCaptcha`，按角度容差判定（在库待用） |
| `ReSliderTranslateCaptcha` | 拼图缺口对位 | 复用 `ReSliderCaptcha`，按位移容差判定（在库待用） |
| `ReImageVerify` | 登录页点选式验证码 | 配合登录接口的 `verify_token` 校验 |
| `ReSendVerifyCode` | 发送短信/邮件验证码 | `category` 区分业务场景；`v-model` 绑定表单；事件 `configReqSuccess` / `sendCodeReqSuccess` / `configReqEnd` |

```vue
<ReSliderCaptcha v-model="captchaPassed" @success="onSliderPass" />
```

## 上传与裁剪

- `RePictureUpload`：头像/图片上传（props：`imgSrc` / `type` / `quality` / `circled` / `options` /
  `canvasOption`），裁剪结果经 `cropper` 事件回传；
- `ReCropper`：独立裁剪器，`cropper` 事件回传 `getCroppedCanvas` 结果。

## ReMfaConfirm：MFA 二次确认

敏感操作前的动态码校验：

```vue
<ReMfaConfirm :confirm-type="'reset_password'" @success="submit" />
```

## 弹层：ReDialog / ReDrawer

弹层以「函数式打开 + 内容组件」为约定，页面侧配置 `options`，交互与收尾（`beforeSure`）在
调用处定义：

```ts
import { addDialog } from "@/components/ReDialog";
import { h, ref } from "vue";
import UserForm from "./components/UserForm.vue";

const formRef = ref();
addDialog({
  title: "新增用户",
  width: "600px",
  draggable: true,
  destroyOnClose: true,
  sureBtnLoading: true,
  contentRenderer: () => h(UserForm, { ref: formRef }),
  beforeSure: async done => {
    const payload = await formRef.value?.getPayload(); // 校验失败返回 null
    if (!payload) return;
    await api.create(payload);
    done(); // 真正关闭；刷新放在 done 之后
  }
});
```

要点：

- **收尾契约**：`beforeSure(done, { options, index, closeLoading })` —— 不调用 `done` 则弹层保持打开，
  适合「校验 → 提交 → 刷新」串行流程；API 异常请归一后自行提示（避免 loading 悬挂）；
- `destroyOnClose`：关闭即销毁内容组件（表单场景建议开启）；
- `hideFooter` / `footerButtons` / `footerRenderer`：页脚定制；默认页脚为「取消 / 保存」；
- 关闭行为：`closeOnPressEscape` 默认开启，关闭后焦点归还触发元素；
- `ReDrawer` 的 API 与 `ReDialog` 同形（`addDrawer` / `DrawerOptions`），用于右侧抽屉形态；
  `ReNavDrawer` 用于导航类抽屉（`narrow` / `width`）。

## 实体管理抽屉：ReActionPanel

集成类页面（开放平台应用、AI 档案、知识库…）的「行内管理」抽屉骨架：
资料卡 + 动作分组，动作由调用方以 `data-action-code` 输出，便于测试与埋点：

```ts
const options: DrawerOptions = {
  title: "应用管理",
  width: "480px",
  draggable: true,
  destroyOnClose: true,
  contentRenderer: () => h(ReActionPanel, { metaItems, groups })
};
addDrawer(options);
```

抽屉内动作遵循「先收起抽屉、再打开二级弹层」的交互约定（结果需要内嵌展示的除外）。

## RePermissionPreview：权限预览

以只读面板展示「角色 / 用户」的最终权限收敛结果，用于授权核对。

## 四期新增：参数折叠、图标选择与回顶

三个交互件（在库待用）：

- `ReCollapseParams`：三列（名称 / 值 / 说明）参数编辑面板，默认只展示前 N 行
  （`visibleCount`），其余折叠；展开按钮带 `aria-expanded` / `aria-controls`，
  窄屏自动改纵向堆叠；控件按 `option.type` 分派（`select` / `number` / 文本）：

  ```vue
  <ReCollapseParams
    v-model:value="params"
    :params="schema"
    :visible-count="3"
    @update:value="onParamChange"
  />
  ```

- `ReIconPicker`：图标选择器（薄封装 `ReIcon` 的离线选择器）——触发器与图标网格项均为
  原生 `button`（键盘可聚焦与选择），切图标集页签触发同源 chunk 懒加载，零在线请求：

  ```vue
  <ReIconPicker v-model="form.icon" />
  ```

- `ReBackTop`：回到顶部——默认目标为本项目布局内容区滚动容器（无需重复填写
  `target`），以原生 `button` 实现（可聚焦，`Enter` / `Space` 原生触发），
  可访问名取 `title` 或内置文案：

  ```vue
  <ReBackTop :visibility-height="300" right="24" bottom="24" />
  ```

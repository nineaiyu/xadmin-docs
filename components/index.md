# 组件库总览

xadmin 前端（`xadmin-client`）的通用能力沉淀在 `src/components/` 下，以 `Re` 前缀的组件为主体：
列表页由 `RePlusPage` 元数据生态承担，状态、展示、表单、弹层等通用能力按需引入；
AI 与聊天域另有一组展示组件，由聊天室与 AI 控制台两条业务线共用。

本组页面按「页面容器 → 表单与交互 → 消息域」组织，示例取自仓库内真实用法。

## 使用约定

- **按需引入**：从组件 barrel 入口引入，不要指向组件内部文件：

  ```ts
  import { ReResult } from "@/components/ReResult";
  ```

- **全局注册仅列表框架**：只有 `RePlusPage` 在 `main.ts` 中异步全局注册（列表页高频使用），
  其余组件一律按需 `import`，避免首屏闭包膨胀（`pnpm check:bundle-size` 门禁守护）。
- **文案走 i18n**：组件内文案统一 `t()`，中英词条成对补充（`pnpm check:i18n` 门禁）。
- **样式消费设计令牌**：颜色 / 间距 / 圆角 / 时长一律引用 CSS 变量（`--bg-card`、`--space-*`、
  `--radius-*`、`--duration-*` 等），禁止裸 hex 与裸 px 字号（`pnpm check:color-literals` /
  `check:font-size-literals` 门禁）。
- **新组件工程化结构**：`src/components/<Name>/`（实现 `src/index.vue|.tsx`、类型 `types.ts`、
  barrel `index.ts`（`withInstall` 包装）、单测 `__tests__/*.spec.ts`）；纯逻辑抽成纯函数单独测试。

## 分组总览

| 分组 | 组件 | 说明 |
| --- | --- | --- |
| 页面与容器 | `RePlusPage`、`RePlusSearch`、`RePage`、`ReSplitPane`、`ReReadonlyTable`、`RePureTableBar`、`ReScrollbar`、`ReBackTop` | 元数据驱动列表页、通用内容骨架、分栏、只读表格、表格工具栏、增强滚动条、回到顶部 |
| 状态与反馈 | `ReStateContainer`、`ReResult`、`ReEmpty`、`ReSkeleton`、`ReSegmented` | 四态收敛容器、结果态、空态、骨架屏、分段控件 |
| 数据展示 | `ReCountTo`、`ReText`、`ReJsonViewer`、`ReRenderContent`、`ReTableAction`、`ReActionPanel`、`RePermissionPreview` | 数字滚动、省略文本、JSON 查看器、文本安全渲染、操作列、实体管理抽屉、权限预览 |
| 表单与输入 | `SearchPicker`、`ReApiSelect` / `ReApiTreeSelect`、`ReSliderCaptcha`、`ReSliderRotateCaptcha`、`ReSliderTranslateCaptcha`、`ReImageVerify`、`ReSendVerifyCode`、`RePictureUpload`、`ReCropper`、`ReMfaConfirm`、`ReCollapseParams`、`ReIconPicker` | 实体搜索、远程下拉、人机校验（滑块 / 旋转 / 拼图）、图片上传与裁剪、MFA 确认、参数折叠、图标选择 |
| 弹层 | `ReDialog`、`ReDrawer`、`ReNavDrawer` | 对话框、抽屉（含内容组件 + refine 收尾契约） |
| 布局与图标 | `ReIcon`（离线图标 + `useRenderIcon`）、`ReCol`、`ReAuth`、`ReResize` | 离线图标渲染、栅格、权限门控、拖拽缩放盒 |
| AI 域 | `AiThinking`、`AiMessageBlock`、`AiStreamingBubble`、`AiActionCard`、`AiResultTable`、`ApiScopeEditor` | 思考过程、消息块、流式气泡、动作卡、结果表、范围编辑器 |
| 聊天域 | `ChatMessageList`、`ChatTextBubble`、`ChatSystemNotice`、`ChatMessageAvatar`、`MessageTimeDivider`、`NewMessagesBadge`、`MessageThreadPanel`、`MessageActionAttachments` | 消息流面板、气泡、系统通知、头像、时间分隔、新消息徽标、附件渲染 |

## 维护与延伸

- 组件工程化约定与分组清单：仓库内 `xadmin-client` 的 `src/components/README.md`
  （<a href="https://github.com/nineaiyu/xadmin-client/blob/dev/src/components/README.md" target="_blank" rel="noopener">GitHub</a>）
- 依赖 → 消费组件映射（用于依赖裁剪与升级评估）：
  `docs/component-dependencies.md`
  （<a href="https://github.com/nineaiyu/xadmin-client/blob/dev/docs/component-dependencies.md" target="_blank" rel="noopener">GitHub</a>）
- 前端开发指引见 [客户端开发](/devguidelines/client)。

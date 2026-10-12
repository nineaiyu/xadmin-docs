# AI 与聊天域组件

聊天室（消息中心）与 AI 控制台两条消息线共用同一套展示组件：组件不感知具体数据源，
差异只经 props / slots 注入（testid 前缀、名字行、空态口径等）。

## 流式回答与思考过程

`AiStreamingBubble` 是流式回答的展示形态（聊天室与助手页同形），`AiThinking` 承载思考过程：

```vue
<AiStreamingBubble
  testid="ai-streaming"
  stop-testid="ai-stream-stop"
  stop-label="停止生成"
  :reasoning="streamReasoning"
  :content="streamContent"
  @stop="abortStream"
/>
```

- `AiThinking`：流式期间自动展开并跟随滚动，结束后收起为「已思考 · N 字」摘要，点击可回看
  （历史消息的思考过程同样可折叠查看）；
- `AiMessageBlock`：思考面板 + 正文（流式光标 / 空态）+ 出处；有思考时不重复渲染等待动画。

## 动作执行：草稿 → 确认 → 结果

AI 生成的受限动作（如「提交请假」「新建审批」）遵循「用户二次确认后执行」的链路：
草稿卡、结果表与附件渲染各司其职。

```vue
<MessageActionAttachments
  :extra="message.extra"
  :runnable="canRunActions"
  :executor="executeAction"
  testid-prefix="chat"
  disabled-hint="没有执行权限"
/>
```

- `AiActionCard`：动作草稿的确认 / 取消 / 重试（审批拦截时转「重试」）/ 已执行状态机；
- `AiResultTable`：只读结果表，`columns/rows`、`series`、`results`、键值对象四种入参形态自动成表；
- `ApiScopeEditor`：开放平台「接口范围」勾选编辑器（AI 与开放平台页面共用）。

## 消息流面板与气泡

```vue
<MessageThreadPanel
  title="AI 助手"
  :is-narrow="isNarrow"
  :skeleton-visible="firstLoading"
  :has-more="hasMore"
  :loading-more="loadingMore"
  :empty-visible="emptyVisible"
  :pending-count="pendingCount"
  @load-more="loadMore"
  @jump-to-latest="scrollToLatest"
>
  <template #composer><ChatComposer /></template>
</MessageThreadPanel>
```

| 组件 | 职责 |
| --- | --- |
| `MessageThreadPanel` | 消息流面板骨架：标题 / 历史骨架 / 加载更早 / 空态 / 新消息徽标 / 输入区插槽 |
| `ChatMessageList` | 滚动容器 + 历史骨架 + 加载更早；滚动元素经 `ready` 回传给父级（用于定位/滚动控制） |
| `ChatTextBubble` / `ChatSystemNotice` | 普通消息气泡与系统通知样式 |
| `ChatMessageAvatar` | 消息头像（含昵称展示形态） |
| `MessageTimeDivider` | 时间分组分隔 |
| `NewMessagesBadge` | 「N 条新消息 · 回到底部」浮动提示 |
| `MessageThreadPanel` / `MessageActionAttachments` | 面板骨架与消息内嵌动作附件（见上） |

## 工程化约定

- 每个组件目录的 `types.ts` 是 props 的单一来源，barrel 再导出（`export * from "./types"`）；
- 消费端统一从 barrel 引入（`@/components/<Name>`）；
- 组件级单测与实现同目录（`__tests__/`），关键交互（流式展开、动作状态机、结果表入参形态）均有覆盖；
- 文案走 i18n；样式消费设计令牌，暗色与主题预设自动继承。

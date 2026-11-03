# 前端 UI 开发规范

> 适用于 [xadmin-client](https://github.com/nineaiyu/xadmin-client) 全部页面与组件。
> 设计令牌的唯一定义处在仓库
> [`src/style/tokens/`](https://github.com/nineaiyu/xadmin-client/tree/dev/src/style/tokens)，
> 本文是消费口径：**写新样式先查令牌表；令牌表没有的取值，先补令牌再使用，不直接写字面量**。

## 令牌总表

### 间距

4px 基准（`--space-1: 4px`，同时是 Tailwind `--spacing` 的值）。合法刻度只有这一组，
3/5/7/9/15/18/22px 等非刻度值一律禁止：

| 刻度 | 写法 | 典型用途 |
|------|------|----------|
| 2px | `--space-0-5` / `p-0.5` | 图标与文字的紧贴间隙 |
| 4px | `--space-1` / `p-1` | 紧凑元件内距 |
| 6px | `--space-1-5` / `p-1.5` | 标签、徽章内距 |
| 8px | `--space-2` / `p-2` | 控件内距、相邻元素间隙 |
| 10px | `--space-2-5` / `p-2.5` | 输入框垂直内距 |
| 12px | `--space-3` / `p-3` | 卡片小节间距 |
| 14px | `--space-3-5` / `p-3.5` | 面板内距 |
| 16px | `--space-4` / `p-4` | 默认内容间距 |
| 20px | `--space-5` / `p-5` | 卡片垂直内距（`--panel-pad-y`） |
| 24px | `--space-6` / `p-6` | 卡片水平内距（`--panel-pad-x`） |
| 32px | `--space-8` / `p-8` | 区块间隔 |
| 40px | `--space-10` / `p-10` | 页面级留白 |

模板里用 Tailwind 数值类（由 `--spacing=4px` 派生，天然合规）；SCSS 里用 `var(--space-*)` 变量。

### 定尺寸（width/height）

尺寸**没有统一刻度**——侧栏宽、画布、图标、头像、媒体容器的固定尺寸客观存在。口径是
「全量登记、只减不增」（`pnpm check:size-literals`），不是清零。扫描面同时覆盖
**prop 型尺寸**：`label-width="120px"`、`width="300px"`、静态 `style` 里的 width/height px
与 CSS 属性写法同罪，一样要登记。

已收口的组件尺寸令牌：

| 令牌 | 取值 | 用途 |
|------|------|------|
| `--avatar-size-md` | 36px | 会话行 / 消息气泡头像 |
| `--avatar-size-sm` | 32px | 联系人 / 成员 / 通知行头像 |
| `--tablebar-action-size` | 28px | 表格工具栏圆形热区 |
| `--setting-field-width-sm` / `-md` | 120px / 180px | 设置面板表单项控件宽度 |

头像消费方式：`el-avatar` **不要传 `:size` 数字**，挂全局类 `.avatar-md` / `.avatar-sm`
（覆写 EP 的 `--el-avatar-size`）。详情资料头的展示型头像（如 64px）属展示尺寸，
不入这两档，留在基线即可。

- 自动放行：≤2px（描边/发丝）、≥9999px（屏外技巧）、`var()` / `calc()` 计算值；
- 新增定尺寸按序选择：① 已有布局令牌（`--sidebar-width` / `--layout-header-h` /
  `--nav-item-icon-size` 等）→ ② Tailwind 数值类（`w-9` = 36px 等）→ ③ 组件私有尺寸，
  留在基线并在注释里写清语义。**禁止为凑指标把合法定尺寸硬套进间距令牌。**

### 字号

单一阶梯，与 Element Plus 对齐：

| 令牌 | 取值 | 用途 |
|------|------|------|
| `--font-size-2xs` | 11px | 角标、徽章数字 |
| `--font-size-xs` | 12px | 辅助说明、次要列 |
| `--font-size-sm` | 13px | 正文基准 |
| `--font-size-base` | 14px | 正文强调、表单 |
| `--font-size-md` | 16px | 区块标题 |
| `--font-size-lg` | 18px | 卡片/面板标题 |
| `--font-size-xl` | 20px | 页面标题 |
| `--font-size-2xl` | 24px | 大屏/看板标题 |

展示型尺寸（图标字符、统计大数字）单独一档：`--display-size-sm: 21px`、`--display-size-md: 26px`、
`--display-size-stat: 28px`（看板统计主角数字）、`--display-size-lg: 32px`、
`--display-size-xl: 34px`、`--display-size-2xl: 48px`。

### 字重

| 令牌 | 取值 | 用途 |
|------|------|------|
| `--font-weight-normal` | 400 | 正文 |
| `--font-weight-medium` | 500 | 强调、表头 |
| `--font-weight-semibold` | 600 | 标题 |
| `--font-weight-bold` | 700 | 少量强强调 |

禁止裸数字（`font-weight: 600` 不合规，写 `var(--font-weight-semibold)`）。

### 行高

| 令牌 | 取值 | 用途 |
|------|------|------|
| `--line-height-none` | 1 | 单行、图标行 |
| `--line-height-tight` | 1.25 | 标题 |
| `--line-height-snug` | 1.375 | 紧凑说明 |
| `--line-height-normal` | 1.5 | 正文、列表 |
| `--line-height-relaxed` | 1.625 | 说明文字、表单辅助文本 |
| `--line-height-loose` | 1.75 | 长文、文档型内容 |

`html` 基准行高 1.15 只是排版基线，**正文容器必须显式选档**。px 行高仅限「定高行垂直居中」
一种技巧场景，其余一律用令牌。

### 圆角

| 令牌 | 基准值 | 用途 |
|------|--------|------|
| `--radius-xs` | 2px | small 尺寸 EP 控件 |
| `--radius-sm` | 4px | 标签、小徽章 |
| `--radius-md` | 6px | 输入类控件 |
| `--radius-lg` | 8px | 卡片、基础 EP 控件 |
| `--radius-xl` | 12px | 大型浮层 |
| `--radius-full` | 9999px | 胶囊、头像 |

基准值受设置面板 `data-radius` 档位缩放（`--radius-scale`），**不要假定固定像素**，更不要绕过
令牌写死圆角。

### 阴影

| 令牌 | 用途 |
|------|------|
| `--shadow-card` | 内容卡贴地阴影（定向 `0 1px 2px`，明暗成对）；`el-card` / `app-pane` 默认即它 |
| `--shadow-sm` / `--shadow-md` / `--shadow-lg` | 通用层级 |
| `--shadow-float` | 悬浮、上浮态 |
| `--shadow-navbar` | 顶栏（组件级） |
| `--shadow-panel` | 侧贴面板（组件级） |
| `--shadow-footer-edge` | 表格分页条上缘（贴表尾的 1px 阴影分隔） |

明暗色同值；暗色主题靠表面色差 + elevated 层顶部 1px 高光
（`inset 0 1px 0 hsl(var(--fg) / 5%)`，卡片/弹层已内置）分层，**不要为暗色单独写阴影**。

### 语义色

明暗成对定义，消费方统一写 `hsl(var(--x))`：

| 分组 | 令牌 | 用途 |
|------|------|------|
| 背景 | `--bg-page` / `--bg-card` / `--bg-elevated` | 页面底 / 卡片 / 弹层浮层 |
| 前景 | `--fg` | 主文字 |
| 前景 | `--fg-muted` | 次级文字、表头（≥4.5:1，正文级辅助信息的最低档） |
| 前景 | `--fg-subtle` | 辅助文字（约 3:1，**仅大字号或装饰**，不承载信息） |
| 前景 | `--fg-placeholder` / `--fg-disabled` | 占位 / 禁用 |
| 描边 | `--border` / `--border-light` / `--border-lighter` / `--border-strong` | 卡片与控件描边 |
| 填充 | `--fill` / `--fill-muted` / `--fill-subtle` / `--fill-strong` | hover 底色、骨架、轨道 |
| 其它 | `--divider` / `--ring` / `--overlay` | 分割线 / 焦点环 / 遮罩 |
| 品牌功能 | `--primary` / `--success` / `--warning` / `--danger` / `--info` | 品牌与状态 |

EP 色阶（`light-3`~`light-9` / `dark-2`）由 `color-mix` 现场派生，不另存变量。
**正文级绿色文字用 `--success-text`**（对比度收口），不直接拿 `--success` 当文字色。

### 层级（z-index）

| 令牌 | 取值 | 用途 |
|------|------|------|
| `--z-index-fixed-header` | 998 | 固定头部 |
| `--z-index-layout` | 1000 | 布局固定层通用档 |
| `--z-index-sidebar` | 1001 | 侧栏 |
| `--z-index-sidebar-ctrl` | 1002 | 侧栏钉住/折叠按钮 |
| `--z-index-setting-mask` | 1005 | 设置面板遮罩 |
| `--z-index-setting-panel` | 1010 | 设置面板 |
| — | 2000+ | Element Plus 弹层（不干预） |
| `--z-index-app-mask` | 2001 | 移动端侧栏内容遮罩 |
| `--z-index-lock-screen` | 2500 | 锁屏遮罩 |
| `--z-index-tippy` | 9999 | tippy 提示 |

组件内部局部叠放（0~10）属私有上下文，不进阶梯。禁止裸数字；JS 侧同值常量在 `src/utils/zIndex.ts`。

### 动效

| 令牌 | 取值 | 用途 |
|------|------|------|
| `--duration-instant` | 0.1s | 按钮按压反馈 |
| `--duration-hover` | 0.15s | hover 微反馈 |
| `--duration-fast` | 0.2s | hover、颜色过渡 |
| `--duration-slide` | 0.25s | 滑入滑出 |
| `--duration-base` | 0.3s | EP 标准过渡 |
| `--duration-slow` / `--duration-slower` | 0.4s / 0.5s | 大型区块入场 |

缓动：`--ease-standard` / `--ease-emphasized` / `--ease-slide` / `--ease-out-expo` /
`--ease-in` / `--ease-out`。Tailwind 过渡的默认时长与缓动已桥接
（`--default-transition-duration` / `--default-transition-timing-function`），
`transition-colors` 等默认写法即合规。

## 关键决策

### 字号只有一套语义

历史上 Tailwind 的 `text-sm`（14px）与 `--font-size-sm`（13px）并存，同一个「sm」两套取值，
页面排版与组件库对不上。现在 `text-sm` / `text-base` 已在 `@theme` 覆写为 13px / 14px，
与令牌阶梯完全一致——**全站只有一套字号语义**：模板写 `text-sm` 和 SCSS 写
`var(--font-size-sm)` 是同一个值。需要 16px 的场景用 `text-md`。禁止绕过阶梯写任意 px 字号。

### 卡片单轨

内容卡的唯一形态是 `el-card`（全局兜底 `--radius-lg` + `--shadow-card` 贴地阴影 +
`--border-lighter` 描边，卡内边距 24px）；需要 hover 上浮微交互的看板/图表卡，在
`el-card` 上标注 `.app-card` 获得。侧栏面板、聊天栏这类贴边布局
容器用 `@utility app-pane`（「无内边距的卡片壳」：卡面底色 + `--card-border` 描边 +
`--radius-lg` + `--shadow-card`，无上浮）。
**禁止再自绘「自定义背景 + 自定义圆角阴影」的第三形态**，也禁止回退 `0 0 12px` 式雾化阴影。

### 密度

控件默认 `default` 尺寸（**32px 高度是定点，不压**）；表格默认密度见下节「表格分层」；
设置面板内边距 `--panel-pad-y`（20px）/ `--panel-pad-x`（24px）；设置面板表单项的
控件宽度只有两档（`--setting-field-width-sm`: 120px / `--setting-field-width-md`: 180px，
模板写 `w-(--setting-field-width-sm)`），**禁止内联 style 写宽度**（含 `label-width`
这类 prop 型字面量，`check:size-literals` 同口径拦截）。

### 暗色分层

暗色主题不依赖阴影表达层级：靠表面色差（page < card < elevated）加 elevated 层顶部
1px 高光。新增弹层/浮层一律取 `--bg-elevated`，不要自调灰色。

### 留白三档

页面节奏只有三档：**页边距 32px**（`--content-gap`，窄屏回落 12px）、**区间 24px**
（`--space-6`，卡片与卡片之间）、**卡内 24px**（`--el-card-padding`）。不再出现
「到处 16px 等距堆叠」；新增区块间距先从这三档里选。

### 列表页「一张工作纸」

列表页骨架收口在 RePlusPage：**页面头（20px/600 标题 + 13px 辅助文案）→ 搜索区 →
hairline 分隔 → 工具栏 → 表头 → 表体**，搜索区不再单独是一张卡。页面头由框架内置
（`pageHead` / `pageSubtitle` props，缺省取菜单标题），页面不要每页手写标题块；
工具栏图标一律进 28px 圆形热区（`@utility table-bar-action`，令牌
`--tablebar-action-size`），不用竖分隔线切分区。

### 表格分层

表头与表体分层：`--fill-subtle` 底 + 12px / 600 / `--fg-muted` 表头（对比度 ≥4.5:1，
不要用 `--fg-subtle`），默认密度行高 41px（cell 上下 8px）、正文 13px、行分隔线
`--divider`。工具栏的密度开关（compact/default/loose）仍可覆盖默认值，分层样式
不随密度失效。表格与统计数字全局 `tabular-nums`。

### 控件重量分级

操作区按动作权重选型：**主查询 = 实色主按钮**，**重置 = 文字按钮**，**导出/次动作 =
描边按钮**。同组不超过一个实色主按钮；图标按钮必须进 28px 热区（见上）。

### 看板去彩色底块

看板/指标卡的主角是**数字**（`--display-size-stat` 28px / 700 + `tabular-nums`），
指标名 13px `--fg-muted`。图标直接着色（不套彩色底块），hover 微动画即可；
时间线、步骤条类序列标记**单色循环**（首条主色、其余禁用灰），五色循环没有信息含义。

### 大屏暗色作用域映射

大屏画布（`[data-screen-theme="dark"]`）在令牌层把 EP 的
`--el-bg-color` / `--el-fill-color-blank` / `--el-border-color*` / `--el-text-color-*`
映射到 `--screen-surface-*` / `--screen-border*` / `--screen-fg-*`——**组件零改动**，
写 EP 变量就是写大屏语义槽；不要在大屏组件里再写 `hsl(var(--screen-*))` 之外的灰。
窗格 hover 用 `--screen-border-strong` 做预选中反馈（带 `--duration-fast` 过渡）。

### 大屏空态形态

**设计器空画布 = 引导态**（图形 + 主文案「从左侧组件库添加窗格」+ 次文案最小操作提示），
栅格板与自由板共用 `CanvasEmpty` 组件；**投屏 = 陈述态**（`ReEmpty` 插画 + 「无可投屏
仪表盘」）。全部消费 `--screen-*` 令牌，文字最浅一档取 `--screen-fg-dim`（55%，深色
画布对比度 ≥4.5:1）；`--screen-fg-faint`（45%）只作装饰、不承载文字。

### 聊天域三条

1. **在线点**：私聊会话行与联系人行统一为**头像右下角标**（`--el-color-success` 圆点 +
   `--el-bg-color` 1px 描边，`size-2.5`），同一位置同一语义；离线态为灰点
   （`--el-color-info-light-5`），不隐藏。
2. **会话列表右列**：未读 badge 在上、最近消息时间在下（`text-xs` + `--fg-muted` +
   `tabular-nums`），时间格式复用消息流分组口径（今天 HH:mm / 昨天 / 月-日 HH:mm）。
3. **消息操作行**：绝对定位 + `group-hover` 显现（不参与布局，不留隐形占位行）；
   「回到新消息」悬浮条锚定输入区容器顶边（`bottom-full`）。

### 详情与弹窗

- 页面头全站同档（20/600 + 13px `--fg-muted`）：列表页 RePlusPage 内置，其它路由页
  用 `.page-head` / `RePage`（二者同档，`RePage` 另带扩展位与 hairline）。
- 抽屉/弹窗内的详情用 `el-descriptions`（标签列底纹与表格分层同源）；区块之间
  间距 24px（`--space-6`），卡片默认即 `--shadow-card` 贴地阴影，勿回退雾化。
- 弹层宽度取档：`DIALOG_SIZES`（sm 480 / md 640 / lg 760 / xl 860 / xxl 960）与
  `DRAWER_SIZES`（sm 40% / md 50% / lg 60% / xl 75% / full 100%），经
  `dialogSize()` / `drawerSize()` 引用，**不写原始 px/百分比字面量**；
  RePlusPage 元数据表单弹窗默认 xxl（960）。
- 表单辅助说明用项目约定类 `.el-form-item__help`（12px + `--fg-muted` 全局已收口）；
  校验错误态走 EP 自带 `__error` 危险色，不要自造红色样式。
- 弹窗底部按钮主次分级：取消 = 文字按钮、确认 = 实色主按钮（ReDialog 缺省即此口径）。

## 组件规范

- **必须**：列表页用 `RePlusPage`（状态由框架兜底）；只读/弹窗表格用 `DataTable`；
  弹层用 `addDialog` / `addDrawer`；异步区块用 `ReStateContainer` 收口；空态用 `ReEmpty`。
  组件职责与示例见[组件库章节](../components/)。
- **弹层宽度只走档位**：`dialogSize()`（480~960 五档）/ `drawerSize()`（40%~100% 五档），
  不写任意宽度（全屏弹层另行约定）。
- 自绘可点元素必须三件套：`cursor-pointer` + hover 底色（`var(--fill-*)`）+ `:active`
  缩放反馈（直接挂 `@utility pressable` 即得三件套口径；大面积卡片按 `scale(0.99)` 微调）。
  **判定标准**：卡片式入口、列表项、自绘按钮、图标网格项 → 必须有；EP 组件（el-button/
  el-tag/el-menu-item 自带反馈）、纯展示容器、整行文本导航（已有 hover/激活底色）→ 不加。
  元素自带 hover 过渡的（如 icon-item 的 scaleX），在既有 scss 里补 `:active` 即可，
  不要叠 pressable（transition 会互相覆盖）。
- 内联样式仅允许 JS 动态计算值（百分比宽度、拖拽坐标）；静态尺寸一律 class/令牌。
- 聊天消息域：消息的 hover 操作行用**绝对定位 + `group-hover` 显现**（不参与布局，
  不给每条消息留隐形占位行）；「回到新消息」类悬浮条锚定输入区容器顶边
  （`bottom-full`），不要写死与输入区高度的偏移量。

## 状态与微交互

异步区块按三态写：**加载中**（skeleton）/ **失败**（错误提示 + 重试）/ **空**（`ReEmpty`）。
列表页由 `RePlusPage` 框架兜底（PageState），手写面板必须自建三态，不允许「请求失败只剩
白屏」。`prefers-reduced-motion` 下上浮、缩放、CountTo 类动画须降级——全局媒体查询已处理
卡片与标准过渡，**自写动画需自查降级**。

**ReStateContainer 的边界**：它收口的是「面板级」状态——整块区域由一次异步请求决定渲染
什么（如授权应用列表、MFA 状态区、知识库预览、AI 观测面板）。**表单项内的内联提示**
（如 `el-form-item` 里展示当前绑定值、空时显示一行说明文字）不是面板级状态，保持内联，
不要为形式统一硬套容器。判断方法：状态变化时「整片区域被替换」→ 面板级；
「某个字段旁边的辅助展示」→ 内联提示。

## 数字与排版

表格列、统计数值、倒计时等数字场景必须 `font-variant-numeric: tabular-nums`（全局已对
`.el-table` 与统计卡开启，聊天消息时间 / 回应计数 / 未读角标、大屏指标已补齐，
自定义数字组件需自查）；大数字用 `--display-size-*` 档，
禁止用魔法 em 凑大小。

## 对比度与可访问性

- 正文文字只用 `--fg` / `--fg-muted`（≥4.5:1）；`--fg-subtle`（约 3:1）仅限大字号标题或
  纯装饰，不承载关键信息——表头、页面副标题这类 13px 以下的信息文字用 `--fg-muted`，
  用 `--fg-subtle` 会被 a11y 门禁（axe color-contrast serious）拦下。
- 功能色正文用收口变量（如 `--success-text`），不直接消费 `--success` 等饱和色。
- 可交互元素必须有可见的 hover / 焦点反馈（`--fill-*` 底色或 `--ring` 焦点环）。

## 门禁与提交前检查

以下命令在 `xadmin-client` 仓库根目录执行：

| 命令 | 守护什么 |
|------|----------|
| `pnpm check:font-size-literals` | 裸 px 字号（基线已清零，新增即失败） |
| `pnpm check:color-literals` | 颜色字面量与 Tailwind 调色板类 |
| `pnpm check:spacing-literals` | 刻度外间距 px、裸字重/行高/阴影/z-index 字面量（基线只减不增） |
| `pnpm check:size-literals` | width/height 等定尺寸 px 字面量（全量登记、只减不增，非清零） |
| `pnpm lint` | eslint + prettier + stylelint（`--max-warnings 0`） |
| `pnpm test:run` | vitest 单测 |
| `pnpm test:e2e:visual` | 视觉回归（改样式后必跑） |

人工审查清单（提交 / review 时逐条过）：

1. 新样式先查令牌表，令牌没有的先补令牌；
2. 内容卡一律 `el-card` / `.app-card`，贴边布局容器用 `app-pane`；
3. 间距只取合法刻度（2~40px 那一张表）；
4. 字号只取阶梯，16px 用 `text-md`；
5. 数字场景确认 `tabular-nums` 生效；
6. 弹层宽度走 `dialogSize()` / `drawerSize()` 档位，不写原始字面量。

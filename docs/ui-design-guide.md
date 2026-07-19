# UI 设计规范

本文档定义 Halcyon 及其所有内置插件的视觉与交互规范。任何 UI 代码在提交前都要对照本文档自检。

规范的取向：**iOS 风格、克制、单色 SVG 图标、无渐变**。目标是让 Halcyon 的界面在 Discord 深色背景中看起来像一个安静的原生 App，而不是又一层五颜六色的 mod 面板。

## 一、总原则

1. **克制**：能不加的元素就不加。空白比装饰更有价值
2. **一致**：所有插件共用同一套 token 和组件。禁止插件自带 UI kit
3. **原生感**：控件行为向 iOS/iPadOS 的 Settings App 看齐。分组、缩进、右侧图标、44pt 触控高度
4. **无渐变**：一切表面颜色使用纯色。阴影可以有，渐变不可以
5. **无 emoji**：Emoji 会破坏视觉一致性。所有图标必须是项目内的 SVG 组件

## 二、颜色 Token

所有颜色使用 CSS 变量。禁止在组件中写具体的十六进制值。

### 主色

| Token | 深色模式 | 说明 |
| --- | --- | --- |
| `--hc-accent` | `#0A84FF` | 主色，用于强调按钮、开关开启态、链接 |
| `--hc-accent-pressed` | `#0768CC` | 主色按下态 |

### 语义色

| Token | 值 | 用途 |
| --- | --- | --- |
| `--hc-red` | `#FF453A` | 破坏性操作、删除状态、错误提示 |
| `--hc-orange` | `#FF9F0A` | 警告 |
| `--hc-yellow` | `#FFD60A` | 注意，谨慎使用 |
| `--hc-green` | `#30D158` | 成功、开关开启 |
| `--hc-teal` | `#64D2FF` | 信息 |
| `--hc-indigo` | `#5E5CE6` | 次级强调 |
| `--hc-pink` | `#FF375F` | 特殊状态 |

### 中性色

| Token | 值 | 用途 |
| --- | --- | --- |
| `--hc-bg-primary` | `#000000` | 页面背景 |
| `--hc-bg-secondary` | `#1C1C1E` | 卡片、分组背景 |
| `--hc-bg-tertiary` | `#2C2C2E` | 卡片内嵌区域 |
| `--hc-bg-elevated` | `#2C2C2E` | 弹窗、菜单 |
| `--hc-fill-primary` | `rgba(120,120,128,0.36)` | 输入框、次级填充 |
| `--hc-fill-secondary` | `rgba(120,120,128,0.24)` | Chip、Tag |
| `--hc-separator` | `rgba(84,84,88,0.65)` | 分组内分割线 |
| `--hc-separator-opaque` | `#38383A` | 需要不透明分割线时 |
| `--hc-label-primary` | `#FFFFFF` | 主文本 |
| `--hc-label-secondary` | `rgba(235,235,245,0.60)` | 次文本 |
| `--hc-label-tertiary` | `rgba(235,235,245,0.30)` | 说明文本、占位 |
| `--hc-label-quaternary` | `rgba(235,235,245,0.16)` | 禁用文本 |

### 使用规则

- 强调色只在同一屏幕上出现一处。多个强调色并列会稀释注意力
- 破坏性操作的红色只用于文字与图标，不用于填充
- 组件的默认状态使用中性色，语义色仅用于状态传达

## 三、字体

字体栈：

```css
font-family:
  -apple-system, BlinkMacSystemFont,
  "SF Pro Text", "SF Pro Display",
  "PingFang SC", "Microsoft YaHei",
  "Segoe UI", Roboto, sans-serif;
```

字号阶：

| Token | 尺寸 / 行高 | 字重 | 用途 |
| --- | --- | --- | --- |
| `--hc-text-largetitle` | 34 / 41 | 700 | 页面主标题（很少用） |
| `--hc-text-title1` | 28 / 34 | 700 | 一级标题 |
| `--hc-text-title2` | 22 / 28 | 700 | 二级标题 |
| `--hc-text-title3` | 20 / 25 | 600 | 三级标题 |
| `--hc-text-headline` | 17 / 22 | 600 | 列表行主文本 |
| `--hc-text-body` | 17 / 22 | 400 | 正文 |
| `--hc-text-callout` | 16 / 21 | 400 | 副文本 |
| `--hc-text-subhead` | 15 / 20 | 400 | 分组小标题 |
| `--hc-text-footnote` | 13 / 18 | 400 | 说明 |
| `--hc-text-caption1` | 12 / 16 | 400 | 时间戳等元信息 |
| `--hc-text-caption2` | 11 / 13 | 400 | 极小字，慎用 |

行高使用绝对像素以保证多行文本对齐。不要用 `line-height: 1.5` 这样的相对值。

## 四、间距与圆角

**8pt 网格**。所有间距、尺寸、位移量都是 4 的倍数，优先 8 的倍数。

间距 token：`--hc-space-1` = 4，`--hc-space-2` = 8，`--hc-space-3` = 12，`--hc-space-4` = 16，`--hc-space-5` = 20，`--hc-space-6` = 24，`--hc-space-8` = 32，`--hc-space-10` = 40。

圆角 token：

| Token | 值 | 用途 |
| --- | --- | --- |
| `--hc-radius-xs` | 4 | 小 Tag、Badge |
| `--hc-radius-sm` | 6 | 输入框内小按钮 |
| `--hc-radius-md` | 10 | 按钮、输入框 |
| `--hc-radius-lg` | 12 | 卡片、分组 |
| `--hc-radius-xl` | 16 | 大卡片、Modal |
| `--hc-radius-2xl` | 22 | 全屏 Sheet 顶部 |
| `--hc-radius-pill` | 999 | 胶囊形按钮、Toggle |

## 五、阴影

阴影层级：

| Token | 值 | 用途 |
| --- | --- | --- |
| `--hc-elev-1` | `0 1px 2px rgba(0,0,0,0.24)` | 静止卡片 |
| `--hc-elev-2` | `0 4px 12px rgba(0,0,0,0.32)` | 浮层、Popover |
| `--hc-elev-3` | `0 12px 32px rgba(0,0,0,0.44)` | Modal、Sheet |

阴影的作用是提供层级线索，不是装饰。同一屏幕上出现三种以上阴影就说明层级设计出了问题。

## 六、图标系统

### 规格

- **格式**：内联 SVG 组件。禁止 icon font，禁止外部图标库，禁止 emoji
- **样式**：单色，`stroke` 或 `fill` 使用 `currentColor`
- **描边**：线性图标使用 1.5 描边、圆角端点（`stroke-linecap="round"` / `stroke-linejoin="round"`）
- **尺寸**：`sm` 16、`md` 20、`lg` 24、`xl` 28、`xxl` 32
- **视觉重量**：`viewBox="0 0 24 24"`，图形占据视觉中心的 20×20 范围

### 组件签名

```ts
interface IconProps {
  size?: 16 | 20 | 24 | 28 | 32;
  className?: string;
  "aria-label"?: string;
}
```

图标组件不接受颜色属性。颜色由父级 `color` 决定。这样可以在鼠标悬停等状态下让图标随文字一起变色。

### 命名约定

- 名词图标用名词：`FolderIcon`、`ClockIcon`
- 动作图标用动词加宾语：`TrashIcon` 而不是 `DeleteIcon`
- 状态图标带上状态：`CheckmarkIcon`、`XmarkIcon`

## 七、组件

### 按钮

三种变体：

| 变体 | 背景 | 文本颜色 | 用途 |
| --- | --- | --- | --- |
| `primary` | `--hc-accent` | 白 | 每屏最多一个 |
| `secondary` | `--hc-fill-primary` | `--hc-label-primary` | 常规操作 |
| `plain` | 透明 | `--hc-accent` | 弱化操作 |
| `destructive` | `--hc-red` 文字 / 透明背景 | | 破坏性 |

高度：`sm` 32、`md` 40、`lg` 50。圆角对应 `--hc-radius-md` / `--hc-radius-md` / `--hc-radius-lg`。

按钮内文字与图标间距 `--hc-space-2`。图标尺寸比文字 `--hc-text-body` 大 4pt（20pt）。

### 开关（Toggle）

- 关闭态：轨道 `--hc-fill-secondary`
- 开启态：轨道 `--hc-green`
- 尺寸：宽 51、高 31、滑块直径 27
- 交互：点击触发切换，滑块横向平移伴随 200ms 缓动
- 禁止用蓝色作为开启态。iOS 的开关用绿色

### 列表行（List Row）

分组样式，左对齐图标 + 主文本 + 右侧控件（值/箭头/开关）。

```
┌──────────────────────────────────────────────┐
│  [icon]  主文本                    值 / 控件  │
│          次文本                               │
└──────────────────────────────────────────────┘
```

- 行高最小 44
- 图标固定 28×28 圆角方形背景色块，内含 20×20 图标
- 图标背景色使用语义色（消息=蓝、通知=红、隐私=绿），不使用渐变
- 相邻行之间用 `--hc-separator`，最上和最下不加
- 整行可点击时按下呈现 `--hc-fill-secondary` 的高亮

### 分组

```
┌ SECTION TITLE ─────────────────────────────┐

  ┌────────────────────────────────────────┐
  │  行 1                                    │
  │────────────────────────────────────────│
  │  行 2                                    │
  └────────────────────────────────────────┘

  说明文字。这段可选，用于解释这组设置的作用。
```

- 分组标题：`--hc-text-subhead`、`--hc-label-secondary`、全大写、左内边距 16、上外边距 `--hc-space-6`
- 分组容器：`--hc-bg-secondary`、`--hc-radius-lg`
- 分组说明：`--hc-text-footnote`、`--hc-label-secondary`、上外边距 `--hc-space-2`

### 输入框

- 高度 40，圆角 `--hc-radius-md`
- 背景 `--hc-fill-primary`
- 聚焦时描边 2px `--hc-accent`
- 内边距 `--hc-space-3`
- Placeholder 使用 `--hc-label-tertiary`

### Modal / Sheet

- 桌面用居中 Modal，最大宽度 480，圆角 `--hc-radius-xl`，阴影 `--hc-elev-3`
- 顶部标题栏：左侧关闭按钮（`XmarkIcon`）+ 居中标题 + 右侧主操作按钮
- 顶部标题栏与内容之间有 `--hc-separator`
- 底部主操作按钮距底 `--hc-space-5`

### 徽章 / Chip

- 高度 20
- 圆角 `--hc-radius-pill`
- 内边距横向 `--hc-space-2`
- 字号 `--hc-text-caption1`、字重 600
- 语义色浅化：文字使用完整语义色，背景使用同色 20% 透明度

### 空状态

- 居中放置图标（尺寸 48）+ 主标题 `--hc-text-headline` + 副标题 `--hc-text-callout`
- 图标使用 `--hc-label-tertiary` 颜色
- 主标题下方留 `--hc-space-2`，副标题下方留 `--hc-space-5`，然后放主操作按钮（可选）

## 八、动效

- 状态切换：`200ms`、`cubic-bezier(0.32, 0.72, 0, 1)`
- 出现/消失：`300ms`、同上缓动
- 一次页面上不要出现两种曲线
- 尊重系统"减少动效"偏好，用户偏好开启时禁用位移与缩放，只保留淡入淡出

## 九、无障碍

- 所有交互控件必须能通过键盘访问，可见的聚焦环颜色 `--hc-accent`、宽度 2px、圆角随控件
- 触控目标最小 44×44
- 文本与背景对比度不低于 4.5:1；大号文本 3:1
- 图标必须有 `aria-label`，装饰性图标标 `aria-hidden="true"`

## 十、禁止事项

以下写法在 code review 中直接打回：

- 使用 `linear-gradient` / `radial-gradient` / `conic-gradient`
- 使用 emoji 或 Unicode 图形字符作为图标
- 使用蓝色以外的颜色作为开关的开启态（除非有明确语义原因，例如"关闭静音"用红色）
- 在同一屏幕上出现三种以上强调色
- 硬编码颜色、字号、圆角、间距值（一律走 token）
- 使用外部图标库（lucide、feather、hero、ionicons 等）
- 使用外部 UI 库（MUI、Chakra、Ant Design 等）
- 使用位图图标
- 组件内部改写文本 `line-height` 到非规范值

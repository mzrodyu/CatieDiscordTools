# 插件开发指南

这份文档假设你已经通读过 [架构总览](./architecture.md) 和 [UI 设计规范](./ui-design-guide.md)。

## 一、一个最小插件

```ts
// src/plugins/hello-world/index.ts
import { definePlugin, log } from "@halcyon/api";

export default definePlugin({
  id: "hello-world",
  name: "Hello World",
  description: "一个什么都不做的示例插件。",
  authors: [{ name: "your-name" }],
  category: "misc",

  start() {
    log.info("hello");
  },

  stop() {
    log.info("bye");
  }
});
```

放到 `src/plugins/hello-world/` 目录下，重新构建即可看到它出现在设置面板里。

## 二、插件清单

`definePlugin` 接受的字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | ✓ | 全局唯一。小写、短横线分隔。一旦发布不可更改 |
| `name` | `string` | ✓ | 显示名。可以是任意语言 |
| `description` | `string` | ✓ | 一句话说清它解决什么问题 |
| `authors` | `Author[]` | ✓ | 至少一个 |
| `category` | `Category` | ✓ | 见下方类别表 |
| `dependencies` | `string[]` |   | 依赖的其他插件 id |
| `required` | `boolean` |   | true 表示用户不能关闭。仅内核插件可以设置 |
| `settings` | `Settings` |   | 见 `defineSettings` |
| `patches` | `Patch[]` |   | 静态 Patch |
| `commands` | `Command[]` |   | 斜杠命令注册 |
| `contextMenus` | `ContextMenuHook[]` |   | 上下文菜单扩展 |
| `start` | `() => void` |   | 生命周期：启用后调用 |
| `stop` | `() => void` |   | 生命周期：禁用/卸载前调用 |

`Category` 的取值：`utility` / `chat` / `voice` / `appearance` / `privacy` / `developer` / `misc`。

## 三、生命周期

```
disabled ─┬─ user toggle on ────► starting ──► running
          │                                     │
          └─ user toggle off ◄── stopping ◄─────┘
```

关键规则：

1. `start()` 是同步的。异步初始化用 `queueMicrotask` 或独立的启动步骤
2. `stop()` 必须做到"完全恢复"——移除所有 Patch、订阅、DOM 节点、setInterval、事件监听
3. 如果一个插件在 `start()` 里抛异常，它会被自动禁用并在 UI 上呈现错误提示
4. 依赖链：如果插件 A 依赖 B，B 未启用时 A 无法启用；禁用 B 会同时禁用 A

## 四、Patcher 用法

### 4.1 运行时 Patch

```ts
import { modules, patcher } from "@halcyon/api";

let unpatch: () => void;

export default definePlugin({
  id: "example",
  // ...
  start() {
    const MessageActions = modules.find(m => m.deleteMessage && m.editMessage);

    unpatch = patcher.before(MessageActions, "deleteMessage", (ctx) => {
      const [channelId, messageId] = ctx.args;
      log.info("about to delete", channelId, messageId);
    });
  },
  stop() {
    unpatch?.();
  }
});
```

Callback 接收的 `ctx` 对象：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `args` | `unknown[]` | 参数数组。可修改，`before` 中修改会传给原函数 |
| `result` | `unknown` | 仅 `after` 中有效。返回值可修改 |
| `this` | `unknown` | 原函数的调用者 |
| `stop()` | `() => void` | 立刻取消 `instead` 模式下调用原函数 |

### 4.2 静态 Patch

```ts
export default definePlugin({
  id: "example",
  patches: [
    {
      label: "拦截删除渲染",
      find: "MESSAGE_DELETE",
      replacement: {
        match: /if\((\w+)\.type===MESSAGE_DELETE\)\{/,
        replace: "if($1.type===MESSAGE_DELETE&&$self.shouldSkip($1))return;$&"
      }
    }
  ],
  shouldSkip(action: unknown) {
    return true;
  }
});
```

- `find` 用来选中目标模块：只有源码包含这个字符串的模块才会尝试应用替换
- `replacement.match` 是 `RegExp`，`replacement.replace` 是替换字符串或函数
- `$self` 是特殊占位符，指向插件实例
- 建议 `find` 尽可能是稳定字符串（Action 名、事件名、错误信息等）
- 每条 Patch 都要单元测试匹配是否成功，Discord 更新导致失效时能第一时间在 CI 里看到

## 五、Flux 订阅

```ts
import { flux } from "@halcyon/api";

flux.subscribe("MESSAGE_DELETE", (action) => {
  // { type: "MESSAGE_DELETE", channelId, id, ...}
});

flux.subscribe("MESSAGE_DELETE_BULK", (action) => {
  // { type: "MESSAGE_DELETE_BULK", channelId, ids: [...] }
});
```

订阅回调必须同步。不要在其中修改 Store 或派发新 Action。异步逻辑放到 `queueMicrotask`。

## 六、设置

### 6.1 声明

```ts
import { defineSettings } from "@halcyon/api";

const settings = defineSettings({
  retention: {
    type: "number",
    default: 200,
    label: "每频道保留条数",
    description: "0 表示无限。上限 2000。",
    min: 0,
    max: 2000
  },
  ignoreBots: {
    type: "boolean",
    default: false,
    label: "忽略机器人"
  }
});

export default definePlugin({
  id: "example",
  settings,
  start() {
    if (settings.store.ignoreBots) …
  }
});
```

### 6.2 类型

| type | 值类型 | 额外字段 |
| --- | --- | --- |
| `boolean` | `boolean` | — |
| `number` | `number` | `min` / `max` / `step` |
| `string` | `string` | `placeholder` / `maxLength` |
| `select` | `string` | `options: {value, label}[]` |
| `string-list` | `string[]` | `itemPlaceholder` |
| `custom` | `unknown` | `component: React.FC<{value, onChange}>` |

### 6.3 响应变化

```ts
settings.subscribe("retention", (newValue, oldValue) => {
  applyRetention(newValue);
});
```

订阅在 `stop()` 中自动清理。

## 七、UI 扩展

### 7.1 使用共享组件

```tsx
import { ui } from "@halcyon/api";
const { Button, Toggle, ListRow, Section } = ui;

function Panel() {
  return (
    <Section title="消息记录">
      <ListRow
        icon={<ClockIcon />}
        title="保留条数"
        value={<Stepper value={200} />}
      />
    </Section>
  );
}
```

**禁止** 引入外部 UI 库或自己写按钮/开关。共享组件的能力不够就在 `ui` 里补，不要在插件里重造。

### 7.2 图标

图标只使用 `@halcyon/icons`。找不到需要的图标：

1. 从 SF Symbols 里挑一个视觉等价物
2. 用相同参数（stroke 1.5、round cap/join、24×24 viewBox）画一个 SVG
3. 提交到 `src/icons/`，命名遵循[规范](./ui-design-guide.md#图标系统)
4. 复用者原则：如果这个图标至少还会有一个别的地方用得上，才合入 `icons`；只有你一个插件用就放在插件目录内

### 7.3 侧边栏入口

如果插件需要一个专属页面：

```ts
export default definePlugin({
  id: "example",
  page: {
    title: "示例",
    icon: ClockIcon,
    component: ExamplePage
  }
});
```

系统会自动在"设置 → Halcyon → 插件"下方为它加一项。

## 八、日志

```ts
import { log } from "@halcyon/api";

log.debug("详细信息，默认不显示");
log.info("常规");
log.warn("有异常但不致命");
log.error("有问题", err);
```

日志会带上插件 id 前缀，并进入 Halcyon 内建的日志查看器。**禁止使用 `console.log`**——它会污染 Discord 的开发者控制台。

## 九、测试

单元测试放在插件目录内：

```
src/plugins/example/
├── index.ts
├── ui/
├── __tests__/
│   ├── logic.test.ts
│   └── patches.test.ts
```

`patches.test.ts` 是强制的：所有静态 Patch 都要用一份该 Patch 期望能改写的示例代码片段来验证正则确实能命中。

## 十、发布

### 10.1 内置插件

内置插件与主项目一起发版。PR 合入即随下一个版本发布。命名规范：目录名 = `id`。

### 10.2 第三方插件

**首个版本不支持**。第三方插件加载是一个明确的安全边界问题，会在里程碑 v0.4 才考虑，届时会有单独的设计文档与权限模型。

现阶段所有插件都必须在本仓库内。

## 十一、审核清单

提交插件 PR 前对照检查：

- [ ] `id` 全项目唯一，命名符合规范
- [ ] `description` 一句话说清用途
- [ ] `stop()` 完全清理副作用
- [ ] 所有静态 Patch 都有单元测试
- [ ] 所有 UI 走共享组件与设计 token
- [ ] 没有 emoji、没有渐变、没有硬编码颜色
- [ ] 没有 `console.log`
- [ ] 没有未经用户同意的网络请求
- [ ] 没有采集用户行为数据
- [ ] `docs/plugins/<id>.md` 存在且完整

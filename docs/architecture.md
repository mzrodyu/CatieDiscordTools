# 架构总览

本文档描述 Halcyon 的运行时结构、模块划分与关键机制。目标读者是插件作者和核心维护者。如果你只是想装一个 Halcyon 来用，看 [README](../README.md) 就够了。

## 一、Halcyon 是什么

Halcyon 是运行在桌面版 Discord 客户端内部的一层脚本。它在 Discord 的 renderer 进程启动之前把自己插进去，然后：

1. 拦截 Discord 的 Webpack 模块加载过程，暴露一套"查找/改写模块"的能力
2. 提供一套插件运行时，让每个插件可以订阅模块加载、注册 UI、监听事件
3. 提供一套共享的 UI 组件与设计 token，让所有插件视觉一致
4. 提供设置持久化、日志、错误上报等基础设施

Halcyon 自身**不修改磁盘上的 Discord 应用**（除了一次性的注入器操作），也不代理 Discord 的网络流量。所有能力都在 Discord 已经加载出来的 JS 环境里完成。

## 二、代码分层

```
┌────────────────────────────────────────────────────────────┐
│                        Discord 应用                          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Halcyon Runtime                     │  │
│  │                                                      │  │
│  │  ┌─────────┐  ┌─────────┐  ┌────────┐  ┌─────────┐   │  │
│  │  │ modules │  │ patcher │  │  flux  │  │ settings│   │  │
│  │  └─────────┘  └─────────┘  └────────┘  └─────────┘   │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │              Public Plugin API               │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │                                                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │  │
│  │  │ plugin: ML │  │ plugin: … │  │ plugin: …  │      │  │
│  │  └────────────┘  └────────────┘  └────────────┘      │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │           Shared UI (components + tokens)    │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

物理目录：

```
src/
├── injector/          注入器 CLI（Node 环境运行）
├── loader/            引导脚本（在 renderer 中最先执行）
├── core/              运行时核心
│   ├── modules/       Webpack 模块定位与劫持
│   ├── patcher/       函数级 Patch 系统
│   ├── flux/          Discord Flux Dispatcher 桥接
│   ├── settings/      设置读写、Schema
│   ├── ipc/           renderer <-> main 通信
│   ├── logger/        分级日志
│   └── runtime.ts     生命周期编排
├── api/               对插件暴露的公共 API 面
├── ui/                共享组件、设计 token、样式基座
├── icons/             SVG 图标集合
├── plugins/           内置插件
│   └── message-logger/
└── main.ts            renderer 入口
```

## 三、启动流程

Halcyon 的启动分成三段。任何一段失败都会安全降级为"什么也不做"，绝不导致 Discord 无法启动。

### 阶段 1：注入器（一次性）

`halcyon inject` 命令做的事：

1. 找到本机 Discord 的安装目录与内嵌 `app.asar` 的位置
2. 在 Discord 的资源目录旁生成一个新的目录 `app`，其 `package.json.main` 指向 `loader.js`
3. Electron 在启动时优先加载 `app` 目录而非 `app.asar`，从而完成注入
4. 记录被修改的路径以便 `halcyon uninject` 恢复

关键设计：
- **不改动 asar 文件本体**。所有变更都是新建目录，卸载时只需删除
- **可逆**。`uninject` 必然能把 Discord 恢复到原样
- **权限最小**。除了 Discord 安装目录内的读写，不动系统其他任何地方

### 阶段 2：引导（每次 Discord 启动）

`loader.js` 由 Electron 加载。它做的事：

1. 转身把 Discord 原本的 `app.asar` require 回来，交出对主进程的控制权
2. 在主进程注册一个 preload 脚本
3. preload 脚本会在 renderer 创建时被 Electron 注入

### 阶段 3：运行时（renderer 内）

preload 脚本在 renderer 上下文最早期执行，做的事：

1. 抢在 Discord 自身的 Webpack runtime 之前劫持 `window.webpackChunkdiscord_app.push`
2. 每当 Discord 加载新的模块块时，通过我们的钩子过一遍，模块被记录到内部 registry
3. 等待 Discord 的核心模块就绪（例如 Flux Dispatcher 出现），触发 `HalcyonReady`
4. 触发 `HalcyonReady` 后按依赖顺序启动所有开启的插件

## 四、Modules — 模块定位

Discord 打包出来的是数千个 Webpack 模块。要在其中定位某一个具体功能，Halcyon 提供三种查询方式：

### 4.1 按导出属性

```ts
const MessageStore = modules.find(m => m.getMessage && m.getMessages);
```

用于查找 Store、工具类等有独特形状的模块。

### 4.2 按源码字符串

```ts
const [MessageActions] = modules.findAll({ source: "MESSAGE_DELETE" });
```

用于查找那些外部 API 不明显、但源码内部有特定字符串的模块。

### 4.3 惰性查找

```ts
const MessageStore = modules.lazy(m => m.getMessage);
// 首次访问 MessageStore.<prop> 时才真正查找
```

用于插件初始化时目标模块尚未加载的情况。

### 4.4 缓存

所有已知模块结果按查询谓词缓存，插件卸载时清理。相同查询在整个会话里只跑一次。

### 4.5 稳定性策略

Discord 每次发版都会打乱模块 ID。因此：

- **禁止使用模块 ID 直接引用**
- **优先使用多重条件**：`m => m.foo && m.bar && typeof m.baz === "function"`
- **禁止依赖字段顺序**，因为压缩后 key 会重排

模块定位的失败必须优雅：找不到模块的插件应当禁用自己并上报 warning，不能把整个 Halcyon 拖垮。

## 五、Patcher — 函数级改写

Patcher 用来给 Discord 的某个函数在调用前/调用后/替换实现层面加钩子。它是插件影响 Discord 行为的主要手段。

### 5.1 API

```ts
patcher.before(target, methodName, (ctx) => { /* 修改 ctx.args 或阻止 */ });
patcher.after (target, methodName, (ctx) => { /* 修改 ctx.result */ });
patcher.instead(target, methodName, (ctx) => { /* 完全替换 */ });
```

每次注册返回一个 `unpatch()` 函数，插件停止时必须清理。

### 5.2 静态 Patch

除了运行时打补丁，Halcyon 支持"静态 Patch"——通过在模块源码级别做字符串替换来注入代码。这一类 Patch 在模块加载瞬间应用，比运行时 Patch 更早、开销更低。

```ts
patches: [
  {
    find: "MESSAGE_DELETE",
    replacement: {
      match: /(function\s+\w+\s*\([^)]*\)\s*\{)/,
      replace: "$1if($self.shouldSkip(arguments))return;"
    }
  }
]
```

`$self` 会被替换为当前插件的实例，`$1` `$&` 等按标准正则语义。

静态 Patch 的风险大于运行时 Patch——正则匹配失败会导致该 Patch 彻底失效。因此每个静态 Patch 都必须有：

- 一个描述其意图的短标签
- 匹配失败时的日志与降级路径
- 单元测试覆盖 match 正则

## 六、Flux — Discord 状态订阅

Discord 使用 Flux 架构。Halcyon 提供两个基本能力：

### 6.1 订阅 Action

```ts
flux.subscribe("MESSAGE_DELETE", (action) => { … });
```

任何 Discord 派发的 Action 都可以订阅。订阅在插件停止时自动解除。

### 6.2 访问 Store

```ts
const messages = MessageStore.getMessages(channelId);
```

Store 通过 modules 定位后按普通对象使用。

### 6.3 使用建议

- 优先订阅 Action 而不是给 Store 打补丁
- 订阅回调**必须同步返回**，异步逻辑放到 microtask 之后
- 不要在订阅里派发新的 Action（会造成级联），确有需要走 `queueMicrotask` 延后

## 七、Settings — 设置持久化

### 7.1 Schema

每个插件通过 `defineSettings` 声明自己的设置结构：

```ts
const settings = defineSettings({
  enabled: {
    type: "boolean",
    default: true,
    label: "启用",
    description: "关闭后插件停止工作，历史数据保留"
  },
  retention: {
    type: "number",
    default: 200,
    label: "每频道保留条数",
    min: 0,
    max: 2000
  },
  ignoredUsers: {
    type: "string-list",
    default: [],
    label: "忽略的用户 ID"
  }
});
```

支持的 `type`：`boolean` / `number` / `string` / `select` / `string-list` / `custom`。`custom` 需要提供 `component` 字段渲染自定义 UI。

### 7.2 读写

```ts
if (settings.store.enabled) …
settings.store.retention = 500;
```

`settings.store` 是响应式代理，写入立即触发持久化与订阅回调。

### 7.3 存储介质

- 主设置：`<userdata>/halcyon/settings.json`，同步写入，附带原子交换避免损坏
- 大量数据（例如消息日志）：`<userdata>/halcyon/data/<plugin-id>/`，插件自选文件或 SQLite
- 用户可导出全部设置为单一 JSON 文件

设置文件被人手动破坏时，Halcyon 用 schema 默认值兜底，并把损坏文件重命名为 `.corrupted-<timestamp>` 保留。

## 八、Public Plugin API

`@halcyon/api` 是插件唯一应当引用的入口。它重新导出以下命名空间：

```ts
import {
  definePlugin, defineSettings,
  modules, patcher, flux,
  ui, icons, log
} from "@halcyon/api";
```

版本策略：

- API 遵循 [Semantic Versioning](https://semver.org/)
- 主版本升级时提供为期两个次版本的兼容层
- 每个 API 面都标注 `@since` 与 `@stability`（`experimental` / `stable` / `deprecated`）

## 九、错误边界

Halcyon 的错误处理原则是**责任隔离**：

- 一个插件抛错不影响其他插件
- 运行时错误不影响 Discord 本体
- 静态 Patch 匹配失败不影响其他 Patch

具体做法：

- 每个插件的 `start` / `stop` 与 Patch 应用都在 `try/catch` 里
- 静态 Patch 出错时降级为 no-op 并 log warn
- 运行时 Patch 中的用户回调若抛异常，被捕获后调用原函数保底
- Halcyon 自身有一个"安全模式"，用户按住某个组合键启动 Discord 时启用，运行时禁用所有插件并保留一个恢复入口

## 十、性能预算

以下是我们对自身的硬约束：

- Discord 启动到出现登录页的时间因 Halcyon 造成的额外开销 **≤ 150ms**
- 单个插件启动 **≤ 20ms**
- 主线程单次任务因 Halcyon 造成的额外时间 **≤ 4ms**
- 内存占用（不含插件用户数据）**≤ 20MB**

CI 集成基准测试，回归的 PR 会被打回。

## 十一、不做的事

出于稳定性与合规性的考虑，Halcyon **明确不做**以下事情：

- 不代理、不修改、不解密 Discord 与其服务器之间的任何网络流量
- 不绕过 Discord 的账户安全机制
- 不进行任何未经用户明确同意的遥测或数据上报
- 不自动更新自己（更新必须由用户显式触发）
- 不加载任何未经审核的第三方插件包。所有内置插件都在本仓库

违反上述任何一条的 PR 都会被直接关闭。

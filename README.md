<div align="center">

# Halcyon

一个面向 Discord 桌面客户端的插件系统，专注克制的 iOS 风格设计与稳定的插件 API。

<sub>Discord client mod · iOS-style UI · SVG icons · No gradients</sub>

<br>
<br>

[![一键安装油猴脚本](https://img.shields.io/badge/🐒_一键安装油猴脚本-点这里-2ea44f?style=for-the-badge)](https://github.com/mzrodyu/CatieDiscordTools/raw/main/dist/halcyon.user.js)
[![下载浏览器扩展](https://img.shields.io/badge/🧩_下载浏览器扩展-.zip-3b82f6?style=for-the-badge)](https://github.com/mzrodyu/CatieDiscordTools/raw/main/dist/halcyon-extension.zip)

<sub>油猴：需先安装 <a href="https://www.tampermonkey.net/">Tampermonkey</a>，点按钮即弹出安装页 · 扩展：下载后解压，在 <code>chrome://extensions</code> 开「开发者模式」加载 · <a href="#安装三选一">详细教程</a></sub>

</div>

---

## 这是什么

Halcyon 是一个可以往 Discord 桌面客户端里注入的插件运行时。它不改动 Discord 本体，而是在客户端启动时挂载一层薄薄的运行时，让第三方插件能够安全地：

- 监听并改写 Flux 事件（消息收发、成员进出、状态变化等）
- 定位客户端内部模块并对指定函数做非侵入式补丁
- 注入自己的 React 组件到设置面板、消息栏、上下文菜单
- 持久化插件自身的配置

Halcyon 的定位是 **稳定、可读、克制**：

- **稳定**：插件 API 有版本号，破坏性变更走弃用周期
- **可读**：核心运行时用 TypeScript 写就，每个模块单一职责，注释解释"为什么"而不是"是什么"
- **克制**：默认关闭一切非必要 UI，视觉语言遵循一份严格的设计规范

## 特性

- **插件系统**  
  声明式的插件清单、生命周期钩子、依赖声明、按需加载
- **模块定位器**  
  支持按导出签名、字符串常量、React displayName 等策略查找 Webpack 模块，命中失败时给出足够的诊断信息
- **补丁引擎**  
  基于字符串替换和 AST 双通道的函数补丁，带命中率统计和失败回退
- **设置中心**  
  iOS 风格的分组表单，插件只需声明配置 schema 就能拿到一份可用的设置界面
- **图标系统**  
  一整套自绘的单色 SVG 图标，尺寸规范 20 / 24 / 28pt，`currentColor` 着色
- **构建产物**  
  单文件 IIFE bundle：桌面注入包、浏览器扩展、油猴脚本三种产物同源构建

## 首批插件

| 插件 | 简介 |
| --- | --- |
| `message-logger` | 保留被删除的消息、记录编辑历史、支持忽略名单和日志导出 |
| `show-username` | 在昵称旁边显示账号用户名，多种样式可选，防止相似昵称冒充 |
| `guild-monitor` | 主动订阅选定服务器的频道，捕捉未打开频道里的消息（有封号风险，默认关闭） |

## 安装（三选一）

三种方式跑的是同一份代码，选一种就够了。装好后在 Discord 里按 `Ctrl/Cmd+Shift+H` 打开设置面板。

### 方式一：油猴脚本（最简单，推荐小白）

适用于 Discord **网页版**（`discord.com/app`），不用装 Node、不用命令行。

1. 给浏览器装一个用户脚本管理器：[Tampermonkey（油猴）](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)
2. 点击这个链接：[**安装 Halcyon 用户脚本**](https://github.com/mzrodyu/CatieDiscordTools/raw/main/dist/halcyon.user.js) —— 油猴会自动弹出安装确认页，点「安装」
3. 刷新 Discord 网页版标签页，完成

> Chrome / Edge 用户注意：浏览器需开启扩展的「开发者模式」（`chrome://extensions` 右上角），油猴才能执行用户脚本，这是 Manifest V3 的限制。

### 方式二：浏览器扩展

同样适用于 Discord 网页版，加载更早、更稳定：

1. [**下载 halcyon-extension.zip**](https://github.com/mzrodyu/CatieDiscordTools/raw/main/dist/halcyon-extension.zip)，解压到一个不会被误删的目录
2. 打开 `chrome://extensions`，开启右上角「开发者模式」
3. 点「加载已解压的扩展程序」，选择刚解压出来的目录
4. 刷新 Discord 网页版标签页

Chrome / Edge / Opera 需 111+；Firefox 128+ 也支持。扩展版的设置存在 `chrome.storage` 里（主世界只有同步接口，异步的 `chrome.storage` 通过一个隔离世界的桥接脚本 + 同步内存镜像对接）。

### 方式三：注入桌面客户端（开发者）

需要 Node ≥ 18，会往 Discord 的资源目录写入一个 loader。以下命令 `pnpm` / `npm` 均可：

```bash
# 克隆
git clone https://github.com/mzrodyu/CatieDiscordTools.git
cd CatieDiscordTools

# 安装依赖
pnpm install

# 生产构建（同时产出桌面注入包、浏览器扩展、油猴脚本）
pnpm build

# 注入到本地 Discord（需要具备写入 Discord 资源目录的权限）
pnpm inject

# 开发构建（watch）
pnpm dev
```

桌面注入与网页版两种方式互不影响，按需选择。

## 文档索引

- [架构总览](./docs/architecture.md) — 运行时如何加载、模块如何交互
- [插件开发指南](./docs/plugin-development.md) — 从 Hello World 到发布
- [UI 设计规范](./docs/ui-design-guide.md) — 颜色、字号、间距、图标、组件

## 免责声明

修改 Discord 客户端违反 Discord 的服务条款。使用本项目造成的账号封禁、数据丢失等后果由使用者自行承担。本项目仅供技术研究与个人使用，不接受面向商业分发的 issue 与 PR。

## 作者

**caitemm**（GitHub: [mzrodyu](https://github.com/mzrodyu)）

## 许可

[GPL-3.0-or-later](./LICENSE)。任何基于本项目的修改分发都必须以同样的协议开源。

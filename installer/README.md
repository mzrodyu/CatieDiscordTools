# Halcyon 桌面安装器

一个 Windows 原生 GUI 安装器（PowerShell + WinForms），把 Halcyon 一键注入 Discord
桌面客户端。终端用户**零依赖**：不用装 Node、不用命令行，双击即可。

## 给用户（安装 / 卸载）

两种运行方式，任选其一：

- **不构建，直接跑脚本（推荐）**：双击 `run.cmd`，或右键 `HalcyonInstaller.ps1` →
  用 PowerShell 运行。这条路不触发 ps2exe 二进制的杀软误报。
- **跑打好的 exe**：双击 `dist/HalcyonInstaller.exe`（需要先构建，见下文）。

窗口里会列出检测到的 Discord（稳定版 / PTB / Canary），显示每个的注入状态：

- **安装 / 更新**：把 loader 壳写进 Discord，并（默认勾选）注册一个**开机自动保持注入**
  的登录任务——Discord 自己升级到新版本后会自动重新注入，不用你再手动装。
- **卸载**：删除壳、注销登录任务、清掉本地缓存，Discord 恢复原版。

如果 Discord 正在运行，安装器会问你是否关闭并在完成后自动重启（壳只在全新启动时生效）。
装好后在 Discord 里按 `Ctrl+Shift+H` 打开设置面板。

> 改 Discord 客户端违反其服务条款，有封号风险，自行权衡。

## 给开发者（构建 exe）

```powershell
# Windows PowerShell 5.1 里跑（这样 exe 内嵌的是 5.1 引擎，和用户机器一致）
powershell -NoProfile -ExecutionPolicy Bypass -File installer\build.ps1
# 或
npm run build:installer
```

`build.ps1` 会：缺 `ps2exe` 模块时自动按 CurrentUser 装（无需管理员）→ 从
`package.json` 取 4 段版本号 → 输出 `installer\dist\HalcyonInstaller.exe`（`-noConsole
-STA -x64`，**不请求管理员**）。想换图标就放一个 `installer\assets\halcyon.ico`。

`installer/dist/` 已在 `.gitignore` 里——别提交二进制，用 GitHub Releases 分发。

## 注入方式与自动更新

**注入方式**：当前 Discord 的 Electron 会优先加载 `resources/app.asar` 而**忽略** `resources/app`
文件夹，所以我们把原版 `app.asar` 改名成 `_app.asar`，再把外壳做成一个 `app.asar` **目录**顶上
（和 Vencord/Equicord 同一套）。外壳的 index.js 接管窗口(只碰带 preload 且有标题的真窗口)、用
`webFrame.executeJavaScript` 在主世界跑插件(天然绕过 CSP，无需剥离 CSP、也不用 Proxy 包 electron
——那两样会搞坏窗口的最小化/关闭按钮)，最后 `require` 回 `_app.asar` 的真正 Discord。卸载 = 删掉
`app.asar` 目录、把 `_app.asar` 改名回去。机制都在 [`../src/injector/templates.ts`](../src/injector/templates.ts)。

**自动更新**（和网页油猴一样）：

- 外壳**主进程**每次启动时用 Node https 从 GitHub 拉最新 `dist/halcyon.js`，原子写入
  `%APPDATA%\Halcyon\halcyon.js`。主进程不受渲染进程 CSP 限制，能直连 raw.githubusercontent.com。
- **preload** 只读本地缓存、用 executeJavaScript 注入主世界，启动零延迟、离线可用。
- 更新「下次启动生效」（同 Tampermonkey）；失败 / 离线就继续用上次缓存，绝不因网络让 Discord 起不来。
- 缓存放 `%APPDATA%\Halcyon` 而不是壳里，因为 Discord 客户端升级会换到新的 `app-<版本>` 目录、把旧壳
  孤立掉；缓存在外面才能活下来。孤立的壳由「开机自动保持注入」的登录任务补回来。

### 前置条件（重要）

自动更新拉的是 `https://raw.githubusercontent.com/mzrodyu/CatieDiscordTools/main/dist/halcyon.js`。
这个文件**必须提交并推到 GitHub main** 才行。此前 `.gitignore` 把整个 `dist/` 忽略掉了，
本次已加 `!dist/halcyon.js` 例外——记得 `npm run build` 后 `git add dist/halcyon.js` 提交推送，
否则安装器首次播种和后续更新都会 404。

## 关于 Node 的问题

这套安装器运行时**完全不需要 Node**——不管你机器上有没有装 Node 都一样，没有「检测 Node
并跳过安装」这回事，因为压根没有 Node 要装。Node 只是你（开发者）构建 `dist/halcyon.js` 时
用的工具。窗口底部会顺带显示检测到的 Node 版本，纯信息，不影响任何功能。

## 杀软 / SmartScreen

ps2exe 打出来的未签名 exe 可能被 Windows SmartScreen 或杀软误报——这是无签名下载器的普遍现象。
对策：优先分发 `run.cmd` + `HalcyonInstaller.ps1`（脚本路径不容易误报）；exe 作为便捷选项。
真要消除 SmartScreen 提示只能上 OV/EV 代码签名证书（自签名对 SmartScreen 无效）。

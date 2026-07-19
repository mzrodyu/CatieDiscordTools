# 贡献指南

感谢你愿意为 Halcyon 出一份力。这份文档说明本项目接受贡献的方式与要求。

## 心态

Halcyon 追求 **克制**。写代码之前先想清楚这段代码在没有它的时候项目会不会更好。绝大多数功能请求最好的答案是"不做"。

维护者会以以下顺序对 PR 做取舍：

1. 是否解决了一个真实用户会遇到的问题
2. 是否引入了新的稳定性风险
3. 是否遵守了设计规范与代码规范
4. 是否有对应的文档更新
5. 是否有必要的测试

一份改动良好的 PR，往往删除的行数不少于新增的行数。

## 开始之前

- 请先在 Issue 中说明你要做的事，得到维护者的初步同意再动手。避免"惊喜 PR"
- 阅读 [架构总览](./docs/architecture.md) 和 [插件开发指南](./docs/plugin-development.md)
- 熟悉 [UI 设计规范](./docs/ui-design-guide.md)。带有 UI 的改动如果不遵守规范会被直接打回
- 认可 [行为准则](./CODE_OF_CONDUCT.md)

## 开发环境

- Node.js **20 LTS** 及以上
- 包管理器：**pnpm**（版本见 `package.json` 的 `packageManager` 字段）
- 编辑器：任意支持 TypeScript 的编辑器均可

安装与运行：

```bash
pnpm install
pnpm dev      # watch 模式增量构建
pnpm build    # 生产构建
pnpm lint     # ESLint + typecheck
pnpm test     # 单元测试
```

## 提交规范

- 分支命名：`<type>/<short-desc>`，例如 `feat/message-logger-export`、`fix/settings-scroll`
- 提交信息使用 [Conventional Commits](https://www.conventionalcommits.org/)：
  - `feat: 新增功能`
  - `fix: 修复问题`
  - `refactor: 重构，不改变外部行为`
  - `docs: 文档变更`
  - `chore: 构建、依赖等杂项`
  - `style: 代码格式，无逻辑变更`
- 单个提交只做一件事。一个 PR 里出现"顺手改了下其他地方"就意味着这个 PR 会被拆分要求
- PR 描述必须包含：动机、方案、影响面、验证方式

## 代码规范

### TypeScript

- 严格模式全开。`any` 需要显式注释说明为什么绕不过
- 公共 API 一律标注类型；内部实现可以依赖推断
- 不使用装饰器（避免额外的构建依赖）
- 优先 `const` 与不可变数据结构

### 文件与模块

- 每个文件一个主导出。辅助导出放在同文件末尾
- 目录名与主要导出保持一致
- 循环依赖零容忍

### 命名

- 类：`PascalCase`
- 函数、变量：`camelCase`
- 常量：`UPPER_SNAKE_CASE`
- 类型：`PascalCase`，接口不加 `I` 前缀
- 私有成员用 `#` 而非 `private` 关键字

### 注释

- 注释说明"为什么"，代码本身说明"是什么"
- 不写重复代码内容的注释（例如 `// 增加计数器` 后面跟着 `counter++`）
- 复杂算法或非直觉的取舍必须写清楚背景
- 不写署名注释、日期注释、TODO 之外的作者注释

### UI 代码

- 所有颜色、圆角、字号、间距必须来自设计 token，不直接写具体值
- 图标只使用项目内置的 SVG 组件，禁止引入外部图标库或 emoji
- 禁止使用 CSS 渐变（`linear-gradient` / `radial-gradient` / `conic-gradient`）
- 阴影只使用规范内定义的层级

违反上述任何一条 UI 规范都会被打回。

## 插件的贡献

新插件必须满足：

- 一句话就能解释它解决了什么问题
- 有独立的规格文档放在 `docs/plugins/<name>.md`
- 有清晰的关闭开关，关闭后完全无副作用
- 不发起任何未经用户明确同意的外部网络请求
- 不采集任何遥测数据

## Issue

- Bug 报告：提供复现步骤、期望行为、实际行为、系统信息、Halcyon 版本、Discord 版本
- 功能请求：说明使用场景，不要只描述功能本身
- 讨论：直接在 Issue 里开，标签选 `discussion`

## 许可

提交贡献即同意你的代码以 [GPL-3.0-or-later](./LICENSE) 授权发布。

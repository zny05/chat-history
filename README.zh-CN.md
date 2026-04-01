# AI Archive: 聊天历史

一个用于将 Copilot 聊天历史归档并整理到项目 Markdown 文件中的 VS Code 扩展，为 AI 辅助开发会话构建持久化、可搜索的知识库。

[English](./README.md)

---

## 功能

| 命令 | 描述 |
|---|---|
| **AI Archive: Save Current Chat** | 自动抓取当前 Copilot Chat，对关键信息预填充，掩码敏感信息后写入结构化 Markdown 归档 |
| **AI Archive: Open Session Index** | 根据当前归档文件重新生成并打开 `docs/ai-sessions-index.md` |
| **AI Archive: Search Archives** | 提供索引词建议，搜索归档和 FAQ，并跳转到匹配行 |

安全默认策略：

- 保存会话时会自动把归档目标目录写入 `.gitignore`。
- 保存前会对对话内容和元数据中的敏感值进行掩码（如 `password`、`token`、`api key`、Bearer Token 与常见密钥前缀）。
- 打包发布前会强制执行安全扫描（`npm run security:scan`），扫描失败将阻止打包。
- 会话文件直接保存到 `docs/` 下，并使用紧凑的时间戳文件名格式。

首次激活时，扩展还会自动创建包含常见知识点入门章节的 `docs/ai-faq.md`。

---

## 快速开始

1. 安装扩展（或克隆仓库后按 **F5** 启动扩展开发宿主）。
2. 在 VS Code 中打开一个文件夹 / 工作区。
3. 打开命令面板（`Ctrl+Shift+P` / `Cmd+Shift+P`），运行任意 **AI Archive** 命令。

### 一键安装到日常 VS Code

在项目根目录执行：

```bash
bash scripts/install-local-vscode.sh
```

该脚本会自动完成：

- 检查 `node` / `npm`（若缺失则通过 `nvm` 安装 LTS）
- 安装依赖（存在 `package-lock.json` 时使用 `npm ci`）
- 构建并打包扩展（`npm run package`）
- 将生成的 `.vsix` 安装到本机 VS Code（`code` 或 `code-insiders`）

---

## 命令用法

### AI Archive: Save Current Chat

命令会先尝试自动抓取当前 Copilot Chat 对话内容，再分析转录文本并自动预填充归档表单。

可自动补全的字段包括：

- **主题** *(必填)* — 用于生成简短文件名 slug。
- **项目标签** *(可选)* — 会尽量从路径、模块名中识别。
- **关键词** *(可选)* — 会从代码术语、文件名、技术栈线索中提取。
- **摘要 / 最终决策** *(可选)* — 会根据对话内容自动总结。
- **行动项** *(可选)* — 会从 TODO 风格或祈使句中提取。
- **原始备注** *(可选)* — 默认留空，供人工补充。

默认情况下，命令会先尝试自动抓取当前 Copilot Chat 对话内容。
若抓取失败，会进入重试流程（`Retry Capture` / `Paste Clipboard`），避免误保存空归档。

写入文件前，扩展还会自动执行：

- 解码 URI 编码的本地路径，保证中文等 Unicode 路径可读。
- 对转录内容和元数据中的常见敏感信息做掩码。
- 确保归档目录被 Git 忽略。

会话文件将写入：

```
docs/yyyy_mm_dd_hhmmss_<short-topic>.md
```

文件名中的主题部分会被截短，以避免文件名过长，同时时间戳保证可排序。

如果文件已存在且 `aiArchive.appendOnConflict` 为 `true`（默认），则会追加一个分隔块，而不是覆盖文件。

### AI Archive: Open Session Index

根据当前直接保存在 `docs/` 下的时间戳会话文件，重新生成 `docs/ai-sessions-index.md`，然后打开该索引文件。

索引中包含：

- 归档日期
- 主题
- 项目标签
- 关键词

### AI Archive: Search Archives

搜索 `docs/` 下的时间戳会话文件以及 `docs/ai-faq.md`。

行为特性：

- 会先基于已有归档提取关键词、标签和主题作为搜索建议。
- 支持直接选择建议项，也支持输入自定义搜索词。
- 返回每个文件中的所有匹配行，而不只是第一个匹配。
- 选中结果后会打开文件并滚动到对应行。

---

## 生成的目录 / 文件结构

```
<workspace-root>/
└── docs/
    ├── ai-faq.md                               ← FAQ / 常见知识库
    ├── ai-sessions-index.md                    ← 自动生成的归档索引
    └── yyyy_mm_dd_hhmmss_<short-topic>.md      ← 单个会话归档
```

---

## 配置

所有设置均位于 VS Code 设置中的 `aiArchive` 命名空间下：

| 设置 | 默认值 | 描述 |
|---|---|---|
| `aiArchive.baseDir` | `"docs"` | 相对于工作区根目录的基础目录 |
| `aiArchive.sessionsDirName` | `"ai-sessions"` | 为兼容旧版本保留的遗留配置 |
| `aiArchive.faqFileName` | `"ai-faq.md"` | 基础目录下的 FAQ 文件名 |
| `aiArchive.appendOnConflict` | `true` | 文件已存在时追加分隔块而非覆盖 |
| `aiArchive.autoCaptureFromChat` | `true` | 在输入流程前尝试自动抓取 Copilot Chat 内容 |
| `aiArchive.requireTranscript` | `true` | 抓取失败时要求重试/粘贴流程，防止空记录 |

---

## 会话文件模板

每个会话文件使用以下结构：

```markdown
# <topic>

**Date:** YYYY-MM-DD HH:MM:SS
**Project:** <workspace-name>
**Tag:** <project-tag>
**Keywords:** <keywords>

---

## Summary / Final Decision

<summary>

---

## Action Items

<action-items>

---

## Copilot Chat Transcript

<masked-transcript>

---

## Raw Notes

<raw-notes>
```

---

## 限制

- 该扩展**不会**直接访问 Copilot Chat API 内部或以编程方式提取对话日志 — Copilot 未提供公开的 API 来实现这一点。
- 当前对话抓取采用“尽力而为”方式（VS Code 聊天复制命令 + 剪贴板流程），并非稳定公开 API。
- 若你的 VS Code / Copilot 版本不支持聊天复制命令，请先手动复制对话，再在保存流程中选择 `Paste Clipboard`。
- 搜索为纯文本、不区分大小写。
- 敏感信息掩码基于实用规则匹配，可以显著降低泄露风险，但不应视为完美的数据防泄漏系统。

---

## 开发

```bash
npm install
npm run compile   # 单次构建
npm run watch     # 增量监听构建
npm run lint      # ESLint
npm run security:scan
```

在 VS Code 中按 **F5** 可打开扩展开发宿主进行手动测试。

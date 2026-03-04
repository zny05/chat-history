# AI Archive: 聊天历史

一个用于将 Copilot 聊天历史归档并整理到项目 Markdown 文件中的 VS Code 扩展，为 AI 辅助开发会话构建持久化、可搜索的知识库。

[English](./README.md)

---

## 功能

| 命令 | 描述 |
|---|---|
| **AI Archive: Save Current Chat** | 提示输入会话详情并写入结构化 Markdown 文件 |
| **AI Archive: Open Session Index** | 打开（或创建）`docs/ai-sessions/README.md` |
| **AI Archive: Search Archives** | 搜索所有会话文件并打开匹配的文件 |

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

通过一系列输入提示引导你完成保存：

- **主题** *(必填)* — 作为文件名（自动转为 slug 格式）。
- **项目标签** *(可选)* — 例如 `backend`、`feature/auth`。
- **关键词** *(可选)* — 逗号分隔。
- **摘要 / 最终决策** *(可选)*。
- **行动项** *(可选)* — 多个条目用 `; ` 分隔。
- **原始备注** *(可选)* — 任何附加上下文。

默认情况下，命令会先尝试自动抓取当前 Copilot Chat 对话内容。
若抓取失败，会进入重试流程（`Retry Capture` / `Paste Clipboard`），避免误保存空归档。

会话文件将写入：

```
docs/ai-sessions/YYYY-MM/<topic>.md
```

如果文件已存在且 `aiArchive.appendOnConflict` 为 `true`（默认），则会追加一个分隔块，而不是覆盖文件。

### AI Archive: Open Session Index

打开 `docs/ai-sessions/README.md`。如果文件不存在，将自动创建并包含使用说明和目录结构规范。

### AI Archive: Search Archives

提示输入搜索文本，然后在 `docs/ai-sessions/` 下的所有 `*.md` 文件（以及 `docs/ai-faq.md`）中进行搜索。结果以 QuickPick 列表形式展示，包含相对文件路径和第一个匹配行的片段。选择结果后将打开文件并滚动到匹配行。

---

## 生成的目录 / 文件结构

```
<workspace-root>/
└── docs/
    ├── ai-faq.md                  ← FAQ / 常见知识库
    └── ai-sessions/
        ├── README.md              ← 会话索引
        └── YYYY-MM/
            └── <topic>.md         ← 单个会话归档
```

---

## 配置

所有设置均位于 VS Code 设置中的 `aiArchive` 命名空间下：

| 设置 | 默认值 | 描述 |
|---|---|---|
| `aiArchive.baseDir` | `"docs"` | 相对于工作区根目录的基础目录 |
| `aiArchive.sessionsDirName` | `"ai-sessions"` | 基础目录下的会话子目录名称 |
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

## Raw Notes

<raw-notes>
```

---

## 限制

- 该扩展**不会**直接访问 Copilot Chat API 内部或以编程方式提取对话日志 — Copilot 未提供公开的 API 来实现这一点。
- 当前对话抓取采用“尽力而为”方式（VS Code 聊天复制命令 + 剪贴板流程），并非稳定公开 API。
- 若你的 VS Code / Copilot 版本不支持聊天复制命令，请先手动复制对话，再在保存流程中选择 `Paste Clipboard`。
- 搜索为纯文本、不区分大小写，每个文件返回第一个匹配行。

---

## 开发

```bash
npm install
npm run compile   # 单次构建
npm run watch     # 增量监听构建
npm run lint      # ESLint
```

在 VS Code 中按 **F5** 可打开扩展开发宿主进行手动测试。

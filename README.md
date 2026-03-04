# AI Archive: Chat History

A VS Code extension for archiving and organizing Copilot Chat history into
project markdown files, enabling a persistent, searchable knowledge base for
AI-assisted development sessions.

[中文文档](./README.zh-CN.md)

---

## Features

| Command | Description |
|---|---|
| **AI Archive: Save Current Chat** | Prompt for session details and write a structured markdown file |
| **AI Archive: Open Session Index** | Open (or create) `docs/ai-sessions/README.md` |
| **AI Archive: Search Archives** | Search all session files and open the matching one |

On first activation the extension also bootstraps `docs/ai-faq.md` with
starter sections for recurring knowledge.

---

## Quick Start

1. Install the extension (or clone and press **F5** to launch the Extension
   Development Host).
2. Open a folder / workspace in VS Code.
3. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run one of
   the **AI Archive** commands.

### One-command local install (daily VS Code)

From the project root, run:

```bash
bash scripts/install-local-vscode.sh
```

This script will:

- Ensure `node` / `npm` are available (installs LTS via `nvm` if needed)
- Install dependencies (`npm ci` when `package-lock.json` exists)
- Build and package the extension (`npm run package`)
- Install the generated `.vsix` into your local VS Code (`code` or `code-insiders`)

---

## Command Usage

### AI Archive: Save Current Chat

Walks you through a series of input prompts:

- **Topic** *(required)* — becomes the file name (slugified).
- **Project tag** *(optional)* — e.g. `backend`, `feature/auth`.
- **Keywords** *(optional)* — comma-separated.
- **Summary / final decision** *(optional)*.
- **Action items** *(optional)* — separate multiple items with `; `.
- **Raw notes** *(optional)* — any additional context.

By default, the command first tries to auto-capture the active Copilot Chat transcript.
If capture fails, it opens a retry flow (`Retry Capture` / `Paste Clipboard`) so you don't accidentally save an empty archive.

The session is written to:

```
docs/ai-sessions/YYYY-MM/<topic>.md
```

If the file already exists and `aiArchive.appendOnConflict` is `true`
(default), a separator block is appended rather than overwriting the file.

### AI Archive: Open Session Index

Opens `docs/ai-sessions/README.md`.  The file is created with usage
instructions and folder-structure conventions if it does not yet exist.

### AI Archive: Search Archives

Prompts for search text, then searches all `*.md` files under
`docs/ai-sessions/` (and `docs/ai-faq.md`).  Results are shown in a
QuickPick list with the relative file path and first matching line snippet.
Selecting a result opens the file and scrolls to the matching line.

---

## Generated Folder / File Structure

```
<workspace-root>/
└── docs/
    ├── ai-faq.md                  ← FAQ / recurring knowledge base
    └── ai-sessions/
        ├── README.md              ← session index
        └── YYYY-MM/
            └── <topic>.md         ← individual session archive
```

---

## Configuration

All settings are under the `aiArchive` namespace in VS Code settings:

| Setting | Default | Description |
|---|---|---|
| `aiArchive.baseDir` | `"docs"` | Base directory relative to workspace root |
| `aiArchive.sessionsDirName` | `"ai-sessions"` | Sessions sub-directory name |
| `aiArchive.faqFileName` | `"ai-faq.md"` | FAQ file name |
| `aiArchive.appendOnConflict` | `true` | Append to existing file instead of overwriting |
| `aiArchive.autoCaptureFromChat` | `true` | Try to auto-capture Copilot Chat transcript before prompts |
| `aiArchive.requireTranscript` | `true` | If capture fails, require retry/paste flow before saving |

---

## Session File Template

Each session file uses this structure:

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

## Limitations

- The extension does **not** directly access Copilot Chat API internals or
-  extract conversation logs through a stable public API — current capture is
  best-effort via VS Code chat copy commands / clipboard flow.
- If your VS Code/Copilot build does not support chat copy commands, use
  `Paste Clipboard` in the save flow after copying chat content manually.
- Searching is plain-text, case-insensitive, and returns the first matching
  line per file.

---

## Development

```bash
npm install
npm run compile   # one-off build
npm run watch     # incremental watch build
npm run lint      # ESLint
```

Press **F5** in VS Code to open an Extension Development Host for manual
testing.

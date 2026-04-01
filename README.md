# AI Archive: Chat History

A VS Code extension for archiving and organizing Copilot Chat history into
project markdown files, enabling a persistent, searchable knowledge base for
AI-assisted development sessions.

[中文文档](./README.zh-CN.md)

---

## Features

| Command | Description |
|---|---|
| **AI Archive: Save Current Chat** | Auto-capture the current Copilot Chat, pre-fill metadata, mask secrets, and save a structured markdown archive |
| **AI Archive: Open Session Index** | Regenerate and open `docs/ai-sessions-index.md` from the current archived sessions |
| **AI Archive: Search Archives** | Suggest indexed terms, search archived sessions and FAQ, and jump to matching lines |

Security defaults:

- The archive target directory is automatically added to `.gitignore` when saving.
- Sensitive values in transcript content and metadata are masked before writing (`password`, `token`, `api key`, bearer tokens, common key prefixes).
- Packaging runs a mandatory secret scan (`npm run security:scan`) before creating VSIX.
- Session files use a compact timestamped filename format directly under `docs/`.

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

The command first tries to auto-capture the active Copilot Chat transcript, then analyzes it and pre-fills the archive form for you.

Auto-filled fields include:

- **Topic** *(required)* — used to derive the short filename slug.
- **Project tag** *(optional)* — inferred from paths/modules when possible.
- **Keywords** *(optional)* — extracted from code terms, file names, and tech stack hints.
- **Summary / final decision** *(optional)* — inferred from the transcript.
- **Action items** *(optional)* — inferred from TODO-style and imperative lines.
- **Raw notes** *(optional)* — still free-form and left empty by default.

By default, the command first tries to auto-capture the active Copilot Chat transcript.
If capture fails, it opens a retry flow (`Retry Capture` / `Paste Clipboard`) so you don't accidentally save an empty archive.

Before writing the file, the extension also:

- Decodes URI-encoded local paths so Chinese and other Unicode paths stay readable.
- Masks common secrets in both transcript content and metadata.
- Ensures the archive directory is ignored by Git.

The session is written to:

```
docs/yyyy_mm_dd_hhmmss_<short-topic>.md
```

The filename slug is trimmed to keep names manageable, and the timestamp keeps files sortable.

If the file already exists and `aiArchive.appendOnConflict` is `true`
(default), a separator block is appended rather than overwriting the file.

### AI Archive: Open Session Index

Regenerates `docs/ai-sessions-index.md` from the current timestamped session files
stored directly under `docs/`, then opens the index file.

The index includes:

- Archive date
- Topic
- Project tag
- Keywords

### AI Archive: Search Archives

Searches the timestamped session files in `docs/` and `docs/ai-faq.md`.

Behavior:

- Suggests keywords, tags, and topics extracted from existing archives.
- Supports choosing a suggested term or entering a custom query.
- Returns all matching lines, not just the first match per file.
- Opens the selected result and scrolls to the matching line.

---

## Generated Folder / File Structure

```
<workspace-root>/
└── docs/
  ├── ai-faq.md                               ← FAQ / recurring knowledge base
  ├── ai-sessions-index.md                    ← auto-generated archive index
  └── yyyy_mm_dd_hhmmss_<short-topic>.md      ← individual session archive
```

---

## Configuration

All settings are under the `aiArchive` namespace in VS Code settings:

| Setting | Default | Description |
|---|---|---|
| `aiArchive.baseDir` | `"docs"` | Base directory relative to workspace root |
| `aiArchive.sessionsDirName` | `"ai-sessions"` | Legacy setting kept for backward compatibility |
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

## Copilot Chat Transcript

<masked-transcript>

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
- Search is plain-text and case-insensitive.
- Secret masking uses practical pattern matching, so it reduces leakage risk but should not be treated as a perfect DLP system.

---

## Development

```bash
npm install
npm run compile   # one-off build
npm run watch     # incremental watch build
npm run lint      # ESLint
npm run security:scan
```

Press **F5** in VS Code to open an Extension Development Host for manual
testing.

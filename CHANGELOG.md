# Changelog

更新日志（中英双语）

## [4.0.0] - 2026-04-01

### Security / 安全

- **Automatic secret masking on save**: All chat transcripts are now passed through `maskSensitiveText()` before being written to disk. Tokens (GitHub OAuth/PAT, OpenAI `sk-`, AWS AKIA, Bearer headers) and generic `api_key/password/secret` assignments are replaced with `REDACTED`.
  **保存时自动掩码敏感信息**：所有对话转录内容在写入磁盘前均经过 `maskSensitiveText()` 处理，GitHub Token、OpenAI Key、AWS 密钥、Bearer 头以及通用 `api_key/password/secret` 赋值均替换为 `REDACTED`。

- **Auto .gitignore protection**: When saving a chat session, the extension automatically adds the archive destination directory (`docs/`) to the workspace `.gitignore`, preventing accidental commit or push of chat history files.
  **自动写入 .gitignore 保护**：保存对话时，扩展自动将归档目标目录（`docs/`）添加到工作区 `.gitignore`，防止聊天记录被意外提交或推送。

- **Pre-publish mandatory security scan**: `npm run package` now runs `scripts/security-scan.js` before packaging. If any secrets are detected, the build fails immediately.
  **发布前强制安全扫描**：`npm run package` 打包前会自动执行 `scripts/security-scan.js`，检测到明文密钥即中止打包。

- **Machine-level Git pre-push hook**: A global Git hooks path (`~/.git-hooks/pre-push`) is configured to scan for secret patterns before every push on any new or existing repository on this machine.
  **机器级 Git pre-push 钩子**：全局 Git 钩子路径（`~/.git-hooks/pre-push`）已配置，对本机上任意新建或现有仓库在每次 push 前自动扫描密钥模式。

- **Historical token remediation**: All committed plaintext `gho_` OAuth tokens in the repository have been replaced with `REDACTED` across docs and source files.
  **历史 token 补救**：仓库中所有已提交的明文 `gho_` OAuth token 均已替换为 `REDACTED`。

- **Security utilities module**: Added `src/utils/securityUtils.ts` with `maskSensitiveText()` as a reusable, tested masking utility shared across commands.
  **安全工具模块**：新增 `src/utils/securityUtils.ts`，提供可复用的 `maskSensitiveText()` 掩码函数，供所有命令模块共用。

- **Security tutorial doc**: Added `docs/git-security-tutorial.md` — a teaching-level guide covering global pre-push hooks, token revocation, `.gitignore` best practices, and secret scanning for developers.
  **安全教程文档**：新增 `docs/git-security-tutorial.md`，涵盖全局 pre-push 钩子配置、Token 撤销、`.gitignore` 最佳实践及密钥扫描的教学级文档。

## [3.0.1] - 2026-04-01

### Changed / 变更
- Session files are now saved directly in `docs/` (no more `ai-sessions/YYYY-MM/` subdirectories).
  对话记录现在直接保存在 `docs/` 目录下，不再创建 `ai-sessions/YYYY-MM/` 子目录。
- File names use the format `yyyy_mm_dd_hhmmss_short-topic.md` (max 40-char slug), eliminating long unmaintainable filenames.
  文件名采用 `yyyy_mm_dd_hhmmss_简短主题.md` 格式（主题部分最多 40 个字符），避免文件名过长。
- Session index is now regenerated as `docs/ai-sessions-index.md`.
  会话索引现在生成为 `docs/ai-sessions-index.md`。
- Search Archives now scans `docs/` directly for timestamped session files.
  搜索归档现在直接扫描 `docs/` 目录中的时间戳命名文件。

## [3.0.0] - 2026-03-31

### Added / 新增
- Auto-extract metadata from chat transcripts: topic, project tag, keywords, summary, and action items are now pre-filled when saving a session — no manual typing required.
  保存对话时自动从转录内容提取元数据（主题、项目标签、关键词、摘要、行动项），所有字段均自动预填充，无需手动输入。
- Session index (`Open Session Index`) now auto-scans all archived files and generates a live summary table sorted by date.
  会话索引（Open Session Index）现在自动扫描所有归档文件，生成按日期倒序排列的实时汇总表格。
- Search (`Search Archives`) now collects keywords/tags from all sessions as QuickPick suggestions before prompting free-text input.
  搜索（Search Archives）现在从所有会话提取关键词/标签作为 QuickPick 候选项，同时支持自定义搜索词。
- Search now returns all matching lines per file, not just the first match.
  搜索结果改为返回每个文件的所有匹配行，而非仅第一个匹配。

## [2.0.0] - 2026-03-31

### Fixed / 修复
- Fixed URI-encoded Chinese characters in local file paths within archived chat transcripts. Paths like `%E4%B8%AD%E6%96%87` are now correctly decoded to original Chinese text before saving.
  修复归档对话转录中本地文件路径的中文 URI 编码问题。保存前会将路径中的 `%E4%B8%AD%E6%96%87` 等编码正确还原为中文。

## [1.2.1] - 2026-03-05

### Fixed / 修复
- Completely bypassed `path.relative()` in display logic to eliminate Unicode encoding issues in information messages.
  完全绕过 `path.relative()` 在显示逻辑中的使用，消除信息提示中 Unicode 编码问题。
- Now directly uses `path.basename()` to extract month folder and filename, ensuring proper display of Chinese characters.
  改用 `path.basename()` 直接提取月份文件夹和文件名，确保中文字符正确显示。

## [1.2.0] - 2026-03-05

### Fixed / 修复
- Fixed message display encoding when showing archived session file paths containing Chinese characters.
  修复包含中文字符的会话文件路径在信息提示中显示为 URL 编码（%XX%XX...）的问题。
- Improved search results display to show only month and filename (e.g., "2026-03 / topic.md") for better readability.
  优化搜索结果显示，仅显示月份和文件名（如"2026-03 / topic.md"）以提升可读性。

## [1.1.0] - 2026-03-05

### Fixed / 修复
- Improved session filename generation to correctly handle Unicode titles (e.g. Chinese), preventing garbled names.
	优化会话文件名生成逻辑，正确处理 Unicode 标题（如中文），避免出现乱码文件名。
- Added URI-decoding support for topic text such as `%E6%B2%B3...`, so encoded titles are saved as readable names.
	新增对 `%E6%B2%B3...` 这类 URI 编码标题的解码支持，保存时可还原为可读名称。
- Added a fallback filename when title slug is empty, avoiding invalid or blank filenames.
	当标题清洗结果为空时，新增兜底文件名，避免出现空文件名或无效命名。

### Changed / 变更
- Added extension icon support and packaged icon asset in VSIX.
	新增扩展图标支持，并将图标资源打包进 VSIX。

## [0.1.0] - 2026-03-02

### Added / 新增
- **AI Archive: Save Current Chat** command — prompts for session details and writes a structured markdown file under `docs/ai-sessions/YYYY-MM/<topic>.md`.
	**AI Archive: Save Current Chat** 命令 —— 引导填写会话信息，并将结构化 Markdown 保存到 `docs/ai-sessions/YYYY-MM/<topic>.md`。
- **AI Archive: Open Session Index** command — opens (or creates) `docs/ai-sessions/README.md`.
	**AI Archive: Open Session Index** 命令 —— 打开（或自动创建）`docs/ai-sessions/README.md`。
- **AI Archive: Search Archives** command — searches all session files and `docs/ai-faq.md` with plain-text, case-insensitive matching; results are shown in a QuickPick list.
	**AI Archive: Search Archives** 命令 —— 以纯文本、不区分大小写方式搜索会话文件与 `docs/ai-faq.md`，并通过 QuickPick 展示结果。
- Auto-bootstrap of `docs/ai-faq.md` with starter sections on first activation.
	首次激活时自动初始化 `docs/ai-faq.md`（含基础章节模板）。
- Configuration options: `aiArchive.baseDir`, `aiArchive.sessionsDirName`, `aiArchive.faqFileName`, `aiArchive.appendOnConflict`.
	配置项支持：`aiArchive.baseDir`、`aiArchive.sessionsDirName`、`aiArchive.faqFileName`、`aiArchive.appendOnConflict`。

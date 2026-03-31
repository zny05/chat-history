# Changelog

更新日志（中英双语）

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

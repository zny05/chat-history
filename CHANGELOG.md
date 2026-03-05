# Changelog

更新日志（中英双语）

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

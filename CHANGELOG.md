# Changelog

## [0.1.0] - 2026-03-02

### Added
- **AI Archive: Save Current Chat** command — prompts for session details and writes a structured markdown file under `docs/ai-sessions/YYYY-MM/<topic>.md`.
- **AI Archive: Open Session Index** command — opens (or creates) `docs/ai-sessions/README.md`.
- **AI Archive: Search Archives** command — searches all session files and `docs/ai-faq.md` with plain-text, case-insensitive matching; results are shown in a QuickPick list.
- Auto-bootstrap of `docs/ai-faq.md` with starter sections on first activation.
- Configuration options: `aiArchive.baseDir`, `aiArchive.sessionsDirName`, `aiArchive.faqFileName`, `aiArchive.appendOnConflict`.

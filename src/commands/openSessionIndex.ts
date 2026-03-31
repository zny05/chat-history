import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  getBaseDir,
  requireWorkspaceRoot,
  writeFile,
  findMarkdownFiles,
} from '../utils/fileUtils';

const INDEX_HEADER = `# AI Sessions — Index

> This directory contains archived Copilot/AI chat sessions for this project.
> Files are named: \`yyyy_mm_dd_hhmmss_topic.md\` (saved directly in \`docs/\`).
> **This index is auto-generated each time the command is run.**

---

`;

/** Matches timestamped session filenames: 2026_03_31_154815_topic.md */
const SESSION_FILE_RE = /^\d{4}_\d{2}_\d{2}_\d{6}_.*\.md$/;

/**
 * Extracts lightweight metadata from a session markdown file's YAML-like header.
 */
function extractSessionMeta(filePath: string): {
  topic: string;
  date: string;
  keywords: string;
  tag: string;
} | null {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const topicMatch = content.match(/^#\s+(.+)$/m);
  const dateMatch = content.match(/^\*\*Date:\*\*\s*(.+)$/m);
  const keywordsMatch = content.match(/^\*\*Keywords:\*\*\s*(.+)$/m);
  const tagMatch = content.match(/^\*\*Tag:\*\*\s*(.+)$/m);

  return {
    topic: topicMatch?.[1]?.trim() || path.basename(filePath, '.md'),
    date: dateMatch?.[1]?.trim() || '',
    keywords: keywordsMatch?.[1]?.trim() || '',
    tag: tagMatch?.[1]?.trim() || '',
  };
}

/**
 * Builds a full session index with a table of all archived sessions.
 */
function buildSessionIndex(docsDir: string): string {
  // Only include timestamped session files directly in docsDir (non-recursive)
  const mdFiles: string[] = [];
  if (fs.existsSync(docsDir)) {
    for (const entry of fs.readdirSync(docsDir, { withFileTypes: true })) {
      if (entry.isFile() && SESSION_FILE_RE.test(entry.name)) {
        mdFiles.push(path.join(docsDir, entry.name));
      }
    }
  }

  if (mdFiles.length === 0) {
    return (
      INDEX_HEADER +
      '_No sessions archived yet. Run **AI Archive: Save Current Chat** to create one._\n'
    );
  }

  // Collect metadata and sort by date descending
  const entries = mdFiles
    .map((f) => ({ file: f, meta: extractSessionMeta(f) }))
    .filter((e) => e.meta !== null)
    .sort((a, b) => (b.meta!.date || '').localeCompare(a.meta!.date || ''));

  let body = INDEX_HEADER;
  body += `| Date | Topic | Tag | Keywords |\n`;
  body += `|------|-------|-----|----------|\n`;

  for (const { file, meta } of entries) {
    const fileName = path.basename(file);
    const displayTopic = `[${meta!.topic}](${fileName})`;
    body += `| ${meta!.date || '-'} | ${displayTopic} | ${meta!.tag || '-'} | ${meta!.keywords || '-'} |\n`;
  }

  body += `\n---\n\n_Auto-generated · ${entries.length} session(s) total_\n`;
  return body;
}

/**
 * Command: AI Archive — Open Session Index
 *
 * Every invocation regenerates the index from the actual session files,
 * so it always reflects the latest archive state.
 */
export async function openSessionIndex(): Promise<void> {
  let root: string;
  try {
    root = requireWorkspaceRoot();
  } catch (err) {
    vscode.window.showErrorMessage((err as Error).message);
    return;
  }

  const config = vscode.workspace.getConfiguration('aiArchive');
  const baseDir = config.get<string>('baseDir', getBaseDir());
  const docsDir = path.join(root, baseDir);
  const indexPath = path.join(docsDir, 'ai-sessions-index.md');

  // Always regenerate from current session files
  const indexContent = buildSessionIndex(docsDir);
  writeFile(indexPath, indexContent);

  const doc = await vscode.workspace.openTextDocument(indexPath);
  await vscode.window.showTextDocument(doc);

  vscode.window.showInformationMessage('Session index updated.');
}

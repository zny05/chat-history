import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Returns the resolved base directory for AI Archive files.
 */
export function getBaseDir(): string {
  const config = vscode.workspace.getConfiguration('aiArchive');
  return config.get<string>('baseDir', 'docs');
}

/**
 * Returns the resolved sessions directory name.
 */
export function getSessionsDirName(): string {
  const config = vscode.workspace.getConfiguration('aiArchive');
  return config.get<string>('sessionsDirName', 'ai-sessions');
}

/**
 * Returns the FAQ file name.
 */
export function getFaqFileName(): string {
  const config = vscode.workspace.getConfiguration('aiArchive');
  return config.get<string>('faqFileName', 'ai-faq.md');
}

/**
 * Returns whether to append on conflict.
 */
export function getAppendOnConflict(): boolean {
  const config = vscode.workspace.getConfiguration('aiArchive');
  return config.get<boolean>('appendOnConflict', true);
}

/**
 * Gets the workspace root, throwing an actionable error if none is open.
 */
export function requireWorkspaceRoot(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    throw new Error(
      'No workspace folder is open. Please open a folder or workspace first.'
    );
  }
  return folders[0].uri.fsPath;
}

/**
 * Converts a string into a URL/file-system friendly slug.
 */
export function slugify(text: string): string {
  const trimmed = text.trim();

  let decoded = trimmed;
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
    try {
      decoded = decodeURIComponent(trimmed);
    } catch {
      try {
        decoded = decodeURI(trimmed);
      } catch {
        decoded = trimmed;
      }
    }
  }

  return decoded
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120);
}

/**
 * Returns a YYYY-MM string for the given date.
 */
export function yearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Returns an ISO-8601-like local datetime string (no timezone).
 */
export function localDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Ensures a directory exists (creates recursively if needed).
 */
export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Writes content to a file, creating parent directories as needed.
 */
export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Appends content to a file (creates if missing).
 */
export function appendFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, content, 'utf8');
}

/**
 * Reads a file and returns its text, or null if it does not exist.
 */
export function readFileOrNull(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Recursively finds all .md files under a directory.
 */
export function findMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) {
    return results;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

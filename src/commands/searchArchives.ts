import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  getBaseDir,
  getSessionsDirName,
  getFaqFileName,
  requireWorkspaceRoot,
  findMarkdownFiles,
} from '../utils/fileUtils';

interface SearchResult {
  label: string;
  description: string;
  filePath: string;
  lineIndex: number;
}

/**
 * Searches all markdown files under the sessions directory (and the FAQ file)
 * for lines that contain the given query string (case-insensitive).
 */
function searchFiles(
  files: string[],
  query: string,
  root: string
): SearchResult[] {
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const filePath of files) {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        // Extract month folder and filename for clean display (avoids encoding issues)
        const pathParts = path.relative(root, filePath).split(path.sep);
        const displayLabel =
          pathParts.length >= 2
            ? `${pathParts[pathParts.length - 2]} / ${pathParts[pathParts.length - 1]}`
            : path.basename(filePath);
        
        results.push({
          label: displayLabel,
          description: `line ${i + 1}: ${lines[i].trim().substring(0, 100)}`,
          filePath,
          lineIndex: i,
        });
        break;
      }
    }
  }
  return results;
}

/**
 * Command: AI Archive — Search Archives
 */
export async function searchArchives(): Promise<void> {
  let root: string;
  try {
    root = requireWorkspaceRoot();
  } catch (err) {
    vscode.window.showErrorMessage((err as Error).message);
    return;
  }

  // Prompt for search text
  const query = await vscode.window.showInputBox({
    prompt: 'Search AI archives',
    placeHolder: 'Enter keywords to search',
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim() ? undefined : 'Please enter a search term'),
  });
  if (!query?.trim()) {
    return;
  }

  const config = vscode.workspace.getConfiguration('aiArchive');
  const baseDir = config.get<string>('baseDir', getBaseDir());
  const sessionsDirName = config.get<string>('sessionsDirName', getSessionsDirName());
  const faqFileName = config.get<string>('faqFileName', getFaqFileName());

  const sessionsDir = path.join(root, baseDir, sessionsDirName);
  const faqPath = path.join(root, baseDir, faqFileName);

  const mdFiles = findMarkdownFiles(sessionsDir);
  if (fs.existsSync(faqPath)) {
    mdFiles.push(faqPath);
  }

  if (mdFiles.length === 0) {
    vscode.window.showInformationMessage(
      'No archive files found. Run "AI Archive: Save Current Chat" to create one.'
    );
    return;
  }

  const results = searchFiles(mdFiles, query.trim(), root);

  if (results.length === 0) {
    vscode.window.showInformationMessage(`No results found for "${query}".`);
    return;
  }

  const picks = results.map((r) => ({
    label: r.label,
    description: r.description,
    result: r,
  }));

  const selected = await vscode.window.showQuickPick(picks, {
    placeHolder: `${results.length} result(s) for "${query}" — select to open`,
    matchOnDescription: true,
  });

  if (!selected) {
    return;
  }

  const doc = await vscode.workspace.openTextDocument(selected.result.filePath);
  const editor = await vscode.window.showTextDocument(doc);

  // Reveal the matching line
  const line = selected.result.lineIndex;
  const range = doc.lineAt(line).range;
  editor.selection = new vscode.Selection(range.start, range.end);
  editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
}

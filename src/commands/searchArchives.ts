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
 * Collect all keywords and topics from session metadata headers
 * to offer as quick-pick suggestions.
 */
function collectIndexedTerms(files: string[]): string[] {
  const termCounts = new Map<string, number>();

  for (const filePath of files) {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    // Extract Keywords line
    const kwMatch = content.match(/^\*\*Keywords:\*\*\s*(.+)$/m);
    if (kwMatch) {
      const kws = kwMatch[1].split(/[,，;；]/).map((k) => k.trim()).filter(Boolean);
      for (const kw of kws) {
        if (kw !== '(none)') {
          termCounts.set(kw, (termCounts.get(kw) || 0) + 1);
        }
      }
    }

    // Extract Tag line
    const tagMatch = content.match(/^\*\*Tag:\*\*\s*(.+)$/m);
    if (tagMatch) {
      const tags = tagMatch[1].split(/[,，;；]/).map((t) => t.trim()).filter(Boolean);
      for (const t of tags) {
        termCounts.set(t, (termCounts.get(t) || 0) + 1);
      }
    }

    // Extract Topic (H1)
    const topicMatch = content.match(/^#\s+(.+)$/m);
    if (topicMatch) {
      termCounts.set(topicMatch[1].trim(), (termCounts.get(topicMatch[1].trim()) || 0) + 1);
    }
  }

  return [...termCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term);
}

/**
 * Searches all markdown files for lines matching the query (case-insensitive).
 * Now returns ALL matching lines per file (not just the first).
 */
function searchFiles(
  files: string[],
  query: string
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
    const fileName = path.basename(filePath);
    const monthFolder = path.basename(path.dirname(filePath));
    const displayLabel = `${monthFolder} / ${fileName}`;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        results.push({
          label: displayLabel,
          description: `line ${i + 1}: ${lines[i].trim().substring(0, 100)}`,
          filePath,
          lineIndex: i,
        });
      }
    }
  }
  return results;
}

/**
 * Command: AI Archive — Search Archives
 *
 * Offers auto-suggested keywords from existing sessions, then searches
 * all session files and the FAQ file. Returns all matching lines.
 */
export async function searchArchives(): Promise<void> {
  let root: string;
  try {
    root = requireWorkspaceRoot();
  } catch (err) {
    vscode.window.showErrorMessage((err as Error).message);
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

  // Collect indexed terms for suggestions
  const suggestedTerms = collectIndexedTerms(mdFiles);

  let query: string | undefined;

  if (suggestedTerms.length > 0) {
    // Show a QuickPick with suggestions + free-text option
    const CUSTOM_LABEL = '$(search) Enter custom search text…';
    const picks = [
      { label: CUSTOM_LABEL, description: 'Type your own search query', alwaysShow: true },
      ...suggestedTerms.slice(0, 30).map((t) => ({
        label: t,
        description: '',
        alwaysShow: false,
      })),
    ];

    const selected = await vscode.window.showQuickPick(picks, {
      placeHolder: 'Select a keyword or choose custom search',
      matchOnDescription: true,
    });

    if (!selected) {
      return;
    }

    if (selected.label === CUSTOM_LABEL) {
      query = await vscode.window.showInputBox({
        prompt: 'Search AI archives',
        placeHolder: 'Enter keywords to search',
        ignoreFocusOut: true,
        validateInput: (v) => (v.trim() ? undefined : 'Please enter a search term'),
      });
    } else {
      query = selected.label;
    }
  } else {
    query = await vscode.window.showInputBox({
      prompt: 'Search AI archives',
      placeHolder: 'Enter keywords to search',
      ignoreFocusOut: true,
      validateInput: (v) => (v.trim() ? undefined : 'Please enter a search term'),
    });
  }

  if (!query?.trim()) {
    return;
  }

  const results = searchFiles(mdFiles, query.trim());

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

  const line = selected.result.lineIndex;
  const range = doc.lineAt(line).range;
  editor.selection = new vscode.Selection(range.start, range.end);
  editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
}

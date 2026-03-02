import * as vscode from 'vscode';
import * as path from 'path';
import {
  getBaseDir,
  getSessionsDirName,
  getAppendOnConflict,
  requireWorkspaceRoot,
  slugify,
  yearMonth,
  localDateTime,
  writeFile,
  appendFile,
  readFileOrNull,
} from '../utils/fileUtils';

/**
 * Builds the markdown content for a new session entry.
 */
function buildSessionBlock(
  topic: string,
  projectTag: string,
  keywords: string,
  summary: string,
  actionItems: string,
  rawNotes: string,
  projectName: string,
  now: Date
): string {
  return `# ${topic}

**Date:** ${localDateTime(now)}
**Project:** ${projectName}${projectTag ? `  \n**Tag:** ${projectTag}` : ''}
**Keywords:** ${keywords || '(none)'}

---

## Summary / Final Decision

${summary || '(no summary provided)'}

---

## Action Items

${actionItems || '(none)'}

---

## Raw Notes

${rawNotes || '(none)'}
`;
}

/**
 * Builds the separator block prepended when appending to an existing file.
 */
function buildAppendSeparator(now: Date): string {
  return `\n\n---\n<!-- Appended on ${localDateTime(now)} -->\n\n`;
}

/**
 * Command: AI Archive — Save Current Chat
 */
export async function saveCurrentChat(): Promise<void> {
  // 1. Validate workspace
  let root: string;
  try {
    root = requireWorkspaceRoot();
  } catch (err) {
    vscode.window.showErrorMessage((err as Error).message);
    return;
  }

  // 2. Prompt for topic (required)
  const topic = await vscode.window.showInputBox({
    prompt: 'Session title / topic',
    placeHolder: 'e.g. Refactor auth module',
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim() ? undefined : 'Topic is required'),
  });
  if (topic === undefined) {
    return; // user cancelled
  }

  // 3. Prompt for optional project tag
  const projectTag = await vscode.window.showInputBox({
    prompt: 'Project tag (optional)',
    placeHolder: 'e.g. backend, feature/auth',
    ignoreFocusOut: true,
  });
  if (projectTag === undefined) {
    return;
  }

  // 4. Prompt for keywords
  const keywords = await vscode.window.showInputBox({
    prompt: 'Keywords (comma-separated, optional)',
    placeHolder: 'e.g. authentication, JWT, middleware',
    ignoreFocusOut: true,
  });
  if (keywords === undefined) {
    return;
  }

  // 5. Prompt for summary/notes
  const summary = await vscode.window.showInputBox({
    prompt: 'Summary / final decision',
    placeHolder: 'Brief description of what was decided or learned',
    ignoreFocusOut: true,
  });
  if (summary === undefined) {
    return;
  }

  const actionItems = await vscode.window.showInputBox({
    prompt: 'Action items (use "; " to separate multiple items, optional)',
    placeHolder: 'e.g. Write unit tests; Update docs',
    ignoreFocusOut: true,
  });
  if (actionItems === undefined) {
    return;
  }

  const rawNotes = await vscode.window.showInputBox({
    prompt: 'Raw notes (optional)',
    placeHolder: 'Any additional context or observations',
    ignoreFocusOut: true,
  });
  if (rawNotes === undefined) {
    return;
  }

  // 6. Determine file path
  const now = new Date();
  const config = vscode.workspace.getConfiguration('aiArchive');
  const baseDir = config.get<string>('baseDir', getBaseDir());
  const sessionsDirName = config.get<string>('sessionsDirName', getSessionsDirName());
  const monthDir = path.join(root, baseDir, sessionsDirName, yearMonth(now));
  const fileName = `${slugify(topic.trim())}.md`;
  const filePath = path.join(monthDir, fileName);

  // 7. Build content
  const projectName =
    vscode.workspace.workspaceFolders?.[0]?.name ?? path.basename(root);
  const block = buildSessionBlock(
    topic.trim(),
    projectTag?.trim() ?? '',
    keywords?.trim() ?? '',
    summary?.trim() ?? '',
    actionItems?.trim() ?? '',
    rawNotes?.trim() ?? '',
    projectName,
    now
  );

  // 8. Write or append
  const existing = readFileOrNull(filePath);
  const appendOnConflict = getAppendOnConflict();

  if (existing && appendOnConflict) {
    appendFile(filePath, buildAppendSeparator(now) + block);
  } else {
    writeFile(filePath, block);
  }

  // 9. Open the file
  const doc = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(doc);

  vscode.window.showInformationMessage(
    `Session archived: ${path.relative(root, filePath)}`
  );
}

import * as vscode from 'vscode';
import * as path from 'path';
import {
  getBaseDir,
  getSessionsDirName,
  requireWorkspaceRoot,
  writeFile,
  readFileOrNull,
} from '../utils/fileUtils';

const INDEX_CONTENT = `# AI Sessions — Index

> This directory contains archived Copilot/AI chat sessions for this project.
> Files are organised by month: \`YYYY-MM/<topic>.md\`.

---

## Folder Structure

\`\`\`
docs/
└── ai-sessions/
    ├── README.md          ← this file
    ├── YYYY-MM/
    │   └── <topic>.md
    └── ...
\`\`\`

## Usage

- Run **AI Archive: Save Current Chat** to create a new session file.
- Each file contains a summary, action items, and raw notes.
- Run **AI Archive: Search Archives** to search across all sessions.

## Conventions

- Topic file names are slugified from the session title.
- If a file already exists for a topic, a separator block is appended
  (configurable via \`aiArchive.appendOnConflict\`).
`;

/**
 * Command: AI Archive — Open Session Index
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
  const sessionsDirName = config.get<string>('sessionsDirName', getSessionsDirName());
  const indexPath = path.join(root, baseDir, sessionsDirName, 'README.md');

  if (!readFileOrNull(indexPath)) {
    writeFile(indexPath, INDEX_CONTENT);
    vscode.window.showInformationMessage('Session index created.');
  }

  const doc = await vscode.workspace.openTextDocument(indexPath);
  await vscode.window.showTextDocument(doc);
}

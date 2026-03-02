import * as vscode from 'vscode';
import { saveCurrentChat } from './commands/saveCurrentChat';
import { openSessionIndex } from './commands/openSessionIndex';
import { searchArchives } from './commands/searchArchives';
import { ensureFaqFile } from './utils/faqHelper';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('aiArchive.saveCurrentChat', async () => {
      try {
        await saveCurrentChat();
      } catch (err) {
        vscode.window.showErrorMessage(`AI Archive error: ${(err as Error).message}`);
      }
    }),

    vscode.commands.registerCommand('aiArchive.openSessionIndex', async () => {
      try {
        await openSessionIndex();
      } catch (err) {
        vscode.window.showErrorMessage(`AI Archive error: ${(err as Error).message}`);
      }
    }),

    vscode.commands.registerCommand('aiArchive.searchArchives', async () => {
      try {
        await searchArchives();
      } catch (err) {
        vscode.window.showErrorMessage(`AI Archive error: ${(err as Error).message}`);
      }
    })
  );

  // Ensure FAQ file exists when extension is activated in a workspace
  if (vscode.workspace.workspaceFolders?.length) {
    try {
      ensureFaqFile();
    } catch {
      // silently skip — workspace may not be fully ready
    }
  }
}

export function deactivate(): void {
  // nothing to clean up
}

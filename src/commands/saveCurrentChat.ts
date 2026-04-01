import * as vscode from 'vscode';
import * as path from 'path';
import {
  getBaseDir,
  getAppendOnConflict,
  requireWorkspaceRoot,
  slugify,
  fileTimestamp,
  localDateTime,
  writeFile,
  appendFile,
  readFileOrNull,
  ensureGitignoreContains,
} from '../utils/fileUtils';
import { analyzeTranscript } from '../utils/transcriptAnalyzer';
import { maskSensitiveText } from '../utils/securityUtils';

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeClipboardText(text: string): string {
  return text.replace(/\r\n/g, '\n').trim();
}

/**
 * Decodes percent-encoded sequences (e.g. %E4%B8%AD → 中) commonly
 * found in URI-style paths copied from VS Code chat panels.
 */
function decodeUriEncodedPaths(text: string): string {
  return text.replace(/(%[0-9A-Fa-f]{2})+/g, (match) => {
    try {
      return decodeURIComponent(match);
    } catch {
      return match;
    }
  });
}

async function tryFocusChatView(): Promise<void> {
  const focusCommands = [
    'workbench.panel.chat.view.copilot.focus',
    'workbench.action.chat.open',
    'workbench.action.chat.focus',
  ];

  for (const commandId of focusCommands) {
    try {
      await vscode.commands.executeCommand(commandId);
      await sleep(60);
      return;
    } catch {
      continue;
    }
  }
}

async function tryCaptureChatTranscript(): Promise<string> {
  const candidateCommands = [
    'workbench.action.chat.copyAll',
    'workbench.action.chat.copyAllFromSession',
    'github.copilot.chat.copyAll',
    'github.copilot.copyAll',
    'workbench.action.chat.copyLastResponse',
  ];
  const availableCommands = new Set(await vscode.commands.getCommands(true));

  const originalClipboard = await vscode.env.clipboard.readText();
  const marker = `__ai_archive_probe_${Date.now()}_${Math.random().toString(36).slice(2)}__`;

  for (const commandId of candidateCommands) {
    if (!availableCommands.has(commandId)) {
      continue;
    }

    try {
      await tryFocusChatView();
      await vscode.env.clipboard.writeText(marker);
      await vscode.commands.executeCommand(commandId);
      await sleep(280);
      const after = normalizeClipboardText(await vscode.env.clipboard.readText());

      if (after && after !== marker) {
        await vscode.env.clipboard.writeText(originalClipboard);
        return after;
      }
    } catch {
      continue;
    }
  }

  await vscode.env.clipboard.writeText(originalClipboard);
  return '';
}

async function resolveTranscript(options: {
  autoCaptureFromChat: boolean;
  requireTranscript: boolean;
}): Promise<string | undefined> {
  let transcript = '';

  if (options.autoCaptureFromChat) {
    transcript = await tryCaptureChatTranscript();
    if (transcript) {
      return transcript;
    }
  }

  if (!options.requireTranscript) {
    return '';
  }

  while (!transcript) {
    const choice = await vscode.window.showWarningMessage(
      'Could not auto-capture Copilot chat transcript. Keep the Copilot Chat panel focused and choose Retry, or choose Paste Clipboard.',
      { modal: true },
      'Retry Capture',
      'Paste Clipboard'
    );

    if (!choice) {
      return undefined;
    }

    if (choice === 'Retry Capture') {
      transcript = await tryCaptureChatTranscript();
      if (transcript) {
        return transcript;
      }
      continue;
    }

    if (choice === 'Paste Clipboard') {
      const clip = normalizeClipboardText(await vscode.env.clipboard.readText());
      if (clip) {
        return clip;
      }

      vscode.window.showWarningMessage(
        'Clipboard is empty. Copy the Copilot chat first, then try again.'
      );
      continue;
    }
  }

  return transcript;
}

/**
 * Builds the markdown content for a new session entry.
 */
function buildSessionBlock(
  topic: string,
  projectTag: string,
  keywords: string,
  summary: string,
  actionItems: string,
  transcript: string,
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

## Copilot Chat Transcript

${transcript || '(not captured)'}

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

  const config = vscode.workspace.getConfiguration('aiArchive');
  const autoCaptureFromChat = config.get<boolean>('autoCaptureFromChat', true);
  const requireTranscript = config.get<boolean>('requireTranscript', true);

  const autoCapturedTranscript = await resolveTranscript({
    autoCaptureFromChat,
    requireTranscript,
  });
  if (autoCapturedTranscript === undefined) {
    return;
  }

  // ── Auto-extract metadata from the transcript ──────────────────────
  const analysis = analyzeTranscript(autoCapturedTranscript);
  const projectName =
    vscode.workspace.workspaceFolders?.[0]?.name ?? path.basename(root);

  // 2. Prompt for topic — pre-filled with extracted topic
  const topic = await vscode.window.showInputBox({
    prompt: 'Session title / topic  (auto-detected — press Enter to accept)',
    value: analysis.topic,
    placeHolder: 'e.g. Refactor auth module',
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim() ? undefined : 'Topic is required'),
  });
  if (topic === undefined) {
    return;
  }

  // 3. Prompt for project tag — pre-filled
  const projectTag = await vscode.window.showInputBox({
    prompt: 'Project tag  (auto-detected — press Enter to accept, or clear to skip)',
    value: analysis.projectTag,
    placeHolder: 'e.g. backend, feature/auth',
    ignoreFocusOut: true,
  });
  if (projectTag === undefined) {
    return;
  }

  // 4. Keywords — pre-filled
  const keywords = await vscode.window.showInputBox({
    prompt: 'Keywords  (auto-detected — press Enter to accept, or edit)',
    value: analysis.keywords,
    placeHolder: 'e.g. authentication, JWT, middleware',
    ignoreFocusOut: true,
  });
  if (keywords === undefined) {
    return;
  }

  // 5. Summary — pre-filled
  const summary = await vscode.window.showInputBox({
    prompt: 'Summary / final decision  (auto-detected — press Enter to accept)',
    value: analysis.summary,
    placeHolder: 'Brief description of what was decided or learned',
    ignoreFocusOut: true,
  });
  if (summary === undefined) {
    return;
  }

  // 6. Action items — pre-filled
  const actionItems = await vscode.window.showInputBox({
    prompt: 'Action items  (auto-detected — press Enter to accept, use "; " to separate)',
    value: analysis.actionItems,
    placeHolder: 'e.g. Write unit tests; Update docs',
    ignoreFocusOut: true,
  });
  if (actionItems === undefined) {
    return;
  }

  // 7. Raw notes — leave empty (no meaningful auto value)
  const rawNotes = await vscode.window.showInputBox({
    prompt: 'Raw notes (optional)',
    placeHolder: 'Any additional context or observations',
    ignoreFocusOut: true,
  });
  if (rawNotes === undefined) {
    return;
  }

  // 8. Determine file path
  const now = new Date();
  const baseDir = config.get<string>('baseDir', getBaseDir());
  ensureGitignoreContains(root, baseDir);
  const maskedTopic = maskSensitiveText(topic.trim());
  const maskedProjectTag = maskSensitiveText(projectTag?.trim() ?? '');
  const maskedKeywords = maskSensitiveText(keywords?.trim() ?? '');
  const topicSlug = slugify(maskedTopic).slice(0, 40).replace(/-+$/, '');
  const timestamp = fileTimestamp(now);
  const fileName = `${timestamp}_${topicSlug || 'session'}.md`;
  const filePath = path.join(root, baseDir, fileName);

  const maskedSummary = maskSensitiveText(summary?.trim() ?? '');
  const maskedActionItems = maskSensitiveText(actionItems?.trim() ?? '');
  const maskedTranscript = maskSensitiveText(
    decodeUriEncodedPaths(autoCapturedTranscript.trim())
  );
  const maskedRawNotes = maskSensitiveText(rawNotes?.trim() ?? '');

  // 9. Build content
  const block = buildSessionBlock(
    maskedTopic,
    maskedProjectTag,
    maskedKeywords,
    maskedSummary,
    maskedActionItems,
    maskedTranscript,
    maskedRawNotes,
    projectName,
    now
  );

  // 10. Write or append
  const existing = readFileOrNull(filePath);
  const appendOnConflict = getAppendOnConflict();

  if (existing && appendOnConflict) {
    appendFile(filePath, buildAppendSeparator(now) + block);
  } else {
    writeFile(filePath, block);
  }

  // 11. Open the file
  const doc = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(doc);

  vscode.window.showInformationMessage(
    `✓ Session archived: ${fileName}`
  );

  if (!autoCapturedTranscript && autoCaptureFromChat) {
    vscode.window.showWarningMessage(
      'Chat transcript was not auto-captured. Keep Copilot Chat focused and use Retry Capture, or copy/paste it via clipboard.'
    );
  }
}

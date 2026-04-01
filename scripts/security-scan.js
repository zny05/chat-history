#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const ignoreDirs = new Set(['.git', 'node_modules', 'out']);
const ignoreExt = new Set(['.vsix', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.lock']);

const rules = [
  { name: 'GitHub Token', pattern: /\b(gh[opusr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g },
  { name: 'OpenAI Key', pattern: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { name: 'AWS Access Key', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Slack Token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g },
  {
    name: 'Generic Secret Assignment',
    pattern: /\b(api[_-]?key|token|password|passwd|secret)\b\s*[:=]\s*(["']?)(?!REDACTED\b)[A-Za-z0-9._\-]{12,}\2/gi,
  },
];

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github' && entry.name !== '.vscode') {
      if (entry.name !== '.env' && entry.name !== '.env.local') {
        if (entry.isDirectory()) {
          continue;
        }
      }
    }
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) {
        continue;
      }
      walk(full, out);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (ignoreExt.has(ext)) {
      continue;
    }
    out.push(rel);
  }
}

function scanFile(relPath) {
  const full = path.join(root, relPath);
  let text;
  try {
    text = fs.readFileSync(full, 'utf8');
  } catch {
    return [];
  }

  const findings = [];
  for (const rule of rules) {
    let m;
    while ((m = rule.pattern.exec(text)) !== null) {
      const index = m.index || 0;
      const line = text.slice(0, index).split('\n').length;
      findings.push({ rule: rule.name, file: relPath, line });
    }
    rule.pattern.lastIndex = 0;
  }
  return findings;
}

const files = [];
walk(root, files);
const findings = files.flatMap(scanFile);

if (findings.length > 0) {
  console.error('Security scan failed. Potential secrets detected:');
  for (const f of findings) {
    console.error(`- ${f.rule}: ${f.file}:${f.line}`);
  }
  process.exit(1);
}

console.log('Security scan passed. No obvious secrets detected.');

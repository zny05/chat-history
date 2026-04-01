/**
 * Masks sensitive credentials in text to reduce accidental secret leakage.
 */
export function maskSensitiveText(text: string): string {
  if (!text) {
    return text;
  }

  const rules: Array<{ pattern: RegExp; replacement: string }> = [
    {
      // GitHub OAuth/PAT token prefixes
      pattern: /\b(gh[opusr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
      replacement: 'REDACTED',
    },
    {
      // OpenAI-like API keys
      pattern: /\bsk-[A-Za-z0-9]{20,}\b/g,
      replacement: 'REDACTED',
    },
    {
      // AWS access key id
      pattern: /\bAKIA[0-9A-Z]{16}\b/g,
      replacement: 'REDACTED',
    },
    {
      // Generic api_key or token assignment
      pattern: /(api[_-]?key|token|password|passwd|secret)\s*[:=]\s*(["'])?[^\s"'`]{6,}\2?/gi,
      replacement: '$1: REDACTED',
    },
    {
      // Bearer tokens
      pattern: /(Authorization\s*:\s*Bearer\s+)[A-Za-z0-9._\-]+/gi,
      replacement: '$1REDACTED',
    },
  ];

  return rules.reduce((acc, rule) => acc.replace(rule.pattern, rule.replacement), text);
}

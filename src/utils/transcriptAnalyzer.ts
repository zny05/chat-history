/**
 * Analyzes a Copilot Chat transcript and extracts structured metadata
 * (topic, project tag, keywords, summary, action items) to auto-fill
 * the session archive form — reducing manual input errors and effort.
 */

export interface TranscriptAnalysis {
  topic: string;
  projectTag: string;
  keywords: string;
  summary: string;
  actionItems: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/* ------------------------------------------------------------------ */
/*  Transcript Parsing                                                 */
/* ------------------------------------------------------------------ */

/**
 * Parse a Copilot Chat transcript (as copied via "Copy All") into
 * a sequence of user/assistant messages.
 *
 * Handles formats:
 *   User: …          / GitHub Copilot: …
 *   **User:**  …     / **GitHub Copilot:** …
 *   ## User           / ## GitHub Copilot
 */
function parseMessages(transcript: string): Message[] {
  const messages: Message[] = [];

  // Split on lines that start with a role label
  const parts = transcript.split(
    /\n(?=(?:\*{0,2})(?:User|GitHub Copilot|Copilot|Assistant)\s*(?:\*{0,2})\s*[:：])/i
  );

  const rolePattern =
    /^(?:\*{0,2})(?:#{0,3}\s*)?(User|GitHub Copilot|Copilot|Assistant)\s*(?:\*{0,2})\s*[:：]\s*/i;

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const match = trimmed.match(rolePattern);
    if (match) {
      const roleText = match[1].toLowerCase();
      const role: 'user' | 'assistant' =
        roleText === 'user' ? 'user' : 'assistant';
      const content = trimmed.substring(match[0].length).trim();
      if (content) {
        messages.push({ role, content });
      }
    } else if (messages.length === 0 && trimmed.length > 0) {
      // Treat leading text without a role label as a user message
      messages.push({ role: 'user', content: trimmed });
    }
  }

  return messages;
}

/* ------------------------------------------------------------------ */
/*  Topic Extraction                                                   */
/* ------------------------------------------------------------------ */

function extractTopic(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) {
    return '';
  }

  const lines = firstUser.content.split('\n').filter((l) => l.trim());
  let topic = lines[0] || '';

  // Strip markdown formatting
  topic = topic
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .trim();

  if (topic.length > 80) {
    topic = topic.substring(0, 77).replace(/\s+\S*$/, '') + '…';
  }

  return topic;
}

/* ------------------------------------------------------------------ */
/*  Project Tag Extraction                                             */
/* ------------------------------------------------------------------ */

function extractProjectTag(transcript: string): string {
  const tags = new Set<string>();

  // Common top-level project areas mentioned explicitly
  const areaPattern =
    /\b(frontend|backend|server|client|mobile|web|desktop|cli|core|shared|common|infra(?:structure)?|devops|api)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = areaPattern.exec(transcript)) !== null) {
    tags.add(m[1].toLowerCase());
  }

  // Paths like src/<area>/, lib/<area>/, app/<area>/
  const dirPattern =
    /(?:src|lib|app|packages?)\/([a-zA-Z][\w-]{1,28})\//g;
  while ((m = dirPattern.exec(transcript)) !== null) {
    const tag = m[1].toLowerCase();
    // Skip overly generic sub-dirs
    if (!['index', 'dist', 'out', 'build', 'node_modules', 'test', 'tests', '__tests__'].includes(tag)) {
      tags.add(tag);
    }
  }

  return [...tags].slice(0, 3).join(', ');
}

/* ------------------------------------------------------------------ */
/*  Keyword Extraction                                                 */
/* ------------------------------------------------------------------ */

const TECH_RE =
  /\b(React|Vue|Angular|Svelte|Solid|Next\.?js|Nuxt|Remix|Astro|Node\.?js|Deno|Bun|Express|Fastify|Koa|NestJS|TypeScript|JavaScript|Python|Java|Kotlin|Swift|Rust|Go|Ruby|PHP|C\+\+|C#|\.NET|Dart|Flutter|Electron|Tauri|Docker|Kubernetes|Terraform|Ansible|Redis|MongoDB|PostgreSQL|MySQL|SQLite|Prisma|Drizzle|Sequelize|GraphQL|REST|gRPC|WebSocket|tRPC|Zustand|Redux|MobX|Pinia|TailwindCSS|Tailwind|Bootstrap|Sass|Less|Vite|Webpack|Rollup|esbuild|SWC|Babel|ESLint|Prettier|Jest|Vitest|Mocha|Cypress|Playwright|Storybook|Git|GitHub|GitLab|CI\/CD|JWT|OAuth|CORS|SSR|SSG|ISR|PWA|SPA|MPA|ORM|MVC|MVVM|DI|IoC|TDD|BDD|CRUD|RBAC|S3|EC2|Lambda|CloudFront|Vercel|Netlify|Supabase|Firebase|Auth0|Stripe|OpenAI|LLM|GPT|Copilot|ChatGPT|VS\s?Code)\b/gi;

function extractKeywords(transcript: string): string {
  const counts = new Map<string, number>();

  // 1. Terms in backticks (function names, variables, commands)
  const backtickTerms = transcript.matchAll(/`([^`\n]{2,60})`/g);
  for (const [, term] of backtickTerms) {
    const clean = term.trim();
    // Skip long code snippets inside backticks
    if (/\s{3,}/.test(clean) || clean.includes('\n')) {
      continue;
    }
    const key = clean;
    counts.set(key, (counts.get(key) || 0) + 2); // weight: backticks are strong signals
  }

  // 2. File names
  const filePattern =
    /\b([\w.-]+\.(?:ts|tsx|js|jsx|py|java|kt|swift|rs|go|rb|php|c|cpp|h|hpp|cs|css|scss|sass|less|html|vue|svelte|json|ya?ml|xml|toml|md|sql|sh|ps1|dockerfile))\b/gi;
  let m: RegExpExecArray | null;
  while ((m = filePattern.exec(transcript)) !== null) {
    counts.set(m[1], (counts.get(m[1]) || 0) + 1);
  }

  // 3. Known technology terms
  while ((m = TECH_RE.exec(transcript)) !== null) {
    const key = m[1];
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // Sort by weighted frequency, deduplicate case-insensitively
  const seen = new Set<string>();
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([k]) => {
      const lower = k.toLowerCase();
      if (seen.has(lower)) {
        return false;
      }
      seen.add(lower);
      return true;
    })
    .map(([k]) => k)
    .slice(0, 12);

  return sorted.join(', ');
}

/* ------------------------------------------------------------------ */
/*  Summary Extraction                                                 */
/* ------------------------------------------------------------------ */

function extractSummary(messages: Message[]): string {
  const assistantMsgs = messages.filter((m) => m.role === 'assistant');
  if (assistantMsgs.length === 0) {
    return '';
  }

  const lastResponse = assistantMsgs[assistantMsgs.length - 1].content;

  // Look for explicit summary markers
  const summaryPatterns = [
    /(?:in summary|to summarize|to sum up|in conclusion|总结|小结|综上|概括)[,，:：\s]*\n?([\s\S]+?)(?:\n\n|\n#{1,3}\s|$)/i,
    /(?:the (?:main|key) (?:changes?|points?|takeaways?|results?)\s+(?:is|are|was|were))[,:\s]*([\s\S]+?)(?:\n\n|\n#{1,3}\s|$)/i,
  ];

  for (const pattern of summaryPatterns) {
    const match = lastResponse.match(pattern);
    if (match && match[1].trim().length > 10) {
      return trimTo(match[1].trim(), 500);
    }
  }

  // Fallback: first non-trivial paragraph of the last response
  const paragraphs = lastResponse
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 15);

  if (paragraphs.length > 0) {
    let summary = paragraphs[0]
      .replace(/^#{1,6}\s+/, '')
      .replace(/^[-*]\s+/, '');
    return trimTo(summary, 500);
  }

  return '';
}

/* ------------------------------------------------------------------ */
/*  Action Items Extraction                                            */
/* ------------------------------------------------------------------ */

function extractActionItems(messages: Message[]): string {
  const items: string[] = [];

  for (const msg of messages) {
    const content = msg.content;

    // 1. TODO / FIXME markers
    const todoPattern = /(?:TODO|FIXME|HACK|XXX)[:\s]+(.+?)(?:\n|$)/gi;
    let m: RegExpExecArray | null;
    while ((m = todoPattern.exec(content)) !== null) {
      pushUnique(items, m[1].trim());
    }

    // 2. Sections titled "next steps" / "action items" / "待办" etc.
    const sectionPattern =
      /(?:next\s+steps?|action\s+items?|to[\s-]?do|待办|下一步|接下来要做的?|后续工作)[:\s：]*\n((?:\s*[-*\d.]+\s+.+\n?)+)/gi;
    while ((m = sectionPattern.exec(content)) !== null) {
      const listItems = m[1].matchAll(/^\s*[-*\d.]+\s+(.+)$/gm);
      for (const [, item] of listItems) {
        pushUnique(items, item.trim());
      }
    }

    // 3. Imperative suggestions: "you should…", "remember to…", "请记得…"
    const imperativePattern =
      /(?:you (?:should|need to|may want to|might want to|can)|remember to|make sure (?:to )?|don't forget (?:to )?|请(?:记得|确保)|需要|建议)\s+(.+?)(?:[.。!！]\s|\n|$)/gi;
    while ((m = imperativePattern.exec(content)) !== null) {
      const item = m[1].trim();
      if (item.length > 5 && item.length < 200) {
        pushUnique(items, item);
      }
    }
  }

  return items.slice(0, 10).join('; ');
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function trimTo(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return text.substring(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

function pushUnique(arr: string[], item: string): void {
  const lower = item.toLowerCase();
  if (!arr.some((a) => a.toLowerCase() === lower)) {
    arr.push(item);
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Analyze a Copilot Chat transcript and return auto-extracted metadata.
 */
export function analyzeTranscript(transcript: string): TranscriptAnalysis {
  if (!transcript.trim()) {
    return { topic: '', projectTag: '', keywords: '', summary: '', actionItems: '' };
  }

  const messages = parseMessages(transcript);

  return {
    topic: extractTopic(messages),
    projectTag: extractProjectTag(transcript),
    keywords: extractKeywords(transcript),
    summary: extractSummary(messages),
    actionItems: extractActionItems(messages),
  };
}

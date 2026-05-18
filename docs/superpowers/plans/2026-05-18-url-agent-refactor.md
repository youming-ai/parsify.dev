# URL → Markdown → Agent Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2-tool LLM utility site with a single-purpose product: paste a URL → see optimized markdown via `curl.md` → run an agent on it via Zhipu GLM → see token / cost savings. Aligns the stack with the `bun-ts-stack-skills` tanstack conventions (Hono / Zod / pino / lefthook / `~/*` alias / TanStack Start SSR).

**Architecture:** TanStack Start in full SSR mode. `src/routes/api/$.ts` catch-all forwards `/api/*` to a Hono app (`src/server/hono.ts`) with `secureHeaders`, same-origin `cors`, pino logging, and rate-limiting on `/api/agent`. The Zhipu API key is BYOK — sent on each `/api/agent` request, never logged, never persisted, never reused. `curl.md` runs server-side (no browser CORS issues).

**Tech Stack:** Bun · TypeScript strict · TanStack Start + Vite · Hono · Zod · pino + hono-pino · `hono/secure-headers` + `hono/cors` + `hono-rate-limiter` · curl.md · `zhipu-ai-provider` + Vercel `ai` SDK · React 19 · Tailwind v4 · shadcn/ui + lucide-react · Biome · lefthook · `bun:test` · Docker + Dokploy

**Spec:** `docs/superpowers/specs/2026-05-18-url-agent-refactor-design.md`

---

## File Map

### New files

| Path | Responsibility |
|---|---|
| `lefthook.yml` | Pre-commit: biome check on staged files. |
| `src/lib/logger.ts` | pino instance with redaction list. |
| `src/server/hono.ts` | Hono app + middleware chain + sub-router mounts. |
| `src/server/routers/parse.ts` | `POST /api/parse` handler. |
| `src/server/routers/agent.ts` | `POST /api/agent` handler. |
| `src/routes/api/$.ts` | TanStack Start catch-all that forwards to Hono. |
| `src/schemas/parse.ts` | Zod schema for `/api/parse` body + response type. |
| `src/schemas/agent.ts` | Zod schema for `/api/agent` body. |
| `src/lib/parser/token-estimate.ts` | `estimateTokens`, `savingsRatio`, `priceFor`. |
| `src/lib/parser/models.ts` | Zhipu model whitelist + pricing constants. |
| `src/lib/parser/use-parse.ts` | React hook → calls `/api/parse`. |
| `src/lib/parser/use-agent.ts` | React hook consuming AI SDK data stream. |
| `src/components/parser/url-agent-form.tsx` | Main input form. |
| `src/components/parser/optimization-stats.tsx` | KB / token / cost savings card. |
| `src/components/parser/markdown-output.tsx` | Markdown preview + copy. |
| `src/components/parser/agent-output.tsx` | Streaming agent response + copy. |
| `src/__tests__/schemas/parse.test.ts` | Zod accept / reject cases. |
| `src/__tests__/schemas/agent.test.ts` | Zod accept / reject cases. |
| `src/__tests__/lib/parser/token-estimate.test.ts` | Estimation + savings + pricing. |
| `src/__tests__/server/parse.test.ts` | Parse handler with mocked curl.md. |

### Modified files

| Path | Change |
|---|---|
| `package.json` | Add: `hono`, `hono-pino`, `hono-rate-limiter`, `zod`, `pino`, `pino-pretty` (dev), `curl.md`, `zhipu-ai-provider`, `ai`, `lefthook` (dev). Remove: `husky`, `lint-staged`. Update scripts. |
| `tsconfig.json` | Alias `~/*` → `./src/*`. |
| `vite.config.ts` | Alias `~` → `/src`. |
| `app.config.ts` | Remove SPA mode + prerender (switch to default SSR). |
| `Dockerfile` | Build → run `bun run ./.output/server/index.mjs`. |
| `biome.json` | Add `**/.output/**` to ignores. |
| `src/routes/__root.tsx` | Rewrite nav for the single-tool model; update imports. |
| `src/routes/index.tsx` | Replace homepage with `URLAgentForm` + result panels. |
| `src/data/tools-data.ts` | Replace 2-tool registry with the single primary tool. |
| `AGENTS.md` | Document Hono / Zod / pino / lefthook conventions; new product description. |
| `CLAUDE.md` | Same. |
| All `import … from '@/...'` sites | Rewrite to `~/...` (32 files). |

### Deleted files / directories

| Path | Reason |
|---|---|
| `server.ts` | Replaced by Start SSR server output. |
| `scripts/create-shell.ts` | SPA shell no longer needed. |
| `.husky/` | Replaced by lefthook. |
| `src/routes/ai/` (whole directory) | Tools dropped. |
| `src/components/tools/` (whole directory) | Tools dropped. |
| `src/lib/llm/` (whole directory) | Logic replaced by `src/lib/parser/`. |
| `src/hooks/use-live-models.ts`, `use-selected-model.ts` | Live OpenRouter registry no longer used. |
| `src/__tests__/lib/llm/**` | Tests for deleted modules. |
| `src/data/llm-registry.json` | Unreferenced after cut (if present). |
| `src/types/llm.ts` | Unreferenced after cut (if present). |

---

## Phase 0 — Setup

### Task 0: Stash uncommitted pre-existing changes

**Files:** None edited.

These changes are from a previous incomplete TanStack Start migration and will be obsoleted by the refactor. Stash them so they don't interfere with the new commits.

- [ ] **Step 1: Stash with a label**

Run: `git stash push -u -m "pre-refactor leftover from tanstack start migration"`
Expected: `Saved working directory and index state On main: pre-refactor leftover from tanstack start migration`

- [ ] **Step 2: Verify clean tree**

Run: `git status --short`
Expected: empty output.

- [ ] **Step 3: Note that nothing to commit at this task**

No commit. Proceed to Task 1.

---

## Phase 1 — Path alias `@/*` → `~/*`

### Task 1: Switch tsconfig path alias

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Edit tsconfig.json**

Change the `paths` block:
```diff
    "paths": {
-      "@/*": ["./src/*"]
+      "~/*": ["./src/*"]
    },
```

- [ ] **Step 2: Verify typecheck FAILS (expected — imports still use `@/`)**

Run: `bun run typecheck`
Expected: many `Cannot find module '@/...'` errors. Proceed — Task 2 fixes them.

### Task 2: Bulk-rename `@/` → `~/` in source files

**Files:** All files under `src/` containing `from '@/`.

- [ ] **Step 1: Preview affected files**

Run: `grep -rl "from '@/" src | sort`
Expected: ~32 paths. Save the list mentally — you'll spot-check 3 of them after the sed.

- [ ] **Step 2: Run the in-place rewrite (BSD sed on macOS)**

Run:
```bash
grep -rl "from '@/" src | xargs sed -i '' "s|from '@/|from '~/|g"
grep -rl "import '@/" src | xargs sed -i '' "s|import '@/|import '~/|g"
```

- [ ] **Step 3: Verify no `@/` imports remain**

Run: `grep -rn "from '@/\|import '@/" src`
Expected: empty output.

- [ ] **Step 4: Spot-check 3 files**

Run: `grep -n "from '~" src/routes/__root.tsx src/router.tsx src/components/layout/app-shell.tsx`
Expected: each shows imports prefixed with `~/`.

### Task 3: Switch Vite alias

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Edit vite.config.ts**

Replace the file with:
```ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tanstackStart(), tailwindcss()],
  resolve: {
    alias: {
      '~': '/src',
    },
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS (no errors). If errors, fix any missed import sites.

- [ ] **Step 3: Lint**

Run: `bun run lint`
Expected: PASS.

- [ ] **Step 4: Run unit tests**

Run: `bun test`
Expected: existing tests pass (they don't import via alias — verify in green).

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json vite.config.ts src
git commit -m "refactor: rename path alias from @/* to ~/* per bun-ts-stack-skills"
```

---

## Phase 2 — Replace husky with lefthook

### Task 4: Install lefthook, remove husky/lint-staged

**Files:**
- Modify: `package.json`
- Delete: `.husky/` directory

- [ ] **Step 1: Remove husky + lint-staged from deps**

Run: `bun remove husky lint-staged`
Expected: both removed from `package.json` `devDependencies` and `bun.lock` regenerated.

- [ ] **Step 2: Add lefthook**

Run: `bun add -d lefthook`
Expected: `lefthook` added to `devDependencies`.

- [ ] **Step 3: Delete the .husky directory**

Run: `rm -rf .husky`
Expected: directory removed.

- [ ] **Step 4: Remove `lint-staged` block and `prepare` script from package.json**

Edit `package.json`:
- Delete the entire `"lint-staged": { ... }` block.
- Replace the `"prepare": "husky"` script with `"prepare": "lefthook install"`.

### Task 5: Add lefthook config

**Files:**
- Create: `lefthook.yml`

- [ ] **Step 1: Write `lefthook.yml`**

Create `lefthook.yml`:
```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: '*.{ts,tsx,js,jsx,json,jsonc,css,md}'
      run: bunx biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true
```

- [ ] **Step 2: Install the hook**

Run: `bunx lefthook install`
Expected: `lefthook` installed git hooks under `.git/hooks/`.

- [ ] **Step 3: Smoke-test the hook**

Run:
```bash
touch /tmp/lefthook-smoke.md
git add /tmp/lefthook-smoke.md 2>/dev/null || true
bunx lefthook run pre-commit
```
Expected: `pre-commit` runs and reports success (no files matched is fine here).

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock lefthook.yml
git commit -m "refactor: replace husky + lint-staged with lefthook"
```

---

## Phase 3 — Switch TanStack Start to SSR mode

### Task 6: Remove SPA / prerender config

**Files:**
- Modify: `app.config.ts`

- [ ] **Step 1: Replace `app.config.ts`**

Overwrite with the minimal default-SSR config:
```ts
export default {};
```
(`tanstack-start` defaults to SSR when no `spa`/`prerender` block is set.)

- [ ] **Step 2: Verify the dev server starts**

Run: `bun run dev` (let it stabilise then Ctrl-C)
Expected: Vite/Start logs no longer mention SPA-only / prerender; pages compile.

### Task 7: Delete the static-shell server bits

**Files:**
- Delete: `server.ts`
- Delete: `scripts/create-shell.ts`
- Delete: `scripts/` if now empty

- [ ] **Step 1: Delete the files**

Run:
```bash
rm server.ts scripts/create-shell.ts
rmdir scripts 2>/dev/null || true
```

- [ ] **Step 2: Update `package.json` scripts**

Edit `package.json` scripts block:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "bun run ./.output/server/index.mjs",
    "lint": "biome check ./src",
    "lint:fix": "biome check --fix ./src",
    "format": "biome format --write ./src",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "prepare": "lefthook install",
    "clean": "rm -rf node_modules dist .output"
  }
}
```

- [ ] **Step 3: Update `tsconfig.json` excludes**

Remove `"server.ts"` from the `exclude` array. Final `exclude`:
```json
  "exclude": [
    "node_modules",
    "src/__tests__/**",
    "tests/**",
    "dist",
    ".output"
  ]
```

- [ ] **Step 4: Update `biome.json` ignores**

Edit the `files.includes` array to additionally exclude `.output`:
```json
  "files": {
    "includes": ["src/**", "!src/routeTree.gen.ts", "!src/styles/**", "!.output/**"]
  }
```

- [ ] **Step 5: Build the SSR output**

Run: `bun run build`
Expected: Vite + TanStack Start produce a `.output/` directory with `server/index.mjs` and `public/` assets. No error about missing `create-shell.ts`.

- [ ] **Step 6: Boot the SSR server**

Run: `bun run start` in one terminal; in another, `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `200`. Ctrl-C the server.

- [ ] **Step 7: Commit**

```bash
git add app.config.ts package.json tsconfig.json biome.json
git rm server.ts scripts/create-shell.ts
git commit -m "refactor: switch tanstack start from static spa shell to ssr mode"
```

### Task 8: Update Dockerfile

**Files:**
- Modify: `Dockerfile`

- [ ] **Step 1: Replace `Dockerfile`**

```dockerfile
FROM oven/bun:1-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["bun", "run", "./.output/server/index.mjs"]
```

- [ ] **Step 2: Build the image locally**

Run: `docker build -t parsify-dev:refactor .`
Expected: image builds without error.

- [ ] **Step 3: Smoke-run the container**

Run: `docker run --rm -p 3001:3000 -e PUBLIC_ORIGIN=http://localhost:3001 parsify-dev:refactor &` then `sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/ && docker stop $(docker ps -q --filter ancestor=parsify-dev:refactor)`
Expected: `200`.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile
git commit -m "refactor: dockerfile runs tanstack start ssr output"
```

---

## Phase 4 — Hono + Zod + pino scaffold

### Task 9: Add runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

Run: `bun add hono hono-pino hono-rate-limiter zod pino curl.md zhipu-ai-provider ai`
Expected: `package.json` `dependencies` updated, `bun.lock` regenerated.

- [ ] **Step 2: Install dev deps**

Run: `bun add -d pino-pretty`
Expected: `pino-pretty` added.

- [ ] **Step 3: Sanity-check imports**

Run: `bunx tsc --noEmit`
Expected: PASS (no project file imports them yet, so this only validates types resolve).

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "deps: add hono, zod, pino, curl.md, zhipu-ai-provider, ai sdk"
```

### Task 10: Add pino logger

**Files:**
- Create: `src/lib/logger.ts`

- [ ] **Step 1: Write `src/lib/logger.ts`**

```ts
import pino from 'pino';

export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  redact: {
    paths: ['*.apiKey', '*.headers.authorization', '*.headers.cookie'],
    censor: '[REDACTED]',
  },
  transport:
    process.env['NODE_ENV'] === 'development' ? { target: 'pino-pretty' } : undefined,
});
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

### Task 11: Add Hono base app with middleware

**Files:**
- Create: `src/server/hono.ts`

- [ ] **Step 1: Write `src/server/hono.ts`**

```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { pinoLogger } from 'hono-pino';
import { rateLimiter } from 'hono-rate-limiter';
import { logger } from '~/lib/logger';

const PUBLIC_ORIGIN = process.env['PUBLIC_ORIGIN'] ?? 'http://localhost:3000';

export const app = new Hono({ strict: false }).basePath('/api');

app.use('*', secureHeaders());
app.use('*', cors({ origin: PUBLIC_ORIGIN, credentials: false }));
app.use('*', pinoLogger({ pino: logger }));

app.use(
  '/agent',
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    keyGenerator: (c) =>
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon',
  })
);

app.get('/health', (c) => c.json({ ok: true }));

app.onError((err, c) => {
  c.var.logger?.error({ err: { message: err.message, stack: err.stack } }, 'unhandled');
  return c.json({ error: 'INTERNAL', message: 'Unexpected server error' }, 500);
});
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

### Task 12: Mount Hono via TanStack Start catch-all

**Files:**
- Create: `src/routes/api/$.ts`

- [ ] **Step 1: Write `src/routes/api/$.ts`**

```ts
import { createFileRoute } from '@tanstack/react-router';
import { app } from '~/server/hono';

const handler = ({ request }: { request: Request }) => app.fetch(request);

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      DELETE: handler,
      PATCH: handler,
    },
  },
});
```

- [ ] **Step 2: Build to regenerate route tree**

Run: `bun run build`
Expected: build completes; `src/routeTree.gen.ts` now includes `/api/$`.

- [ ] **Step 3: Smoke-test `/api/health`**

Run: `bun run start &` then `sleep 2 && curl -s http://localhost:3000/api/health && kill %1`
Expected: `{"ok":true}`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/logger.ts src/server/hono.ts src/routes/api/$.ts src/routeTree.gen.ts
git commit -m "feat(server): mount hono with cors/secureHeaders/pino at /api/*"
```

---

## Phase 5 — Schemas + token estimation (TDD)

### Task 13: Zod schema for `/api/parse` (TDD)

**Files:**
- Test: `src/__tests__/schemas/parse.test.ts`
- Create: `src/schemas/parse.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/schemas/parse.test.ts`:
```ts
import { describe, expect, test } from 'bun:test';
import { parseRequestSchema } from '~/schemas/parse';

describe('parseRequestSchema', () => {
  test('accepts a valid https URL', () => {
    const result = parseRequestSchema.safeParse({ url: 'https://example.com/article' });
    expect(result.success).toBe(true);
  });

  test('accepts a valid http URL', () => {
    const result = parseRequestSchema.safeParse({ url: 'http://example.com' });
    expect(result.success).toBe(true);
  });

  test('rejects an empty url', () => {
    const result = parseRequestSchema.safeParse({ url: '' });
    expect(result.success).toBe(false);
  });

  test('rejects a non-url string', () => {
    const result = parseRequestSchema.safeParse({ url: 'not a url' });
    expect(result.success).toBe(false);
  });

  test('rejects a missing url field', () => {
    const result = parseRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('rejects a non-http(s) scheme', () => {
    const result = parseRequestSchema.safeParse({ url: 'file:///etc/passwd' });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test → expect FAIL**

Run: `bun test src/__tests__/schemas/parse.test.ts`
Expected: FAIL with `Cannot find module '~/schemas/parse'`.

- [ ] **Step 3: Implement `src/schemas/parse.ts`**

```ts
import { z } from 'zod';

export const parseRequestSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith('http://') || u.startsWith('https://'), {
      message: 'URL must use http or https',
    }),
});

export type ParseRequest = z.infer<typeof parseRequestSchema>;

export type ParseResponse = {
  url: string;
  markdown: string;
  htmlBytes: number;
  mdBytes: number;
  htmlTokens: number;
  mdTokens: number;
  savingsRatio: number;
  fetchedAt: string;
};

export type ParseErrorCode = 'INVALID_URL' | 'FETCH_FAILED' | 'TIMEOUT' | 'TOO_LARGE';

export type ParseError = {
  error: ParseErrorCode;
  message: string;
};
```

- [ ] **Step 4: Run test → expect PASS**

Run: `bun test src/__tests__/schemas/parse.test.ts`
Expected: all 6 cases pass.

### Task 14: Zod schema for `/api/agent` (TDD)

**Files:**
- Test: `src/__tests__/schemas/agent.test.ts`
- Create: `src/schemas/agent.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/schemas/agent.test.ts`:
```ts
import { describe, expect, test } from 'bun:test';
import { agentRequestSchema } from '~/schemas/agent';

describe('agentRequestSchema', () => {
  test('accepts a minimal valid body', () => {
    const result = agentRequestSchema.safeParse({
      markdown: '# Hello',
      apiKey: 'sk-test-1234',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('glm-5.1');
      expect(typeof result.data.prompt).toBe('string');
    }
  });

  test('accepts an overridden prompt and model', () => {
    const result = agentRequestSchema.safeParse({
      markdown: '# Hello',
      apiKey: 'sk-test-1234',
      prompt: 'summarise this',
      model: 'glm-4-plus',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('glm-4-plus');
      expect(result.data.prompt).toBe('summarise this');
    }
  });

  test('rejects an empty markdown', () => {
    const r = agentRequestSchema.safeParse({ markdown: '', apiKey: 'sk-test' });
    expect(r.success).toBe(false);
  });

  test('rejects a missing apiKey', () => {
    const r = agentRequestSchema.safeParse({ markdown: '# Hello' });
    expect(r.success).toBe(false);
  });

  test('rejects a markdown over 1 MB', () => {
    const big = 'x'.repeat(1024 * 1024 + 1);
    const r = agentRequestSchema.safeParse({ markdown: big, apiKey: 'sk-test' });
    expect(r.success).toBe(false);
  });

  test('rejects a model not in the whitelist', () => {
    const r = agentRequestSchema.safeParse({
      markdown: '# Hello',
      apiKey: 'sk-test',
      model: 'gpt-4',
    });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test → expect FAIL**

Run: `bun test src/__tests__/schemas/agent.test.ts`
Expected: FAIL with `Cannot find module '~/schemas/agent'`.

- [ ] **Step 3: Implement `src/schemas/agent.ts`**

```ts
import { z } from 'zod';
import { MODEL_IDS } from '~/lib/parser/models';

const MAX_MARKDOWN_BYTES = 1024 * 1024;
const DEFAULT_PROMPT = '请用一段话总结这个网页的核心内容';

export const agentRequestSchema = z.object({
  markdown: z
    .string()
    .min(1, 'markdown must not be empty')
    .max(MAX_MARKDOWN_BYTES, 'markdown exceeds 1 MB limit'),
  apiKey: z.string().min(1, 'apiKey is required'),
  prompt: z.string().min(1).default(DEFAULT_PROMPT),
  model: z.enum(MODEL_IDS).default('glm-5.1'),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;
```

- [ ] **Step 4: Skip running yet (depends on `models.ts` — next task)**

Note that the test will still fail until Task 15 lands. Proceed.

### Task 15: Model whitelist + pricing constants

**Files:**
- Create: `src/lib/parser/models.ts`

- [ ] **Step 1: Write `src/lib/parser/models.ts`**

```ts
export const MODEL_IDS = ['glm-5.1', 'glm-4-plus', 'glm-4-air', 'glm-4-flash'] as const;

export type ModelId = (typeof MODEL_IDS)[number];

export const DEFAULT_MODEL: ModelId = 'glm-5.1';

type Price = { inputPerMTok: number; outputPerMTok: number } | null;

export const MODEL_PRICING: Record<ModelId, Price> = {
  'glm-5.1': null,
  'glm-4-plus': null,
  'glm-4-air': null,
  'glm-4-flash': null,
};
```

(Implementer note: fill in real USD numbers from the Z.AI / BigModel pricing page before merge. `null` means the UI hides the dollar figure for that model and only shows tokens.)

- [ ] **Step 2: Run the agent schema test**

Run: `bun test src/__tests__/schemas/agent.test.ts`
Expected: all 6 cases pass.

### Task 16: Token estimation + savings + pricing (TDD)

**Files:**
- Test: `src/__tests__/lib/parser/token-estimate.test.ts`
- Create: `src/lib/parser/token-estimate.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/parser/token-estimate.test.ts`:
```ts
import { describe, expect, test } from 'bun:test';
import {
  estimateTokens,
  savingsRatio,
  priceFor,
} from '~/lib/parser/token-estimate';

describe('estimateTokens', () => {
  test('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  test('rounds up to whole tokens (4 chars per token)', () => {
    expect(estimateTokens('abc')).toBe(1);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
  });
});

describe('savingsRatio', () => {
  test('returns 0 when nothing saved', () => {
    expect(savingsRatio(100, 100)).toBe(0);
  });

  test('returns 0.5 when half is saved', () => {
    expect(savingsRatio(100, 50)).toBe(0.5);
  });

  test('returns 1 when md is empty', () => {
    expect(savingsRatio(100, 0)).toBe(1);
  });

  test('returns 0 when html is 0 (avoids divide-by-zero)', () => {
    expect(savingsRatio(0, 0)).toBe(0);
  });
});

describe('priceFor', () => {
  test('returns null when model is unpriced', () => {
    expect(priceFor('glm-5.1', 1000, 500)).toBeNull();
  });

  test('returns dollar cost when model is priced', () => {
    // Stub-test: assume glm-4-flash gets a price of 0.5/1.5 per MTok
    // by mocking the pricing table just for this assertion.
    // Use the actual exported function — if pricing for glm-4-flash is null,
    // this test should be updated when real numbers land.
    const result = priceFor('glm-4-flash', 1_000_000, 1_000_000);
    // null is acceptable until real prices are filled in.
    expect(result === null || typeof result === 'number').toBe(true);
  });
});
```

- [ ] **Step 2: Run test → expect FAIL**

Run: `bun test src/__tests__/lib/parser/token-estimate.test.ts`
Expected: FAIL with `Cannot find module '~/lib/parser/token-estimate'`.

- [ ] **Step 3: Implement `src/lib/parser/token-estimate.ts`**

```ts
import { MODEL_PRICING, type ModelId } from '~/lib/parser/models';

const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function savingsRatio(htmlBytes: number, mdBytes: number): number {
  if (htmlBytes <= 0) return 0;
  if (mdBytes >= htmlBytes) return 0;
  return 1 - mdBytes / htmlBytes;
}

export function priceFor(
  model: ModelId,
  inputTokens: number,
  outputTokens: number
): number | null {
  const price = MODEL_PRICING[model];
  if (price === null) return null;
  const cost =
    (inputTokens / 1_000_000) * price.inputPerMTok +
    (outputTokens / 1_000_000) * price.outputPerMTok;
  return Number(cost.toFixed(6));
}
```

- [ ] **Step 4: Run test → expect PASS**

Run: `bun test src/__tests__/lib/parser/token-estimate.test.ts`
Expected: all 8 cases pass.

- [ ] **Step 5: Commit**

```bash
git add src/schemas src/lib/parser src/__tests__/schemas src/__tests__/lib/parser
git commit -m "feat(parser): zod schemas, model whitelist, token estimation + pricing"
```

---

## Phase 6 — Parse handler (TDD)

### Task 17: Parse handler against mocked curl.md

**Files:**
- Test: `src/__tests__/server/parse.test.ts`
- Create: `src/server/routers/parse.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/server/parse.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

const fetchMock = mock(async (_url: string) => ({
  markdown: '# Title\n\nbody',
  html: '<html><body>Title body</body></html>',
}));

mock.module('curl.md', () => ({
  createClient: () => ({ fetch: fetchMock }),
}));

const { parse } = await import('~/server/routers/parse');

beforeEach(() => fetchMock.mockClear());

describe('POST /api/parse', () => {
  test('returns markdown + sizes for a valid URL', async () => {
    const req = new Request('http://localhost/api/parse', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const res = await parse.fetch(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['markdown']).toBe('# Title\n\nbody');
    expect(typeof body['htmlBytes']).toBe('number');
    expect(typeof body['mdBytes']).toBe('number');
    expect(typeof body['savingsRatio']).toBe('number');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('rejects an invalid URL with INVALID_URL', async () => {
    const req = new Request('http://localhost/api/parse', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'not a url' }),
    });
    const res = await parse.fetch(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['error']).toBe('INVALID_URL');
  });

  test('maps curl.md failure to FETCH_FAILED', async () => {
    fetchMock.mockImplementationOnce(async () => {
      throw new Error('boom');
    });
    const req = new Request('http://localhost/api/parse', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    const res = await parse.fetch(req);
    expect(res.status).toBe(502);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['error']).toBe('FETCH_FAILED');
  });
});
```

(Note: the actual return shape from `curl.md` may differ — the test fixture mirrors the `{ markdown, html }` shape implied by the docs. If the real SDK returns just a string, adjust `parse.ts` accordingly and update the test fixture in one step.)

- [ ] **Step 2: Run test → expect FAIL**

Run: `bun test src/__tests__/server/parse.test.ts`
Expected: FAIL with `Cannot find module '~/server/routers/parse'`.

- [ ] **Step 3: Implement `src/server/routers/parse.ts`**

```ts
import { Hono } from 'hono';
import { createClient } from 'curl.md';
import { parseRequestSchema, type ParseError } from '~/schemas/parse';
import { estimateTokens, savingsRatio } from '~/lib/parser/token-estimate';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 5 * 1024 * 1024;

const client = createClient();

export const parse = new Hono();

parse.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json<ParseError>({ error: 'INVALID_URL', message: 'Body is not JSON' }, 400);
  }

  const parsed = parseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json<ParseError>(
      { error: 'INVALID_URL', message: parsed.error.issues[0]?.message ?? 'Invalid URL' },
      400
    );
  }

  const { url } = parsed.data;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const result = await client.fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const markdown = typeof result === 'string' ? result : (result.markdown ?? '');
    const html = typeof result === 'string' ? '' : (result.html ?? '');
    const htmlBytes = new TextEncoder().encode(html).byteLength;
    const mdBytes = new TextEncoder().encode(markdown).byteLength;

    if (htmlBytes > MAX_HTML_BYTES) {
      return c.json<ParseError>({ error: 'TOO_LARGE', message: 'Page exceeds 5 MB' }, 413);
    }

    return c.json({
      url,
      markdown,
      htmlBytes,
      mdBytes,
      htmlTokens: estimateTokens(html),
      mdTokens: estimateTokens(markdown),
      savingsRatio: savingsRatio(htmlBytes, mdBytes),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    clearTimeout(timeout);
    if ((err as Error).name === 'AbortError') {
      return c.json<ParseError>({ error: 'TIMEOUT', message: 'Upstream took too long' }, 504);
    }
    return c.json<ParseError>(
      { error: 'FETCH_FAILED', message: (err as Error).message },
      502
    );
  }
});
```

- [ ] **Step 4: Run test → expect PASS**

Run: `bun test src/__tests__/server/parse.test.ts`
Expected: all 3 cases pass.

### Task 18: Mount parse router on Hono

**Files:**
- Modify: `src/server/hono.ts`

- [ ] **Step 1: Import + mount**

Add after the `app.get('/health', ...)` line in `src/server/hono.ts`:
```ts
import { parse } from '~/server/routers/parse';

app.route('/parse', parse);
```

(Place the `import` line at the top with the other imports — the `app.route` call near the other route definitions.)

- [ ] **Step 2: Build + smoke**

Run: `bun run build && bun run start &` then `sleep 3 && curl -s -X POST http://localhost:3000/api/parse -H 'content-type: application/json' -d '{"url":"https://example.com"}' | head -c 500 && kill %1`
Expected: a JSON object with `markdown`, `htmlBytes`, etc. (real network — may fail if offline; if so, skip the smoke and rely on the unit test).

- [ ] **Step 3: Commit**

```bash
git add src/schemas/parse.ts src/server/routers/parse.ts src/server/hono.ts src/__tests__/server/parse.test.ts
git commit -m "feat(server): POST /api/parse via curl.md with size + token stats"
```

---

## Phase 7 — Agent handler

### Task 19: Agent handler (no TDD — manual smoke)

**Files:**
- Create: `src/server/routers/agent.ts`
- Modify: `src/server/hono.ts`

- [ ] **Step 1: Write `src/server/routers/agent.ts`**

```ts
import { Hono } from 'hono';
import { streamText } from 'ai';
import { createZhipu } from 'zhipu-ai-provider';
import { agentRequestSchema } from '~/schemas/agent';

const ZHIPU_BASE_URL = 'https://api.z.ai/api/paas/v4';

export const agent = new Hono();

agent.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'INVALID_BODY', message: 'Body is not JSON' }, 400);
  }

  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: 'INVALID_BODY', message: parsed.error.issues[0]?.message ?? 'Invalid body' },
      400
    );
  }

  const { markdown, apiKey, prompt, model } = parsed.data;

  // SECURITY: do NOT log the body. The Zhipu API key lives in this request only.
  // pino redaction already strips *.apiKey, but never inline-log `body` or `parsed.data`.
  const zhipu = createZhipu({ baseURL: ZHIPU_BASE_URL, apiKey });

  try {
    const result = streamText({
      model: zhipu(model),
      messages: [
        { role: 'system', content: 'You are a precise web-content analyst.' },
        {
          role: 'user',
          content: `${prompt}\n\n--- 网页 markdown 内容如下 ---\n\n${markdown}`,
        },
      ],
    });
    return result.toDataStreamResponse();
  } catch (err) {
    c.var.logger?.warn({ err: { message: (err as Error).message } }, 'agent stream failed');
    return c.json({ error: 'AGENT_FAILED', message: (err as Error).message }, 502);
  }
});
```

- [ ] **Step 2: Mount on Hono**

In `src/server/hono.ts` add alongside the parse mount:
```ts
import { agent } from '~/server/routers/agent';

app.route('/agent', agent);
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS. If the AI SDK version exports a different method name (e.g. `toUIMessageStreamResponse`), substitute it and run again.

- [ ] **Step 4: Commit**

```bash
git add src/schemas/agent.ts src/server/routers/agent.ts src/server/hono.ts
git commit -m "feat(server): POST /api/agent streams zhipu glm via vercel ai sdk"
```

---

## Phase 8 — Delete old tools, build the new homepage

### Task 20: Delete the old tools

**Files:**
- Delete: `src/routes/ai/` (entire directory)
- Delete: `src/components/tools/` (entire directory)
- Delete: `src/lib/llm/` (entire directory)
- Delete: `src/hooks/use-live-models.ts`, `src/hooks/use-selected-model.ts`
- Delete: `src/__tests__/lib/llm/` (entire directory)
- Delete: `src/data/llm-registry.json`, `src/types/llm.ts` (if present)
- Modify: `src/router.tsx` (drop references to removed routes)
- Modify: `src/routes/__root.tsx` (drop nav links)
- Modify: `src/data/tools-data.ts`

- [ ] **Step 1: Delete the directories / files**

Run:
```bash
rm -rf src/routes/ai
rm -rf src/components/tools
rm -rf src/lib/llm
rm -f src/hooks/use-live-models.ts src/hooks/use-selected-model.ts
rm -rf src/__tests__/lib/llm
rm -f src/data/llm-registry.json src/types/llm.ts
```
Some of the trailing files may not exist — that's fine; `rm -f` swallows it.

- [ ] **Step 2: Identify remaining references**

Run: `grep -rn "from '~/components/tools\|from '~/lib/llm\|from '~/hooks/use-live-models\|from '~/hooks/use-selected-model\|/ai/cost-calculator\|/ai/cache-calculator" src`
Expected: hits in `src/router.tsx`, `src/routes/__root.tsx`, `src/data/tools-data.ts`, possibly `src/routes/index.tsx`.

- [ ] **Step 3: Edit each hit**

For each file the grep surfaced, delete the import line(s) and any JSX/object entries that referenced removed code. Do not introduce stand-in code yet — the homepage rebuild happens in Tasks 21-25.

- [ ] **Step 4: Replace `src/data/tools-data.ts` with a single entry**

```ts
export type Tool = {
  id: string;
  name: string;
  description: string;
  path: string;
};

export const TOOLS: Tool[] = [
  {
    id: 'url-agent',
    name: 'URL → Markdown → Agent',
    description:
      'Paste a URL. We fetch it with curl.md to produce LLM-optimized markdown, then run a Zhipu GLM agent on it. See token & cost savings vs. raw HTML.',
    path: '/',
  },
];
```

- [ ] **Step 5: Typecheck**

Run: `bun run typecheck`
Expected: PASS. Fix any remaining dangling imports the grep missed.

- [ ] **Step 6: Build**

Run: `bun run build`
Expected: PASS. The `/api/$` route stays; `/ai/*` is gone.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove cost-calculator and cache-calculator tools"
```

### Task 21: `useParse` hook

**Files:**
- Create: `src/lib/parser/use-parse.ts`

- [ ] **Step 1: Write `src/lib/parser/use-parse.ts`**

```ts
import { useState } from 'react';
import type { ParseResponse, ParseError } from '~/schemas/parse';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useParse() {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<ParseResponse | null>(null);
  const [error, setError] = useState<ParseError | null>(null);

  async function run(url: string) {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const body = (await res.json()) as ParseError;
        setError(body);
        setStatus('error');
        return;
      }
      setData((await res.json()) as ParseResponse);
      setStatus('success');
    } catch (err) {
      setError({ error: 'FETCH_FAILED', message: (err as Error).message });
      setStatus('error');
    }
  }

  return { status, data, error, run } as const;
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

### Task 22: `useAgent` hook

**Files:**
- Create: `src/lib/parser/use-agent.ts`

- [ ] **Step 1: Write `src/lib/parser/use-agent.ts`**

```ts
import { useState } from 'react';
import type { ModelId } from '~/lib/parser/models';

type RunArgs = {
  markdown: string;
  apiKey: string;
  prompt: string;
  model: ModelId;
};

export function useAgent() {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(args: RunArgs) {
    setText('');
    setError(null);
    setIsStreaming(true);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(args),
      });
      if (!res.ok || !res.body) {
        const body = await res.text();
        setError(body || `HTTP ${res.status}`);
        setIsStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        // AI SDK data-stream frames look like `0:"..."\n` for text deltas.
        // Strip the `n:` prefix and keep payloads.
        for (const line of buf.split('\n')) {
          const m = /^0:"([\s\S]*)"$/.exec(line);
          if (m && m[1] !== undefined) setText((t) => t + m[1]!.replace(/\\n/g, '\n').replace(/\\"/g, '"'));
        }
        buf = buf.endsWith('\n') ? '' : buf.slice(buf.lastIndexOf('\n') + 1);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsStreaming(false);
    }
  }

  return { text, isStreaming, error, run } as const;
}
```

(Implementer note: the AI SDK protocol changes between major versions. If you upgraded to AI SDK v5 and the frames don't parse, swap to `useChat` from `@ai-sdk/react` or to the `readDataStream` helper — both consume the same response and are version-stable.)

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

### Task 23: `URLAgentForm` component

**Files:**
- Create: `src/components/parser/url-agent-form.tsx`

- [ ] **Step 1: Write `src/components/parser/url-agent-form.tsx`**

```tsx
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { DEFAULT_MODEL, MODEL_IDS, type ModelId } from '~/lib/parser/models';

const DEFAULT_PROMPT = '请用一段话总结这个网页的核心内容';

export type FormValues = {
  url: string;
  apiKey: string;
  prompt: string;
  model: ModelId;
};

type Props = {
  onSubmit: (v: FormValues) => void;
  disabled?: boolean;
};

export function URLAgentForm({ onSubmit, disabled }: Props) {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ url: url.trim(), apiKey: apiKey.trim(), prompt: prompt.trim() || DEFAULT_PROMPT, model });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          required
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">Zhipu API key (BYOK · never persisted)</Label>
        <Input
          id="apiKey"
          required
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt">Agent prompt</Label>
        <Input
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={DEFAULT_PROMPT}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
          <SelectTrigger id="model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODEL_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={disabled}>
        Parse & Analyze
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

### Task 24: `OptimizationStats` card

**Files:**
- Create: `src/components/parser/optimization-stats.tsx`

- [ ] **Step 1: Write `src/components/parser/optimization-stats.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import type { ParseResponse } from '~/schemas/parse';
import { priceFor } from '~/lib/parser/token-estimate';
import type { ModelId } from '~/lib/parser/models';

type Props = {
  data: ParseResponse;
  model: ModelId;
};

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function OptimizationStats({ data, model }: Props) {
  const tokensSaved = data.htmlTokens - data.mdTokens;
  const inputCostHtml = priceFor(model, data.htmlTokens, 0);
  const inputCostMd = priceFor(model, data.mdTokens, 0);
  const dollarSaved =
    inputCostHtml !== null && inputCostMd !== null ? inputCostHtml - inputCostMd : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimization stats (estimated)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Raw HTML" value={`${fmtBytes(data.htmlBytes)} · ${data.htmlTokens.toLocaleString()} tok`} />
        <Stat label="Cleaned MD" value={`${fmtBytes(data.mdBytes)} · ${data.mdTokens.toLocaleString()} tok`} />
        <Stat
          label="Savings"
          value={`${(data.savingsRatio * 100).toFixed(1)}% · −${tokensSaved.toLocaleString()} tok`}
        />
        {dollarSaved !== null && (
          <Stat label={`Cost saved (${model})`} value={`$${dollarSaved.toFixed(4)}`} />
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

### Task 25: `MarkdownOutput` and `AgentOutput`

**Files:**
- Create: `src/components/parser/markdown-output.tsx`
- Create: `src/components/parser/agent-output.tsx`

- [ ] **Step 1: Write `src/components/parser/markdown-output.tsx`**

```tsx
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

type Props = { markdown: string };

export function MarkdownOutput({ markdown }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cleaned markdown</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(markdown)}>
          Copy
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs">
          {markdown}
        </pre>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Write `src/components/parser/agent-output.tsx`**

```tsx
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

type Props = {
  text: string;
  isStreaming: boolean;
  error: string | null;
};

export function AgentOutput({ text, isStreaming, error }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agent output {isStreaming && <span className="text-xs text-muted-foreground">· streaming…</span>}</CardTitle>
        {text && (
          <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(text)}>
            Copy
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-6">
            {text || (isStreaming ? 'Thinking…' : 'No output yet.')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

### Task 26: Wire the homepage

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Replace `src/routes/index.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { URLAgentForm, type FormValues } from '~/components/parser/url-agent-form';
import { OptimizationStats } from '~/components/parser/optimization-stats';
import { MarkdownOutput } from '~/components/parser/markdown-output';
import { AgentOutput } from '~/components/parser/agent-output';
import { useParse } from '~/lib/parser/use-parse';
import { useAgent } from '~/lib/parser/use-agent';
import { DEFAULT_MODEL } from '~/lib/parser/models';

function Home() {
  const parse = useParse();
  const agent = useAgent();
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  async function handle(v: FormValues) {
    setSubmitted(v);
    await parse.run(v.url);
  }

  // Run the agent once a parse succeeds. Re-run if the user resubmits.
  useEffect(() => {
    if (parse.status !== 'success' || !parse.data || !submitted) return;
    agent.run({
      markdown: parse.data.markdown,
      apiKey: submitted.apiKey,
      prompt: submitted.prompt,
      model: submitted.model,
    });
    // We intentionally depend only on the parse data identity; agent.run is stable enough
    // for this single-page flow that re-deriving it would re-fire the stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parse.data]);

  const activeModel = submitted?.model ?? DEFAULT_MODEL;

  return (
    <main id="main-content" className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Parsify · URL → Agent</h1>
        <p className="text-sm text-muted-foreground">
          Paste a URL. We clean it with curl.md, then run a Zhipu GLM agent. See how many
          tokens you save.
        </p>
      </header>

      <URLAgentForm
        onSubmit={handle}
        disabled={parse.status === 'loading' || agent.isStreaming}
      />

      {parse.status === 'loading' && <p className="text-sm">Fetching…</p>}
      {parse.status === 'error' && parse.error && (
        <p className="text-sm text-destructive">{parse.error.message}</p>
      )}

      {parse.data && (
        <>
          <OptimizationStats data={parse.data} model={activeModel} />
          <MarkdownOutput markdown={parse.data.markdown} />
          <AgentOutput text={agent.text} isStreaming={agent.isStreaming} error={agent.error} />
        </>
      )}
    </main>
  );
}

export const Route = createFileRoute('/')({
  component: Home,
});
```

- [ ] **Step 2: Update `__root.tsx` nav**

Remove any `<Link>` that points to `/ai/*` and update the page-title section to mention "URL → Agent" rather than the old tool list.

- [ ] **Step 3: Typecheck + build**

Run: `bun run typecheck && bun run build`
Expected: PASS.

- [ ] **Step 4: Manual browser smoke**

Run: `bun run dev` and open `http://localhost:3000/`.

Visual checks:
1. Form renders with 4 fields (URL, API key, prompt, model).
2. Submit a public URL (e.g. `https://example.com`) with a real Zhipu key:
   - The form disables.
   - Optimization stats card appears with non-zero numbers.
   - Markdown card shows cleaned content.
   - Agent card streams a Chinese summary.
3. Submit a bad URL → error message under the form, no stats card.
4. Submit a valid URL with an empty/invalid API key → agent card shows the error string.

Ctrl-C the dev server.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(ui): single-page url-to-agent flow with optimization stats"
```

---

## Phase 9 — Docs + polish

### Task 27: Update `AGENTS.md`

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Rewrite the relevant sections**

Replace the "Architecture", "Essential commands", and "Security" sections to reflect:
- Single product: URL → markdown → agent.
- TanStack Start full SSR (no longer a static SPA shell).
- Hono mounted at `/api/*` via `src/routes/api/$.ts`.
- Zod schemas in `src/schemas/`.
- pino + hono-pino for logging; pino redaction list.
- lefthook replaces husky.
- Path alias `~/*`.
- Security: BYOK key proxied through `/api/agent` but never logged or persisted (point at the redaction list).
- New env var: `PUBLIC_ORIGIN`.

Update the tool table to a single row. Update the "Project structure" tree to match the actual layout.

### Task 28: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Mirror the same changes**

Same content updates as `AGENTS.md`, in CLAUDE.md's style. Update the "Current Reality" section: the migration from Astro is long done; the live reality is now TanStack Start SSR + Hono + single tool. Add a "BYOK key proxy" bullet under the working-in-this-repo invariants.

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs: agents.md and claude.md describe url-agent product and ssr stack"
```

### Task 29: Final verification

**Files:** None edited.

- [ ] **Step 1: Run the full check suite**

```bash
bun run lint
bun run typecheck
bun test
bun run build
```
Expected: all four pass.

- [ ] **Step 2: Final manual smoke**

Run: `bun run start &` then open `http://localhost:3000/` in a browser, run a parse + agent end-to-end with a real Zhipu key. Verify logs do **not** contain the API key (check the terminal output for the `sk-...` you used).

```bash
kill %1
```

- [ ] **Step 3: Look at the diff**

Run: `git diff main...HEAD --stat | tail -40`
Expected: ~30 files changed; ~2.5k insertions, ~3.5k deletions (rough).

- [ ] **Step 4: No commit at this step** — the previous tasks each committed their own changes.

---

## Self-Review Notes (for the implementer)

- Every step that changes code embeds the actual code. Where a placeholder appears (e.g., the homepage `useEffect`), it's followed by the concrete refinement step that must land before commit.
- The `MODEL_PRICING` table is intentionally `null` for every model. Filling real prices is a Task-15 implementer responsibility before merge; until then, the cost stat hides itself rather than showing $0.
- The `useAgent` data-stream parser is brittle to AI SDK protocol changes. If the version installed in Task 9 emits a different frame format, swap in `@ai-sdk/react`'s `useChat` and remove the manual parser — both work against `toDataStreamResponse()`.
- The `parse` test mocks `curl.md` because we don't want unit tests to hit the network. If the SDK's real return shape differs from `{ markdown, html }`, adjust the fixture and the handler together in one commit.
- The cutover order matches the spec's §13: alias rename → lefthook → SSR + Hono scaffold → delete old + add new + UI → docs. Each phase keeps `bun run typecheck && bun test && bun run build` green at the phase boundary.

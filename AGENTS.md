# AGENTS.md — Parsify.dev

Privacy-first, browser-side AI/LLM developer tools. Static site (Astro 5 + React 19 islands), no SSR, no server routes.

## Essential commands

| Command | What it runs |
|---|---|
| `bun run dev` | Astro dev server |
| `bun run build` | Static build → `dist/` |
| `bun test` | `vitest run` (node env, no DOM) |
| `bun test src/__tests__/lib/llm/<file>.test.ts` | Single test file |
| `bun run lint` | `biome check ./src` |
| `bun run lint:fix` | `biome check --fix ./src` |
| `bun run typecheck` | `astro check` |
| `bun run format` | `biome format --write ./src` |

Pre-commit (husky → lint-staged): Biome `check --fix` + `vitest related --run` on staged `.ts(x)`.

## Architecture

**No server-side processing of user input** — that's the product invariant. All logic runs in the browser. Provider calls go browser-direct via BYOK. API keys live in component state only (not persisted).

**7 tools** (after Apr 2026 triage from 21 → 7):

| Tool | Route | Logic module |
|---|---|---|
| Multi-Model Token Counter | `/ai/token-counter` | (uses live-registry hooks) |
| LLM Cost Calculator | `/ai/cost-calculator` | `cost-calculator.ts` |
| Prompt Cache Calculator | `/ai/cache-calculator` | `prompt-cache.ts` |
| Rate Limit Calculator | `/ai/rate-limit-calculator` | `rate-limit-calculator.ts` |
| LLM SSE Stream Parser | `/ai/sse-parser` | `sse-parser.ts` |
| Tool Schema Converter | `/ai/tool-schema-converter` | `tool-schema-converter.ts` |
| JSONL Viewer / Editor | `/ai/jsonl-viewer` | `jsonl.ts` |

**Route → island pattern:**

- `src/pages/ai/<tool>.astro` — thin shell: imports `BaseLayout`, renders React component with `client:load`, sets `<slot name="head">` SEO
- `src/components/tools/ai/<tool>.tsx` — React island, named export (`export function TokenCounter()`)
- Astro pages use import aliases to avoid typecheck conflicts: `import { TokenCounter as TokenCounterTool } from '...'; <TokenCounterTool client:load />`
- Components use `'use client'` directive (needed for React 19 islands)
- Model selector in `shared/model-selector.tsx` fetches live model list from OpenRouter API (CORS-permitted)

**Source layout:**

```
src/
├── lib/llm/              # Pure logic (7 modules + live-registry.ts)
├── components/
│   ├── ui/               # shadcn/ui primitives — REUSE FIRST
│   └── tools/ai/
│       ├── shared/       # ModelSelector, APIKeyInput, CodeExportTabs, MetricCard,
│       │                 # JsonTextarea, RelatedTools, ProviderSelector, BYOKNotice,
│       │                 # TokenCounterBar
│       └── <tool>.tsx    # 7 tool islands
├── data/
│   ├── tools-data.ts     # 7-tool registry (5 subcategories)
│   └── llm-registry.json # 9 models, 7 providers
├── hooks/                # use-live-models.ts, use-selected-model.ts
└── __tests__/lib/llm/    # Per-module Vitest tests
```

**`@/*` → `src/*`** via tsconfig paths and Vite alias.

## Deploy (Cloudflare Workers Static Assets)

Push to `main`. Cloudflare clones, runs `bun install --frozen-lockfile && bun run build`, then `npx wrangler deploy`. The `wrangler.toml` file exists solely to prevent `wrangler deploy` from auto-running `astro add cloudflare` (which would install the SSR adapter and crash on React 19's `@phosphor-icons/react` `useContext` incompatibility). No Worker script, no SSR — just static asset hosting.

Cache/security headers in `public/_headers`: `/_astro/*` → 1y immutable, HTML → must-revalidate, all paths → `X-Frame-Options` + `X-Content-Type-Options` + `Referrer-Policy` + `Permissions-Policy`.

## Code style (Biome)

- 2-space indent, 100 char width, single quotes, JSX double quotes, semicolons always, trailing commas (ES5), LF
- Biome ignores `.astro` files (`biome.json: files.ignore: ["*.astro"]`) — Astro files are formatted by Astro's own formatter
- Enabled rules: `noUnusedVariables`/`noUnusedImports` (error), `noLabelWithoutControl` (off), `noForEach`/`useLiteralKeys` (off), `noDangerouslySetInnerHtml` (off), `noNonNullAssertion`/`noArrayIndexKey`/`noAssignInExpressions`/`noExplicitAny`/`noImplicitAnyLet` (off)
- TypeScript: strict, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`
- `import type` for type-only imports, explicit return types on exported functions

## Security

- **All user data stays client-side**: localStorage or memory only
- **API keys**: component state only, never persisted, never sent to any server (browser → provider directly)
- **No external script loading** for data processing
- **Crypto**: use `crypto.subtle` or Web Crypto API. Never `Math.random()` for security. No custom crypto.
- **No `dangerouslySetInnerHTML`** without sanitization
- **No empty catch blocks** — always show user-friendly error state
- **Coverage**: excludes `src/components/ui/**`

## Adding a new tool (workflow)

1. Add metadata to `src/data/tools-data.ts`
2. Create pure logic in `src/lib/llm/<tool>.ts`
3. Create test in `src/__tests__/lib/llm/<tool>.test.ts`
4. Create React component in `src/components/tools/ai/<tool>.tsx` (named export)
5. Create Astro route in `src/pages/ai/<tool>.astro`
6. Add related tools in `shared/related-tools.tsx`
7. Verify: `bun run lint && bun run typecheck && bun test`

*Apr 2026 — 7 tools*

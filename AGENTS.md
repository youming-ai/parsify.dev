# AGENTS.md — Parsify.dev

Single-purpose URL→Agent product. Paste a URL → **Jina Reader** (`r.jina.ai`) fetches and converts it to LLM-optimized markdown → **DeepSeek** `deepseek-v4-flash` streams a summary. Both API keys live on the server. Built with TanStack Start v1 in full SSR mode, Hono at `/api/*`, deployed via Dokploy + Docker.

## Essential commands

| Command | What it runs |
|---|---|
| `bun run dev` | Vite dev server (SSR) |
| `bun run build` | `vite build` — outputs `dist/server/server.js` + `dist/client/` |
| `bun run start` | `srvx` serves the built server bundle on port 3000 |
| `bun run typecheck` | `tsc --noEmit` |
| `bun test` | Bun test runner (no DOM) |
| `bun test src/__tests__/<path>.test.ts` | Single test file |
| `bun run lint` | `biome check ./src` |
| `bun run lint:fix` | `biome check --fix ./src` |
| `bun run format` | `biome format --write ./src` |

Pre-commit (lefthook): Biome `check --write` on staged `.{ts,tsx,js,jsx,json,jsonc,css,md}` files.

## Architecture

**TanStack Start v1 in full SSR mode** — server renders pages; no static-only output. TanStack Router handles routing. Vite 7 is the build tool.

**API layer**: Hono app (`src/server/hono.ts`) mounted at `/api/*` via a TanStack Start catch-all route (`src/routes/api/$.ts`). All HTTP methods are forwarded to `app.fetch()`.

**Validation**: Zod schemas in `src/schemas/`:
- `parseRequestSchema` — validates `url` (includes SSRF guard rejecting private/loopback/link-local hosts) and optional `objective` (max 500 chars)
- `agentRequestSchema` — validates `markdown` (≤ 1 MB) and optional `prompt`

**Logging**: pino + hono-pino. Logger configured in `src/lib/logger.ts`. Level controlled by `LOG_LEVEL` env var (default `info`). pino redacts `*.apiKey`, `*.headers.authorization`, `*.headers.cookie`. Always use `c.var.logger` in Hono route handlers — never `console.log`.

**Rate limiting**: in-memory `hono-rate-limiter` on `/api/agent` (20 req / 15 min per IP). Single-container deploy assumption; replace store if multi-instance.

**Tech stack**: TanStack Start + TanStack Router + Vite 7 + React 19 + Tailwind CSS v4 + shadcn/ui + Lucide React + Biome v2 + Bun + TypeScript strict + Zod 4 + pino + Hono 4.

**Upstream services**:
- **Jina Reader** (`https://r.jina.ai/<url>`) — anonymous 20 RPM; with `JINA_API_KEY` 500 RPM. We forward the user's prompt as `X-Instruction` to narrow extraction.
- **DeepSeek** (`https://api.deepseek.com/chat/completions`) — OpenAI-compatible SSE. Model hardcoded to `deepseek-v4-flash`. `DEEPSEEK_API_KEY` is required; missing key returns 500.

**Route → component pattern:**

- `src/routes/__root.tsx` — root layout (HTML shell, providers)
- `src/routes/index.tsx` — homepage (hero + URL form + results + features)
- `src/routes/api/$.ts` — catch-all; forwards to Hono app
- `src/server/routers/parse.ts` — `POST /api/parse` (Jina Reader proxy)
- `src/server/routers/agent.ts` — `POST /api/agent` (DeepSeek SSE proxy → plain text stream)

**Source layout:**

```
src/
├── routes/                        # TanStack Router file-based routes
│   ├── __root.tsx                 # Root layout (HTML shell, providers)
│   ├── index.tsx                  # Homepage (hero + URL form + results + features)
│   ├── 404.tsx                    # 404 page
│   └── api/
│       └── $.ts                   # Hono catch-all (all methods)
├── router.tsx                     # TanStack Router config + route tree
├── client.tsx                     # Client entry (hydration)
├── routeTree.gen.ts               # Auto-generated route tree (gitignored)
├── server/
│   ├── hono.ts                    # Hono app (CORS, pino, rate-limit, routes)
│   └── routers/
│       ├── parse.ts               # POST /api/parse (Jina Reader proxy)
│       └── agent.ts               # POST /api/agent (DeepSeek SSE proxy)
├── schemas/
│   ├── parse.ts                   # parseRequestSchema + ParseResponse types
│   └── agent.ts                   # agentRequestSchema + AgentError types
├── components/
│   ├── ui/                        # shadcn/ui primitives — REUSE FIRST
│   ├── layout/                    # app-shell, header, footer, theme-toggle
│   ├── seo/                       # head.tsx
│   ├── parser/                    # url-agent-form, markdown-output,
│   │                                agent-output, optimization-stats
│   └── link.tsx                   # TanStack Router <Link> for internal, <a> for external
├── lib/
│   ├── logger.ts                  # pino logger (redacts keys/auth/cookie)
│   ├── parser/                    # token-estimate.ts, use-parse.ts, use-agent.ts
│   ├── icon-map.ts, seo-config.ts, utils.ts
├── styles/app.css                 # Tailwind v4 entry (@theme, no JS config)
└── __tests__/
    ├── lib/parser/                # Bun tests: token-estimate
    ├── schemas/                   # Bun tests: parse schema, agent schema
    └── server/                    # Bun tests: parse route handler (mocks globalThis.fetch)
```

**`~/*` → `src/*`** via tsconfig paths and Vite alias.

**Route tree**: `src/routeTree.gen.ts` is auto-generated by TanStack Router — gitignored, regenerated on `bun run dev` or `bun run build`.

**Link component**: `src/components/link.tsx` uses TanStack Router `<Link>` for internal routes, plain `<a>` for external.

## Deploy (Dokploy + Docker)

Push to `main`. Dokploy triggers Docker build via `Dockerfile`:
1. `bun install --frozen-lockfile`
2. `bun run build` → `dist/server/server.js` + `dist/client/`
3. `CMD ["bun", "run", "start"]` — `srvx` serves on port 3000

**Required env vars:**
| Var | Required | Purpose |
|---|---|---|
| `PUBLIC_ORIGIN` | yes | Canonical origin (e.g. `https://parsify.dev`) — used for CORS `origin` |
| `DEEPSEEK_API_KEY` | yes | Server-side DeepSeek API key. `/api/agent` returns 500 (`CONFIG_ERROR`) without it. |
| `JINA_API_KEY` | no | Server-side Jina Reader key. Without it, `/api/parse` uses anonymous tier (20 RPM); with it, 500 RPM. |
| `LOG_LEVEL` | no | pino log level (default `info`); values: `trace`, `debug`, `info`, `warn`, `error` |

## Code style (Biome)

- 2-space indent, 100 char width, single quotes, JSX double quotes, semicolons always, trailing commas (ES5), LF
- Enabled rules: `noUnusedVariables`/`noUnusedImports` (error), `noLabelWithoutControl` (off), `noForEach`/`useLiteralKeys` (off), `noDangerouslySetInnerHtml` (off), `noNonNullAssertion`/`noArrayIndexKey`/`noAssignInExpressions`/`noExplicitAny`/`noImplicitAnyLet` (off)
- TypeScript: strict, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`
- `import type` for type-only imports, explicit return types on exported functions

## Security

**Server-side key invariant**: `DEEPSEEK_API_KEY` and `JINA_API_KEY` are read from `process.env` only. They are **never** sent from the browser, never logged, never persisted (no DB, no cache, no file), and never echoed back in responses. pino redaction (`*.apiKey`, `*.headers.authorization`, `*.headers.cookie`) is defense-in-depth, not the primary guard.

- **SSRF guard**: `parseRequestSchema` rejects URLs pointing to private/loopback/link-local hosts (127.x, 10.x, 172.16–31.x, 192.168.x, 169.254.x, ::1). Add validation tests in `src/__tests__/schemas/parse.test.ts` whenever the schema changes.
- **Rate limiting**: `/api/agent` is rate-limited (20 req / 15 min per IP) to cap abuse of the server-side DeepSeek key.
- **Logging**: always use `c.var.logger` (hono-pino request logger) in Hono handlers; never `console.log`. Never log request bodies — they contain the markdown payload (which could include sensitive scraped content).
- **Crypto**: use `crypto.subtle` or Web Crypto API. Never `Math.random()` for security. No custom crypto.
- **No `dangerouslySetInnerHTML`** without sanitization (root layout analytics scripts are the only exception; they are static literals, not user input).
- **No empty catch blocks** — always show user-friendly error state.
- **Coverage**: excludes `src/components/ui/**`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Reality

TanStack Start v1 in **full SSR mode** — single tool: paste a URL → `r.jina.ai` (Jina Reader) fetches and converts it to LLM-optimized markdown → a DeepSeek `deepseek-v4-flash` agent streams a summary back.

**API layer**: Hono app mounted at `/api/*` via a TanStack Start catch-all route (`src/routes/api/$.ts`).
- `POST /api/parse` — proxies to Jina Reader. Accepts `{ url, objective? }`. Sets `X-Instruction: <objective>` and `Authorization: Bearer ${JINA_API_KEY}` (if configured). Falls back to anonymous tier without a key.
- `POST /api/agent` — direct fetch to `https://api.deepseek.com/chat/completions`, OpenAI-compatible SSE. Server reads `DEEPSEEK_API_KEY` from env; returns 500 if missing. SSE frames are parsed and re-emitted as plain text chunks.

Validation via Zod schemas (`src/schemas/`). Logging via pino + hono-pino (`src/lib/logger.ts`).

**Deploy**: Dokploy + Docker. `bun run build` → `dist/server/server.js` + `dist/client/`. Container runs `bun run start`.

`AGENTS.md` is authoritative for **security rules**, **Biome code-style conventions**, and **env vars**. Read it before changing those areas.

## Commands

| Purpose | Command |
|---|---|
| Dev server | `bun run dev` |
| Build (SSR) | `bun run build` |
| Serve built output | `bun run start` |
| Typecheck | `bun run typecheck` (`tsc --noEmit`) |
| Lint / autofix | `bun run lint` / `bun run lint:fix` (Biome on `./src`) |
| Format | `bun run format` |
| All tests | `bun test` |
| Single test file | `bun test src/__tests__/<path>.test.ts` |

Pre-commit (lefthook): Biome `check --write` on staged `.{ts,tsx,js,jsx,json,jsonc,css,md}` files.

## Architecture

### Route structure

- `src/routes/__root.tsx` — root layout (HTML shell, theme bootstrap)
- `src/routes/index.tsx` — homepage; imports from `src/components/parser/`
- `src/routes/404.tsx` — 404 page
- `src/routes/api/$.ts` — catch-all; forwards all HTTP methods to `app.fetch()` (Hono)

### Source layout

```
src/
├── routes/                        # TanStack Router file-based routes
│   ├── __root.tsx
│   ├── index.tsx                  # Hero + URL form + results + features
│   ├── 404.tsx
│   └── api/$.ts                   # Hono catch-all
├── router.tsx                     # TanStack Router config + route tree
├── client.tsx                     # Client entry (hydration)
├── routeTree.gen.ts               # Auto-generated (gitignored)
├── server/
│   ├── hono.ts                    # Hono app (CORS, pino, rate-limit, routes)
│   └── routers/
│       ├── parse.ts               # POST /api/parse (Jina Reader proxy)
│       └── agent.ts               # POST /api/agent (DeepSeek SSE proxy)
├── schemas/
│   ├── parse.ts                   # parseRequestSchema (includes SSRF guard)
│   └── agent.ts                   # agentRequestSchema (markdown + optional prompt)
├── components/
│   ├── ui/                        # shadcn/ui primitives — REUSE FIRST
│   ├── layout/                    # app-shell, header, footer, theme-toggle
│   ├── seo/                       # head.tsx
│   ├── parser/                    # url-agent-form, markdown-output,
│   │                                agent-output, optimization-stats
│   └── link.tsx
├── lib/
│   ├── logger.ts                  # pino logger
│   ├── parser/                    # token-estimate.ts, use-parse.ts, use-agent.ts
│   └── icon-map.ts, seo-config.ts, utils.ts
├── styles/app.css                 # Tailwind v4 entry
└── __tests__/
    ├── lib/parser/                # token-estimate tests
    ├── schemas/                   # parse + agent schema tests
    └── server/                    # parse route handler tests
```

### TypeScript strictness — gotcha

`tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, **and** `noPropertyAccessFromIndexSignature`. The last one bites: `process.env.NODE_ENV` fails ts(4111) — must be written as `process.env['NODE_ENV']`. Same applies to any other index-signature property access.

`~/*` resolves to `src/*`.

### Testing

Bun test runner in `node` environment (no DOM). Pure-logic and route-handler tests only; UI components are not unit-tested. Tests live in `src/__tests__/`. The parse route test mocks `globalThis.fetch` to simulate Jina Reader responses.

## Working in this repo

- **Reuse `src/components/ui/`** primitives before creating new ones. Use `cn()` from `src/lib/utils.ts` for class merging.
- **Server code uses `c.var.logger`** — never `console.log` in Hono route handlers. The pino request logger is available as `c.var.logger` after the `pinoLogger` middleware runs.
- **Server-side API keys**: `DEEPSEEK_API_KEY` (required) and `JINA_API_KEY` (optional). Keys come from `process.env` only — never sent from the browser, never logged, never persisted to disk or DB. pino redaction (`*.apiKey`, `*.headers.authorization`) is defense-in-depth.
- **SSRF guard lives in `src/schemas/parse.ts`** — `parseRequestSchema` rejects private/loopback hosts. Add test coverage in `src/__tests__/schemas/parse.test.ts` whenever the schema changes.
- **Security rules from `AGENTS.md` apply**: `crypto.subtle` for crypto, never `Math.random()` for security-relevant randomness.

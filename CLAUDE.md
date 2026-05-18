# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Reality

TanStack Start v1 in **full SSR mode** — this is no longer a static SPA. The product is a single tool: paste a URL → `curl.md` fetches and converts it to LLM-optimized markdown → Zhipu GLM agent runs on the markdown → shows token/cost savings vs. raw HTML.

**API layer**: Hono app mounted at `/api/*` via a TanStack Start catch-all route (`src/routes/api/$.ts`). `POST /api/parse` fetches + converts a URL; `POST /api/agent` streams a Zhipu GLM response. Validation via Zod schemas (`src/schemas/`). Logging via pino + hono-pino (see `src/lib/logger.ts`).

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
│   ├── index.tsx                  # URL→Agent UI
│   ├── 404.tsx
│   └── api/$.ts                   # Hono catch-all
├── router.tsx                     # TanStack Router config + route tree
├── client.tsx                     # Client entry (hydration)
├── routeTree.gen.ts               # Auto-generated (gitignored)
├── server/
│   ├── hono.ts                    # Hono app (CORS, pino, rate-limit, routes)
│   └── routers/
│       ├── parse.ts               # POST /api/parse
│       └── agent.ts               # POST /api/agent (streaming)
├── schemas/
│   ├── parse.ts                   # parseRequestSchema (includes SSRF guard)
│   └── agent.ts                   # agentRequestSchema
├── components/
│   ├── ui/                        # shadcn/ui primitives — REUSE FIRST
│   ├── layout/                    # app-shell, header, footer, theme-toggle
│   ├── seo/                       # head.tsx
│   ├── parser/                    # url-agent-form, markdown-output,
│   │                                agent-output, optimization-stats
│   └── link.tsx
├── lib/
│   ├── logger.ts                  # pino logger
│   ├── parser/                    # models.ts, token-estimate.ts,
│   │                                use-parse.ts, use-agent.ts
│   └── icon-map.ts, seo-config.ts, utils.ts
├── styles/app.css                 # Tailwind v4 entry
└── __tests__/
    ├── lib/parser/                # token-estimate tests
    ├── schemas/                   # parse + agent schema tests
    └── server/                   # parse route handler tests
```

### TypeScript strictness — gotcha

`tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, **and** `noPropertyAccessFromIndexSignature`. The last one bites: `process.env.NODE_ENV` fails ts(4111) — must be written as `process.env['NODE_ENV']`. Same applies to any other index-signature property access.

`~/*` resolves to `src/*`.

### Testing

Bun test runner in `node` environment (no DOM). Pure-logic and route-handler tests only; UI components are not unit-tested. Tests live in `src/__tests__/`. Coverage excludes `src/components/ui/**`.

## Working in this repo

- **Reuse `src/components/ui/`** primitives before creating new ones. Use `cn()` from `src/lib/utils.ts` for class merging.
- **Server code uses `c.var.logger`** — never `console.log` in Hono route handlers. The pino request logger is available as `c.var.logger` after the `pinoLogger` middleware runs.
- **BYOK key proxy invariant**: The Zhipu API key exists in server memory only for the duration of one request. It must never be logged, persisted, or reused. pino redaction (`*.apiKey`) is defense-in-depth. Do not add any code that stores or echoes the key.
- **SSRF guard lives in `src/schemas/parse.ts`** — `parseRequestSchema` rejects private/loopback hosts. Add test coverage in `src/__tests__/schemas/parse.test.ts` whenever the schema changes.
- **Security rules from `AGENTS.md` apply**: `crypto.subtle` for crypto, never `Math.random()` for security-relevant randomness.

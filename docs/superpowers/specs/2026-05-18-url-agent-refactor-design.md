# URL → Markdown → Agent: Parsify Refactor

**Date:** 2026-05-18
**Status:** Approved (design phase)
**Author:** youming + Claude

## 1. Summary

Refactor `parsify.dev` from a 2-tool LLM utility site (cost-calculator, cache-calculator) into a single-purpose product: **take a URL, convert it to LLM-optimized markdown via `curl.md`, run an agent on that markdown via Zhipu GLM, and show token / cost savings vs. raw HTML.**

The two existing tools are removed. The new flow is the homepage and the product.

This refactor also aligns the project with the `bun-ts-stack-skills` / tanstack skill conventions (Hono on `/api/*`, Zod schemas, pino logging, lefthook, `~/*` path alias) where those changes are load-bearing for the new API surface or are cheap to fold in now.

## 2. Goals

- One primary user flow: paste URL → see optimized markdown + savings + agent output.
- Demonstrate concretely how much token spend `curl.md` saves vs. naïvely stuffing HTML into a context window.
- Let users bring their own Zhipu API key (BYOK) and pick a task prompt.
- Bring the codebase into alignment with the bun-ts-stack-skills tanstack stack where applicable.

## 3. Non-Goals

- No accounts, history, or saved sessions.
- No persistent DB (skip Drizzle, Postgres, Better Auth — not needed for this product).
- No transactional email (skip Resend / React Email).
- No TanStack Form (overkill for the 2-3 field input form here).
- No Sentry in this PR (named follow-up; the skill recommends it, but we keep this PR lean).
- No model fine-tuning, no multi-provider abstraction (Zhipu only for now).
- No retention of API keys beyond the in-flight request.

## 4. User Flow

1. User lands on `/`.
2. Inputs:
   - **URL** (required) — the page to parse.
   - **Zhipu API key** (required to run the agent; not required to just parse).
   - **Task prompt** (optional, defaults to: `请用一段话总结这个网页的核心内容`).
   - **Model** (default `glm-5.1`; selector exposes a small whitelist).
3. Clicks **Parse & Analyze**.
4. UI shows two stages:
   - Stage A: Optimization stats card + cleaned markdown preview (returned from `/api/parse`).
   - Stage B: Streaming agent output (from `/api/agent`).
5. User can copy markdown, copy agent output, or re-run with a different prompt without re-parsing.

## 5. Architecture

### 5.1 High-level

```
Browser (React 19 SPA via TanStack Start)
   │
   │  fetch POST /api/parse  { url }                       (Zod-validated)
   ▼
TanStack Start SSR server
   │
   │  src/routes/api/$.ts  (catch-all → Hono)
   ▼
Hono app (src/server/hono.ts)
   │   secureHeaders + cors(same-origin) + pino + (rate-limit for /api/agent)
   ├── POST /api/parse  ─► src/server/routers/parse.ts  ─► curl.md SDK ─► upstream URL
   └── POST /api/agent  ─► src/server/routers/agent.ts  ─► createZhipu().streamText() ─► z.ai
```

Hono mounts inside Start via the skill-mandated catch-all `src/routes/api/$.ts`. The bespoke `server.ts` and `scripts/create-shell.ts` are deleted; production runs `bun run ./.output/server/index.mjs` (TanStack Start's SSR output).

### 5.2 Server-side invariants

- `/api/parse` **never** receives the user's Zhipu API key (Zod schema does not include it).
- `/api/agent` receives the key only for the lifetime of the request:
  - never logged (pino log redaction list includes `apiKey`, request bodies are not logged at all).
  - never persisted (no DB, no cache, no file write).
  - never re-used across requests.
- CORS is same-origin only (`cors({ origin: process.env['PUBLIC_ORIGIN'] })`); no wildcard.
- `secureHeaders()` applied to all `/api/*`.
- Rate-limit on `/api/agent`: 20 req / 15 min / IP (keyed by `x-forwarded-for` to survive Dokploy/Traefik). In-memory store — single-instance deploy, no Redis required.
- 10 s timeout on the upstream URL fetch inside `/api/parse` (AbortController).
- Max upstream HTML: 5 MB (parse rejects with `TOO_LARGE`).
- Max request body for `/api/agent`: 1 MB.

### 5.3 Client-side

- BYOK input lives in component state only — never `localStorage`, never `sessionStorage`. Page reload = key gone.
- Markdown and agent output are kept in component state. No global store.

## 6. Stack Alignment

| Concern | Choice | Notes |
|---|---|---|
| Runtime | Bun | Unchanged |
| Framework | TanStack Start (full SSR) | **Change**: currently builds Start but deploys as static SPA shell. New API surface needs a runtime, so we switch to Start's SSR output. |
| API | Hono mounted at `/api/*` via `src/routes/api/$.ts` | **New**, per skill |
| Validation | Zod schemas in `src/schemas/` | **New** |
| Logging | pino + hono-pino | **New** — replaces ad-hoc `console.log` |
| Security middleware | `hono/cors`, `hono/secure-headers`, `hono-rate-limiter` | **New** |
| Lint/format | Biome v2 | Unchanged |
| Test | `bun test` | Unchanged |
| Git hooks | lefthook | **Change**: replace husky + lint-staged |
| Path alias | `~/*` → `src/*` | **Change**: was `@/*`, migrated repo-wide |
| UI | shadcn/ui + lucide-react + Tailwind v4 | Unchanged |
| Deploy | Dokploy + Docker | Unchanged; Dockerfile updated to run SSR output instead of static `server.ts` |

Explicitly **skipped** from the skill (out-of-scope for this product): Drizzle, postgres-js, Better Auth, TanStack Form, Resend, React Email, Sentry, hono-rate-limiter on `/auth/*` (no auth routes). Sentry is the most plausible follow-up.

## 7. Module / File Layout

### 7.1 New files

| Path | Purpose |
|---|---|
| `src/routes/api/$.ts` | TanStack Start catch-all that forwards `/api/*` to Hono. |
| `src/server/hono.ts` | Hono app: middleware (secureHeaders, cors, pino, rate-limit) + sub-router mounts. |
| `src/server/routers/parse.ts` | `POST /api/parse` handler — Zod-validates body, calls curl.md, returns stats. |
| `src/server/routers/agent.ts` | `POST /api/agent` handler — Zod-validates body, calls Zhipu via AI SDK, streams response. |
| `src/schemas/parse.ts` | Zod `parseRequest` schema (`{ url: string().url() }`) and `parseResponse` type. |
| `src/schemas/agent.ts` | Zod `agentRequest` schema (`{ markdown, apiKey, prompt?, model? }`). |
| `src/lib/logger.ts` | pino logger. Redaction list: `["*.apiKey", "*.headers.authorization"]`. |
| `src/lib/parser/token-estimate.ts` | `estimateTokens(text)`, `savingsRatio(html, md)`, `priceFor(model, in, out)`. |
| `src/lib/parser/models.ts` | Zhipu model whitelist + default (`glm-5.1`) + pricing constants. |
| `src/lib/parser/use-parse.ts` | React hook wrapping `fetch('/api/parse')`. |
| `src/lib/parser/use-agent.ts` | React hook consuming the AI SDK data stream. |
| `src/components/parser/url-agent-form.tsx` | Main input form. |
| `src/components/parser/optimization-stats.tsx` | KB / token / cost savings card. |
| `src/components/parser/markdown-output.tsx` | Markdown preview block + copy button. |
| `src/components/parser/agent-output.tsx` | Streaming agent response + copy button. |
| `lefthook.yml` | Replaces `.husky/` setup. |
| `src/__tests__/lib/parser/token-estimate.test.ts` | Estimation + pricing unit tests. |
| `src/__tests__/server/parse.test.ts` | Calls the Hono `/api/parse` handler with `curl.md` mocked; asserts response & error branches. |
| `src/__tests__/schemas/parse.test.ts` | Zod schema accept / reject cases. |

### 7.2 Modified files

| Path | Change |
|---|---|
| `package.json` | Add: `hono`, `hono-pino`, `hono-rate-limiter`, `zod`, `pino`, `pino-pretty` (dev), `curl.md`, `zhipu-ai-provider`, `ai`, `lefthook` (dev). Remove: `husky`, `lint-staged`. Replace `prepare` script: `bunx lefthook install`. Update `build`/`start` scripts to use Start SSR output. |
| `tsconfig.json` | Change path alias from `@/*` to `~/*`. |
| `vite.config.ts` | Update alias to `~`. Confirm `tanstackStart()` plugin runs in SSR mode (no `output: 'static'` override). |
| `app.config.ts` | If it pins SPA mode, switch to default SSR. |
| `Dockerfile` | Build → run `bun run ./.output/server/index.mjs`. |
| `biome.json` | Add `**/.output/**` to ignores if not present. |
| `src/routes/__root.tsx` | Remove nav links to dropped tools. |
| `src/routes/index.tsx` | Replace homepage hero with `URLAgentForm` + result panels. |
| `src/data/tools-data.ts` | Replace 2-tool registry with the single primary tool (or delete if no longer used). |
| `AGENTS.md` | Update product description; document Hono + Zod + pino conventions; note BYOK proxy invariant. |
| `CLAUDE.md` | Same. |
| Every `import … from '@/...'` | Rewrite to `~/...` (sed-driven, verified by typecheck). |

### 7.3 Deleted files / directories

| Path | Reason |
|---|---|
| `server.ts` | Replaced by Start SSR server output. |
| `scripts/create-shell.ts` | SPA shell no longer needed. |
| `.husky/` | Replaced by lefthook. |
| `src/routes/ai/` (whole directory) | Tools dropped. |
| `src/components/tools/` | Tools dropped. |
| `src/lib/llm/` (whole directory) | Logic replaced by `src/lib/parser/`. |
| `src/hooks/use-live-models.ts`, `use-selected-model.ts` | Live OpenRouter registry no longer used. |
| `src/data/llm-registry.json`, `src/types/llm.ts` | If present, unreferenced after the cut. |
| `src/__tests__/lib/llm/**` | Tests for deleted modules. |

## 8. Interfaces

### 8.1 `POST /api/parse`

**Request body** (validated by `src/schemas/parse.ts`)
```json
{ "url": "https://example.com/article" }
```

**Response 200**
```json
{
  "url": "https://example.com/article",
  "markdown": "# Title\n\n...",
  "htmlBytes": 148231,
  "mdBytes": 12044,
  "htmlTokens": 37058,
  "mdTokens": 3011,
  "savingsRatio": 0.919,
  "fetchedAt": "2026-05-18T08:42:00.000Z"
}
```

**Response 4xx/5xx**
```json
{ "error": "INVALID_URL" | "FETCH_FAILED" | "TIMEOUT" | "TOO_LARGE", "message": "..." }
```

### 8.2 `POST /api/agent`

**Request body** (validated by `src/schemas/agent.ts`)
```json
{
  "markdown": "...",
  "apiKey": "user-zhipu-key",
  "prompt": "请总结...",
  "model": "glm-5.1"
}
```

**Response**
A text/event-stream produced by piping `streamText`'s result through `result.toDataStreamResponse()` (Vercel AI SDK's framed protocol). The client consumes it with the matching AI SDK helpers, so the wire format is SDK-owned rather than spec'd here. Error before stream open → JSON 4xx with `{ error, message }`. Error mid-stream → SDK-native error frame followed by close.

## 9. Token Estimation & Pricing

- Estimation: `Math.ceil(text.length / 4)`. Acknowledged as approximate — accurate to within ~10% for English; worse for CJK. UI labels it "estimated".
- Pricing: a const map in `src/lib/parser/models.ts` keyed by model id with `inputPerMTok` / `outputPerMTok` USD numbers. Initial values to be filled in from the BigModel / Z.AI pricing page during implementation; if a price is unknown, the cost card hides the dollar figure and shows only tokens.
- Model whitelist (starter): `glm-5.1` (default), `glm-4-plus`, `glm-4-air`, `glm-4-flash`. The implementer can prune this once they confirm which slugs Z.AI actually accepts.

## 10. Error Handling Matrix

| Scenario | Where caught | User-visible result |
|---|---|---|
| Empty / malformed URL | Zod on client + server | Inline error under URL input |
| `curl.md` throws / non-2xx upstream | `parse.ts` | Error card: "Couldn't fetch this URL. Check the address or try a public page." |
| Upstream > 10 s | `parse.ts` AbortController | Error card: "The page took too long to load (10 s limit)." |
| Upstream > 5 MB HTML | `parse.ts` length check | Error card: "Page is too large to parse here." |
| Missing / invalid Zhipu key | `agent.ts` upstream 401 | Error card: "Zhipu rejected this API key." |
| Rate-limited | `hono-rate-limiter` | 429 → error card: "Too many requests. Try again in a few minutes." |
| Network drops mid-stream | `use-agent.ts` | Inline notice + Retry button |

## 11. Testing

- Unit: `token-estimate.test.ts` covers estimation rounding, savings ratio, and pricing lookup including the unknown-model branch.
- Unit: `parse.test.ts` calls the Hono parse handler with `curl.md` mocked, asserts response shape, status codes, and each error branch.
- Unit: `schemas/parse.test.ts` exercises Zod accept / reject paths.
- No agent integration test — would require either a live key or a non-trivial mock of the AI SDK streaming protocol. Manual smoke test before release.
- UI components remain not unit-tested (matches current project convention). Manual browser walkthrough verifies the flow.

## 12. Deployment / Ops

- Production: Dokploy pulls main → Docker build → `bun run ./.output/server/index.mjs` on port 3000.
- New env vars:
  - `PUBLIC_ORIGIN` — required for CORS allowlist (e.g. `https://parsify.dev`).
  - `LOG_LEVEL` — optional, defaults to `info`.
  - `NODE_ENV` — set to `production` in the Dockerfile.
- The Zhipu API key remains user-supplied per request; no env var for it.
- pino log redaction is configured for `apiKey` and `authorization`. Request bodies are not logged. Add a code comment in `agent.ts` as a tripwire reminder.

## 13. Migration / Cutover Notes

This is a single PR; the diff is large because we are dropping two whole tools and switching from static SPA to SSR mode at the same time. To keep review tractable:

1. Land path-alias rename (`@/*` → `~/*`) as the **first commit** in the branch — pure mechanical change, easy to skim.
2. Husky → lefthook as the **second commit** — small, independent.
3. Switch to Start SSR + Hono + Zod + pino scaffold as the **third commit** — sets up the new infra against the still-existing old routes.
4. Remove the two old tools and add the new parser tool as the **fourth commit** — the actual product change.
5. Docs (`AGENTS.md`, `CLAUDE.md`) as the **fifth commit**.

The implementation plan (writing-plans next step) will mirror this ordering.

## 14. Out-of-Scope Follow-ups (named, not designed)

- Sentry wired through both Hono (`onError`) and the React side (`@sentry/tanstackstart-react`).
- GitHub Actions CI workflow (`bunx biome ci` + `bunx tsc --noEmit` + `bun test`).
- Multi-provider support (OpenAI, Anthropic, etc.).
- A "share this result" view that snapshots a parse + run.
- Embedded screenshot of the source page via headless browser.
- A CLI wrapper (`npx parsify <url>`).

## 15. Open Questions Resolved in Brainstorm

| Question | Decision |
|---|---|
| Keep old tools? | No — delete cost-calculator and cache-calculator entirely. |
| API key delivery path? | Server proxy via Hono; key in-memory for one request, never persisted or logged. |
| Default model? | `glm-5.1`. |
| User-editable task prompt? | Yes, with a default fallback. |
| Align with bun-ts-stack-skills tanstack skill? | Yes, on Hono / Zod / pino / lefthook / `~/*` alias / Start SSR. Skip DB / auth / email / TanStack Form / Sentry as out-of-scope for this product. |

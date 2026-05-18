# URL → Markdown → Agent: Parsify Refactor

**Date:** 2026-05-18
**Status:** Approved (design phase)
**Author:** youming + Claude

## 1. Summary

Refactor `parsify.dev` from a 2-tool LLM utility site (cost-calculator, cache-calculator) into a single-purpose product: **take a URL, convert it to LLM-optimized markdown via `curl.md`, run an agent on that markdown via Zhipu GLM, and show token / cost savings vs. raw HTML.**

The two existing tools are removed. The new flow is the homepage and the product.

## 2. Goals

- One primary user flow: paste URL → see optimized markdown + savings + agent output.
- Demonstrate concretely how much token spend `curl.md` saves vs. naïvely stuffing HTML into a context window.
- Let users bring their own Zhipu API key (BYOK) and pick a task prompt.
- Keep the deployment shape unchanged: Bun server serves a SPA shell + static assets; no DB, no auth, no persistence.

## 3. Non-Goals

- No accounts, history, or saved sessions.
- No rate limiting, quota, or billing logic.
- No caching of fetched URLs.
- No SSR / SEO refactor — stays a SPA shell.
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
Browser (React 19 SPA via TanStack Router)
   │
   │  fetch POST /api/parse  { url }
   ▼
Bun server.ts  ─►  src/server/parse.ts  ─►  curl.md SDK  ─►  upstream URL
   ▲                                                              │
   │  { markdown, htmlBytes, mdBytes, htmlTokens, mdTokens, ... } │
   └──────────────────────────────────────────────────────────────┘

Browser
   │  fetch POST /api/agent  { markdown, apiKey, prompt, model }   (SSE)
   ▼
Bun server.ts  ─►  src/server/agent.ts  ─►  createZhipu({...}) → streamText
   ▲                                              │
   │  SSE chunks of text                          │
   └──────────────────────────────────────────────┘
```

### 5.2 Server-side invariants

- `/api/parse` **never** receives the user's Zhipu API key.
- `/api/agent` receives the key only for the lifetime of the request:
  - never logged (no `console.log` of the request body).
  - never persisted (no DB, no cache, no file write).
  - never re-used across requests.
- Both endpoints are CORS-locked to same-origin (no `Access-Control-Allow-Origin: *`).
- 10 s timeout on the upstream URL fetch inside `/api/parse`.
- Max request body for `/api/agent` markdown payload: 1 MB (rejected with 413 otherwise — keeps a single page from running away).

### 5.3 Client-side

- BYOK input lives in component state only — never `localStorage`, never `sessionStorage`. Page reload = key gone. (Matches the project's no-persistence stance even though we relaxed the no-server-key rule for the agent proxy.)
- Markdown and agent output are kept in component state. No global store needed.

## 6. Module / File Layout

### 6.1 New files

| Path | Purpose |
|---|---|
| `src/server/parse.ts` | `parseUrl(url): Promise<ParseResult>` — wraps `curl.md` SDK, returns markdown + sizes. |
| `src/server/agent.ts` | `runAgent({ markdown, apiKey, prompt, model }): ReadableStream` — streams GLM response. |
| `src/server/route.ts` | Tiny request dispatcher mounted in `server.ts` (matches `/api/parse`, `/api/agent`, returns 404 otherwise). |
| `src/lib/parser/token-estimate.ts` | `estimateTokens(text): number` — `Math.ceil(text.length / 4)`. Plus `priceFor(model, tokens)`. |
| `src/lib/parser/use-parse.ts` | React hook → calls `/api/parse`, returns `{ status, data, error }`. |
| `src/lib/parser/use-agent.ts` | React hook → reads SSE stream, exposes `{ chunks, done, error, run }`. |
| `src/lib/parser/models.ts` | Zhipu model whitelist + default (`glm-5.1`) + pricing constants. |
| `src/components/parser/url-agent-form.tsx` | Main input form. |
| `src/components/parser/optimization-stats.tsx` | KB / token / cost savings card. |
| `src/components/parser/markdown-output.tsx` | Markdown preview block + copy button. |
| `src/components/parser/agent-output.tsx` | Streaming agent response + copy button. |
| `src/__tests__/lib/parser/token-estimate.test.ts` | Estimation + pricing. |
| `src/__tests__/server/parse.test.ts` | Parse handler against a fixture HTML (no real network). |

### 6.2 Modified files

| Path | Change |
|---|---|
| `server.ts` | Add JSON body parsing + route dispatcher; static fallback for everything else. |
| `package.json` | Add deps: `curl.md`, `zhipu-ai-provider`, `ai`. Bump scripts if needed. |
| `src/routes/index.tsx` | Replace homepage hero with `URLAgentForm` + result panels. |
| `src/routes/__root.tsx` | Update nav (remove links to dropped tools). |
| `src/data/tools-data.ts` | Replace 2-tool registry with the single primary tool. |
| `AGENTS.md` | Update product description, tool count, and security section (add: "API keys are proxied but never persisted"). |
| `CLAUDE.md` | Same. Note the relaxed invariant. |

### 6.3 Deleted files

| Path | Reason |
|---|---|
| `src/routes/ai/cost-calculator.tsx` | Tool dropped. |
| `src/routes/ai/cache-calculator.tsx` | Tool dropped. |
| `src/routes/ai/index.tsx` | No longer needed. |
| `src/components/tools/ai/cost-calculator.tsx` | Tool dropped. |
| `src/components/tools/ai/cache-calculator.tsx` | Tool dropped. |
| `src/components/tools/ai/shared/*` | Only retain pieces that the new flow actually uses; delete the rest. |
| `src/lib/llm/cost-calculator.ts` | Logic no longer used (we have a simpler price calc in `token-estimate.ts`). |
| `src/lib/llm/prompt-cache.ts` | Tool dropped. |
| `src/lib/llm/live-registry.ts` | Replaced by hard-coded Zhipu whitelist. |
| `src/hooks/use-live-models.ts`, `use-selected-model.ts` | Replaced by static Zhipu list. |
| `src/__tests__/lib/llm/**` | Tests for deleted modules. |
| `src/lib/llm/` (directory) | Empty after the deletes above — remove the directory itself. |
| `src/data/llm-registry.json`, `src/types/llm.ts` | If present, no longer referenced after the cut. |

## 7. Interfaces

### 7.1 `POST /api/parse`

**Request**
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

### 7.2 `POST /api/agent`

**Request**
```json
{
  "markdown": "...",
  "apiKey": "user-zhipu-key",
  "prompt": "请总结...",
  "model": "glm-5.1"
}
```

**Response**
A text/event-stream produced by piping `streamText`'s result through `result.toDataStreamResponse()` (Vercel AI SDK's framed protocol). The client uses the matching `useChat`/`readDataStream` helpers, so the exact wire format is owned by the SDK rather than spec'd here. Error before stream open → JSON 4xx with `{ error, message }`. Error mid-stream → SDK-native error frame followed by close.

## 8. Token Estimation & Pricing

- Estimation: `Math.ceil(text.length / 4)`. Acknowledged as approximate — accurate to within ~10% for English; worse for CJK. UI labels it "estimated".
- Pricing: a const map in `src/lib/parser/models.ts` keyed by model id with `inputPerMTok` / `outputPerMTok` USD numbers. Initial values to be filled in from the BigModel / Z.AI pricing page during implementation; if a price is unknown, the cost card hides the dollar figure and shows only tokens.
- Model whitelist (starter): `glm-5.1` (default), `glm-4-plus`, `glm-4-air`, `glm-4-flash`. The implementer can prune this once they confirm which slugs Z.AI actually accepts.

## 9. Error Handling Matrix

| Scenario | Where caught | User-visible result |
|---|---|---|
| Empty / malformed URL | Client form validation | Inline error under URL input |
| `curl.md` throws / non-2xx upstream | `parse.ts` | Error card: "Couldn't fetch this URL. Check the address or try a public page." |
| Upstream > 10 s | `parse.ts` AbortController | Error card: "The page took too long to load (10 s limit)." |
| Upstream > 5 MB HTML | `parse.ts` length check | Error card: "Page is too large to parse here." |
| Missing / invalid Zhipu key | `agent.ts` upstream 401 | Error card: "Zhipu rejected this API key." |
| Network drops mid-stream | `use-agent.ts` | Inline notice + Retry button |

## 10. Testing

- Unit: `token-estimate.test.ts` covers estimation rounding, savings ratio, and pricing lookup including the unknown-model branch.
- Unit: `parse.test.ts` calls the parse handler with `curl.md` mocked, asserts response shape and error branches.
- No agent integration test — would require either a live key or a non-trivial mock of the AI SDK streaming protocol. Manual smoke test before release.
- UI components remain not unit-tested (matches current project convention). Manual browser walkthrough is the verification.

## 11. Deployment / Ops

- Build pipeline unchanged: `vite build && scripts/create-shell.ts`, then Dokploy + Dockerfile + `server.ts`.
- `server.ts` now needs `Bun.serve` to handle POST bodies — already does, just needs route dispatch added.
- No new env vars. The Zhipu API key is always user-supplied per request.
- Logging in `server.ts` must continue to **not** log request bodies — add a code comment as a tripwire reminder.

## 12. Out-of-Scope Follow-ups (named, not designed)

- Multi-provider support (OpenAI, Anthropic, etc.).
- A "share this result" view that snapshots a parse + run.
- Embedded screenshot of the source page via headless browser.
- A CLI wrapper (`npx parsify <url>`).

## 13. Open Questions Resolved in Brainstorm

| Question | Decision |
|---|---|
| Keep old tools? | No — delete cost-calculator and cache-calculator entirely. |
| API key delivery path? | Server proxy; key in-memory for one request, never persisted or logged. |
| Default model? | `glm-5.1`. |
| User-editable task prompt? | Yes, with a default fallback. |

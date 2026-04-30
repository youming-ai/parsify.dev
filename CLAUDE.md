# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Reality

The project is an **Astro 5 + React 19 islands** AI/LLM developer tools site built as a **fully static site** (`output: 'static'`). All logic runs in the browser; there is no SSR, no API routes, no server-side data fetching. The build artifact is a directory of `index.html` files plus hashed JS/CSS in `_astro/`, so it can be served from any static host (Vercel, Netlify, GitHub Pages, S3+CloudFront, plain Nginx, etc.). After a focused triage in 2026-04-30, only the **7 highest-conviction tools** remain: Multi-Model Token Counter, LLM Cost Calculator, Prompt Cache Calculator, Rate Limit Calculator, LLM SSE Stream Parser, Tool Schema Converter, and JSONL Viewer/Editor. The 14 lower-conviction tools were removed to concentrate effort on tools with strong organic search demand and unique privacy positioning.

`AGENTS.md` is authoritative for **security rules**, **code style / Biome conventions**, and **tool workflow**. Follow it for all implementation decisions.

## Commands

| Purpose | Command |
|---|---|
| Dev server | `bun run dev` (Astro dev) |
| Build | `bun run build` (outputs static `dist/<route>/index.html` files + `dist/_astro/` chunks) |
| Typecheck | `bun run typecheck` (`astro check` — covers `.astro` + `.ts(x)`) |
| Lint | `bun run lint` / `bun run lint:fix` (Biome on `./src`) |
| Format | `bun run format` |
| Tests | `bun test` (= Vitest run) |
| Single test file | `bun test src/__tests__/lib/llm/<module>.test.ts` |
| Test UI | `bun run test:ui` |
| Coverage | `bun run test:coverage` |
| Deploy | Dokploy via Docker Compose. `Dockerfile` builds the site (bun) and serves it (nginx); `docker-compose.yml` wires the service for Dokploy's reverse proxy. |

Pre-commit (husky): Biome `check --fix` + `vitest related --run` on staged `.ts(x)`.

## Architecture

### Page → island pattern

Routes live in `src/pages/ai/<tool>.astro`. Each Astro page is a thin shell that:
1. Imports the shared layout `src/layouts/BaseLayout.astro`.
2. Renders the React implementation as a hydrated island: `<ToolName client:load />`.
3. Has SEO metadata in `<slot name="head">`.

Tool components use **named exports**: `export function ToolName() { ... }`.
Astro pages import with aliases to avoid typecheck conflicts:
```astro
import { ToolName as ToolNameTool } from '../../components/tools/ai/tool-name';
<ToolNameTool client:load />
```

### Source layout

```
src/
├── pages/
│   ├── index.astro          # Homepage
│   └── ai/                  # 7 AI/LLM tools (index + 7 tool routes)
├── layouts/BaseLayout.astro # HTML shell, theme init, skip link
├── components/
│   ├── ui/                  # shadcn/ui primitives — REUSE FIRST
│   ├── layout/              # Header, Footer, AppShell
│   ├── home/                # HeroSection
│   ├── tools/ai/            # Per-tool React implementations
│   │   ├── <tool>.tsx       # 7 tool components
│   │   └── shared/          # Reusable: ModelSelector, APIKeyInput, CodeExportTabs,
│   │                          MetricCard, JsonTextarea, RelatedTools, ProviderSelector, BYOKNotice
│   ├── seo/, analytics/, error-boundary.tsx, theme-provider.tsx
├── lib/
│   ├── llm/                 # Pure logic modules for the 7 tools (calculators, parsers, JSONL, plus shared ai-client/live-registry)
│   ├── seo-config.ts, structured-data.ts, icon-map.ts, performance.ts, utils.ts
├── data/
│   ├── tools-data.ts        # Tool registry (7 tools, 5 subcategories)
│   └── llm-registry.json    # Model facts & pricing (9 models)
├── hooks/
├── types/
│   ├── tools.ts             # Tool, ToolCategoryData interfaces
│   └── llm.ts               # LLM model types (LLMModel, LLMPricing, etc.)
└── __tests__/
    └── lib/llm/              # Per-module Vitest tests for the 7 tools
```

### Data

`src/data/tools-data.ts` is the tool registry: 7 tools across 5 subcategories (Tokens & Cost, Tool Calling, RAG & Data, API Debugging, Models & Providers) under the single category `AI & LLM Tools`. `src/data/llm-registry.json` is the model registry with facts for 9 models across 7 providers.

### TypeScript strictness

`tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, and `noPropertyAccessFromIndexSignature`. `@/*` resolves to `src/*`.

### Deployment

The site is a fully static build (`output: 'static'` in `astro.config.mjs`, no adapter). It deploys to **Dokploy via Docker Compose**:

- `Dockerfile` is multi-stage:
  1. `oven/bun:1.3.5-alpine` builder — `bun install --frozen-lockfile` then `bun run build` → `/app/dist`
  2. `nginx:1.27-alpine` runtime — copies `dist/` into `/usr/share/nginx/html` and uses `nginx.conf` for headers, gzip, immutable cache on `/_astro/`, and `try_files` fallback to `<route>/index.html` for Astro's nested route layout.
- `docker-compose.yml` defines a single `web` service with `expose: 80` so Dokploy's reverse proxy (Traefik) can reach it. No host port mapping — Dokploy handles routing via the domain configured in its UI.
- `.dockerignore` keeps `node_modules`, `dist`, `.env`, tests, docs, and `.git` out of the build context.

Cloudflare Workers Builds was abandoned on 2026-04-30 along with `wrangler.toml`, `@astrojs/cloudflare`, and the `wrangler` dependency. There are no server-side secrets in this codebase — every provider call is BYOK from the browser, so no environment variables need to be set on the host.

### Testing

Vitest in `node` environment (no DOM needed for the pure-logic test suite). Tests for logic go in `src/__tests__/lib/llm/`. Coverage excludes `src/components/ui/**`.

## Working in this repo

- **All logic lives in `src/lib/llm/`** — pure functions, testable without DOM.
- **Reuse `src/components/ui/`** before creating new primitives. Use `cn()` from `src/lib/utils.ts`.
- **Security rules from `AGENTS.md` apply** — browser-side only, BYOK for provider calls, `crypto.subtle`, DOMPurify.
- **No server-side processing of user input** — that's the product invariant.
- **Named exports for all tool components** — Astro pages use import aliases.

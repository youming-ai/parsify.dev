# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Reality

The project is an **Astro 5 + React 19 islands** AI/LLM developer tools site deployed to **Cloudflare Workers** via Workers Builds (Git integration) using `@astrojs/cloudflare` in `output: 'server'` mode. SSR runs in `dist/_worker.js/index.js`; static assets are served from `dist/` via the `ASSETS` binding. After a focused triage in 2026-04-30, only the **7 highest-conviction tools** remain: Multi-Model Token Counter, LLM Cost Calculator, Prompt Cache Calculator, Rate Limit Calculator, LLM SSE Stream Parser, Tool Schema Converter, and JSONL Viewer/Editor. The 14 lower-conviction tools (prompt linting/diff/format-conversion, schema builder/generator, output validator, context/embedding/model visualizers, API request builder, few-shot/variable-filler builders, fine-tuning validator, text chunker) were removed to concentrate effort on tools with strong organic search demand and unique privacy positioning.

`AGENTS.md` is authoritative for **security rules**, **code style / Biome conventions**, and **tool workflow**. Follow it for all implementation decisions.

## Commands

| Purpose | Command |
|---|---|
| Dev server | `bun run dev` (Astro dev) |
| Build | `bun run build` (outputs `dist/` containing `_worker.js`, `_routes.json`, and static assets) |
| Typecheck | `bun run typecheck` (`astro check` — covers `.astro` + `.ts(x)`) |
| Lint | `bun run lint` / `bun run lint:fix` (Biome on `./src`) |
| Format | `bun run format` |
| Tests | `bun test` (= Vitest run) |
| Single test file | `bun test src/__tests__/lib/llm/<module>.test.ts` |
| Test UI | `bun run test:ui` |
| Coverage | `bun run test:coverage` |
| Deploy | Auto-deploys on push to `main` via Cloudflare Workers Builds (Git integration runs `npx wrangler deploy`). Manual fallback: `bunx wrangler deploy` |

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
    ├── setup.ts
    └── lib/llm/              # Per-module Vitest tests for the 7 tools
```

### Data

`src/data/tools-data.ts` is the tool registry: 7 tools across 5 subcategories (Tokens & Cost, Tool Calling, RAG & Data, API Debugging, Models & Providers) under the single category `AI & LLM Tools`. `src/data/llm-registry.json` is the model registry with facts for 9 models across 7 providers.

### TypeScript strictness

`tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, and `noPropertyAccessFromIndexSignature`. `@/*` resolves to `src/*`.

### Cloudflare Workers deployment

Deployed via **Cloudflare Workers Builds with Git integration** — every push to `main` triggers Cloudflare to run `bun install` → `bun run build` → `npx wrangler deploy`. The Astro Cloudflare adapter emits `dist/_worker.js/index.js` (SSR worker) plus static assets in `dist/`.

`wrangler.toml` declares:
- `main = "./dist/_worker.js/index.js"` — Worker entry
- `[assets] directory = "./dist", binding = "ASSETS"` — static assets bound to `env.ASSETS`
- `compatibility_flags = ["nodejs_compat"]`
- `[vars] ENVIRONMENT = "production"` — Workers Builds reads `[vars]` from this file at deploy time

**Secrets** (`GROQ_API_KEY`, `ALLOWED_ORIGIN`) must be set via `wrangler secret put <NAME>` or in the Cloudflare Dashboard (Worker → Settings → Variables → Secrets). They are NOT committed to `wrangler.toml`. `BUN_VERSION` is auto-detected by Cloudflare from the Bun toolchain detection.

### Testing

Vitest with `happy-dom`, setup at `src/__tests__/setup.ts`. Tests for logic go in `src/__tests__/lib/llm/`. Coverage excludes `src/components/ui/**`.

## Working in this repo

- **All logic lives in `src/lib/llm/`** — pure functions, testable without DOM.
- **Reuse `src/components/ui/`** before creating new primitives. Use `cn()` from `src/lib/utils.ts`.
- **Security rules from `AGENTS.md` apply** — browser-side only, BYOK for provider calls, `crypto.subtle`, DOMPurify.
- **No server-side processing of user input** — that's the product invariant.
- **Named exports for all tool components** — Astro pages use import aliases.

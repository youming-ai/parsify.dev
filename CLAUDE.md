# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Reality

Astro 5 + React 19 islands AI/LLM developer tools site, **fully static** (`output: 'static'`, no adapter). All logic runs in the browser — no SSR, no API routes, no server-side data fetching. Build artifact is a directory of `index.html` files plus hashed JS/CSS in `_astro/`, deployable to any static host. Currently deploys to **Cloudflare Workers Static Assets** via Git integration (see Deployment section for the project-config gotcha that necessitates `wrangler.toml`).

After a 2026-04-30 cull, **7 tools** remain (down from 21): Multi-Model Token Counter, LLM Cost Calculator, Prompt Cache Calculator, Rate Limit Calculator, LLM SSE Stream Parser, Tool Schema Converter, JSONL Viewer/Editor. The cut was deliberate — keep tools with strong organic search demand or genuine privacy differentiation; drop heuristic/undifferentiated ones.

`AGENTS.md` is authoritative for **security rules**, **Biome code-style conventions**, and the **step-by-step workflow for adding a new tool**. Read it before changing those areas.

## Commands

| Purpose | Command |
|---|---|
| Dev server | `bun run dev` |
| Build (static `dist/`) | `bun run build` |
| Typecheck | `bun run typecheck` (= `astro check`, covers `.astro` + `.ts(x)`) |
| Lint / autofix | `bun run lint` / `bun run lint:fix` (Biome on `./src`) |
| Format | `bun run format` |
| All tests | `bun test` |
| Single test file | `bun test src/__tests__/lib/llm/<module>.test.ts` |
| Test UI | `bun run test:ui` |
| Coverage | `bun run test:coverage` |

Pre-commit (husky + lint-staged): Biome `check --fix` + `vitest related --run` on staged `.ts(x)` files.

## Architecture

### Page → island pattern

Each tool route at `src/pages/ai/<tool>.astro` is a thin shell that:
1. Imports `src/layouts/BaseLayout.astro`.
2. Mounts the React implementation as a hydrated island: `<ToolName client:load />`.
3. Declares SEO metadata via `<slot name="head">`.

Tool components use **named exports**. Astro pages import with an alias to avoid typecheck conflicts between the page name and the component name:

```astro
import { ToolName as ToolNameTool } from '../../components/tools/ai/tool-name';
<ToolNameTool client:load />
```

### Source layout

```
src/
├── pages/
│   ├── index.astro                # Homepage
│   └── ai/                        # 7 tool routes + an index
├── layouts/BaseLayout.astro       # HTML shell, theme bootstrap, skip link
├── components/
│   ├── ui/                        # shadcn/ui primitives — REUSE FIRST
│   ├── layout/                    # app-shell, header, footer, theme-toggle
│   ├── home/hero-section.tsx
│   ├── tools/ai/
│   │   ├── <tool>.tsx             # 7 tool components
│   │   └── shared/                # code-export-tabs, metric-card,
│   │                                model-selector, related-tools,
│   │                                token-counter-bar
│   ├── link.tsx
│   └── theme-provider.tsx
├── lib/
│   ├── llm/                       # 7 pure-logic modules + live-registry
│   ├── icon-map.ts, seo-config.ts, utils.ts
├── data/
│   ├── tools-data.ts              # Tool registry (7 tools, 5 subcategories)
│   └── llm-registry.json          # Static fallback for LLM facts
├── hooks/
│   ├── use-live-models.ts         # Fetches OpenRouter live models, 24h cache
│   └── use-selected-model.ts      # Resolves a model id to LiveModel facts
├── types/{tools,llm}.ts
└── __tests__/lib/llm/             # Per-module Vitest tests (6 files, 18 tests)
```

### Data + model registry

`src/data/tools-data.ts` is the tool registry: 7 tools across 5 subcategories (Tokens & Cost, Tool Calling, RAG & Data, API Debugging, Models & Providers) under the single category `AI & LLM Tools`. `src/data/llm-registry.json` is a static fallback for model facts; live data comes from OpenRouter via `src/hooks/use-live-models.ts` (24-hour cache).

### TypeScript strictness — gotcha

`tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, **and** `noPropertyAccessFromIndexSignature`. The last one bites: `process.env.NODE_ENV` fails ts(4111) — must be written as `process.env['NODE_ENV']`. Same applies to any other index-signature property access.

`@/*` resolves to `src/*`.

### Testing

Vitest in `node` environment (no DOM, no jest-dom matchers — those were dropped during cleanup). Pure-logic tests only; UI components are not unit-tested. Tests live in `src/__tests__/lib/llm/`. Coverage excludes `src/components/ui/**`.

## Deployment

Static build deployed to **Cloudflare Workers Static Assets** via Git integration. On push to `main`, Cloudflare clones the repo, runs `bun install --frozen-lockfile && bun run build`, then `npx wrangler deploy` uploads `dist/` as assets — no Worker script, no SSR.

`wrangler.toml` is intentionally minimal:

```toml
name = "parsify-dev"
compatibility_date = "2026-04-30"

[assets]
directory = "./dist"
```

**Do not delete this file.** Without it, `wrangler deploy` auto-runs `astro add cloudflare`, which reinstalls the SSR adapter and then crashes during prerender on a React 19 + `@phosphor-icons/react` `useContext` incompatibility. The empty-ish `wrangler.toml` makes Wrangler treat the project as already configured and just upload `dist/`.

`public/_headers` declares cache + security headers — Astro copies it to `dist/_headers` on build, where Cloudflare reads it. `/_astro/*` gets 1y immutable cache; HTML must-revalidates so deploys propagate immediately.

No server-side secrets — every provider call is BYOK from the browser. Only `BUN_VERSION=1.3.5` is set in the Cloudflare environment.

## Working in this repo

- **Pure logic lives in `src/lib/llm/`** — testable without DOM.
- **Reuse `src/components/ui/`** primitives before creating new ones. Use `cn()` from `src/lib/utils.ts` for class merging.
- **No server-side processing of user input** — that's the product invariant.
- **Named exports for tool components** — Astro pages alias them on import.
- **Security rules from `AGENTS.md` apply**: BYOK only, `crypto.subtle` for crypto, `DOMPurify` for any user-provided HTML, never `Math.random()` for security-relevant randomness.

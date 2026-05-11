# VPS Migration & UI Redesign

**Date**: 2026-05-11  
**Status**: Approved  
**Scope**: Migrate from Cloudflare Workers Static Assets to Hetzner VPS + Docker, redesign tool page UI for the 2 existing tools.

## Goals

1. Move deployment from Cloudflare to self-hosted Hetzner VPS (Docker)
2. Maintain extreme performance
3. Use Bun + TypeScript across the full stack
4. Redesign tool page display with modern, polished UI
5. Preserve the client-side privacy invariant (no server processing of user data)

## Architecture

**Current → Target:**

| Layer | Current | Target |
|---|---|---|
| Build | `astro build` → `dist/` | Same |
| Server | Cloudflare Workers Static Assets | `Bun.serve()` in Docker |
| Runtime | Browser only | Same (invariant preserved) |
| Config files | `wrangler.toml` + `public/_headers` | `Dockerfile` + server inline headers |

### Bun HTTP Server (`server.ts`)

- `Bun.serve()` on `process.env['PORT'] || 3000`
- Serves `dist/` with `Bun.file()` for zero-overhead static serving
- Security headers in-code:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Cache headers:
  - `/_astro/*` → `Cache-Control: public, max-age=31536000, immutable`
  - `*.html` → `Cache-Control: public, must-revalidate`
  - Everything else → defaults
- SPA/404 fallback: unmatched `GET` → `dist/404.html`
- No Node.js dependencies — pure Bun APIs

### Docker

**Dockerfile:**

```dockerfile
FROM oven/bun:1-slim AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./server.ts
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "server.ts"]
```

- Multi-stage: build in first stage (~500MB with deps), ship only `dist/` + `server.ts` in second
- Final image: ~80MB (Bun binary + static assets)
- No `node_modules` in production image

**docker-compose.yml (local dev parity):**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
```

### Deployment Flow (Hetzner VPS)

1. Push to `main`
2. CI builds Docker image, tags with commit SHA
3. Push image to registry (GitHub Container Registry preferred)
4. SSH into VPS: `docker pull`, `docker compose up -d`

Or simplified: CI SSHes into VPS, `git pull`, `docker compose up --build -d`

SSL via Caddy or Traefik reverse proxy on VPS for auto-LetsEncrypt.

### Files to Remove

- `wrangler.toml`
- `public/_headers`
- `.wrangler/`
- Any Cloudflare-specific CI config

## Tool Page UI Redesign

### Layout (2-Column Desktop, Stacked Mobile)

```
┌─────────────────────────────────────────────────────┐
│  ← Back to tools          Tool name + description   │
│                                                      │
│  ┌─── Input Panel ───────┐  ┌─── Results Panel ───┐ │
│  │                         │  │                      │ │
│  │  Model Selector         │  │   $ 1,247.50         │ │
│  │  ┌─────────────────┐    │  │   Estimated monthly  │ │
│  │  │ gpt-4o   ▼      │    │  │                      │ │
│  │  └─────────────────┘    │  │   ┌────────────────┐ │ │
│  │                         │  │   │ Cost breakdown  │ │ │
│  │  Monthly requests       │  │   │ Input  $xxx     │ │ │
│  │  [100,000        ]      │  │   │ Output $xxx     │ │ │
│  │                         │  │   │ Cache  $xxx     │ │ │
│  │  Input tokens / req     │  │   └────────────────┘ │ │
│  │  [1,000          ]      │  │                      │ │
│  │                         │  │   ████████░░ input   │ │
│  │  Output tokens / req    │  │   ████░░░░░░ output  │ │
│  │  [500            ]      │  │   ██░░░░░░░░ cache   │ │
│  │                         │  └──────────────────────┘ │
│  │  ─── toggle ───         │                            │
│  │  Batch pricing          │                            │
│  └─────────────────────────┘                            │
│  2-col on desktop, stacked on mobile                    │
└─────────────────────────────────────────────────────┘
```

### Key Changes

- **Two-panel layout**: Input panel (left column) and Results panel (right column). Stacks vertically on mobile.
- **Results panel**: Large monetary display with `.toLocaleString()` formatting, optional animated count-up, cost breakdown table, optional horizontal bar visualization of proportions.
- **Input panel**: Better vertical spacing, grouped fields with section headers, model selector at top.
- **Breadcrumb**: "← All tools" back-link at top of page.
- **Skeleton loading**: Shimmer placeholder while model data resolves from OpenRouter API.
- **Transitions**: Subtle opacity/scale transitions on result value changes (`transition-all`).

### New Shared Components

- `<ToolPageShell>` — Standardizes page layout (header + 2-panel grid) across both tools. Accepts props: `title`, `description`, `breadcrumb`.
- `<ResultCard>` — Large number display with animated value, subtitle, and optional icon. Accepts: `value`, `label`, `format` (currency/number/percentage).
- `<CostBreakdown>` — Three-row breakdown table with colored dot indicators and proportional horizontal bar chart.

### Existing Components Kept

- `<ModelSelector>` — already polished
- `<MetricCard>` — reused per-tool as needed
- `<RelatedTools>` — kept

## Component Structure

### Refined Source Layout

```
src/
├── pages/
│   ├── index.astro                     # Homepage
│   └── ai/
│       ├── index.astro                 # Tool hub
│       ├── cost-calculator.astro       # Thin shell (minimal changes)
│       └── cache-calculator.astro      # Thin shell (minimal changes)
├── layouts/
│   └── BaseLayout.astro               # (kept)
├── components/
│   ├── ui/                             # shadcn/ui primitives (kept)
│   ├── layout/                         # Header, footer, theme-toggle
│   ├── home/                           # Hero section
│   ├── tools/ai/
│   │   ├── cost-calculator.tsx         # Refactored: uses ToolPageShell
│   │   ├── cache-calculator.tsx        # Refactored: uses ToolPageShell
│   │   └── shared/
│   │       ├── model-selector.tsx      # (kept)
│   │       ├── tool-page-shell.tsx     # NEW
│   │       ├── result-card.tsx         # NEW
│   │       ├── cost-breakdown.tsx      # NEW
│   │       ├── metric-card.tsx         # (kept)
│   │       └── related-tools.tsx       # (kept)
│   └── seo/
│       └── page-seo.astro
├── lib/
│   ├── llm/                            # Pure logic (all kept)
│   └── utils.ts                        # cn() helper
├── hooks/                              # (all kept)
├── data/                               # (all kept)
└── __tests__/                          # Vitest (all kept)
```

### New Root-Level Files

```
├── server.ts                           # NEW: Bun static file server
├── Dockerfile                          # NEW: production image
├── docker-compose.yml                  # NEW: local dev parity
```

### Files Modified Minimally

- `package.json` — add `doploy start` script, minor script adjustments
- `cost-calculator.tsx` — wrap in `<ToolPageShell>`, use `<ResultCard>` and `<CostBreakdown>`
- `cache-calculator.tsx` — same pattern as cost-calculator

## Non-Goals (Out of Scope)

- Adding new tools (only 2 existing tools redesigned)
- Authentication or user accounts
- Database or persistence
- Analytics or telemetry
- API routes or server-side computation
- SSR (stays static-only)

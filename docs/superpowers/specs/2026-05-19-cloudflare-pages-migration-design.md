# Parsify.dev — Cloudflare Pages SPA + Hono Worker Migration

## Goal

Migrate Parsify.dev from TanStack Start SSR (Node.js) to a Cloudflare Pages SPA + Hono Worker architecture, deployable via `cf` CLI.

## Architecture

```
User → Cloudflare Edge
        ├── /assets/*     → Static files (JS/CSS)
        ├── /api/*        → Hono Worker (Pages Function)
        └── /*            → index.html (SPA fallback)
```

- **Frontend**: React 19 + TanStack Router + Tailwind v4, client-only SPA
- **API**: Hono 4 deployed as Cloudflare Pages Function at `/api/*`
- **Auth flow**: No DB; API keys read from Worker env vars (`DEEPSEEK_API_KEY`, `JINA_API_KEY`)

## Changes

### Remove SSR
- Delete `@tanstack/react-start` dependency
- Remove `tanstackStart()` Vite plugin from `vite.config.ts`
- Replace `StartClient` in `client.tsx` with `RouterProvider` + `createRouter`
- Remove `HeadContent` / `Scripts` from `__root.tsx`
- Remove `src/routes/api/$.ts` (TanStack Start catch-all)
- Remove `srvx` dependency
- Remove `hono-pino`, `pino`, `hono-rate-limiter` (incompatible with CF Workers)

### Add Cloudflare Workers support
- Create `functions/api/[[route]].ts` — Hono app entry point for Pages Functions
- Create `wrangler.jsonc` — project config with Pages settings and env var bindings
- Replace logger with CF Workers compatible alternative (e.g. simple `console.log` wrapper or `winston`-based)
- Replace rate limiter with CF Workers compatible alternative (simplified in-memory or removed)

### Preserve
- All UI components (shadcn/ui, Tailwind v4)
- TanStack Router client routing
- Hono API routes (`/health`, `/parse`, `/agent`)
- Zod schema validation
- `routeTree.gen.ts` (regenerated during build)

## File Inventory

| File | Action | Reason |
|---|---|---|
| `vite.config.ts` | Modify | Remove `tanstackStart()`, build as SPA |
| `src/client.tsx` | Modify | Use `RouterProvider` for client hydration |
| `src/routes/__root.tsx` | Modify | Remove SSR-only elements |
| `src/routes/api/$.ts` | Delete | API now handled by CF Pages Function |
| `src/server/hono.ts` | Modify | Remove Node-only middleware (pino, rate-limiter) |
| `src/server/routers/agent.ts` | Modify | Remove pino logger references |
| `src/server/routers/parse.ts` | Modify | Remove pino logger references |
| `src/lib/logger.ts` | Modify | Replace with CF Workers compatible logger |
| `src/router.tsx` | Modify | Remove SSR config, simplify |
| `package.json` | Modify | Remove SSR deps, update scripts |
| `functions/api/[[route]].ts` | Create | Hono Worker entry point |
| `wrangler.jsonc` | Create | Cloudflare Pages config |

## Deployment

```bash
# Build SPA
bun run build

# Deploy to Cloudflare Pages
npx cf pages deploy dist/ --project-name parsify
```

## Environment Variables (Worker)

Set via `wrangler.jsonc` or `cf` CLI:
- `DEEPSEEK_API_KEY`
- `JINA_API_KEY`
- `PUBLIC_ORIGIN`

## Out of Scope
- Server-side rendering (SSR)
- Database / persistence
- Multi-region or multi-instance concerns
- CI/CD pipeline changes

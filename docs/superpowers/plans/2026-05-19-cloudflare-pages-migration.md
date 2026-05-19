# Cloudflare Pages SPA + Hono Worker Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Parsify.dev from TanStack Start SSR (Node.js) to Cloudflare Pages SPA + Hono Worker.

**Architecture:** Vite builds a React SPA served as static assets on Cloudflare Pages. The Hono API app runs as a Pages Function at `/api/*`. No Node.js runtime needed. HTML shell lives in `index.html`, React hydrates into `<div id="root">`.

**Tech Stack:** Vite 7 + React 19 + TanStack Router v1 + Hono 4 + Cloudflare Pages

---

### Task 1: Create index.html

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create SPA HTML shell**

Move the HTML shell from `__root.tsx` into a standalone `index.html`:

```html
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <script>
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "wmm88v8vgn");
    </script>
    <script>
      var stored = localStorage.getItem('parsify-theme');
      var theme = stored !== null ? stored : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      if (theme === 'dark') document.documentElement.classList.add('dark');
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/client.tsx"></script>
  </body>
</html>
```

---

### Task 2: Update vite.config.ts for SPA build

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Replace Vite config**

```ts
import { routerPlugin } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [routerPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '~': '/src',
    },
  },
});
```

Removes `tanstackStart()` (SSR). Adds `routerPlugin()` (auto-generates `routeTree.gen.ts`) + `react()` (JSX transform for SPA).

---

### Task 3: Update __root.tsx — remove HTML shell

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Strip SSR-only elements, keep only app content**

```tsx
import { AppShell } from '~/components/layout/app-shell';
import '~/styles/app.css';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const Route = createRootRouteWithContext<object>()({
  component: RootComponent,
});
```

Removed: `<html>`, `<head>`, `<body>`, `HeadContent`, `Scripts`, `<HeadContent />`, all meta/link/script tags (they moved to `index.html`).

---

### Task 4: Update client.tsx for SPA hydration

**Files:**
- Modify: `src/client.tsx`

- [ ] **Step 1: Replace StartClient with RouterProvider**

```tsx
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

---

### Task 5: Simplify router.tsx

**Files:**
- Modify: `src/router.tsx`

- [ ] **Step 1: Remove SSR config**

Keep `defaultNotFoundComponent` so unmatched routes show the 404 page.

```tsx
import type { Router } from '@tanstack/react-router';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

function NotFound() {
  return (
    <main className="container mx-auto max-w-7xl px-6 py-24 text-center lg:px-8">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        className="mt-8 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Back to home
      </a>
    </main>
  );
}

export function getRouter(): Router<typeof routeTree> {
  return createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
  });
}

---

### Task 6: Delete API catch-all route

**Files:**
- Delete: `src/routes/api/$.ts`

- [ ] **Step 1: Remove file**

```bash
git rm src/routes/api/$.ts
```

API requests will be handled directly by the Cloudflare Pages Function.

- [ ] **Step 2: Delete stale routeTree.gen.ts**

The current `src/routeTree.gen.ts` imports from `./routes/api/$` which was just deleted.
Remove the stale file so the Vite plugin regenerates it on the next build:

```bash
rm src/routeTree.gen.ts
```

---

### Task 7: Create _redirects for SPA routing

**Files:**
- Create: `public/_redirects`

- [ ] **Step 1: Add Cloudflare Pages redirect rules**

```
/*  /index.html  200
```

SPA fallback: all non-`/api/*` requests serve `index.html`. Cloudflare Pages Functions automatically handle `/api/*` routes via the `functions/api/` directory — no redirect rule needed.

---

### Task 8: Replace logger with CF Workers compatible version

**Files:**
- Modify: `src/lib/logger.ts`

- [ ] **Step 1: Replace pino with console-based logger**

```ts
type LogMethod = (msg: string, ...args: unknown[]) => void;

export interface Logger {
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  debug: LogMethod;
  trace: LogMethod;
}

function createLogger(level: string): Logger {
  const levels = ['trace', 'debug', 'info', 'warn', 'error'];
  const currentIdx = levels.indexOf(level) !== -1 ? levels.indexOf(level) : 2;

  function log(levelName: string, method: 'log' | 'warn' | 'error') {
    const enabled = levels.indexOf(levelName) >= currentIdx;
    return (msg: string, ...args: unknown[]) => {
      if (!enabled) return;
      // biome-ignore lint/suspicious/noConsole: intentional logger for CF Workers
      console[method](`[${levelName.toUpperCase()}]`, msg, ...args);
    };
  }

  return {
    trace: log('trace', 'log'),
    debug: log('debug', 'log'),
    info: log('info', 'log'),
    warn: log('warn', 'warn'),
    error: log('error', 'error'),
  };
}

export const logger = createLogger(
  (() => {
    try {
      return process.env['LOG_LEVEL'] ?? 'info';
    } catch {
      return 'info';
    }
  })()
);
```

---

### Task 9: Update Hono app for CF Workers

**Files:**
- Modify: `src/server/hono.ts`
- Modify: `src/server/routers/agent.ts`
- Modify: `src/server/routers/parse.ts`

**Key insight:** CF Workers passes env vars via `context.env` (not `process.env`).
Hono makes this available as `c.env` when `app.fetch(request, env)` is called.
Route handler code runs per-request so `c.env` is available — but module-level code runs at import time.
We need to read env vars lazily inside handlers, not at module scope.

- [ ] **Step 1: Rewrite hono.ts**

Remove imports of `pinoLogger`, `rateLimiter`, `PinoEnv`. Add import of `logger` from `~/lib/logger`.
Remove module-level `process.env` reads — use dynamic CORS origin from `c.env`.

```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from '~/lib/logger';
import { agent } from '~/server/routers/agent';
import { parse } from '~/server/routers/parse';

export const app = new Hono({ strict: false }).basePath('/api');

app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: (origin, c) =>
      (c.env as Record<string, string | undefined>)?.['PUBLIC_ORIGIN'] ??
      'http://localhost:3000',
    credentials: false,
  })
);
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(`${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`);
});

app.get('/health', (c) => c.json({ ok: true }));

app.route('/parse', parse);
app.route('/agent', agent);

app.onError((err, c) => {
  logger.error(`unhandled: ${err.message}`);
  return c.json({ error: 'INTERNAL', message: 'Unexpected server error' }, 500);
});
```

- [ ] **Step 2: Update agent.ts**

Three changes:
1. Remove `import type { Env as PinoEnv } from 'hono-pino'`
2. Remove `Hono<PinoEnv>` typing → plain `new Hono()`
3. Replace `process.env['DEEPSEEK_API_KEY']` with `(c.env as any)?.DEEPSEEK_API_KEY`
4. Replace all `c.var.logger` / `logger` variable references with the new `logger` import
5. Add `import { logger } from '~/lib/logger'` at the top

Full rewritten file:

```ts
import { Hono } from 'hono';
import { logger } from '~/lib/logger';
import { type AgentError, agentRequestSchema } from '~/schemas/agent';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-v4-flash';

export const agent = new Hono();

agent.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json<AgentError>({ error: 'INVALID_BODY', message: 'Body is not JSON' }, 400);
  }

  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json<AgentError>(
      { error: 'INVALID_BODY', message: parsed.error.issues[0]?.message ?? 'Invalid body' },
      400
    );
  }

  const apiKey = (c.env as Record<string, string | undefined>)?.['DEEPSEEK_API_KEY'];
  if (!apiKey) {
    logger.error('DEEPSEEK_API_KEY not configured');
    return c.json<AgentError>(
      { error: 'CONFIG_ERROR', message: 'Server missing DEEPSEEK_API_KEY' },
      500
    );
  }

  const { markdown, prompt } = parsed.data;

  let upstream: Response;
  try {
    upstream = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        stream: true,
        messages: [
          { role: 'system', content: 'You are a precise web-content analyst.' },
          {
            role: 'user',
            content: `${prompt}\n\n--- 网页 markdown 内容如下 ---\n\n${markdown}`,
          },
        ],
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`deepseek fetch failed: ${message}`);
    return c.json<AgentError>({ error: 'AGENT_FAILED', message }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    logger.warn(`deepseek upstream error: ${upstream.status} ${errText.slice(0, 500)}`);
    return c.json<AgentError>(
      { error: 'AGENT_FAILED', message: `Upstream ${upstream.status}` },
      502
    );
  }

  const upstreamBody = upstream.body;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamBody.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta.length > 0) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch (err) {
              logger.warn(`sse parse failed: ${(err as Error).message}`);
            }
          }
        }
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn(`stream interrupted: ${message}`);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-cache',
    },
  });
});
```

- [ ] **Step 3: Update parse.ts**

Replace `process.env['JINA_API_KEY']` with `(c.env as Record<string, string | undefined>)?.['JINA_API_KEY']` inside the handler (line 29):

```ts
const apiKey = (c.env as Record<string, string | undefined>)?.['JINA_API_KEY'];
```

---

### Task 10: Create Cloudflare Pages Function entry

**Files:**
- Create: `functions/api/[[route]].ts`

- [ ] **Step 1: Create Pages Function**

The function reads env vars from `context.env` and passes them to Hono via `app.fetch()` so they become available as `c.env` in route handlers.

```ts
import { app } from '../../src/server/hono';

export async function onRequest(context: {
  request: Request;
  env: Record<string, string | undefined>;
}) {
  return app.fetch(context.request, context.env);
}
```

The Hono app reads env vars from `c.env` inside route handlers (see Task 9). The `nodejs_compat` flag in `wrangler.jsonc` ensures `process.env` doesn't crash (though we don't rely on it for Workers env vars).

---

### Task 11: Create wrangler.jsonc

**Files:**
- Create: `wrangler.jsonc`

- [ ] **Step 1: Create Cloudflare Pages config**

```jsonc
{
  "name": "parsify",
  "pages_build_output_dir": "dist",
  "compatibility_date": "2026-05-19",
}
```

---

### Task 12: Update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update scripts**

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "npx cf pages deploy dist/ --project-name parsify",
  "lint": "biome check ./src",
  "lint:fix": "biome check --fix ./src",
  "format": "biome format --write ./src",
  "typecheck": "tsc --noEmit",
  "test": "bun test",
  "clean": "rm -rf node_modules dist .output"
}
```

- [ ] **Step 2: Remove SSR deps, add SPA deps**

```bash
bun remove @tanstack/react-start srvx hono-pino hono-rate-limiter
bun add -d @vitejs/plugin-react @tanstack/router-plugin
```

Note: `@tanstack/router-plugin` is a transitive dep of `@tanstack/react-start`. After removing react-start, we must add it explicitly for route tree generation.

---

### Task 13: Build and verify locally

**Files:**
- All modified files

- [ ] **Step 1: Clean and build**

```bash
rm -rf dist
bun run build
```

Expected: Build succeeds. `dist/` contains:
```
dist/
├── index.html
├── assets/
│   ├── index-*.js
│   ├── index-*.css
│   └── 404-*.js (code-split)
├── robots.txt
├── opengraph-image.png
├── manifest.json
└── favicon.svg (from public/)
```

No `dist/server/` directory.

- [ ] **Step 2: Verify SPA locally**

```bash
bun run preview
```

Open `http://localhost:4173/`. Verify:
- Homepage renders (heading "Parsify", URL input, features section)
- Navigation works
- No console errors in browser DevTools

---

### Task 14: Deploy to Cloudflare Pages

**Files:**
- `dist/` (build output)
- `functions/api/[[route]].ts`
- `wrangler.jsonc`

- [ ] **Step 1: Set secrets**

```bash
npx cf pages secret put DEEPSEEK_API_KEY --project-name parsify
npx cf pages secret put JINA_API_KEY --project-name parsify
```

Follow the prompts to enter each value.

- [ ] **Step 2: Deploy**

```bash
npx cf pages deploy dist/ --project-name parsify
```

- [ ] **Step 3: Verify deployment**

Open `https://parsify.dev/`. Verify:
- Homepage loads and renders correctly
- Submit a URL → parsing works
- Summary appears (agent streaming works)

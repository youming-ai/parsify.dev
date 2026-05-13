# Astro → TanStack Start Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate parsify.dev from Astro 5 static site to TanStack Start, unifying onto the tanstack-bun-stack tech stack while preserving all existing functionality (2 AI tools, SEO, theme, static deployment).

**Architecture:** TanStack Start with file-based routing via TanStack Router. All pages are client-side rendered React components. Static HTML is generated via TanStack Start's build system for initial load performance. Deploy to Hetzner VPS via Dokploy (Docker) using Bun static file server.

**Tech Stack:** TanStack Start (react-start) + TanStack Router + Vite + React 19 + Tailwind CSS v4 + shadcn/ui + Lucide React + Biome + Bun + TypeScript strict

---

## File Structure (Post-Migration)

```
parsify-dev/
├── app.tsx                          # Root app component (replaces BaseLayout.astro)
├── router.tsx                       # TanStack Router config + route tree import
├── routeTree.gen.ts                 # Auto-generated route tree (gitignored)
├── routes/
│   ├── __root.tsx                   # Root layout: HTML shell, providers, global CSS
│   ├── index.tsx                    # Homepage (/)
│   ├── 404.tsx                      # 404 page
│   └── ai/
│       ├── index.tsx                # AI tools index (/ai)
│       ├── cost-calculator.tsx      # Cost Calculator tool page
│       └── cache-calculator.tsx     # Cache Calculator tool page
├── src/
│   ├── components/                  # UNCHANGED — all React components stay
│   │   ├── ui/                      # shadcn/ui primitives
│   │   ├── layout/                  # app-shell, header, footer, theme-toggle
│   │   ├── home/                    # hero-section
│   │   ├── tools/ai/                # tool components + shared/
│   │   ├── link.tsx
│   │   └── theme-provider.tsx
│   ├── lib/                         # UNCHANGED — pure logic
│   │   ├── llm/                     # cost-calculator, prompt-cache, live-registry
│   │   ├── icon-map.ts
│   │   ├── seo-config.ts
│   │   └── utils.ts
│   ├── data/                        # UNCHANGED
│   │   └── tools-data.ts
│   ├── hooks/                       # UNCHANGED
│   │   ├── use-live-models.ts
│   │   └── use-selected-model.ts
│   ├── styles/
│   │   └── app.css                  # Tailwind v4 entry (replaces globals.css)
│   └── __tests__/                   # MIGRATED — bun test
│       └── lib/llm/
├── public/                          # UNCHANGED — static assets
├── package.json
├── tsconfig.json                    # Updated for TanStack Start
├── vite.config.ts                   # NEW — Vite config with TanStack Start plugin
├── biome.json                       # Updated — remove .astro ignores
├── app.config.ts                    # NEW — TanStack Start config
├── Dockerfile                       # Updated build steps
├── docker-compose.yml               # UNCHANGED
├── server.ts                        # UNCHANGED — Bun static file server
└── .gitignore                       # Updated
```

### Files to DELETE
- `astro.config.mjs`
- `tailwind.config.mjs`
- `vitest.config.ts`
- `src/layouts/BaseLayout.astro`
- `src/pages/index.astro`
- `src/pages/404.astro`
- `src/pages/ai/index.astro`
- `src/pages/ai/cost-calculator.astro`
- `src/pages/ai/cache-calculator.astro`
- `src/components/seo/page-seo.astro`
- `.astro/` (auto-generated directory)
- `src/styles/globals.css` (replaced by `src/styles/app.css`)

### Files to CREATE
- `app.tsx`
- `router.tsx`
- `app.config.ts`
- `vite.config.ts`
- `routes/__root.tsx`
- `routes/index.tsx`
- `routes/404.tsx`
- `routes/ai/index.tsx`
- `routes/ai/cost-calculator.tsx`
- `routes/ai/cache-calculator.tsx`
- `src/components/seo/head.tsx` (React replacement for page-seo.astro)
- `src/styles/app.css` (Tailwind v4 entry)

### Files to MODIFY
- `package.json` (dependencies, scripts)
- `tsconfig.json` (remove Astro types, add TanStack types)
- `biome.json` (remove .astro ignores)
- `Dockerfile` (update build commands)
- `.gitignore` (add TanStack Start entries)
- `src/components/layout/app-shell.tsx` (minor — remove 'use client' directives)
- `src/components/layout/header.tsx` (minor — remove 'use client', use TanStack Link)
- `src/components/layout/footer.tsx` (minor — remove 'use client')
- `src/components/layout/theme-toggle.tsx` (minor — remove 'use client')
- `src/components/theme-provider.tsx` (minor — remove 'use client')
- `src/components/link.tsx` (use TanStack Router `<Link>`)
- `src/components/tools/ai/cost-calculator.tsx` (remove 'use client')
- `src/components/tools/ai/cache-calculator.tsx` (remove 'use client')
- `src/components/tools/ai/shared/*.tsx` (remove 'use client')
- `src/components/home/hero-section.tsx` (remove 'use client')
- `src/__tests__/lib/llm/cost-calculator.test.ts` (vitest → bun:test)
- `src/__tests__/lib/llm/prompt-cache.test.ts` (vitest → bun:test)
- `.husky/pre-commit` (update lint-staged)

---

## Task 1: Install TanStack Start Dependencies & Remove Astro

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove Astro and related dependencies, install TanStack Start**

```bash
bun remove astro @astrojs/react @astrojs/tailwind @astrojs/check tailwindcss autoprefixer postcss vitest @vitest/coverage-v8 @tailwindcss/typography
```

```bash
bun add @tanstack/react-router @tanstack/react-start @tanstack/react-router-devtools tailwindcss@4 @tailwindcss/vite vite
```

```bash
bun add -d @types/react @types/react-dom typescript @biomejs/biome
```

- [ ] **Step 2: Update package.json scripts**

Replace the `scripts` section in `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "bun run server.ts",
    "lint": "biome check ./src ./routes ./app.tsx ./router.tsx",
    "lint:fix": "biome check --fix ./src ./routes ./app.tsx ./router.tsx",
    "format": "biome format --write ./src ./routes ./app.tsx ./router.tsx",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "prepare": "husky",
    "clean": "rm -rf node_modules dist .output"
  }
}
```

- [ ] **Step 3: Update lint-staged in package.json**

Replace the `lint-staged` section:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,json,css,md}": ["biome check --fix --no-errors-on-unmatched"],
    "*.{ts,tsx}": ["bun test --related --run"]
  }
}
```

- [ ] **Step 4: Run `bun install` to regenerate lockfile**

```bash
bun install
```

Expected: Clean install with no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: swap astro deps for tanstack start + tailwind v4"
```

---

## Task 2: Configure TanStack Start (app.config.ts, vite.config.ts, tsconfig.json)

**Files:**
- Create: `app.config.ts`
- Create: `vite.config.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Create `app.config.ts`**

```typescript
import { defineConfig } from '@tanstack/react-start/config';

export default defineConfig({});
```

- [ ] **Step 2: Create `vite.config.ts`**

```typescript
import { TanStackStartVite } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [TanStackStartVite(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

- [ ] **Step 3: Update `tsconfig.json`**

Replace the entire file:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".vinxi/types.d.ts",
    "routeTree.gen.ts"
  ],
  "exclude": [
    "node_modules",
    "src/__tests__/**",
    "tests/**",
    "scripts/**",
    "dist",
    "server.ts"
  ]
}
```

- [ ] **Step 4: Verify TypeScript picks up the new config**

```bash
bunx tsc --version
```

Expected: TypeScript version output (no errors yet, just confirming the toolchain works).

- [ ] **Step 5: Commit**

```bash
git add app.config.ts vite.config.ts tsconfig.json
git commit -m "chore: add tanstack start + vite config, update tsconfig"
```

---

## Task 3: Create Router & Root App (router.tsx, app.tsx)

**Files:**
- Create: `router.tsx`
- Create: `app.tsx`

- [ ] **Step 1: Create `router.tsx`**

```typescript
import {
  createRouter as createTanStackRouter,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import type { Router } from '@tanstack/react-router';

export function createRouter(): Router<typeof routeTree> {
  return createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
```

- [ ] **Step 2: Create `app.tsx`**

```tsx
import { StartClient } from '@tanstack/react-start';
import { hydrateRoot } from 'react-dom/client';
import { createRouter } from './router';

const router = createRouter();

hydrateRoot(document.getElementById('root')!, <StartClient router={router} />);
```

- [ ] **Step 3: Commit**

```bash
git add router.tsx app.tsx
git commit -m "feat: add tanstack router and root app entry"
```

---

## Task 4: Migrate Tailwind v3 → v4 (globals.css → app.css)

**Files:**
- Delete: `src/styles/globals.css`
- Delete: `tailwind.config.mjs`
- Create: `src/styles/app.css`

- [ ] **Step 1: Create `src/styles/app.css` with Tailwind v4 syntax**

```css
@import 'tailwindcss';

@theme {
  --color-background: hsl(60 12% 96.5%);
  --color-foreground: hsl(240 10% 3.9%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(240 10% 3.9%);
  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(240 10% 3.9%);
  --color-primary: hsl(19 100% 48%);
  --color-primary-foreground: hsl(0 0% 100%);
  --color-secondary: hsl(240 4.8% 95.9%);
  --color-secondary-foreground: hsl(240 5.9% 10%);
  --color-muted: hsl(240 4.8% 95.9%);
  --color-muted-foreground: hsl(240 3.8% 46.1%);
  --color-accent: hsl(240 4.8% 95.9%);
  --color-accent-foreground: hsl(240 5.9% 10%);
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-destructive-foreground: hsl(0 0% 98%);
  --color-border: hsl(240 5.9% 90%);
  --color-input: hsl(240 5.9% 90%);
  --color-ring: hsl(19 100% 48%);
  --radius-lg: 0.75rem;
  --radius-md: calc(0.75rem - 2px);
  --radius-sm: calc(0.75rem - 4px);
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --color-dark-background: hsl(40 30% 6%);
  --color-dark-foreground: hsl(0 0% 98%);
  --color-dark-card: hsl(40 25% 8%);
  --color-dark-card-foreground: hsl(0 0% 98%);
  --color-dark-popover: hsl(40 25% 8%);
  --color-dark-popover-foreground: hsl(0 0% 98%);
  --color-dark-primary: hsl(19 100% 48%);
  --color-dark-primary-foreground: hsl(0 0% 100%);
  --color-dark-secondary: hsl(40 15% 14%);
  --color-dark-secondary-foreground: hsl(0 0% 98%);
  --color-dark-muted: hsl(40 15% 14%);
  --color-dark-muted-foreground: hsl(40 5% 60%);
  --color-dark-accent: hsl(40 15% 14%);
  --color-dark-accent-foreground: hsl(0 0% 98%);
  --color-dark-destructive: hsl(0 62.8% 30.6%);
  --color-dark-destructive-foreground: hsl(0 0% 98%);
  --color-dark-border: hsl(40 15% 16%);
  --color-dark-input: hsl(40 15% 16%);
  --color-dark-ring: hsl(19 100% 48%);
}

@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  }

  .dark {
    --color-background: var(--color-dark-background);
    --color-foreground: var(--color-dark-foreground);
    --color-card: var(--color-dark-card);
    --color-card-foreground: var(--color-dark-card-foreground);
    --color-popover: var(--color-dark-popover);
    --color-popover-foreground: var(--color-dark-popover-foreground);
    --color-primary: var(--color-dark-primary);
    --color-primary-foreground: var(--color-dark-primary-foreground);
    --color-secondary: var(--color-dark-secondary);
    --color-secondary-foreground: var(--color-dark-secondary-foreground);
    --color-muted: var(--color-dark-muted);
    --color-muted-foreground: var(--color-dark-muted-foreground);
    --color-accent: var(--color-dark-accent);
    --color-accent-foreground: var(--color-dark-accent-foreground);
    --color-destructive: var(--color-dark-destructive);
    --color-destructive-foreground: var(--color-dark-destructive-foreground);
    --color-border: var(--color-dark-border);
    --color-input: var(--color-dark-input);
    --color-ring: var(--color-dark-ring);
  }
}
```

- [ ] **Step 2: Delete old Tailwind v3 config**

```bash
rm tailwind.config.mjs src/styles/globals.css
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/app.css tailwind.config.mjs src/styles/globals.css
git commit -m "feat: migrate tailwind v3 to v4 with CSS @theme"
```

---

## Task 5: Create SEO Head Component (React replacement for page-seo.astro)

**Files:**
- Create: `src/components/seo/head.tsx`

- [ ] **Step 1: Create `src/components/seo/head.tsx`**

This replaces the Astro-only `page-seo.astro` component with a React component that manages `<head>` tags using TanStack Router's `Head` or direct `<head>` rendering in `__root.tsx`.

Since TanStack Start renders the full document, we'll use a simple approach: set document.title and meta tags via the route's `head` property, but also provide a utility component for JSON-LD injection.

```tsx
import { SEO_CONFIG } from '@/lib/seo-config';
import { useEffect } from 'react';

interface Breadcrumb {
  name: string;
  url: string;
}

interface HeadProps {
  title: string;
  description: string;
  path: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  appendSiteName?: boolean;
  breadcrumbs?: Breadcrumb[];
  extraJsonLd?: object;
}

export function useDocumentHead({
  title,
  description,
  path,
  ogType = 'website',
  ogImage = SEO_CONFIG.DEFAULT_OG_IMAGE,
  appendSiteName = true,
  breadcrumbs,
  extraJsonLd,
}: HeadProps) {
  const fullTitle =
    appendSiteName && !title.includes('Parsify.dev') ? `${title} | Parsify.dev` : title;
  const url = new URL(path, SEO_CONFIG.BASE_URL).toString();

  useEffect(() => {
    document.title = fullTitle;

    setMeta('description', description);
    setLink('canonical', url);
    setMetaProperty('og:title', fullTitle);
    setMetaProperty('og:description', description);
    setMetaProperty('og:type', ogType);
    setMetaProperty('og:url', url);
    setMetaProperty('og:site_name', SEO_CONFIG.SITE_NAME);
    setMetaProperty('og:locale', SEO_CONFIG.DEFAULT_LOCALE);
    setMetaProperty('og:image', ogImage);
    setMetaProperty('og:image:width', String(SEO_CONFIG.DEFAULT_OG_IMAGE_WIDTH));
    setMetaProperty('og:image:height', String(SEO_CONFIG.DEFAULT_OG_IMAGE_HEIGHT));
    setMetaName('twitter:card', 'summary_large_image');
    setMetaName('twitter:site', SEO_CONFIG.TWITTER_HANDLE);
    setMetaName('twitter:title', fullTitle);
    setMetaName('twitter:description', description);
    setMetaName('twitter:image', ogImage);

    const jsonLdScripts: object[] = [];

    if (breadcrumbs && breadcrumbs.length > 0) {
      jsonLdScripts.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: crumb.name,
          item: new URL(crumb.url, SEO_CONFIG.BASE_URL).toString(),
        })),
      });
    }

    if (extraJsonLd) {
      jsonLdScripts.push(extraJsonLd);
    }

    const existingScripts = document.querySelectorAll('script[data-seo-jsonld]');
    for (const s of existingScripts) s.remove();

    for (const jsonLd of jsonLdScripts) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', '');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [fullTitle, description, path, ogType, ogImage, breadcrumbs, extraJsonLd]);
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/seo/head.tsx
git commit -m "feat: add React SEO head hook replacing astro page-seo"
```

---

## Task 6: Create Root Layout (routes/__root.tsx)

**Files:**
- Create: `routes/__root.tsx`

This replaces `src/layouts/BaseLayout.astro`. It provides the HTML shell, theme bootstrap, global CSS import, and the AppShell wrapper.

- [ ] **Step 1: Create `routes/__root.tsx`**

```tsx
import { AppShell } from '@/components/layout/app-shell';
import '@/styles/app.css';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import type { Router } from '@/router';

function RootComponent() {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wmm88v8vgn");`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `var stored = localStorage.getItem('parsify-theme');
            var theme = stored !== null ? stored : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            if (theme === 'dark') document.documentElement.classList.add('dark');`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <AppShell>
          <Outlet />
        </AppShell>
      </body>
    </html>
  );
}

export const Route = createRootRouteWithContext<{ router: Router }>()({
  component: RootComponent,
});
```

- [ ] **Step 2: Commit**

```bash
git add routes/__root.tsx
git commit -m "feat: add root layout route replacing BaseLayout.astro"
```

---

## Task 7: Create Route Pages (Homepage, 404, AI index, Tool pages)

**Files:**
- Create: `routes/index.tsx`
- Create: `routes/404.tsx`
- Create: `routes/ai/index.tsx`
- Create: `routes/ai/cost-calculator.tsx`
- Create: `routes/ai/cache-calculator.tsx`

- [ ] **Step 1: Create `routes/index.tsx` (Homepage)**

```tsx
import { HeroSection } from '@/components/home/hero-section';
import { useDocumentHead } from '@/components/seo/head';
import { SEO_CONFIG } from '@/lib/seo-config';
import { toolsData } from '@/data/tools-data';
import { createFileRoute } from '@tanstack/react-router';

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SEO_CONFIG.SITE_NAME,
  description: SEO_CONFIG.DEFAULT_DESCRIPTION,
  url: `${SEO_CONFIG.BASE_URL}/`,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SEO_CONFIG.BASE_URL}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

function HomePage() {
  useDocumentHead({
    title: SEO_CONFIG.DEFAULT_TITLE,
    description: SEO_CONFIG.DEFAULT_DESCRIPTION,
    path: '/',
    appendSiteName: false,
    extraJsonLd: websiteJsonLd,
  });

  return (
    <div>
      <HeroSection tools={toolsData} />
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});
```

- [ ] **Step 2: Create `routes/404.tsx`**

```tsx
import { useDocumentHead } from '@/components/seo/head';
import { createFileRoute } from '@tanstack/react-router';

function NotFoundPage() {
  useDocumentHead({
    title: 'Page not found',
    description: "The page you're looking for doesn't exist.",
    path: '/404',
    appendSiteName: false,
  });

  return (
    <main id="main-content" className="container mx-auto max-w-7xl px-6 py-24 text-center lg:px-8">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
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

export const Route = createFileRoute('/404')({
  component: NotFoundPage,
});
```

- [ ] **Step 3: Create `routes/ai/index.tsx` (AI tools listing)**

```tsx
import { useDocumentHead } from '@/components/seo/head';
import { toolsData, AI_TOOLS_CATEGORY } from '@/data/tools-data';
import { createFileRoute } from '@tanstack/react-router';

const tools = toolsData.filter((tool) => tool.category === AI_TOOLS_CATEGORY);
const title = 'AI & LLM Developer Tools';
const desc =
  'Privacy-first browser tools for AI agent and LLM application developers — cost calculators, cache analysis, SSE stream parsers, and JSONL editors.';

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: title,
  description: desc,
  url: 'https://parsify.dev/ai',
  hasPart: tools.map((tool) => ({
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: `https://parsify.dev${tool.href}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  })),
};

function AIToolsPage() {
  useDocumentHead({
    title,
    description: desc,
    path: '/ai',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'AI & LLM Tools', url: '/ai' },
    ],
    extraJsonLd: collectionJsonLd,
  });

  return (
    <main id="main-content" className="container mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-medium text-primary">AI & LLM Tools</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Browser tools for AI agent developers
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Estimate costs, analyze cache savings, debug streaming responses, and edit JSONL datasets
          without sending your data to Parsify servers.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <a key={tool.id} href={tool.href} className="rounded-xl border bg-card p-5 transition hover:border-primary">
            <h2 className="font-semibold">{tool.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
          </a>
        ))}
      </div>
    </main>
  );
}

export const Route = createFileRoute('/ai/')({
  component: AIToolsPage,
});
```

- [ ] **Step 4: Create `routes/ai/cost-calculator.tsx`**

```tsx
import { CostCalculator } from '@/components/tools/ai/cost-calculator';
import { useDocumentHead } from '@/components/seo/head';
import { softwareApplicationJsonLd } from '@/lib/seo-config';
import { toolsData } from '@/data/tools-data';
import { createFileRoute } from '@tanstack/react-router';

const tool = toolsData.find((t) => t.id === 'cost-calculator')!;

function CostCalculatorPage() {
  useDocumentHead({
    title: tool.name,
    description: tool.description,
    path: tool.href,
    ogType: 'article',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'AI & LLM Tools', url: '/ai' },
      { name: tool.name, url: tool.href },
    ],
    extraJsonLd: softwareApplicationJsonLd(tool),
  });

  return (
    <main id="main-content" className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <CostCalculator />
    </main>
  );
}

export const Route = createFileRoute('/ai/cost-calculator')({
  component: CostCalculatorPage,
});
```

- [ ] **Step 5: Create `routes/ai/cache-calculator.tsx`**

```tsx
import { CacheCalculator } from '@/components/tools/ai/cache-calculator';
import { useDocumentHead } from '@/components/seo/head';
import { softwareApplicationJsonLd } from '@/lib/seo-config';
import { toolsData } from '@/data/tools-data';
import { createFileRoute } from '@tanstack/react-router';

const tool = toolsData.find((t) => t.id === 'cache-calculator')!;

function CacheCalculatorPage() {
  useDocumentHead({
    title: tool.name,
    description: tool.description,
    path: tool.href,
    ogType: 'article',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'AI & LLM Tools', url: '/ai' },
      { name: tool.name, url: tool.href },
    ],
    extraJsonLd: softwareApplicationJsonLd(tool),
  });

  return (
    <main id="main-content" className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <CacheCalculator />
    </main>
  );
}

export const Route = createFileRoute('/ai/cache-calculator')({
  component: CacheCalculatorPage,
});
```

- [ ] **Step 6: Commit**

```bash
git add routes/
git commit -m "feat: add all route pages (home, 404, ai index, cost/cache calculator)"
```

---

## Task 8: Update Component Files (remove 'use client', update Link)

**Files:**
- Modify: `src/components/link.tsx`
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/components/layout/header.tsx`
- Modify: `src/components/layout/footer.tsx`
- Modify: `src/components/layout/theme-toggle.tsx`
- Modify: `src/components/theme-provider.tsx`
- Modify: `src/components/tools/ai/cost-calculator.tsx`
- Modify: `src/components/tools/ai/cache-calculator.tsx`
- Modify: `src/components/tools/ai/shared/tool-page-shell.tsx`
- Modify: `src/components/tools/ai/shared/result-card.tsx`
- Modify: `src/components/tools/ai/shared/cost-breakdown.tsx`
- Modify: `src/components/tools/ai/shared/model-selector.tsx`
- Modify: `src/components/tools/ai/shared/related-tools.tsx`
- Modify: `src/components/tools/ai/shared/metric-card.tsx`
- Modify: `src/components/home/hero-section.tsx`
- Modify: `src/hooks/use-live-models.ts`
- Modify: `src/hooks/use-selected-model.ts`

In TanStack Start, all components are React components — no need for `'use client'` directives. The `Link` component should use TanStack Router's `<Link>` for client-side navigation.

- [ ] **Step 1: Update `src/components/link.tsx` to use TanStack Router Link**

Replace the entire file:

```tsx
import { Link as TanStackLink } from '@tanstack/react-router';
import type { ReactNode } from 'react';

interface LinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export function Link({ href, children, className, ...props }: LinkProps) {
  if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) {
    return (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    );
  }

  return (
    <TanStackLink to={href} className={className} {...props}>
      {children}
    </TanStackLink>
  );
}
```

- [ ] **Step 2: Remove `'use client'` from all component files**

Remove the `'use client';` line (line 1) from each of these files:
- `src/components/layout/app-shell.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/footer.tsx`
- `src/components/layout/theme-toggle.tsx`
- `src/components/theme-provider.tsx`
- `src/components/tools/ai/cost-calculator.tsx`
- `src/components/tools/ai/cache-calculator.tsx`
- `src/components/tools/ai/shared/tool-page-shell.tsx`
- `src/components/tools/ai/shared/result-card.tsx`
- `src/components/tools/ai/shared/cost-breakdown.tsx`
- `src/components/tools/ai/shared/model-selector.tsx`
- `src/components/tools/ai/shared/related-tools.tsx`
- `src/components/tools/ai/shared/metric-card.tsx`
- `src/components/home/hero-section.tsx`
- `src/hooks/use-live-models.ts`
- `src/hooks/use-selected-model.ts`

For each file, delete the first line: `'use client';`

- [ ] **Step 3: Commit**

```bash
git add src/components/ src/hooks/
git commit -m "refactor: remove use client directives, use tanstack router link"
```

---

## Task 9: Migrate Tests from Vitest to Bun Test

**Files:**
- Modify: `src/__tests__/lib/llm/cost-calculator.test.ts`
- Modify: `src/__tests__/lib/llm/prompt-cache.test.ts`
- Delete: `vitest.config.ts`

- [ ] **Step 1: Update `src/__tests__/lib/llm/cost-calculator.test.ts`**

Replace the import line:

```typescript
// Change this:
import { describe, expect, it } from 'vitest';
// To this:
import { describe, expect, it } from 'bun:test';
```

Rest of the file stays identical.

- [ ] **Step 2: Update `src/__tests__/lib/llm/prompt-cache.test.ts`**

Replace the import line:

```typescript
// Change this:
import { describe, expect, it } from 'vitest';
// To this:
import { describe, expect, it } from 'bun:test';
```

- [ ] **Step 3: Delete `vitest.config.ts`**

```bash
rm vitest.config.ts
```

- [ ] **Step 4: Run tests to verify**

```bash
bun test
```

Expected: All 12 tests pass (6 for cost-calculator, 6 for prompt-cache).

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/ vitest.config.ts
git commit -m "test: migrate from vitest to bun test"
```

---

## Task 10: Delete Astro Files & Update Config Files

**Files:**
- Delete: `astro.config.mjs`
- Delete: `src/layouts/BaseLayout.astro`
- Delete: `src/pages/index.astro`
- Delete: `src/pages/404.astro`
- Delete: `src/pages/ai/index.astro`
- Delete: `src/pages/ai/cost-calculator.astro`
- Delete: `src/pages/ai/cache-calculator.astro`
- Delete: `src/components/seo/page-seo.astro`
- Delete: `src/styles/globals.css` (if not already deleted in Task 4)
- Modify: `biome.json`
- Modify: `.gitignore`
- Modify: `Dockerfile`
- Modify: `AGENTS.md`
- Modify: `.husky/pre-commit`

- [ ] **Step 1: Delete all Astro files**

```bash
rm astro.config.mjs
rm src/layouts/BaseLayout.astro
rm src/pages/index.astro
rm src/pages/404.astro
rm src/pages/ai/index.astro
rm src/pages/ai/cost-calculator.astro
rm src/pages/ai/cache-calculator.astro
rm src/components/seo/page-seo.astro
rmdir src/pages/ai
rmdir src/pages
rmdir src/layouts
rm -rf .astro
```

- [ ] **Step 2: Update `biome.json`**

Remove `.astro` and `*.astro` from `files.ignore`:

```json
{
  "files": {
    "ignore": [".vinxi", "public", "routeTree.gen.ts"]
  }
}
```

- [ ] **Step 3: Update `.gitignore`**

Add these entries (TanStack Start / Vinxi generated files):

```
# TanStack Start
.vinxi/
routeTree.gen.ts
.output/
```

- [ ] **Step 4: Update `Dockerfile`**

Replace the entire file:

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

Note: The Dockerfile stays the same since `bun run build` now runs `vite build` instead of `astro build`, and the output still goes to `dist/`.

- [ ] **Step 5: Update `.husky/pre-commit`**

Replace the content:

```
bunx lint-staged
```

(Stays the same — lint-staged config is in package.json.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: delete astro files, update biome/gitignore/dockerfile"
```

---

## Task 11: Generate Route Tree & Verify Build

**Files:**
- Auto-generated: `routeTree.gen.ts`

- [ ] **Step 1: Run the dev server once to generate route tree**

```bash
bun run dev &
sleep 5
kill %1
```

This triggers TanStack Router's file-based route generation, which creates `routeTree.gen.ts`.

- [ ] **Step 2: Verify route tree was generated**

```bash
ls -la routeTree.gen.ts
```

Expected: File exists with route definitions for `/`, `/404`, `/ai/`, `/ai/cost-calculator`, `/ai/cache-calculator`.

- [ ] **Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: No TypeScript errors.

Fix any errors found. Common issues:
- Missing type declarations for `.css` imports — may need `src/vite-env.d.ts`
- Path alias resolution — verify `@/*` works in both `tsconfig.json` and `vite.config.ts`

- [ ] **Step 4: Run lint**

```bash
bun run lint
```

Expected: No Biome errors. Fix any that appear.

- [ ] **Step 5: Run tests**

```bash
bun test
```

Expected: All 12 tests pass.

- [ ] **Step 6: Run build**

```bash
bun run build
```

Expected: Build succeeds, `dist/` directory contains HTML files and bundled assets.

- [ ] **Step 7: Verify dist output**

```bash
ls dist/
```

Expected: `index.html`, `ai/index.html`, `ai/cost-calculator/index.html`, `ai/cache-calculator/index.html`, `404.html`, plus `assets/` directory with hashed JS/CSS.

- [ ] **Step 8: Commit**

```bash
git add routeTree.gen.ts
git commit -m "chore: generate route tree, verify build passes"
```

---

## Task 12: Smoke Test with Bun Server

**Files:**
- Unchanged: `server.ts`

- [ ] **Step 1: Start the production server**

```bash
bun run start
```

Expected: `Server running at http://localhost:3000`

- [ ] **Step 2: Verify each page loads**

```bash
curl -s http://localhost:3000/ | head -20
curl -s http://localhost:3000/ai | head -20
curl -s http://localhost:3000/ai/cost-calculator | head -20
curl -s http://localhost:3000/ai/cache-calculator | head -20
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/nonexistent
```

Expected: HTML content for valid pages, 404 page for nonexistent routes.

- [ ] **Step 3: Stop the server**

```bash
# Ctrl+C or kill the process
```

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address build and runtime issues from migration"
```

---

## Task 13: Update AGENTS.md Documentation

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update AGENTS.md to reflect TanStack Start architecture**

Key changes to document:
- Commands table: `bun run dev` → Vite dev server, `bun run build` → Vite build, `bun run typecheck` → `tsc --noEmit`, `bun test` → Bun test runner
- Architecture section: No more Astro, no `.astro` files, TanStack Start with file-based routing
- Source layout: `routes/` directory instead of `src/pages/`, `app.tsx` + `router.tsx` as entry points
- Route → component pattern: `routes/ai/<tool>.tsx` imports component from `src/components/tools/ai/<tool>.tsx`
- Testing: `bun:test` instead of `vitest`
- Remove Astro-specific notes (wrangler.toml, cloudflare, etc.)

This is a documentation-only change — update the file to accurately describe the new architecture.

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md for tanstack start migration"
```

---

## Self-Review

### Spec Coverage
- [x] Remove all Astro dependencies → Task 1
- [x] Install TanStack Start → Task 1
- [x] Configure TanStack Start → Task 2
- [x] Migrate Tailwind v3 → v4 → Task 4
- [x] Replace BaseLayout.astro → Task 6 (routes/__root.tsx)
- [x] Migrate all 5 Astro pages to .tsx routes → Task 7
- [x] Replace page-seo.astro → Task 5
- [x] Update Link component for TanStack Router → Task 8
- [x] Remove 'use client' directives → Task 8
- [x] Migrate Vitest → bun test → Task 9
- [x] Delete all .astro files → Task 10
- [x] Update biome.json → Task 10
- [x] Update Dockerfile → Task 10
- [x] Update .gitignore → Task 10
- [x] Verify build + tests → Task 11
- [x] Smoke test → Task 12
- [x] Update docs → Task 13
- [x] Keep all lib/, hooks/, data/, components/ui/ unchanged

### Placeholder Scan
- No TBD, TODO, or placeholder patterns found
- All code blocks contain complete implementations
- All commands include expected output descriptions

### Type Consistency
- `useDocumentHead` hook matches the old `PageSEO` component props exactly
- Route file patterns are consistent across all 5 routes
- Import paths use `@/` alias consistently

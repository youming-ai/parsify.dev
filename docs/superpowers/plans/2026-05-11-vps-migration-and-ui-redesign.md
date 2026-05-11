# VPS Migration & UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate from Cloudflare to Hetzner VPS + Docker with a Bun static file server, and redesign the 2 tool pages with a modern two-panel layout.

**Architecture:** Astro 5 builds static `dist/`. A thin `server.ts` using `Bun.serve()` serves `dist/` with security/cache headers. Docker multi-stage build ships only `dist/` + `server.ts` on `oven/bun:1-slim`. Tool components refactored to use `<ToolPageShell>`, `<ResultCard>`, and `<CostBreakdown>` shared components.

**Tech Stack:** Astro 5, React 19, Tailwind CSS, shadcn/ui, Bun, Docker

---

### Task 1: Remove Cloudflare-specific artifacts

**Files:**
- Delete: `wrangler.toml`
- Delete: `public/_headers`
- Delete: `.wrangler/`

- [ ] **Step 1: Delete Cloudflare config files**

```bash
rm wrangler.toml
rm public/_headers
rm -rf .wrangler
```

- [ ] **Step 2: Commit removal**

```bash
git add -A && git commit -m "chore: remove Cloudflare-specific config files"
```

---

### Task 2: Create Bun static file server

**Files:**
- Create: `server.ts`

- [ ] **Step 1: Write `server.ts`**

```typescript
const PORT = Number(process.env['PORT'] ?? 3000);

const DIST = './dist';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function getMime(path: string): string {
  const ext = path.substring(path.lastIndexOf('.'));
  return MIME[ext] ?? 'application/octet-stream';
}

function isAstroAsset(urlPath: string): boolean {
  return urlPath.startsWith('/_astro/');
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // Strip trailing slash except root
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Resolve file: exact path → .html extension → 404
    let file = Bun.file(`${DIST}${pathname}`);
    let resolvedPath = pathname;

    if (!(await file.exists())) {
      resolvedPath = `${pathname}.html`;
      file = Bun.file(`${DIST}${resolvedPath}`);
      if (!(await file.exists())) {
        resolvedPath = '/404.html';
        file = Bun.file(`${DIST}/404.html`);
      }
    }

    const headers = new Headers();
    headers.set('Content-Type', getMime(resolvedPath));
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Cache: hashed assets immutable, HTML must-revalidate
    if (isAstroAsset(resolvedPath)) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      headers.set('Cache-Control', 'public, must-revalidate');
    }

    return new Response(file, { headers });
  },
});

// biome-ignore lint/suspicious/noConsole: server startup log
console.log(`Server running at http://localhost:${server.port}`);
```

This file has a logic issue — let me rewrite it correctly. The path resolution and cache header logic needs to be clean. Let me provide the corrected version:

```typescript
const PORT = Number(process.env['PORT'] ?? 3000);

const DIST = './dist';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
];

function getMime(path: string): string {
  const ext = path.substring(path.lastIndexOf('.'));
  return MIME[ext] ?? 'application/octet-stream';
}

function isAstroAsset(urlPath: string): boolean {
  return urlPath.startsWith('/_astro/');
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // Strip trailing slash except root
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Resolve file
    let file = Bun.file(`${DIST}${pathname}`);
    if (!(await file.exists())) {
      // Try .html extension
      file = Bun.file(`${DIST}${pathname}.html`);
      if (!(await file.exists())) {
        // SPA fallback — 404 → index.html
        file = Bun.file(`${DIST}/index.html`);
      }
    }

    const headers = new Headers();
    headers.set('Content-Type', getMime(pathname.endsWith('.html') ? pathname : pathname));
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Cache: hashed assets immutable, HTML must-revalidate
    if (isAstroAsset(pathname)) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      headers.set('Cache-Control', 'public, must-revalidate');
    }

    return new Response(file, { headers });
  },
});

// biome-ignore lint/suspicious/noConsole: server startup log
console.log(`Server running at http://localhost:${server.port}`);
```

- [ ] **Step 2: Commit server**

```bash
git add server.ts && git commit -m "feat: add Bun static file server"
```

---

### Task 3: Create Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Write `Dockerfile`**

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

- [ ] **Step 2: Commit Dockerfile**

```bash
git add Dockerfile && git commit -m "feat: add multi-stage Dockerfile"
```

---

### Task 4: Create docker-compose.yml

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Write `docker-compose.yml`**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
```

- [ ] **Step 2: Commit docker-compose**

```bash
git add docker-compose.yml && git commit -m "feat: add docker-compose for local dev parity"
```

---

### Task 5: Update package.json scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update `package.json`**

Add a `start` script for production, and ensure the `build` script is clean (no sitemap step needed for now).

Change the `build` script from:
```json
"build": "astro build && bun scripts/generate-sitemap.ts",
```
to:
```json
"build": "astro build",
```

And add `start`:
```json
"start": "bun run server.ts",
```

Use edit tool:
- `oldString`: `"build": "astro build && bun scripts/generate-sitemap.ts",`
- `newString`: `"build": "astro build",`
- Then add `"start": "bun run server.ts",` after the `"preview"` line.

- [ ] **Step 2: Commit**

```bash
git add package.json && git commit -m "chore: update build script, add start script"
```

---

### Task 6: Create ToolPageShell component

**Files:**
- Create: `src/components/tools/ai/shared/tool-page-shell.tsx`

- [ ] **Step 1: Write `ToolPageShell`**

```tsx
'use client';

import type { ReactNode } from 'react';

interface ToolPageShellProps {
  title: string;
  description: string;
  backHref: string;
  children: ReactNode;
}

export function ToolPageShell({ title, description, backHref, children }: ToolPageShellProps) {
  return (
    <div className="space-y-6">
      <a
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        All tools
      </a>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tools/ai/shared/tool-page-shell.tsx && git commit -m "feat: add ToolPageShell shared layout component"
```

---

### Task 7: Create ResultCard component

**Files:**
- Create: `src/components/tools/ai/shared/result-card.tsx`

- [ ] **Step 1: Write `ResultCard`**

```tsx
'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ResultCardProps {
  value: number;
  label: string;
  format?: 'currency' | 'number' | 'percentage';
  className?: string;
}

function formatValue(value: number, format: 'currency' | 'number' | 'percentage'): string {
  switch (format) {
    case 'currency':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'number':
      return value.toLocaleString('en-US');
    case 'percentage':
      return `${value.toFixed(1)}%`;
  }
}

export function ResultCard({ value, label, format = 'currency', className }: ResultCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = displayValue;
    const diff = value - start;
    if (diff === 0) return;

    const duration = 300;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(start + diff * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 transition-all duration-200',
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight transition-colors">
        {formatValue(format === 'number' ? value : displayValue, format)}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tools/ai/shared/result-card.tsx && git commit -m "feat: add ResultCard component with animated count-up"
```

---

### Task 8: Create CostBreakdown component

**Files:**
- Create: `src/components/tools/ai/shared/cost-breakdown.tsx`

- [ ] **Step 1: Write `CostBreakdown`**

```tsx
'use client';

import { cn } from '@/lib/utils';

interface BreakdownItem {
  label: string;
  value: number;
  color: string;
}

interface CostBreakdownProps {
  items: BreakdownItem[];
  label: string;
  className?: string;
}

export function CostBreakdown({ items, label, className }: CostBreakdownProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="min-w-[80px] text-sm">{item.label}</span>
            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
            <span className="w-24 text-right text-sm tabular-nums">
              ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tools/ai/shared/cost-breakdown.tsx && git commit -m "feat: add CostBreakdown component with proportional bars"
```

---

### Task 9: Refactor cost-calculator.tsx

**Files:**
- Modify: `src/components/tools/ai/cost-calculator.tsx`

- [ ] **Step 1: Rewrite cost-calculator.tsx**

Replace the entire file content:

```tsx
'use client';

import { CostBreakdown } from '@/components/tools/ai/shared/cost-breakdown';
import { ModelSelector } from '@/components/tools/ai/shared/model-selector';
import { ResultCard } from '@/components/tools/ai/shared/result-card';
import { ToolPageShell } from '@/components/tools/ai/shared/tool-page-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSelectedModel } from '@/hooks/use-selected-model';
import { calculateMonthlyCost } from '@/lib/llm/cost-calculator';
import { useState } from 'react';

export function CostCalculator() {
  const [modelId, setModelId] = useState('gpt-4o');
  const [monthlyRequests, setMonthlyRequests] = useState(100000);
  const [inputTokens, setInputTokens] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [cacheHitRate, setCacheHitRate] = useState(0);
  const [useBatch, setUseBatch] = useState(false);

  const model = useSelectedModel(modelId);

  const result = model
    ? calculateMonthlyCost({
        monthlyRequests,
        inputTokensPerRequest: inputTokens,
        outputTokensPerRequest: outputTokens,
        inputPricePerMillion: model.pricing.input,
        outputPricePerMillion: model.pricing.output,
        cacheReadPricePerMillion: model.pricing.cacheRead,
        cacheHitRate: cacheHitRate / 100,
        useBatch,
        batchInputPricePerMillion: model.pricing.batchInput,
        batchOutputPricePerMillion: model.pricing.batchOutput,
      })
    : undefined;

  const breakdownItems = result
    ? [
        { label: 'Input tokens', value: result.inputCost, color: '#3b82f6' },
        { label: 'Output tokens', value: result.outputCost, color: '#10b981' },
      ]
    : [];

  return (
    <ToolPageShell
      title="LLM Cost Calculator"
      description="Compare estimated monthly API spend using local calculations."
      backHref="/ai"
    >
      {/* Left: Input Panel */}
      <div className="space-y-4">
        <ModelSelector value={modelId} onValueChange={setModelId} />
        <div className="space-y-2">
          <Label>Monthly requests</Label>
          <Input
            type="number"
            value={monthlyRequests}
            onChange={(event) => setMonthlyRequests(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Average input tokens</Label>
          <Input
            type="number"
            value={inputTokens}
            onChange={(event) => setInputTokens(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Average output tokens</Label>
          <Input
            type="number"
            value={outputTokens}
            onChange={(event) => setOutputTokens(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Cache hit rate (%)</Label>
          <Input
            type="number"
            value={cacheHitRate}
            onChange={(event) => setCacheHitRate(Number(event.target.value))}
          />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={useBatch} onCheckedChange={setUseBatch} />
          <Label>Use batch pricing when available</Label>
        </div>
      </div>

      {/* Right: Results Panel */}
      <div className="space-y-4">
        <ResultCard
          value={result?.totalCost ?? 0}
          label="Estimated monthly cost"
        />
        <CostBreakdown items={breakdownItems} label="Cost breakdown" />
      </div>
    </ToolPageShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tools/ai/cost-calculator.tsx && git commit -m "refactor: redesign cost-calculator with two-panel layout"
```

---

### Task 10: Refactor cache-calculator.tsx

**Files:**
- Modify: `src/components/tools/ai/cache-calculator.tsx`

- [ ] **Step 1: Rewrite cache-calculator.tsx**

Replace the entire file content:

```tsx
'use client';

import { CostBreakdown } from '@/components/tools/ai/shared/cost-breakdown';
import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { ModelSelector } from '@/components/tools/ai/shared/model-selector';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { ResultCard } from '@/components/tools/ai/shared/result-card';
import { ToolPageShell } from '@/components/tools/ai/shared/tool-page-shell';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSelectedModel } from '@/hooks/use-selected-model';
import { calculatePromptCache } from '@/lib/llm/prompt-cache';
import { useMemo, useState } from 'react';

export function CacheCalculator() {
  const [modelId, setModelId] = useState('gpt-4o');
  const [staticTokens, setStaticTokens] = useState(5000);
  const [dynamicTokens, setDynamicTokens] = useState(500);
  const [outputTokens, setOutputTokens] = useState(300);
  const [monthlyCalls, setMonthlyCalls] = useState(10000);
  const [hitRate, setHitRate] = useState(80);

  const model = useSelectedModel(modelId);
  const result = useMemo(() => {
    const inputPrice = model?.pricing.input ?? 0;
    const outputPrice = model?.pricing.output ?? 0;
    const cacheWritePrice = model?.pricing.cacheWrite;
    const cacheReadPrice = model?.pricing.cacheRead;
    return calculatePromptCache({
      staticTokens,
      dynamicTokens,
      outputTokens,
      monthlyCalls,
      inputPrice,
      outputPrice,
      cacheWritePrice,
      cacheReadPrice,
      hitRate: hitRate / 100,
    });
  }, [staticTokens, dynamicTokens, outputTokens, monthlyCalls, hitRate, model]);

  const badgeClasses: Record<string, string> = {
    recommended: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    neutral: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'not-worth-it': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    unavailable: 'bg-muted text-muted-foreground',
  };

  const breakdownItems = [
    { label: 'Cached cost', value: result.cachedCost, color: '#10b981' },
    { label: 'Uncached cost', value: result.uncachedCost, color: '#3b82f6' },
  ];

  const savingsPercent =
    result.uncachedCost > 0 ? (result.savings / result.uncachedCost) * 100 : 0;

  return (
    <ToolPageShell
      title="Prompt Cache Calculator"
      description="Calculate whether prompt caching saves money based on token mix and hit rate."
      backHref="/ai"
    >
      {/* Left: Input Panel */}
      <div className="space-y-4">
        <ModelSelector value={modelId} onValueChange={setModelId} />
        <div className="space-y-2">
          <Label>Static tokens (per request)</Label>
          <Input
            type="number"
            value={staticTokens}
            onChange={(event) => setStaticTokens(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Dynamic tokens (per request)</Label>
          <Input
            type="number"
            value={dynamicTokens}
            onChange={(event) => setDynamicTokens(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Output tokens (per request)</Label>
          <Input
            type="number"
            value={outputTokens}
            onChange={(event) => setOutputTokens(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Monthly calls</Label>
          <Input
            type="number"
            value={monthlyCalls}
            onChange={(event) => setMonthlyCalls(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Cache hit rate (%)</Label>
          <Input
            type="number"
            value={hitRate}
            onChange={(event) => setHitRate(Number(event.target.value))}
          />
        </div>
      </div>

      {/* Right: Results Panel */}
      <div className="space-y-4">
        <ResultCard value={result.savings} label="Estimated savings" />
        <CostBreakdown items={breakdownItems} label="Cost comparison" />
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Break-even calls"
            value={result.breakEvenCalls.toLocaleString('en-US')}
          />
          <MetricCard
            label="Savings %"
            value={`${savingsPercent.toFixed(1)}%`}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Recommendation:</span>
          <Badge className={badgeClasses[result.recommendation] ?? badgeClasses.unavailable}>
            {result.recommendation}
          </Badge>
        </div>
        <RelatedTools toolId="cache-calculator" />
      </div>
    </ToolPageShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tools/ai/cache-calculator.tsx && git commit -m "refactor: redesign cache-calculator with two-panel layout"
```

---

### Task 11: Verify build, lint, typecheck, and tests

**Files:** None modified (verification only)

- [ ] **Step 1: Run lint**

```bash
bun run lint
```
Expected: No errors.

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```
Expected: No errors.

- [ ] **Step 3: Run tests**

```bash
bun test
```
Expected: All tests pass.

- [ ] **Step 4: Run build**

```bash
bun run build
```
Expected: Build succeeds, `dist/` created.

- [ ] **Step 5: Manually verify server starts**

```bash
bun run server.ts &
sleep 2
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
kill %1
```
Expected: `200`

- [ ] **Step 6: Commit final verification record**

```bash
git add -A && git commit -m "chore: verification - all checks pass"
```

---

### Task 12 (Optional): Docker build verification

**Files:** None modified (verification only)

- [ ] **Step 1: Build Docker image**

```bash
docker build -t parsify-dev:latest .
```
Expected: Build succeeds.

- [ ] **Step 2: Start container and test**

```bash
docker run -d -p 3001:3000 --name parsify-test parsify-dev:latest
sleep 2
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/
docker stop parsify-test && docker rm parsify-test
```
Expected: `200`

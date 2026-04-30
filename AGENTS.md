# AGENTS.md - Parsify.dev

> Privacy-first, browser-side AI & LLM developer tools platform.
> Guidelines for AI coding agents to maintain consistency, performance, and security.

## Tech Stack

- **Framework**: Astro 5 + React 19 islands
- **Runtime**: Bun 1.3+ (packageManager: bun@1.3.5)
- **Styling**: Tailwind CSS 3 + shadcn/ui (class-variance-authority, clsx)
- **Testing**: Vitest in `node` environment (pure-logic suite, no DOM)
- **Deployment**: Static build (`output: 'static'`, no adapter); `dist/` ready for any static host. Cloudflare Workers Builds abandoned 2026-04-30.
- **Lint**: Biome (2-space indent, 100 char width)
- **TypeScript**: Strict mode, noUncheckedIndexedAccess enabled

## Essential Commands

| Purpose | Command | Notes |
|----------|----------|--------|
| **Dev** | `bun run dev` | Astro dev server |
| **Build** | `bun run build` | Static site → `dist/` |
| **Lint** | `bun run lint` | Biome check `./src` |
| **Fix** | `bun run lint:fix` | Auto-fix with `--fix ./src` |
| **Format** | `bun run format` | Biome format `--write ./src` |
| **Type Check** | `bun run typecheck` | `astro check` |
| **Test All** | `bun test` | Vitest (node env, no DOM) |
| **Test File** | `bun test <path>` | Run specific test file |
| **Test UI** | `bun run test:ui` | Interactive Vitest UI |
| **Coverage** | `bun run test:coverage` | V8 provider, excludes `src/components/ui/**` |
| **Deploy** | Not configured | Pick a static host and add an adapter / CI step |

**Pre-commit**: `bun run lint:fix && bun run typecheck && bun test` (via husky)

## Project Structure

```
src/
├── pages/
│   ├── index.astro          # Homepage
│   └── ai/                  # All AI/LLM tool routes
│       ├── index.astro      # AI tools category page
│       └── <tool>.astro     # One route per tool
├── components/
│   ├── ui/                  # shadcn/ui (Radix primitives) — REUSE FIRST
│   ├── layout/              # Header, Footer, AppShell
│   ├── home/                # HeroSection
│   ├── tools/ai/            # AI/LLM tool React components
│   │   ├── <tool>.tsx       # Per-tool implementation
│   │   └── shared/          # Shared AI components
│   │       ├── model-selector.tsx
│   │       ├── token-counter-bar.tsx
│   │       ├── api-key-input.tsx
│   │       ├── code-export-tabs.tsx
│   │       ├── metric-card.tsx
│   │       ├── json-textarea.tsx
│   │       ├── related-tools.tsx
│   │       ├── provider-selector.tsx
│   │       └── byok-notice.tsx
│   └── seo/, analytics/, error-boundary.tsx, theme-provider.tsx
├── lib/
│   ├── llm/                 # AI/LLM pure logic modules
│   │   ├── registry.ts, cost-calculator.ts, text-chunker.ts
│   │   ├── sse-parser.ts, tool-schema-converter.ts
│   │   ├── context-visualizer.ts, prompt-cache.ts
│   │   ├── prompt-diff.ts, prompt-linter.ts
│   │   ├── schema-generator.ts, structured-output-validator.ts
│   │   ├── jsonl.ts, model-comparison.ts
│   │   ├── rate-limit-calculator.ts, prompt-format-converter.ts
│   │   ├── few-shot-builder.ts, prompt-variable-filler.ts
│   │   ├── schema-builder.ts, finetuning-validator.ts
│   │   ├── embedding-visualizer.ts, api-request-builder.ts
│   │   └── provider-client.ts
│   ├── seo-config.ts, structured-data.ts
│   ├── icon-map.ts, performance.ts
│   └── utils.ts             # cn() helper
├── data/
│   ├── tools-data.ts        # AI/LLM tool registry
│   └── llm-registry.json    # Model facts & pricing
├── hooks/                   # Custom React hooks
├── layout/
│   └── BaseLayout.astro     # HTML shell
├── types/
│   ├── tools.ts             # Tool, ToolCategoryData interfaces
│   └── llm.ts               # LLM model types
└── __tests__/
    ├── setup.ts
    └── lib/llm/              # Per-module test files
```

## Code Style & Standards (Biome)

**Formatting**:
- 2 spaces
- 100 chars line width
- Single quotes for JS/JSX, Double quotes for JSX props
- Semicolons always
- Trailing commas ES5 style
- Line ending LF (Unix)

**Naming**:
- **Components**: `PascalCase` (`ModelSelector`, `PrompDiff`)
- **Functions/Hooks**: `camelCase` (`useTextAnalysis`, `cn`)
- **Files**: `kebab-case` (`json-textarea.ts`, `hash-operations.ts`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_PAYLOAD_SIZE`)
- **Interfaces**: `PascalCase` (`Tool`, `LLMModel`)

**Imports Order** (STRICT):
```typescript
'use client';

import { Icon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { cn } from '@/lib/utils';
import { calculateMonthlyCost } from '@/lib/llm/cost-calculator';
import type { Tool } from '@/types/tools';
```

**TypeScript**:
- Strict mode enabled
- NoUncheckedIndexedAccess enabled
- `unknown` over `any`
- Interfaces for objects, `type` for unions/primitives
- Explicit return types on exported functions
- `import type` for type-only imports

**Astro + React**:
- `.astro` page files are the route entry (SEO metadata, `<slot name="head">`)
- React tool components are islands with `client:load`
- Tool components use **named exports**: `export function TokenCounter() { ... }`
- Astro pages import with aliases to avoid typecheck conflicts:
  ```astro
  import { TokenCounter as TokenCounterTool } from '../../components/tools/ai/token-counter';
  <TokenCounterTool client:load />
  ```
- No `'use client'` directives — unnecessary in Astro React islands

## Testing Guidelines

**Framework**: Vitest with happy-dom

**Test Location**: `src/__tests__/lib/llm/[module].test.ts`

**Pattern**:
```typescript
import { describe, expect, it } from 'vitest';
import { myFunction } from '@/lib/llm/my-module';

describe('myFunction', () => {
  it('does what it should', async () => {
    const result = await myFunction('input');
    expect(result).toBeDefined();
  });

  it('handles errors gracefully', async () => {
    const result = await myFunction('');
    expect(result.error).toBeDefined();
  });
});
```

**Coverage**: Excludes `src/components/ui/**` (third-party), targets `src/**/*.{ts,tsx}`

## Security Rules (CRITICAL)

**1. NEVER Server-Side Processing**:
- All user data must stay in `localStorage` or memory
- NO external script loading or server-side processing

**2. BYOK Privacy**:
- API keys are held in component state only, not persisted
- Provider calls go directly from browser to provider
- UI must state `Parsify does not receive your key or request body`
- No backend proxy

**3. Cryptographic Operations**:
- Use browser's `crypto.subtle` for hash, encryption, signing
- NEVER implement custom crypto — use WASM libraries or Web Crypto API
- Random numbers: use `crypto.getRandomValues()`, NEVER `Math.random()`

**4. XSS Prevention**:
- NEVER use `dangerouslySetInnerHTML` without sanitization
- Use `DOMPurify` for any user-provided HTML

**5. Error Handling**:
- NEVER use empty `catch` blocks
- Always show user-friendly error state
- Return consistent error structure

**6. Privacy**:
- NO tracking/analytics that capture user input contents
- NO external API calls for data processing
- Clear sensitive data from state after use

## Workflow: Adding a New AI/LLM Tool

**1. Define Tool Metadata** (in `src/data/tools-data.ts`):
```typescript
{
  id: 'my-tool',
  name: 'My Tool',
  description: 'One-line description...',
  category: 'AI & LLM Tools',
  subcategory: 'Tokens & Cost',
  icon: 'Gauge',
  features: ['Feature 1'],
  tags: ['tag'],
  difficulty: 'beginner',
  status: 'stable',
  href: '/ai/my-tool',
  processingType: 'client-side',
  security: 'local-only',
}
```

**2. Create Pure Logic** (`src/lib/llm/my-tool.ts`):

**3. Create Test** (`src/__tests__/lib/llm/my-tool.test.ts`):

**4. Create React Component** (`src/components/tools/ai/my-tool.tsx`):
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';

export function MyTool() {
  return (
    <Card>
      <CardHeader><CardTitle>My Tool</CardTitle></CardHeader>
      <CardContent>{/* tool UI */}</CardContent>
      <RelatedTools toolId="my-tool" />
    </Card>
  );
}
```

**5. Create Astro Route** (`src/pages/ai/my-tool.astro`):
```astro
---
import Layout from '../../layouts/BaseLayout.astro';
import { MyTool as MyToolView } from '../../components/tools/ai/my-tool';
import { SEO_CONFIG } from '../../lib/seo-config';
---
<Layout>
  <slot name="head"><title>My Tool | Parsify.dev</title><link rel="canonical" href={`${SEO_CONFIG.BASE_URL}/ai/my-tool`} /></slot>
  <main id="main-content" class="container mx-auto max-w-7xl px-6 py-8 lg:px-8"><MyToolView client:load /></main>
</Layout>
```

**6. Add Related Tools** (in `src/components/tools/ai/shared/related-tools.tsx`).

**7. Verify**: `bun run lint && bun run typecheck && bun test`

## Key Conventions

- Business logic in `src/lib/llm/`, UI in `src/components/tools/ai/`
- Shared components stay flat under `src/components/tools/ai/shared/`
- All tools use the single category `AI & LLM Tools`
- Routes use `/ai/<tool-id>` prefix
- No server-side processing of user input
- BYOK = direct browser-to-provider calls only
- No account, no installation, no tracking

---

*Last Updated: April 2026 — Phase 1-3 AI/LLM tools complete (21 tools)*

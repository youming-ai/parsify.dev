# 🤖 AGENTS.md - Parsify.dev

> Privacy-first, client-side developer tools platform.
> Guidelines for AI coding agents to maintain consistency, performance, and security.

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router) - 'use client' for logic components
- **Runtime**: Bun 1.3+ (packageManager: bun@1.3.5)
- **Styling**: Tailwind CSS 3 + shadcn/ui (class-variance-authority, clsx)
- **Testing**: Vitest with happy-dom
- **Deployment**: Cloudflare Workers (OpenNext)
- **Lint**: Biome (2-space indent, 100 char width)
- **TypeScript**: Strict mode, noUncheckedIndexedAccess enabled

---

## 🛠️ Essential Commands

| Purpose | Command | Notes |
|----------|----------|--------|
| **Dev** | `bun run dev` | Turbopack dev server (port 3000) |
| **Build** | `bun run build` | Production + Cloudflare bundle |
| **Lint** | `bun run lint` | Biome check `./src` |
| **Fix** | `bun run lint:fix` | Auto-fix with `--fix ./src` |
| **Format** | `bun run format` | Biome format `--write ./src` |
| **Type Check** | `bun run typecheck` | TypeScript `--noEmit` |
| **Test All** | `bun test` | Vitest with happy-dom |
| **Test File** | `bun test <path>` | Run specific test file (e.g., `src/__tests__/lib/utils.test.ts`) |
| **Test UI** | `bun run test:ui` | Interactive Vitest UI |
| **Coverage** | `bun run test:coverage` | V8 provider, excludes `src/components/ui/**` |
| **Deploy** | `bun run deploy:cf` | Build + deploy to Cloudflare |

**Pre-commit**: `bun run lint:fix && bun run typecheck && bun test` (via husky)

---

## 📂 Project Structure

```
src/
├── app/[category]/[tool]/
│   ├── page.tsx         # Server Component (Metadata, no 'use client')
│   └── client.tsx       # Client Component (Logic) - MUST have 'use client'
├── components/
│   ├── ui/              # shadcn/ui (Radix primitives) - REUSE FIRST
│   ├── tools/          # Tool implementations
│   └── layout/          # Header, Footer, ToolsLayout
├── lib/
│   ├── crypto/          # AES, RSA, Hash (use crypto.subtle, NOT custom crypto)
│   ├── json/            # Formatters, validators
│   └── utils.ts         # cn() helper (Tailwind merge via twMerge/clsx)
├── data/
│   └── tools-data.ts    # Tool registry (ID, SEO, UI config)
├── hooks/              # Custom React hooks
├── types/              # Shared TS interfaces
└── __tests__/         # Vitest tests (happy-dom, setup mocks)
```

---

## 🎨 Code Style & Standards (Biome)

**Formatting**:
- **Indent**: 2 spaces
- **Line width**: 100 chars
- **Quotes**: Single `'` for JS/JSX, Double `"` for JSX props
- **Semicolons**: Always
- **Trailing commas**: ES5 style
- **Line ending**: LF (Unix)

**Naming**:
- **Components**: `PascalCase` (e.g., `ToolCard`, `JWTDecoder`)
- **Functions/Hooks**: `camelCase` (e.g., `useTextAnalysis`, `processFile`, `cn`)
- **Files**: `kebab-case` (e.g., `json-formatter.ts`, `hash-operations.ts`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_PAYLOAD_SIZE`)
- **Interfaces**: `PascalCase` (e.g., `ConversionResult`, `Tool`)

**Imports Order** (STRICT):
```typescript
'use client';

import React from 'react';
import { Icon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { processData } from '@/lib/crypto/hash-operations';
import type { Tool } from '@/types/tools';
```

**TypeScript**:
- **Strict mode**: Enabled
- **NoUncheckedIndexedAccess**: Enabled (check array/object access)
- **Prefer**: `unknown` over `any` - use type guards
- **Interfaces**: Prefer for objects, `type` for unions/primitives
- **Return types**: Explicit on all exported functions
- **Type imports**: Use `import type` for type-only imports

**React**:
- **Directives**: Logic MUST be in `'use client'` files
- **Performance**: `useMemo` for expensive computations, `useCallback` for handlers
- **State**: Local `useState` only (no global store)
- **Composition**: Function components preferred over class
- **Event handlers**: Prefix unused params with `_` (e.g., `_error`, `_copied`)

---

## 🧪 Testing Guidelines

**Framework**: Vitest with happy-dom

**Test Location**: `src/__tests__/lib/[module].test.ts`

**Pattern**:
```typescript
import { describe, expect, it } from 'vitest';
import { myFunction } from '@/lib/module';

describe('myFunction', () => {
  it('does what it should', async () => {
    const result = await myFunction('input');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('handles errors gracefully', async () => {
    const result = await myFunction('');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

**Coverage**: Excludes `src/components/ui/**` (third-party), targets `src/**/*.{ts,tsx}`

---

## 🔐 Security Rules (CRITICAL)

**1. NEVER Server-Side Processing**:
- All user data must stay in `localStorage` or memory
- NO external script loading or server-side processing

**2. Cryptographic Operations**:
- Use browser's `crypto.subtle` for hash, encryption, signing
- **NEVER** implement custom crypto (MD5, SHA) - use WASM libraries or Web Crypto API
- **Encryption keys**: Use `PBKDF2` or scrypt for password-to-key derivation
- **AES modes**: Use correct parameters (CTR needs `counter` + `length`, GCM needs auth tag)
- **Random numbers**: Use `crypto.getRandomValues()`, NEVER `Math.random()`

**3. Hash Generator**:
- ✅ `md5()` now uses `spark-md5` in `src/lib/crypto/hash-operations.ts`

**4. XSS Prevention**:
- NEVER use `dangerouslySetInnerHTML` without sanitization
- Use `DOMPurify` for any user-provided HTML
- Custom parsers are XSS risks (Markdown, HTML, SQL)

**5. Error Handling**:
- NEVER use empty `catch` blocks
- Always log errors or show user-friendly error state
- Return consistent error structure: `{ success: boolean; data?: T; error?: string }`

**6. Privacy**:
- NO tracking/analytics that capture user input contents
- NO external API calls for data processing
- Clear sensitive data from state after use

---

## 🚀 Workflow: Adding a New Tool

**1. Define Tool Metadata** (in `src/data/tools-data.ts`):
```typescript
{
  id: 'tool-id',
  name: 'Tool Name',
  description: 'One-line description...',
  category: 'Category Name',
  icon: 'IconName', // @phosphor-icons/react
  features: ['Feature 1', 'Feature 2'],
  tags: ['tag1', 'tag2'],
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  status: 'stable' | 'beta',
  href: '/category/tool-id',
  isPopular: true, // optional
}
```

**2. Create Page Files**:
```typescript
// src/app/[category]/[tool-id]/page.tsx
import type { Metadata } from 'next';
import { generateToolSEOMetadata } from '@/lib/tool-seo';

export const metadata: Metadata = generateToolSEOMetadata({ toolId: 'tool-id', ... });

export default function ToolPage() {
  return <ToolClient />;
}

// src/app/[category]/[tool-id]/client.tsx
'use client';
import { Card } from '@/components/ui/card';
// ... tool logic
export default function ToolClient() {
  // useState, useEffect, handlers
}
```

**3. Verify**: `bun run lint && bun run typecheck && bun test src/__tests__/lib/[tool].test.ts`

---

## 📦 Component Guidelines

**UI Components** (`src/components/ui/`):
- **ALWAYS** reuse existing shadcn/ui components (Button, Card, Input, etc.)
- Use `cn()` for conditional classes: `cn('base-class', isActive && 'active-class')`
- Use Radix primitives where possible (via shadcn/ui)

**Tool Layout Pattern**:
```typescript
// Card-based, dual-pane for input/output
'use client';

export default function Tool() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Input</CardTitle></CardHeader>
        <CardContent>{/* inputs */}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Output</CardTitle></CardHeader>
        <CardContent>{/* results */}</CardContent>
      </Card>
    </div>
  );
}
```

**Spacing**: Use `space-y-6` for card-to-card, `gap-6` for grid layouts

**Icons**: `@phosphor-icons/react` (e.g., `ArrowsClockwise`, `Copy`, `CheckCircle`)

---

## ⚠️ Known Issues to Fix

**CRITICAL** (from recent audit):
- All issues have been resolved ✅

**HIGH** (from recent audit):
- All issues have been resolved ✅

**Medium** (from recent audit):
- All issues have been resolved ✅

---

## 🤖 Agent Interaction Notes

**Proactivity**: Suggest missing tools when you see user needs not met by `tools-data.ts`

**Consistency**: Check `src/components/ui/` before creating new components - REUSE FIRST

**Validation**: Always run `bun run lint` after changes - DO NOT suppress type errors

**Testing**: Add tests for new utility functions in `src/__tests__/lib/`

**Performance**: For heavy computations (>100ms), consider Web Workers or chunking

**Type Safety**: NEVER use `as any`, `@ts-ignore`, or suppress type errors

**Documentation**: NEVER create `.md` files unless explicitly requested

---

*Last Updated: January 2026 - P0 and P1 security issues fully resolved*

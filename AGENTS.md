# 🤖 AGENTS.md - Parsify.dev

> **Privacy-first, client-side developer tools platform.**
> Guidelines for AI coding agents to maintain consistency, performance, and security.

---

## 🏗️ Project Architecture

Parsify.dev is a high-performance developer tools platform built with:
- **Framework**: Next.js 15 (App Router)
- **Runtime**: Bun 1.3+ (packageManager: bun@1.3.5)
- **Styling**: Tailwind CSS 3 + shadcn/ui
- **Deployment**: Cloudflare Workers (via OpenNext)
- **Security**: 100% Client-side processing (User data never leaves the browser)

---

## 🛠️ Essential Commands

| Purpose | Command | Notes |
| :--- | :--- | :--- |
| **Development** | `bun run dev` | Starts dev server with Turbopack (Port 3000) |
| **Build** | `bun run build` | Production build + Cloudflare bundle |
| **Preview** | `bun run preview` | Local Cloudflare Workers preview |
| **Linting** | `bun run lint` | Check with Biome |
| **Fix Lint** | `bun run lint:fix` | Auto-fix Biome issues |
| **Formatting** | `bun run format` | Format files with Biome |
| **Type Check** | `bun run typecheck` | Full TypeScript type checking |
| **Deploy** | `bun run deploy:cf` | One-step build and deploy to Cloudflare |
| **Run All Tests** | `bun test` | Run Vitest tests |
| **Run Single Test** | `bun test src/__tests__/lib/utils.test.ts` | Run specific test file |
| **Test UI** | `bun run test:ui` | Interactive test runner |
| **Test Coverage** | `bun run test:coverage` | Generate coverage report |

---

## 📂 Project Structure

```text
src/
├── app/                    # App Router (Routing & Metadata)
│   └── [category]/[tool]/
│       ├── page.tsx        # Server Component (Metadata)
│       └── client.tsx      # Client Component (Logic) - 'use client'
├── components/
│   ├── ui/                 # shadcn/ui (Radix primitives)
│   ├── tools/              # Shared tool components
│   └── layout/             # Global Layout (Header, Footer)
├── lib/                    # Business Logic
│   ├── crypto/             # AES, RSA, Hash
│   ├── json/               # Formatters, Validators
│   └── utils.ts            # Tailwind merge helper (cn)
├── data/                   # Registry
│   └── tools-data.ts       # Tool definitions (ID, SEO, UI)
├── hooks/                  # Custom React hooks
├── types/                  # Shared TS Interfaces
└── __tests__/              # Vitest tests (happy-dom)
    ├── setup.ts            # Test setup & mocks
    └── lib/                # Library logic tests
```

---

## 🚀 Workflow: Adding a New Tool

Follow these steps to ensure a tool is correctly integrated:

1.  **Define Tool Metadata**: Add an entry to `src/data/tools-data.ts`.
2.  **Create Page Structure**:
    - Create `src/app/[category]/[tool-name]/page.tsx` (for Metadata).
    - Create `src/app/[category]/[tool-name]/client.tsx` (with `'use client'`).
3.  **Implement Logic**: Put heavy processing logic in `src/lib/[category]/`.
4.  **UI Design**:
    - Use `src/components/ui/` for standard elements.
    - Match existing tool aesthetics (Card-based, dual-pane for input/output).
5.  **Verification**:
    ```bash
    bun run lint && bun run typecheck && bun test
    ```

---

## 🎨 Code Style & Standards (Biome)

### 1. Formatting Rules
- **Indent**: 2 spaces
- **Line width**: 100 characters
- **Quotes**: Single (`'`) for JS/JSX, Double (`"`) for JSX attributes
- **Semicolons**: Always
- **Trailing commas**: ES5 style
- **Line ending**: LF (Unix)

### 2. Variables & Naming
- **Components**: `PascalCase` (e.g., `ToolCard.tsx`)
- **Functions/Hooks**: `camelCase` (e.g., `useTextAnalysis`, `cn`)
- **Files**: `kebab-case` (e.g., `json-formatter.ts`, `hash-operations.ts`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_PAYLOAD_SIZE`)
- **Interfaces**: `PascalCase` (e.g., `Tool`, `HashResult`)
- **Types**: `PascalCase` (e.g., `ToolCategory`, `ConversionResult`)

### 3. Imports Strategy
Always use `@/` path aliases. Order:
1.  React/Framework imports (`'use client'`, `import React`)
2.  External libraries (`@phosphor-icons/react`, `clsx`)
3.  UI Components (`@/components/ui/...`)
4.  Internal hooks/utils/libraries
5.  Types (`import type ...` from `@/types/...`)

**Example**:
```typescript
'use client';

import React from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { hashData } from '@/lib/crypto/hash-operations';
import type { Tool } from '@/types/tools';
```

### 4. TypeScript Configuration
- **Strict Mode**: Enabled (`strict: true`)
- **NoUncheckedIndexedAccess**: Enabled (always check for undefined)
- **Prefer**: `unknown` over `any` - use type guards
- **Interfaces**: Prefer `interface` for objects, `type` for unions/primitives
- **Exports**: Use explicit return types for all exported functions
- **Type Imports**: Use `import type` for type-only imports

**Error Handling Pattern**:
```typescript
export interface Result<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function processData(input: string): Promise<Result<Data>> {
  try {
    const result = await doWork(input);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Operation failed',
    };
  }
}
```

---

## ⚛️ React Best Practices

- **Composition**: Prefer function components over class components
- **Directives**: Tool logic **must** be in `'use client'` files (client.tsx)
- **Performance**:
  - Memoize heavy computations with `useMemo`
  - Memoize callbacks with `useCallback`
  - Use `React.lazy` for code-splitting large components
- **State Management**:
  - Local state: `useState` for component-level state
  - Computed values: `useMemo` for derived data
  - Note: No global state library (Zustand removed for simplicity)
- **Icons**: Use `@phosphor-icons/react` (e.g., `ArrowsClockwise`, `Copy`)
- **Event Handlers**: Prefix unused parameters with `_` (e.g., `_error`, `_copied`)
- **Pattern**:
  ```typescript
  // page.tsx - Server Component
  export const metadata: Metadata = generateToolSEOMetadata({...});
  export default function ToolPage() {
    return <ToolClient />;
  }

  // client.tsx - Client Component
  'use client';
  export default function ToolClient() {
    const [value, setValue] = useState('');
    // ... logic
  }
  ```

---

## 🧪 Testing Guidelines

### Test Framework: Vitest
- **Environment**: happy-dom (browser-like environment)
- **Globals**: Enabled (`describe`, `it`, `expect`, `beforeEach`, etc.)
- **Setup**: `src/__tests__/setup.ts` (mocks window APIs)

### Test Structure
- **Location**: `src/__tests__/lib/[module].test.ts`
- **Naming**: Match source file with `.test.ts` suffix

### Test Pattern
```typescript
import { describe, expect, it } from 'vitest';
import { myFunction } from '@/lib/crypto/my-module';

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

### Running Tests
```bash
# All tests
bun test

# Single test file
bun test src/__tests__/lib/utils.test.ts

# Watch mode
bun test --watch

# Coverage
bun run test:coverage
```

---

## ⚠️ Critical Security Rules

1.  **NO Server-side processing**: All user data must stay in `localStorage` or memory
2.  **NO External Dependencies for Core Logic**: Avoid fetching external scripts or APIs for processing
3.  **Error Handling**: Never use empty `catch` blocks. Always log errors or show a user-friendly UI state
4.  **Privacy**: Do not add tracking or analytics that capture user input contents
5.  **Web Crypto API**: Use browser's native `crypto.subtle` for cryptographic operations (hash, encryption)

---

## 🤖 Agent Interaction Notes

- **Proactivity**: If you see a missing tool in `tools-data.ts` that matches a user request, suggest adding it
- **Consistency**: Always check `src/components/ui/` before creating a new component. Reuse first
- **Validation**: Always run `bun run lint` after modifying code
- **Testing**: Add tests in `src/__tests__/lib/` for new utility functions
- **Performance**: For heavy computations, consider web workers or chunking
- **Type Safety**: Never use `as any`, `@ts-ignore`, or suppress type errors

---

*Last Updated: January 2026*

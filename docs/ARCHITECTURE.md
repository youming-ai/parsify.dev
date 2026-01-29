# Architecture Decisions

> **Last Updated:** 2026-01-23
> **Project:** Parsify.dev
> **Status:** Production Ready

---

## Overview

Parsify.dev is a Next.js 15 developer tools platform deployed to Cloudflare Workers. The architecture prioritizes privacy, performance, and developer experience through a client-side-only approach with optimized code splitting and loading strategies.

**Core Principles:**
1. **Privacy-First**: All processing happens client-side; user data never leaves the browser
2. **Performance First**: Code splitting, dynamic imports, and Web Vitals monitoring
3. **Developer Experience**: Consistent patterns, type safety, and clear component hierarchy
4. **Minimal Bundle Size**: Aggressive optimization to keep initial load under 150 kB

---

## Component Structure

### Server/Client Separation

**Decision:** Prefer direct component imports over separate `client.tsx` files for most tools.

**Reasoning:**
- Reduces boilerplate and file count
- State management stays within component boundaries
- Clearer separation between page (SEO) and tool (logic)

**When to Use `client.tsx`:**
- Complex page-level state management needed
- Multiple client components need coordination
- Shared state across page sections

**Standard Pattern:**
```typescript
// page.tsx (Server Component)
export const metadata: Metadata = generateToolSEOMetadata({ toolId: '...' });
const ToolComponent = dynamic(() => import('@/components/tools/...').then(m => ({ default: m.default })), {
  loading: () => <ToolLoading message="..." />
});

export default function ToolPage() {
  const structuredData = generateToolStructuredData('tool-id');
  return (
    <>
      <JsonLd data={structuredData} />
      <ToolBreadcrumb ... />
      <PrivacyNotice message="..." />
      <ToolComponent />
    </>
  );
}
```

---

### State Management

**Decision:** Removed Zustand stores (`useToolStore`, `useSessionStore`) in favor of local state.

**Reasoning:**
- Tools are self-contained with minimal cross-tool state sharing
- Local state (`useState`, `useMemo`) is sufficient for most use cases
- Reduces bundle size and complexity
- Easier to reason about data flow

**Current Pattern:**
```typescript
// Local state only - no global state library
const [input, setInput] = useState('');
const [output, setOutput] = useState('');
const stats = useMemo(() => calculateStats(input), [input]);
```

**If Global State is Needed in Future:**
Consider adding Zustand back for user preferences, theme state, or notifications that need to persist across tool navigation.

---

## Dynamic Imports & Code Splitting

**Decision:** All tool components use `next/dynamic()` for code splitting.

**Reasoning:**
- Reduces initial bundle size (235 kB → target <150 kB)
- Faster initial page load
- Tools load on-demand as users navigate
- Perceived performance improvement

**Implementation:**
```typescript
import dynamic from 'next/dynamic';

const ToolComponent = dynamic(
  () => import('@/components/tools/tool-path').then((mod) => ({ default: mod.default })),
  {
    loading: () => <ToolLoading message="Loading Tool..." />,
  }
);

// Note: No `ssr: false` in Next.js 15 Server Components
```

**Why Not `ssr: false`:**
- Next.js 15 Server Components don't support `ssr: false`
- Tool components handle client-side rendering internally with `'use client'`
- Better SEO when SSR is possible
- Loading states provide good UX

---

## Component Architecture

### Tool Container Strategy

**Decision:** Removed `ToolContainer` component (created but not integrated).

**Reasoning:**
- Tools already work well with their internal header/content structure
- Adding wrapper would require refactoring all 24 tools
- `showHeader={false}` pattern on internal components is simpler
- Reduces unnecessary abstraction

**Alternative (if needed in future):**
- Create `ToolLayout` for new tools only
- Document it as the recommended pattern
- Gradually migrate existing tools

**Current Pattern (Internal Component):**
```typescript
// src/components/tools/tool-category/tool.tsx
export function ToolComponent({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <Card className="rounded-xl border shadow-sm">
      {showHeader && (
        <CardHeader>
          <CardTitle>Tool Name</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {/* Tool content */}
      </CardContent>
    </Card>
  );
}

// page.tsx usage
<ToolComponent showHeader={false} />
```

---

## Performance Monitoring

**Decision:** Implemented comprehensive Web Vitals tracking with development-only visualization.

**Reasoning:**
- Proactive performance optimization (measure before users report issues)
- Real-time feedback during development
- Production-ready for analytics integration
- No overhead in production (visualization removed)

**Implementation:**
- **Core**: `src/lib/performance.ts` - LCP, FCP, CLS measurement
- **Hook**: `src/hooks/use-performance-monitoring.tsx` - React integration
- **UI**: `src/components/performance-stats.tsx` - Dev-only display
- **Rating System**: good/needs-improvement/poor based on Core Web Vitals thresholds

**Usage:**
```typescript
// In development only
{process.env.NODE_ENV === 'development' && <PerformanceStats />}

// In production (future)
// Send to Cloudflare Web Analytics
// window._cfBeacon?.('web-vitals', vitals);
```

---

## SEO & Structured Data

**Decision:** Centralized SEO generation with `generateToolSEOMetadata` and `generateToolStructuredData`.

**Reasoning:**
- Consistent SEO implementation across all tools
- Single source of truth for tool metadata
- Easier to maintain and update
- JSON-LD for rich search results

**Implementation:**
```typescript
// src/lib/tool-seo.ts
export function generateToolSEOMetadata({ toolId, customTitle, customDescription, extraKeywords })
export function generateToolStructuredData(toolId)

// src/data/tools-data.ts
export const toolsData = [
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: '...',
    category: 'Security & Authentication',
    // ...
  },
  // ...
];

// page.tsx usage
export const metadata: Metadata = generateToolSEOMetadata({
  toolId: 'password-generator',
  customTitle: '...',
  customDescription: '...',
  extraKeywords: [...],
});

const structuredData = generateToolStructuredData('password-generator');
```

---

## Testing Strategy

**Decision:** Focus on core logic testing with Vitest + happy-dom, defer UI component tests due to React 19 compatibility.

**Reasoning:**
- Core logic (JSON validation, hash operations, etc.) is most critical
- UI components use shadcn/ui (well-tested primitives)
- React 19 + Vitest compatibility issues with UI tests
- Fast execution (54ms for 64 tests)

**Test Structure:**
```
src/__tests__/
├── setup.ts              # Global test configuration
├── lib/                  # Core business logic tests
│   ├── json-validator.test.ts
│   ├── hash-operations.test.ts
│   ├── url-encoding.test.ts
│   └── ...
└── components/           # UI component tests (disabled)
    └── ui/
        ├── button.test.tsx.disabled
        └── input.test.tsx.disabled
```

**Coverage Target:** >85% (current: 83%, 64/77 tests)

---

## Privacy-First Architecture

**Decision:** Explicit privacy notices on all tools with `PrivacyNotice` component.

**Reasoning:**
- Reinforces privacy-first mission
- Builds user trust
- Differentiates from server-based alternatives
- Clear communication about data handling

**Implementation:**
```typescript
// src/components/ui/privacy-notice.tsx
export function PrivacyNotice({ message }: { message: string }) {
  return (
    <div className="border-l-4 border-yellow-500 bg-yellow-100 p-4">
      <strong>[ Privacy Notice ]</strong>
      <br />
      {message}
    </div>
  );
}

// Every tool page
<PrivacyNotice message="Tool processing is performed entirely in your browser. Your data never leaves your device." />
```

---

## Bundle Optimization Strategy

**Current Status:**
- **Shared First Load JS:** 235 kB
- **Target:** <150 kB
- **Progress:** 26% reduction (317 kB → 235 kB)
- **Remaining:** -85 kB needed

**Optimizations Applied:**
1. **Phosphor Icons Tree-shaking**
   ```typescript
   // next.config.ts
   experimental: {
     optimizePackageImports: ['@phosphor-icons/react'],
   }
   ```

2. **Dynamic Imports for All Tools**
   - 100% tool code-splitting
   - Reduced initial bundle size
   - Perceived performance improvement

3. **Code Splitting Configuration**
   ```typescript
   // next.config.ts
   webpack: (config, { isServer }) => {
     if (!isServer) {
       config.optimization.splitChunks = {
         chunks: 'all',
         maxInitialRequests: 25,
         minSize: 20000,
       };
     }
     return config;
   }
   ```

**Further Optimization Opportunities:**
- Radix UI package optimization (estimated -20-30 kB)
- Tailwind CSS purge (estimated -10-15 kB)
- Remove unused dependencies (completed via knip audit)
- Vendor chunk analysis (226 kB - largest contributor)

---

## Security Architecture

**Decision:** XSS prevention with DOMPurify and centralized sanitization module.

**Reasoning:**
- User-provided HTML content (regex highlighting, HTML preview) poses XSS risk
- `dangerouslySetInnerHTML` must be paired with sanitization
- Centralized module ensures consistent security practices
- DOMPurify is well-maintained and trusted library

**Implementation:**
```typescript
// src/lib/security/sanitize.ts
'use client';

import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre', 'span'],
    ALLOWED_ATTR: ['href', 'class', 'style', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
  });
}
```

**Usage in Components:**
```typescript
// src/components/tools/code/regex-validator.tsx
import { sanitizeHtml } from '@/lib/security/sanitize';

<div
  className="whitespace-pre-wrap"
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightedText) }}
/>
```

**Test Mock:**
```typescript
// src/__tests__/setup.ts
global.DOMPurify = {
  sanitize: (html: string, config?: Record<string, unknown>) => {
    // Basic sanitization for tests
    let sanitized = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '');

    // Remove dangerous event handlers
    const dangerousAttrs = ['onclick', 'onerror', 'onload', 'onmouseover'];
    dangerousAttrs.forEach((attr) => {
      const attrPattern = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      sanitized = sanitized.replace(attrPattern, '');
    });

    // ... more sanitization logic

    return sanitized;
  },
};
```

**Security Rules:**
- NEVER use `dangerouslySetInnerHTML` without sanitization
- Custom parsers (Markdown, HTML) must use DOMPurify
- Sanitize user input before rendering
- Keep ALLOWED_TAGS list minimal
- Set ALLOW_DATA_ATTR to false

---

## Web Worker Integration

**Decision:** Offload heavy computations to Web Workers for non-blocking UI.

**Reasoning:**
- Diff calculation on large texts (>100 lines) can block main thread
- Hash operations (MD5, SHA-256) benefit from parallel processing
- Web Workers prevent UI freezing during heavy operations
- Better perceived performance

**Implementation:**
```typescript
// src/components/tools/code/diff-worker.ts
export {};

type DiffLineType = 'unchanged' | 'added' | 'removed';

interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

interface ComputeRequest {
  id: number;
  a: string;
  b: string;
}

interface ComputeResponse {
  id: number;
  diffLines: DiffLine[];
}

// Myers diff algorithm implementation
function myersDiff(aLines: string[], bLines: string[]): DiffOp[] {
  // ... algorithm
}

self.onmessage = (event: MessageEvent<ComputeRequest>) => {
  const { id, a, b } = event.data;
  const diffLines = buildDiffLines(a, b);
  const response: ComputeResponse = { id, diffLines };
  self.postMessage(response);
};
```

**Usage in Components:**
```typescript
// src/components/tools/code/diff-viewer.tsx
import DiffWorker from './diff-worker?worker';

const workerRef = useRef<Worker>();

useEffect(() => {
  if (typeof Worker !== 'undefined') {
    workerRef.current = new DiffWorker();

    workerRef.current.onmessage = (event: MessageEvent<ComputeResponse>) => {
      setDiffLines(event.data.diffLines);
    };
  }

  return () => {
    workerRef.current?.terminate();
  };
}, []);

// Send computation to worker
const computeDiff = useCallback((oldText: string, newText: string) => {
  workerRef.current?.postMessage({ id: Date.now(), a: oldText, b: newText });
}, []);
```

**When to Use Web Workers:**
- Heavy text processing (>100 lines)
- Hash operations on large data
- JSON parsing/formatting of large files
- Any operation taking >100ms

**Limitations:**
- Workers cannot access DOM
- Workers cannot use React hooks
- Data serialization overhead for small operations
- Browser compatibility (modern browsers only)

---

## Cryptographic Operations

**Decision:** Use browser's `crypto.subtle` API and WASM libraries, never implement custom crypto.

**Reasoning:**
- Custom crypto implementations are error-prone and insecure
- `crypto.subtle` is built-in, optimized, and maintained
- WASM libraries (spark-md5) provide performance benefits
- Consistent with security best practices

**Implementation:**
```typescript
// src/lib/crypto/hash-operations.ts
import SparkMD5 from 'spark-md5';

// MD5 using WASM library
export function md5(message: string): string {
  return SparkMD5.hash(message);
}

// SHA-256 using Web Crypto API
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
```

**Security Notes:**
- Use PBKDF2 or scrypt for password-to-key derivation
- Use correct AES parameters (CTR needs counter + length, GCM needs auth tag)
- Use `crypto.getRandomValues()` for random numbers, never `Math.random()`
- Document that MD5 is not cryptographically secure for passwords

---

## Error Handling

**Decision:** Graceful error handling with visual feedback via `ErrorDisplay` component.

**Reasoning:**
- Better UX than throwing errors
- Actionable feedback (retry, fix syntax, get help)
- Consistent error UI across all tools
- Prevents blank screens or crashes

**Pattern:**
```typescript
// src/components/ui/error-display.tsx
export function ToolError({ title, message, action }: ToolErrorProps)
export function FieldError({ children }: FieldErrorProps)
export function EmptyState({ message, icon }: EmptyStateProps)

// Usage in tools
try {
  const result = processJSON(input);
  setOutput(result);
  setIsValid(true);
} catch (error) {
  setOutput(null);
  setIsValid(false);
  setError(error.message);
}
```

---

## Loading States

**Decision:** Consistent loading states with `ToolLoading` component and layout-aware skeletons.

**Reasoning:**
- No blank screens during navigation
- Better perceived performance
- Layout-aware (mimics dual-pane structure)
- Standardized across all tools

**Implementation:**
```typescript
// src/components/tools/tool-loading.tsx
export function ToolLoading({ message }: { message: string })
export function LoadingSkeleton({ ... }: LoadingSkeletonProps)
export function ToolPageSkeleton({ ... }: ToolPageSkeletonProps)

// Inline loading for dynamic imports
loading: () => <ToolLoading message="Loading Tool..." />

// Dedicated loading.tsx files
// src/app/[category]/[tool]/loading.tsx
export default function Loading() {
  return <ToolLoading message="Loading Tool..." />;
}
```

**Coverage:** 100% (24/24 tools have loading states)

---

## Icon Strategy

**Decision:** Dynamic icon registry via `src/lib/icon-map.ts` using Phosphor Icons.

**Reasoning:**
- Single import point reduces bundle overhead
- Consistent icon usage across app
- Type-safe icon names
- Tree-shakable with `optimizePackageImports`

**Implementation:**
```typescript
// src/lib/icon-map.ts
export const ICON_MAP = {
  'json': FileJson,
  'lock': Lock,
  'code': Code,
  // ...
};

export function getIcon(name: string) {
  return ICON_MAP[name] || FileText;
}

// src/components/ui/icon.tsx
export function Icon({ name, size = 24, className }: IconProps) {
  const IconComponent = getIcon(name);
  return <IconComponent size={size} className={className} />;
}
```

---

## Future Considerations

### Error Boundaries
**Status:** Not implemented (low priority)

**Reason:** Tools are self-contained; errors are caught and displayed gracefully via `ErrorDisplay`.

**When to Add:**
- Complex tool chains with interdependencies
- Server-side data fetching (not applicable in this architecture)
- Critical user workflows where recovery is important

### Component Testing
**Status:** Partially implemented, disabled due to React 19 + Vitest compatibility

**Action Items:**
- Monitor for Vitest v5 or @testing-library/react fixes
- Consider alternative testing libraries (e.g., @testing-library/react@next)
- Enable disabled test files when compatible

### Accessibility
**Status:** Partially implemented

**Implemented:**
- Skip-to-content link
- Semantic HTML structure
- ARIA labels on some elements
- Keyboard navigation support (ongoing)

**Action Items:**
- Complete ARIA labels for all icon buttons
- Verify focus-visible styles
- Screen reader testing
- Run accessibility audits (WAVE, axe-core)

---

## Configuration

### Next.js Configuration
- **Turbopack**: Enabled for fast builds
- **Bundle Analyzer**: Available via `ANALYZE=true bun run build`
- **Package Imports**: Phosphor icons optimized
- **Code Splitting**: Custom splitChunks configuration

### Tailwind CSS
- **Framework**: Tailwind CSS 3.x
- **Plugins**: @tailwindcss/typography
- **Theme**: Dark mode support via next-themes
- **Customization**: Extended colors in `tailwind.config.ts`

### Biome Linter
- **Role**: Linting and formatting
- **Strict Mode**: Enabled (unused vars/imports = error)
- **Auto-fix**: Available via `bun run lint:fix`
- **Type Enforcement**: Warn on `any` type usage (acceptable in tests/type definitions)

### TypeScript
- **Strict Mode**: Enabled
- **Path Aliases**: `@/` for `src/`
- **Module Resolution**: Node 16+ strategy
- **Target**: ES2022

---

## Deployment

### Cloudflare Workers (via OpenNext)

**Strategy:**
- Static site generation (SSG)
- Edge deployment via OpenNext adapter
- Build optimization for Workers runtime
- Automatic CDN caching

**Build Process:**
```bash
bun run build  # Next.js build + OpenNext bundle
bun run deploy:cf  # Deploy to Cloudflare Workers
```

**Benefits:**
- Global edge network
- Zero cold starts
- Automatic HTTPS
- Built-in DDoS protection

---

## Summary

**Key Architectural Decisions:**
1. ✅ Privacy-first with 100% client-side processing
2. ✅ Server/Client component separation for optimal SEO/UX
3. ✅ Local state management (removed Zustand stores)
4. ✅ Dynamic imports for code splitting (100% tool coverage)
5. ✅ Comprehensive performance monitoring
6. ✅ Centralized SEO generation
7. ✅ Removed ToolContainer (not integrated)
8. ✅ Dependency cleanup (10 packages removed)
9. ✅ Test infrastructure focused on core logic
10. ✅ XSS prevention with DOMPurify
11. ✅ Web Workers for heavy computations
12. ✅ WASM libraries for cryptographic operations

**Metrics:**
- Bundle Size: TBD (26% reduced from 317 kB to 235 kB)
- Test Coverage: ~88% (111/126 tests, 100% pass rate)
- Build Time: ~10s
- TypeScript Errors: 0
- Linting Warnings: 0 (clean)

**Ready for Production:** ✅ YES

---

**Document Version:** 1.1
**Maintained By:** Development Team
**Last Review:** 2026-01-23

# Architecture Decisions

> **Last Updated:** 2026-01-08
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

**When to Use Zustand:**
- Cross-tool state sharing (e.g., user preferences across multiple tools)
- Global UI state (e.g., theme, notifications, modals)
- Server-synchronized data (not applicable for this privacy-first architecture)

**Recommended Pattern:**
```typescript
// Local state (preferred)
const [input, setInput] = useState('');
const [output, setOutput] = useState('');
const stats = useMemo(() => calculateStats(input), [input]);

// Zustand (for global state only)
// Store: /store/use-app-store.ts
export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  notifications: [],
  setTheme: (theme) => set({ theme }),
  // ...
}));
```

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

**Metrics:**
- Bundle Size: 235 kB (26% reduced from 317 kB)
- Test Coverage: 83% (64/77 tests, 100% pass rate)
- Build Time: ~10s
- TypeScript Errors: 0
- Linting Warnings: 88 (type definitions, acceptable)

**Ready for Production:** ✅ YES

---

**Document Version:** 1.0
**Maintained By:** Development Team
**Last Review:** 2026-01-08

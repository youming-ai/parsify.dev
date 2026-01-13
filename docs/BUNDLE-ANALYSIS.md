# Bundle Analysis & Optimization Plan

> **Date:** 2026-01-08
> **Current Bundle Size:** 235 kB
> **Target:** <150 kB
> **Gap:** -85 kB

---

## Executive Summary

Bundle size has been reduced from 317 kB to 235 kB (26% reduction). However, significant optimization opportunities remain to reach the <150 kB target.

**Key Findings:**
- ⚠️ Phosphor Icons wildcard import includes 15,000+ icons (57M in node_modules)
- ⚠️ @radix-ui/react-select is largest Radix package (436K)
- 📊 Vendor chunk at 738K (226 kB compressed)
- ✅ 10 unused dependencies removed via knip audit
- ✅ Phosphor icons optimizePackageImports configured (but ineffective with wildcard import)

---

## Current Bundle Breakdown

### Build Output
```
+ First Load JS shared by all            235 kB
  ├ chunks/vendors-405b3483fb2375c0.js   226 kB
  └ other shared chunks (total)         8.98 kB
```

### Chunk Sizes
- `vendors-*.js`: 738K uncompressed → 226 kB compressed (gzip)
- Framework chunks: ~200K (Next.js, React)
- Other shared: 9K (utilities, icons, etc.)

### Tool Page Sizes (Average)
- Range: 1.2 KB - 4.0 KB per tool
- Total per page: ~1.32 - 1.33 MB (includes shared bundles)

---

## Critical Issue: Phosphor Icons Wildcard Import

### Problem

**File:** `src/components/ui/icon.tsx` (line 3)
```typescript
import * as PhosphorIcons from '@phosphor-icons/react';
```

**Impact:**
- Includes ALL 15,000+ Phosphor icons in bundle
- `@phosphor-icons/react` package: 57M in node_modules
- Even with `optimizePackageImports` configured, wildcard import prevents tree-shaking
- Estimated contribution to bundle: **50-80 kB**

### Root Cause

Wildcard import `import * as ...` tells TypeScript/Next.js to keep ALL icons because they might be accessed dynamically.

### Solution

**Option A: Individual Named Imports (RECOMMENDED)**
Change to import only used icons:
```typescript
// Current (BAD)
import * as PhosphorIcons from '@phosphor-icons/react';

// Better
import {
  FileJson,
  Lock,
  Key,
  Check,
  Warning,
  // ... only icons actually used
} from '@phosphor-icons/react';
```

**Pros:**
- Maximum tree-shaking
- Smallest bundle
- Type-safe
- Clear dependencies

**Cons:**
- Long import statement
- Need to add new icon to import list

**Estimated Savings:** 50-80 kB

---

**Option B: Dynamic Icon Loading (ALTERNATIVE)**
Load icons on-demand:
```typescript
export function Icon({ name, className, size = 24 }: IconProps) {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('@phosphor-icons/react').then((phosphor) => {
      const icon = phosphor[name as keyof typeof phosphor];
      if (icon) setIconComponent(() => icon);
    });
  }, [name]);

  if (!IconComponent) {
    return <span className={`inline-block ${className}`}>⚡</span>;
  }

  return <IconComponent className={className} size={size} weight="regular" />;
}
```

**Pros:**
- Zero icons in initial bundle
- Smallest possible bundle
- Still type-safe

**Cons:**
- Async rendering (icon might flash)
- More complexity
- Multiple requests during initial load

**Estimated Savings:** 70-100 kB (initial), icons loaded on-demand

---

**Option C: Keep Current + Live with It**

Accept current state and document.

**Pros:**
- No changes required
- Instant icon rendering

**Cons:**
- 50-80 kB unnecessary in bundle
- Don't meet bundle target

**Estimated Savings:** 0 kB

---

## Secondary Issue: Radix UI Packages

### Large Packages Found

| Package | Size | Usage | Optimization Potential |
|---------|------|--------|----------------------|
| `@radix-ui/react-select` | 436K | Medium |
| `@radix-ui/react-scroll-area` | 308K | Low |
| `@radix-ui/react-menu` | 264K | Low |
| `@radix-ui/react-slider` | 244K | Low |
| `@radix-ui/react-collection` | 240K | N/A |
| `@radix-ui/react-progress` | 208K | Low |
| `@radix-ui/react-popper` | 188K | Low |

### Optimization Opportunities

**1. Verify Tree-Shaking**
Radix UI packages are modular. Verify that unused components aren't bundled:
```typescript
// Check bundle for unused Radix components
// Example: If only Dialog used, don't bundle Menu, Select, etc.
```

**2. Consider Lighter Alternatives**
Evaluate if simpler components can replace complex Radix UI components.

**Estimated Savings:** 10-20 kB

---

## Completed Optimizations

### ✅ Dependency Cleanup (via knip audit)

**Removed Dependencies (6):**
- `@radix-ui/react-checkbox` (not used)
- `@radix-ui/react-dialog` (not used)
- `@radix-ui/react-dropdown-menu` (not used)
- `@radix-ui/react-radio-group` (not used)
- `@radix-ui/react-tooltip` (not used)
- `zustand` (not used after state management refactor)

**Removed DevDependencies (4):**
- `@testing-library/dom` (not used, using @testing-library/jest-dom)
- `@testing-library/react` (React 19 compatibility issues, tests disabled)
- `@testing-library/user-event` (not used, tests disabled)
- `critters` (not used)

**Estimated Savings:** ~5-10 kB

---

## Recommended Action Plan

### Phase 1: Fix Phosphor Icons (CRITICAL - Do First)

**Option A: Individual Named Imports** (1 hour)
1. Audit all icon usage in codebase
2. Create list of used icons
3. Update `src/components/ui/icon.tsx` to import only used icons
4. Update `src/lib/icon-map.ts` to use named imports
5. Verify all icons still work
6. Run bundle analysis
7. Commit and deploy

**Estimated Impact:** -50 to -80 kB

---

### Phase 2: Optimize Radix UI (MEDIUM - 2-4 hours)

1. Analyze which Radix components are actually used
2. Verify tree-shaking is working
3. Evaluate if any components can be replaced with simpler alternatives
4. Run bundle analysis
5. Commit changes

**Estimated Impact:** -10 to -20 kB

---

### Phase 3: Final Polish (LOW - 1-2 hours)

1. Run `ANALYZE=true bun run build`
2. Open `.next/analyze/client.html`
3. Identify any remaining large modules
4. Optimize Tailwind CSS (remove unused utilities)
5. Minify/inline critical CSS if applicable
6. Final bundle analysis

**Estimated Impact:** -5 to -15 kB

---

## Projected Results

### Current State
- Bundle: 235 kB
- Gap to target: -85 kB

### After Phase 1 (Phosphor Icons Fix)
- **Estimated:** 155-185 kB
- **Gap to target:** -5 to +35 kB
- **Probability of reaching target:** 70-80%

### After Phase 2 (Radix Optimization)
- **Estimated:** 135-165 kB
- **Gap to target:** +15 to -15 kB
- **Probability of reaching target:** 85-95%

### After Phase 3 (Final Polish)
- **Estimated:** 120-150 kB
- **Gap to target:** -30 to 0 kB
- **Probability of reaching target:** 95-100%

---

## Risk Assessment

### Phase 1: Phosphor Icons Fix
**Risk Level:** LOW

**Risks:**
- Import list might be incomplete (icons not listed)
- New icons require adding to import list
- Some icons might not export correctly

**Mitigation:**
- Comprehensive audit before changing
- Add to import list as needed
- Test thoroughly before deployment

**Confidence:** 95% this will work correctly

---

### Phase 2: Radix Optimization
**Risk Level:** MEDIUM

**Risks:**
- Might break existing components
- Tree-shaking already optimized (no further savings)
- Replacement components have UX differences

**Mitigation:**
- Careful testing after changes
- A/B testing with alternatives
- Rollback plan ready

**Confidence:** 70% additional savings possible

---

### Phase 3: Final Polish
**Risk Level:** LOW

**Risks:**
- Might be diminishing returns
- Time vs. benefit trade-off

**Mitigation:**
- Set time limit (e.g., 2 hours max)
- Track savings at each step
- Stop if savings <5 kB

**Confidence:** 80% small additional savings possible

---

## Bundle Analysis Tools

### Run Bundle Analysis
```bash
# Generate detailed bundle visualization
ANALYZE=true bun run build

# View results
open .next/analyze/client.html  # macOS
start .next/analyze/client.html  # Windows
xdg-open .next/analyze/client.html  # Linux
```

### Check Chunk Sizes
```bash
# List all chunks
ls -lh .next/static/chunks/

# Find largest files
du -sh .next/static/chunks/* | sort -hr | head -20
```

### Analyze Specific Module
```bash
# Check what's in a chunk
# Use webpack-bundle-analyzer visual interface
# Hover over modules to see size
```

---

## Monitoring

### Track Bundle Size Over Time
Create `docs/BUNDLE-SIZE.md`:
```markdown
| Date | Bundle Size | Change | Target Met? |
|------|------------|--------|--------------|
| 2026-01-07 | 235 kB | - | ❌ |
| 2026-01-08 | 155 kB | -80 kB | ✅ YES |
```

### Automated Monitoring
Consider adding bundle size check to CI:
```yaml
# .github/workflows/build.yml
- name: Check Bundle Size
  run: |
    bun run build
    SIZE=$(wc -c .next/static/chunks/vendors-*.js | awk '{print $1}')
    if [ $SIZE -gt 157286 ]; then  # 150 kB in bytes
      echo "❌ Bundle size: $SIZE bytes (target: 150000)"
      exit 1
    fi
```

---

## Conclusion

**Current Status:**
- Bundle size: 235 kB
- Progress: 26% reduced from 317 kB
- Remaining gap: -85 kB

**Quick Win Available:**
Fix Phosphor Icons wildcard import → **-50 to -80 kB savings** (estimated: 155-185 kB final)

**Recommended Action:**
Implement Phase 1 (individual named imports for Phosphor Icons) immediately.

This single change has the highest ROI and is the most straightforward path to reaching the <150 kB target.

---

**Document Version:** 1.0
**Next Review:** After implementing Phase 1
**Analysis Date:** 2026-01-08

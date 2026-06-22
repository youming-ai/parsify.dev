# Vercel Geist Design Tokens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom OCR-instrument theme (detect-green / lock-magenta) with Vercel Geist Light design tokens as the single source of truth for colors, typography, radii, elevation, and motion.

**Architecture:** Two-layer CSS token system — Layer 1 maps Geist values to shadcn/ui semantic names (`--color-primary`, `--color-ring`, etc.) so `button.tsx` / `input.tsx` keep working unchanged; Layer 2 exposes the full Geist palette (gray 100–1000, gray-alpha, blue/red/amber/green/teal/purple/pink + P3 oklch) as Tailwind v4 `@theme` utilities.

**Tech Stack:** Tailwind CSS v4 `@theme`, Google Fonts (Geist variable axes), shadcn/ui primitives, TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-06-19-geist-design-tokens-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `index.html` | Modify | Swap Google Fonts link from IBM Plex Sans / JetBrains Mono / Martian Mono → Geist / Geist Mono |
| `src/styles/app.css` | **Rewrite** | New `@theme` (Layer 1 + 2 + 3), remove `.dark`, remove body grid, remove `.scan-beam` + `@keyframes scan-y`, update `.scan-beam-once`, add `:focus-visible` ring |
| `src/components/layout/header.tsx` | Modify | Logo brackets: `border-detect` → `border-foreground`; center dot: `bg-detect` → `bg-foreground`; brand text: `font-display` → `font-mono`; remove `<ThemeToggle />` import and render |
| `src/components/layout/theme-toggle.tsx` | **Rewrite** | Deprecate: strip state/provider, render disabled button, mark file as placeholder |
| `src/components/layout/language-toggle.tsx` | Modify | Active language: `bg-detect text-detect-foreground` → `bg-foreground text-background` |
| `src/components/layout/footer.tsx` | Modify | Status dot: `text-detect` → `text-green-700` |
| `src/components/ui/detection-frame.tsx` | Modify | Idle: `border-detect` → `border-foreground`, `text-detect` → `text-foreground`; active: `border-lock` → `border-blue-700`, `text-lock` → `text-blue-700`; `font-display` → `font-mono`; `scan` render: only emit span when `scan === 'once'` |
| `src/components/ui/button.tsx` | Modify | `rounded-md` → `rounded-sm` (Geist controls = 6px) |
| `src/components/ui/input.tsx` | Modify | `rounded-md` → `rounded-sm` (Geist controls = 6px) |
| `src/components/ocr/ocr-canvas.tsx` | Modify | Canvas strokes: both `#006bff`; file icon + separator: `text-detect` → `text-muted-foreground`; surfaces: `bg-surface` → `bg-card`, `bg-surface-2` → `bg-muted` |
| `src/components/ocr/ocr-result.tsx` | Modify | Active row highlight: `bg-lock/10 ring-lock/40` → `bg-foreground/10 ring-foreground/20`; confidence bar: `bg-lock` → `bg-foreground`, `bg-detect` → `bg-blue-700` |
| `src/components/ocr/enhance-output.tsx` | Modify | AI card: `border-detect/30 bg-detect/5` → `border-blue-700/30 bg-blue-700/5`; label: `font-display text-detect` → `font-mono text-blue-700`; streaming dot: `bg-detect` → `bg-blue-700` |
| `src/components/ocr/ocr-progress.tsx` | Modify | Percentage: `text-detect` → `text-blue-700`; progress bar + dots: `bg-detect` → `bg-blue-700`; container: `bg-surface` → `bg-card` |
| `src/components/ocr/image-upload.tsx` | Modify | Brackets: `border-detect/70` → `border-foreground/70`; scan bar: `bg-detect` → `bg-ring`, shadow `--color-detect` → `--color-ring`; drag: `border-detect bg-detect/5` → `border-foreground bg-foreground/5`; default border: `border-line` → `border-border`; hover: `hover:border-detect/50` → `hover:border-foreground/50`; idle label: `text-detect` → `text-muted-foreground`; remove `<span className="scan-beam" />`; surface: `bg-surface` → `bg-card` |
| `src/routes/index.tsx` | Modify | Hero eyebrow: `text-detect` → `text-muted-foreground`; hero heading: `font-display` → `font-mono`; result container: `bg-surface` → `bg-card`, `bg-surface-2` → `bg-muted`; streaming dot: `bg-detect` → `bg-blue-700`; active tab: `bg-detect text-detect-foreground` → `bg-foreground text-background`; spec strip: `bg-surface` → `bg-card`; spec cell: `font-display` → `font-mono`, `bg-detect` → `bg-foreground` |
| `AGENTS.md` | Modify | Update font stack description |

---

## Task 1: Swap Google Fonts in `index.html`

**Files:**
- Modify: `index.html:15-18`

- [ ] **Step 1: Replace the font stylesheet link**

Replace lines 15–18:

```html
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Martian+Mono:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
```

With:

```html
    <link
      href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap"
      rel="stylesheet"
    />
```

The two existing `<link rel="preconnect">` tags on lines 13–14 stay unchanged.

- [ ] **Step 2: Verify font loads**

Run: `bun run dev` then open `http://localhost:5173` in a browser. Confirm in DevTools → Network → Fonts that `Geist` and `Geist Mono` are loaded from `fonts.googleapis.com`. The page will still render with old colors — that's expected; tokens change in the next task.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "style(index): swap Google Fonts to Geist Sans + Geist Mono"
```

---

## Task 2: Rewrite `src/styles/app.css`

**Files:**
- Rewrite: `src/styles/app.css`

This is the largest task. The entire file is replaced. The new file defines:
- Layer 1: shadcn semantic tokens (consumed by `button.tsx`, `input.tsx`, etc.)
- Layer 2: Full Geist palette (gray, gray-alpha, 7 accent scales, P3 oklch)
- Layer 3: Radii, typography, elevation, motion
- Base layer: border reset, flat body, `:focus-visible` two-layer ring
- Scan beam: only `scan-once` (looping variant removed)

- [ ] **Step 1: Replace the entire file with the following**

```css
@import 'tailwindcss';

/*
 * Parsify — Vercel Geist Design System (Light Theme).
 * Token source: https://vercel.com/design.md
 * Structure:
 *   Layer 1: shadcn/ui semantic tokens (consumed by ui/ primitives)
 *   Layer 2: Full Geist palette (gray, gray-alpha, accent scales, P3)
 *   Layer 3: Geometry, motion, typography, elevation
 * Dark theme: follow-up (see /design.dark.md).
 */
@theme {
  /* ── Layer 1: shadcn semantic tokens ───────────────────── */
  --color-background: #ffffff;
  --color-foreground: #171717;
  --color-card: #ffffff;
  --color-card-foreground: #171717;
  --color-popover: #ffffff;
  --color-popover-foreground: #171717;
  --color-primary: #171717;
  --color-primary-foreground: #ffffff;
  --color-secondary: #f2f2f2;
  --color-secondary-foreground: #171717;
  --color-muted: #fafafa;
  --color-muted-foreground: #4d4d4d;
  --color-accent: #f2f2f2;
  --color-accent-foreground: #171717;
  --color-destructive: #ea001d;
  --color-destructive-foreground: #ffffff;
  --color-border: #00000014;
  --color-input: #00000014;
  --color-ring: #006bff;

  /* ── Layer 2: Geist gray scale ─────────────────────────── */
  --color-gray-100: #f2f2f2;
  --color-gray-200: #ebebeb;
  --color-gray-300: #e6e6e6;
  --color-gray-400: #eaeaea;
  --color-gray-500: #c9c9c9;
  --color-gray-600: #a8a8a8;
  --color-gray-700: #8f8f8f;
  --color-gray-800: #7d7d7d;
  --color-gray-900: #4d4d4d;
  --color-gray-1000: #171717;

  /* ── Layer 2: Geist gray-alpha (translucent) ───────────── */
  --color-gray-alpha-100: #0000000d;
  --color-gray-alpha-200: #00000015;
  --color-gray-alpha-300: #0000001a;
  --color-gray-alpha-400: #00000014;
  --color-gray-alpha-500: #00000036;
  --color-gray-alpha-600: #0000003d;
  --color-gray-alpha-700: #00000070;
  --color-gray-alpha-800: #00000082;
  --color-gray-alpha-900: #000000b3;
  --color-gray-alpha-1000: #000000e8;

  /* ── Layer 2: Geist accent — blue ──────────────────────── */
  --color-blue-100: #f0f7ff;
  --color-blue-200: #e9f4ff;
  --color-blue-300: #dfefff;
  --color-blue-400: #cae7ff;
  --color-blue-500: #94ccff;
  --color-blue-600: #48aeff;
  --color-blue-700: #006bff;
  --color-blue-800: #0059ec;
  --color-blue-900: #005ff2;
  --color-blue-1000: #002359;

  /* ── Layer 2: Geist accent — red ───────────────────────── */
  --color-red-100: #ffeeef;
  --color-red-200: #ffe8ea;
  --color-red-300: #ffe3e4;
  --color-red-400: #ffd7d6;
  --color-red-500: #ffb1b3;
  --color-red-600: #ff676d;
  --color-red-700: #fc0035;
  --color-red-800: #ea001d;
  --color-red-900: #d8001b;
  --color-red-1000: #47000c;

  /* ── Layer 2: Geist accent — amber ─────────────────────── */
  --color-amber-100: #fff6de;
  --color-amber-200: #fff4cf;
  --color-amber-300: #fff1c1;
  --color-amber-400: #ffdc73;
  --color-amber-500: #ffc543;
  --color-amber-600: #ffa600;
  --color-amber-700: #ffae00;
  --color-amber-800: #ff9300;
  --color-amber-900: #aa4d00;
  --color-amber-1000: #561900;

  /* ── Layer 2: Geist accent — green ─────────────────────── */
  --color-green-100: #ecfdec;
  --color-green-200: #e5fce7;
  --color-green-300: #d3fad1;
  --color-green-400: #b9f5bc;
  --color-green-500: #82eb8d;
  --color-green-600: #4ce15e;
  --color-green-700: #28a948;
  --color-green-800: #279141;
  --color-green-900: #107d32;
  --color-green-1000: #003a00;

  /* ── Layer 2: Geist accent — teal ──────────────────────── */
  --color-teal-100: #defffb;
  --color-teal-200: #ddfef6;
  --color-teal-300: #ccf9f1;
  --color-teal-400: #b1f7ec;
  --color-teal-500: #52f0db;
  --color-teal-600: #00e3c4;
  --color-teal-700: #00ac96;
  --color-teal-800: #00927f;
  --color-teal-900: #007f70;
  --color-teal-1000: #003f34;

  /* ── Layer 2: Geist accent — purple ────────────────────── */
  --color-purple-100: #faf0ff;
  --color-purple-200: #f9f0ff;
  --color-purple-300: #f6e8ff;
  --color-purple-400: #f2d9ff;
  --color-purple-500: #dfa7ff;
  --color-purple-600: #c979ff;
  --color-purple-700: #a000f8;
  --color-purple-800: #8500d1;
  --color-purple-900: #7d00cc;
  --color-purple-1000: #2f004e;

  /* ── Layer 2: Geist accent — pink ──────────────────────── */
  --color-pink-100: #ffe8f6;
  --color-pink-200: #ffe8f3;
  --color-pink-300: #ffdfeb;
  --color-pink-400: #ffd3e1;
  --color-pink-500: #fdb3cc;
  --color-pink-600: #f97ea7;
  --color-pink-700: #f22782;
  --color-pink-800: #e4106e;
  --color-pink-900: #c41562;
  --color-pink-1000: #460523;

  /* ── Layer 3: Geometry ─────────────────────────────────── */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* ── Layer 3: Typography ───────────────────────────────── */
  --font-sans: 'Geist', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;

  /* ── Layer 3: Elevation ────────────────────────────────── */
  --shadow-raised: 0 2px 2px rgba(0, 0, 0, 0.04);
  --shadow-popover: 0 1px 1px rgba(0, 0, 0, 0.02),
    0 4px 8px -4px rgba(0, 0, 0, 0.04),
    0 16px 24px -8px rgba(0, 0, 0, 0.06);
  --shadow-modal: 0 1px 1px rgba(0, 0, 0, 0.02),
    0 8px 16px -4px rgba(0, 0, 0, 0.04),
    0 24px 32px -8px rgba(0, 0, 0, 0.06);
}

/* ── Layer 2: P3 wide-gamut accent variants (oklch) ──────── */
/* sRGB hex above is the fallback. P3 displays get richer color. */
:root {
  --color-blue-100-p3: oklch(97.32% 0.0141 251.56);
  --color-blue-200-p3: oklch(96.29% 0.0195 250.59);
  --color-blue-300-p3: oklch(94.58% 0.0293 249.85);
  --color-blue-400-p3: oklch(91.58% 0.0473 245.12);
  --color-blue-500-p3: oklch(82.75% 0.0979 248.48);
  --color-blue-600-p3: oklch(73.08% 0.1583 248.13);
  --color-blue-700-p3: oklch(57.61% 0.2508 258.23);
  --color-blue-800-p3: oklch(51.51% 0.2399 257.85);
  --color-blue-900-p3: oklch(53.18% 0.2399 256.99);
  --color-blue-1000-p3: oklch(26.67% 0.1099 254.34);
  --color-red-100-p3: oklch(96.5% 0.0223 13.09);
  --color-red-200-p3: oklch(95.41% 0.0299 14.25);
  --color-red-300-p3: oklch(94.33% 0.0369 15.01);
  --color-red-400-p3: oklch(91.51% 0.0471 19.8);
  --color-red-500-p3: oklch(84.47% 0.1018 17.71);
  --color-red-600-p3: oklch(71.12% 0.1881 21.22);
  --color-red-700-p3: oklch(62.56% 0.2524 23.03);
  --color-red-800-p3: oklch(58.19% 0.2482 25.15);
  --color-red-900-p3: oklch(54.99% 0.232 25.29);
  --color-red-1000-p3: oklch(24.8% 0.1041 18.86);
  --color-amber-100-p3: oklch(97.48% 0.0331 85.79);
  --color-amber-200-p3: oklch(96.81% 0.0495 90.24);
  --color-amber-300-p3: oklch(95.93% 0.0636 90.52);
  --color-amber-400-p3: oklch(91.02% 0.1322 88.25);
  --color-amber-500-p3: oklch(86.55% 0.1583 79.63);
  --color-amber-600-p3: oklch(80.25% 0.1953 73.59);
  --color-amber-700-p3: oklch(81.87% 0.1969 76.46);
  --color-amber-800-p3: oklch(77.21% 0.1991 64.28);
  --color-amber-900-p3: oklch(52.79% 0.1496 54.65);
  --color-amber-1000-p3: oklch(30.83% 0.099 45.48);
  --color-green-100-p3: oklch(97.59% 0.0289 145.42);
  --color-green-200-p3: oklch(96.92% 0.037 147.15);
  --color-green-300-p3: oklch(94.6% 0.0674 144.23);
  --color-green-400-p3: oklch(91.49% 0.0976 146.24);
  --color-green-500-p3: oklch(85.45% 0.1627 146.3);
  --color-green-600-p3: oklch(80.25% 0.214 145.18);
  --color-green-700-p3: oklch(64.58% 0.1746 147.27);
  --color-green-800-p3: oklch(57.81% 0.1507 147.5);
  --color-green-900-p3: oklch(51.75% 0.1453 147.65);
  --color-green-1000-p3: oklch(29.15% 0.1197 147.38);
  --color-teal-100-p3: oklch(97.72% 0.0359 186.7);
  --color-teal-200-p3: oklch(97.06% 0.0347 180.66);
  --color-teal-300-p3: oklch(94.92% 0.0478 182.07);
  --color-teal-400-p3: oklch(92.76% 0.0718 183.78);
  --color-teal-500-p3: oklch(86.88% 0.1344 182.42);
  --color-teal-600-p3: oklch(81.5% 0.161 178.96);
  --color-teal-700-p3: oklch(64.92% 0.1572 181.95);
  --color-teal-800-p3: oklch(57.53% 0.1392 181.66);
  --color-teal-900-p3: oklch(52.08% 0.1251 182.93);
  --color-teal-1000-p3: oklch(32.11% 0.0788 179.82);
  --color-purple-100-p3: oklch(96.65% 0.0244 312.19);
  --color-purple-200-p3: oklch(96.73% 0.0228 309.8);
  --color-purple-300-p3: oklch(94.85% 0.0364 310.15);
  --color-purple-400-p3: oklch(91.77% 0.0614 312.82);
  --color-purple-500-p3: oklch(81.26% 0.1409 310.8);
  --color-purple-600-p3: oklch(72.07% 0.2083 308.19);
  --color-purple-700-p3: oklch(55.5% 0.3008 306.12);
  --color-purple-800-p3: oklch(48.58% 0.2638 305.73);
  --color-purple-900-p3: oklch(47.18% 0.2579 304);
  --color-purple-1000-p3: oklch(23.96% 0.13 305.66);
  --color-pink-100-p3: oklch(95.69% 0.0359 344.62);
  --color-pink-200-p3: oklch(95.71% 0.0321 353.14);
  --color-pink-300-p3: oklch(93.83% 0.0451 356.29);
  --color-pink-400-p3: oklch(91.12% 0.0573 358.82);
  --color-pink-500-p3: oklch(84.28% 0.0915 356.99);
  --color-pink-600-p3: oklch(74.33% 0.1547 0.24);
  --color-pink-700-p3: oklch(63.52% 0.238 1.01);
  --color-pink-800-p3: oklch(59.51% 0.2339 4.21);
  --color-pink-900-p3: oklch(53.5% 0.2058 2.84);
  --color-pink-1000-p3: oklch(26% 0.0977 359);
}

@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    font-family: var(--font-sans);
    background-color: var(--color-background);
    color: var(--color-foreground);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :focus-visible {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 2px var(--color-background), 0 0 0 4px var(--color-ring);
  }
}

/* ── Scan beam — single-pass reveal ──────────────────────── */
@keyframes scan-once {
  0% {
    top: 0%;
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  88% {
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

.scan-beam-once {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-ring) 25%,
    var(--color-ring) 75%,
    transparent
  );
  box-shadow: 0 0 10px 1px color-mix(in srgb, var(--color-ring) 70%, transparent);
  animation: scan-once 1.1s ease-out 0.15s 1 both;
}

@media (prefers-reduced-motion: reduce) {
  .scan-beam-once {
    animation: none;
    opacity: 0;
  }
}
```

- [ ] **Step 2: Verify TypeScript still compiles**

Run: `bun run typecheck`
Expected: Zero errors. (CSS changes don't affect TypeScript.)

- [ ] **Step 3: Verify lint passes**

Run: `bun run lint`
Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles/app.css
git commit -m "style(app.css): rewrite tokens to Vercel Geist design system"
```

---

## Task 3: Update `header.tsx` — logo colors, remove ThemeToggle

**Files:**
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Apply the following changes**

Replace the entire file content with:

```tsx
import { Link } from '~/components/link';
import { LanguageToggle } from './language-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          {/* Detection-bracket mark: corner registration around the glyph */}
          <span className="relative grid h-6 w-6 place-items-center">
            <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-foreground" />
            <span className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-foreground" />
            <span className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-foreground" />
            <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-foreground" />
            <span className="h-2 w-2 bg-foreground" />
          </span>
          <span className="font-mono text-sm font-semibold tracking-[0.18em]">PARSIFY</span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
```

Changes from original:
- Line 3: removed `ThemeToggle` import
- Lines 15–19: `border-detect` → `border-foreground` (4 corner brackets)
- Line 19: `bg-detect` → `bg-foreground` (center dot)
- Line 21: `font-display` → `font-mono`
- Line 25: removed `<ThemeToggle />` render

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "style(header): update logo to foreground, remove ThemeToggle"
```

---

## Task 4: Deprecate `theme-toggle.tsx`

**Files:**
- Rewrite: `src/components/layout/theme-toggle.tsx`

- [ ] **Step 1: Replace the entire file with**

```tsx
// Deprecated: kept as a placeholder for the future Vercel dark theme.
// Currently not rendered in the header. Clicking is a no-op.
import { Sun } from 'lucide-react';
import { Button } from '~/components/ui/button';

export function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon" disabled aria-label="Toggle theme (coming soon)">
      <Sun className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

Changes from original: removed `useTheme`, `useState`, `useEffect`, `Moon` icon, all state logic. Component is now a disabled button — preserved as a placeholder for the future dark-theme follow-up.

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/theme-toggle.tsx
git commit -m "style(theme-toggle): deprecate component, make no-op placeholder"
```

---

## Task 5: Update `language-toggle.tsx`

**Files:**
- Modify: `src/components/layout/language-toggle.tsx:22-25`

- [ ] **Step 1: Replace the active-language class**

In line 24, replace:

```tsx
              ? 'bg-detect text-detect-foreground'
```

With:

```tsx
              ? 'bg-foreground text-background'
```

This changes the active language button from green background + dark-green text to solid dark background + white text — the Geist "active tab" pattern.

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/language-toggle.tsx
git commit -m "style(language-toggle): replace detect with foreground/background"
```

---

## Task 6: Update `footer.tsx`

**Files:**
- Modify: `src/components/layout/footer.tsx:53`

- [ ] **Step 1: Replace the status dot color**

In line 53, replace:

```tsx
            <span className="text-detect">●</span> {t('footer.status')}
```

With:

```tsx
            <span className="text-green-700">●</span> {t('footer.status')}
```

The "online" status dot uses Geist's green-700 — a success/status color, not the old detect-green. Green for "ok/online" is a universal convention and the Geist palette includes it for this purpose.

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/footer.tsx
git commit -m "style(footer): replace detect with green-700 status dot"
```

---

## Task 7: Update `detection-frame.tsx`

**Files:**
- Modify: `src/components/ui/detection-frame.tsx`

- [ ] **Step 1: Apply all changes**

Replace the entire file with:

```tsx
import type React from 'react';
import { cn } from '~/lib/utils';

interface DetectionFrameProps {
  children: React.ReactNode;
  /** Mono tag pinned to the top-right corner, e.g. a confidence value. */
  label?: string;
  /** Mono tag pinned to the bottom-left corner, e.g. coordinates. */
  coord?: string;
  /** Render the active (blue accent) state instead of idle foreground. */
  active?: boolean;
  /** Show a single-pass scan beam on mount. 'idle' is a no-op (retained for source compat). */
  scan?: 'idle' | 'once';
  /** Solid background behind the corner tags so they sit cleanly over the line. */
  tagBg?: string;
  className?: string;
  contentClassName?: string;
}

/**
 * Corner registration brackets + optional mono tags and a scan beam.
 * Idle state uses foreground; active uses blue-700 (ring).
 */
export function DetectionFrame({
  children,
  label,
  coord,
  active = false,
  scan,
  tagBg = 'bg-background',
  className,
  contentClassName,
}: DetectionFrameProps) {
  const lineColor = active ? 'border-ring' : 'border-foreground';
  const tagColor = active ? 'text-ring' : 'text-foreground';
  const corner = cn('pointer-events-none absolute h-3 w-3', lineColor);

  return (
    <div className={cn('relative', className)}>
      <span className={cn(corner, 'left-0 top-0 border-l-2 border-t-2')} />
      <span className={cn(corner, 'right-0 top-0 border-r-2 border-t-2')} />
      <span className={cn(corner, 'bottom-0 left-0 border-b-2 border-l-2')} />
      <span className={cn(corner, 'bottom-0 right-0 border-b-2 border-r-2')} />

      {scan === 'once' && <span className="scan-beam-once" />}

      {label && (
        <span
          className={cn(
            'absolute -top-2 right-2 px-1 font-mono text-[10px] font-medium leading-none tracking-wider',
            tagBg,
            tagColor
          )}
        >
          {label}
        </span>
      )}
      {coord && (
        <span
          className={cn(
            'absolute -bottom-2 left-2 px-1 font-mono text-[10px] leading-none',
            tagBg,
            'text-muted-foreground'
          )}
        >
          {coord}
        </span>
      )}

      <div className={contentClassName}>{children}</div>
    </div>
  );
}
```

Changes from original:
- `border-detect` → `border-foreground`, `border-lock` → `border-ring` (idle/active)
- `text-detect` → `text-foreground`, `text-lock` → `text-ring` (idle/active)
- `font-display` → `font-mono` (label tag)
- `scan && <span className={scan === 'idle' ? 'scan-beam' : 'scan-beam-once'} />` → `scan === 'once' && <span className="scan-beam-once" />` (idle produces no element)

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/detection-frame.tsx
git commit -m "style(detection-frame): replace detect/lock with foreground/ring, fix scan"
```

---

## Task 8: Update `button.tsx` and `input.tsx` — radius alignment

**Files:**
- Modify: `src/components/ui/button.tsx:6`
- Modify: `src/components/ui/input.tsx:12`

Geist design specifies 6px radius for controls (buttons, inputs). The new `--radius-md` is 12px (menus/modals). Shadcn's `rounded-md` would resolve to 12px — too round for a button. Change to `rounded-sm` which resolves to the Geist control radius (6px).

- [ ] **Step 1: Update `button.tsx`**

In line 6, replace `rounded-md` with `rounded-sm` in the `cva` base string:

```tsx
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
```

- [ ] **Step 2: Update `input.tsx`**

In line 12, replace `rounded-md` with `rounded-sm` in the className string:

```tsx
          'flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/input.tsx
git commit -m "style(ui): align button/input radius to Geist control spec (6px)"
```

---

## Task 9: Update `ocr-canvas.tsx`

**Files:**
- Modify: `src/components/ocr/ocr-canvas.tsx`

- [ ] **Step 1: Apply all changes**

Replace the hardcoded stroke constants (lines 25–26):

```tsx
const DETECT_STROKE = '#8bff5a';
const LOCK_STROKE = '#ff4d9d';
```

With:

```tsx
const DETECT_STROKE = '#006bff';
const LOCK_STROKE = '#006bff';
```

Both use blue-700. State is differentiated by `lineWidth` (2 vs 3) and `globalAlpha` (0.7 vs 1.0), which are already set in the drawing code.

Update the comment above (lines 23–24):

```tsx
// Overlay strokes use blue-700 (ring) regardless of theme. State is
// carried by lineWidth and alpha, not hue — per Geist single-accent philosophy.
```

Replace the file icon class on line 119:

```tsx
          <FileImage className="h-4 w-4 shrink-0 text-detect" />
```

With:

```tsx
          <FileImage className="h-4 w-4 shrink-0 text-muted-foreground" />
```

Replace the separator dot on line 130:

```tsx
            <span className="mx-1.5 text-detect">·</span>
```

With:

```tsx
            <span className="mx-1.5 text-muted-foreground">·</span>
```

Replace `bg-surface` with `bg-card` on line 115:

```tsx
    <div className={cn('flex flex-col overflow-hidden rounded-lg border bg-card', className)}>
```

Replace `bg-surface-2` with `bg-muted` on lines 117 and 151:

```tsx
      <div className="flex items-center justify-between gap-2 border-b bg-muted px-3 py-2">
```

```tsx
      <div className="flex items-center justify-between gap-2 border-t bg-muted px-2 py-1.5">
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ocr/ocr-canvas.tsx
git commit -m "style(ocr-canvas): blue strokes, replace detect/surface tokens"
```

---

## Task 10: Update `ocr-result.tsx`

**Files:**
- Modify: `src/components/ocr/ocr-result.tsx`

- [ ] **Step 1: Apply all changes**

Replace active row highlight on line 32:

```tsx
              active ? 'bg-lock/10 ring-1 ring-lock/40' : 'hover:bg-muted'
```

With:

```tsx
              active ? 'bg-foreground/10 ring-1 ring-foreground/20' : 'hover:bg-muted'
```

Replace the confidence bar fill on line 42:

```tsx
                className={cn('block h-full', active ? 'bg-lock' : 'bg-detect')}
```

With:

```tsx
                className={cn('block h-full', active ? 'bg-foreground' : 'bg-blue-700')}
```

Active row uses foreground (monochrome highlight); idle confidence bar uses blue-700 (accent fill).

- [ ] **Step 2: Commit**

```bash
git add src/components/ocr/ocr-result.tsx
git commit -m "style(ocr-result): replace lock/detect with foreground/blue-700"
```

---

## Task 11: Update `enhance-output.tsx`

**Files:**
- Modify: `src/components/ocr/enhance-output.tsx`

- [ ] **Step 1: Apply all changes**

Replace the AI card container on line 32:

```tsx
    <div className={cn('rounded-md border border-detect/30 bg-detect/5 p-3', className)}>
```

With:

```tsx
    <div className={cn('rounded-md border border-blue-700/30 bg-blue-700/5 p-3', className)}>
```

Replace the AI label on line 34:

```tsx
        <span className="flex items-center gap-1.5 font-display text-[11px] font-medium tracking-[0.14em] text-detect">
```

With:

```tsx
        <span className="flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.14em] text-blue-700">
```

Replace the streaming dot on line 38:

```tsx
            <span className="ml-1 h-1.5 w-1.5 animate-pulse rounded-full bg-detect" />
```

With:

```tsx
            <span className="ml-1 h-1.5 w-1.5 animate-pulse rounded-full bg-blue-700" />
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ocr/enhance-output.tsx
git commit -m "style(enhance-output): replace detect with blue-700, font-display → font-mono"
```

---

## Task 12: Update `ocr-progress.tsx`

**Files:**
- Modify: `src/components/ocr/ocr-progress.tsx`

- [ ] **Step 1: Apply all changes**

Replace the container background on line 36:

```tsx
    <div className={cn('w-full space-y-3 rounded-lg border bg-surface p-4', className)}>
```

With:

```tsx
    <div className={cn('w-full space-y-3 rounded-lg border bg-card p-4', className)}>
```

Replace the percentage text on line 39:

```tsx
        <span className="text-detect">{pct}%</span>
```

With:

```tsx
        <span className="text-blue-700">{pct}%</span>
```

Replace the progress bar fill on line 44:

```tsx
          className="h-full rounded-full bg-detect transition-all duration-300"
```

With:

```tsx
          className="h-full rounded-full bg-blue-700 transition-all duration-300"
```

Replace the active step dot on lines 57–58:

```tsx
                  state === 'active' && 'animate-pulse bg-detect',
                  state === 'done' && 'bg-detect',
```

With:

```tsx
                  state === 'active' && 'animate-pulse bg-blue-700',
                  state === 'done' && 'bg-foreground',
```

Active dot pulses in blue-700; completed dot is solid foreground (gray-1000).

Replace the active step label on line 64:

```tsx
                  state === 'active' && 'text-detect',
```

With:

```tsx
                  state === 'active' && 'text-blue-700',
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ocr/ocr-progress.tsx
git commit -m "style(ocr-progress): replace detect with blue-700, surface → card"
```

---

## Task 13: Update `image-upload.tsx`

**Files:**
- Modify: `src/components/ocr/image-upload.tsx`

This file has the most scattered changes. Apply each one precisely.

- [ ] **Step 1: Replace scan beam progress bar (line 130)**

```tsx
              className="pointer-events-none absolute inset-x-0 h-0.5 bg-detect shadow-[0_0_12px_2px_var(--color-detect)] transition-[top] duration-300 ease-linear"
```

With:

```tsx
              className="pointer-events-none absolute inset-x-0 h-0.5 bg-ring shadow-[0_0_12px_2px_var(--color-ring)] transition-[top] duration-300 ease-linear"
```

- [ ] **Step 2: Replace preview container (line 103)**

```tsx
        <div className="relative overflow-hidden rounded-lg border bg-surface">
```

With:

```tsx
        <div className="relative overflow-hidden rounded-lg border bg-card">
```

- [ ] **Step 3: Replace upload button classes (lines 150–153)**

```tsx
            'relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-surface p-12 transition-colors',
            isDragging ? 'border-detect bg-detect/5' : 'border-line hover:border-detect/50',
```

With:

```tsx
            'relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-card p-12 transition-colors',
            isDragging ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/50',
```

- [ ] **Step 4: Replace registration brackets (lines 166–169)**

```tsx
          <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-detect/70" />
          <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-detect/70" />
          <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-detect/70" />
          <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-detect/70" />
```

With:

```tsx
          <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-foreground/70" />
          <span className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-foreground/70" />
          <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-foreground/70" />
          <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-foreground/70" />
```

- [ ] **Step 5: Remove the looping scan beam (line 170)**

Delete this line entirely:

```tsx
          {!disabled && <span className="scan-beam" />}
```

- [ ] **Step 6: Replace idle label (line 172)**

```tsx
          <span className="mb-1 font-mono text-[10px] tracking-[0.2em] text-detect">
```

With:

```tsx
          <span className="mb-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
```

- [ ] **Step 7: Commit**

```bash
git add src/components/ocr/image-upload.tsx
git commit -m "style(image-upload): replace detect/lock/line, remove looping scan-beam"
```

---

## Task 14: Update `index.tsx`

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Hero eyebrow (line 261)**

```tsx
        <p className="mb-4 font-mono text-[11px] tracking-[0.22em] text-detect">
```

With:

```tsx
        <p className="mb-4 font-mono text-[11px] tracking-[0.22em] text-muted-foreground">
```

- [ ] **Step 2: Hero heading (line 264)**

```tsx
        <h1 className="font-display text-3xl font-semibold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
```

With:

```tsx
        <h1 className="font-mono text-3xl font-semibold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
```

- [ ] **Step 3: Result container (line 330)**

```tsx
          <div className="flex flex-col overflow-hidden rounded-lg border bg-surface lg:h-[70vh] lg:max-h-[760px]">
```

With:

```tsx
          <div className="flex flex-col overflow-hidden rounded-lg border bg-card lg:h-[70vh] lg:max-h-[760px]">
```

- [ ] **Step 4: Result header (line 331)**

```tsx
            <div className="flex items-center justify-between gap-2 border-b bg-surface-2 px-3 py-2">
```

With:

```tsx
            <div className="flex items-center justify-between gap-2 border-b bg-muted px-3 py-2">
```

- [ ] **Step 5: Streaming dot (line 336)**

```tsx
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-detect align-middle" />
```

With:

```tsx
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-700 align-middle" />
```

- [ ] **Step 6: Active output tab (line 434)**

```tsx
        active ? 'bg-detect text-detect-foreground' : 'text-muted-foreground hover:text-foreground'
```

With:

```tsx
        active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
```

- [ ] **Step 7: Spec strip (line 401)**

```tsx
        <section className="mt-12 grid overflow-hidden rounded-lg border bg-surface sm:grid-cols-3">
```

With:

```tsx
        <section className="mt-12 grid overflow-hidden rounded-lg border bg-card sm:grid-cols-3">
```

- [ ] **Step 8: Spec cell label (line 453)**

```tsx
      <p className="mb-2 flex items-center gap-2 font-display text-[11px] font-semibold tracking-[0.16em] text-foreground">
```

With:

```tsx
      <p className="mb-2 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-foreground">
```

- [ ] **Step 9: Spec cell dot (line 454)**

```tsx
        <span className="h-1.5 w-1.5 bg-detect" />
```

With:

```tsx
        <span className="h-1.5 w-1.5 bg-foreground" />
```

- [ ] **Step 10: Commit**

```bash
git add src/routes/index.tsx
git commit -m "style(index): replace detect/surface/font-display with Geist tokens"
```

---

## Task 15: Update `AGENTS.md`

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update the Tech stack line**

Replace:

```
TanStack Router + Vite 7 + React 19 + Tailwind CSS v4 + shadcn/ui + Lucide React + Biome v2 + Bun + TypeScript strict + Zod 4 + Hono 4 + hono-rate-limiter.
```

With:

```
TanStack Router + Vite 7 + React 19 + Tailwind CSS v4 + shadcn/ui + Vercel Geist (Sans + Mono) + Lucide React + Biome v2 + Bun + TypeScript strict + Zod 4 + Hono 4 + hono-rate-limiter.
```

- [ ] **Step 2: Add a Design tokens section after Source layout**

Insert the following after the source layout ` ``` ` block and before `**`~/*` → `src/*`**`:

```markdown
## Design tokens

Vercel Geist Light (`vercel.com/design.md`) is the canonical design token source. `src/styles/app.css` defines a two-layer `@theme` block:

- **Layer 1 — shadcn semantic:** `--color-background`, `--color-foreground`, `--color-primary`, `--color-ring`, etc. All `ui/` primitives read these.
- **Layer 2 — Full Geist palette:** `gray-100..1000`, `gray-alpha-100..1000`, plus `blue`, `red`, `amber`, `green`, `teal`, `purple`, `pink` accent scales (each `100..1000`) with P3 wide-gamut oklch variants. Use directly via Tailwind utilities (`bg-blue-700`, `text-gray-900`, etc.).
- **Layer 3 — Geometry/motion/elevation:** `--radius-sm` (6px, controls), `--radius-md` (12px, menus), `--radius-lg` (16px, fullscreen), `--shadow-raised`/`popover`/`modal`, `--font-sans` (Geist), `--font-mono` (Geist Mono).

Typography: Geist Sans (sans-serif body/UI) + Geist Mono (code/data/corner tags). Loaded via Google Fonts `<link>` in `index.html`.

Dark theme: follow-up spec (read `vercel.com/design.dark.md`). The `theme-toggle.tsx` is a deprecated no-op placeholder.
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs(AGENTS.md): add design tokens section, update font stack"
```

---

## Task 16: Verification

**Files:** none (read-only checks)

- [ ] **Step 1: Type check**

Run: `bun run typecheck`
Expected: Zero errors.

- [ ] **Step 2: Lint**

Run: `bun run lint`
Expected: Zero errors.

- [ ] **Step 3: Tests**

Run: `bun test`
Expected: All tests pass. (No test asserts on color hex values.)

- [ ] **Step 4: Build**

Run: `bun run build`
Expected: Build completes without errors.

- [ ] **Step 5: Visual spot-check (manual)**

Run: `bun run dev`, open `http://localhost:5173`.

Check:
1. Header: white background, dark "PARSIFY" text with foreground brackets, no green/magenta anywhere.
2. Hero: `font-mono` eyebrow text in muted-foreground, hero heading in Geist Mono, DetectionFrame shows blue-700 brackets with single-pass scan-once animation.
3. Upload area: foreground brackets (70% opacity), muted-foreground idle label, no looping scan beam. Drag-over shows foreground highlight.
4. OCR result: blue-700 box strokes on the canvas (2px idle / 3px active), blue-700 confidence bar, foreground active-row highlight.
5. Output tabs: active tab is solid foreground with white text. AI output card has blue-700 border/background accent.
6. Footer: green-700 status dot, muted-foreground copyright.
7. Focus ring: Tab through interactive elements — each shows a 2px white gap + 2px blue-700 ring.
8. Mobile (≤601px): layout stacks vertically, no overflow.

- [ ] **Step 6: Final commit (if any fixes needed)**

If any visual issues were found and fixed in Step 5, commit them. Otherwise, this task is complete — all commits are already in place.

---

## Self-Review

**Spec coverage:**
- ✅ Font swap (index.html) — Task 1
- ✅ Layer 1 shadcn tokens (app.css) — Task 2
- ✅ Layer 2 full Geist palette + P3 (app.css) — Task 2
- ✅ Layer 3 geometry/motion/elevation (app.css) — Task 2
- ✅ `:focus-visible` two-layer ring (app.css) — Task 2
- ✅ Remove `.dark` selector (app.css) — Task 2
- ✅ Remove body dotted grid (app.css) — Task 2
- ✅ Remove looping scan-beam (app.css + image-upload.tsx) — Tasks 2, 13
- ✅ Keep scan-beam-once (app.css) — Task 2
- ✅ Header logo colors + remove ThemeToggle render — Task 3
- ✅ Theme-toggle deprecated placeholder — Task 4
- ✅ Language-toggle active state — Task 5
- ✅ Footer status dot — Task 6
- ✅ Detection-frame detect/lock + scan fix — Task 7
- ✅ Button/input radius alignment — Task 8
- ✅ OCR canvas strokes + surfaces — Task 9
- ✅ OCR result row highlight + confidence bar — Task 10
- ✅ Enhance-output AI card + label — Task 11
- ✅ OCR progress bar + dots — Task 12
- ✅ Image upload brackets + drag + scan beam removal — Task 13
- ✅ Index page hero + tabs + spec strip — Task 14
- ✅ AGENTS.md documentation — Task 15
- ✅ Verification (typecheck, lint, test, build, visual) — Task 16

**Placeholder scan:** No "TBD", "TODO", or "similar to Task N" found.

**Type consistency:** All token references use consistent naming — `--color-ring` for blue-700 accent, `--color-foreground` for gray-1000, `--color-muted` for background-200, `bg-card` for background-100 surfaces. No mixed naming conventions.

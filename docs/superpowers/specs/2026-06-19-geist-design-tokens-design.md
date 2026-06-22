# Parsify — Adopt Vercel Geist Design System

**Date**: 2026-06-19
**Status**: Approved
**Scope**: Replace the custom OCR-instrument theme with Vercel's Geist design system (Light theme) as the project's design token source of truth.

## Overview

Parsify currently ships a custom "OCR machine-vision instrument" theme: detect-green / lock-magenta two-signal palette, Martian Mono corner brackets, a looping scan-beam animation, an IBM Plex Sans + JetBrains Mono type stack, and a dotted-grid body background. This spec adopts Vercel's Geist design system (Light theme, as published at `vercel.com/design.md`) as the single source of truth for design tokens — colors, typography, radii, spacing, elevation, motion, focus, and component baselines.

The pivot is a deliberate aesthetic move from "sharp, two-color, instrumented" to "minimal, restrained, near-neutral surfaces with a single blue accent." The OCR feature's "detect / lock" signal is the only point that required a judgment call; it collapses to a single accent (blue-700) with line-weight and opacity as the state differentiators, in line with Geist's "use color to signal state or hierarchy rather than decoration."

The Dark theme is explicitly out of scope and is documented as a follow-up.

## Goals

1. Treat `vercel.com/design.md` (Geist Light) as the canonical design token source for the project.
2. Keep all shadcn/ui primitives (`button.tsx`, `input.tsx`, `copy-button.tsx`, `detection-frame.tsx`) working without per-component rewrites — token changes happen at the CSS layer.
3. Preserve OCR canvas readability over arbitrary photos (the design constraint that forced the green/magenta signals in the first place).
4. Honor Geist's stated motion philosophy: default 0ms, motion only when it clarifies, honor `prefers-reduced-motion`.

## Non-Goals

- No dark theme implementation in this spec. `vercel.com/design.dark.md` is a separate follow-up.
- No removal of `theme-toggle.tsx` (kept as a deprecated no-op placeholder for the future dark work).
- No refactor of the OCR engine, server routes, schemas, or tests.
- No new dependencies (fonts load from Google Fonts; no `@fontsource/*` or `geist` npm package).

## Token Mapping (Two-Layer)

### Layer 1 — shadcn-compatible semantic tokens

These alias the Geist palette to the variable names that shadcn/ui primitives already use, so `button.tsx`/`input.tsx` continue to work unchanged.

| CSS variable | Geist source | Hex | Role |
|---|---|---|---|
| `--color-background` | `background-100` | `#ffffff` | Page / card base surface |
| `--color-foreground` | `gray-1000` | `#171717` | Primary text |
| `--color-card` | `background-100` | `#ffffff` | Card surface |
| `--color-card-foreground` | `gray-1000` | `#171717` | Card text |
| `--color-popover` | `background-100` | `#ffffff` | Popover surface |
| `--color-popover-foreground` | `gray-1000` | `#171717` | Popover text |
| `--color-primary` | `gray-1000` | `#171717` | Primary button fill (solid) |
| `--color-primary-foreground` | `background-100` | `#ffffff` | Primary button label |
| `--color-secondary` | `gray-100` | `#f2f2f2` | Secondary button fill |
| `--color-secondary-foreground` | `gray-1000` | `#171717` | Secondary button label |
| `--color-muted` | `background-200` | `#fafafa` | Muted surface |
| `--color-muted-foreground` | `gray-900` | `#4d4d4d` | Secondary text / icons |
| `--color-accent` | `gray-100` | `#f2f2f2` | Hover surface |
| `--color-accent-foreground` | `gray-1000` | `#171717` | Hover text |
| `--color-destructive` | `red-800` | `#ea001d` | Destructive action |
| `--color-destructive-foreground` | `#ffffff` | — | Destructive label |
| `--color-border` | `gray-alpha-400` | `#00000014` | Default border |
| `--color-input` | `gray-alpha-400` | `#00000014` | Input border |
| `--color-ring` | `blue-700` | `#006bff` | Focus ring |

### Layer 2 — Full Geist palette (exposed verbatim)

The complete Geist scale is exposed as Tailwind v4 `@theme` color variables so any component can use it directly:

- `gray-100` … `gray-1000`
- `gray-alpha-100` … `gray-alpha-1000`
- Accent scales: `blue`, `red`, `amber`, `green`, `teal`, `purple`, `pink` (each `100` … `1000`)
- P3 wide-gamut variants: `blue-100-p3` … `blue-1000-p3`, same for the other accent scales (oklch values from design.md, fallback to sRGB hex on non-P3 displays)

These are declared as raw hex strings inside `@theme {}` so Tailwind v4 generates utilities like `bg-blue-700`, `text-gray-900`, `border-gray-alpha-400`. The `*-p3` tokens are exposed as named variables for use in inline styles or CSS layers that opt into wide gamut via `color()` / `@supports`.

### Layer 3 — Geometry, motion, elevation

```css
/* Radii */
--radius-sm: 6px;     /* controls, inputs, everyday surfaces */
--radius-md: 12px;    /* menus, modals */
--radius-lg: 16px;    /* fullscreen surfaces */
--radius-full: 9999px; /* pills, avatars, circular controls */

/* Spacing — Tailwind v4 default 4px scale (4, 8, 12, 16, 24, 32, 40, 64, 96) */

/* Elevation */
--shadow-raised: 0 2px 2px rgba(0, 0, 0, 0.04);
--shadow-popover: 0 1px 1px rgba(0, 0, 0, 0.02),
                  0 4px 8px -4px rgba(0, 0, 0, 0.04),
                  0 16px 24px -8px rgba(0, 0, 0, 0.06);
--shadow-modal:   0 1px 1px rgba(0, 0, 0, 0.02),
                  0 8px 16px -4px rgba(0, 0, 0, 0.04),
                  0 24px 32px -8px rgba(0, 0, 0, 0.06);

/* Motion */
--ease-geist: cubic-bezier(0.175, 0.885, 0.32, 1.1);
--duration-state: 150ms;
--duration-popover: 200ms;
--duration-overlay: 300ms;

/* Typography (font families; sizes follow Tailwind v4 defaults) */
--font-sans: 'Geist', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;
```

Tailwind v4 size utilities (`text-sm`, `text-lg`, etc.) continue to work; component-level typography (e.g. `text-button-14` / `text-label-14`) is opt-in via custom utilities that map the Geist typography tokens if and when the design calls for them. The size values from design.md are not consumed in this spec — Tailwind's default scale is sufficient for the current surface area.

## Typography

| Old | New | Notes |
|---|---|---|
| `IBM Plex Sans` (body / sans) | `Geist` | Loaded via Google Fonts `<link>` in `index.html` |
| `Martian Mono` (display / corner tags) | `Geist Mono` | Same `font-mono` utility, different family |
| `JetBrains Mono` (code blocks) | `Geist Mono` | Same family across all mono usage |

Font loading strategy:
- `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` in `index.html`
- `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap">`
- Variable-axis range covers 100–900 in both families, satisfying Geist's `font-weight` requirements without bundling font files in the app build.

## OCR Signal — detect / lock collapse

The current OCR canvas and detection frame use a two-signal palette (`#8bff5a` / `#ff4d9d` in dark, `#0ea84a` / `#d6207a` in light) where the lock state is distinguished by hue from the detect state. Geist's palette has no equivalent two-color "idle vs focused" signal; the natural Vercel pattern is to use one accent with intensity (weight / opacity) carrying the state.

**Decision** (approved):
- `detect` (idle OCR box) → `blue-700` (`#006bff`), 2px stroke, `globalAlpha = 0.7`
- `lock` (focused OCR box) → `blue-700` (`#006bff`), 3px stroke, `globalAlpha = 1.0`
- File icon, separator dot, and other "OCR signal" decorations on the canvas header → `text-muted-foreground` (`gray-900`, `#4d4d4d`)
- `detection-frame.tsx` idle state → `border-foreground`; active state → `border-blue-700`. Corner tag (`label`) color tracks the line color.

Blue-700 is the same value as the focus ring and the link color across the design, so the OCR feature's "active" cue reads as "this is the selectable thing" rather than "this is a different category of thing." This is the Vercel-aligned read of the same UX.

## Component & File Changes

### `src/styles/app.css` — full rewrite of `@theme` and `@layer base`

- Drop all current `--color-*` declarations.
- Drop `--font-display` (`Martian Mono`) — no remaining usage after detection-frame migration.
- Add Layer 1 (shadcn semantic) + Layer 2 (full Geist palette) + Layer 3 (geometry/motion/elevation) per above.
- Drop `.dark` selector entirely. (Future dark theme re-introduces it.)
- Drop body's `radial-gradient` dotted-grid background. Body becomes flat `background-color: var(--color-background)`; `color: var(--color-foreground)`.
- Add a global `:focus-visible` rule: `outline: 2px solid transparent; outline-offset: 2px; box-shadow: 0 0 0 2px var(--color-background), 0 0 0 4px var(--color-ring);` (the two-layer focus ring from design.md: surface-color gap, then blue ring).
- Keep the existing `*` border-color reset (`border-color: var(--color-border)`).
- Remove the looping `.scan-beam` class definition and its `@keyframes scan-y` rule.
- Keep `@keyframes scan-once` and the `.scan-beam-once` class.
- In `detection-frame.tsx`, change the render guard from `scan && <span className={scan === 'idle' ? 'scan-beam' : 'scan-beam-once'} />` to `scan === 'once' && <span className="scan-beam-once" />` so `scan === 'idle'` produces no element at all (cleaner than a no-animation 2px line sitting in the DOM).

### `index.html`

- Add the two `<link rel="preconnect">` tags and the Geist + Geist Mono Google Fonts stylesheet link inside `<head>`.

### `src/components/ocr/ocr-canvas.tsx`

- Replace `const DETECT_STROKE = '#8bff5a';` with `const DETECT_STROKE = '#006bff';` (blue-700, Geist `tertiary`).
- Replace `const LOCK_STROKE = '#ff4d9d';` with `const LOCK_STROKE = '#006bff';` (same hex; state carried by `lineWidth` and `globalAlpha`).
- Update the inline comment to reference the new rationale ("state carried by line weight and opacity, per Geist single-accent signal philosophy").
- Replace `text-detect` (file icon, separator dot) with `text-muted-foreground` (gray-900) — these are now informational, not signal.

### `src/components/ui/detection-frame.tsx`

- Remove `border-detect` / `border-lock` / `text-detect` / `text-lock` references.
- Idle: `border-foreground` (gray-1000). Active: `border-blue-700`.
- Corner tag color: `text-foreground` (idle) / `text-blue-700` (active).
- Replace `font-display` with `font-mono` for the label tag (and the `coord` tag, which already uses `font-mono`).
- The `scan="idle"` prop becomes a no-op at the CSS layer (no animation, no element rendered). Add a brief inline comment in `detection-frame.tsx` noting the prop is retained for source compatibility and becomes meaningful again if/when a non-looping idle cue (e.g. a steady 1px baseline) is added in a future spec.

### `src/components/ocr/image-upload.tsx`

- Audit for any `text-detect` / `border-detect` / `bg-detect` / `text-lock` / `border-lock` references. Replace with the appropriate neutral token (`text-muted-foreground` / `border-border` / `text-foreground` etc.).
- If a green/magenta signal was used for a real UX state (e.g. "uploading success"), map to `green-700` / `red-700` from the full Geist scale rather than removing the signal.

### `src/components/layout/header.tsx`

- Remove the `<ThemeToggle />` import and render. The header still renders the rest (logo, language toggle, etc.).

### `src/components/layout/theme-toggle.tsx`

- Keep the file, the component, the i18n keys, and the export. Internally, render the toggle as inert (still a button, still has an `aria-label`, but the click handler no longer toggles `document.documentElement.classList`). Mark the file with a top-of-file comment: `// Deprecated: kept as a placeholder for the future Vercel dark theme. Clicking is currently a no-op.`
- This avoids a regression in layout while signaling that the dark variant is a follow-up.

### `AGENTS.md`

- Update the "Tech stack" line from "shadcn/ui + Lucide React + Biome v2" to note Geist Sans + Geist Mono as the typography stack.
- Add a short paragraph in the "Source layout" / "Code style" section (or a new "Design tokens" section) pointing to `src/styles/app.css` as the canonical Geist Light token source and noting that the dark theme is a follow-up.
- No other AGENTS.md changes — the `Code style` (Biome), `TypeScript gotcha`, `Security`, and `Deploy` sections remain correct.

## Things explicitly not changed

- `src/lib/ocr/*` — engine, model loader, pipeline, pre/post-processors, types. No business-logic change.
- `src/server/**` — Hono routes, rate limit, schemas. No backend change.
- `src/components/ui/button.tsx` and `src/components/ui/input.tsx` — they read `bg-primary` / `text-primary-foreground` / `border-input` / `ring-ring` / `ring-offset-background`, all of which now resolve to the new Geist-backed variables. Zero source changes.
- `src/components/ui/copy-button.tsx` — same reasoning as button/input.
- `src/__tests__/**` — no test asserts on color hex values; nothing to update.
- `src/components/seo/head.tsx` and `src/lib/seo-config.ts` — meta tags, not visual.
- `src/components/i18n-provider.tsx` and any i18n key file — the `theme.*` keys remain (the toggle is still rendered, even if inert).

## Verification

| Check | Command | Pass criterion |
|---|---|---|
| Types | `bun run typecheck` | Zero errors |
| Lint | `bun run lint` | Zero errors |
| Build | `bun run build` | Builds without warning (font CSS link resolves at runtime, not at build) |
| Tests | `bun test` | All existing tests pass (no test references colors directly) |
| Dev server | `bun run dev` | Homepage, `/docs`, `/404` render with new tokens; OCR canvas in `index.tsx` demo state shows blue boxes; focus ring visible on Tab |

Manual visual checks (recorded in the implementation plan as a checklist, not asserted in CI):
- All four pages render with the new palette: light surface, dark text, no green/magenta anywhere.
- A button hover transitions through gray-100 → gray-200 → gray-300 sequence (currently relies on shadcn's `hover:bg-primary/90` — confirm in DOM that this resolves to a slightly lighter dark, not a green tint).
- OCR canvas on a high-contrast photo: blue-700 box reads clearly at 2px and 3px widths.
- `prefers-reduced-motion: reduce` removes the `scan-beam-once` animation.
- Mobile (≤ 601px) and desktop (≥ 961px) layouts still work — breakpoints are inherited from Tailwind v4 defaults, which match Geist's `sm 401 / md 601 / lg 961 / xl 1200 / 2xl 1400`.

## Out-of-Scope Follow-ups (tracked separately, not in this spec)

1. **Geist Dark theme** — read `vercel.com/design.dark.md`, derive the same semantic-token shape with dark values, re-introduce the `.dark` selector in `app.css`, restore the `theme-toggle.tsx` click behavior. The token names in Layer 1 already match across light and dark; only the values change.
2. **P3 wide-gamut activation** — beyond declaring the `*-p3` variables, opt into oklch via a `color(display-p3 ...)` layer for users on P3 displays. The current spec just makes the values available; runtime activation is a separate visual perf/quality decision.
3. **Component-level typography tokens** — wire `text-heading-72` … `text-copy-13` as custom utilities if the design later needs tighter typographic control. Tailwind's default scale is sufficient for the current surface area, so this is deferred.
4. **Dotted-grid alternative** — if the team later wants a non-flat background for character, decide between a very subtle 1px grid (gray-alpha-200) or a single decorative element. Out of scope for this spec.

## Risks

| Risk | Mitigation |
|---|---|
| OCR canvas blue boxes less distinguishable from idle to active than the prior green/magenta | `lineWidth` jumps from 2 to 3 and `globalAlpha` from 0.7 to 1.0; if real-world testing shows confusion, the follow-up dark-theme spec can revisit the lock color. |
| Google Fonts CDN outage | Geist falls back to `system-ui` and the mono fallback chain. No build-time dependency on the CDN. |
| Existing user has the app in dark mode (`.dark` on `<html>`) from a previous session | `.dark` is no longer styled; the app reverts to light automatically because the (now-removed) `.dark` rules previously set the dark values, and the base styles define light. No flicker, no broken state. |
| `theme-toggle.tsx` removed from header — perceived regression | Component still exported; i18n keys intact; one-click re-activation when dark theme ships. |
| `scan="idle"` on `detection-frame` becomes a no-op | Documented in the component comment. If a future spec adds a different idle cue, the prop continues to be the hook. |

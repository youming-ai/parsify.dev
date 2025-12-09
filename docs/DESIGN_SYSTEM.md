# Parsify.dev Design System

## Theme Overview

Parsify.dev uses a dual-theme design system inspired by [Cursor](https://cursor.com), featuring:

- **Light Mode**: Warm, creamy aesthetic with excellent readability
- **Dark Mode**: Modern Zinc palette for comfortable low-light viewing

---

## Color Palette

### Light Mode — "Warm Cream"

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--background` | `60 14% 96%` | `#F7F7F4` | Page background |
| `--foreground` | `52 11% 13%` | `#26251E` | Primary text |
| `--card` | `0 0% 100%` | `#FFFFFF` | Card backgrounds |
| `--card-foreground` | `52 11% 13%` | `#26251E` | Card text |
| `--primary` | `52 11% 13%` | `#26251E` | Primary actions, buttons |
| `--primary-foreground` | `60 14% 96%` | `#F7F7F4` | Text on primary |
| `--secondary` | `70 11% 93%` | `#EEEEEA` | Secondary surfaces |
| `--muted` | `70 11% 93%` | `#EEEEEA` | Muted backgrounds |
| `--muted-foreground` | `50 3% 44%` | `#73736C` | Secondary text |
| `--border` | `70 6% 88%` | `#E2E2DE` | Borders, dividers |
| `--destructive` | `0 84.2% 60.2%` | `#EF4444` | Error states |

### Dark Mode — "Modern Zinc"

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--background` | `240 10% 3.9%` | `#09090B` | Page background |
| `--foreground` | `0 0% 98%` | `#FAFAFA` | Primary text |
| `--card` | `240 10% 3.9%` | `#09090B` | Card backgrounds |
| `--card-foreground` | `0 0% 98%` | `#FAFAFA` | Card text |
| `--primary` | `0 0% 98%` | `#FAFAFA` | Primary actions |
| `--primary-foreground` | `240 5.9% 10%` | `#18181B` | Text on primary |
| `--secondary` | `240 3.7% 15.9%` | `#27272A` | Secondary surfaces |
| `--muted` | `240 3.7% 15.9%` | `#27272A` | Muted backgrounds |
| `--muted-foreground` | `240 5% 64.9%` | `#A1A1AA` | Secondary text |
| `--border` | `240 3.7% 15.9%` | `#27272A` | Borders, dividers |
| `--destructive` | `0 62.8% 30.6%` | `#7F1D1D` | Error states |

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'PaperMono', monospace;
```

### Font Usage

| Context | Font | Example |
|---------|------|---------|
| Body text | Inter | Descriptions, paragraphs |
| Headings | Inter (bold) | Page titles, section headers |
| Code | PaperMono | Inline code, code blocks |
| Logo | Inter (bold) | "Parsify" in header |

---

## Spacing & Layout

### Border Radius

```css
--radius: 0.75rem;  /* 12px - Base radius */
```

| Component | Radius | Tailwind Class |
|-----------|--------|----------------|
| Buttons | `0.75rem` | `rounded-xl` |
| Cards | `0.75rem` | `rounded-xl` |
| Inputs | `0.75rem` | `rounded-xl` |
| Small buttons | `0.5rem` | `rounded-lg` |
| Pill badges | `9999px` | `rounded-full` |

### Container

```css
max-width: 1400px;
padding: 2rem;
```

---

## Components

### Button Variants

| Variant | Light Mode | Dark Mode |
|---------|------------|-----------|
| `default` | Dark text on cream bg | Light text on dark bg |
| `outline` | Border with transparent bg | Border with transparent bg |
| `ghost` | Transparent, hover highlight | Transparent, hover highlight |
| `secondary` | Muted bg color | Muted bg color |
| `destructive` | Red bg with white text | Deep red bg with white text |

#### Button Interactions

```css
/* Scale on click */
active:scale-[0.98]

/* Shadow on hover */
hover:shadow-md

/* Smooth transition */
transition-all duration-200
```

### Card

- Background: `--card`
- Border: `1px solid var(--border)`
- Shadow: `shadow-sm`
- Border radius: `rounded-xl`
- Hover state: Scale up, increased shadow

### Header

- Position: Fixed, floating
- Style: Pill-shaped, glassmorphism
- Background: `bg-background/70 backdrop-blur-xl`
- Border radius: `rounded-full`

---

## Animation Guidelines

### Transitions

| Type | Duration | Easing |
|------|----------|--------|
| Color changes | `200ms` | `ease` |
| Transforms | `300ms` | `ease-out` |
| Page animations | `700ms` | `ease-out` |

### Hover Effects

```css
/* Cards */
hover:-translate-y-1
hover:shadow-lg
hover:border-primary/50

/* Icons */
hover:scale-110
transition-all duration-200

/* Buttons */
active:scale-[0.98]
```

---

## Dark Mode Implementation

Theme switching is handled by `next-themes`:

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

CSS variables automatically switch based on `.dark` class on `<html>`.

---

## File Locations

| File | Purpose |
|------|---------|
| `src/app/globals.css` | CSS variables, base styles |
| `tailwind.config.ts` | Tailwind theme configuration |
| `src/components/ui/button.tsx` | Button component & variants |
| `src/components/ui/card.tsx` | Card component |
| `src/components/layout/header.tsx` | Floating header |
| `src/components/layout/theme-toggle.tsx` | Theme switcher |

---

## Design Principles

1. **Warmth over coldness** — Light mode uses warm creams instead of stark whites
2. **High contrast** — Clear distinction between text and backgrounds
3. **Generous rounding** — Large border-radius for friendly, modern feel
4. **Subtle animations** — Micro-interactions that don't distract
5. **Glassmorphism** — Translucent surfaces with backdrop blur
6. **Typography-first** — Clean, readable fonts with proper hierarchy

---

## Usage Examples

### Using Theme Colors in Tailwind

```tsx
// Background colors
<div className="bg-background" />
<div className="bg-card" />
<div className="bg-muted" />

// Text colors
<p className="text-foreground" />
<p className="text-muted-foreground" />
<p className="text-primary" />

// Border colors
<div className="border-border" />
<div className="border-primary/20" />
```

### Creating Themed Components

```tsx
// A themed badge
<Badge className="bg-primary/10 text-primary border-primary/20">
  New Feature
</Badge>

// A themed icon container
<div className="rounded-lg bg-primary/10 p-2 text-primary">
  <Icon className="h-5 w-5" />
</div>
```

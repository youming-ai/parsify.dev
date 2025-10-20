# Styling and Theming Guide

This guide covers the styling and theming approach used in the Parsify.dev component library. The components are built with Tailwind CSS and support comprehensive theming capabilities.

## Table of Contents

- [Overview](#overview)
- [Tailwind CSS Configuration](#tailwind-css-configuration)
- [Design System](#design-system)
  - [Color Palette](#color-palette)
  - [Typography](#typography)
  - [Spacing](#spacing)
  - [Shadows and Effects](#shadows-and-effects)
- [Component Styling Patterns](#component-styling-patterns)
- [Theme System](#theme-system)
  - [Light Theme](#light-theme)
  - [Dark Theme](#dark-theme)
  - [Custom Themes](#custom-themes)
- [Responsive Design](#responsive-design)
- [Animation and Transitions](#animation-and-transitions)
- [Custom CSS](#custom-css)
- [Component Variants](#component-variants)
- [Best Practices](#best-practices)

## Overview

The Parsify.dev component library uses a modern styling approach based on:

- **Tailwind CSS**: Utility-first CSS framework
- **CSS Custom Properties**: Dynamic theming support
- **Class Variance Authority (CVA)**: Component variant management
- **Responsive Design**: Mobile-first approach
- **Accessibility**: High contrast and screen reader support

## Tailwind CSS Configuration

### Base Configuration

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### CSS Custom Properties

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Design System

### Color Palette

The design system uses a semantic color approach with HSL values for easy theme manipulation.

#### Primary Colors

```css
:root {
  --primary: 222.2 47.4% 11.2%;      /* Dark blue */
  --primary-foreground: 210 40% 98%; /* White */
}
```

#### Semantic Colors

```css
:root {
  --background: 0 0% 100%;           /* White */
  --foreground: 222.2 84% 4.9%;     /* Dark gray */
  --muted: 210 40% 96%;              /* Light gray */
  --muted-foreground: 215.4 16.3% 46.9%; /* Medium gray */
  --border: 214.3 31.8% 91.4%;      /* Light border */
  --input: 214.3 31.8% 91.4%;       /* Input border */
}
```

#### Status Colors

```css
:root {
  --destructive: 0 84.2% 60.2%;     /* Red */
  --destructive-foreground: 210 40% 98%; /* White */
}

/* Additional status colors (used in components) */
--success: 142.1 76.2% 36.3%;       /* Green */
--warning: 47.9 95.8% 53.1%;       /* Yellow */
--info: 221.2 83.2% 53.3%;         /* Blue */
```

### Typography

The typography system uses Tailwind's default font stack with custom sizes for better readability.

```js
// tailwind.config.js extend
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
  }
}
```

### Spacing

Spacing follows Tailwind's default system with a consistent scale:

```css
/* Tailwind spacing scale */
spacing: {
  '0': '0px',
  '1': '0.25rem',   /* 4px */
  '2': '0.5rem',    /* 8px */
  '3': '0.75rem',   /* 12px */
  '4': '1rem',      /* 16px */
  '5': '1.25rem',   /* 20px */
  '6': '1.5rem',    /* 24px */
  '8': '2rem',      /* 32px */
  '10': '2.5rem',   /* 40px */
  '12': '3rem',     /* 48px */
  '16': '4rem',     /* 64px */
  '20': '5rem',     /* 80px */
  '24': '6rem',     /* 96px */
}
```

### Shadows and Effects

```js
// tailwind.config.js extend
theme: {
  extend: {
    boxShadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },
  }
}
```

## Component Styling Patterns

### 1. Base Component Structure

```tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

### 2. Styling Patterns

#### Consistent Border Radius

```tsx
// Use the radius CSS variable
className="rounded-lg border"
className="rounded-md border"
className="rounded-sm border"
```

#### Focus Styles

```tsx
// Consistent focus ring
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

#### Disabled States

```tsx
// Consistent disabled styling
className="disabled:pointer-events-none disabled:opacity-50"
```

#### Hover States

```tsx
// Semantic hover states
className="hover:bg-accent hover:text-accent-foreground"
className="hover:bg-primary/90"
className="hover:bg-destructive/90"
```

## Theme System

### Light Theme

The light theme provides high contrast and readability:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96%;
  --muted: 210 40% 96%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
}
```

### Dark Theme

The dark theme reduces eye strain in low-light environments:

```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;
  --muted: 217.2 32.6% 17.5%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
}
```

### Custom Themes

You can create custom themes by overriding CSS custom properties:

```css
/* Blue theme */
.theme-blue {
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
}

/* Green theme */
.theme-green {
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 210 40% 98%;
}

/* High contrast theme */
.theme-high-contrast {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 0%;
  --primary: 0 0% 0%;
  --primary-foreground: 0 0% 100%;
  --border: 0 0% 0%;
  --input: 0 0% 0%;
}
```

### Theme Implementation

```tsx
// components/theme-provider.tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// components/theme-toggle.tsx
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

## Responsive Design

### Mobile-First Approach

```tsx
// Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Responsive typography
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">Content</div>
```

### Breakpoint System

```js
// Tailwind default breakpoints
screens: {
  sm: '640px',   // Small screens
  md: '768px',   // Medium screens
  lg: '1024px',  // Large screens
  xl: '1280px',  // Extra large screens
  '2xl': '1536px' // 2X large screens
}
```

### Responsive Patterns

#### Navigation

```tsx
// Mobile: Hamburger menu, Desktop: Full navigation
<div className="md:hidden">
  <MobileNavigation />
</div>
<div className="hidden md:block">
  <DesktopNavigation />
</div>
```

#### Layout

```tsx
// Responsive layout
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-64">
    <Sidebar />
  </aside>
  <main className="flex-1">
    <Content />
  </main>
</div>
```

#### Cards

```tsx
// Responsive card grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>
```

## Animation and Transitions

### Transition Utilities

```tsx
// Smooth transitions
<button className="transition-colors duration-200 hover:bg-primary/90">
  Button
</button>

// Transform transitions
<div className="transition-transform duration-200 hover:scale-105">
  Content
</div>

// Fade animations
<div className="transition-opacity duration-300 opacity-0 hover:opacity-100">
  Content
</div>
```

### Custom Animations

```js
// tailwind.config.js
theme: {
  extend: {
    keyframes: {
      'fade-in': {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      'slide-up': {
        '0%': { transform: 'translateY(10px)' },
        '100%': { transform: 'translateY(0)' },
      },
      'pulse-slow': {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '.5' },
      },
    },
    animation: {
      'fade-in': 'fade-in 0.5s ease-out',
      'slide-up': 'slide-up 0.3s ease-out',
      'pulse-slow': 'pulse-slow 3s infinite',
    },
  }
}
```

### Loading States

```tsx
// Spinner animation
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>

// Pulse loading
<div className="animate-pulse bg-muted h-4 w-32 rounded"></div>

// Skeleton loading
<div className="space-y-3">
  <div className="animate-pulse">
    <div className="h-4 bg-muted rounded w-3/4"></div>
    <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
  </div>
</div>
```

## Custom CSS

### Component-Specific Styles

```css
/* components/button.css */
@layer components {
  .button-glow {
    @apply relative overflow-hidden;
  }
  
  .button-glow::before {
    @apply absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent;
    content: '';
    transform: translateX(-100%);
    transition: transform 0.6s;
  }
  
  .button-glow:hover::before {
    transform: translateX(100%);
  }
}
```

### Utility Classes

```css
/* utilities.css */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .glass {
    @apply backdrop-blur-sm bg-white/10 dark:bg-black/10;
  }
}
```

## Component Variants

### Using Class Variance Authority (CVA)

```tsx
import { cva } from 'class-variance-authority'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        warning: 'border-yellow-200/50 text-yellow-900 bg-yellow-50 [&>svg]:text-yellow-600',
        success: 'border-green-200/50 text-green-900 bg-green-50 [&>svg]:text-green-600',
        info: 'border-blue-200/50 text-blue-900 bg-blue-50 [&>svg]:text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)
```

### Compound Variants

```tsx
const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'border-0 shadow-lg',
        outlined: 'border-2',
      },
      size: {
        sm: 'p-3',
        default: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer transition-shadow hover:shadow-md',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'elevated',
        interactive: true,
        className: 'hover:shadow-xl',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: false,
    },
  }
)
```

## Best Practices

### 1. Consistency

- Use semantic color names from the design system
- Follow the established spacing scale
- Maintain consistent border radius using CSS variables
- Use standard hover and focus states

### 2. Performance

- Prefer utility classes over custom CSS
- Use `@layer` directives for optimal CSS ordering
- Avoid excessive use of `!important`
- Minimize custom animations

### 3. Accessibility

- Ensure sufficient color contrast (WCAG AA standards)
- Provide focus indicators for interactive elements
- Support reduced motion preferences
- Test with screen readers

### 4. Responsive Design

- Follow mobile-first approach
- Test on all breakpoint sizes
- Consider touch interactions on mobile
- Use responsive typography and spacing

### 5. Theme Support

- Use CSS custom properties for dynamic theming
- Test components in both light and dark themes
- Provide high contrast variants
- Consider color blindness accessibility

### 6. Component Architecture

- Use CVA for component variants
- Separate component logic from styling
- Provide comprehensive prop interfaces
- Document styling options

### Example: Well-Styled Component

```tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'border-0 shadow-lg hover:shadow-xl',
        outlined: 'border-2',
        ghost: 'border-transparent bg-transparent shadow-none',
      },
      size: {
        sm: 'p-3',
        default: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'elevated',
        interactive: true,
        className: 'hover:shadow-xl',
      },
      {
        variant: 'ghost',
        interactive: true,
        className: 'hover:bg-accent hover:text-accent-foreground',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size, interactive, className }))}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

export { Card, cardVariants }
```

### Usage Examples

```tsx
// Basic card
<Card>
  <CardContent>Card content</CardContent>
</Card>

// Elevated interactive card
<Card variant="elevated" interactive onClick={handleClick}>
  <CardContent>Interactive card</CardContent>
</Card>

// Small outlined card
<Card variant="outlined" size="sm">
  <CardContent>Small card</CardContent>
</Card>

// Ghost card for hover effects
<Card variant="ghost" interactive>
  <CardContent>Ghost card</CardContent>
</Card>
```
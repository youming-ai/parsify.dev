# Layout Components

This section covers the layout components used in the Parsify.dev application. These components provide the structural foundation for the application, including navigation, theming, and responsive design.

## Main Layout

The primary layout wrapper that combines header, sidebar, and footer components.

### Props

```tsx
interface MainLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}
```

### Usage Examples

```tsx
import { MainLayout } from '@/components/layout/main-layout'

// Layout without sidebar (default)
<MainLayout>
  <div className="container mx-auto py-6">
    <h1>Page Content</h1>
    <p>Your page content goes here</p>
  </div>
</MainLayout>

// Layout with sidebar
<MainLayout showSidebar={true}>
  <div className="container mx-auto py-6">
    <h1>Dashboard</h1>
    <p>Dashboard content with sidebar navigation</p>
  </div>
</MainLayout>
```

### Features

- **Responsive Design**: Adapts sidebar visibility based on screen size
- **Semantic HTML**: Uses proper HTML5 semantic elements
- **Accessibility**: Proper ARIA labels and navigation structure
- **Theme Support**: Integrates with the theme system
- **Flexible Layout**: Optional sidebar inclusion

### Structure

```
MainLayout
├── Header (always visible)
├── Content Area
│   ├── Sidebar (optional, desktop only)
│   └── Main Content
└── Footer
```

## Header

The main application header with navigation, user menu, and mobile responsiveness.

### Features

- **Responsive Navigation**: Desktop navigation with dropdown menus, mobile sheet navigation
- **Tool Navigation**: Organized tool categories with descriptions
- **User Authentication**: Integration with authentication system
- **Theme Toggle**: Dark/light mode switching
- **Mobile Optimized**: Hamburger menu for mobile devices

### Navigation Structure

```tsx
const tools = [
  {
    title: 'JSON Tools',
    href: '/tools/json',
    icon: FileJson,
    description: 'Format, validate, and convert JSON data',
  },
  {
    title: 'Code Tools',
    href: '/tools/code',
    icon: Code,
    description: 'Format and execute code securely',
  },
  {
    title: 'All Tools',
    href: '/tools',
    icon: Wrench,
    description: 'Browse all available tools',
  },
]
```

### Usage Examples

The Header component is typically used within the MainLayout and doesn't require direct usage in most cases. However, it can be used standalone for custom layouts:

```tsx
import { Header } from '@/components/layout/header'

function CustomLayout() {
  return (
    <div>
      <Header />
      <main>
        {/* Custom content */}
      </main>
    </div>
  )
}
```

### User Menu Integration

The header integrates with the authentication system to show different menus based on authentication state:

**Authenticated User Menu:**
- Dashboard link
- Profile management
- Settings
- Sign out

**Unauthenticated User Menu:**
- Sign in
- Sign up

### Mobile Navigation

Mobile navigation uses a sheet component with:
- Full-height slide-out menu
- Tool categories with descriptions
- Authentication links
- Proper focus management

## Sidebar

A collapsible sidebar navigation for organizing tools and categories.

### Features

- **Collapsible Categories**: Expandable tool categories
- **Active State Highlighting**: Visual indication of current page
- **Quick Access**: Recent tools and favorites shortcuts
- **Scrollable Content**: Handles long lists of tools
- **Pro Features Banner**: Upgrade promotion section

### Categories Structure

```tsx
const toolCategories = [
  {
    title: 'JSON Tools',
    icon: FileJson,
    items: [
      { name: 'JSON Formatter', href: '/tools/json/format', description: 'Format and prettify JSON data' },
      { name: 'JSON Validator', href: '/tools/json/validate', description: 'Validate JSON syntax' },
      // ... more tools
    ]
  },
  {
    title: 'Code Tools',
    icon: Code,
    items: [
      { name: 'Code Formatter', href: '/tools/code/format', description: 'Format code in multiple languages' },
      // ... more tools
    ]
  },
  // ... more categories
]
```

### Usage Examples

The Sidebar is typically used within the MainLayout when `showSidebar={true}`:

```tsx
import { Sidebar } from '@/components/layout/sidebar'

function DashboardLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        {/* Dashboard content */}
      </main>
    </div>
  )
}
```

### State Management

The sidebar manages its own state for:
- Expanded/collapsed categories
- Active route highlighting
- Responsive visibility

### Customization

You can customize the sidebar by:
- Modifying the `toolCategories` array
- Adding new quick actions
- Customizing the pro features banner
- Adjusting styling through Tailwind classes

## Footer

The application footer with navigation links, social media, and legal information.

### Features

- **Multi-column Layout**: Organized links in categories
- **Social Media Links**: Links to GitHub, Twitter, and email
- **Responsive Design**: Adapts to different screen sizes
- **Branding**: Company logo and description
- **Legal Information**: Privacy policy and terms links

### Navigation Structure

```tsx
const navigation = {
  tools: [
    { name: 'JSON Tools', href: '/tools/json' },
    { name: 'Code Tools', href: '/tools/code' },
    { name: 'All Tools', href: '/tools' },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'API Reference', href: '/docs/api' },
    { name: 'Examples', href: '/docs/examples' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
}
```

### Usage Examples

The Footer is typically included in the MainLayout but can be used standalone:

```tsx
import { Footer } from '@/components/layout/footer'

function CustomPage() {
  return (
    <div>
      <main>
        {/* Page content */}
      </main>
      <Footer />
    </div>
  )
}
```

### Social Links Configuration

```tsx
const socialLinks = [
  { 
    name: 'GitHub', 
    href: 'https://github.com/your-repo/parsify-dev', 
    icon: Github 
  },
  { 
    name: 'Twitter', 
    href: 'https://twitter.com/parsifydev', 
    icon: Twitter 
  },
  { 
    name: 'Email', 
    href: 'mailto:contact@parsify.dev', 
    icon: Mail 
  },
]
```

## Theme Toggle

A button component for switching between light and dark themes.

### Features

- **Icon Animation**: Smooth transition between sun and moon icons
- **System Preference**: Respects user's system theme preference
- **Persistent Setting**: Saves theme preference in localStorage
- **Accessibility**: Proper ARIA labels for screen readers

### Usage Examples

```tsx
import { ThemeToggle } from '@/components/layout/theme-toggle'

// Basic usage
<ThemeToggle />

// With custom styling
<ThemeToggle className="custom-class" />
```

### Implementation Details

The component uses `next-themes` for theme management:

```tsx
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

### Theme Configuration

The theme system requires configuration in your Next.js app:

```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
```

## Layout Index

All layout components are exported from a central index file for easy importing:

```tsx
// components/layout/index.ts
export { MainLayout } from './main-layout'
export { Header } from './header'
export { Sidebar } from './sidebar'
export { Footer } from './footer'
export { ThemeToggle } from './theme-toggle'
```

### Usage

```tsx
import { MainLayout, Header, Sidebar, Footer, ThemeToggle } from '@/components/layout'
```

## Responsive Design Patterns

### Mobile-First Approach

All layout components follow mobile-first design principles:

```css
/* Base styles (mobile) */
.component {
  /* Mobile styles */
}

/* Tablet styles */
@media (min-width: 768px) {
  .component {
    /* Tablet overrides */
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .component {
    /* Desktop overrides */
  }
}
```

### Breakpoints Used

- **Mobile**: Default styles (up to 767px)
- **Tablet**: `md:` prefix (768px and up)
- **Desktop**: `lg:` prefix (1024px and up)
- **Large Desktop**: `xl:` prefix (1280px and up)

### Responsive Navigation

- **Mobile**: Hamburger menu with sheet navigation
- **Tablet**: Compact navigation with dropdowns
- **Desktop**: Full navigation with sidebar option

## Best Practices

### 1. Semantic HTML
- Use proper HTML5 semantic elements
- Maintain logical heading hierarchy
- Include proper ARIA labels

### 2. Accessibility
- Ensure keyboard navigation works
- Provide screen reader support
- Maintain focus management
- Use proper color contrast

### 3. Performance
- Optimize images and icons
- Use lazy loading where appropriate
- Minimize layout shifts
- Implement proper caching

### 4. Responsive Design
- Test on all device sizes
- Use flexible grid systems
- Implement proper breakpoints
- Consider touch interactions

### 5. SEO Considerations
- Use proper heading structure
- Include meta descriptions
- Implement proper URL structure
- Ensure content is crawlable

## Custom Layout Examples

### Minimal Layout

```tsx
import { Header, Footer } from '@/components/layout'

function MinimalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
```

### Dashboard Layout

```tsx
import { MainLayout } from '@/components/layout'

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout showSidebar={true}>
      <div className="container mx-auto py-6">
        {children}
      </div>
    </MainLayout>
  )
}
```

### Tool Layout

```tsx
import { MainLayout } from '@/components/layout'

function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout showSidebar={false}>
      <div className="container mx-auto py-6 max-w-6xl">
        {children}
      </div>
    </MainLayout>
  )
}
```

## Integration with Next.js App Router

### Layout Structure

```tsx
// app/layout.tsx
import { MainLayout } from '@/components/layout/main-layout'
import { Providers } from '@/app/providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  )
}
```

### Route-Specific Layouts

```tsx
// app/(dashboard)/layout.tsx
import { DashboardLayout } from '@/components/layouts/dashboard-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
```

```tsx
// app/(tools)/layout.tsx
import { ToolLayout } from '@/components/layouts/tool-layout'

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ToolLayout>{children}</ToolLayout>
}
```
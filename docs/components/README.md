# Component Library Documentation

This documentation covers all the React components available in the Parsify.dev application. The component library is built with React, TypeScript, and Tailwind CSS.

## Overview

The component library is organized into several categories:

- **UI Components**: Basic UI elements like buttons, inputs, cards, and more
- **Tool Components**: Specialized components for JSON and code tools
- **Authentication Components**: Login, signup, and user profile components
- **File Upload Components**: Drag-and-drop file upload with progress tracking
- **Layout Components**: Application layout structure
- **Analytics Components**: Performance monitoring and analytics display

## Getting Started

### Installation

All components are available in the `@parsify/web` package and can be imported from the `components` directory:

```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
```

### Dependencies

The component library depends on:

- **React 18.2.0+**: Component framework
- **TypeScript 5.0.0+**: Type safety
- **Tailwind CSS 3.3.0+**: Styling
- **Class Variance Authority (CVA) 0.7.0+**: Component variants
- **Lucide React 0.294.0+**: Icons
- **Monaco Editor 0.44.0+**: Code editing (for tool components)

## Design Principles

### 1. Accessibility First
All components follow WCAG 2.1 AA guidelines with proper ARIA labels, keyboard navigation, and semantic HTML.

### 2. Composition over Configuration
Components are designed to be composable with clear props and minimal configuration.

### 3. Type Safety
Full TypeScript support with comprehensive prop types and generic support where needed.

### 4. Performance Optimized
Components use React.memo, useMemo, and useCallback where appropriate to minimize re-renders.

### 5. Responsive Design
All components are mobile-first and responsive using Tailwind's responsive utilities.

## Usage Patterns

### Basic Usage

```tsx
import { Button, Card, Input } from '@/components/ui'

function Example() {
  return (
    <Card className="p-6">
      <Input placeholder="Enter your name" />
      <Button className="mt-4">Submit</Button>
    </Card>
  )
}
```

### Composition

```tsx
import { Card, CardHeader, CardContent, Button } from '@/components/ui'

function ExampleCard() {
  return (
    <Card>
      <CardHeader>
        <h2>Card Title</h2>
      </CardHeader>
      <CardContent>
        <p>Card content goes here</p>
        <Button>Action</Button>
      </CardContent>
    </Card>
  )
}
```

### Advanced Usage with Variants

```tsx
import { Button, buttonVariants } from '@/components/ui/button'

function Example() {
  return (
    <div className="flex gap-2">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  )
}
```

## Theming

The component library uses Tailwind CSS for theming. You can customize the theme by modifying the `tailwind.config.js` file:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    }
  }
}
```

## Testing

Components are tested with Vitest and React Testing Library. See the [Testing Guidelines](./guides/testing.md) for more information.

## Contributing

When adding new components:

1. Follow the existing file structure and naming conventions
2. Use TypeScript with proper prop interfaces
3. Add comprehensive JSDoc comments
4. Include accessibility attributes
5. Write tests for new components
6. Update this documentation

## Support

For questions or issues with components:
- Check the component-specific documentation
- Review the examples in each section
- Look at existing component implementations
- Create an issue in the project repository
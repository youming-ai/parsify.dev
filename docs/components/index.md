# Component Library Documentation

Welcome to the comprehensive documentation for the Parsify.dev component library. This library provides a complete set of React components built with TypeScript, Tailwind CSS, and modern web development best practices.

## Quick Start

### Installation

The component library is part of the Parsify.dev monorepo and requires the following dependencies:

```bash
npm install @tanstack/react-query @tanstack/react-router react react-dom
npm install -D tailwindcss class-variance-authority clsx tailwind-merge
```

### Basic Usage

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

function Example() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Get started with our component library</p>
        <Button className="mt-4">Get Started</Button>
      </CardContent>
    </Card>
  )
}
```

## Documentation Structure

### 📁 [Getting Started](./README.md)
- Overview and philosophy
- Installation and setup
- Basic usage patterns
- Design principles

### 🎨 [UI Components](./ui/README.md)
Basic building blocks for your interface:
- **Button** - Versatile button with variants and sizes
- **Input** - Flexible input component
- **Card** - Container for content grouping
- **Alert** - Message display with severity levels
- **Tabs** - Tabbed interface component
- **Badge** - Status and category indicators
- **Textarea** - Multi-line text input
- **Label** - Form input labels
- **Switch** - Toggle switches
- **Progress** - Progress indicators
- **Spinner** - Loading indicators

### 🛠️ [Tool Components](./tools/README.md)
Specialized components for developer tools:
- **Tool Layout** - Consistent tool page layout
- **JSON Tools** - Validation, formatting, conversion
- **Code Tools** - Editing, execution, formatting

### 🔐 [Authentication Components](./auth/README.md)
Complete authentication system:
- **Auth Context** - Global authentication state
- **Login Form** - OAuth and email/password login
- **User Profile** - User information display
- **User Avatar** - Profile pictures and initials

### 📁 [File Upload Components](./file-upload/README.md)
Comprehensive file upload system:
- **File Upload Component** - Complete upload solution
- **File Drop Zone** - Drag-and-drop interface
- **File Preview** - Content preview
- **File List Manager** - File organization

### 🏗️ [Layout Components](./layout/README.md)
Application structure components:
- **Main Layout** - Page layout wrapper
- **Header** - Application header
- **Sidebar** - Navigation sidebar
- **Footer** - Application footer
- **Theme Toggle** - Dark/light mode switching

### 📚 [API Reference](./API_REFERENCE.md)
Complete API documentation for all components:
- TypeScript interfaces
- Prop documentation
- Usage examples
- Type definitions

### 🎨 [Styling and Theming](./guides/styling-and-theming.md)
Design system and styling approach:
- Tailwind CSS configuration
- Theme system
- Color palette
- Responsive design
- Component variants

### 🧪 [Testing Guidelines](./guides/testing.md)
Testing best practices and examples:
- Test setup and configuration
- Component testing patterns
- Accessibility testing
- Performance testing
- Integration testing

## Component Categories

### UI Components
![UI Components](https://img.shields.io/badge/Category-UI-blue)
The foundation components that form the building blocks of user interfaces.

**Features:**
- Accessibility-first design
- Multiple variants and sizes
- Consistent styling
- TypeScript support
- Responsive design

### Tool Components
![Tool Components](https://img.shields.io/badge/Category-Tools-green)
Specialized components for developer tools and utilities.

**Features:**
- Real-time validation
- Code editing with Monaco
- Progress tracking
- Error handling
- Performance optimized

### Authentication Components
![Authentication](https://img.shields.io/badge/Category-Auth-purple)
Complete authentication system with OAuth and email support.

**Features:**
- Multiple providers (Google, GitHub, Email)
- Secure token management
- User profile management
- Session persistence
- Error handling

### File Upload Components
![File Upload](https://img.shields.io/badge/Category-Upload-orange)
Comprehensive file upload system with drag-and-drop support.

**Features:**
- Drag-and-drop interface
- File validation
- Progress tracking
- Preview functionality
- Multiple file support

### Layout Components
![Layout](https://img.shields.io/badge/Category-Layout-indigo)
Application structure and navigation components.

**Features:**
- Responsive design
- Theme support
- Navigation system
- Mobile optimization
- Accessibility features

## Key Features

### 🎨 Design System
- **Consistent Theming**: Light/dark mode support
- **Color Palette**: Semantic color system
- **Typography**: Optimized font hierarchy
- **Spacing**: Consistent spacing scale
- **Responsive Design**: Mobile-first approach

### ♿ Accessibility
- **WCAG 2.1 AA**: Full accessibility compliance
- **Keyboard Navigation**: Complete keyboard support
- **Screen Reader**: Screen reader compatible
- **ARIA Labels**: Proper ARIA attributes
- **Focus Management**: Logical focus flow

### 🔧 Developer Experience
- **TypeScript**: Full type safety
- **IntelliSense**: Rich IDE support
- **Component Variants**: Flexible styling options
- **Documentation**: Comprehensive API docs
- **Examples**: Real-world usage examples

### ⚡ Performance
- **Optimized Rendering**: Efficient re-rendering
- **Bundle Size**: Tree-shakeable components
- **Lazy Loading**: Code splitting support
- **Caching**: Smart caching strategies
- **SSR Support**: Server-side rendering compatible

## Technology Stack

### Core Technologies
- **React 18.2.0+**: Component framework
- **TypeScript 5.0.0+**: Type safety
- **Tailwind CSS 3.3.0+**: Styling framework
- **Next.js 14.0.0+**: React framework

### Key Libraries
- **Class Variance Authority**: Component variants
- **Lucide React**: Icon library
- **React Hook Form**: Form management
- **React Query**: Data fetching
- **Monaco Editor**: Code editing

### Development Tools
- **Vitest**: Testing framework
- **React Testing Library**: Component testing
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Storybook**: Component development

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Supported |
| Firefox | 88+ | ✅ Supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |

## Contributing

We welcome contributions to the component library! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/parsify.dev.git
cd parsify.dev

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build documentation
pnpm build:docs
```

### Component Development

1. **Create Component**: Add new component in appropriate category
2. **Add Tests**: Write comprehensive tests
3. **Update Documentation**: Document props and usage
4. **TypeScript**: Ensure proper type definitions
5. **Accessibility**: Test with screen readers
6. **Performance**: Optimize for performance

## Support

- **Documentation**: Browse the documentation sections
- **Examples**: Check the examples directory
- **Issues**: Report issues on GitHub
- **Discussions**: Join our community discussions
- **Email**: Contact us at support@parsify.dev

## Roadmap

### Upcoming Features
- [ ] **Component Library Site**: Dedicated component documentation site
- [ ] **Design Tokens**: Extended design system tokens
- [ ] **Animation Library**: Pre-built animations
- [ ] **Advanced Forms**: Complex form components
- [ ] **Data Visualization**: Charts and graphs
- [ ] **Mobile Components**: Mobile-specific components

### Improvements
- [ ] **Bundle Size Optimization**: Further reduce bundle size
- [ ] **Performance Monitoring**: Built-in performance tracking
- [ ] **Enhanced Testing**: More comprehensive test coverage
- [ ] **Documentation**: Interactive examples and playground
- [ ] **Accessibility**: Enhanced accessibility features

## License

This component library is licensed under the MIT License. See the [LICENSE](../../LICENSE) file for details.

---

**Built with ❤️ by the Parsify.dev team**

For more information, visit [parsify.dev](https://parsify.dev) or check out our [GitHub repository](https://github.com/your-org/parsify.dev).
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Parsify.dev is a modern online developer tools platform built with Next.js 16, TypeScript, and Tailwind CSS. It provides various developer tools focused on JSON processing, code execution, file processing, data validation, and utilities - all designed to run client-side for privacy and performance.

## Common Development Commands

### Development
```bash
# Start development server (http://localhost:3000)
pnpm dev

# Type checking
pnpm type-check

# Clean all artifacts
pnpm clean
```

### Code Quality
```bash
# Lint and check code style
pnpm lint

# Auto-fix linting issues
pnpm format
```

### Testing
```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

### Building & Deployment
```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 16 with App Router and React Compiler enabled
- **Language**: TypeScript 5.7+ with strict mode
- **Styling**: Tailwind CSS with shadcn/ui components
- **Code Editor**: Monaco Editor (VS Code editor) - lazy loaded
- **State Management**: Zustand for client-side state
- **Testing**: Vitest (unit), Playwright (E2E)
- **Package Manager**: pnpm v10.18.3
- **Code Quality**: Biome for linting and formatting

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── tools/[slug]/       # Dynamic tool routing
│   ├── tools/json/         # JSON processing tools
│   ├── tools/code/         # Code execution tools
│   ├── tools/file/         # File processing tools
│   ├── tools/data/         # Data validation tools
│   └── tools/utilities/    # General utilities
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── tools/             # Tool-specific components
│   └── layout/            # Layout components
├── types/tools.ts          # Tool-related TypeScript interfaces
└── data/tools-data.ts      # Centralized tool catalog
```

### Tool System Architecture

The platform uses a **component-based tool system** with:

1. **Dynamic Routing**: Tools use Next.js `[slug]` pattern in `/app/tools/[slug]/page.tsx`
2. **Centralized Metadata**: All tools defined in `src/data/tools-data.ts` with categories, features, and metadata
3. **Type Safety**: Strong TypeScript interfaces in `src/types/tools.ts`
4. **Client-Side Processing**: Most tools run entirely in the browser for privacy
5. **Component Organization**: Tools organized by category in separate directories

### Key Tool Categories
- **JSON Processing**: JSON formatting, validation, conversion, JSONPath queries
- **Code Execution**: Multi-language code execution, formatting, regex testing
- **File Processing**: File conversion, text processing, CSV processing
- **Data Validation**: Hash generation, data validation
- **Utilities**: URL encoding, Base64 conversion

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Formatting**: Uses Biome with tab indentation, 120 character line width
- **Import Organization**: Automatic import sorting enabled
- **Component Pattern**: Follow existing tool component structure with proper prop interfaces

### Tool Development
- **Metadata First**: Add new tools to `src/data/tools-data.ts` before implementation
- **Client-Side Priority**: Design tools to run in the browser when possible
- **Security**: Use `security: 'local-only'` for client-side tools, `secure-sandbox` for code execution
- **Performance**: Lazy load heavy components like Monaco Editor
- **Error Handling**: Implement proper error boundaries and user feedback

### File Organization Patterns
- Tool components: `src/components/tools/{category}/{tool-name}.tsx`
- Tool pages: `src/app/tools/{category}/{tool-slug}/page.tsx`
- Shared components: `src/components/ui/` for shadcn/ui components
- Types: Add new tool-related interfaces to `src/types/tools.ts`

## Configuration Files

### Key Configuration
- `biome.json`: Code formatting and linting rules (tab indentation, 120 char width)
- `next.config.js`: Next.js config with React Compiler enabled
- `tsconfig.json`: TypeScript strict mode with path aliases (`@/*`)
- `tailwind.config.ts`: Custom color scheme and dark mode support

### Environment Setup
- Copy `.env.example` to `.env.local` for local development
- Node.js >= 20 and pnpm >= 9 required
- Environment variables for API endpoints and feature flags

## Performance Considerations

### Bundle Optimization
- Monaco Editor is lazy-loaded to reduce initial bundle size
- Component splitting by route for optimal loading
- Tree shaking enabled for unused code elimination

### Client-Side Processing
- Most tools designed to run entirely in the browser
- No server-side dependencies for core functionality
- Local storage for user preferences and temporary data

## Testing Strategy

### Unit Tests
- Use Vitest for utility functions and business logic
- Focus on tool-specific data processing functions
- Test TypeScript types and interfaces

### E2E Tests
- Use Playwright for full user workflow testing
- Test tool functionality from user perspective
- Validate error handling and edge cases

## Deployment Notes

### Platform
- Designed for Cloudflare Pages deployment
- Static site generation with `.open-next` output directory
- Edge runtime compatibility for global performance

### Build Process
- Standard Next.js build process
- No server-side functions required for core tools
- Static asset optimization for CDN distribution

## Recent Changes
- 001-developer-tools-expansion: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Manager & Scripts
This project uses **pnpm** as the package manager (required version >= 9).

```bash
# Development
pnpm dev                    # Start development server at http://localhost:3000
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm preview                # Build and preview production locally

# Code Quality
pnpm lint                   # Run Biome linting checks
pnpm format                 # Format code with Biome
pnpm type-check             # Run TypeScript type checking

# Testing
pnpm test                   # Run Vitest unit tests
pnpm test:coverage          # Run tests with coverage report
pnpm test:e2e               # Run Playwright E2E tests

# Maintenance
pnpm clean                  # Remove node_modules, .next, dist
```

### Environment Setup
```bash
# Copy environment template
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

## Technology Stack

### Core Technologies
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5.7+ (strict mode enabled)
- **UI**: shadcn/ui components with Tailwind CSS
- **Code Editor**: CodeMirror 6 for syntax highlighting and editing
- **State Management**: Zustand for client-side state
- **Package Manager**: pnpm (required, version >= 9)

### Key Dependencies
- **Code Execution**: Pyodide (Python), TeaVM (Java), WASM runtimes for Go/Rust/CPP
- **JSON Processing**: Custom JSON tools with validation and transformation
- **Image Processing**: Canvas API, qr-scanner, browser-native image handling
- **Code Quality**: Biome (linting + formatting), Vitest (testing), Playwright (E2E)
- **Build Tools**: Turbopack (Next.js), webpack optimization for bundle splitting

### WASM Runtimes Architecture
The project supports multiple language execution through WebAssembly:
- **Python**: Pyodide (0.26.4) - 15MB bundle
- **Java**: TeaVM (0.8.0) - 5MB bundle
- **Go**: TinyGo (0.30.0) - 3MB bundle
- **Rust**: Rust WASM (1.75.0) - 2MB bundle
- **TypeScript**: Deno Runtime (2.0.0) - 1MB bundle

Managed by `WASMRuntimeManager` with lazy loading, memory cleanup, and performance optimization.

## Architecture Overview

### Directory Structure
```
src/
├── app/                     # Next.js App Router pages
│   ├── tools/              # Individual tool pages by category
│   │   ├── json/           # JSON processing tools
│   │   ├── code/           # Code execution and formatting
│   │   ├── image/          # Image processing tools
│   │   ├── network/        # Network utilities
│   │   ├── security/       # Security and crypto tools
│   │   ├── text/           # Text processing tools
│   │   └── utilities/      # General utilities
│   └── globals.css
├── components/             # Reusable React components
│   ├── ui/                # shadcn/ui base components
│   ├── layout/            # Layout and navigation components
│   ├── tools/             # Tool-specific components
│   │   ├── json/          # JSON tool components
│   │   ├── code-execution/ # Code execution components
│   │   ├── image/         # Image processing components
│   │   └── batch/         # Batch processing components
│   └── file-upload/       # File handling components
├── lib/                   # Core utilities and runtime managers
│   ├── runtimes/         # WASM runtime implementations
│   ├── registry/         # Tool registration and discovery
│   ├── nlp/             # Natural language processing
│   ├── crypto/          # Cryptographic operations
│   └── utils/           # General utility functions
├── types/                # TypeScript type definitions
├── data/                # Static data and tool configurations
└── hooks/               # Custom React hooks
```

### Tool System Architecture

#### Tool Registry Pattern
All tools follow a standardized registration pattern through the `ToolRegistry` system:

```typescript
// Tool definition in src/data/tools-data.ts
{
  id: 'json-formatter',
  name: 'JSON Formatter',
  category: 'JSON Tools',
  href: '/tools/json/formatter',
  processingType: 'client-side', // 'client-side' | 'hybrid' | 'server-side'
  security: 'local-only',        // 'local-only' | 'network-required' | 'secure-sandbox'
  features: ['Format & Beautify', 'Syntax Validation'],
  tags: ['json', 'formatter', 'validator']
}
```

#### Component Architecture
Tools follow a consistent component structure:
- **Page Component**: Route handler in `src/app/tools/[category]/[tool]/page.tsx`
- **Tool Component**: Main logic in `src/components/tools/[category]/[tool].tsx`
- **Shared Components**: Reusable UI components in `src/components/ui/`
- **Tool Wrapper**: Standardized layout and error handling

#### WASM Execution System
Code execution is managed through a sophisticated WASM runtime system:
- **Lazy Loading**: Runtimes load only when needed
- **Memory Management**: Automatic cleanup of idle runtimes
- **Performance Optimization**: Bundle splitting and caching
- **Security**: Sandboxed execution with timeout and memory limits

### Key Architectural Patterns

#### 1. Tool Standardization
All tools implement consistent interfaces defined in `src/components/tools/tool-types.ts`:
- `ToolConfig` - Tool configuration and metadata
- `ToolState` - Runtime state management
- `ToolInputSchema` - Standardized input validation
- `ToolComponentProps` - Consistent component interface

#### 2. Performance Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Bundle Analysis**: Real-time bundle size monitoring
- **Lazy Loading**: WASM runtimes and heavy components
- **Memory Management**: WASM runtime cleanup and garbage collection

#### 3. Security Model
- **Client-Side Processing**: Most tools operate entirely in the browser
- **Sandboxed Execution**: Code execution in isolated WASM environments
- **Input Validation**: Schema-based validation for all user inputs
- **No Backend Dependencies**: Core functionality works offline

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled, explicit return types required
- **Biome**: Combined linting and formatting (replaces ESLint + Prettier)
- **File Naming**:
  - Components: PascalCase (`JsonFormatter.tsx`)
  - Hooks: camelCase (`useToolState.ts`)
  - Utilities: camelCase (`formatUtils.ts`)
- **Import Organization**: React → Third-party → Internal (with @/ alias) → Type imports

### Tool Development Workflow

#### Creating New Tools
1. **Add Tool Definition**: Update `src/data/tools-data.ts`
2. **Create Page Route**: `src/app/tools/[category]/[tool]/page.tsx`
3. **Implement Tool Component**: `src/components/tools/[category]/[tool].tsx`
4. **Follow Component Pattern**: Use standardized tool interfaces and error handling
5. **Add Tests**: Unit tests in `src/__tests__/` or `tests/unit/`

#### Component Development
```typescript
// Standard tool component pattern
import type { ToolComponentProps } from '@/components/tools/tool-types';

export const ToolComponent: React.FC<ToolComponentProps> = ({
  config,
  state,
  onInputChange,
  onExecute,
  onReset
}) => {
  const [localError, setLocalError] = useState<string>('');

  const handleExecute = useCallback(async () => {
    try {
      setLocalError('');
      await onExecute();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [onExecute]);

  return (
    <div className="space-y-6">
      {/* Input sections with standardized form components */}
      {/* Processing buttons with loading states */}
      {/* Output display with error handling */}
    </div>
  );
};
```

### Testing Strategy
- **Unit Tests**: Vitest for individual components and utilities
- **Integration Tests**: API endpoints and tool workflows
- **E2E Tests**: Playwright for critical user journeys
- **Coverage**: 70% threshold for global coverage
- **Test Environment**: jsdom with mock APIs for WASM testing

### Performance Considerations
- **Bundle Size**: Monitor with webpack-bundle-analyzer
- **WASM Loading**: Implement lazy loading for heavy runtimes
- **Memory Usage**: Clean up WASM runtimes when idle
- **Core Web Vitals**: Target FCP < 1.8s, LCP < 2.5s, CLS < 0.1

## Configuration Files

### Build Configuration
- **Next.js**: `next.config.ts` - Optimized for static export and CDN deployment
- **TypeScript**: `tsconfig.json` - Strict mode with path aliases
- **Biome**: `biome.json` - Code formatting and linting rules
- **Tailwind**: `tailwind.config.ts` - Custom theme with shadcn/ui integration
- **Vitest**: `vitest.config.ts` - Test configuration with coverage thresholds

### Environment Variables
Key environment variables (see `.env.local.example`):
- `NODE_ENV`: Development/production environment
- `NEXT_PUBLIC_*`: Public client-side variables
- Private configuration for analytics and monitoring

## Common Development Tasks

### Adding a New JSON Tool
1. Add to `toolsData` in `src/data/tools-data.ts`
2. Create `src/app/tools/json/[tool-name]/page.tsx`
3. Create `src/components/tools/json/[tool-name].tsx`
4. Follow existing patterns from `json-formatter.tsx`

### Adding WASM Language Support
1. Implement runtime in `src/lib/runtimes/[language]-wasm.ts`
2. Update `WASMRuntimeManager` with language configuration
3. Add language to `SupportedLanguage` type
4. Create executor component in `src/components/tools/code-execution/`

### Performance Optimization
1. Check bundle size: Analyze webpack output
2. Monitor Core Web Vitals: Use browser dev tools
3. Optimize WASM loading: Implement lazy loading where needed
4. Memory cleanup: Ensure proper cleanup in useEffect

## Deployment Architecture

### Build Process
- **Static Export**: Next.js static site generation
- **Bundle Optimization**: Automatic code splitting and minification
- **Asset Optimization**: Image compression and format conversion
- **Caching Strategy**: Long-term caching for static assets

### Hosting Requirements
- **Static Hosting**: Works with any static host (Vercel, Netlify, Cloudflare Pages)
- **CDN**: Global CDN distribution recommended
- **HTTPS**: Required for WASM execution and security
- **No Backend**: Core functionality is entirely client-side

## Security Considerations

### WASM Execution Security
- **Sandboxed Environment**: All code execution in isolated WASM runtimes
- **Resource Limits**: Memory and timeout restrictions prevent abuse
- **No File System Access**: WASM runtimes have no access to user files
- **Client-Side Only**: No server-side code execution

### Input Validation
- **Schema Validation**: All user inputs validated against strict schemas
- **XSS Prevention**: React's auto-escaping and input sanitization
- **File Upload Security**: Client-side file processing with validation
- **No Persistent Storage**: No server-side data storage or databases

This architecture prioritizes performance, security, and maintainability while providing a comprehensive suite of developer tools that work entirely in the browser.

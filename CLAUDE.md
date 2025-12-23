# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Manager & Scripts
This project uses **bun** as the package manager.

```bash
# Development
bun dev                     # Start development server at http://localhost:3000
bun run build               # Build for production (Next.js)
bun start                   # Start production server

# Cloudflare Development & Deployment
bun run build:cf            # Build for Cloudflare Workers
bun run dev:cf              # Build and run locally with Wrangler
bun run dev:remote          # Build and run with remote Cloudflare services
bun run deploy              # Deploy to Cloudflare Workers
bun run deploy:cf           # Deploy to Cloudflare Workers (alias)
bun run preview:cf          # Preview deployment

# Code Quality
bun run lint                # Run Biome linting checks
bun run lint:fix            # Run Biome linting with auto-fix
bun run format              # Format code with Biome (auto-fixes issues)
bun run type-check          # Run TypeScript type checking

# Testing
bun test                    # Run Vitest unit tests
bun run test:watch          # Run Vitest in watch mode

# Maintenance
bun run clean               # Remove node_modules, .next, .open-next, dist
```

### Environment Setup
```bash
# Copy environment template
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

## Technology Stack

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.7+ (strict mode enabled)
- **UI**: shadcn/ui components with Tailwind CSS
- **Code Editor**: CodeMirror 6 for syntax highlighting and editing
- **State Management**: Zustand for client-side state
- **Package Manager**: bun (version 1.3.5+)
- **Deployment**: Cloudflare Workers via @opennextjs/cloudflare

### Key Dependencies
- **Code Execution**: Pyodide (Python), TeaVM (Java), WASM runtimes for Go/Rust/CPP and 6 additional languages
- **JSON Processing**: Custom JSON tools with validation and transformation
- **Image Processing**: Canvas API, qr-scanner, browser-native image handling
- **Code Quality**: Biome (linting + formatting), Vitest (testing)
- **Build Tools**: Turbopack (Next.js), webpack optimization for bundle splitting

### WASM Runtimes Architecture
The project supports multiple language execution through WebAssembly:
- **Python**: Pyodide (0.26.4) - 15MB bundle
- **Java**: TeaVM (0.8.0) - 5MB bundle
- **Go**: TinyGo (0.30.0) - 3MB bundle
- **Rust**: Rust WASM (1.75.0) - 2MB bundle
- **TypeScript**: Deno Runtime (2.0.0) - 1MB bundle
- **Additional Languages**: C++ (Emscripten 3.1.0), C# (Blazor 8.0.0), PHP (WebAssembly PHP 8.2.0), Ruby (ruby.wasm 3.2.0), Lua (Fengari 5.4.4)

Managed by `WASMRuntimeManager` with lazy loading, memory cleanup, and performance optimization.

## Architecture Overview

### Directory Structure
```
src/
├── app/                     # Next.js App Router pages
│   ├── tools/              # Individual tool pages by category
│   │   ├── data-format/    # Data format conversion tools
│   │   ├── development/    # Development tools
│   │   ├── file/           # File processing tools
│   │   ├── network/        # Network utilities
│   │   ├── security/       # Security and crypto tools
│   │   └── utility/        # General utilities
│   └── globals.css
├── components/             # Reusable React components
│   ├── ui/                # shadcn/ui base components
│   ├── layout/            # Layout and navigation components
│   ├── tools/             # Tool-specific components
│   └── file-upload/       # File handling components
├── lib/                   # Core utilities and runtime managers
│   ├── runtimes/         # WASM runtime implementations (10+ languages)
│   ├── nlp/             # Natural language processing
│   ├── crypto/          # Cryptographic operations
│   └── utils/           # General utility functions
├── types/                # TypeScript type definitions
├── data/                # Static data and tool configurations (tools-data.ts)
└── hooks/               # Custom React hooks
```

**Current Tool Organization:**
- Tools are organized into 6 categories: data-format, development, file, network, security, utility
- Tool registry system centralized in `src/data/tools-data.ts` with 28 tools across 6 categories
- WASM runtimes support 10 languages in `src/lib/runtimes/`

### Tool System Architecture

#### Tool Registry Pattern
All tools follow a standardized registration pattern through the `tools-data.ts` system:

```typescript
// Tool definition in src/data/tools-data.ts
{
  id: 'json-tools',
  name: 'JSON Tools',
  category: 'Data Format & Conversion',
  href: '/data-format/json-tools',
  processingType: 'client-side', // 'client-side' | 'hybrid' | 'server-side'
  security: 'local-only',        // 'local-only' | 'network-required' | 'secure-sandbox'
  features: ['Dual-pane JSON Viewer', 'Search & Filter', 'Validation'],
  tags: ['json', 'formatter', 'validator', 'beautifier'],
  difficulty: 'beginner',
  status: 'stable',
  isPopular: true
}
```

#### Component Architecture
Tools follow a consistent component structure:
- **Page Component**: Route handler in `src/app/[category]/[tool]/page.tsx`
- **Tool Component**: Main logic in `src/components/tools/[category]/[tool].tsx`
- **Shared Components**: Reusable UI components in `src/components/ui/`
- **Dynamic Routing**: Tools use dynamic routing via `src/app/[slug]/page.tsx`

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
  - Configuration in `biome.json` with custom rules
  - 2-space indentation, 100 char line width, single quotes
- **File Naming**:
  - Components: PascalCase (`JsonFormatter.tsx`)
  - Hooks: camelCase (`useToolState.ts`)
  - Utilities: camelCase (`formatUtils.ts`)
- **Import Organization**: React → Third-party → Internal (with @/ alias) → Type imports

### Tool Development Workflow

#### Creating New Tools
1. **Add Tool Definition**: Update `src/data/tools-data.ts` with proper metadata
2. **Create Page Route**: `src/app/[category]/[tool]/page.tsx`
3. **Implement Tool Component**: `src/components/tools/[category]/[tool].tsx`
4. **Follow Component Pattern**: Use standardized tool interfaces and error handling
5. **Update Dynamic Routing**: Ensure tool is accessible via `[slug]/page.tsx`
6. **Add Tests**: Unit tests using Vitest

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
- **Integration Tests**: Tool workflows and component integration
- **Coverage**: Configured with vitest coverage reporting
- **Test Environment**: jsdom with mock APIs for WASM testing

### Performance Considerations
- **Bundle Size**: Use `pnpm analyze` to run @next/bundle-analyzer for bundle analysis
- **WASM Loading**: Lazy loading for heavy runtimes implemented
- **Memory Usage**: Automatic cleanup of idle WASM runtimes (5-minute threshold)
- **Core Web Vitals**: Target FCP < 1.8s, LCP < 2.5s, CLS < 0.1

## Configuration Files

### Build Configuration
- **Next.js**: `next.config.ts` - Optimized with Turbopack, webpack code splitting, and image optimization
- **TypeScript**: `tsconfig.json` - Strict mode enabled, path aliases (@/*), ES2022 target
- **Biome**: `biome.json` - 2-space indentation, 100 char line width, single quotes, custom rule overrides
- **Tailwind**: `tailwind.config.ts` - Custom theme with shadcn/ui integration
- **Vitest**: `vitest.config.ts` - Test configuration with coverage reporting
- **Bundle Optimization**: Automatic vendor chunks, UI components splitting, and package optimization

### Environment Variables
Key environment variables (see `.env.local.example`):
- `NODE_ENV`: Development/production environment
- `NEXT_PUBLIC_*`: Public client-side variables
- Private configuration for analytics and monitoring

## Common Development Tasks

### Adding a New Tool
1. Add to `toolsData` in `src/data/tools-data.ts` with proper categorization
2. Create `src/app/[category]/[tool-name]/page.tsx`
3. Create `src/components/tools/[category]/[tool-name].tsx`
4. Follow existing patterns and use standardized interfaces
5. Ensure tool is accessible through dynamic routing system

### Adding WASM Language Support
1. Implement runtime in `src/lib/runtimes/[language]-wasm.ts`
2. Update `WASMRuntimeManager` with language configuration
3. Add language to supported languages in the runtime system
4. Create corresponding tool components for code execution

### Performance Optimization
1. Bundle analysis: webpack optimization configured in `next.config.ts`
2. Monitor Core Web Vitals: Vercel Speed Insights integrated
3. Optimize WASM loading: Lazy loading implemented for runtimes
4. Memory cleanup: Proper cleanup in useEffect for WASM instances

## Deployment Architecture

### Build Process
- **OpenNext**: Uses `@opennextjs/cloudflare` to build Next.js for Cloudflare Workers
- **Bundle Optimization**: Automatic code splitting and minification
- **Asset Optimization**: Image compression and format conversion
- **Caching Strategy**: Long-term caching for static assets via Cloudflare CDN

### Cloudflare Workers Deployment
- **Runtime**: Cloudflare Workers with Node.js compatibility mode
- **Configuration**: `wrangler.jsonc` for Workers configuration
- **Build Output**: `.open-next/` directory contains the built Worker
- **CDN**: Cloudflare's global CDN for static assets
- **HTTPS**: Automatic HTTPS via Cloudflare
- **Core Functionality**: Primarily client-side with edge-optimized delivery

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
# Parsify.dev - Online Developer Tools Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black.svg)](https://vercel.com/)

A comprehensive online developer tools platform focused on JSON processing, code formatting, and secure code execution. Built with modern web technologies and deployed on Vercel's edge platform for global performance.

## ✨ Key Features

### 🔧 JSON Tools (MVP Core)
- **JSON Format & Validate** - Beautiful formatting with syntax highlighting and real-time validation
- **JSON Transformations** - Sort keys, escape/unescape, minify, and pretty-print
- **JSON Schema Validation** - Validate JSON against custom schemas
- **File Conversions** - Convert between JSON, CSV, and XML formats
- **Code Generation** - Generate TypeScript/Python classes from JSON structures
- **JWT Decoder** - Decode and validate JWT tokens with payload inspection

### 💻 Code Formatting & Execution
- **Multi-language Support** - JavaScript, TypeScript, CSS, HTML, SQL, Python formatting
- **Live Code Editor** - Monaco Editor with IntelliSense and syntax highlighting
- **Secure Code Execution** - Run JavaScript/TypeScript (V8) and Python (Pyodide WASM) in sandboxed environments
- **Real-time Results** - Get execution results within 5 seconds with memory limits

### 🛠️ Utility Tools
- **Text Encoding** - Base64, URL encoding/decoding
- **Timestamp Conversion** - Unix timestamp to human-readable format
- **Hash Generation** - MD5, SHA-256 hash calculations
- **Naming Conventions** - Convert between camelCase, snake_case, and kebab-case
- **UUID Generator** - Generate various UUID versions

### 🎨 User Experience
- **Dual Theme Support** - Warm cream light mode (Cursor-inspired) + Modern Zinc dark mode
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Glassmorphism UI** - Floating headers with backdrop blur effects
- **Micro-animations** - Smooth transitions and hover effects
- **Search & Navigation** - Quick tool discovery with intelligent search

## 🏗️ Architecture Overview

### Technology Stack

**Frontend (Web App)**
- **Framework**: Next.js 16 with App Router & Turbopack
- **UI Library**: shadcn/ui + Tailwind CSS
- **Theme**: Cursor-inspired warm light mode + Zinc dark mode
- **Code Editor**: CodeMirror 6 with syntax highlighting
- **State Management**: React hooks + Context
- **Language**: TypeScript 5.0+

**Infrastructure**
- **Deployment**: Vercel with Git integration
- **CDN**: Vercel Edge Network (global)
- **Analytics**: Vercel Analytics + Speed Insights
- **Performance**: Edge caching, ISR support
- **Monitoring**: Vercel Analytics for Core Web Vitals

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │  Mobile Device  │    │   Desktop App   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Vercel Edge Network     │
                    │  (Global Distribution)    │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Vercel Platform      │
                    │   (Next.js 16 + SSR/ISR)  │
                    └───────────────────────────┘
```

**Data Processing:**
- Client-side JavaScript/TypeScript execution
- Browser-based tools (JSON, code formatting, etc.)
- Local storage for user preferences
- Server-side rendering for SEO optimization

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/parsify-dev.git
   cd parsify-dev
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp .env.local.example .env.local
   
   # Edit .env.local with your configuration
   # See docs/DEPLOYMENT.md for details
   ```

### Development

1. **Start development server**
   ```bash
   pnpm dev
   ```
   
   This will start the web app at http://localhost:3000

2. **Run tests**
   ```bash
   # Run all tests
   pnpm test
   
   # Run tests with UI
   pnpm test:ui
   
   # Run tests with coverage
   pnpm test:coverage
   
   # Run E2E tests
   pnpm test:e2e
   ```

3. **Code quality checks**
   ```bash
   # Lint code
   pnpm lint
   
   # Auto-fix linting issues
   pnpm lint:fix
   
   # Format code (auto-runs on commit via Husky)
   pnpm format
   
   # Type checking
   pnpm type-check
   ```

4. **Performance monitoring**
   ```bash
   # Analyze bundle size
   pnpm analyze
   
   # Open bundle analyzer report
   pnpm analyze:open
   
   # Check bundle size against budgets
   pnpm size-check
   ```

### Building for Production

```bash
# Build the project
pnpm build

# Preview production build locally
pnpm preview

# Clean build artifacts
pnpm clean:build
```

## 🎯 Performance Features

### Optimized Bundle Architecture
- **Monaco Editor**: Lazy-loaded with language-specific imports
- **Component Splitting**: Route-based code splitting with loading states
- **Tree Shaking**: Eliminates unused code and dependencies
- **Bundle Analysis**: Real-time monitoring with webpack-bundle-analyzer

### Performance Monitoring
- **Core Web Vitals**: Automatic tracking of FCP, LCP, FID, CLS
- **Error Boundaries**: Comprehensive error catching and reporting
- **Memory Monitoring**: JavaScript heap size tracking
- **Performance Budgets**: Automated bundle size enforcement

### Optimized User Experience
- **Loading Skeletons**: Context-aware loading states
- **Progressive Enhancement**: Content loads with JavaScript enhancement
- **Error Recovery**: Graceful error handling with retry mechanisms
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 📚 Documentation

- **[Design System](docs/DESIGN_SYSTEM.md)** - Theme colors, typography, and component guidelines
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Complete deployment instructions
- **[Analytics Guide](docs/ANALYTICS.md)** - Analytics setup and usage

## 🌐 Deployment

### Vercel Git Integration

The project uses Vercel's Git integration for automatic deployment. When you push changes to your repository, Vercel automatically builds and deploys your site.

**Setup Steps:**

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) → Add New Project
   - Import your Git repository (GitHub, GitLab, Bitbucket)
   - Select the repository

2. **Configure Build Settings**
   - **Framework preset**: `Next.js` (auto-detected)
   - **Build command**: `pnpm run build`
   - **Output directory**: `.next` (default)
   - **Node.js version**: `20.x`

3. **Environment Variables**
   - Set any required environment variables in Vercel dashboard
   - See `.env.local.example` for available options

4. **Automatic Deployment**
   - Push to `main` branch → Production deployment
   - Push to other branches → Preview deployments with unique URLs

**Manual Build (for testing):**
```bash
pnpm run build
pnpm run start
```

### Environment Configuration

**Development (.env.local)**
```env
NODE_ENV="development"
```

**Production (Vercel)**
Environment variables are set through Vercel dashboard → Settings → Environment Variables.

### Analytics & Monitoring

The project uses Vercel's built-in analytics:
- **Vercel Analytics** - Page views, visitors, and traffic analysis
- **Speed Insights** - Core Web Vitals monitoring (LCP, FID, CLS, TTFB)

Both are automatically enabled via `@vercel/analytics` and `@vercel/speed-insights` packages.

### Custom Domain Setup

1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Add your custom domain (e.g., `parsify.dev`)

2. **Configure DNS**
   - Add A record: `76.76.21.21`
   - Or CNAME: `cname.vercel-dns.com`

3. **SSL Certificate**
   - Vercel automatically provisions SSL certificates

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:8787`
- **Production**: `https://api.parsify.dev`

### Authentication
Currently supports anonymous usage. Future versions will include:
- JWT-based authentication
- API key authentication for premium features

### Core Endpoints

#### JSON Tools
```bash
# Format JSON
POST /api/v1/json/format
Content-Type: application/json

{
  "json": "{\"name\":\"John\",\"age\":30}",
  "options": {
    "indent": 2,
    "sortKeys": true
  }
}

# Validate JSON
POST /api/v1/json/validate
Content-Type: application/json

{
  "json": "{\"name\":\"John\"}",
  "schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" }
    }
  }
}

# Convert JSON to CSV
POST /api/v1/json/to-csv
Content-Type: application/json

{
  "json": "[{\"name\":\"John\",\"age\":30}]",
  "options": {
    "delimiter": ",",
    "header": true
  }
}
```

#### Code Execution
```bash
# Execute JavaScript
POST /api/v1/code/execute
Content-Type: application/json

{
  "code": "console.log('Hello, World!')",
  "language": "javascript",
  "timeout": 5000
}

# Execute Python
POST /api/v1/code/execute
Content-Type: application/json

{
  "code": "print('Hello, World!')",
  "language": "python",
  "timeout": 5000
}
```

#### Utility Tools
```bash
# Base64 Encode
POST /api/v1/utils/encode
Content-Type: application/json

{
  "text": "Hello, World!",
  "encoding": "base64"
}

# Generate UUID
GET /api/v1/utils/uuid?version=4

# Hash Text
POST /api/v1/utils/hash
Content-Type: application/json

{
  "text": "Hello, World!",
  "algorithm": "sha256"
}
```

### Error Handling

All API responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2023-12-01T12:00:00Z",
    "requestId": "req_123456789"
  }
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid JSON format",
    "details": {}
  },
  "meta": {
    "timestamp": "2023-12-01T12:00:00Z",
    "requestId": "req_123456789"
  }
}
```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for API endpoints
├── e2e/           # End-to-end tests with Playwright
├── load/          # Load testing scenarios
└── performance/   # Performance benchmarks
```

### Running Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Load tests
pnpm test:load

# Performance tests
pnpm test:performance
```

### Writing Tests

**Unit Test Example**:
```typescript
// tests/unit/json/formatter.test.ts
import { describe, it, expect } from 'vitest'
import { formatJson } from '@/api/src/utils/json-formatter'

describe('JSON Formatter', () => {
  it('should format JSON with indentation', () => {
    const input = '{"name":"John","age":30}'
    const result = formatJson(input, { indent: 2 })
    
    expect(result).toBe('{\n  "name": "John",\n  "age": 30\n}')
  })
})
```

**E2E Test Example**:
```typescript
// tests/e2e/json-tools.spec.ts
import { test, expect } from '@playwright/test'

test('JSON formatting tool', async ({ page }) => {
  await page.goto('/data-format/json-tools')
  
  // Enter JSON
  await page.fill('[data-testid="json-input"]', '{"name":"John","age":30}')
  
  // Click format button
  await page.click('[data-testid="format-button"]')
  
  // Verify formatted output
  const output = await page.inputValue('[data-testid="json-output"]')
  expect(output).toContain('"name": "John"')
  expect(output).toContain('"age": 30')
})
```

## 📊 Performance & Monitoring

### Performance Targets

- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Time to Interactive**: < 3.5 seconds
- **API Response Time**: < 500ms (95th percentile)
- **Code Execution**: < 5 seconds

### Monitoring Setup

**Sentry Integration**:
```typescript
// Add Sentry to your Next.js app if needed
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

**Health Checks**:
```bash
# API Health Check
GET /api/v1/health

# Database Health Check
GET /api/v1/health/database

# Cache Health Check
GET /api/v1/health/cache
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   pnpm test
   pnpm lint
   pnpm type-check
   ```
5. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow project configuration
- **Prettier**: Use project formatting rules
- **Commit Messages**: Follow Conventional Commits

### Pull Request Guidelines

- Include tests for new features
- Update documentation if needed
- Ensure all tests pass
- Keep PR descriptions clear and concise
- Link to relevant issues

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/staging/production) | `development` |
| `API_BASE_URL` | API base URL | `http://localhost:8787` |
| `SENTRY_DSN` | Sentry DSN for error tracking | - |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | `info` |
| `ENABLE_METRICS` | Enable performance metrics | `true` |
| `MAX_REQUEST_SIZE` | Maximum request size in bytes | `10485760` (10MB) |
| `REQUEST_TIMEOUT` | Request timeout in milliseconds | `30000` (30s) |

### Client-Side Architecture

This is a client-side application - all data processing happens in the browser:
- **No database required** - All tools run locally
- **No server storage** - User preferences stored in localStorage
- **Privacy-first** - Your data never leaves your browser

## 🚨 Troubleshooting

### Common Issues

**1. Development Server Won't Start**
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check port availability
lsof -i :3000
lsof -i :8787
```

**2. Database Connection Errors**
```bash
# Check D1 database configuration
wrangler d1 info parsify-dev

# Run migrations
pnpm db:migrate

# Check wrangler.toml configuration
```

**3. CORS Errors**
```bash
# Check API CORS configuration
# Ensure origin is in allowed list
# Check environment variables
```

**4. Build Failures**
```bash
# Check TypeScript errors
pnpm type-check

# Check ESLint errors
pnpm lint

# Check for missing dependencies
pnpm install
```

**5. Performance Issues**
```bash
# Run performance tests
pnpm test:performance

# Analyze bundle size
pnpm analyze

# Check build output
pnpm build
```

### Debug Mode

Enable debug logging:
```bash
# Set environment variable
export NODE_ENV=development

# Or in .env.local
NODE_ENV="development"
```

### Health Check Endpoints

```bash
# Overall health
GET /api/v1/health

# Database health
GET /api/v1/health/database

# Cache health
GET /api/v1/health/cache

# Detailed system info
GET /api/v1/health/detailed
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Vercel** for Next.js and the excellent deployment platform
- **Monaco Editor** team for the amazing code editor
- **shadcn/ui** for the beautiful UI components
- **Open Source community** for all the amazing libraries and tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/parsify.dev/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/parsify.dev/discussions)
- **Email**: support@parsify.dev
- **Twitter**: [@parsify_dev](https://twitter.com/parsify_dev)

---

**Built with ❤️ for developers, by developers**

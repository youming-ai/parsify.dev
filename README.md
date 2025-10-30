# Parsify.dev - Online Developer Tools Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black.svg)](https://nextjs.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)](https://pages.cloudflare.com/)

A comprehensive online developer tools platform focused on JSON processing, code formatting, and secure code execution. Built with modern web technologies and deployed on Cloudflare's edge platform for global performance.

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
- **Dark/Light Mode** - Developer-friendly theme switching
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Real-time Collaboration** - Share tools with team members
- **Search & Navigation** - Quick tool discovery with intelligent search

## 🏗️ Architecture Overview

### Technology Stack

**Frontend (Web App)**
- **Framework**: Next.js 14 with App Router
- **UI Library**: shadcn/ui + Tailwind CSS
- **Code Editor**: Monaco Editor (VS Code editor)
- **State Management**: TanStack Query + React Router
- **Language**: TypeScript 5.0+

**Technology Stack**
- **Deployment**: Cloudflare Pages with Git integration
- **Runtime**: Edge Runtime for optimal performance
- **Analytics**: Microsoft Clarity for user insights
- **Language**: TypeScript 5.0+ for type safety

**Infrastructure**
- **Deployment**: Cloudflare Pages (static site)
- **CDN**: Cloudflare global network
- **Performance**: Edge caching for fast global access
- **Monitoring**: Sentry for error tracking and performance
- **Security**: Cloudflare WAF, Turnstile (CAPTCHA), rate limiting

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │  Mobile Device  │    │   Desktop App   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Cloudflare CDN/Edge     │
                    │  (Global Distribution)    │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Cloudflare Pages        │
                    │   (Static Next.js Site)   │
                    └───────────────────────────┘

**Data Processing:**
- Client-side JavaScript/TypeScript execution
- Browser-based tools (JSON, code formatting, etc.)
- Local storage for user preferences
- No server-side processing required
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

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

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Complete deployment instructions
- **[Analytics Guide](docs/ANALYTICS.md)** - Analytics setup and usage
- **[JSON Tools](src/components/tools/json/README.md)** - JSON tools documentation
- **[Code Tools](src/components/tools/code/README.md)** - Code tools documentation

## 🌐 Deployment

### Cloudflare Pages Git Integration

The project uses Cloudflare's Git integration for automatic deployment. When you push changes to your repository, Cloudflare automatically builds and deploys your site.

**Setup Steps:**

1. **Connect Repository**
   - Go to Cloudflare Dashboard → Pages → Create a project
   - Connect your Git repository (GitHub, GitLab, etc.)
   - Select the repository

2. **Configure Build Settings**
   - **Build command**: `pnpm run build`
   - **Build output directory**: `.open-next`
   - **Node.js version**: `20+`

3. **Environment Variables**
   - Set any required environment variables in Cloudflare Pages dashboard
   - Examples: `NEXT_PUBLIC_MICROSOFT_CLARITY_ID`, etc.

4. **Automatic Deployment**
   - Push to `main` branch → Production deployment
   - Push to other branches → Preview deployments

**Manual Build (for testing):**
```bash
pnpm run build
# Static files are generated in '.open-next/' directory
```

### Environment Configuration

**Development (.env.local)**
```env
# Database
DATABASE_URL="your-dev-database-url"

# API Configuration
API_BASE_URL="http://localhost:8787"
NODE_ENV="development"

# Monitoring
SENTRY_DSN="your-dev-sentry-dsn"
```

**Production (Cloudflare Pages)**
Environment variables are set through Cloudflare Pages dashboard or Git integration.

### Custom Domain Setup

1. **Configure DNS**
   - Add CNAME record for API subdomain
   - Add CNAME record for web app

2. **Update wrangler.toml**
   ```toml
   [routes]
   pattern = "api.parsify.dev"
   zone_name = "parsify.dev"
   ```

3. **Configure Pages custom domain**
   - Use Cloudflare Dashboard to connect custom domain

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
  await page.goto('/tools/json')
  
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

### Database Configuration

**D1 Database (SQLite)**:
```sql
-- Migrations location: migrations/
-- Run with: pnpm db:migrate

-- Seed data location: migrations/seed.sql
-- Run with: pnpm db:seed
```

### Cloudflare Services

**KV Namespaces**:
- `CACHE`: Application cache
- `SESSIONS`: User sessions
- `UPLOADS`: File upload metadata
- `ANALYTICS`: Usage analytics

**R2 Buckets**:
- `FILES`: User uploaded files

**Durable Objects**:
- `SESSION_MANAGER`: User session management
- `COLLABORATION_ROOM`: Real-time collaboration
- `REALTIME_SYNC`: Data synchronization

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

# Check memory usage
wrangler dev --memory-limit 512

# Monitor logs
wrangler tail
```

### Debug Mode

Enable debug logging:
```bash
# Set environment variable
export LOG_LEVEL=debug

# Or update wrangler.toml
[vars]
LOG_LEVEL = "debug"
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

- **Cloudflare** for providing the excellent Workers platform
- **Vercel** for Next.js and the modern web development ecosystem
- **Monaco Editor** team for the amazing code editor
- **Hono.js** for the fast and ergonomic web framework
- **Open Source community** for all the amazing libraries and tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/parsify.dev/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/parsify.dev/discussions)
- **Email**: support@parsify.dev
- **Twitter**: [@parsify_dev](https://twitter.com/parsify_dev)

---

**Built with ❤️ for developers, by developers**
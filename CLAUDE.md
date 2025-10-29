# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Parsify.dev is an online developer tools platform with JSON processing, code formatting, and secure code execution capabilities. It uses a **separated architecture** with a frontend (Next.js) and backend (Hono.js API) deployed as independent services to Cloudflare.

## Development Commands

### Setup and Development
```bash
# Install dependencies
pnpm install

# Start web app only
pnpm dev:web

# Start API only (from apps/api directory)
cd apps/api && pnpm dev

# Type check API
cd apps/api && pnpm type-check
```

### Building and Deployment
```bash
# Build frontend only (creates dist for Cloudflare Pages)
pnpm build

# Deploy frontend to Cloudflare Pages
pnpm deploy

# Deploy API to Workers (from apps/api directory)
cd apps/api && pnpm deploy:production

# Deploy API to staging
cd apps/api && pnpm deploy:staging

# Clean build artifacts
pnpm clean
```

### Code Quality
```bash
# Run linter and formatter
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:write
```

## Architecture

### Separated Architecture
- **`apps/web/`**: Next.js 14 frontend (static export) → Cloudflare Pages
- **`apps/api/`**: Hono.js API (simplified) → Cloudflare Workers
- **Independent deployments**: Frontend and API deploy separately

### Key Architectural Patterns

#### Separated Deployment Architecture
- Frontend deployed to `parsify.dev` (Cloudflare Pages)
- API deployed to `api.parsify.dev` (Cloudflare Workers)
- Cross-origin requests handled by environment-specific CORS configuration
- Frontend auto-detects API URL based on hostname

#### Simplified API Design
- Main entry point: `apps/api/src/index-simple.ts`
- Environment-aware CORS in `apps/api/src/config/cors-config.ts`
- Minimal middleware stack for performance and maintainability
- Type-safe environment variables via `Env` interface

#### Smart Frontend API Client
- `apps/web/src/lib/api-client.ts` automatically detects environment
- Production: `https://api.parsify.dev`
- Staging: `https://api-staging.parsify.dev`  
- Development: `http://localhost:8787`

#### Frontend Architecture
- Next.js 14 App Router with static export
- Component-based architecture with shadcn/ui + Tailwind CSS
- State management with Zustand
- Tool-specific components in `src/components/tools/`

### Cloudflare Services Integration
- **D1 Database**: SQLite for persistent data (shared between services)
- **KV Storage**: Cache, sessions, uploads, analytics (shared)
- **R2 Storage**: File uploads (shared)
- **Custom domains**: `parsify.dev` (frontend), `api.parsify.dev` (API)

## Important Configuration Files

### Dual Configuration Setup
- **`wrangler.toml`** (root): Frontend Pages configuration
- **`apps/api/wrangler.toml`**: API Workers configuration with custom routes
- **`apps/web/next.config.js`**: Static export configuration for Pages
- **`scripts/build-unified.sh`**: Frontend build script (API builds separately)

### Code Quality
- **`biome.json`**: Linting and formatting rules (single quotes, trailing commas ES5)
- **`package.json`**: pnpm workspace with Node.js 20+ requirement
- **TypeScript**: Strict mode enabled for type safety

### Deployment Configuration
- **`.github/workflows/deploy.yml`**: Frontend deployment to Pages
- **`.github/workflows/deploy-api.yml`**: API deployment to Workers
- **`.github/workflows/ci.yml`**: Continuous integration with matrix builds

## Development Guidelines

### Code Style (Biome Configuration)
- Single quotes for strings
- ES5 trailing commas
- Always semicolons
- Organize imports automatically

### File Structure Conventions
- Tool components: `src/components/tools/{category}/`
- Shared components: `src/components/ui/`
- API configuration: `apps/api/src/config/`
- API middleware: `apps/api/src/middleware/` (minimal set)

### Environment-Specific Configuration
- **Production**: `https://api.parsify.dev` with production origins
- **Staging**: `https://api-staging.parsify.dev` with staging origins
- **Development**: `http://localhost:8787` with localhost origins

### CORS Configuration
- Managed in `apps/api/src/config/cors-config.ts`
- Environment-aware origin whitelisting
- Separate configurations for public, admin, and authenticated endpoints

### Adding New Tools
1. Create tool components in `src/components/tools/{category}/`
2. Add API endpoints to `apps/api/src/index-simple.ts`
3. Update API client methods in `apps/web/src/lib/api-client.ts`
4. Add types to `src/types/tools.ts`

## API Development

### API Structure
- **Entry point**: `apps/api/src/index-simple.ts`
- **CORS configuration**: `apps/api/src/config/cors-config.ts`
- **Environment variables**: Typed in `Env` interface
- **Health check**: `/health` endpoint

### Common API Endpoints
```bash
# Health check
GET /health

# JSON formatting
POST /api/v1/json/format

# Code execution
POST /api/v1/code/execute

# Utility tools
POST /api/v1/utils/encode
GET /api/v1/utils/uuid
```

## Testing and Quality Assurance

The project uses Biome for code quality and linting. TypeScript is configured with strict mode for type safety. No test framework is currently configured.

## Deployment

### Separate Deployment Pipeline
- **Frontend**: GitHub Actions → Cloudflare Pages → `parsify.dev`
- **API**: GitHub Actions → Cloudflare Workers → `api.parsify.dev`
- **Staging**: Separate staging environments for both services
- **Rollback**: Independent rollback capabilities for each service

### Required Secrets
- `CLOUDFLARE_API_TOKEN`: For Workers deployment
- `CLOUDFLARE_ACCOUNT_ID`: For Workers account identification
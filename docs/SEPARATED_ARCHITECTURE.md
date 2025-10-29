# Separated Architecture Guide

This document explains the separated architecture for parsify.dev, where the frontend and API are deployed as separate services.

## Architecture Overview

```
┌─────────────────────────┐    ┌─────────────────────────┐
│      Frontend           │    │        API              │
│  (Next.js Static)       │    │   (Hono.js Workers)     │
│   Cloudflare Pages      │    │  Cloudflare Workers      │
│   parsify.dev           │    │   api.parsify.dev        │
└─────────────────────────┘    └─────────────────────────┘
             │                               │
             └─────────────┬─────────────────┘
                           │
                 ┌─────────────────┐
                 │  Cloudflare     │
                 │  Services       │
                 │                 │
                 │  D1 Database    │
                 │  KV Storage     │
                 │  R2 Storage     │
                 └─────────────────┘
```

## Services

### Frontend Service (parsify-dev)
- **Technology**: Next.js 14 with static export
- **Deployment**: Cloudflare Pages
- **Domain**: `parsify.dev`
- **Configuration**: `wrangler.toml` (root directory)

### API Service (parsify-api)
- **Technology**: Hono.js framework
- **Deployment**: Cloudflare Workers
- **Domain**: `api.parsify.dev`
- **Configuration**: `apps/api/wrangler.toml`

## Development

### Local Development

```bash
# Start both services
pnpm dev

# Start only frontend
pnpm dev:web

# Start only API
cd apps/api && pnpm dev
```

### Building

```bash
# Build frontend only
pnpm build

# API build (TypeScript compilation)
cd apps/api && pnpm build
```

## Deployment

### Frontend Deployment
```bash
# Deploy to Cloudflare Pages
pnpm deploy

# Or manually
npx wrangler pages deploy dist --project-name parsify-dev
```

### API Deployment
```bash
# Deploy to production
cd apps/api && pnpm deploy:production

# Deploy to staging
cd apps/api && pnpm deploy:staging

# Or manually
cd apps/api && wrangler deploy --env production
```

## GitHub Actions

The project uses separate GitHub Actions for each service:

- **Frontend**: `.github/workflows/deploy.yml` - Deploys to Cloudflare Pages
- **API**: `.github/workflows/deploy-api.yml` - Deploys to Cloudflare Workers
- **CI**: `.github/workflows/ci.yml` - Runs tests and builds

## CORS Configuration

The API is configured with environment-specific CORS settings:

### Production
- **Allowed Origins**: `https://parsify.dev`, `https://www.parsify.dev`, `https://app.parsify.dev`
- **Credentials**: Enabled
- **Methods**: All HTTP methods

### Staging
- **Allowed Origins**: `https://parsify.dev`, `https://staging.parsify.dev`, `https://preview.parsify.dev`
- **Credentials**: Enabled
- **Methods**: All HTTP methods

### Development
- **Allowed Origins**: `http://localhost:3000`, `http://localhost:5173`
- **Credentials**: Enabled
- **Methods**: All HTTP methods

## API Endpoints

### Base URL
- **Production**: `https://api.parsify.dev`
- **Staging**: `https://api-staging.parsify.dev`
- **Development**: `http://localhost:8787`

### Core Endpoints

#### Health Check
```bash
GET /health
```

#### JSON Tools
```bash
POST /api/v1/json/format
{
  "json": "{\"name\":\"John\",\"age\":30}",
  "options": {
    "indent": 2,
    "sortKeys": true
  }
}
```

#### Code Execution
```bash
POST /api/v1/code/execute
{
  "code": "console.log('Hello, World!')",
  "language": "javascript",
  "options": {
    "timeout": 5000
  }
}
```

#### Utility Tools
```bash
POST /api/v1/utils/encode
{
  "text": "Hello, World!",
  "encoding": "base64"
}

GET /api/v1/utils/uuid?version=4
```

## Frontend Configuration

The frontend automatically detects the environment and uses the appropriate API URL:

```typescript
// apps/web/src/lib/api-client.ts
const apiClient = new ApiClient();
// - Production: https://api.parsify.dev
// - Staging: https://api-staging.parsify.dev
// - Development: http://localhost:8787
```

## Environment Variables

### Frontend (Pages)
- `NEXT_PUBLIC_API_BASE_URL`: API base URL
- `NEXT_PUBLIC_MICROSOFT_CLARITY_ID`: Analytics ID

### API (Workers)
- `ENVIRONMENT`: Environment (production/staging/development)
- `API_VERSION`: API version
- `JWT_SECRET`: JWT signing secret
- `SENTRY_DSN`: Error tracking DSN

## Database and Storage

All Cloudflare services are shared between frontend and API:

- **D1 Database**: Primary data storage
- **KV Namespaces**: Cache, sessions, uploads, analytics
- **R2 Bucket**: File storage

## Benefits of Separated Architecture

1. **Independent Scaling**: Frontend and API can scale independently
2. **Specialized Hosting**: Each service uses optimal hosting (Pages for static, Workers for API)
3. **Domain Separation**: Clear separation of concerns
4. **Independent Deployment**: Can deploy API changes without frontend changes
5. **CORS Control**: Fine-grained control over API access

## Migration from Unified Architecture

If migrating from the unified architecture:

1. **Database**: No changes needed (same D1 database)
2. **Frontend**: Update API calls to use separate domain
3. **Environment Variables**: Configure API URL for each environment
4. **Deployment**: Set up separate deployment pipelines
5. **DNS**: Configure custom domains for both services

## Troubleshooting

### CORS Issues
- Check allowed origins in API CORS configuration
- Verify that frontend domain is in the allowed list
- Ensure credentials are properly configured

### Deployment Issues
- Verify `wrangler.toml` configurations
- Check Cloudflare service bindings
- Ensure secrets are properly configured

### API Connectivity
- Verify API is accessible at correct domain
- Check health endpoint: `https://api.parsify.dev/health`
- Review CORS headers in browser developer tools

## Monitoring

Both services can be monitored independently:

- **Frontend**: Cloudflare Pages analytics
- **API**: Cloudflare Workers analytics and health endpoints
- **Errors**: Sentry integration for both services
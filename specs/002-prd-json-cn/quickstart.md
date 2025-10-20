# Quickstart Guide: Online Developer Tools Platform

**Version**: 1.0 (MVP)
**Last Updated**: 2025-10-08

## Overview

This guide helps you get started with the Online Developer Tools Platform MVP, providing step-by-step instructions for setup, development, and deployment.

## Prerequisites

### Development Environment
- Node.js 18+
- pnpm 8+
- Git
- Cloudflare account (free tier sufficient for development)
- Wrangler CLI (`pnpm add -g wrangler`)

### Required Accounts
- Cloudflare account (for Pages, Workers, D1, KV, R2)
- GitHub (for repository and CI/CD)
- Optional: Google/OAuth provider for authentication testing

## Project Setup

### 1. Repository Setup
```bash
# Clone the repository
git clone <repository-url>
cd parsify.dev

# Install dependencies
pnpm install

# Switch to feature branch
git checkout 002-prd-json-cn
```

### 2. Cloudflare Configuration
```bash
# Authenticate with Cloudflare
wrangler auth login

# Create D1 database
wrangler d1 create parsify-dev
wrangler d1 create parsify-staging
wrangler d1 create parsify-prod

# Note the database IDs and update wrangler.toml

# Create R2 bucket
wrangler r2 bucket create parsify-files-dev
wrangler r2 bucket create parsify-files-staging
wrangler r2 bucket create parsify-files-prod

# Create KV namespace
wrangler kv:namespace create "PARSIFY_CACHE"
wrangler kv:namespace create "PARSIFY_SESSIONS"

# Create Durable Object
wrangler d1 execute parsify-dev --command "CREATE TABLE rate_limiters (id TEXT PRIMARY KEY, data TEXT)"
```

### 3. Environment Configuration
```bash
# Create environment files
cp .env.example .env.dev
cp .env.example .env.staging
cp .env.example .env.prod

# Configure environment variables
# .env.dev
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_API_TOKEN=<your-api-token>
DATABASE_ID=<dev-database-id>
R2_BUCKET_NAME=parsify-files-dev
KV_NAMESPACE_ID=<kv-namespace-id>
JWT_SECRET=<dev-jwt-secret>
OAUTH_GOOGLE_CLIENT_ID=<google-client-id>
OAUTH_GOOGLE_CLIENT_SECRET=<google-client-secret>
OAUTH_GITHUB_CLIENT_ID=<github-client-id>
OAUTH_GITHUB_CLIENT_SECRET=<github-client-secret>
```

### 4. Database Setup
```bash
# Run database migrations
pnpm run db:migrate:dev

# Seed initial data
pnpm run db:seed:dev
```

## Development Workflow

### 1. Local Development
```bash
# Start development servers
pnpm run dev

# This starts:
# - Next.js frontend on http://localhost:3000
# - Hono API on http://localhost:8787
# - Local D1 database
# - Hot reload for both frontend and backend
```

### 2. Running Tests
```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit      # Unit tests
pnpm test:integration # Integration tests
pnpm test:e2e       # End-to-end tests
pnpm test:contract  # API contract tests

# Watch mode
pnpm test:watch
```

### 3. Building for Production
```bash
# Build all packages
pnpm build

# Build specific packages
pnpm build:web      # Frontend only
pnpm build:api      # Backend only
```

## Core Features Walkthrough

### 1. JSON Tools

#### JSON Formatting
```typescript
// API Usage
POST /api/v1/tools/json/format
{
  "json": "{\"name\":\"John\",\"age\":30}",
  "indent": 2,
  "sort_keys": true
}

// Response
{
  "formatted": "{\n  \"age\": 30,\n  \"name\": \"John\"\n}",
  "valid": true,
  "size": 35,
  "errors": null
}
```

#### JSON Validation
```typescript
// API Usage
POST /api/v1/tools/json/validate
{
  "json": "{\"name\":\"John\",\"age\":30}",
  "schema": {
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "age": {"type": "number"}
    },
    "required": ["name"]
  }
}
```

### 2. Code Execution

#### JavaScript Execution
```typescript
// API Usage
POST /api/v1/tools/code/execute
{
  "code": "console.log('Hello, World!');",
  "language": "javascript",
  "input": "",
  "timeout": 5000
}

// Response
{
  "output": "Hello, World!\n",
  "error": null,
  "exit_code": 0,
  "execution_time": 45,
  "memory_usage": 1024000
}
```

### 3. File Uploads

#### Get Upload URL
```typescript
// API Usage
POST /api/v1/upload/sign
{
  "filename": "data.json",
  "content_type": "application/json",
  "size": 1024
}

// Response
{
  "upload_url": "https://upload.r2.cloudflarestorage.com/...",
  "file_id": "uuid-string",
  "expires_at": 1696754400
}
```

## Testing Your Implementation

### 1. Manual Testing
```bash
# Test JSON formatting
curl -X POST http://localhost:8787/v1/tools/json/format \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{"json":"{\"test\":true}","indent":2}'

# Test code execution
curl -X POST http://localhost:8787/v1/tools/code/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{"code":"console.log(\"test\")","language":"javascript"}'
```

### 2. Automated Testing
```bash
# Run the contract tests we created
pnpm test:contract json-format

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

### 3. Performance Testing
```bash
# Load test the JSON formatting endpoint
pnpm test:performance json-format

# Memory usage testing
pnpm test:memory
```

## Deployment

### 1. Preview Deployment
```bash
# Deploy to staging
pnpm deploy:staging

# Test staging environment
curl https://api-staging.yourdomain.com/v1/tools
```

### 2. Production Deployment
```bash
# Deploy to production
pnpm deploy:prod

# Run production health checks
pnpm health:check:prod
```

### 3. Monitoring Setup
```bash
# Configure Sentry error tracking
export SENTRY_DSN=<your-sentry-dsn>
pnpm run sentry:setup

# Set up Cloudflare Analytics
# https://dash.cloudflare.com/analytics
```

## Common Issues & Solutions

### 1. Database Connection Issues
```bash
# Check D1 database status
wrangler d1 info parsify-dev

# Test database connection
wrangler d1 execute parsify-dev --command "SELECT 1"
```

### 2. WASM Compilation Errors
```bash
# Clear WASM cache
pnpm run clean:wasm

# Rebuild WASM modules
pnpm build:wasm
```

### 3. Rate Limiting Issues
```bash
# Check rate limiter status
curl http://localhost:8787/v1/admin/rate-limits

# Reset rate limits (development only)
pnpm run dev:reset-rate-limits
```

### 4. File Upload Problems
```bash
# Check R2 bucket permissions
wrangler r2 object list parsify-files-dev

# Test file upload
pnpm test:upload
```

## MVP Validation Checklist

### ✅ Core Functionality
- [ ] JSON formatting works correctly
- [ ] JSON validation with schema support
- [ ] Basic code execution (JavaScript, Python)
- [ ] File upload/download functionality
- [ ] User authentication (OAuth)
- [ ] Rate limiting enforcement

### ✅ Performance Requirements
- [ ] API responses <200ms p95
- [ ] JSON formatting <50ms for 1MB files
- [ ] Code execution <5s timeout
- [ ] Frontend load time <3s

### ✅ Security Requirements
- [ ] WASM sandbox isolation
- [ ] No external network access from code execution
- [ ] Rate limiting per user/IP
- [ ] File auto-cleanup (72h)
- [ ] JWT authentication

### ✅ Testing Coverage
- [ ] Unit tests >90% coverage
- [ ] Integration tests for all API endpoints
- [ ] E2E tests for critical user flows
- [ ] Contract tests for API specifications
- [ ] Performance tests for core functionality

## Next Steps

### Post-MVP Features
1. **Additional Tools**: Image processing, network tools, encryption
2. **User Management**: Profile management, preferences
3. **Premium Features**: Subscription system, advanced quotas
4. **Admin Dashboard**: User analytics, system monitoring

### Scaling Considerations
1. **Database Optimization**: Query optimization, indexing strategy
2. **Caching Strategy**: KV caching for frequently accessed data
3. **Load Balancing**: Geographic distribution, edge computing
4. **Monitoring**: Advanced analytics, alerting systems

## Support & Resources

### Documentation
- [API Reference](./contracts/openapi.yaml)
- [Data Model](./data-model.md)
- [Research Findings](./research.md)

### Tools & Resources
- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Hono Framework](https://hono.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

### Getting Help
- Create an issue in the repository
- Check the [FAQ](../../docs/faq.md)
- Review [troubleshooting guide](../../docs/troubleshooting.md)
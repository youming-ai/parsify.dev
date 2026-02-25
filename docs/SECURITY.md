# Security Best Practices for parsify.dev

This document outlines security considerations and best practices for the parsify.dev platform running on Cloudflare Workers via vinext.

## Environment Variables & Secrets

### Production Secrets (Never Commit)

**Always use Cloudflare Workers Secrets for sensitive data:**

```bash
# ✅ Correct - Encrypted at rest
wrangler secret put GROQ_API_KEY

# ❌ Wrong - Visible in plaintext
export GROQ_API_KEY=gsk_...
```

### Secret Management

```bash
# List all secrets
wrangler secret list

# Bulk update secrets
wrangler secret bulk .dev.vars
```

## API Route Security

### AI API Route ([`src/app/api/ai/groq/route.ts`](../src/app/api/ai/groq/route.ts))

#### Implemented Security Measures

1. **CORS Protection**
   ```typescript
   const configuredAllowedOrigin = process.env['ALLOWED_ORIGIN']?.trim() || 'https://parsify.dev';
   const allowedOrigins = new Set([configuredAllowedOrigin]);
   ```

2. **Rate Limiting**
   - 10 requests per minute per IP
   - In-memory storage (consider KV for production)

3. **Input Validation**
   - Zod schema validation
   - Max prompt length: 12,000 characters
   - Max body size: 50KB

4. **Model Whitelisting**
   ```typescript
   const ALLOWED_GROQ_MODELS = new Set([
     'llama-3.3-70b-versatile',
     'llama-3.1-8b-instant',
     'deepseek-r1-distill-llama-70b',
     'qwen-qwq-32b',
   ]);
   ```

5. **IP Validation**
   - Cloudflare connecting IP header
   - X-Forwarded-For fallback

#### Production Recommendations

**For distributed rate limiting across multiple Workers:**

1. **Create KV Namespace**
   ```bash
   wrangler kv:namespace create RATE_LIMIT
   ```

2. **Update wrangler.toml**
   ```toml
   [[kv_namespaces]]
   binding = "RATE_LIMIT"
   id = "your-kv-namespace-id"
   ```

3. **Modify API Route**
   ```typescript
   export interface Env {
     RATE_LIMIT: KVNamespace;
   }

   // Use KV instead of in-memory Map
   async function isRateLimited(ip: string, env: Env): Promise<boolean> {
     const key = `rate_limit:${ip}`;
     const data = await env.RATE_LIMIT.get(key, 'json');
     // ... implementation
   }
   ```

## Content Security Policy

### Headers Configuration

[`next.config.ts`](../next.config.ts) includes cache headers:

```typescript
async headers() {
  return [
    {
      source: '/_next/static/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' },
      ],
    },
  ];
}
```

### Recommended CSP Headers

Add to your routes or middleware:

```typescript
export const headers = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://parsify.dev https://*.parsify.dev",
    "font-src 'self' data:",
    "connect-src 'self' https://api.groq.com",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

## Input Sanitization

### DOMPurify Usage

The project uses DOMPurify for HTML sanitization:

```typescript
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href'],
});
```

### XSS Prevention

1. **Never use `dangerouslySetInnerHTML` with untrusted data**
2. **Always sanitize HTML with DOMPurify**
3. **Use TypeScript for type safety**
4. **Validate all API inputs with Zod**

## Rate Limiting Strategies

### Current Implementation

In-memory rate limiting (per Worker instance):

```typescript
const rateLimitStore = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recentRequests = existing.filter((timestamp) => timestamp > windowStart);
  return recentRequests.length >= RATE_LIMIT_MAX_REQUESTS;
}
```

### Production Recommendations

1. **Cloudflare KV** - For distributed rate limiting
2. **Cloudflare Durable Objects** - For coordinated rate limiting
3. **Cloudflare API Shield** - For advanced DDoS protection

## Image Security

### Configuration

[`next.config.ts`](../next.config.ts):

```typescript
images: {
  unoptimized: true,
  remotePatterns: [
    { protocol: 'https', hostname: 'parsify.dev' },
    { protocol: 'https', hostname: '*.parsify.dev' },
  ],
}
```

### Best Practices

1. ✅ **Restrictive patterns** - Only allowed domains
2. ✅ **HTTPS only** - No HTTP images
3. ⚠️ **Wildcard subdomain** - Consider explicit list

**Recommended improvement:**

```typescript
remotePatterns: [
  { protocol: 'https', hostname: 'parsify.dev' },
  { protocol: 'https', hostname: 'cdn.parsify.dev' },
  { protocol: 'https', hostname: 'assets.parsify.dev' },
],
```

## Dependency Security

### Regular Updates

```bash
# Check for vulnerabilities
bun audit

# Update dependencies
bun update

# Check outdated packages
bun outdated
```

### Security Scanning

Add to CI/CD:

```yaml
- name: Security Audit
  run: bun audit && bunx audit-ci --config audit-ci.json
```

## Deployment Security

### Wrangler Secrets

```bash
# Never commit secrets to git
echo "*.dev.vars" >> .gitignore
echo ".wrangler/state" >> .gitignore

# Use environment-specific secrets
wrangler secret put GROQ_API_KEY --env production
wrangler secret put GROQ_API_KEY --env staging
```

### Access Control

1. **Limit who can deploy**
   ```bash
   # Cloudflare API tokens
   # Create restricted tokens with Workers deployment permissions
   ```

2. **Require 2FA** for Cloudflare account

3. **Audit logs** - Regularly review deployment history

## Monitoring & Alerting

### Key Metrics

1. **Error Rate** - Unexpected spikes may indicate attacks
2. **Response Time** - Degradation may indicate DoS
3. **Rate Limit Hits** - High rate may indicate abuse
4. **Failed Validations** - May indicate probing

### Alerts Setup

```javascript
// Cloudflare Workers Analytics
// Set up alerts for:
// - Error rate > 5%
// - P95 latency > 1s
// - 429 responses > 10%
```

## OWASP Top 10 Coverage

| Risk | Mitigation | Status |
|------|-----------|--------|
| A01:2021 – Broken Access Control | CORS validation, origin checks | ✅ |
| A02:2021 – Cryptographic Failures | HTTPS only, secure headers | ✅ |
| A03:2021 – Injection | Zod validation, DOMPurify sanitization | ✅ |
| A04:2021 – Insecure Design | Rate limiting, model whitelisting | ✅ |
| A05:2021 – Security Misconfiguration | Security headers, CSP | ⚠️ Partial |
| A06:2021 – Vulnerable Components | Dependency audits | ✅ |
| A07:2021 – Authentication Failures | N/A (no user auth) | N/A |
| A08:2021 – Software/Data Integrity | N/A | N/A |
| A09:2021 – Security Logging | Cloudflare analytics | ⚠️ Basic |
| A10:2021 – Server-Side Request Forgery | Model whitelisting, input validation | ✅ |

## Checklist

### Pre-Deployment

- [ ] All secrets set via `wrangler secret`
- [ ] No secrets in `.env` files committed to git
- [ ] CORS origin validation configured
- [ ] Rate limiting tested
- [ ] Input validation tested
- [ ] Dependencies audited
- [ ] Security headers configured
- [ ] CSP policy defined
- [ ] Error monitoring configured

### Post-Deployment

- [ ] Monitor error rates
- [ ] Check rate limit effectiveness
- [ ] Review Cloudflare analytics
- [ ] Test failover scenarios
- [ ] Verify cache headers working

## Incident Response

### Security Incident Steps

1. **Identify** - Monitor alerts and metrics
2. **Contain** - Rotate secrets, update rate limits
3. **Eradicate** - Patch vulnerabilities
4. **Recover** - Deploy fixes, verify
5. **Post-Mortem** - Document and learn

### Emergency Contacts

- Cloudflare Support: https://support.cloudflare.com/
- Security email: security@parsify.dev

---

**Last updated**: February 25, 2026
**Next review**: March 25, 2026

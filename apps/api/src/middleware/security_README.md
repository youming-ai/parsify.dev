# Security Middleware

This middleware provides comprehensive security features for Hono applications running on Cloudflare Workers, including CORS configuration, security headers, Content Security Policy (CSP), and integration with other middleware components.

## Features

- **CORS Configuration**: Flexible cross-origin resource sharing with support for environment-specific settings
- **Security Headers**: Comprehensive security headers including HSTS, X-Frame-Options, CSP, etc.
- **Content Security Policy**: Configurable CSP with nonce support and reporting
- **Environment-Specific Configurations**: Different security settings for development, staging, and production
- **Path-Specific Security**: Different security configurations for different API paths
- **Custom Validation**: Support for custom security validation functions
- **Rate Limiting Integration**: Seamless integration with rate limiting middleware
- **Security Violation Logging**: Comprehensive logging and monitoring of security events
- **Cloudflare Workers Optimization**: Designed specifically for Cloudflare Workers environment

## Installation

The middleware is located at `src/middleware/security.ts`. Import it in your application:

```typescript
import { securityMiddleware, SecurityPresets } from './middleware/security'
```

## Basic Usage

### Simple Security Middleware

```typescript
import { Hono } from 'hono'
import { securityMiddleware } from './middleware/security'

const app = new Hono()

app.use('*', securityMiddleware({
  cors: {
    origin: ['https://example.com'],
    credentials: true
  },
  security: {
    hsts: { enabled: true, maxAge: 31536000 },
    frameOptions: 'DENY'
  }
}))
```

### Using Security Presets

```typescript
import { createDevelopmentSecurity, createProductionSecurity } from './middleware/security'

// Development configuration with relaxed security
app.use('*', createDevelopmentSecurity())

// Production configuration with strict security
app.use('*', createProductionSecurity())
```

## Configuration Options

### CORS Configuration

```typescript
cors: {
  origin: string | string[] | boolean | ((origin: string, c: Context) => Promise<boolean>)
  allowMethods?: string[]        // Default: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  allowHeaders?: string[]        // Default: ['Content-Type', 'Authorization', 'X-Requested-With', ...]
  exposeHeaders?: string[]       // Default: ['X-Total-Count', 'X-Rate-Limit-Remaining', ...]
  credentials?: boolean          // Default: false
  maxAge?: number               // Default: 86400 (24 hours)
  optionsSuccessStatus?: number // Default: 204
}
```

### Content Security Policy

```typescript
csp: {
  defaultSrc?: string[]         // Default: ["'self'"]
  scriptSrc?: string[]          // Default: ["'self'", "'unsafe-inline'"]
  styleSrc?: string[]           // Default: ["'self'", "'unsafe-inline'"]
  imgSrc?: string[]             // Default: ["'self'", 'data:', 'https:']
  connectSrc?: string[]         // Default: ["'self'"]
  fontSrc?: string[]            // Default: ["'self'", 'data:']
  objectSrc?: string[]          // Default: ["'none'"]
  mediaSrc?: string[]           // Default: ["'self'"]
  frameSrc?: string[]           // Default: ["'none'"]
  childSrc?: string[]           // Default: ["'none'"]
  workerSrc?: string[]          // Default: ["'self'"]
  manifestSrc?: string[]        // Default: ["'self'"]
  upgradeInsecureRequests?: boolean // Default: false
  blockAllMixedContent?: boolean   // Default: false
  reportUri?: string            // CSP violation report endpoint
  reportOnly?: boolean          // Default: false
}
```

### Security Headers

```typescript
security: {
  hsts?: {
    enabled: boolean            // Default: false
    maxAge: number             // Default: 31536000 (1 year)
    includeSubDomains: boolean // Default: true
    preload: boolean           // Default: false
  }
  frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'  // Default: 'SAMEORIGIN'
  frameOptionsAllowFrom?: string // Used when frameOptions is 'ALLOW-FROM'
  contentTypeOptions?: boolean     // Default: true
  xssProtection?: boolean         // Default: true
  referrerPolicy?: string         // Default: 'strict-origin-when-cross-origin'
  permissionsPolicy?: Record<string, string[]>  // Default: {}
  customHeaders?: Record<string, string>         // Default: {}
}
```

### Rate Limiting Headers

```typescript
rateLimitHeaders: {
  enabled: boolean    // Default: true
  hideLimit?: boolean // Default: false
  hideRemaining?: boolean // Default: false
  hideReset?: boolean     // Default: false
}
```

## Advanced Usage

### Environment-Specific Configuration

```typescript
app.use('*', securityMiddleware({
  // Base configuration
  cors: { origin: ['https://parsify.dev'] },
  
  // Environment-specific overrides
  environments: {
    development: {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173'],
        allowHeaders: ['*']
      },
      csp: { reportOnly: true },
      security: { hsts: { enabled: false } },
      enableLogging: true,
      logLevel: 'debug'
    },
    
    production: {
      cors: { origin: ['https://parsify.dev', 'https://app.parsify.dev'] },
      csp: { upgradeInsecureRequests: true },
      security: {
        hsts: { 
          enabled: true, 
          maxAge: 31536000, 
          includeSubDomains: true, 
          preload: true 
        },
        frameOptions: 'DENY'
      },
      enableLogging: true,
      logLevel: 'error'
    }
  }
}))
```

### Path-Specific Security

```typescript
app.use('*', securityMiddleware({
  // Default configuration
  cors: { origin: ['https://parsify.dev'] },
  
  // Path-specific configurations
  paths: {
    '/api/v1/public': {
      cors: { origin: '*', credentials: false },
      security: { frameOptions: 'DENY' }
    },
    
    '/api/v1/admin': {
      cors: { origin: ['https://admin.parsify.dev'] },
      security: { 
        frameOptions: 'DENY',
        permissionsPolicy: { 'geolocation': [] }
      },
      customValidation: async (c) => {
        const auth = c.get('auth')
        return auth?.isAuthenticated && auth.user?.role === 'admin'
      }
    }
  }
}))
```

### Custom Validation

```typescript
app.use('*', securityMiddleware({
  cors: { origin: ['https://example.com'] },
  
  customValidation: async (c) => {
    const clientIP = c.req.header('CF-Connecting-IP')
    const userAgent = c.req.header('User-Agent')
    
    // Block suspicious user agents
    if (userAgent && isSuspiciousUserAgent(userAgent)) {
      return false
    }
    
    // Additional IP-based checks
    const isBlacklisted = await checkIPBlacklist(clientIP)
    return !isBlacklisted
  }
}))
```

### Dynamic Origin Validation

```typescript
app.use('*', securityMiddleware({
  cors: {
    origin: async (origin, c) => {
      // Database lookup for allowed origins
      const allowedOrigins = await getAllowedOriginsFromDatabase()
      
      // Support for wildcard patterns
      return allowedOrigins.some(allowed => {
        if (allowed === '*') return true
        if (allowed === origin) return true
        
        const pattern = allowed.replace(/\*/g, '.*')
        const regex = new RegExp(`^${pattern}$`)
        return regex.test(origin)
      })
    },
    credentials: true
  }
}))
```

### CSP with Nonce Support

```typescript
// Generate nonce for each request
app.use('*', async (c, next) => {
  const nonce = crypto.randomUUID()
  c.set('cspNonce', nonce)
  await next()
})

app.use('*', securityMiddleware({
  csp: {
    scriptSrc: ["'self'", (c) => `'nonce-${c.get('cspNonce')}'`],
    styleSrc: ["'self'", (c) => `'nonce-${c.get('cspNonce')}'`],
    reportUri: '/api/v1/security/csp-report'
  }
}))
```

## Integration with Other Middleware

### With Authentication Middleware

```typescript
import { authMiddleware, requireSubscriptionTier } from './middleware/auth'

// Apply security middleware first
app.use('*', securityMiddleware(SecurityPresets.PRODUCTION))

// Then apply authentication for protected routes
app.use('/api/v1/protected/*', authMiddleware({ required: true }))
app.use('/api/v1/premium/*', requireSubscriptionTier('pro'))
```

### With Rate Limiting Middleware

```typescript
import { rateLimitMiddleware, RateLimitPresets } from './middleware/rate_limit'

app.use('*', securityMiddleware(SecurityPresets.PRODUCTION))
app.use('*', rateLimitMiddleware(RateLimitPresets.API_DEFAULT))
```

### Full Integration Example

```typescript
import { Hono } from 'hono'
import { securityMiddleware, SecurityPresets } from './middleware/security'
import { errorMiddleware } from './middleware/error'
import { rateLimitMiddleware, RateLimitPresets } from './middleware/rate_limit'
import { authMiddleware } from './middleware/auth'

const app = new Hono()

// 1. Error handling first (to catch all errors)
app.use('*', errorMiddleware())

// 2. Security middleware
app.use('*', securityMiddleware({
  environments: {
    development: SecurityPresets.DEVELOPMENT,
    production: SecurityPresets.PRODUCTION
  },
  paths: {
    '/api/v1/public': SecurityPresets.PUBLIC_API,
    '/api/v1/admin': SecurityPresets.ADMIN
  }
}))

// 3. Rate limiting
app.use('*', rateLimitMiddleware(RateLimitPresets.API_DEFAULT))

// 4. Authentication (optional for public endpoints)
app.use('/api/v1/protected/*', authMiddleware({ required: true }))

// Your routes
app.get('/api/v1/public/data', (c) => c.json({ public: true }))
app.get('/api/v1/protected/profile', (c) => c.json({ protected: true }))
```

## Security Presets

### Development Preset
- Relaxed CORS for local development
- CSP in report-only mode
- HSTS disabled
- Debug logging enabled

### Production Preset
- Strict CORS configuration
- Comprehensive CSP with HTTPS upgrade
- HSTS with preload support
- Security headers at maximum security

### Public API Preset
- CORS with wildcard origin
- Minimal CSP for API endpoints
- No credentials required
- Optimized for public consumption

### Admin Preset
- Strictest CORS configuration
- Comprehensive CSP
- Custom validation for admin access
- Enhanced security headers

## Helper Functions

### Origin Validation
```typescript
import { createOriginValidator } from './middleware/security'

const validator = createOriginValidator(['https://example.com', 'https://*.test.com'])
const isValid = validator('https://api.test.com') // true
```

### CSP Directive Creation
```typescript
import { createCSPDirective } from './middleware/security'

const directive = createCSPDirective(["'self'", 'https://example.com'])
// Returns: "'self' https://example.com"
```

### Permissions Policy Creation
```typescript
import { createPermissionsPolicy } from './middleware/security'

const policy = createPermissionsPolicy({
  'geolocation': ['self'],
  'camera': []
})
// Returns: "geolocation=(self), camera=()"
```

### Security Utilities
```typescript
import { isSecureConnection, getClientOrigin, isAPIRequest } from './middleware/security'

const isSecure = isSecureConnection(context)
const origin = getClientOrigin(context)
const isApi = isAPIRequest(context)
```

## Security Violation Logging

The middleware automatically logs security violations including:
- CORS violations
- CSP violations (if reportUri is configured)
- Custom validation failures
- Rate limit violations

Logs are stored in Cloudflare KV for analysis and monitoring.

## Best Practices

1. **Environment-Specific Configuration**: Always use different security settings for development and production
2. **Principle of Least Privilege**: Only enable features and headers that you actually need
3. **Regular Updates**: Keep security configurations updated based on new threats and requirements
4. **Monitoring**: Enable security violation logging and monitor for unusual patterns
5. **Testing**: Test security configurations in all environments before deployment
6. **CSP in Report-Only Mode**: Use CSP report-only mode initially to avoid breaking legitimate functionality

## Migration Guide

### From Basic CORS

If you're currently using Hono's basic CORS middleware:

```typescript
// Before
import { cors } from 'hono/cors'
app.use('*', cors({ origin: '*' }))

// After
import { securityMiddleware } from './middleware/security'
app.use('*', securityMiddleware({
  cors: { origin: '*' }
}))
```

### Adding Security Headers

```typescript
// Before: No security headers
app.use('*', someMiddleware())

// After: Add comprehensive security headers
app.use('*', securityMiddleware({
  security: {
    hsts: { enabled: true, maxAge: 31536000 },
    frameOptions: 'DENY',
    contentTypeOptions: true,
    xssProtection: true
  }
}))
```

## Troubleshooting

### CORS Issues
1. Check that the origin is properly configured
2. Verify that credentials setting matches your frontend requirements
3. Ensure preflight requests are properly handled

### CSP Violations
1. Use report-only mode initially to identify violations
2. Check browser console for CSP violation reports
3. Gradually tighten CSP policies

### Security Headers Not Appearing
1. Ensure HSTS is only enabled with HTTPS
2. Check that custom headers don't conflict with reserved headers
3. Verify middleware order (security middleware should run early)

### Performance Considerations
1. Custom validation functions should be efficient
2. Avoid complex database lookups in origin validation
3. Use caching for frequently accessed security data

## Examples

See `security_examples.ts` for comprehensive usage examples covering:
- Basic security middleware setup
- Environment-specific configurations
- Path-specific security policies
- Integration with authentication and rate limiting
- Dynamic origin validation
- API gateway patterns
- CSP with nonce support

## Testing

Run the test suite to verify middleware functionality:

```bash
npm test -- security
```

The tests cover:
- CORS configuration and validation
- Security header application
- CSP generation and enforcement
- Environment-specific behavior
- Custom validation scenarios
- Error handling and logging
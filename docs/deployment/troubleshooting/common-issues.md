# Common Issues and Solutions

This guide covers the most frequently encountered issues during deployment and operation of the Parsify platform.

## Table of Contents

- [Build and Deployment Issues](#build-and-deployment-issues)
- [Configuration Issues](#configuration-issues)
- [Performance Issues](#performance-issues)
- [Database Issues](#database-issues)
- [API Issues](#api-issues)
- [Frontend Issues](#frontend-issues)
- [Authentication Issues](#authentication-issues)
- [File Processing Issues](#file-processing-issues)

## Build and Deployment Issues

### Issue: Build Fails with TypeScript Errors

**Symptoms**:
```
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Causes**:
- Type mismatches in code
- Missing type definitions
- Incorrect TypeScript configuration

**Solutions**:

1. **Check TypeScript Configuration**:
   ```bash
   # Verify tsconfig.json
   cat tsconfig.json
   
   # Check for type errors
   pnpm run type-check
   ```

2. **Fix Type Issues**:
   ```bash
   # Install missing types
   pnpm add @types/node @types/react @types/uuid
   
   # Run type checking with verbose output
   pnpm run type-check --noEmit --pretty
   ```

3. **Update Dependencies**:
   ```bash
   # Update TypeScript and related packages
   pnpm update typescript @types/node @types/react
   ```

### Issue: Wrangler Deployment Fails

**Symptoms**:
```
Error: Account ID not found. Please set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
```

**Causes**:
- Missing or incorrect Cloudflare credentials
- Insufficient permissions
- Account configuration issues

**Solutions**:

1. **Verify Credentials**:
   ```bash
   # Check if authenticated
   wrangler whoami
   
   # Re-authenticate if needed
   wrangler auth login
   ```

2. **Check Environment Variables**:
   ```bash
   # Verify required environment variables
   echo $CLOUDFLARE_API_TOKEN
   echo $CLOUDFLARE_ACCOUNT_ID
   
   # Set missing variables
   export CLOUDFLARE_API_TOKEN="your-token"
   export CLOUDFLARE_ACCOUNT_ID="your-account-id"
   ```

3. **Verify Configuration**:
   ```bash
   # Check wrangler.toml
   cat apps/api/wrangler.toml
   
   # Validate configuration
   wrangler validate
   ```

### Issue: Vercel Deployment Fails

**Symptoms**:
```
Error: Build failed with exit code 1
```

**Causes**:
- Build script errors
- Missing dependencies
- Environment variable issues

**Solutions**:

1. **Check Build Configuration**:
   ```bash
   # Verify build command
   cat package.json | grep -A 5 "scripts"
   
   # Test build locally
   pnpm run build
   ```

2. **Verify Environment Variables**:
   ```bash
   # List environment variables
   vercel env ls
   
   # Add missing variables
   vercel env add VARIABLE_NAME
   ```

3. **Check Dependencies**:
   ```bash
   # Install dependencies
   pnpm install
   
   # Clear cache and reinstall
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

## Configuration Issues

### Issue: Environment Variables Not Loading

**Symptoms**:
```
ReferenceError: DATABASE_URL is not defined
```

**Causes**:
- Missing .env files
- Incorrect variable names
- Permission issues

**Solutions**:

1. **Check Environment Files**:
   ```bash
   # List environment files
   ls -la .env*
   
   # Verify variable format
   cat .env.production
   ```

2. **Debug Variable Loading**:
   ```bash
   # Check if variables are loaded
   node -e "console.log(process.env.DATABASE_URL)"
   
   # Load variables manually
   source .env.production
   ```

3. **Verify Service Configuration**:
   ```bash
   # Check Wrangler secrets
   wrangler secret list --env production
   
   # Add missing secrets
   wrangler secret put DATABASE_SECRET --env production
   ```

### Issue: CORS Errors in Browser

**Symptoms**:
```
Access to fetch at 'https://api.parsify.dev' from origin 'https://parsify.dev' has been blocked by CORS policy
```

**Causes**:
- Missing CORS configuration
- Incorrect allowed origins
- Preflight request issues

**Solutions**:

1. **Check CORS Configuration**:
   ```bash
   # Verify CORS settings in API
   curl -I -H "Origin: https://parsify.dev" https://api.parsify.dev/health
   
   # Check response headers
   curl -v https://api.parsify.dev/health
   ```

2. **Update CORS Settings**:
   ```typescript
   // In API code
   const corsHeaders = {
     'Access-Control-Allow-Origin': 'https://parsify.dev',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
   };
   ```

3. **Test Preflight Requests**:
   ```bash
   # Test OPTIONS request
   curl -X OPTIONS -H "Origin: https://parsify.dev" \
        -H "Access-Control-Request-Method: POST" \
        https://api.parsify.dev/endpoint
   ```

## Performance Issues

### Issue: Slow API Response Times

**Symptoms**:
- API requests taking > 2 seconds
- Timeouts during high traffic
- Poor user experience

**Causes**:
- Database query inefficiencies
- High CPU usage
- Memory leaks
- Network latency

**Solutions**:

1. **Monitor Performance Metrics**:
   ```bash
   # Check API response times
   curl -w "@curl-format.txt" https://api.parsify.dev/health
   
   # Run performance tests
   pnpm run test:performance:ci
   ```

2. **Analyze Database Queries**:
   ```bash
   # Check slow queries
   wrangler d1 execute parsify-prod --command="
     SELECT query, time FROM sqlite_master 
     WHERE type = 'index' AND name LIKE '%slow%';
   " --env production
   
   # Analyze query plan
   wrangler d1 execute parsify-prod --command="
     EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'test@example.com';
   " --env production
   ```

3. **Optimize Code**:
   ```typescript
   // Add caching
   const cachedData = await cache.get(key);
   if (cachedData) return cachedData;
   
   // Use pagination
   const data = await db.query('SELECT * FROM table LIMIT ? OFFSET ?', [limit, offset]);
   
   // Add indexes
   await db.execute('CREATE INDEX idx_users_email ON users(email)');
   ```

### Issue: High Memory Usage

**Symptoms**:
- Out of memory errors
- Service crashes
- Poor performance

**Causes**:
- Memory leaks
- Large file processing
- Inefficient data structures

**Solutions**:

1. **Monitor Memory Usage**:
   ```bash
   # Check memory metrics
   curl https://api.parsify.dev/metrics | grep memory
   
   # Monitor in real-time
   wrangler tail --env production --format=json | jq '.memoryUsage'
   ```

2. **Optimize Memory Usage**:
   ```typescript
   // Process data in chunks
   for (const chunk of chunks) {
     await processChunk(chunk);
   }
   
   // Clear references
   largeArray = null;
   
   // Use streams for file processing
   const stream = fs.createReadStream(filePath);
   ```

## Database Issues

### Issue: Database Connection Failures

**Symptoms**:
```
Error: Unable to connect to database
```

**Causes**:
- Incorrect database configuration
- Network issues
- Database unavailable

**Solutions**:

1. **Check Database Connectivity**:
   ```bash
   # Test database connection
   wrangler d1 info parsify-prod --env production
   
   # Run simple query
   wrangler d1 execute parsify-prod --command="SELECT 1;" --env production
   ```

2. **Verify Database Configuration**:
   ```bash
   # Check database bindings
   wrangler whoami
   wrangler list
   
   # Verify database ID
   cat apps/api/wrangler.toml | grep -A 5 'd1_databases'
   ```

3. **Restart Services**:
   ```bash
   # Redeploy to fix connection issues
   cd apps/api
   wrangler deploy --env production
   ```

### Issue: Database Lock Contention

**Symptoms**:
- Query timeouts
- Slow updates
- Deadlock errors

**Causes**:
- Long-running transactions
- Concurrent access conflicts
- Inefficient queries

**Solutions**:

1. **Monitor Lock Activity**:
   ```bash
   # Check for long-running queries
   wrangler d1 execute parsify-prod --command="
     SELECT * FROM sqlite_master 
     WHERE type = 'table' AND name LIKE '%lock%';
   " --env production
   ```

2. **Optimize Transactions**:
   ```typescript
   // Keep transactions short
   await db.transaction(async (tx) => {
     await tx.execute('UPDATE users SET status = ? WHERE id = ?', ['active', userId]);
     // Avoid long operations in transactions
   });
   
   // Use optimistic locking
   await tx.execute(
     'UPDATE users SET version = version + 1, data = ? WHERE id = ? AND version = ?',
     [newData, userId, currentVersion]
   );
   ```

## API Issues

### Issue: 500 Internal Server Errors

**Symptoms**:
- API returning 500 errors
- Uncaught exceptions
- Service crashes

**Causes**:
- Unhandled exceptions
- Configuration errors
- Resource exhaustion

**Solutions**:

1. **Check Error Logs**:
   ```bash
   # View real-time logs
   wrangler tail --env production
   
   # Filter error logs
   wrangler tail --env production | grep ERROR
   ```

2. **Add Error Handling**:
   ```typescript
   // Global error handler
   app.use((err, req, res, next) => {
     console.error('Unhandled error:', err);
     res.status(500).json({ error: 'Internal server error' });
   });
   
   // Specific error handling
   try {
     const result = await riskyOperation();
     res.json(result);
   } catch (error) {
     console.error('Operation failed:', error);
     res.status(500).json({ error: 'Operation failed' });
   }
   ```

3. **Monitor Health**:
   ```bash
   # Health check
   curl -f https://api.parsify.dev/health
   
   # Detailed health check
   curl https://api.parsify.dev/health/detailed
   ```

### Issue: Rate Limiting Issues

**Symptoms**:
```
429 Too Many Requests
```

**Causes**:
- Exceeding rate limits
- Bot traffic
- DDoS attacks

**Solutions**:

1. **Check Rate Limiting Rules**:
   ```bash
   # Verify rate limiting configuration
   curl -I https://api.parsify.dev/health
   # Look for rate limit headers
   ```

2. **Implement Rate Limiting**:
   ```typescript
   // Add rate limiting middleware
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: 'Too many requests from this IP'
   });
   
   app.use('/api/', limiter);
   ```

## Frontend Issues

### Issue: Application Not Loading

**Symptoms**:
- Blank white screen
- JavaScript errors
- Loading spinner stuck

**Causes**:
- Build errors
- Network issues
- API connectivity problems

**Solutions**:

1. **Check Browser Console**:
   ```javascript
   // Open browser console and look for errors
   // Common errors to check:
   // - Uncaught TypeError
   // - Failed to load resource
   // - Network errors
   ```

2. **Verify Build Assets**:
   ```bash
   # Check if build completed successfully
   ls -la apps/web/dist/
   
   # Verify asset URLs
   curl -I https://parsify.dev/_next/static/css/app.css
   ```

3. **Test API Connectivity**:
   ```bash
   # Check if API is accessible
   curl https://api.parsify.dev/health
   
   # Test from browser
   fetch('https://api.parsify.dev/health')
     .then(r => r.json())
     .then(console.log);
   ```

### Issue: State Management Issues

**Symptoms**:
- UI not updating
- State inconsistencies
- React hydration errors

**Causes**:
- Incorrect state management
- Race conditions
- Server-side rendering issues

**Solutions**:

1. **Debug State Issues**:
   ```javascript
   // Add state debugging
   console.log('Current state:', state);
   
   // Check for state updates
   useEffect(() => {
     console.log('State updated:', state);
   }, [state]);
   ```

2. **Fix Hydration Issues**:
   ```typescript
   // Use dynamic imports for client-only code
   dynamic(() => import('./Component'), {
     ssr: false
   });
   
   // Check for window object usage
   if (typeof window !== 'undefined') {
     // Client-side only code
   }
   ```

## Authentication Issues

### Issue: JWT Token Errors

**Symptoms**:
```
401 Unauthorized - Invalid token
```

**Causes**:
- Expired tokens
- Invalid signatures
- Configuration issues

**Solutions**:

1. **Verify Token Configuration**:
   ```bash
   # Check JWT secret
   wrangler secret list --env production | grep JWT
   
   # Test token validation
   curl -H "Authorization: Bearer YOUR_TOKEN" https://api.parsify.dev/protected
   ```

2. **Debug Token Issues**:
   ```javascript
   // Decode token to check contents
   const decoded = jwt.decode(token, {complete: true});
   console.log('Token payload:', decoded.payload);
   
   // Check expiration
   const now = Date.now() / 1000;
   if (decoded.payload.exp < now) {
     console.log('Token expired');
   }
   ```

## File Processing Issues

### Issue: Large File Upload Failures

**Symptoms**:
- Upload timeouts
- Memory errors
- Connection failures

**Causes**:
- File size limits
- Timeout settings
- Memory limitations

**Solutions**:

1. **Check File Size Limits**:
   ```bash
   # Verify upload limits
   curl -I https://api.parsify.dev/upload
   # Check for content-length limits
   ```

2. **Implement Chunked Upload**:
   ```typescript
   // Split large files into chunks
   const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
   
   async function uploadInChunks(file: File) {
     const chunks = Math.ceil(file.size / CHUNK_SIZE);
     
     for (let i = 0; i < chunks; i++) {
       const start = i * CHUNK_SIZE;
       const end = Math.min(file.size, start + CHUNK_SIZE);
       const chunk = file.slice(start, end);
       
       await uploadChunk(chunk, i, chunks);
     }
   }
   ```

3. **Add Progress Tracking**:
   ```typescript
   // Add upload progress
   const formData = new FormData();
   formData.append('file', file);
   
   const xhr = new XMLHttpRequest();
   xhr.upload.addEventListener('progress', (e) => {
     const progress = (e.loaded / e.total) * 100;
     console.log(`Upload progress: ${progress}%`);
   });
   ```

## Emergency Procedures

### When to Use Emergency Procedures

- **Critical Service Impact**: > 50% of users affected
- **Security Breach**: Data compromise detected
- **Data Loss**: Critical data corrupted or lost
- **Extended Downtime**: Service unavailable > 30 minutes

### Immediate Actions

1. **Assess Impact**: Determine severity and affected users
2. **Communicate**: Notify stakeholders immediately
3. **Contain**: Isolate the issue to prevent further damage
4. **Recover**: Implement fix or rollback
5. **Document**: Record all actions and decisions

### Contact Information

- **On-call Engineer**: [Phone Number]
- **Engineering Lead**: [Phone Number]
- **DevOps Team**: [Slack Channel]
- **Security Team**: [Email Address]

## Related Documents

- [Emergency Response Procedures](../emergency/incident-response.md)
- [Performance Troubleshooting](./performance.md)
- [Database Troubleshooting](./database.md)
- [Network Troubleshooting](./network.md)
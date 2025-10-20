# Security Best Practices

This guide covers security best practices for integrating with the Parsify API to ensure your application and user data remain secure.

## Overview

Security is crucial when working with APIs. This guide covers:

- API key management and storage
- Secure authentication implementation
- Data protection and privacy
- Input validation and sanitization
- Error handling and logging
- Monitoring and threat detection

## API Key Management

### 1. Secure Storage

Never hardcode API keys in your source code or expose them in client-side applications.

```javascript
// ❌ BAD - Never do this
const API_KEY = "pk_live_1234567890abcdef";

// ✅ GOOD - Use environment variables
const API_KEY = process.env.PARSIFY_API_KEY;

// ✅ GOOD - Use configuration management
const config = {
  apiKey: process.env.PARSIFY_API_KEY,
  baseURL: process.env.PARSIFY_API_URL
};
```

### Environment Configuration

```bash
# .env.example
PARSIFY_API_KEY=your_api_key_here
PARSIFY_API_URL=https://api.parsify.dev/api/v1
NODE_ENV=production

# .env.production
PARSIFY_API_KEY=pk_live_1234567890abcdef
PARSIFY_API_URL=https://api.parsify.dev/api/v1
NODE_ENV=production
```

### 2. API Key Rotation

Regularly rotate your API keys to minimize the impact of potential compromises.

```javascript
class SecureAPIClient {
  constructor(keyManager) {
    this.keyManager = keyManager;
    this.currentKey = null;
  }

  async getValidKey() {
    // Check if current key is valid
    if (this.currentKey && !this.keyManager.isExpired(this.currentKey)) {
      return this.currentKey.token;
    }

    // Get new key
    this.currentKey = await this.keyManager.getFreshKey();
    return this.currentKey.token;
  }

  async makeRequest(url, options = {}) {
    const apiKey = await this.getValidKey();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // Handle expired key
    if (response.status === 401) {
      this.currentKey = null;
      return this.makeRequest(url, options);
    }

    return response;
  }
}
```

### 3. Key Access Control

Implement principle of least privilege for API key access.

```javascript
// Create scoped keys for different use cases
const keyScopes = {
  'read-only': ['tools:read', 'users:read'],
  'file-upload': ['upload:create', 'upload:read'],
  'code-execution': ['tools:execute', 'jobs:create'],
  'admin': ['*'] // Full access
};

class ScopedAPIClient {
  constructor(apiKey, scope) {
    this.apiKey = apiKey;
    this.scope = scope;
    this.allowedOperations = keyScopes[scope] || [];
  }

  async request(operation, endpoint, options = {}) {
    // Check if operation is allowed for this scope
    if (!this.isOperationAllowed(operation)) {
      throw new Error(`Operation '${operation}' not allowed for scope '${this.scope}'`);
    }

    // Make request
    return this.makeRequest(endpoint, options);
  }

  isOperationAllowed(operation) {
    return this.allowedOperations.includes('*') || 
           this.allowedOperations.includes(operation);
  }
}

// Usage examples
const readOnlyClient = new ScopedAPIClient(process.env.READ_ONLY_KEY, 'read-only');
const uploadClient = new ScopedAPIClient(process.env.UPLOAD_KEY, 'file-upload');
```

## Authentication Security

### 1. Token Storage

Store authentication tokens securely:

```javascript
// ✅ GOOD - Use httpOnly cookies for web applications
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 3600000 // 1 hour
});

// ✅ GOOD - Use secure storage for mobile apps
// iOS: Keychain
// Android: Keystore/EncryptedSharedPreferences

// ❌ BAD - Never store tokens in localStorage
localStorage.setItem('auth_token', token); // Vulnerable to XSS
```

### 2. Token Validation

Always validate tokens on the server side:

```javascript
// Middleware for token validation
function validateToken(req, res, next) {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Validate token with Parsify API
  validateTokenWithParsify(token)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(error => {
      res.status(401).json({ error: 'Invalid token' });
    });
}

async function validateTokenWithParsify(token) {
  const response = await fetch('https://api.parsify.dev/api/v1/auth/validate', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Token validation failed');
  }

  const data = await response.json();
  return data.user;
}
```

### 3. Secure Token Transmission

Always use HTTPS for token transmission:

```javascript
// ✅ GOOD - HTTPS endpoint
const secureAPI = new APIClient('https://api.parsify.dev/api/v1');

// ❌ BAD - HTTP endpoint (insecure)
const insecureAPI = new APIClient('http://api.parsify.dev/api/v1');

// Enforce HTTPS in production
function enforceHTTPS(req, res, next) {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}
```

## Data Protection

### 1. Input Validation

Validate all user inputs before sending to the API:

```javascript
class InputValidator {
  static validateJSONInput(input) {
    const errors = [];
    
    // Check input type
    if (typeof input !== 'string') {
      errors.push('Input must be a string');
    }
    
    // Check input size
    if (input.length > 10 * 1024 * 1024) { // 10MB
      errors.push('Input too large (max 10MB)');
    }
    
    // Check for potentially dangerous content
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        errors.push('Input contains potentially dangerous content');
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateCodeInput(code, language) {
    const errors = [];
    
    const supportedLanguages = ['javascript', 'python', 'typescript'];
    if (!supportedLanguages.includes(language)) {
      errors.push(`Unsupported language: ${language}`);
    }
    
    // Check code size
    if (code.length > 1024 * 1024) { // 1MB
      errors.push('Code too large (max 1MB)');
    }
    
    // Check for dangerous operations
    const dangerousPatterns = {
      javascript: [
        /eval\s*\(/gi,
        /Function\s*\(/gi,
        /require\s*\(/gi,
        /import\s+.*\s+from/gi
      ],
      python: [
        /exec\s*\(/gi,
        /eval\s*\(/gi,
        /__import__\s*\(/gi,
        /subprocess\./gi
      ]
    };
    
    const patterns = dangerousPatterns[language] || [];
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        errors.push(`Code contains potentially dangerous operations`);
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Usage
function safeJSONFormat(jsonString) {
  const validation = InputValidator.validateJSONInput(jsonString);
  
  if (!validation.isValid) {
    throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
  }
  
  return apiClient.formatJSON(jsonString);
}
```

### 2. Output Sanitization

Sanitize API responses before displaying to users:

```javascript
class OutputSanitizer {
  static sanitizeOutput(output, type = 'text') {
    switch (type) {
      case 'html':
        return this.sanitizeHTML(output);
      case 'json':
        return this.sanitizeJSON(output);
      case 'text':
        return this.sanitizeText(output);
      default:
        return this.sanitizeText(output);
    }
  }

  static sanitizeHTML(html) {
    // Remove dangerous HTML elements
    const tempDiv = document.createElement('div');
    tempDiv.textContent = html;
    return tempDiv.innerHTML;
  }

  static sanitizeJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      // Remove potentially dangerous properties
      return this.cleanObject(parsed);
    } catch {
      return this.sanitizeText(jsonString);
    }
  }

  static cleanObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const cleaned = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip potentially dangerous keys
      if (this.isDangerousKey(key)) {
        continue;
      }
      
      cleaned[key] = this.cleanObject(value);
    }
    
    return cleaned;
  }

  static isDangerousKey(key) {
    const dangerousKeys = [
      'password', 'token', 'secret', 'key', 'auth',
      'credential', 'private', 'confidential'
    ];
    
    return dangerousKeys.some(dangerous => 
      key.toLowerCase().includes(dangerous)
    );
  }

  static sanitizeText(text) {
    if (typeof text !== 'string') {
      return String(text);
    }
    
    // Remove potential XSS vectors
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

// Usage
function displayOutput(output, type) {
  const sanitized = OutputSanitizer.sanitizeOutput(output, type);
  document.getElementById('output').textContent = sanitized;
}
```

### 3. Data Encryption

Encrypt sensitive data at rest:

```javascript
// Client-side encryption for sensitive data
class SecureStorage {
  constructor(encryptionKey) {
    this.key = encryptionKey;
  }

  async encrypt(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.key),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    };
  }

  async decrypt(encryptedData) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.key),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
      key,
      new Uint8Array(encryptedData.encrypted)
    );

    return JSON.parse(decoder.decode(decrypted));
  }
}
```

## Error Handling & Logging

### 1. Secure Error Handling

Don't expose sensitive information in error messages:

```javascript
class SecureErrorHandler {
  static handleError(error, req) {
    // Log full error for debugging
    this.logError(error, req);
    
    // Return safe error message to client
    return this.getSafeErrorMessage(error);
  }

  static logError(error, req) {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      request: {
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(req.headers),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      user: req.user ? { id: req.user.id } : null
    };

    // Send to secure logging service
    this.sendToLogService(logData);
  }

  static sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  static getSafeErrorMessage(error) {
    // Don't expose internal error details
    const safeMessages = {
      'ValidationError': 'Invalid input provided',
      'AuthenticationError': 'Authentication required',
      'RateLimitError': 'Too many requests',
      'NetworkError': 'Connection failed',
      'default': 'An error occurred. Please try again.'
    };

    return safeMessages[error.name] || safeMessages['default'];
  }

  static sendToLogService(logData) {
    // Send to secure logging service
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(console.error);
  }
}

// Express middleware
function secureErrorHandler(err, req, res, next) {
  const safeMessage = SecureErrorHandler.handleError(err, req);
  
  res.status(err.status || 500).json({
    error: 'Request failed',
    message: safeMessage,
    requestId: req.id
  });
}
```

### 2. Security Monitoring

Implement security monitoring and alerting:

```javascript
class SecurityMonitor {
  constructor() {
    this.suspiciousPatterns = [
      { pattern: /sql\s+injection/i, severity: 'high' },
      { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, severity: 'high' },
      { pattern: /\.\.\//g, severity: 'medium' },
      { pattern: /union\s+select/i, severity: 'high' }
    ];
    
    this.rateLimits = new Map();
  }

  checkRequest(req) {
    const issues = [];
    
    // Check for suspicious patterns
    const requestData = JSON.stringify(req.body) + req.url;
    
    for (const { pattern, severity } of this.suspiciousPatterns) {
      if (pattern.test(requestData)) {
        issues.push({ type: 'suspicious_pattern', severity, pattern });
      }
    }
    
    // Check rate limiting
    const clientId = req.ip || req.headers['x-forwarded-for'];
    const rateIssue = this.checkRateLimit(clientId);
    if (rateIssue) {
      issues.push(rateIssue);
    }
    
    // Report issues
    if (issues.length > 0) {
      this.reportSecurityIssue(req, issues);
    }
    
    return issues;
  }

  checkRateLimit(clientId) {
    const now = Date.now();
    const window = 60000; // 1 minute
    const maxRequests = 100;
    
    if (!this.rateLimits.has(clientId)) {
      this.rateLimits.set(clientId, []);
    }
    
    const requests = this.rateLimits.get(clientId);
    
    // Remove old requests
    const recentRequests = requests.filter(time => now - time < window);
    this.rateLimits.set(clientId, recentRequests);
    
    // Check if over limit
    if (recentRequests.length >= maxRequests) {
      return {
        type: 'rate_limit_exceeded',
        severity: 'medium',
        count: recentRequests.length
      };
    }
    
    // Add current request
    recentRequests.push(now);
    return null;
  }

  reportSecurityIssue(req, issues) {
    const report = {
      timestamp: new Date().toISOString(),
      issues,
      request: {
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(req.headers),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      user: req.user ? { id: req.user.id } : null
    };

    // Send to security monitoring service
    this.sendAlert(report);
    
    // Log for analysis
    console.warn('Security issue detected:', report);
  }

  sendAlert(report) {
    // Send to security team
    fetch('/api/security/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    }).catch(console.error);
  }
}

// Express middleware
function securityMonitor(req, res, next) {
  const monitor = new SecurityMonitor();
  const issues = monitor.checkRequest(req);
  
  // Block high severity issues
  const highSeverityIssues = issues.filter(issue => issue.severity === 'high');
  if (highSeverityIssues.length > 0) {
    return res.status(403).json({
      error: 'Request blocked',
      message: 'Suspicious activity detected'
    });
  }
  
  next();
}
```

## Request Security

### 1. Request Validation

Validate all incoming requests:

```javascript
class RequestValidator {
  static validateRequest(req, allowedOrigins = []) {
    const issues = [];
    
    // Check origin
    const origin = req.get('Origin');
    if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
      issues.push(`Invalid origin: ${origin}`);
    }
    
    // Check content type
    const contentType = req.get('Content-Type');
    if (req.method === 'POST' && !contentType?.includes('application/json')) {
      issues.push('Invalid content type');
    }
    
    // Check request size
    const contentLength = parseInt(req.get('Content-Length') || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
      issues.push('Request too large');
    }
    
    // Check user agent
    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length < 10) {
      issues.push('Invalid user agent');
    }
    
    return issues;
  }

  static sanitizeFilename(filename) {
    // Remove dangerous characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\.\./g, '_')
      .replace(/^\./, '_')
      .substring(0, 255);
  }

  static validateFileUpload(file) {
    const issues = [];
    
    // Check file size
    if (file.size > 50 * 1024 * 1024) { // 50MB
      issues.push('File too large');
    }
    
    // Check file extension
    const allowedExtensions = ['.json', '.csv', '.xml', '.txt'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(extension)) {
      issues.push(`File type not allowed: ${extension}`);
    }
    
    // Check MIME type
    const allowedMimeTypes = [
      'application/json',
      'text/csv',
      'application/xml',
      'text/plain'
    ];
    
    if (!allowedMimeTypes.includes(file.type)) {
      issues.push(`MIME type not allowed: ${file.type}`);
    }
    
    return issues;
  }
}

// Express middleware
function validateRequest(allowedOrigins = []) {
  return (req, res, next) => {
    const issues = RequestValidator.validateRequest(req, allowedOrigins);
    
    if (issues.length > 0) {
      return res.status(400).json({
        error: 'Invalid request',
        issues
      });
    }
    
    next();
  };
}
```

### 2. CSRF Protection

Implement CSRF protection for state-changing requests:

```javascript
class CSRFProtection {
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static validateToken(req, token) {
    const sessionToken = req.session?.csrfToken;
    return sessionToken && sessionToken === token;
  }

  static middleware() {
    return (req, res, next) => {
      // Generate token for GET requests
      if (req.method === 'GET') {
        req.csrfToken = CSRFProtection.generateToken();
        req.session.csrfToken = req.csrfToken;
      }
      
      // Validate token for POST/PUT/DELETE requests
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const token = req.get('X-CSRF-Token') || req.body._csrf;
        
        if (!CSRFProtection.validateToken(req, token)) {
          return res.status(403).json({
            error: 'Invalid CSRF token'
          });
        }
      }
      
      next();
    };
  }
}

// Usage in Express
app.use(session({ secret: 'your-secret-key' }));
app.use(CSRFProtection.middleware());

// Include token in responses
app.get('/api/csrf-token', (req, res) => {
  res.json({ token: req.csrfToken });
});
```

## Security Checklist

### Development Security

- [ ] API keys stored in environment variables
- [ ] No hardcoded credentials in source code
- [ ] HTTPS enforced in production
- [ ] Input validation implemented
- [ ] Output sanitization implemented
- [ ] Error messages don't expose sensitive information
- [ ] Security headers configured (CSP, HSTS, etc.)

### Authentication Security

- [ ] Secure token storage (httpOnly cookies)
- [ ] Token expiration implemented
- [ ] Token refresh mechanism
- [ ] Rate limiting on authentication endpoints
- [ ] Account lockout after failed attempts
- [ ] Multi-factor authentication for admin accounts

### Data Security

- [ ] Sensitive data encrypted at rest
- [ ] Data retention policies implemented
- [ ] User data privacy compliance (GDPR, CCPA)
- [ ] Audit logging for sensitive operations
- [ ] Data backup and recovery procedures

### Monitoring & Alerting

- [ ] Security event monitoring
- [ ] Anomaly detection
- [ ] Intrusion detection
- [ ] Regular security scans
- [ ] Vulnerability assessment
- [ ] Security incident response plan

## Compliance and Legal

### Data Privacy

```javascript
// GDPR compliance helper
class PrivacyCompliance {
  static anonymizeUser(userId) {
    // Anonymize user data for privacy compliance
    return {
      id: this.hashUserId(userId),
      data: 'anonymized'
    };
  }

  static hashUserId(userId) {
    // Use secure hashing for user IDs
    return crypto.createHash('sha256')
      .update(userId + process.env.PRIVACY_SALT)
      .digest('hex');
  }

  static handleDataDeletionRequest(userId) {
    // Handle right to be forgotten requests
    return {
      status: 'processing',
      estimatedCompletion: '30 days'
    };
  }

  static exportUserData(userId) {
    // Handle data export requests
    return {
      userData: this.getUserData(userId),
      format: 'json',
      exportedAt: new Date().toISOString()
    };
  }
}
```

This comprehensive security guide should help you implement robust security measures when integrating with the Parsify API. Remember that security is an ongoing process, and you should regularly review and update your security practices.
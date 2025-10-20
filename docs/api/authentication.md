# Authentication & Authorization

The Parsify API provides flexible authentication options to suit different use cases, from public tool access to secure enterprise integrations.

## Overview

### Authentication Methods

1. **Public Access** - No authentication required for basic tools
2. **JWT Bearer Tokens** - For API integrations and server-side applications
3. **Session-based Authentication** - For web applications
4. **OAuth 2.0** - For third-party integrations (coming soon)

### Subscription Tiers

| Tier | API Calls/Hour | Max File Size | Features |
|------|---------------|---------------|----------|
| Anonymous | 100 | 10MB | Basic JSON tools |
| Free | 1,000 | 10MB | All basic tools |
| Pro | 5,000 | 50MB | Premium features, code execution |
| Enterprise | 50,000 | 500MB | Advanced features, priority support |

## JWT Bearer Token Authentication

### Getting a Token

1. Sign up at [parsify.dev](https://parsify.dev)
2. Navigate to API Settings in your dashboard
3. Generate a new API key
4. Use the key as a Bearer token

### Using the Token

Include the token in the `Authorization` header:

```bash
curl -X POST https://api.parsify.dev/api/v1/tools/json/format \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "json": "{\"name\":\"John\"}",
    "indent": 2
  }'
```

### Token Structure

JWT tokens contain the following claims:

```json
{
  "sub": "user_uuid",
  "sessionId": "session_uuid",
  "tier": "pro",
  "iat": 1640995200,
  "exp": 1641081600,
  "aud": "parsify-api"
}
```

### Token Refresh

Tokens are automatically refreshed by the authentication middleware when they expire:

```bash
curl -X POST https://api.parsify.dev/api/v1/auth/refresh \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "refreshed": true,
  "session_id": "session_uuid",
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription_tier": "pro"
  }
}
```

## Session-based Authentication

Session-based authentication is ideal for web applications using JavaScript frameworks.

### Creating a Session

```bash
curl -X POST https://api.parsify.dev/api/v1/auth/session \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password"
  }'
```

### Validating a Session

```bash
curl -X GET https://api.parsify.dev/api/v1/auth/validate \
  -H "Authorization: Bearer SESSION_TOKEN"
```

### Ending a Session

```bash
curl -X POST https://api.parsify.dev/api/v1/auth/logout \
  -H "Authorization: Bearer SESSION_TOKEN"
```

## Authorization & Permissions

### Subscription-based Access Control

Different subscription tiers have access to different features:

#### Free Tier
- JSON formatting, validation, conversion
- Basic code formatting (JavaScript)
- File upload (10MB limit)

#### Pro Tier
- All Free tier features
- Code execution (JavaScript, Python)
- Advanced code formatting
- File upload (50MB limit)
- Priority processing

#### Enterprise Tier
- All Pro tier features
- Custom code execution environments
- File upload (500MB limit)
- Dedicated resources
- Advanced analytics

### Role-based Access Control

Some endpoints require specific permissions:

```typescript
// Require premium features
app.use('/api/v1/code/execute', requirePremium())

// Require enterprise features
app.use('/api/v1/admin/dashboard', requireEnterprise())

// Optional authentication (enriches context if provided)
app.use('/api/v1/tools', optionalAuth())
```

## Security Best Practices

### Token Management

1. **Store tokens securely**: Use environment variables or secure storage
2. **Use short expiration**: Refresh tokens regularly
3. **Rotate keys**: Generate new API keys periodically
4. **Monitor usage**: Check your API usage dashboard

```javascript
// Example: Secure token storage in environment variables
const API_TOKEN = process.env.PARSIFY_API_TOKEN;

// Include in requests
const response = await fetch('https://api.parsify.dev/api/v1/tools/json/format', {
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    json: '{"test": true}',
    indent: 2
  })
});
```

### Error Handling

Handle authentication errors gracefully:

```javascript
try {
  const response = await fetch(url, options);
  if (response.status === 401) {
    // Token expired - attempt refresh
    await refreshToken();
    // Retry request with new token
    return fetch(url, options);
  } else if (response.status === 403) {
    // Insufficient permissions
    throw new Error('Upgrade your subscription to access this feature');
  }
  return response.json();
} catch (error) {
  console.error('API request failed:', error);
}
```

## Rate Limiting with Authentication

Authenticated users get higher rate limits:

```javascript
// Check rate limit headers
const limit = response.headers.get('X-Rate-Limit-Limit');
const remaining = response.headers.get('X-Rate-Limit-Remaining');
const reset = response.headers.get('X-Rate-Limit-Reset');

console.log(`API calls remaining: ${remaining}/${limit}`);
console.log(`Rate limit resets at: ${new Date(parseInt(reset) * 1000)}`);
```

## Examples

### Node.js Example

```javascript
class ParsifyAPI {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseURL = 'https://api.parsify.dev/api/v1';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    let response = await fetch(url, config);

    // Handle token refresh
    if (response.status === 401) {
      await this.refreshToken();
      config.headers['Authorization'] = `Bearer ${this.apiToken}`;
      response = await fetch(url, config);
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  async refreshToken() {
    const response = await this.request('/auth/refresh');
    // Store new token
    this.apiToken = response.token;
  }

  // API methods
  async formatJSON(json, indent = 2) {
    return this.request('/tools/json/format', {
      method: 'POST',
      body: JSON.stringify({ json, indent })
    });
  }

  async executeCode(code, language) {
    return this.request('/tools/code/execute', {
      method: 'POST',
      body: JSON.stringify({ code, language })
    });
  }
}

// Usage
const api = new ParsifyAPI(process.env.PARSIFY_API_TOKEN);

const formatted = await api.formatJSON('{"name":"John"}', 2);
console.log(formatted.formatted);
```

### Python Example

```python
import requests
import json
from typing import Optional, Dict, Any

class ParsifyAPI:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.base_url = "https://api.parsify.dev/api/v1"
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        })

    def request(self, endpoint: str, method: str = 'GET', **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)

        if response.status_code == 401:
            # Attempt token refresh
            self.refresh_token()
            response = self.session.request(method, url, **kwargs)

        response.raise_for_status()
        return response.json()

    def refresh_token(self):
        response = self.session.post(f"{self.base_url}/auth/refresh")
        response.raise_for_status()
        # Update session with new token
        self.session.headers.update({
            'Authorization': f"Bearer {response.json()['token']}"
        })

    def format_json(self, json_str: str, indent: int = 2) -> Dict[str, Any]:
        return self.request('/tools/json/format', method='POST', 
                          json={'json': json_str, 'indent': indent})

    def execute_code(self, code: str, language: str) -> Dict[str, Any]:
        return self.request('/tools/code/execute', method='POST',
                          json={'code': code, 'language': language})

# Usage
api = ParsifyAPI(api_token="your_token_here")
result = api.format_json('{"name":"John"}', indent=2)
print(result['formatted'])
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that your token is valid and not expired
2. **403 Forbidden**: Your subscription tier doesn't include this feature
3. **429 Too Many Requests**: You've hit your rate limit, wait before retrying

### Debug Mode

Enable debug headers to get more information:

```bash
curl -X GET https://api.parsify.dev/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Debug: true"
```

### Support

If you encounter authentication issues:

1. Check the [API status page](https://status.parsify.dev)
2. Review your API usage in the dashboard
3. Contact support at [support@parsify.dev](mailto:support@parsify.dev)
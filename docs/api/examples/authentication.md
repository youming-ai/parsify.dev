# Authentication Examples

This guide provides practical examples of implementing authentication with the Parsify API using various programming languages and frameworks.

## Overview

The Parsify API uses JWT (JSON Web Token) authentication. You can authenticate in two ways:

1. **Bearer Token**: Include your JWT token in the Authorization header
2. **Session-based**: Use session tokens for web applications

## Basic Authentication Pattern

```javascript
// Set up authenticated headers
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`
};

// Make authenticated request
const response = await fetch(url, { headers });
```

## Language-Specific Examples

### JavaScript/TypeScript

#### Basic Authenticated Client

```javascript
class ParsifyAPIClient {
  constructor(apiKey, baseURL = 'https://api.parsify.dev/api/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.headers,
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${error.error}: ${error.message}`);
    }

    return response.json();
  }

  // API methods
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async executeCode(code, language) {
    return this.request('/tools/code/execute', {
      method: 'POST',
      body: JSON.stringify({ code, language })
    });
  }

  async uploadFile(file) {
    // First get upload URL
    const uploadInfo = await this.request('/upload/sign', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type,
        size: file.size
      })
    });

    // Upload file to cloud storage
    const uploadResponse = await fetch(uploadInfo.upload_url, {
      method: 'PUT',
      headers: uploadInfo.headers,
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('File upload failed');
    }

    // Confirm upload
    return this.request(`/upload/confirm/${uploadInfo.file_id}`, {
      method: 'POST'
    });
  }
}

// Usage
const client = new ParsifyAPIClient(process.env.PARSIFY_API_KEY);

async function example() {
  try {
    const profile = await client.getUserProfile();
    console.log('User profile:', profile);

    const result = await client.executeCode('print("Hello!")', 'python');
    console.log('Code output:', result.output);
  } catch (error) {
    console.error('API error:', error.message);
  }
}
```

#### Token Refresh Handler

```javascript
class AuthenticatedAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.parsify.dev/api/v1';
    this.refreshPromise = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let response = await this.makeRequest(url, options);

    // Handle token refresh
    if (response.status === 401) {
      await this.refreshToken();
      response = await this.makeRequest(url, options);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${error.error}: ${error.message}`);
    }

    return response.json();
  }

  async makeRequest(url, options) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers
    };

    return fetch(url, { ...options, headers });
  }

  async refreshToken() {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      this.apiKey = result.token; // Update with new token
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  async doTokenRefresh() {
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }
}
```

### React Integration

#### Auth Context Hook

```jsx
// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState(localStorage.getItem('parsify_api_key'));

  useEffect(() => {
    if (apiKey) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, [apiKey]);

  const validateToken = async () => {
    try {
      const response = await fetch('/api/v1/auth/validate', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token) => {
    setApiKey(token);
    localStorage.setItem('parsify_api_key', token);
  };

  const logout = () => {
    setUser(null);
    setApiKey(null);
    localStorage.removeItem('parsify_api_key');
  };

  const value = {
    user,
    apiKey,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### API Hook with Authentication

```jsx
// hooks/useAPI.js
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useAPI() {
  const { apiKey, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const response = await fetch(`/api/v1${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        logout();
        throw new Error('Authentication expired');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Request failed');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiKey, logout]);

  return { request, loading, error };
}

// Usage in component
function UserProfile() {
  const { user } = useAuth();
  const { request, loading, error } = useAPI();

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      request('/users/profile')
        .then(setProfile)
        .catch(console.error);
    }
  }, [user, request]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome, {profile?.name}</h1>
      <p>Email: {profile?.email}</p>
      <p>Plan: {profile?.subscription_tier}</p>
    </div>
  );
}
```

### Node.js/Express Backend

#### Middleware for Authentication

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Authorization header with Bearer token is required'
    });
  }

  // Verify token with Parsify API
  verifyTokenWithAPI(token)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(error => {
      res.status(401).json({
        error: 'Invalid Token',
        message: 'The provided token is invalid or expired'
      });
    });
}

async function verifyTokenWithAPI(token) {
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

module.exports = { authenticateToken };
```

#### API Service Class

```javascript
// services/parsifyAPI.js
class ParsifyAPIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.parsify.dev/api/v1';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${error.error}: ${error.message}`);
    }

    return response.json();
  }

  // Tool methods
  async formatJSON(jsonString, options = {}) {
    return this.request('/tools/json/format', {
      method: 'POST',
      body: JSON.stringify({
        json: jsonString,
        ...options
      })
    });
  }

  async executeCode(code, language, input = '') {
    return this.request('/tools/code/execute', {
      method: 'POST',
      body: JSON.stringify({
        code,
        language,
        input
      })
    });
  }

  // File methods
  async uploadFile(filename, contentType, size) {
    return this.request('/upload/sign', {
      method: 'POST',
      body: JSON.stringify({
        filename,
        content_type: contentType,
        size
      })
    });
  }

  // User methods
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async getUserStats() {
    return this.request('/users/stats');
  }
}

module.exports = ParsifyAPIService;
```

#### Express Route with Authentication

```javascript
// routes/tools.js
const express = require('express');
const ParsifyAPIService = require('../services/parsifyAPI');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protected route - requires authentication
router.post('/execute', authenticateToken, async (req, res) => {
  try {
    const { code, language, input } = req.body;
    
    const apiService = new ParsifyAPIService(req.user.apiKey);
    const result = await apiService.executeCode(code, language, input);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Execution failed',
      message: error.message
    });
  }
});

// Public route - no authentication required
router.post('/format', async (req, res) => {
  try {
    const { json, indent = 2 } = req.body;
    
    const apiService = new ParsifyAPIService(); // No API key needed
    const result = await apiService.formatJSON(json, { indent });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Formatting failed',
      message: error.message
    });
  }
});

module.exports = router;
```

### Python

#### Basic Authenticated Client

```python
import requests
import os
from typing import Optional, Dict, Any

class ParsifyAPIClient:
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.parsify.dev/api/v1"):
        self.api_key = api_key or os.getenv('PARSIFY_API_KEY')
        self.base_url = base_url
        self.session = requests.Session()
        
        if self.api_key:
            self.session.headers.update({
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            })

    def request(self, endpoint: str, method: str = 'GET', **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        
        response = self.session.request(method, url, **kwargs)
        
        if response.status_code == 401:
            raise Exception("Authentication failed. Check your API key.")
        
        response.raise_for_status()
        return response.json()

    # Tool methods
    def format_json(self, json_string: str, **options) -> Dict[str, Any]:
        return self.request('/tools/json/format', method='POST', json={
            'json': json_string,
            **options
        })

    def execute_code(self, code: str, language: str, input_text: str = '') -> Dict[str, Any]:
        return self.request('/tools/code/execute', method='POST', json={
            'code': code,
            'language': language,
            'input': input_text
        })

    # User methods
    def get_user_profile(self) -> Dict[str, Any]:
        return self.request('/users/profile')

    def get_user_stats(self) -> Dict[str, Any]:
        return self.request('/users/stats')

# Usage
def main():
    client = ParsifyAPIClient()
    
    try:
        # Public endpoint
        result = client.format_json('{"test": true}', indent=2)
        print("Formatted JSON:", result['formatted'])
        
        # Authenticated endpoint
        if client.api_key:
            profile = client.get_user_profile()
            print("User profile:", profile['name'])
        else:
            print("No API key provided - skipping authenticated requests")
            
    except Exception as error:
        print(f"API Error: {error}")

if __name__ == "__main__":
    main()
```

#### Token Refresh Handler

```python
import time
from typing import Dict, Any

class AuthenticatedParsifyClient(ParsifyAPIClient):
    def __init__(self, api_key: str, **kwargs):
        super().__init__(api_key, **kwargs)
        self.token_expiry = None
        self.refresh_buffer = 300  # Refresh 5 minutes before expiry

    def request(self, endpoint: str, method: str = 'GET', **kwargs) -> Dict[str, Any]:
        # Check if token needs refresh
        if self.should_refresh_token():
            self.refresh_token()
        
        try:
            return super().request(endpoint, method, **kwargs)
        except requests.exceptions.HTTPError as error:
            if error.response.status_code == 401:
                # Token might be expired, try refreshing
                self.refresh_token()
                return super().request(endpoint, method, **kwargs)
            raise

    def should_refresh_token(self) -> bool:
        if not self.token_expiry:
            return False
        
        return time.time() >= (self.token_expiry - self.refresh_buffer)

    def refresh_token(self):
        try:
            response = self.session.post(
                f"{self.base_url}/auth/refresh",
                headers={'Authorization': f'Bearer {self.api_key}'}
            )
            response.raise_for_status()
            
            data = response.json()
            # Update API key with new token
            self.api_key = data.get('token', self.api_key)
            self.session.headers.update({
                'Authorization': f'Bearer {self.api_key}'
            })
            
            # Parse new token expiry (you'd need to decode JWT to get this)
            # For now, set a reasonable default
            self.token_expiry = time.time() + 3600  # 1 hour
            
        except Exception as error:
            print(f"Token refresh failed: {error}")
            raise
```

### Django Integration

#### Authentication Backend

```python
# backend.py
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User
import requests

class ParsifyBackend(BaseBackend):
    def authenticate(self, request, token=None):
        if not token:
            return None
        
        try:
            # Validate token with Parsify API
            response = requests.get(
                'https://api.parsify.dev/api/v1/auth/validate',
                headers={'Authorization': f'Bearer {token}'}
            )
            
            if response.status_code == 200:
                data = response.json()
                user_data = data['user']
                
                # Get or create Django user
                user, created = User.objects.get_or_create(
                    username=user_data['id'],
                    defaults={
                        'email': user_data['email'],
                        'first_name': user_data['name'].split(' ')[0],
                        'last_name': ' '.join(user_data['name'].split(' ')[1:]),
                        'is_active': True
                    }
                )
                
                # Store token in session
                if hasattr(request, 'session'):
                    request.session['parsify_token'] = token
                
                return user
                
        except requests.RequestException:
            pass
        
        return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
```

#### API Service in Django

```python
# services.py
import requests
from django.conf import settings

class ParsifyService:
    def __init__(self, request=None):
        self.base_url = 'https://api.parsify.dev/api/v1'
        self.token = None
        
        if request and hasattr(request, 'session'):
            self.token = request.session.get('parsify_token')
        elif hasattr(settings, 'PARSIFY_API_KEY'):
            self.token = settings.PARSIFY_API_KEY
    
    def _get_headers(self):
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        return headers
    
    def request(self, endpoint, method='GET', **kwargs):
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        response = requests.request(method, url, headers=headers, **kwargs)
        
        if response.status_code == 401:
            raise PermissionError("Authentication required")
        
        response.raise_for_status()
        return response.json()
    
    def format_json(self, json_string, **options):
        return self.request('/tools/json/format', method='POST', json={
            'json': json_string,
            **options
        })
    
    def execute_code(self, code, language, input_text=''):
        return self.request('/tools/code/execute', method='POST', json={
            'code': code,
            'language': language,
            'input': input_text
        })

# Usage in Django view
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["POST"])
def format_json_view(request):
    try:
        data = json.loads(request.body)
        json_string = data.get('json')
        
        if not json_string:
            return JsonResponse({'error': 'JSON input required'}, status=400)
        
        service = ParsifyService(request)
        result = service.format_json(json_string, indent=data.get('indent', 2))
        
        return JsonResponse(result)
        
    except Exception as error:
        return JsonResponse({'error': str(error)}, status=500)
```

## Security Best Practices

### 1. Store API Keys Securely

```javascript
// ❌ BAD - Never expose API keys in client-side code
const apiKey = "pk_live_12345..."; // This is visible to everyone!

// ✅ GOOD - Use environment variables
const apiKey = process.env.PARSIFY_API_KEY;

// ✅ GOOD - Use server-side storage
const apiKey = await getSecureApiKeyFromServer();
```

### 2. Implement Rate Limiting on Client Side

```javascript
class RateLimitedClient {
  constructor(apiKey, requestsPerSecond = 10) {
    this.apiKey = apiKey;
    this.minInterval = 1000 / requestsPerSecond;
    this.lastRequest = 0;
  }

  async request(url, options = {}) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = Date.now();
    
    // Make request
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers
      }
    });
    
    return response;
  }
}
```

### 3. Validate API Responses

```javascript
async function safeAPIRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific error cases
      switch (response.status) {
        case 401:
          // Token expired - attempt refresh
          await refreshToken();
          return fetch(url, options);
        case 429:
          // Rate limited - wait and retry
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return fetch(url, options);
        default:
          throw new Error(error.message || 'Request failed');
      }
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

### 4. Use HTTPS Everywhere

```javascript
// Always use HTTPS
const baseURL = 'https://api.parsify.dev/api/v1'; // ✅ Good

// Never use HTTP for authenticated requests
const baseURL = 'http://api.parsify.dev/api/v1'; // ❌ Bad
```

## Testing Authentication

### Unit Tests

```javascript
// api.test.js
import { ParsifyAPIClient } from './api';

describe('ParsifyAPIClient', () => {
  let client;
  let mockFetch;

  beforeEach(() => {
    client = new ParsifyAPIClient('test-api-key');
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  test('includes authorization header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    await client.request('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key'
        })
      })
    );
  });

  test('handles 401 errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        error: 'Unauthorized',
        message: 'Invalid token'
      })
    });

    await expect(client.request('/test')).rejects.toThrow('Unauthorized: Invalid token');
  });
});
```

### Integration Tests

```javascript
// integration.test.js
describe('API Integration', () => {
  const client = new ParsifyAPIClient(process.env.TEST_API_KEY);

  test('authenticated request succeeds', async () => {
    const profile = await client.getUserProfile();
    expect(profile).toHaveProperty('email');
    expect(profile).toHaveProperty('subscription_tier');
  });

  test('code execution requires authentication', async () => {
    const anonymousClient = new ParsifyAPIClient();
    
    await expect(
      anonymousClient.executeCode('print("test")', 'python')
    ).rejects.toThrow();
  });
});
```

This comprehensive guide should help you implement authentication securely and effectively in your applications using the Parsify API.
# Getting Started with the Parsify API

This guide will help you get started with the Parsify API, from basic setup to your first API call.

## Prerequisites

- A Parsify account (sign up at [parsify.dev](https://parsify.dev))
- Basic knowledge of HTTP requests and JSON
- Your preferred programming language or API tool

## Step 1: Get Your API Key

1. Sign in to your [Parsify Dashboard](https://parsify.dev/dashboard)
2. Navigate to **API Settings** 
3. Generate a new API key
4. Copy the key and store it securely

⚠️ **Security Tip**: Treat your API key like a password. Never expose it in client-side code or public repositories.

## Step 2: Make Your First API Call

Let's start with a simple JSON formatting request. This endpoint doesn't require authentication.

### Using cURL

```bash
curl -X POST https://api.parsify.dev/api/v1/tools/json/format \
  -H "Content-Type: application/json" \
  -d '{
    "json": "{\"name\":\"John\",\"age\":30,\"city\":\"New York\"}",
    "indent": 2
  }'
```

### Using JavaScript (Browser)

```javascript
const response = await fetch('https://api.parsify.dev/api/v1/tools/json/format', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    json: '{"name":"John","age":30,"city":"New York"}',
    indent: 2
  })
});

const result = await response.json();
console.log(result.formatted);
```

### Using Python

```python
import requests
import json

url = "https://api.parsify.dev/api/v1/tools/json/format"
payload = {
    "json": '{"name":"John","age":30,"city":"New York"}',
    "indent": 2
}

response = requests.post(url, json=payload)
result = response.json()
print(result['formatted'])
```

### Using Node.js

```javascript
const https = require('https');

const data = JSON.stringify({
  json: '{"name":"John","age":30,"city":"New York"}',
  indent: 2
});

const options = {
  hostname: 'api.parsify.dev',
  port: 443,
  path: '/api/v1/tools/json/format',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    const result = JSON.parse(responseData);
    console.log(result.formatted);
  });
});

req.write(data);
req.end();
```

## Step 3: Authenticate Your Requests

For features that require authentication (like code execution), include your API key in the Authorization header:

```bash
curl -X POST https://api.parsify.dev/api/v1/tools/code/execute \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello, World!\")",
    "language": "python"
  }'
```

## Step 4: Check Rate Limits

Every API response includes rate limit headers:

```javascript
const response = await fetch(url, options);

console.log('Rate Limit Info:');
console.log('Limit:', response.headers.get('X-Rate-Limit-Limit'));
console.log('Remaining:', response.headers.get('X-Rate-Limit-Remaining'));
console.log('Reset:', response.headers.get('X-Rate-Limit-Reset'));
```

## Step 5: Handle Errors

Always handle API errors gracefully:

```javascript
async function safeAPICall(url, options) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${error.error}: ${error.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
}
```

## Next Steps

Now that you've made your first API call, explore:

- [Authentication Guide](../authentication.md) - Learn about authentication methods
- [Available Tools](../endpoints/) - Discover all available API endpoints
- [Error Handling](../error-handling.md) - Handle errors and edge cases
- [Rate Limiting](../rate-limiting.md) - Understand usage limits
- [Examples](./) - More code examples and use cases

## Common Use Cases

### 1. Format JSON Configuration Files

```javascript
async function formatConfigFile(configString) {
  const response = await fetch('https://api.parsify.dev/api/v1/tools/json/format', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      json: configString,
      indent: 2,
      sort_keys: true
    })
  });
  
  const result = await response.json();
  return result.formatted;
}

// Usage
const unformattedConfig = '{"database":{"host":"localhost","port":5432}}';
const formattedConfig = await formatConfigFile(unformattedConfig);
console.log(formattedConfig);
```

### 2. Validate User Input

```javascript
async function validateJSONInput(input) {
  const response = await fetch('https://api.parsify.dev/api/v1/tools/json/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      json: input,
      schema: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" }
        }
      }
    })
  });
  
  const result = await response.json();
  
  if (result.valid) {
    console.log('✅ Valid JSON input');
    return JSON.parse(input);
  } else {
    console.log('❌ Invalid JSON:');
    result.errors.forEach(error => {
      console.log(`  - ${error.message}`);
    });
    return null;
  }
}
```

### 3. Upload and Process Files

```javascript
async function uploadAndProcessFile(file) {
  // Step 1: Get upload URL
  const uploadResponse = await fetch('https://api.parsify.dev/api/v1/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type,
      size: file.size
    })
  });
  
  const uploadInfo = await uploadResponse.json();
  
  // Step 2: Upload file to cloud storage
  await fetch(uploadInfo.upload_url, {
    method: 'PUT',
    headers: uploadInfo.headers,
    body: file
  });
  
  // Step 3: Confirm upload
  await fetch(`https://api.parsify.dev/api/v1/upload/confirm/${uploadInfo.file_id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  return uploadInfo.file_id;
}
```

## Environment Setup

### Environment Variables

Store your API key in environment variables:

```bash
# .env file
PARSIFY_API_KEY=your_api_key_here
PARSIFY_API_URL=https://api.parsify.dev/api/v1
```

### Configuration Files

Create a configuration for your application:

```javascript
// config.js
export const config = {
  apiUrl: process.env.PARSIFY_API_URL || 'https://api.parsify.dev/api/v1',
  apiKey: process.env.PARSIFY_API_KEY,
  timeout: 30000, // 30 seconds
  retries: 3
};
```

## Testing Your Integration

### Basic Test Script

```javascript
async function testAPI() {
  console.log('🧪 Testing Parsify API...');
  
  try {
    // Test JSON formatting
    const formatResult = await formatJSON('{"test": true}');
    console.log('✅ JSON formatting works');
    
    // Test JSON validation
    const validationResult = await validateJSON('{"valid": true}');
    console.log('✅ JSON validation works');
    
    // Test with API key (if provided)
    if (process.env.PARSIFY_API_KEY) {
      const codeResult = await executeCode('print("Hello!")', 'python');
      console.log('✅ Code execution works');
    }
    
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Helper functions
async function formatJSON(jsonString) {
  const response = await fetch('https://api.parsify.dev/api/v1/tools/json/format', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: jsonString })
  });
  
  if (!response.ok) throw new Error('Format failed');
  return response.json();
}

async function validateJSON(jsonString) {
  const response = await fetch('https://api.parsify.dev/api/v1/tools/json/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: jsonString })
  });
  
  if (!response.ok) throw new Error('Validation failed');
  return response.json();
}

async function executeCode(code, language) {
  const response = await fetch('https://api.parsify.dev/api/v1/tools/code/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PARSIFY_API_KEY}`
    },
    body: JSON.stringify({ code, language })
  });
  
  if (!response.ok) throw new Error('Code execution failed');
  return response.json();
}

// Run tests
testAPI();
```

### Integration Checklist

- [ ] Get API key from dashboard
- [ ] Store API key securely (environment variables)
- [ ] Make a test API call
- [ ] Implement error handling
- [ ] Check rate limit headers
- [ ] Test authentication (if using premium features)
- [ ] Handle edge cases (network errors, timeouts)
- [ ] Monitor usage and costs

## Need Help?

- [API Documentation](../README.md)
- [Error Handling Guide](../error-handling.md)
- [Rate Limiting Guide](../rate-limiting.md)
- [Support](mailto:support@parsify.dev)
- [API Status](https://status.parsify.dev)

Happy coding! 🚀
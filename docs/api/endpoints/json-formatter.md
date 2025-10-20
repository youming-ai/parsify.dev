# JSON Formatter Endpoint

Format and beautify JSON data with custom indentation and optional key sorting.

## Endpoint

```
POST /api/v1/tools/json/format
```

## Description

The JSON formatter endpoint takes JSON data as input and returns a formatted, properly indented version. It supports custom indentation levels and optional key sorting for better readability.

## Request Parameters

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `json` | string | Yes | The JSON string to format |
| `indent` | number | No | Number of spaces for indentation (0-8, default: 2) |
| `sort_keys` | boolean | No | Whether to sort object keys alphabetically (default: false) |

### Example Request Body

```json
{
  "json": "{\"name\":\"John\",\"age\":30,\"city\":\"New York\"}",
  "indent": 2,
  "sort_keys": true
}
```

## Response

### Success Response (200 OK)

```json
{
  "formatted": "{\n  \"age\": 30,\n  \"city\": \"New York\",\n  \"name\": \"John\"\n}",
  "valid": true,
  "size": 54,
  "errors": null
}
```

### Error Response (400 Bad Request)

Invalid JSON input:
```json
{
  "valid": false,
  "formatted": null,
  "errors": [
    {
      "line": 1,
      "column": 15,
      "message": "Expected property name or '}' in JSON at position 15"
    }
  ],
  "size": 30
}
```

Parameter validation error:
```json
{
  "error": "Missing required parameter: json",
  "message": "The json parameter is required",
  "requestId": "uuid-here",
  "timestamp": "2023-12-01T12:00:00Z"
}
```

## Usage Examples

### cURL

```bash
# Basic formatting
curl -X POST https://api.parsify.dev/api/v1/tools/json/format \
  -H "Content-Type: application/json" \
  -d '{
    "json": "{\"name\":\"John\",\"age\":30}",
    "indent": 2
  }'

# With key sorting
curl -X POST https://api.parsify.dev/api/v1/tools/json/format \
  -H "Content-Type: application/json" \
  -d '{
    "json": "{\"z\":1,\"a\":2,\"m\":3}",
    "indent": 4,
    "sort_keys": true
  }'

# Minified JSON (indent: 0)
curl -X POST https://api.parsify.dev/api/v1/tools/json/format \
  -H "Content-Type: application/json" \
  -d '{
    "json": "{\"name\":\"John\",\"age\":30}",
    "indent": 0
  }'
```

### JavaScript

```javascript
async function formatJSON(jsonString, indent = 2, sortKeys = false) {
  const response = await fetch('https://api.parsify.dev/api/v1/tools/json/format', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Optional: Add authentication
      // 'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      json: jsonString,
      indent: indent,
      sort_keys: sortKeys
    })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Formatting failed');
  }

  return result;
}

// Usage examples
const unformatted = '{"name":"John","age":30,"city":"New York"}';

// Basic formatting
const formatted = await formatJSON(unformatted, 2);
console.log(formatted.formatted);

// With sorted keys
const sorted = await formatJSON(unformatted, 2, true);
console.log(sorted.formatted);

// Minified
const minified = await formatJSON(unformatted, 0);
console.log(minified.formatted);
```

### Python

```python
import requests
import json

def format_json(json_string, indent=2, sort_keys=False):
    url = "https://api.parsify.dev/api/v1/tools/json/format"
    
    payload = {
        "json": json_string,
        "indent": indent,
        "sort_keys": sort_keys
    }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

# Usage
unformatted = '{"name":"John","age":30,"city":"New York"}'

# Basic formatting
result = format_json(unformatted, indent=2)
print(result["formatted"])

# With sorted keys
result = format_json(unformatted, indent=4, sort_keys=True)
print(result["formatted"])
```

### PHP

```php
<?php
function formatJSON($jsonString, $indent = 2, $sortKeys = false) {
    $url = 'https://api.parsify.dev/api/v1/tools/json/format';
    
    $data = [
        'json' => $jsonString,
        'indent' => $indent,
        'sort_keys' => $sortKeys
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        // Optional: Add authentication
        // 'Authorization: Bearer YOUR_TOKEN'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($httpCode !== 200) {
        throw new Exception($result['error'] ?? 'Formatting failed');
    }
    
    return $result;
}

// Usage
$unformatted = '{"name":"John","age":30,"city":"New York"}';
$result = formatJSON($unformatted, 2);
echo $result['formatted'];
?>
```

## Features

### Indentation Options

- `indent: 0` - Minified JSON (no extra whitespace)
- `indent: 1-4` - Compact formatting
- `indent: 2` - Standard formatting (default)
- `indent: 4-8` - Expanded formatting

### Key Sorting

When `sort_keys` is enabled, object keys are sorted alphabetically, which is useful for:

- Comparing JSON structures
- Creating consistent output
- Improving readability for large objects

### Error Handling

The endpoint provides detailed error information including:

- Line and column numbers for syntax errors
- Human-readable error messages
- Input size information

## Rate Limits

- **Anonymous**: 100 requests/hour
- **Free**: 1,000 requests/hour
- **Pro**: 5,000 requests/hour
- **Enterprise**: 50,000 requests/hour

## Quotas

| Subscription | Max Input Size | Max Execution Time |
|--------------|----------------|-------------------|
| Anonymous | 10MB | 1 second |
| Free | 10MB | 1 second |
| Pro | 50MB | 5 seconds |
| Enterprise | 500MB | 30 seconds |

## Common Use Cases

### 1. API Response Formatting

```javascript
// Format API responses for logging
async function logAPIResponse(response) {
  try {
    const formatted = await formatJSON(JSON.stringify(response), 2, true);
    console.log('API Response:', formatted.formatted);
  } catch (error) {
    console.error('Failed to format response:', error);
  }
}
```

### 2. Configuration File Beautification

```javascript
// Beautify configuration files
const config = {"database":{"host":"localhost","port":5432,"name":"myapp"}};
const beautified = await formatJSON(JSON.stringify(config), 2, true);
console.log(beautified.formatted);
```

### 3. Data Validation

```javascript
// Validate and format user input
async function processUserInput(input) {
  const result = await formatJSON(input, 2);
  
  if (!result.valid) {
    throw new Error(`Invalid JSON: ${result.errors[0].message}`);
  }
  
  return result.formatted;
}
```

## Error Handling Best Practices

```javascript
async function safeFormatJSON(jsonString, options = {}) {
  try {
    const result = await formatJSON(jsonString, options.indent, options.sortKeys);
    
    if (!result.valid) {
      console.error('JSON validation failed:', result.errors);
      return {
        success: false,
        errors: result.errors,
        original: jsonString
      };
    }
    
    return {
      success: true,
      formatted: result.formatted,
      size: result.size
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error.message,
      original: jsonString
    };
  }
}
```

## Related Endpoints

- [JSON Validator](./json-validator.md) - Validate JSON against schemas
- [JSON Converter](./json-converter.md) - Convert JSON to other formats
- [Code Formatter](./code-formatter.md) - Format code in various languages
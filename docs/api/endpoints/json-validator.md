# JSON Validator Endpoint

Validate JSON data against JSON schemas with detailed error reporting.

## Endpoint

```
POST /api/v1/tools/json/validate
```

## Description

The JSON validator endpoint checks JSON syntax and optionally validates against a JSON schema. It provides detailed error information including line numbers and column positions for easy debugging.

## Request Parameters

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `json` | string | Yes | The JSON string to validate |
| `schema` | object | No | JSON schema for validation (optional) |

### Example Request Body

```json
{
  "json": "{\"name\":\"John\",\"age\":30,\"email\":\"john@example.com\"}",
  "schema": {
    "type": "object",
    "required": ["name", "email"],
    "properties": {
      "name": {
        "type": "string",
        "minLength": 1
      },
      "age": {
        "type": "number",
        "minimum": 0
      },
      "email": {
        "type": "string",
        "format": "email"
      }
    }
  }
}
```

## Response

### Success Response (200 OK) - Valid JSON

```json
{
  "valid": true,
  "errors": []
}
```

### Error Response (200 OK) - Invalid JSON

```json
{
  "valid": false,
  "errors": [
    {
      "line": 1,
      "column": 25,
      "message": "Expected property name or '}' in JSON at position 25"
    }
  ]
}
```

### Schema Validation Error (200 OK)

```json
{
  "valid": false,
  "errors": [
    {
      "line": 1,
      "column": 1,
      "message": "email: Required property missing"
    },
    {
      "line": 1,
      "column": 1,
      "message": "age: Must be greater than or equal to 0"
    }
  ]
}
```

### Parameter Validation Error (400 Bad Request)

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
# Basic JSON syntax validation
curl -X POST https://api.parsify.dev/api/v1/tools/json/validate \
  -H "Content-Type: application/json" \
  -d '{
    "json": "{\"name\":\"John\",\"age\":30}"
  }'

# With schema validation
curl -X POST https://api.parsify.dev/api/v1/tools/json/validate \
  -H "Content-Type: application/json" \
  -d '{
    "json": "{\"name\":\"John\",\"age\":30,\"email\":\"john@example.com\"}",
    "schema": {
      "type": "object",
      "required": ["name", "email"],
      "properties": {
        "name": {"type": "string"},
        "email": {"type": "string", "format": "email"}
      }
    }
  }'

# Invalid JSON example
curl -X POST https://api.parsify.dev/api/v1/tools/json/validate \
  -H "Content-Type: application/json" \
  -d '{
    "json": "{\"name\":\"John\", age:30}"
  }'
```

### JavaScript

```javascript
async function validateJSON(jsonString, schema = null) {
  const response = await fetch('https://api.parsify.dev/api/v1/tools/json/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Optional: Add authentication
      // 'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      json: jsonString,
      schema: schema
    })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Validation failed');
  }

  return result;
}

// Usage examples
const validJSON = '{"name":"John","age":30}';
const invalidJSON = '{"name":"John", age:30}';

// Basic syntax validation
const result1 = await validateJSON(validJSON);
console.log('Valid:', result1.valid); // true

const result2 = await validateJSON(invalidJSON);
console.log('Valid:', result2.valid); // false
console.log('Errors:', result2.errors);

// Schema validation
const userSchema = {
  type: "object",
  required: ["name", "email"],
  properties: {
    name: { type: "string", minLength: 1 },
    email: { type: "string", format: "email" },
    age: { type: "number", minimum: 0, maximum: 150 }
  }
};

const userData = '{"name":"John","age":25,"email":"john@example.com"}';
const schemaResult = await validateJSON(userData, userSchema);

if (!schemaResult.valid) {
  console.log('Schema validation errors:');
  schemaResult.errors.forEach(error => {
    console.log(`- ${error.message} (line ${error.line}, col ${error.column})`);
  });
}
```

### Python

```python
import requests
import json

def validate_json(json_string, schema=None):
    url = "https://api.parsify.dev/api/v1/tools/json/validate"
    
    payload = {
        "json": json_string
    }
    
    if schema:
        payload["schema"] = schema
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

# Usage
valid_json = '{"name":"John","age":30}'
invalid_json = '{"name":"John", age:30}'

# Basic validation
result = validate_json(valid_json)
print(f"Valid: {result['valid']}")

# Schema validation
user_schema = {
    "type": "object",
    "required": ["name", "email"],
    "properties": {
        "name": {"type": "string", "minLength": 1},
        "email": {"type": "string", "format": "email"},
        "age": {"type": "number", "minimum": 0}
    }
}

user_data = '{"name":"John","age":25}'
schema_result = validate_json(user_data, user_schema)

if not schema_result['valid']:
    print("Schema validation errors:")
    for error in schema_result['errors']:
        print(f"- {error['message']} (line {error['line']}, col {error['column']})")
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "io/ioutil"
)

type ValidationResult struct {
    Valid  bool     `json:"valid"`
    Errors []Error  `json:"errors"`
}

type Error struct {
    Line    int    `json:"line"`
    Column  int    `json:"column"`
    Message string `json:"message"`
}

func validateJSON(jsonStr string, schema map[string]interface{}) (*ValidationResult, error) {
    url := "https://api.parsify.dev/api/v1/tools/json/validate"
    
    payload := map[string]interface{}{
        "json": jsonStr,
    }
    
    if schema != nil {
        payload["schema"] = schema
    }
    
    jsonData, _ := json.Marshal(payload)
    
    resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    var result ValidationResult
    err = json.Unmarshal(body, &result)
    return &result, err
}

func main() {
    jsonStr := `{"name":"John","age":30}`
    
    result, err := validateJSON(jsonStr, nil)
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }
    
    fmt.Printf("Valid: %t\n", result.Valid)
    if !result.Valid {
        for _, err := range result.Errors {
            fmt.Printf("Error: %s (line %d, col %d)\n", 
                err.Message, err.Line, err.Column)
        }
    }
}
```

## Schema Validation Features

### Supported Schema Features

The validator supports a subset of JSON Schema features:

#### Basic Types
- `string`, `number`, `integer`, `boolean`, `object`, `array`, `null`

#### Object Properties
- `required` - Required properties
- `properties` - Property definitions
- `additionalProperties` - Allow additional properties

#### String Validation
- `minLength`, `maxLength` - Length constraints
- `format` - Format validation (email, uri, etc.)

#### Number Validation
- `minimum`, `maximum` - Range constraints
- `multipleOf` - Value must be multiple of

#### Array Validation
- `minItems`, `maxItems` - Item count constraints
- `items` - Array item schema

### Example Schemas

#### User Profile Schema
```json
{
  "type": "object",
  "required": ["name", "email"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "number",
      "minimum": 0,
      "maximum": 150
    },
    "address": {
      "type": "object",
      "properties": {
        "street": {"type": "string"},
        "city": {"type": "string"},
        "zipCode": {"type": "string", "pattern": "^[0-9]{5}$"}
      }
    }
  }
}
```

#### Configuration Schema
```json
{
  "type": "object",
  "required": ["database", "server"],
  "properties": {
    "database": {
      "type": "object",
      "required": ["host", "port"],
      "properties": {
        "host": {"type": "string"},
        "port": {"type": "number", "minimum": 1, "maximum": 65535},
        "ssl": {"type": "boolean", "default": false}
      }
    },
    "server": {
      "type": "object",
      "required": ["port"],
      "properties": {
        "port": {"type": "number", "minimum": 1, "maximum": 65535},
        "workers": {"type": "number", "minimum": 1, "default": 1}
      }
    }
  }
}
```

## Common Use Cases

### 1. API Input Validation

```javascript
async function validateAPIInput(input, schema) {
  const result = await validateJSON(JSON.stringify(input), schema);
  
  if (!result.valid) {
    throw new ValidationError(result.errors);
  }
  
  return input;
}

class ValidationError extends Error {
  constructor(errors) {
    super(`Validation failed: ${errors.length} errors`);
    this.errors = errors;
  }
}
```

### 2. Configuration File Validation

```javascript
async function validateConfig(configString) {
  const configSchema = {
    type: "object",
    required: ["database", "api"],
    properties: {
      database: {
        type: "object",
        required: ["host", "port"],
        properties: {
          host: { type: "string" },
          port: { type: "number", minimum: 1, maximum: 65535 }
        }
      }
    }
  };
  
  const result = await validateJSON(configString, configSchema);
  
  if (!result.valid) {
    console.error('Configuration validation failed:');
    result.errors.forEach(error => {
      console.error(`- ${error.message}`);
    });
    process.exit(1);
  }
  
  return JSON.parse(configString);
}
```

### 3. Form Data Validation

```javascript
async function validateFormData(formData, schema) {
  try {
    const jsonString = JSON.stringify(formData);
    const result = await validateJSON(jsonString, schema);
    
    return {
      isValid: result.valid,
      errors: result.errors,
      data: result.valid ? formData : null
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [{ message: error.message }],
      data: null
    };
  }
}
```

## Error Handling

### Error Types

1. **Syntax Errors** - Invalid JSON format
2. **Schema Errors** - Data doesn't match schema requirements
3. **API Errors** - Request format or server issues

### Error Response Format

```json
{
  "valid": false,
  "errors": [
    {
      "line": 3,
      "column": 15,
      "message": "Expected double-quoted property name"
    }
  ]
}
```

### Handling Errors Gracefully

```javascript
async function safeValidate(jsonString, schema = null) {
  try {
    const result = await validateJSON(jsonString, schema);
    
    if (!result.valid) {
      return {
        success: false,
        isValid: false,
        errors: result.errors,
        suggestions: generateSuggestions(result.errors)
      };
    }
    
    return {
      success: true,
      isValid: true,
      data: JSON.parse(jsonString)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      isValid: false
    };
  }
}

function generateSuggestions(errors) {
  const suggestions = [];
  
  errors.forEach(error => {
    if (error.message.includes('Expected property name')) {
      suggestions.push('Check for missing quotes around property names');
    }
    if (error.message.includes('Unexpected end of JSON input')) {
      suggestions.push('Check for missing closing brackets or braces');
    }
    if (error.message.includes('Required property')) {
      suggestions.push('Add the required property to your JSON object');
    }
  });
  
  return suggestions;
}
```

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

## Related Endpoints

- [JSON Formatter](./json-formatter.md) - Format and beautify JSON
- [JSON Converter](./json-converter.md) - Convert JSON to other formats
- [Code Formatter](./code-formatter.md) - Format code in various languages
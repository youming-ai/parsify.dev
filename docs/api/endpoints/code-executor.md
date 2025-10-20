# Code Executor Endpoint

Execute code in various programming languages within a secure sandboxed environment.

## Endpoint

```
POST /api/v1/tools/code/execute
```

## Description

The code executor endpoint allows you to execute code in multiple programming languages within a secure, isolated environment. This is ideal for testing code snippets, running algorithms, or performing data processing tasks.

## Authentication

**Authentication Required**: This endpoint requires authentication with a Pro or Enterprise subscription.

## Request Parameters

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | The code to execute |
| `language` | string | Yes | Programming language (javascript, python) |
| `input` | string | No | Standard input for the code |
| `timeout` | number | No | Execution timeout in milliseconds (1000-30000, default: 5000) |

### Supported Languages

| Language | Subscription Required | Features |
|----------|---------------------|----------|
| JavaScript | Free | Standard JavaScript features |
| TypeScript | Pro | TypeScript compilation and execution |
| Python | Pro | Python 3.x standard library |

### Example Request Body

```json
{
  "code": "print('Hello, World!')\nname = input('Enter your name: ')\nprint(f'Hello, {name}!')",
  "language": "python",
  "input": "Alice",
  "timeout": 5000
}
```

## Response

### Success Response (200 OK)

```json
{
  "output": "Hello, World!\nEnter your name: Hello, Alice!\n",
  "exit_code": 0,
  "execution_time": 245,
  "memory_usage": 2048000,
  "error": null
}
```

### Error Response (200 OK) - Code Error

```json
{
  "output": "",
  "exit_code": 1,
  "execution_time": 15,
  "memory_usage": 1024000,
  "error": "NameError: name 'undefined_variable' is not defined"
}
```

### Authentication Error (401 Unauthorized)

```json
{
  "error": "Authentication Required",
  "message": "Authorization header with Bearer token is required",
  "code": "MISSING_TOKEN",
  "requestId": "uuid-here",
  "timestamp": "2023-12-01T12:00:00Z"
}
```

### Subscription Error (403 Forbidden)

```json
{
  "error": "Insufficient Permissions",
  "message": "You do not have the required permissions to access this resource",
  "code": "INSUFFICIENT_PERMISSIONS",
  "requestId": "uuid-here",
  "timestamp": "2023-12-01T12:00:00Z"
}
```

## Usage Examples

### cURL

```bash
# Execute Python code
curl -X POST https://api.parsify.dev/api/v1/tools/code/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello, World!\")",
    "language": "python"
  }'

# Execute JavaScript with input
curl -X POST https://api.parsify.dev/api/v1/tools/code/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const name = readline();\nconsole.log(`Hello, ${name}!`);",
    "language": "javascript",
    "input": "Alice"
  }'

# Execute TypeScript
curl -X POST https://api.parsify.dev/api/v1/tools/code/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "interface Person {\n  name: string;\n  age: number;\n}\n\nconst person: Person = {\n  name: \"John\",\n  age: 30\n};\n\nconsole.log(JSON.stringify(person));",
    "language": "typescript"
  }'
```

### JavaScript

```javascript
class CodeExecutor {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseURL = 'https://api.parsify.dev/api/v1';
  }

  async executeCode(code, language, options = {}) {
    const response = await fetch(`${this.baseURL}/tools/code/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        language,
        input: options.input,
        timeout: options.timeout || 5000
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Code execution failed');
    }

    return result;
  }

  async executePython(code, input = '') {
    return this.executeCode(code, 'python', { input });
  }

  async executeJavaScript(code, input = '') {
    return this.executeCode(code, 'javascript', { input });
  }

  async executeTypeScript(code, input = '') {
    return this.executeCode(code, 'typescript', { input });
  }
}

// Usage
const executor = new CodeExecutor(process.env.PARSIFY_API_TOKEN);

// Execute Python code
executor.executePython(`
  import json
  data = {"name": "John", "age": 30}
  print(json.dumps(data, indent=2))
`).then(result => {
  console.log('Python output:', result.output);
});

// Execute JavaScript code
executor.executeJavaScript(`
  const data = {name: "John", age: 30};
  console.log(JSON.stringify(data, null, 2));
`).then(result => {
  console.log('JavaScript output:', result.output);
});
```

### Python

```python
import requests
import json

class CodeExecutor:
    def __init__(self, api_token):
        self.api_token = api_token
        self.base_url = "https://api.parsify.dev/api/v1"
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        })

    def execute_code(self, code, language, **options):
        url = f"{self.base_url}/tools/code/execute"
        
        payload = {
            "code": code,
            "language": language,
            **options
        }
        
        response = self.session.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    def execute_python(self, code, input_text=""):
        return self.execute_code(code, "python", input=input_text)

    def execute_javascript(self, code, input_text=""):
        return self.execute_code(code, "javascript", input=input_text)

# Usage
executor = CodeExecutor("your_token_here")

# Execute Python code
result = executor.execute_python("""
import math

def calculate_circle_area(radius):
    return math.pi * radius ** 2

radius = 5
area = calculate_circle_area(radius)
print(f"The area of a circle with radius {radius} is {area:.2f}")
""")

print("Python output:")
print(result["output"])
print(f"Execution time: {result['execution_time']}ms")
```

## Language-Specific Examples

### JavaScript Examples

#### Data Processing
```javascript
const data = [
  { name: "Alice", age: 25, score: 85 },
  { name: "Bob", age: 30, score: 92 },
  { name: "Charlie", age: 35, score: 78 }
];

// Filter and process data
const adults = data.filter(person => person.age >= 18);
const averageScore = adults.reduce((sum, person) => sum + person.score, 0) / adults.length;

console.log(`Adults: ${adults.length}`);
console.log(`Average score: ${averageScore.toFixed(2)}`);
```

#### Algorithm Implementation
```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Calculate first 10 Fibonacci numbers
const fibNumbers = [];
for (let i = 0; i < 10; i++) {
  fibNumbers.push(fibonacci(i));
}

console.log("First 10 Fibonacci numbers:", fibNumbers);
```

### Python Examples

#### Data Analysis
```python
import json
from collections import Counter

# Sample data analysis
data = [
    {"name": "Alice", "department": "Engineering", "salary": 75000},
    {"name": "Bob", "department": "Marketing", "salary": 65000},
    {"name": "Charlie", "department": "Engineering", "salary": 80000},
    {"name": "Diana", "department": "Engineering", "salary": 70000}
]

# Calculate average salary by department
dept_salaries = {}
for emp in data:
    dept = emp["department"]
    if dept not in dept_salaries:
        dept_salaries[dept] = []
    dept_salaries[dept].append(emp["salary"])

for dept, salaries in dept_salaries.items():
    avg_salary = sum(salaries) / len(salaries)
    print(f"{dept}: ${avg_salary:,.2f}")
```

#### Web Scraping Simulation
```python
import re
from urllib.parse import urlparse

# Sample HTML processing
html_content = '''
<html>
<head><title>Sample Page</title></head>
<body>
<h1>Welcome to Parsify</h1>
<p>Email: contact@parsify.dev</p>
<p>Phone: 1-800-PARSIFY</p>
<a href="https://parsify.dev">Visit our site</a>
</body>
</html>
'''

# Extract email addresses
emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', html_content)
print("Found emails:", emails)

# Extract URLs
urls = re.findall(r'https?://[^\s<>"{}|\\^`[\]]+', html_content)
print("Found URLs:", urls)
```

## Security and Sandboxing

### Execution Environment

- **Isolated Process**: Each code execution runs in a separate process
- **Resource Limits**: CPU, memory, and execution time are strictly limited
- **Network Restrictions**: No internet access by default
- **File System**: Limited, temporary file system access

### Security Features

1. **Timeout Protection**: Code execution stops after specified timeout
2. **Memory Limits**: Prevents memory exhaustion attacks
3. **Process Isolation**: Each execution runs in isolation
4. **No Persistent State**: No data persists between executions

### Best Practices

```javascript
// Validate input before execution
function sanitizeCode(code) {
  // Remove potentially dangerous operations
  const dangerousPatterns = [
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /require\s*\(/gi,
    /import\s+.*\s+from/gi,
    /fetch\s*\(/gi,
    /XMLHttpRequest/gi
  ];

  let sanitizedCode = code;
  dangerousPatterns.forEach(pattern => {
    sanitizedCode = sanitizedCode.replace(pattern, '// BLOCKED');
  });

  return sanitizedCode;
}

// Execute with proper error handling
async function safeExecute(code, language, options = {}) {
  try {
    const sanitizedCode = sanitizeCode(code);
    const result = await executeCode(sanitizedCode, language, {
      timeout: Math.min(options.timeout || 5000, 10000), // Max 10 seconds
      input: options.input
    });

    return {
      success: result.exit_code === 0,
      output: result.output,
      executionTime: result.execution_time,
      error: result.error
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: null
    };
  }
}
```

## Performance Considerations

### Optimization Tips

1. **Use Appropriate Timeouts**: Set realistic timeout values
2. **Optimize Code**: Write efficient code to avoid timeouts
3. **Batch Operations**: Combine multiple operations when possible
4. **Memory Management**: Avoid memory-intensive operations

### Benchmark Examples

```javascript
// Performance testing
async function benchmarkCode(code, language, iterations = 10) {
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    const result = await executeCode(code, language);
    const end = Date.now();
    
    results.push({
      iteration: i + 1,
      executionTime: result.execution_time,
      totalTime: end - start,
      success: result.exit_code === 0
    });
  }
  
  const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
  const successRate = results.filter(r => r.success).length / results.length;
  
  return {
    results,
    averageExecutionTime: avgExecutionTime,
    successRate: successRate,
    language: language
  };
}
```

## Rate Limits

| Subscription | Requests/Hour | Max Timeout | Max Memory |
|--------------|---------------|-------------|------------|
| Free | 0 (not available) | - | - |
| Pro | 100 | 15 seconds | 256MB |
| Enterprise | 1,000 | 30 seconds | 512MB |

## Common Use Cases

### 1. Code Testing and Validation
```javascript
// Test code before deployment
async function testCode(code, testCases) {
  const results = [];
  
  for (const testCase of testCases) {
    const result = await executeCode(code, 'javascript', {
      input: JSON.stringify(testCase.input)
    });
    
    results.push({
      testCase: testCase.name,
      expected: testCase.expected,
      actual: result.output.trim(),
      passed: result.output.trim() === testCase.expected,
      executionTime: result.execution_time
    });
  }
  
  return results;
}
```

### 2. Data Processing Pipelines
```python
# Data transformation with code execution
def transform_data(data, transformation_code):
    """Transform data using custom Python code"""
    input_data = json.dumps(data)
    
    result = execute_code(transformation_code, "python", input_data)
    
    if result["exit_code"] == 0:
        return json.loads(result["output"])
    else:
        raise Exception(f"Transformation failed: {result['error']}")
```

### 3. Algorithm Visualization
```javascript
// Visualize sorting algorithms
async function visualizeSorting(algorithmCode, array) {
    const code = `
        ${algorithmCode}
        
        function printSteps(arr) {
            arr.forEach((step, index) => {
                console.log(\`Step \${index}: [\${step.join(', ')}]\`);
            });
        }
        
        const input = JSON.parse('${JSON.stringify(array)}');
        const result = sort([...input]);
        printSteps(result.steps);
    `;
    
    const result = await executeCode(code, 'javascript');
    return result.output;
}
```

## Error Handling

### Common Error Types

1. **Syntax Errors**: Invalid code syntax
2. **Runtime Errors**: Exceptions during execution
3. **Timeout Errors**: Code execution exceeded time limit
4. **Memory Errors**: Exceeded memory allocation limits

### Error Response Format

```json
{
  "output": "",
  "exit_code": 1,
  "execution_time": 1234,
  "memory_usage": 2048000,
  "error": "Traceback (most recent call last):\n  File \"<stdin>\", line 2, in <module>\nNameError: name 'x' is not defined"
}
```

## Related Endpoints

- [Code Formatter](./code-formatter.md) - Format and beautify code
- [JSON Formatter](./json-formatter.md) - Format JSON data
- [Jobs API](./jobs-create.md) - For long-running code executions
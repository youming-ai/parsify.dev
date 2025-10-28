import { beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('Code Execution Integration', () => {
  let testEnv: any

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  it('should complete full code execution workflow', async () => {
    // Step 1: Execute JavaScript code
    const jsCode = `
      function calculateSum(numbers) {
        return numbers.reduce((sum, num) => sum + num, 0);
      }

      const result = calculateSum([1, 2, 3, 4, 5]);
      console.log('Sum:', result);
      result;
    `

    const jsRes = await app.request(
      '/api/v1/tools/code/execute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: jsCode,
          language: 'javascript',
          input: '',
          timeout: 5000,
        }),
      },
      testEnv
    )

    expect(jsRes.status).toBe(200)
    const jsData = await jsRes.json()
    expect(jsData.exit_code).toBe(0)
    expect(jsData.output).toContain('Sum: 15')

    // Step 2: Execute Python code with input
    const pythonCode = `
def process_data(input_data):
    lines = input_data.strip().split('\\n')
    processed = [line.upper() for line in lines if line.strip()]
    return processed

input_data = """apple
banana
cherry
date"""
result = process_data(input_data)
print("Processed:", result)
result
    `

    const pythonRes = await app.request(
      '/api/v1/tools/code/execute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: pythonCode,
          language: 'python',
          input: 'apple\\nbanana\\ncherry\\ndate',
          timeout: 5000,
        }),
      },
      testEnv
    )

    expect(pythonRes.status).toBe(200)
    const pythonData = await pythonRes.json()
    expect(pythonData.exit_code).toBe(0)
    expect(pythonData.output).toContain('Processed: ["APPLE", "BANANA", "CHERRY", "DATE"]')

    // Verify both executions completed successfully
    expect(jsData.execution_time).toBeLessThan(5000)
    expect(pythonData.execution_time).toBeLessThan(5000)
  })

  it('should handle complex Python data structures', async () => {
    const pythonCode = `
import json

# Create complex nested data structure
data = {
    "users": [
        {"id": 1, "name": "Alice", "active": True},
        {"id": 2, "name": "Bob", "active": False}
    ],
    "settings": {
        "theme": "dark",
        "notifications": True,
        "features": ["email", "sms"]
    }
}

# Convert to JSON string and back
json_str = json.dumps(data, indent=2)
parsed = json.loads(json_str)

print("Users:", len(parsed["users"]))
print("Features:", parsed["settings"]["features"])
print("JSON valid:", json_str != "")
    `

    const res = await app.request(
      '/api/v1/tools/code/execute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: pythonCode,
          language: 'python',
          input: '',
          timeout: 5000,
        }),
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.exit_code).toBe(0)
    expect(data.output).toContain('Users: 2')
    expect(data.output).toContain('Features: ["email", "sms"]')
    expect(data.output).toContain('JSON valid: True')
  })

  it('should handle error scenarios properly', async () => {
    // Test JavaScript error
    const jsError = `
function divideByZero(a, b) {
  return a / b; // This will throw an error when b is 0
}

try {
  const result = divideByZero(10, 0);
  console.log("Result:", result);
} catch (error) {
  console.error("Error caught:", error.message);
}
    `

    const jsRes = await app.request(
      '/api/v1/tools/code/execute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: jsError,
          language: 'javascript',
          input: '',
          timeout: 5000,
        }),
      },
      testEnv
    )

    expect(jsRes.status).toBe(200)
    const jsData = await jsRes.json()
    expect(jsData.exit_code).toBe(0) // Error caught, so script completed
    expect(jsData.output).toContain('Error caught:')

    // Test Python error
    const pyError = `
def divide_by_zero(a, b):
    return a / b  # This will raise ZeroDivisionError

try:
    result = divide_by_zero(10, 0)
    print("Result:", result)
except ZeroDivisionError as e:
    print(f"Error caught: {e}")
    `

    const pyRes = await app.request(
      '/api/v1/tools/code/execute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: pyError,
          language: 'python',
          input: '',
          timeout: 5000,
        }),
      },
      testEnv
    )

    expect(pyRes.status).toBe(200)
    const pyData = await pyRes.json()
    expect(pyData.exit_code).toBe(0) // Error caught, script completed
    expect(pyData.output).toContain('Error caught: division by zero')
  })

  it('should respect execution timeouts', async () => {
    const longRunningCode = `
      // This should take longer than the 1 second timeout
      const start = Date.now();
      while (Date.now() - start < 2000) {
        // Run for 2 seconds
        Math.random();
      }
      console.log("Completed long running task");
    `

    const res = await app.request(
      '/api/v1/tools/code/execute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: longRunningCode,
          language: 'javascript',
          input: '',
          timeout: 1000, // 1 second timeout
        }),
      },
      testEnv
    )

    // Should be terminated by timeout
    expect([200, 400, 500]).toContain(res.status)

    const data = await res.json()
    if (res.status === 200) {
      // If it somehow completed, execution time should be reasonable
      expect(data.execution_time).toBeLessThan(2000)
    } else {
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('timeout')
    }
  })

  it('should enforce WASM security constraints', async () => {
    // Test network access restriction
    const networkCode = `
      // This should fail due to network access restrictions
      fetch('https://api.example.com/test')
        .then(response => response.json())
        .then(data => console.log('Network request successful:', data))
        .catch(error => console.error('Network request failed:', error.message));
    `

    const res = await app.request(
      '/api/v1/tools/code/execute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: networkCode,
          language: 'javascript',
          input: '',
          timeout: 5000,
        }),
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    // Network requests should be blocked in WASM sandbox
    expect(data.output).toContain('Network request failed')
  })

  it('should handle concurrent code execution', async () => {
    const code = `
      const start = Date.now();
      // Simulate some computation
      let sum = 0;
      for (let i = 0; i < 10000; i++) {
        sum += Math.random();
      }
      const end = Date.now();
      console.log(\`Computation completed in \${end - start}ms, sum: \${sum}\`);
    `

    // Execute multiple instances concurrently
    const promises = Array(3)
      .fill(null)
      .map(() =>
        app.request(
          '/api/v1/tools/code/execute',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              language: 'javascript',
              input: '',
              timeout: 5000,
            }),
          },
          testEnv
        )
      )

    const results = await Promise.all(promises)

    // All executions should complete successfully
    results.forEach(res => {
      expect(res.status).toBe(200)
    })

    // Each execution should have its own isolated result
    const outputs = results.map(res => res.json().output)
    outputs.forEach(output => {
      expect(output).toContain('Computation completed in')
      expect(output).toContain('sum:')
    })

    // Verify they're different executions (different random sums)
    const sums = outputs
      .map(output => {
        const match = output.match(/sum: ([\d.]+)/)
        return match ? parseFloat(match[1]) : null
      })
      .filter(Boolean)

    // Should have different sums due to random number generation
    const uniqueSums = new Set(sums)
    expect(uniqueSums.size).toBeGreaterThan(1)
  })
})

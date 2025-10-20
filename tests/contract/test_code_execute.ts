import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('POST /api/v1/tools/code/execute', () => {
  let testEnv: any

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  it('should execute JavaScript code successfully', async () => {
    const jsCode = `
      const result = 2 + 3;
      console.log('Result:', result);
      result;
    `

    const res = await app.request('/api/v1/tools/code/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: jsCode,
        language: 'javascript',
        input: '',
        timeout: 5000
      })
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('output')
    expect(data).toHaveProperty('exit_code', 0)
    expect(data.output).toContain('Result: 5')
    expect(data.execution_time).toBeDefined()
    expect(data.memory_usage).toBeDefined()
  })

  it('should execute Python code successfully', async () => {
    const pythonCode = `
result = 2 * 3
print(f"Result: {result}")
result
    `

    const res = await app.request('/api/v1/tools/code/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: pythonCode,
        language: 'python',
        input: '',
        timeout: 5000
      })
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('output')
    expect(data).toHaveProperty('exit_code', 0)
    expect(data.output).toContain('Result: 6')
  })

  it('should handle code with input', async () => {
    const jsCode = `
      const input = require('fs').readFileSync(0, 'utf-8').trim();
      console.log('Input received:', input);
      \`Processed: \${input.toUpperCase()}\`;
    `

    const res = await app.request('/api/v1/tools/code/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: jsCode,
        language: 'javascript',
        input: 'hello world',
        timeout: 5000
      })
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('output')
    expect(data.output).toContain('Input received: hello world')
    expect(data.output).toContain('Processed: HELLO WORLD')
  })

  it('should handle runtime errors gracefully', async () => {
    const jsCode = `
      // This will throw an error
      const result = undefinedProperty.property;
      console.log(result);
    `

    const res = await app.request('/api/v1/tools/code/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: jsCode,
        language: 'javascript',
        input: '',
        timeout: 5000
      })
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(data).toHaveProperty('exit_code', 1)
    expect(data.error).toBeDefined()
  })

  it('should enforce execution timeout', async () => {
    const infiniteLoopCode = `
      while (true) {
        // Infinite loop should be terminated by timeout
      }
    `

    const res = await app.request('/api/v1/tools/code/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: infiniteLoopCode,
        language: 'javascript',
        input: '',
        timeout: 1000 // Short timeout for testing
      })
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('timeout')
  })

  it('should validate required parameters', async () => {
    const res = await app.request('/api/v1/tools/code/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing required 'code' parameter
        language: 'javascript',
        timeout: 5000
      })
    }, testEnv)

    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data).toHaveProperty('error')
  })

  it('should reject unsupported languages in MVP', async () => {
    const rustCode = `
      fn main() {
          println!("Hello, Rust!");
      }
    `

    const res = await app.request('/api/v1/tools/code/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: rustCode,
        language: 'rust', // Not supported in MVP
        input: '',
        timeout: 5000
      })
    }, testEnv)

    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Unsupported language')
  })

  it('should enforce memory limits', async () => {
    const memoryHeavyCode = `
      // Try to allocate too much memory
      const arrays = [];
      for (let i = 0; i < 10000; i++) {
        arrays.push(new Array(100000).fill('x'));
      }
      console.log('Arrays created:', arrays.length);
    `

    const res = await app.request('/api/v1/tools/code/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: memoryHeavyCode,
        language: 'javascript',
        input: '',
        timeout: 5000
      })
    }, testEnv)

    // Should either succeed with memory limit enforcement or fail gracefully
    expect([200, 400, 500]).toContain(res.status)

    const data = await res.json()
    if (res.status === 200) {
      expect(data.memory_usage).toBeDefined()
      expect(data.memory_usage).toBeLessThan(256 * 1024 * 1024) // 256MB limit
    } else {
      expect(data).toHaveProperty('error')
    }
  })

  it('should handle TypeScript code', async () => {
    const tsCode = `
      interface User {
        name: string;
        age: number;
      }

      const user: User = {
        name: "Alice",
        age: 30
      };

      console.log(\`User: \${user.name}, Age: \${user.age}\`);
    `

    const res = await app.request('/api/v1/tools/code/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: tsCode,
        language: 'typescript',
        input: '',
        timeout: 5000
      })
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('output')
    expect(data.output).toContain('User: Alice, Age: 30')
  })
})
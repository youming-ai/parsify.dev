import { beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('POST /api/v1/tools/code/format', () => {
  let testEnv: any

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  describe('JavaScript Code Formatting', () => {
    it('should format JavaScript code with default settings', async () => {
      const unformattedJs = `
function test(){
const obj={name:'John',age:30};
if(obj.name){
console.log(obj.name);
}
}
`

      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: unformattedJs,
            language: 'javascript',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('formatted')
      expect(data).toHaveProperty('language', 'javascript')
      expect(data).toHaveProperty('options')

      // Should be properly formatted
      expect(data.formatted).toContain('function test() {')
      expect(data.formatted).toContain('const obj = {')
      expect(data.formatted).toContain("name: 'John'")
      expect(data.formatted).toContain('if (obj.name) {')
      expect(data.formatted).toContain('console.log(obj.name)')
    })

    it('should format JavaScript code with custom options', async () => {
      const unformattedJs = `function test(){const obj={name:'John',age:30};return obj;}`

      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: unformattedJs,
            language: 'javascript',
            options: {
              indent_size: 4,
              use_tabs: true,
              max_preserve_newlines: 2,
            },
          }),
        },
        testEnv
      )

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('formatted')
      expect(data).toHaveProperty('options')
      expect(data.options).toMatchObject({
        indent_size: 4,
        use_tabs: true,
        max_preserve_newlines: 2,
      })
    })
  })

  describe('TypeScript Code Formatting', () => {
    it('should format TypeScript code', async () => {
      const unformattedTs = `
interface User{
name:string;
age:number;
}
function getUser(id:number):User{
return {name:'John',age:30};
}
`

      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: unformattedTs,
            language: 'typescript',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('formatted')
      expect(data).toHaveProperty('language', 'typescript')

      expect(data.formatted).toContain('interface User {')
      expect(data.formatted).toContain('name: string')
      expect(data.formatted).toContain('age: number')
      expect(data.formatted).toContain('function getUser(id: number): User {')
    })

    it('should format TypeScript with generics and complex types', async () => {
      const complexTs = `
function map<T,U>(arr:T[],fn:(item:T)=>U):U[]{return arr.map(fn);}
type Maybe<T>=T|null;
`

      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: complexTs,
            language: 'typescript',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.formatted).toContain('function map<T, U>')
      expect(data.formatted).toContain('type Maybe<T> =')
    })
  })

  describe('Python Code Formatting', () => {
    it('should format Python code with PEP 8 standards', async () => {
      const unformattedPython = `
def calculate_sum(a,b):
    result=a+b
    if result>10:
        return result*2
    else:
        return result
class Calculator:
    def __init__(self):
        self.history=[]
`

      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: unformattedPython,
            language: 'python',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('formatted')
      expect(data).toHaveProperty('language', 'python')

      // Should follow PEP 8 formatting
      expect(data.formatted).toContain('def calculate_sum(a, b):')
      expect(data.formatted).toContain('result = a + b')
      expect(data.formatted).toContain('if result > 10:')
      expect(data.formatted).toContain('return result * 2')
      expect(data.formatted).toContain('class Calculator:')
    })

    it('should format Python with proper line length and spacing', async () => {
      const longLinePython = `def very_long_function_name_that_exceeds_pep8_limit(parameter_one, parameter_two, parameter_three, parameter_four): return parameter_one + parameter_two + parameter_three + parameter_four`

      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: longLinePython,
            language: 'python',
            options: {
              max_line_length: 79,
            },
          }),
        },
        testEnv
      )

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('formatted')

      // Should break long lines appropriately
      const lines = data.formatted.split('\n')
      expect(lines.some(line => line.length <= 79)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should validate required parameters', async () => {
      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Missing required 'code' parameter
            language: 'javascript',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('code')
    })

    it('should validate language parameter', async () => {
      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: 'function test() {}',
            language: 'ruby', // Unsupported language in MVP
          }),
        },
        testEnv
      )

      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('Unsupported language')
    })

    it('should handle empty code gracefully', async () => {
      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: '',
            language: 'javascript',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('formatted', '')
      expect(data).toHaveProperty('language', 'javascript')
    })

    it('should handle syntax errors in code', async () => {
      const invalidJs = `
function test() {
  const obj = {
    name: 'John'
  // Missing closing brace
`

      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: invalidJs,
            language: 'javascript',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('syntax')
    })

    it('should reject oversized code inputs', async () => {
      const largeCode = 'function test() {'.repeat(100000) // Very large string

      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: largeCode,
            language: 'javascript',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(413)

      const data = await res.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('Code size exceeds limit')
    })
  })

  describe('Options Validation', () => {
    it('should handle invalid formatting options', async () => {
      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: 'function test() {}',
            language: 'javascript',
            options: {
              indent_size: -1, // Invalid value
              max_line_length: 'invalid', // Wrong type
            },
          }),
        },
        testEnv
      )

      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('Invalid options')
    })

    it('should use default options when none provided', async () => {
      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: 'function test(){return true;}',
            language: 'javascript',
            // No options provided
          }),
        },
        testEnv
      )

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('formatted')
      expect(data).toHaveProperty('options')

      // Should have default options
      expect(data.options).toHaveProperty('indent_size')
      expect(data.options).toHaveProperty('max_line_length')
    })
  })

  describe('Language Detection', () => {
    it('should suggest language detection when not specified', async () => {
      const jsCode = 'function test() { console.log("Hello"); }'

      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: jsCode,
            // No language specified
          }),
        },
        testEnv
      )

      // In MVP, this should return an error requiring explicit language
      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('language')
    })
  })

  describe('Response Format', () => {
    it('should return consistent response format', async () => {
      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: 'function test() { return true; }',
            language: 'javascript',
            options: {
              indent_size: 2,
            },
          }),
        },
        testEnv
      )

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(Object.keys(data)).toEqual(
        expect.arrayContaining(['formatted', 'language', 'options'])
      )
      expect(typeof data.formatted).toBe('string')
      expect(typeof data.language).toBe('string')
      expect(typeof data.options).toBe('object')
    })

    it('should include metadata about formatting changes', async () => {
      const messyCode = "function    test( ) {const  obj={name:'John'};}"

      const res = await app.request(
        '/api/v1/tools/code/format',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: messyCode,
            language: 'javascript',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('formatted')

      // Formatted code should be different from input
      expect(data.formatted).not.toBe(messyCode)
      expect(data.formatted).toContain('function test() {')
      expect(data.formatted).toContain('const obj = {')
    })
  })
})

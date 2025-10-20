/**
 * Example usage of the CodeFormatter service
 *
 * This demonstrates the basic functionality of the code formatter
 * including language detection, formatting, and diff generation.
 */

import { CodeFormatter, formatCode, detectLanguage, SupportedLanguage } from './wasm/code_formatter'

async function demonstrateCodeFormatter() {
  console.log('🚀 Initializing CodeFormatter...')
  const formatter = new CodeFormatter()
  await formatter.initialize()

  console.log(`✅ Formatter initialized successfully!`)
  console.log(`📋 Supported languages: ${formatter.getSupportedLanguages().length}`)

  // Example 1: JavaScript formatting
  console.log('\n📝 Example 1: JavaScript Formatting')
  const jsCode = 'const x=1;const y=2;console.log(x+y);'
  console.log('Original:', jsCode)

  const jsResult = await formatter.format(jsCode, 'javascript')
  console.log('Formatted:', jsResult.formatted)
  console.log(`Size change: ${jsResult.sizeDifference > 0 ? '+' : ''}${jsResult.sizeDifference} bytes`)

  // Example 2: Python formatting
  console.log('\n🐍 Example 2: Python Formatting')
  const pyCode = 'def hello():print("Hello")'
  console.log('Original:', pyCode)

  const pyResult = await formatter.format(pyCode, 'python')
  console.log('Formatted:', pyResult.formatted)
  console.log(`Lines: ${pyResult.metadata.lineCount} → ${pyResult.metadata.formattedLineCount}`)

  // Example 3: JSON formatting
  console.log('\n📄 Example 3: JSON Formatting')
  const jsonCode = '{"name":"John","age":30}'
  console.log('Original:', jsonCode)

  const jsonResult = await formatter.format(jsonCode, 'json')
  console.log('Formatted:', jsonResult.formatted)

  // Example 4: Language detection
  console.log('\n🔍 Example 4: Language Detection')
  const codeSnippets = [
    'const hello = () => console.log("Hello!");',
    'def hello():\n    print("Hello")',
    '{"hello": "world"}',
    'function test() { return true; }',
  ]

  for (const snippet of codeSnippets) {
    const detected = await formatter.detectLanguage(snippet)
    console.log(`"${snippet.substring(0, 30)}..." → ${detected || 'unknown'}`)
  }

  // Example 5: Multiple file formatting
  console.log('\n📦 Example 5: Multiple File Formatting')
  const files = [
    { code: 'const x=1;', language: 'javascript' as SupportedLanguage },
    { code: 'def hello(): pass', language: 'python' as SupportedLanguage },
    { code: '{"key":"value"}', language: 'json' as SupportedLanguage },
  ]

  const results = await formatter.formatMultiple(files)
  console.log(`Processed ${results.length} files:`)
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.language}: ${result.success ? '✅' : '❌'}`)
  })

  // Example 6: Diff generation
  console.log('\n📊 Example 6: Diff Generation')
  const originalCode = 'const x=1;const y=2;function add(){return x+y;}'
  const diffConfig = {
    format: 'unified' as const,
    contextLines: 3,
    ignoreWhitespace: false,
    caseSensitive: true,
  }

  const diffResult = await formatter.format(originalCode, 'javascript', {}, diffConfig)
  console.log('Diff output:')
  console.log(diffResult.diff || 'No diff generated')

  // Example 7: Statistics
  console.log('\n📈 Example 7: Code Statistics')
  const complexCode = `// Complex example
function calculateSum(numbers) {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  return sum;
}

class Calculator {
  constructor() {
    this.history = [];
  }

  add(a, b) {
    const result = a + b;
    this.history.push(\`\${a} + \${b} = \${result}\`);
    return result;
  }
}
`

  const statsResult = await formatter.format(complexCode, 'javascript')
  console.log(`Character count: ${statsResult.metadata.characterCount}`)
  console.log(`Line count: ${statsResult.metadata.lineCount}`)
  console.log(`Formatting time: ${statsResult.metadata.formattingTime.toFixed(2)}ms`)
  console.log(`Total time: ${statsResult.metadata.totalTime.toFixed(2)}ms`)

  // Cleanup
  formatter.dispose()
  console.log('\n🧹 Formatter disposed successfully!')
}

// Example utility functions
export async function formatCodeExample() {
  const jsCode = 'const x=1;const y=2;'
  const result = await formatCode(jsCode, 'javascript')
  console.log('Utility function result:', result.formatted)
}

export async function detectLanguageExample() {
  const code = 'def hello(): print("Hello")'
  const language = await detectLanguage(code)
  console.log(`Detected language: ${language}`)
}

// Performance test
export async function performanceTest() {
  const formatter = new CodeFormatter()
  await formatter.initialize()

  const largeJsCode = 'const x = 1;\n'.repeat(1000)
  const startTime = performance.now()

  const result = await formatter.format(largeJsCode, 'javascript')

  const endTime = performance.now()
  const duration = endTime - startTime

  console.log(`Performance test completed in ${duration.toFixed(2)}ms`)
  console.log(`Processed ${result.originalSize} bytes in ${duration.toFixed(2)}ms`)
  console.log(`Throughput: ${(result.originalSize / duration * 1000).toFixed(0)} bytes/second`)

  formatter.dispose()
}

// Error handling examples
export async function errorHandlingExamples() {
  const formatter = new CodeFormatter()
  await formatter.initialize()

  try {
    // Empty code error
    await formatter.format('', 'javascript')
  } catch (error) {
    console.log('Caught empty code error:', error.message)
  }

  try {
    // Unsupported language error
    await formatter.format('some code', 'unsupported' as any)
  } catch (error) {
    console.log('Caught unsupported language error:', error.message)
  }

  try {
    // Malformed JSON
    await formatter.format('{"invalid": json}', 'json')
  } catch (error) {
    console.log('Caught parsing error:', error.message)
  }

  formatter.dispose()
}

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateCodeFormatter()
    .then(() => {
      console.log('\n🎉 All examples completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Error running examples:', error)
      process.exit(1)
    })
}

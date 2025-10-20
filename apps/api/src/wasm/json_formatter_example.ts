/**
 * Example usage of the JSON formatting service
 *
 * This file demonstrates how to use the JsonFormatter service
 * for high-performance JSON formatting with various options.
 */

import {
  JsonFormatter,
  formatJson,
  validateJson,
  minifyJson,
  prettifyJson,
  JsonFormattingOptions
} from './json_formatter'

async function demonstrateJsonFormatter() {
  console.log('🚀 JSON Formatter Service Demo')
  console.log('================================')

  // Sample JSON data
  const sampleJson = {
    user: {
      id: 12345,
      name: "John Doe",
      email: "john.doe@example.com",
      preferences: {
        theme: "dark",
        notifications: true,
        language: "en"
      }
    },
    orders: [
      { id: "ORD-001", total: 99.99, items: ["item1", "item2"] },
      { id: "ORD-002", total: 149.99, items: ["item3", "item4", "item5"] }
    ],
    metadata: {
      created: "2024-01-15T10:30:00Z",
      updated: "2024-01-20T14:22:00Z",
      version: 1
    }
  }

  const jsonString = JSON.stringify(sampleJson, null, 0)
  console.log(`Original JSON size: ${jsonString.length} bytes`)

  try {
    // Initialize the formatter
    const formatter = new JsonFormatter()
    await formatter.initialize()
    console.log('✅ JSON Formatter initialized successfully')

    // 1. Basic formatting with default options
    console.log('\n1. Basic Formatting:')
    const basicResult = await formatter.format(jsonString)
    console.log(`Success: ${basicResult.success}`)
    console.log(`Formatted size: ${basicResult.formattedSize} bytes`)
    console.log(`Compression ratio: ${basicResult.compressionRatio.toFixed(2)}`)
    console.log(`Processing time: ${basicResult.metadata.totalTime.toFixed(2)}ms`)
    console.log(`Depth: ${basicResult.metadata.depth}`)
    console.log(`Objects: ${basicResult.metadata.objectCount}, Arrays: ${basicResult.metadata.arrayCount}`)

    // 2. Compact formatting
    console.log('\n2. Compact Formatting:')
    const compactResult = await formatter.format(jsonString, { compact: true })
    console.log(`Success: ${compactResult.success}`)
    console.log(`Compact size: ${compactResult.formattedSize} bytes`)
    console.log(`Space saved: ${jsonString.length - compactResult.formattedSize} bytes`)

    // 3. Formatted with custom indent and sorted keys
    console.log('\n3. Custom Formatting (4-space indent, sorted keys):')
    const customOptions: JsonFormattingOptions = {
      indent: 4,
      sortKeys: true,
      insertFinalNewline: true
    }
    const customResult = await formatter.format(jsonString, customOptions)
    console.log(`Success: ${customResult.success}`)
    console.log(`Formatted with 4-space indent and sorted keys`)
    console.log(`First 200 characters:\n${customResult.formatted?.substring(0, 200)}...`)

    // 4. ASCII-only formatting
    console.log('\n4. ASCII-only Formatting:')
    const asciiResult = await formatter.format(jsonString, { ensureAscii: true })
    console.log(`Success: ${asciiResult.success}`)
    console.log(`ASCII-only formatting with escaped Unicode characters`)

    // 5. Validation
    console.log('\n5. JSON Validation:')
    const validJson = '{"name":"John","age":30}'
    const invalidJson = '{"name":"John",age:30}' // Invalid JSON

    const validResult = await validateJson(validJson)
    console.log(`Valid JSON result: ${validResult.valid}`)

    const invalidResult = await validateJson(invalidJson)
    console.log(`Invalid JSON result: ${invalidResult.valid}`)
    if (invalidResult.errors) {
      console.log(`Errors: ${invalidResult.errors.join(', ')}`)
    }

    // 6. Utility functions
    console.log('\n6. Utility Functions:')

    // Minify
    const minified = await minifyJson(jsonString)
    console.log(`Minified JSON size: ${minified.length} bytes`)

    // Prettify
    const prettified = await prettifyJson(jsonString, 2, true)
    console.log(`Prettified JSON size: ${prettified.length} bytes`)
    console.log(`First 100 characters:\n${prettified.substring(0, 100)}...`)

    // 7. Performance metrics
    console.log('\n7. Performance Metrics:')
    const metrics = formatter.getMetrics()
    console.log(`Last operation metrics:`, metrics)

    // 8. Error handling demonstration
    console.log('\n8. Error Handling:')
    try {
      await formatter.format('{"invalid": json}')
    } catch (error) {
      console.log(`Caught error: ${error.message}`)
      console.log(`Error type: ${error.constructor.name}`)
    }

    // Cleanup
    formatter.dispose()
    console.log('\n✅ Demo completed successfully!')

  } catch (error) {
    console.error('❌ Error during demo:', error)
  }
}

// Export for potential use in other modules
export { demonstrateJsonFormatter }

// Run demo if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  demonstrateJsonFormatter().catch(console.error)
}

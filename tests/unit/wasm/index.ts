/**
 * Index file for WASM module tests
 *
 * This file exports all test files and utilities for the WASM module test suite.
 */

// Export all test files
export * from './test_json_formatter'
export * from './test_json_validator'
export * from './test_json_converter'
export * from './test_code_formatter'
export * from './test_code_executor'
export * from './test_wasm_modules'

// Export mocks and utilities
export * from './mocks/wasm-mocks'
export * from './test-setup'

// Re-export common test utilities
export { expect, describe, it, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'

// Test suite information
export const WASM_TEST_SUITE = {
  name: 'WASM Modules Test Suite',
  version: '1.0.0',
  description: 'Comprehensive test suite for WASM modules including JSON processing, code formatting, and code execution',
  modules: [
    'JSON Formatter',
    'JSON Validator',
    'JSON Converter',
    'Code Formatter',
    'Code Executor',
    'WASM Infrastructure'
  ],
  coverage: {
    statements: 'Goal: 80%',
    branches: 'Goal: 80%',
    functions: 'Goal: 80%',
    lines: 'Goal: 80%'
  }
} as const

// Test runner utilities
export const testRunner = {
  /**
   * Run all WASM module tests
   */
  runAllTests: async () => {
    console.log('🧪 Running WASM Module Tests...')
    console.log(`📦 Modules: ${WASM_TEST_SUITE.modules.join(', ')}`)
    console.log('🎯 Coverage Goals: Statement/Function/Branch/Line ≥ 80%')

    // Test execution would be handled by Vitest
    return Promise.resolve()
  },

  /**
   * Get test suite information
   */
  getSuiteInfo: () => WASM_TEST_SUITE,

  /**
   * Validate test environment
   */
  validateEnvironment: () => {
    const checks = [
      { name: 'WebAssembly API', available: typeof WebAssembly !== 'undefined' },
      { name: 'Performance API', available: typeof performance !== 'undefined' },
      { name: 'Crypto API', available: typeof crypto !== 'undefined' },
      { name: 'Fetch API', available: typeof fetch !== 'undefined' }
    ]

    return {
      allAvailable: checks.every(check => check.available),
      checks
    }
  }
}

#!/usr/bin/env node

/**
 * Load Test CLI Runner
 * Command-line interface for executing load tests
 */

import { program } from 'commander'
import { runVitest } from 'vitest/node'
import { CONCURRENT_USER_SCENARIOS } from './config/load-test-config'

program
  .name('load-test-runner')
  .description('Comprehensive load testing CLI for concurrent users')
  .version('1.0.0')

program
  .command('run')
  .description('Run comprehensive load tests')
  .option(
    '-s, --scenario <scenario>',
    'Specific scenario to run (small-team, medium-team, large-team, stress-test, etc.)'
  )
  .option('-u, --users <number>', 'Number of concurrent users')
  .option('-d, --duration <seconds>', 'Test duration in seconds')
  .option('-o, --output <directory>', 'Output directory for reports', './tests/load/reports')
  .option('--url <url>', 'API base URL', process.env.API_BASE_URL || 'http://localhost:8787')
  .option('--skip-endurance', 'Skip endurance tests (long running)')
  .option('--skip-stress', 'Skip stress tests (high load)')
  .option('--report-format <format>', 'Report format: json, html, csv, all', 'all')
  .action(async options => {
    console.log('🚀 Starting Load Test Runner')
    console.log(`API URL: ${options.url}`)
    console.log(`Output Directory: ${options.output}`)

    // Set environment variables
    process.env.API_BASE_URL = options.url
    process.env.LOAD_TEST_OUTPUT_DIR = options.output

    // Build vitest command
    const vitestArgs = ['run', './tests/load/comprehensive-load-test.test.ts', '--reporter=verbose']

    // Add test name pattern if specific scenario
    if (options.scenario) {
      vitestArgs.push('-t', options.scenario)
    }

    // Add timeout override for long tests
    vitestArgs.push('--test-timeout', '3600000') // 1 hour

    try {
      console.log('Executing load tests...')
      await runVitest(vitestArgs)
      console.log('✅ Load tests completed successfully')
      console.log(`📊 Reports available in: ${options.output}`)
    } catch (error) {
      console.error('❌ Load tests failed:', error)
      process.exit(1)
    }
  })

program
  .command('scenarios')
  .description('List available load test scenarios')
  .action(() => {
    console.log('📋 Available Load Test Scenarios:')
    console.log('')

    CONCURRENT_USER_SCENARIOS.forEach(scenario => {
      console.log(`🔸 ${scenario.name}`)
      console.log(`   Description: ${scenario.description}`)
      console.log(`   Users: ${scenario.userCount}`)
      console.log(`   Duration: ${(scenario.duration / 1000 / 60).toFixed(1)} minutes`)
      console.log(`   Requirements:`)
      console.log(`     - Max P95: ${scenario.requirements.maxP95ResponseTime}ms`)
      console.log(
        `     - Min Success Rate: ${(scenario.requirements.minSuccessRate * 100).toFixed(1)}%`
      )
      console.log(`     - Min Throughput: ${scenario.requirements.minThroughput} req/s`)
      console.log('')
    })
  })

program
  .command('quick')
  .description('Run a quick smoke test (small team scenario)')
  .option('-u, --url <url>', 'API base URL', process.env.API_BASE_URL || 'http://localhost:8787')
  .option('-o, --output <directory>', 'Output directory for reports', './tests/load/reports')
  .action(async options => {
    console.log('🚀 Running Quick Load Test (Smoke Test)')

    process.env.API_BASE_URL = options.url
    process.env.LOAD_TEST_OUTPUT_DIR = options.output

    const vitestArgs = [
      'run',
      './tests/load/comprehensive-load-test.test.ts',
      '-t',
      'small team',
      '--reporter=verbose',
      '--test-timeout',
      '300000', // 5 minutes
    ]

    try {
      await runVitest(vitestArgs)
      console.log('✅ Quick load test completed successfully')
    } catch (error) {
      console.error('❌ Quick load test failed:', error)
      process.exit(1)
    }
  })

program
  .command('auth')
  .description('Run authentication-focused load tests')
  .option('-u, --url <url>', 'API base URL', process.env.API_BASE_URL || 'http://localhost:8787')
  .option('-o, --output <directory>', 'Output directory for reports', './tests/load/reports')
  .action(async options => {
    console.log('🔐 Running Authentication Load Tests')

    process.env.API_BASE_URL = options.url
    process.env.LOAD_TEST_OUTPUT_DIR = options.output

    const vitestArgs = [
      'run',
      './tests/load/scenarios/concurrent-auth-load.test.ts',
      '--reporter=verbose',
      '--test-timeout',
      '1800000', // 30 minutes
    ]

    try {
      await runVitest(vitestArgs)
      console.log('✅ Authentication load tests completed successfully')
    } catch (error) {
      console.error('❌ Authentication load tests failed:', error)
      process.exit(1)
    }
  })

program
  .command('tools')
  .description('Run tools-focused load tests')
  .option('-u, --url <url>', 'API base URL', process.env.API_BASE_URL || 'http://localhost:8787')
  .option('-o, --output <directory>', 'Output directory for reports', './tests/load/reports')
  .action(async options => {
    console.log('🔧 Running Tools Load Tests')

    process.env.API_BASE_URL = options.url
    process.env.LOAD_TEST_OUTPUT_DIR = options.output

    const vitestArgs = [
      'run',
      './tests/load/scenarios/simultaneous-tools-load.test.ts',
      '--reporter=verbose',
      '--test-timeout',
      '1800000', // 30 minutes
    ]

    try {
      await runVitest(vitestArgs)
      console.log('✅ Tools load tests completed successfully')
    } catch (error) {
      console.error('❌ Tools load tests failed:', error)
      process.exit(1)
    }
  })

program
  .command('validate')
  .description('Validate API server health and basic performance')
  .option('-u, --url <url>', 'API base URL', process.env.API_BASE_URL || 'http://localhost:8787')
  .action(async options => {
    console.log('🔍 Validating API server...')

    try {
      // Test health endpoint
      const healthResponse = await fetch(`${options.url}/health`)
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`)
      }
      console.log('✅ Health endpoint responding correctly')

      // Test basic API endpoints
      const toolsResponse = await fetch(`${options.url}/tools`)
      if (!toolsResponse.ok) {
        throw new Error(`Tools endpoint failed: ${toolsResponse.status}`)
      }
      console.log('✅ Tools endpoint responding correctly')

      // Test tool execution
      const formatResponse = await fetch(`${options.url}/tools/json/format`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: '{"test": "data"}', indent: 2 }),
      })
      if (!formatResponse.ok) {
        throw new Error(`JSON format endpoint failed: ${formatResponse.status}`)
      }
      console.log('✅ Tool execution working correctly')

      console.log('✅ API server validation passed - ready for load testing')
    } catch (error) {
      console.error('❌ API server validation failed:', error)
      console.log(
        'Please ensure the API server is running and accessible before running load tests'
      )
      process.exit(1)
    }
  })

program.parse()

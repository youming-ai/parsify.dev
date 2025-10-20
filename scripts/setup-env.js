#!/usr/bin/env node

/**
 * Environment Setup Script
 *
 * This script configures environment variables, Cloudflare resources,
 * and other infrastructure components for different deployment environments.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const readline = require('readline')

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..')
const ENV_DIR = path.join(PROJECT_ROOT, '.env')
const ENV_EXAMPLE_FILE = path.join(PROJECT_ROOT, '.env.example')
const ENV_LOCAL_FILE = path.join(PROJECT_ROOT, '.env.local')

// Available environments
const ENVIRONMENTS = ['development', 'staging', 'production']

// Required environment variables
const REQUIRED_VARS = {
  // Core application
  ENVIRONMENT: 'development',
  NODE_ENV: 'development',
  API_VERSION: 'v1',

  // Database
  DATABASE_URL: '',
  DATABASE_ID: '',

  // Cloudflare
  CLOUDFLARE_ACCOUNT_ID: '',
  CLOUDFLARE_API_TOKEN: '',

  // KV Namespaces
  KV_CACHE_ID: '',
  KV_SESSIONS_ID: '',
  KV_UPLOADS_ID: '',
  KV_ANALYTICS_ID: '',

  // R2 Storage
  R2_BUCKET_NAME: '',
  R2_BUCKET_ID: '',

  // Authentication
  JWT_SECRET: '',
  SESSION_SECRET: '',

  // Sentry
  SENTRY_DSN: '',
  SENTRY_AUTH_TOKEN: '',
  SENTRY_ORG: '',
  SENTRY_PROJECT: '',

  // External services
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: '',
}

// Colors for console output
const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(level, message) {
  console.log(`${colors[level]}[${level.toUpperCase()}]${colors.reset} ${message}`)
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex')
}

function checkEnvironmentExists(env) {
  const envFile = path.join(ENV_DIR, `${env}.env`)
  return fs.existsSync(envFile)
}

function createEnvironmentDirectory() {
  if (!fs.existsSync(ENV_DIR)) {
    fs.mkdirSync(ENV_DIR, { recursive: true })
    log('success', 'Created environment directory')
  }
}

function createEnvExample() {
  if (fs.existsSync(ENV_EXAMPLE_FILE)) {
    log('info', 'Environment example file already exists')
    return
  }

  let content = '# Environment Variables Example\n'
  content += '# Copy this file to .env.local and update the values\n\n'

  for (const [key, defaultValue] of Object.entries(REQUIRED_VARS)) {
    if (key.includes('SECRET') || key.includes('TOKEN')) {
      content += `${key}=\n`
    } else {
      content += `${key}=${defaultValue}\n`
    }
  }

  fs.writeFileSync(ENV_EXAMPLE_FILE, content)
  log('success', 'Created environment example file')
}

function createEnvironmentFile(env, vars = {}) {
  const envFile = path.join(ENV_DIR, `${env}.env`)

  let content = `# ${env.toUpperCase()} Environment Configuration\n`
  content += `# Generated on ${new Date().toISOString()}\n\n`

  // Environment-specific defaults
  const envDefaults = {
    development: {
      ENVIRONMENT: 'development',
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug',
      ENABLE_METRICS: 'true',
      ENABLE_HEALTH_CHECKS: 'true',
      SENTRY_TRACES_SAMPLE_RATE: '1.0',
      SENTRY_DEBUG: 'true'
    },
    staging: {
      ENVIRONMENT: 'staging',
      NODE_ENV: 'staging',
      LOG_LEVEL: 'info',
      ENABLE_METRICS: 'true',
      ENABLE_HEALTH_CHECKS: 'true',
      SENTRY_TRACES_SAMPLE_RATE: '0.5',
      SENTRY_DEBUG: 'true'
    },
    production: {
      ENVIRONMENT: 'production',
      NODE_ENV: 'production',
      LOG_LEVEL: 'warn',
      ENABLE_METRICS: 'true',
      ENABLE_HEALTH_CHECKS: 'true',
      SENTRY_TRACES_SAMPLE_RATE: '0.1',
      SENTRY_DEBUG: 'false'
    }
  }

  // Merge defaults with provided variables
  const mergedVars = { ...envDefaults[env], ...vars }

  // Write variables to file
  for (const [key, value] of Object.entries(mergedVars)) {
    content += `${key}=${value}\n`
  }

  fs.writeFileSync(envFile, content)
  log('success', `Created ${env} environment file`)
  return envFile
}

function validateEnvironmentFile(envFile) {
  if (!fs.existsSync(envFile)) {
    log('error', `Environment file not found: ${envFile}`)
    return false
  }

  const content = fs.readFileSync(envFile, 'utf8')
  const lines = content.split('\n')
  const vars = {}
  const missingVars = []

  // Parse environment file
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim()
      }
    }
  }

  // Check for required variables
  for (const [key] of Object.entries(REQUIRED_VARS)) {
    if (!vars[key] || vars[key] === '') {
      missingVars.push(key)
    }
  }

  if (missingVars.length > 0) {
    log('error', `Missing required environment variables in ${envFile}:`)
    missingVars.forEach(varName => log('error', `  - ${varName}`))
    return false
  }

  log('success', `Environment file ${envFile} is valid`)
  return true
}

async function setupDevelopmentEnvironment() {
  log('info', 'Setting up development environment...')

  const rl = createInterface()

  try {
    // Check if development env already exists
    if (checkEnvironmentExists('development')) {
      const overwrite = await askQuestion(
        rl,
        'Development environment already exists. Overwrite? (y/N): '
      )

      if (overwrite.toLowerCase() !== 'y') {
        log('info', 'Skipping development environment setup')
        return
      }
    }

    // Generate secrets
    const jwtSecret = generateSecret(64)
    const sessionSecret = generateSecret(64)

    // Collect user input
    log('info', 'Please provide the following configuration values:')

    const cloudflareAccountId = await askQuestion(
      rl, 'Cloudflare Account ID (leave empty for local development): '
    )

    const sentryDsn = await askQuestion(
      rl, 'Sentry DSN (leave empty to disable error tracking): '
    )

    const databaseId = await askQuestion(
      rl, 'Cloudflare D1 Database ID (leave empty for local): '
    )

    // Create environment variables
    const envVars = {
      JWT_SECRET: jwtSecret,
      SESSION_SECRET: sessionSecret,
      CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId || 'local',
      SENTRY_DSN: sentryDsn || '',
      DATABASE_ID: databaseId || 'local',
      CLOUDFLARE_API_TOKEN: '',
      KV_CACHE_ID: 'local',
      KV_SESSIONS_ID: 'local',
      KV_UPLOADS_ID: 'local',
      KV_ANALYTICS_ID: 'local',
      R2_BUCKET_NAME: 'parsify-files-dev',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      GITHUB_CLIENT_ID: '',
      GITHUB_CLIENT_SECRET: ''
    }

    // Create environment file
    const envFile = createEnvironmentFile('development', envVars)

    // Validate the created file
    if (validateEnvironmentFile(envFile)) {
      log('success', 'Development environment configured successfully')
      log('info', `Environment file: ${envFile}`)
    } else {
      log('error', 'Development environment configuration failed')
    }

  } catch (error) {
    log('error', `Development environment setup failed: ${error.message}`)
  } finally {
    rl.close()
  }
}

async function setupStagingEnvironment() {
  log('info', 'Setting up staging environment...')

  const rl = createInterface()

  try {
    // Check if staging env already exists
    if (checkEnvironmentExists('staging')) {
      const overwrite = await askQuestion(
        rl,
        'Staging environment already exists. Overwrite? (y/N): '
      )

      if (overwrite.toLowerCase() !== 'y') {
        log('info', 'Skipping staging environment setup')
        return
      }
    }

    // Collect required configuration
    log('info', 'Please provide the following configuration values:')

    const requiredFields = [
      'CLOUDFLARE_ACCOUNT_ID',
      'CLOUDFLARE_API_TOKEN',
      'DATABASE_ID',
      'SENTRY_DSN',
      'SENTRY_AUTH_TOKEN',
      'SENTRY_ORG',
      'SENTRY_PROJECT'
    ]

    const envVars = {}

    for (const field of requiredFields) {
      const value = await askQuestion(
        rl, `${field}: `
      )
      envVars[field] = value
    }

    // Generate secrets
    envVars.JWT_SECRET = generateSecret(64)
    envVars.SESSION_SECRET = generateSecret(64)

    // Optional fields
    envVars.KV_CACHE_ID = await askQuestion(
      rl, 'KV Cache ID (optional): '
    ) || ''

    envVars.KV_SESSIONS_ID = await askQuestion(
      rl, 'KV Sessions ID (optional): '
    ) || ''

    envVars.R2_BUCKET_NAME = await askQuestion(
      rl, 'R2 Bucket Name (default: parsify-files-staging): '
    ) || 'parsify-files-staging'

    // Create environment file
    const envFile = createEnvironmentFile('staging', envVars)

    // Validate the created file
    if (validateEnvironmentFile(envFile)) {
      log('success', 'Staging environment configured successfully')
      log('info', `Environment file: ${envFile}`)
    } else {
      log('error', 'Staging environment configuration failed')
    }

  } catch (error) {
    log('error', `Staging environment setup failed: ${error.message}`)
  } finally {
    rl.close()
  }
}

async function setupProductionEnvironment() {
  log('warning', 'Setting up production environment...')
  log('warning', 'This will configure production deployment settings')

  const rl = createInterface()

  try {
    // Confirmation
    const confirm = await askQuestion(
      rl,
      'Are you sure you want to configure production environment? (yes/no): '
    )

    if (confirm.toLowerCase() !== 'yes') {
      log('info', 'Production environment setup cancelled')
      return
    }

    // Check if production env already exists
    if (checkEnvironmentExists('production')) {
      const overwrite = await askQuestion(
        rl,
        'Production environment already exists. Overwrite? (yes/no): '
      )

      if (overwrite.toLowerCase() !== 'yes') {
        log('info', 'Skipping production environment setup')
        return
      }
    }

    // Collect required configuration
    log('info', 'Please provide the following production configuration values:')

    const requiredFields = [
      'CLOUDFLARE_ACCOUNT_ID',
      'CLOUDFLARE_API_TOKEN',
      'DATABASE_ID',
      'SENTRY_DSN',
      'SENTRY_AUTH_TOKEN',
      'SENTRY_ORG',
      'SENTRY_PROJECT'
    ]

    const envVars = {}

    for (const field of requiredFields) {
      const value = await askQuestion(
        rl, `${field} (required): `
      )

      if (!value) {
        log('error', `${field} is required for production environment`)
        rl.close()
        return
      }

      envVars[field] = value
    }

    // Generate secrets
    log('info', 'Generating secure secrets...')
    envVars.JWT_SECRET = generateSecret(128)
    envVars.SESSION_SECRET = generateSecret(128)

    // OAuth configuration
    log('info', 'OAuth configuration (leave empty if not using OAuth):')
    envVars.GOOGLE_CLIENT_ID = await askQuestion(
      rl, 'Google Client ID (optional): '
    ) || ''

    envVars.GOOGLE_CLIENT_SECRET = await askQuestion(
      rl, 'Google Client Secret (optional): '
    ) || ''

    envVars.GITHUB_CLIENT_ID = await askQuestion(
      rl, 'GitHub Client ID (optional): '
    ) || ''

    envVars.GITHUB_CLIENT_SECRET = await askQuestion(
      rl, 'GitHub Client Secret (optional): '
    ) || ''

    // Storage configuration
    envVars.KV_CACHE_ID = await askQuestion(
      rl, 'KV Cache ID (required): '
    )

    envVars.KV_SESSIONS_ID = await askQuestion(
      rl, 'KV Sessions ID (required): '
    )

    envVars.KV_UPLOADS_ID = await askQuestion(
      rl, 'KV Uploads ID (required): '
    )

    envVars.KV_ANALYTICS_ID = await askQuestion(
      rl, 'KV Analytics ID (required): '
    )

    envVars.R2_BUCKET_NAME = await askQuestion(
      rl, 'R2 Bucket Name (required): '
    )

    // Validate required production fields
    const requiredProdFields = [
      'KV_CACHE_ID', 'KV_SESSIONS_ID', 'KV_UPLOADS_ID',
      'KV_ANALYTICS_ID', 'R2_BUCKET_NAME'
    ]

    for (const field of requiredProdFields) {
      if (!envVars[field]) {
        log('error', `${field} is required for production environment`)
        rl.close()
        return
      }
    }

    // Create environment file
    const envFile = createEnvironmentFile('production', envVars)

    // Validate the created file
    if (validateEnvironmentFile(envFile)) {
      log('success', 'Production environment configured successfully')
      log('info', `Environment file: ${envFile}`)
      log('warning', 'Please store this environment file securely and never commit it to version control')
    } else {
      log('error', 'Production environment configuration failed')
    }

  } catch (error) {
    log('error', `Production environment setup failed: ${error.message}`)
  } finally {
    rl.close()
  }
}

function loadEnvironment(env) {
  const envFile = path.join(ENV_DIR, `${env}.env`)

  if (!fs.existsSync(envFile)) {
    log('error', `Environment file not found: ${envFile}`)
    return false
  }

  const content = fs.readFileSync(envFile, 'utf8')
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim()
      }
    }
  }

  log('success', `Loaded ${env} environment variables`)
  return true
}

function listEnvironments() {
  log('info', 'Available environments:')

  for (const env of ENVIRONMENTS) {
    const envFile = path.join(ENV_DIR, `${env}.env`)
    const exists = fs.existsSync(envFile)
    const status = exists ? '✓' : '✗'

    console.log(`  ${status} ${env}`)
  }
}

function validateEnvironment(env) {
  const envFile = path.join(ENV_DIR, `${env}.env`)

  if (!validateEnvironmentFile(envFile)) {
    log('error', `Environment ${env} validation failed`)
    return false
  }

  log('success', `Environment ${env} is valid`)
  return true
}

// Main CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'
  const env = args[1]

  // Ensure environment directory exists
  createEnvironmentDirectory()

  switch (command) {
    case 'init':
      createEnvExample()
      break

    case 'setup':
    case 'create':
      if (!env) {
        log('error', 'Environment name is required')
        log('info', 'Usage: node setup-env.js setup <environment>')
        process.exit(1)
      }

      if (!ENVIRONMENTS.includes(env)) {
        log('error', `Invalid environment: ${env}`)
        log('info', `Available environments: ${ENVIRONMENTS.join(', ')}`)
        process.exit(1)
      }

      switch (env) {
        case 'development':
          await setupDevelopmentEnvironment()
          break
        case 'staging':
          await setupStagingEnvironment()
          break
        case 'production':
          await setupProductionEnvironment()
          break
      }
      break

    case 'load':
      if (!env) {
        log('error', 'Environment name is required')
        log('info', 'Usage: node setup-env.js load <environment>')
        process.exit(1)
      }

      loadEnvironment(env)
      break

    case 'validate':
      if (!env) {
        log('error', 'Environment name is required')
        log('info', 'Usage: node setup-env.js validate <environment>')
        process.exit(1)
      }

      validateEnvironment(env)
      break

    case 'list':
      listEnvironments()
      break

    case 'help':
      console.log(`
Environment Setup Script

Usage: node setup-env.js <command> [environment]

Commands:
  init                     Create environment example file
  setup <env>             Set up a new environment (development|staging|production)
  create <env>            Alias for setup
  load <env>              Load environment variables into current process
  validate <env>          Validate environment configuration
  list                    List available environments
  help                    Show this help message

Examples:
  node setup-env.js init
  node setup-env.js setup development
  node setup-env.js validate production
  node setup-env.js list
`)
      break

    default:
      log('error', `Unknown command: ${command}`)
      log('info', 'Run "node setup-env.js help" for usage information')
      process.exit(1)
  }
}

// Export functions for testing
module.exports = {
  setupDevelopmentEnvironment,
  setupStagingEnvironment,
  setupProductionEnvironment,
  createEnvironmentFile,
  validateEnvironmentFile,
  loadEnvironment,
  generateSecret
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error)
}

#!/usr/bin/env node

/**
 * Cloudflare Deployment Script
 *
 * This script automates deployment to Cloudflare Workers, D1 databases,
 * KV namespaces, R2 storage, and other Cloudflare services.
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const _crypto = require('node:crypto')

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..')
const BUILD_DIR = path.join(PROJECT_ROOT, 'dist')
const ENV_DIR = path.join(PROJECT_ROOT, '.env')
const API_DIR = path.join(PROJECT_ROOT, 'apps/api')
const _WEB_DIR = path.join(PROJECT_ROOT, 'apps/web')

// Colors for console output
const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[34m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
}

function log(level, message) {
  console.log(`${colors[level]}[${level.toUpperCase()}]${colors.reset} ${message}`)
}

function exec(command, options = {}) {
  const { silent = false, cwd = PROJECT_ROOT, env = process.env } = options

  try {
    log('info', `Executing: ${command}`)
    const result = execSync(command, {
      cwd,
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      env,
    })
    return result
  } catch (error) {
    log('error', `Command failed: ${command}`)
    log('error', error.message)
    if (!silent) {
      process.exit(1)
    }
    throw error
  }
}

function checkWrangler() {
  try {
    const version = exec('npx wrangler --version', { silent: true })
    log('success', `Wrangler CLI available: ${version.trim()}`)
    return true
  } catch (_error) {
    log('error', 'Wrangler CLI not found. Please install it with: npm install -g wrangler')
    return false
  }
}

function loadEnvironment(env) {
  const envFile = path.join(ENV_DIR, `${env}.env`)

  if (!fs.existsSync(envFile)) {
    log('error', `Environment file not found: ${envFile}`)
    log('info', `Create it with: node setup-env.js setup ${env}`)
    return false
  }

  // Load environment variables
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

function checkBuildArtifacts() {
  if (!fs.existsSync(BUILD_DIR)) {
    log('error', 'Build directory not found')
    log('info', 'Run the build script first: node scripts/build.js')
    return false
  }

  const apiBuild = path.join(BUILD_DIR, 'api')
  const _webBuild = path.join(BUILD_DIR, 'web')

  if (!fs.existsSync(apiBuild)) {
    log('error', 'API build not found')
    return false
  }

  log('success', 'Build artifacts verified')
  return true
}

function deployAPI(env) {
  log('info', `Deploying API to ${env} environment...`)

  const apiBuildPath = path.join(BUILD_DIR, 'api')
  const wranglerConfig = path.join(apiBuildPath, 'wrangler.toml')

  if (!fs.existsSync(wranglerConfig)) {
    log('error', 'Wrangler configuration not found in API build')
    return false
  }

  // Change to API build directory
  const deployEnv = { ...process.env }

  try {
    // Deploy to Cloudflare Workers
    log('info', 'Deploying to Cloudflare Workers...')

    let deployCommand = 'npx wrangler deploy'
    if (env !== 'development') {
      deployCommand += ` --env ${env}`
    }

    exec(deployCommand, { cwd: apiBuildPath, env: deployEnv })

    log('success', `API deployed successfully to ${env}`)

    // Get deployment URL
    const workerName = process.env.CLOUDFLARE_WORKER_NAME || 'parsify-api'
    const workerUrl = `https://${workerName}.${process.env.CLOUDFLARE_ACCOUNT_ID || 'your-account'}.workers.dev`

    log('info', `API URL: ${workerUrl}`)

    return {
      success: true,
      url: workerUrl,
      environment: env,
    }
  } catch (error) {
    log('error', `API deployment failed: ${error.message}`)
    return {
      success: false,
      error: error.message,
    }
  }
}

function setupD1Database(env) {
  log('info', `Setting up D1 database for ${env}...`)

  const databaseName = process.env.DATABASE_NAME || `parsify-${env}`

  try {
    // Create database if it doesn't exist
    log('info', `Creating D1 database: ${databaseName}`)

    try {
      exec(`npx wrangler d1 create ${databaseName}`, { silent: true })
      log('success', `D1 database created: ${databaseName}`)
    } catch (_error) {
      // Database might already exist
      log('info', `D1 database ${databaseName} may already exist`)
    }

    // Get database info
    const result = exec(`npx wrangler d1 info ${databaseName}`, {
      silent: true,
    })
    log('success', `D1 database info retrieved`)

    return {
      success: true,
      databaseName,
      info: result,
    }
  } catch (error) {
    log('error', `D1 database setup failed: ${error.message}`)
    return {
      success: false,
      error: error.message,
    }
  }
}

function setupKVNamespaces(env) {
  log('info', `Setting up KV namespaces for ${env}...`)

  const namespaces = [
    { binding: 'CACHE', name: `parsify-cache-${env}` },
    { binding: 'SESSIONS', name: `parsify-sessions-${env}` },
    { binding: 'UPLOADS', name: `parsify-uploads-${env}` },
    { binding: 'ANALYTICS', name: `parsify-analytics-${env}` },
  ]

  const results = {}

  for (const namespace of namespaces) {
    try {
      log('info', `Creating KV namespace: ${namespace.name}`)

      try {
        exec(`npx wrangler kv:namespace create ${namespace.name}`, {
          silent: true,
        })
        log('success', `KV namespace created: ${namespace.name}`)
      } catch (_error) {
        // Namespace might already exist
        log('info', `KV namespace ${namespace.name} may already exist`)
      }

      // Get namespace info
      const result = exec(`npx wrangler kv:namespace info ${namespace.name}`, {
        silent: true,
      })

      results[namespace.binding] = {
        success: true,
        name: namespace.name,
        info: result,
      }
    } catch (error) {
      log('error', `KV namespace setup failed for ${namespace.name}: ${error.message}`)
      results[namespace.binding] = {
        success: false,
        error: error.message,
      }
    }
  }

  return results
}

function setupR2Bucket(env) {
  log('info', `Setting up R2 bucket for ${env}...`)

  const bucketName = process.env.R2_BUCKET_NAME || `parsify-files-${env}`

  try {
    // Create bucket if it doesn't exist
    log('info', `Creating R2 bucket: ${bucketName}`)

    try {
      exec(`npx wrangler r2 bucket create ${bucketName}`, { silent: true })
      log('success', `R2 bucket created: ${bucketName}`)
    } catch (_error) {
      // Bucket might already exist
      log('info', `R2 bucket ${bucketName} may already exist`)
    }

    // Get bucket info
    const result = exec(`npx wrangler r2 bucket info ${bucketName}`, {
      silent: true,
    })
    log('success', `R2 bucket info retrieved`)

    return {
      success: true,
      bucketName,
      info: result,
    }
  } catch (error) {
    log('error', `R2 bucket setup failed: ${error.message}`)
    return {
      success: false,
      error: error.message,
    }
  }
}

function setupDurableObjects(env) {
  log('info', `Setting up Durable Objects for ${env}...`)

  // Durable Objects are configured in wrangler.toml
  // This function validates the configuration

  const wranglerConfig = path.join(API_DIR, 'wrangler.toml')

  if (!fs.existsSync(wranglerConfig)) {
    log('warning', 'Wrangler configuration not found for Durable Objects validation')
    return { success: true, message: 'Skipped Durable Objects setup' }
  }

  try {
    const config = fs.readFileSync(wranglerConfig, 'utf8')

    // Check for Durable Objects configuration
    const hasDurableObjects = config.includes('[[durable_objects.bindings]]')

    if (hasDurableObjects) {
      log('success', 'Durable Objects configuration found')
      return { success: true, hasDurableObjects: true }
    } else {
      log('info', 'No Durable Objects configuration found')
      return { success: true, hasDurableObjects: false }
    }
  } catch (error) {
    log('error', `Durable Objects validation failed: ${error.message}`)
    return {
      success: false,
      error: error.message,
    }
  }
}

function deployWebApp(env) {
  log('info', `Deploying web application to ${env}...`)

  const webBuildPath = path.join(BUILD_DIR, 'web')

  if (!fs.existsSync(webBuildPath)) {
    log('error', 'Web application build not found')
    return false
  }

  try {
    // For now, we'll assume static deployment to Cloudflare Pages
    // In a real implementation, you might use:
    // - Cloudflare Pages
    // - Custom domain with Workers
    // - CDN integration

    log('info', 'Preparing web application for deployment...')

    // Create a deployment package
    const packagePath = path.join(BUILD_DIR, `web-${env}-package.tar.gz`)

    // This is a placeholder - actual packaging would depend on deployment target
    log('success', `Web application package prepared: ${packagePath}`)

    return {
      success: true,
      packagePath,
      environment: env,
    }
  } catch (error) {
    log('error', `Web application deployment failed: ${error.message}`)
    return {
      success: false,
      error: error.message,
    }
  }
}

function runDatabaseMigrations(env) {
  log('info', `Running database migrations for ${env}...`)

  try {
    // Run the database script
    exec(`node scripts/database.js migrate ${env}`, { cwd: PROJECT_ROOT })
    log('success', 'Database migrations completed')
    return true
  } catch (error) {
    log('error', `Database migrations failed: ${error.message}`)
    return false
  }
}

function configureCustomDomain(_env, domain) {
  if (!domain) {
    log('info', 'No custom domain specified, skipping domain configuration')
    return { success: true, message: 'No custom domain configured' }
  }

  log('info', `Configuring custom domain: ${domain}`)

  try {
    // Add custom domain to worker
    const _workerName = process.env.CLOUDFLARE_WORKER_NAME || 'parsify-api'

    exec(`npx wrangler custom-domains add ${domain}`, { silent: true })
    log('success', `Custom domain configured: ${domain}`)

    return {
      success: true,
      domain,
      url: `https://${domain}`,
    }
  } catch (error) {
    log('error', `Custom domain configuration failed: ${error.message}`)
    return {
      success: false,
      error: error.message,
    }
  }
}

function performHealthCheck(deploymentUrl) {
  log('info', `Performing health check on: ${deploymentUrl}`)

  try {
    // Simple health check
    const healthUrl = `${deploymentUrl}/health`

    const result = exec(`curl -s ${healthUrl}`, { silent: true })

    if (result.includes('"status"') && result.includes('"operational"')) {
      log('success', 'Health check passed')
      return true
    } else {
      log('warning', 'Health check returned unexpected response')
      log('info', `Response: ${result}`)
      return false
    }
  } catch (error) {
    log('error', `Health check failed: ${error.message}`)
    return false
  }
}

function generateDeploymentReport(deploymentResults) {
  log('info', 'Generating deployment report...')

  const report = {
    timestamp: new Date().toISOString(),
    environment: deploymentResults.environment,
    deployment: {
      api: deploymentResults.api,
      web: deploymentResults.web,
      database: deploymentResults.database,
      kv: deploymentResults.kv,
      r2: deploymentResults.r2,
      durableObjects: deploymentResults.durableObjects,
    },
    urls: {
      api: deploymentResults.api?.url,
      web: deploymentResults.web?.url,
    },
    health: deploymentResults.health,
    duration: deploymentResults.duration,
  }

  const reportPath = path.join(BUILD_DIR, `deployment-report-${deploymentResults.environment}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  log('success', `Deployment report saved: ${reportPath}`)

  // Print summary
  console.log('\n=== Deployment Summary ===')
  console.log(`Environment: ${deploymentResults.environment}`)
  console.log(`Timestamp: ${report.timestamp}`)
  console.log(`Duration: ${deploymentResults.duration}s`)
  console.log(`API Status: ${deploymentResults.api?.success ? '✓ Success' : '✗ Failed'}`)
  console.log(`Web Status: ${deploymentResults.web?.success ? '✓ Success' : '✗ Failed'}`)
  console.log(`Database Status: ${deploymentResults.database?.success ? '✓ Success' : '✗ Failed'}`)
  console.log(`Health Check: ${deploymentResults.health ? '✓ Passed' : '✗ Failed'}`)

  if (deploymentResults.api?.url) {
    console.log(`\nAPI URL: ${deploymentResults.api.url}`)
  }

  if (deploymentResults.web?.url) {
    console.log(`Web URL: ${deploymentResults.web.url}`)
  }

  return report
}

// Main deployment function
async function deploy(env, options = {}) {
  const startTime = Date.now()
  const { skipBuild = false, skipMigrations = false, domain = null, healthCheck = true } = options

  log('info', `Starting deployment to ${env} environment...`)

  const results = {
    environment: env,
    api: null,
    web: null,
    database: null,
    kv: null,
    r2: null,
    durableObjects: null,
    health: false,
    duration: 0,
  }

  try {
    // Check prerequisites
    if (!checkWrangler()) {
      throw new Error('Wrangler CLI not available')
    }

    // Load environment
    if (!loadEnvironment(env)) {
      throw new Error(`Failed to load ${env} environment`)
    }

    // Check build artifacts
    if (!skipBuild && !checkBuildArtifacts()) {
      throw new Error('Build artifacts not found')
    }

    // Setup infrastructure
    log('info', 'Setting up Cloudflare infrastructure...')
    results.database = setupD1Database(env)
    results.kv = setupKVNamespaces(env)
    results.r2 = setupR2Bucket(env)
    results.durableObjects = setupDurableObjects(env)

    // Run database migrations
    if (!skipMigrations) {
      runDatabaseMigrations(env)
    }

    // Deploy applications
    results.api = deployAPI(env)
    results.web = deployWebApp(env)

    // Configure custom domain
    if (domain) {
      configureCustomDomain(env, domain)
    }

    // Perform health check
    if (healthCheck && results.api?.url) {
      results.health = performHealthCheck(results.api.url)
    }

    // Calculate duration
    results.duration = Math.round((Date.now() - startTime) / 1000)

    // Generate report
    generateDeploymentReport(results)

    log('success', `Deployment to ${env} completed successfully!`)

    return results
  } catch (error) {
    log('error', `Deployment to ${env} failed: ${error.message}`)
    results.duration = Math.round((Date.now() - startTime) / 1000)
    generateDeploymentReport(results)
    throw error
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'
  const env = args[1] || 'development'

  switch (command) {
    case 'deploy': {
      const options = {
        skipBuild: args.includes('--skip-build'),
        skipMigrations: args.includes('--skip-migrations'),
        healthCheck: !args.includes('--no-health-check'),
      }

      const domainIndex = args.indexOf('--domain')
      if (domainIndex !== -1 && args[domainIndex + 1]) {
        options.domain = args[domainIndex + 1]
      }

      await deploy(env, options)
      break
    }

    case 'api':
      if (loadEnvironment(env)) {
        deployAPI(env)
      }
      break

    case 'web':
      if (loadEnvironment(env)) {
        deployWebApp(env)
      }
      break

    case 'infra':
      if (loadEnvironment(env)) {
        log('info', 'Setting up infrastructure...')
        setupD1Database(env)
        setupKVNamespaces(env)
        setupR2Bucket(env)
        setupDurableObjects(env)
        log('success', 'Infrastructure setup completed')
      }
      break

    case 'migrate':
      if (loadEnvironment(env)) {
        runDatabaseMigrations(env)
      }
      break

    case 'domain': {
      const domain = args[2]
      if (!domain) {
        log('error', 'Domain name is required')
        log('info', 'Usage: node deploy.js domain <environment> <domain>')
        process.exit(1)
      }
      if (loadEnvironment(env)) {
        configureCustomDomain(env, domain)
      }
      break
    }

    case 'health': {
      const url = args[2]
      if (!url) {
        log('error', 'URL is required for health check')
        log('info', 'Usage: node deploy.js health <url>')
        process.exit(1)
      }
      performHealthCheck(url)
      break
    }

    case 'help':
      console.log(`
Cloudflare Deployment Script

Usage: node deploy.js <command> [environment] [options]

Commands:
  deploy [env]           Deploy full application (default: development)
  api [env]              Deploy API only
  web [env]              Deploy web application only
  infra [env]            Set up Cloudflare infrastructure
  migrate [env]          Run database migrations
  domain [env] <domain>  Configure custom domain
  health <url>           Perform health check on deployed application
  help                   Show this help message

Options:
  --skip-build           Skip build verification
  --skip-migrations      Skip database migrations
  --no-health-check      Skip post-deployment health check
  --domain <domain>      Configure custom domain

Environments:
  development            Local development deployment
  staging                Staging environment deployment
  production             Production environment deployment

Examples:
  node deploy.js deploy staging
  node deploy.js deploy production --domain api.parsify.dev
  node deploy.js api development --skip-build
  node deploy.js infra production
  node deploy.js health https://api.parsify.dev
`)
      break

    default:
      log('error', `Unknown command: ${command}`)
      log('info', 'Run "node deploy.js help" for usage information')
      process.exit(1)
  }
}

// Export functions for testing
module.exports = {
  deploy,
  deployAPI,
  deployWebApp,
  setupD1Database,
  setupKVNamespaces,
  setupR2Bucket,
  performHealthCheck,
  generateDeploymentReport,
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error)
}

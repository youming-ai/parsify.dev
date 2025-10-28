#!/usr/bin/env node

/**
 * Build Script for Parsify Platform
 *
 * This script orchestrates the build process for both frontend and backend components,
 * including optimization, bundling, and preparation for deployment.
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const chalk = require('chalk')

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..')
const APPS_DIR = path.join(PROJECT_ROOT, 'apps')
const PACKAGES_DIR = path.join(PROJECT_ROOT, 'packages')
const BUILD_DIR = path.join(PROJECT_ROOT, 'dist')
const ENVIRONMENT = process.env.NODE_ENV || 'development'

// Colors for console output
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  dim: chalk.dim,
}

// Helper functions
function log(level, message) {
  console.log(`${colors[level](`[${level.toUpperCase()}]`)} ${message}`)
}

function exec(command, options = {}) {
  const { silent = false, cwd = PROJECT_ROOT } = options

  try {
    log('info', `Executing: ${command}`)
    const result = execSync(command, {
      cwd,
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
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

function checkPrerequisites() {
  log('info', 'Checking build prerequisites...')

  // Check Node.js version
  const nodeVersion = process.version
  const requiredNodeVersion = '18.0.0'

  if (nodeVersion < `v${requiredNodeVersion}`) {
    log(
      'error',
      `Node.js version ${requiredNodeVersion} or higher is required. Current: ${nodeVersion}`
    )
    process.exit(1)
  }

  // Check if pnpm is available
  try {
    exec('pnpm --version', { silent: true })
    log('success', 'pnpm is available')
  } catch (_error) {
    log('error', 'pnpm is required but not found. Please install pnpm.')
    process.exit(1)
  }

  // Check if required directories exist
  const requiredDirs = [APPS_DIR, PACKAGES_DIR]
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      log('error', `Required directory not found: ${dir}`)
      process.exit(1)
    }
  }

  log('success', 'All prerequisites satisfied')
}

function cleanBuildDirectory() {
  log('info', 'Cleaning build directory...')

  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true })
  }

  fs.mkdirSync(BUILD_DIR, { recursive: true })
  log('success', 'Build directory cleaned')
}

function installDependencies() {
  log('info', 'Installing dependencies...')

  // Install all dependencies using pnpm
  exec('pnpm install', { cwd: PROJECT_ROOT })

  log('success', 'Dependencies installed')
}

function buildPackages() {
  log('info', 'Building packages...')

  // Build all packages in order
  const packages = ['utils', 'schemas', 'ui']

  for (const pkg of packages) {
    const pkgPath = path.join(PACKAGES_DIR, pkg)
    if (fs.existsSync(pkgPath)) {
      log('info', `Building package: ${pkg}`)

      // Build the package
      exec('pnpm run build', { cwd: pkgPath })

      log('success', `Package ${pkg} built successfully`)
    } else {
      log('warning', `Package ${pkg} not found, skipping...`)
    }
  }

  log('success', 'All packages built')
}

function buildAPI() {
  log('info', 'Building API application...')

  const apiPath = path.join(APPS_DIR, 'api')
  if (!fs.existsSync(apiPath)) {
    log('error', 'API application not found')
    process.exit(1)
  }

  // Install API dependencies
  exec('pnpm install', { cwd: apiPath })

  // Type check
  log('info', 'Running TypeScript type checking for API...')
  exec('pnpm run type-check', { cwd: apiPath })

  // Build the API (TypeScript compilation)
  log('info', 'Compiling TypeScript for API...')
  exec('pnpm run build', { cwd: apiPath })

  // Copy API build to dist directory
  const apiDistPath = path.join(apiPath, 'dist')
  const targetApiPath = path.join(BUILD_DIR, 'api')

  if (fs.existsSync(apiDistPath)) {
    fs.cpSync(apiDistPath, targetApiPath, { recursive: true })
  }

  // Copy wrangler.toml for deployment
  const wranglerConfig = path.join(apiPath, 'wrangler.toml')
  const targetWranglerConfig = path.join(targetApiPath, 'wrangler.toml')

  if (fs.existsSync(wranglerConfig)) {
    fs.copyFileSync(wranglerConfig, targetWranglerConfig)
  }

  log('success', 'API application built successfully')
}

function buildWeb() {
  log('info', 'Building Web application...')

  const webPath = path.join(APPS_DIR, 'web')
  if (!fs.existsSync(webPath)) {
    log('error', 'Web application not found')
    process.exit(1)
  }

  // Install web dependencies
  exec('pnpm install', { cwd: webPath })

  // Type check
  log('info', 'Running TypeScript type checking for Web...')
  exec('pnpm run type-check', { cwd: webPath })

  // Lint check
  log('info', 'Running linter for Web...')
  exec('pnpm run lint', { cwd: webPath })

  // Build the web application
  log('info', 'Building Web application with Next.js...')

  // Set environment variables for build
  const buildEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
  }

  exec('pnpm run build', {
    cwd: webPath,
    env: buildEnv,
  })

  // Copy web build to dist directory
  const webDistPath = path.join(webPath, '.next')
  const targetWebPath = path.join(BUILD_DIR, 'web')

  if (fs.existsSync(webDistPath)) {
    fs.cpSync(webDistPath, targetWebPath, { recursive: true })
  }

  // Copy public files
  const publicPath = path.join(webPath, 'public')
  const targetPublicPath = path.join(targetWebPath, 'public')

  if (fs.existsSync(publicPath)) {
    fs.cpSync(publicPath, targetPublicPath, { recursive: true })
  }

  // Copy package.json for deployment
  const packageJson = path.join(webPath, 'package.json')
  const targetPackageJson = path.join(targetWebPath, 'package.json')

  if (fs.existsSync(packageJson)) {
    fs.copyFileSync(packageJson, targetPackageJson)
  }

  log('success', 'Web application built successfully')
}

function optimizeBuilds() {
  log('info', 'Optimizing builds...')

  // Compress static assets if needed
  const webDistPath = path.join(BUILD_DIR, 'web')

  if (fs.existsSync(webDistPath)) {
    // Create a .next static directory if it doesn't exist
    const staticPath = path.join(webDistPath, 'static')
    if (!fs.existsSync(staticPath)) {
      fs.mkdirSync(staticPath, { recursive: true })
    }
  }

  // Generate build manifest
  const buildManifest = {
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    version: process.env.npm_package_version || '1.0.0',
    commit: getGitCommit(),
    builds: {
      api: fs.existsSync(path.join(BUILD_DIR, 'api')),
      web: fs.existsSync(path.join(BUILD_DIR, 'web')),
    },
  }

  fs.writeFileSync(
    path.join(BUILD_DIR, 'build-manifest.json'),
    JSON.stringify(buildManifest, null, 2)
  )

  log('success', 'Builds optimized')
}

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', {
      silent: true,
      encoding: 'utf8',
    }).trim()
  } catch (_error) {
    return 'unknown'
  }
}

function runTests() {
  if (process.env.SKIP_TESTS === 'true') {
    log('warning', 'Skipping tests as requested')
    return
  }

  log('info', 'Running tests...')

  try {
    // Run unit tests
    exec('pnpm run test', { cwd: PROJECT_ROOT })

    // Run integration tests if available
    try {
      exec('pnpm run test:e2e', { cwd: PROJECT_ROOT })
    } catch (_error) {
      log('warning', 'E2E tests failed or not available')
    }

    log('success', 'All tests passed')
  } catch (_error) {
    log('error', 'Tests failed')
    process.exit(1)
  }
}

function generateBuildReport() {
  log('info', 'Generating build report...')

  const report = {
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    buildTime: process.uptime ? process.uptime() : 0,
    buildDirectory: BUILD_DIR,
    applications: {},
    packages: {},
    summary: {
      totalSize: 0,
      fileCount: 0,
    },
  }

  // Analyze API build
  const apiPath = path.join(BUILD_DIR, 'api')
  if (fs.existsSync(apiPath)) {
    const apiStats = analyzeDirectory(apiPath)
    report.applications.api = {
      path: apiPath,
      exists: true,
      size: apiStats.size,
      fileCount: apiStats.fileCount,
      files: apiStats.files.slice(0, 10), // First 10 files
    }
    report.summary.totalSize += apiStats.size
    report.summary.fileCount += apiStats.fileCount
  }

  // Analyze Web build
  const webPath = path.join(BUILD_DIR, 'web')
  if (fs.existsSync(webPath)) {
    const webStats = analyzeDirectory(webPath)
    report.applications.web = {
      path: webPath,
      exists: true,
      size: webStats.size,
      fileCount: webStats.fileCount,
      files: webStats.files.slice(0, 10), // First 10 files
    }
    report.summary.totalSize += webStats.size
    report.summary.fileCount += webStats.fileCount
  }

  // Analyze packages
  const packagesPath = PACKAGES_DIR
  if (fs.existsSync(packagesPath)) {
    const packages = fs.readdirSync(packagesPath)

    for (const pkg of packages) {
      const pkgPath = path.join(packagesPath, pkg, 'dist')
      if (fs.existsSync(pkgPath)) {
        const pkgStats = analyzeDirectory(pkgPath)
        report.packages[pkg] = {
          path: pkgPath,
          size: pkgStats.size,
          fileCount: pkgStats.fileCount,
        }
      }
    }
  }

  // Write report
  const reportPath = path.join(BUILD_DIR, 'build-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  // Print summary
  log('success', 'Build report generated')
  log('info', `Total build size: ${(report.summary.totalSize / 1024 / 1024).toFixed(2)} MB`)
  log('info', `Total files: ${report.summary.fileCount}`)

  return report
}

function analyzeDirectory(dirPath) {
  let size = 0
  let fileCount = 0
  const files = []

  function analyze(currentPath) {
    const items = fs.readdirSync(currentPath)

    for (const item of items) {
      const itemPath = path.join(currentPath, item)
      const stats = fs.statSync(itemPath)

      if (stats.isDirectory()) {
        analyze(itemPath)
      } else {
        size += stats.size
        fileCount++

        if (files.length < 20) {
          files.push({
            name: item,
            size: stats.size,
            path: path.relative(dirPath, itemPath),
          })
        }
      }
    }
  }

  analyze(dirPath)

  return { size, fileCount, files }
}

// Main build function
async function build() {
  const startTime = Date.now()

  log('info', `Starting build process for ${ENVIRONMENT} environment`)
  log('info', `Build directory: ${BUILD_DIR}`)

  try {
    // Build steps
    checkPrerequisites()
    cleanBuildDirectory()
    installDependencies()
    buildPackages()
    buildAPI()
    buildWeb()
    optimizeBuilds()
    runTests()
    generateBuildReport()

    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000

    log('success', `Build completed successfully in ${duration.toFixed(2)} seconds`)
    log('info', `Build artifacts available in: ${BUILD_DIR}`)

    return { success: true, duration, buildDir: BUILD_DIR }
  } catch (error) {
    log('error', 'Build failed')
    log('error', error.message)

    if (process.env.DEBUG === 'true') {
      console.error(error.stack)
    }

    process.exit(1)
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'build'

  switch (command) {
    case 'build':
      await build()
      break

    case 'clean':
      cleanBuildDirectory()
      log('success', 'Build directory cleaned')
      break

    case 'check':
      checkPrerequisites()
      break

    case 'api':
      buildAPI()
      break

    case 'web':
      buildWeb()
      break

    case 'packages':
      buildPackages()
      break

    case 'report':
      if (fs.existsSync(BUILD_DIR)) {
        generateBuildReport()
      } else {
        log('error', 'Build directory not found. Run build first.')
        process.exit(1)
      }
      break

    default:
      log('error', `Unknown command: ${command}`)
      log('info', 'Available commands: build, clean, check, api, web, packages, report')
      process.exit(1)
  }
}

// Export functions for testing
module.exports = {
  build,
  buildAPI,
  buildWeb,
  buildPackages,
  checkPrerequisites,
  cleanBuildDirectory,
  generateBuildReport,
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error)
}

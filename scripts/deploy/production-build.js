#!/usr/bin/env node

/**
 * Production Build Optimization Script
 * Prepares and optimizes the Parsify.dev platform for production deployment
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '../..');

// Build configuration
const BUILD_CONFIG = {
  environment: process.env.NODE_ENV || 'production',
  analyze: process.env.ANALYZE === 'true',
  optimize: process.env.OPTIMIZE !== 'false',
  strict: process.env.STRICT === 'true',
  outputDir: '.next',
  staticDir: 'static',
  reportsDir: 'reports',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`📦 ${step}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function execCommand(command, description, options = {}) {
  log(`\n🔧 ${description}...`, 'blue');

  try {
    const result = execSync(command, {
      cwd: projectRoot,
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options,
    });

    if (options.silent) {
      return result;
    }

    logSuccess(`${description} completed`);
    return result;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    throw error;
  }
}

function validateEnvironment() {
  logStep('Validating Environment');

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion < 20) {
    logError(`Node.js version ${nodeVersion} is not supported. Requires Node.js >= 20`);
    process.exit(1);
  }

  logSuccess(`Node.js version: ${nodeVersion}`);

  // Check pnpm version
  try {
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    logSuccess(`pnpm version: ${pnpmVersion}`);
  } catch (error) {
    logError('pnpm is not installed');
    process.exit(1);
  }

  // Validate environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_ENVIRONMENT',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    logWarning(`Missing environment variables: ${missingVars.join(', ')}`);
    log('Make sure to set up your .env.production file', 'yellow');
  }

  // Check critical files
  const criticalFiles = [
    'package.json',
    'next.config.js',
    'tailwind.config.ts',
    'tsconfig.json',
  ];

  for (const file of criticalFiles) {
    if (!existsSync(join(projectRoot, file))) {
      logError(`Critical file missing: ${file}`);
      process.exit(1);
    }
  }

  logSuccess('Environment validation completed');
}

function cleanBuild() {
  logStep('Cleaning Previous Build');

  const dirsToClean = [
    BUILD_CONFIG.outputDir,
    'dist',
    'out',
    '.vercel',
    BUILD_CONFIG.reportsDir,
  ];

  for (const dir of dirsToClean) {
    const dirPath = join(projectRoot, dir);
    if (existsSync(dirPath)) {
      execCommand(`rm -rf ${dir}`, `Removing ${dir}`);
    }
  }

  // Create reports directory
  mkdirSync(join(projectRoot, BUILD_CONFIG.reportsDir), { recursive: true });

  logSuccess('Build cleanup completed');
}

function installDependencies() {
  logStep('Installing Dependencies');

  // Use pnpm for faster and more efficient dependency installation
  execCommand('pnpm install --frozen-lockfile', 'Installing dependencies');

  logSuccess('Dependencies installed');
}

function runTypeCheck() {
  logStep('Type Checking');

  try {
    execCommand('pnpm type-check', 'Running TypeScript type checking');
    logSuccess('Type checking passed');
  } catch (error) {
    logError('Type checking failed');
    throw error;
  }
}

function runLinting() {
  logStep('Code Quality Checks');

  try {
    execCommand('pnpm lint', 'Running linting checks');
    logSuccess('Linting passed');
  } catch (error) {
    logError('Linting failed');
    throw error;
  }
}

function runUnitTests() {
  logStep('Running Unit Tests');

  try {
    execCommand('pnpm test:run', 'Running unit tests', { silent: true });
    logSuccess('Unit tests passed');
  } catch (error) {
    logWarning('Some unit tests failed - continuing build');
  }
}

function generateBundleAnalysis() {
  logStep('Bundle Analysis');

  if (BUILD_CONFIG.analyze) {
    process.env.ANALYZE = 'true';
    log('Bundle analysis will be generated after build', 'blue');
  }

  // Run existing bundle analysis tools
  try {
    execCommand('pnpm bundle:analyze', 'Analyzing bundle composition');
    logSuccess('Bundle analysis completed');
  } catch (error) {
    logWarning('Bundle analysis failed - continuing build');
  }
}

function buildApplication() {
  logStep('Building Application');

  // Set environment variables for production build
  const buildEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    ANALYZE: BUILD_CONFIG.analyze ? 'true' : 'false',
  };

  // Build command with optimization flags
  const buildCommand = 'pnpm build';

  try {
    execSync(buildCommand, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: buildEnv,
    });

    logSuccess('Application built successfully');
  } catch (error) {
    logError('Build failed');
    throw error;
  }
}

function optimizeBuild() {
  if (!BUILD_CONFIG.optimize) {
    log('Build optimization skipped', 'yellow');
    return;
  }

  logStep('Optimizing Build');

  try {
    // Run bundle optimization
    execCommand('pnpm bundle:optimize', 'Optimizing bundle size');

    // Enforce budget if in strict mode
    if (BUILD_CONFIG.strict) {
      execCommand('pnpm budget:enforce', 'Enforcing bundle budget');
    }

    logSuccess('Build optimization completed');
  } catch (error) {
    if (BUILD_CONFIG.strict) {
      logError('Build optimization failed in strict mode');
      throw error;
    } else {
      logWarning('Build optimization failed - continuing');
    }
  }
}

function generateBuildReport() {
  logStep('Generating Build Report');

  const reportPath = join(projectRoot, BUILD_CONFIG.reportsDir, 'build-report.json');

  try {
    // Get build statistics
    const outputDir = join(projectRoot, BUILD_CONFIG.outputDir);
    const staticDir = join(outputDir, 'static');

    const report = {
      buildTime: new Date().toISOString(),
      environment: BUILD_CONFIG.environment,
      nodeVersion: process.version,
      buildConfig: BUILD_CONFIG,
      bundles: {},
      optimization: {
        analyzed: BUILD_CONFIG.analyze,
        optimized: BUILD_CONFIG.optimize,
        strictMode: BUILD_CONFIG.strict,
      },
    };

    // Calculate bundle sizes (simplified version)
    try {
      const { statSync, readdirSync } = await import('fs');

      if (existsSync(staticDir)) {
        const cssFiles = readdirSync(staticDir).filter(f => f.endsWith('.css'));
        const jsFiles = readdirSync(staticDir).filter(f => f.endsWith('.js'));

        report.bundles.css = cssFiles.map(file => ({
          file,
          size: statSync(join(staticDir, file)).size,
        }));

        report.bundles.js = jsFiles.map(file => ({
          file,
          size: statSync(join(staticDir, file)).size,
        }));
      }
    } catch (error) {
      logWarning('Could not calculate bundle sizes');
    }

    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logSuccess(`Build report generated: ${reportPath}`);

  } catch (error) {
    logWarning('Build report generation failed');
  }
}

function validateBuild() {
  logStep('Validating Build Output');

  const outputDir = join(projectRoot, BUILD_CONFIG.outputDir);

  if (!existsSync(outputDir)) {
    logError('Build output directory not found');
    process.exit(1);
  }

  // Check for essential build files
  const requiredFiles = [
    join(outputDir, 'server', 'app-pages'),
    join(outputDir, 'static'),
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      logError(`Required build output missing: ${file}`);
      process.exit(1);
    }
  }

  logSuccess('Build validation completed');
}

function main() {
  log('🚀 Parsify.dev Production Build Optimizer', 'bright');
  log('=========================================', 'cyan');

  const startTime = Date.now();

  try {
    // Build pipeline
    validateEnvironment();
    cleanBuild();
    installDependencies();
    runTypeCheck();
    runLinting();
    runUnitTests();
    generateBundleAnalysis();
    buildApplication();
    optimizeBuild();
    generateBuildReport();
    validateBuild();

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    logStep('Build Summary');
    logSuccess(`Production build completed in ${duration}s`);
    logSuccess(`Environment: ${BUILD_CONFIG.environment}`);
    logSuccess(`Optimization: ${BUILD_CONFIG.optimize ? 'enabled' : 'disabled'}`);
    logSuccess(`Strict mode: ${BUILD_CONFIG.strict ? 'enabled' : 'disabled'}`);

    log('\n📋 Next Steps:', 'blue');
    log('1. Review the build report in the reports/ directory', 'blue');
    log('2. Run deployment tests: pnpm test:deployment', 'blue');
    log('3. Deploy to staging: pnpm deploy:staging', 'blue');
    log('4. Deploy to production: pnpm deploy:production', 'blue');

  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at ${promise}: ${reason}`);
  process.exit(1);
});

// Run the build process
main();

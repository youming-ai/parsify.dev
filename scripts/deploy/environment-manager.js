#!/usr/bin/env node

/**
 * Environment Management and Configuration System
 * Manages environment configurations for different deployment targets
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '../..');

// Environment configurations
const ENVIRONMENTS = {
  development: {
    name: 'development',
    description: 'Local development environment',
    domain: 'localhost:3000',
    apiDomain: 'localhost:8787',
    port: 3000,
    buildCommand: 'pnpm dev',
    startCommand: 'pnpm dev',
    envFile: '.env.development',
    requiredVars: [
      'NEXT_PUBLIC_ENVIRONMENT',
      'NEXT_PUBLIC_API_BASE_URL',
    ],
    features: {
      hotReload: true,
      debugMode: true,
      errorReporting: false,
      analytics: false,
    },
  },
  staging: {
    name: 'staging',
    description: 'Staging environment for testing',
    domain: 'parsify-staging.vercel.app',
    apiDomain: 'api-staging.parsify.dev',
    port: null,
    buildCommand: 'pnpm build',
    startCommand: 'vercel',
    envFile: '.env.staging',
    requiredVars: [
      'NEXT_PUBLIC_ENVIRONMENT',
      'NEXT_PUBLIC_API_BASE_URL',
      'NEXT_PUBLIC_STAGING_MODE',
    ],
    features: {
      hotReload: false,
      debugMode: true,
      errorReporting: true,
      analytics: true,
      stagingMode: true,
    },
  },
  production: {
    name: 'production',
    description: 'Production environment',
    domain: 'parsify.dev',
    apiDomain: 'api.parsify.dev',
    port: null,
    buildCommand: 'pnpm build',
    startCommand: 'vercel --prod',
    envFile: '.env.production',
    requiredVars: [
      'NEXT_PUBLIC_ENVIRONMENT',
      'NEXT_PUBLIC_API_BASE_URL',
    ],
    features: {
      hotReload: false,
      debugMode: false,
      errorReporting: true,
      analytics: true,
      performanceOptimization: true,
    },
  },
};

// Default environment variables
const DEFAULT_ENV_VARS = {
  // Core configuration
  'NODE_ENV': 'development',
  'NEXT_PUBLIC_ENVIRONMENT': 'development',

  // API configuration
  'NEXT_PUBLIC_API_BASE_URL': 'http://localhost:8787',
  'NEXT_PUBLIC_API_BASE_URL_DEV': 'http://localhost:8787',
  'NEXT_PUBLIC_API_BASE_URL_STAGING': 'https://api-staging.parsify.dev',
  'NEXT_PUBLIC_API_BASE_URL_PROD': 'https://api.parsify.dev',

  // Feature flags
  'NEXT_PUBLIC_ENABLE_ANALYTICS': 'false',
  'NEXT_PUBLIC_ENABLE_ERROR_REPORTING': 'false',
  'NEXT_PUBLIC_ENABLE_DEBUG_MODE': 'false',

  // Analytics
  'NEXT_PUBLIC_MICROSOFT_CLARITY_ID': 'tx90x0sxzq',

  // Build configuration
  'ANALYZE': 'false',
  'OPTIMIZE': 'true',
  'STRICT': 'false',
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
  log(`⚙️  ${step}`, 'bright');
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function getEnvironmentConfig(envName) {
  if (!ENVIRONMENTS[envName]) {
    logError(`Unknown environment: ${envName}`);
    log(`Available environments: ${Object.keys(ENVIRONMENTS).join(', ')}`, 'blue');
    process.exit(1);
  }

  return ENVIRONMENTS[envName];
}

function createEnvironmentFile(envName) {
  const envConfig = getEnvironmentConfig(envName);

  logStep(`Creating ${envName} Environment File`);

  // Create environment-specific variables
  const envVars = {
    ...DEFAULT_ENV_VARS,
    'NODE_ENV': envName,
    'NEXT_PUBLIC_ENVIRONMENT': envName,
    'NEXT_PUBLIC_API_BASE_URL': envConfig.apiDomain,
  };

  // Add environment-specific variables
  if (envName === 'staging') {
    envVars['NEXT_PUBLIC_STAGING_MODE'] = 'true';
    envVars['NEXT_PUBLIC_ENABLE_ANALYTICS'] = 'true';
    envVars['NEXT_PUBLIC_ENABLE_ERROR_REPORTING'] = 'true';
    envVars['NEXT_PUBLIC_ENABLE_DEBUG_MODE'] = 'true';
  } else if (envName === 'production') {
    envVars['NEXT_PUBLIC_ENABLE_ANALYTICS'] = 'true';
    envVars['NEXT_PUBLIC_ENABLE_ERROR_REPORTING'] = 'true';
    envVars['NEXT_PUBLIC_ENABLE_DEBUG_MODE'] = 'false';
  } else if (envName === 'development') {
    envVars['NEXT_PUBLIC_ENABLE_DEBUG_MODE'] = 'true';
    envVars['NEXT_PUBLIC_ENABLE_ANALYTICS'] = 'false';
    envVars['NEXT_PUBLIC_ENABLE_ERROR_REPORTING'] = 'false';
  }

  // Generate environment file content
  let content = `# ${envConfig.description}\n`;
  content += `# Generated automatically by environment-manager.js\n`;
  content += `# Created: ${new Date().toISOString()}\n\n`;

  // Core configuration
  content += '# Core Configuration\n';
  content += `NODE_ENV=${envName}\n`;
  content += `NEXT_PUBLIC_ENVIRONMENT=${envName}\n\n`;

  // API configuration
  content += '# API Configuration\n';
  content += `NEXT_PUBLIC_API_BASE_URL=${envVars['NEXT_PUBLIC_API_BASE_URL']}\n`;
  content += `NEXT_PUBLIC_API_BASE_URL_DEV=${envVars['NEXT_PUBLIC_API_BASE_URL_DEV']}\n`;
  content += `NEXT_PUBLIC_API_BASE_URL_STAGING=${envVars['NEXT_PUBLIC_API_BASE_URL_STAGING']}\n`;
  content += `NEXT_PUBLIC_API_BASE_URL_PROD=${envVars['NEXT_PUBLIC_API_BASE_URL_PROD']}\n\n`;

  // Feature flags
  content += '# Feature Flags\n';
  content += `NEXT_PUBLIC_ENABLE_ANALYTICS=${envVars['NEXT_PUBLIC_ENABLE_ANALYTICS']}\n`;
  content += `NEXT_PUBLIC_ENABLE_ERROR_REPORTING=${envVars['NEXT_PUBLIC_ENABLE_ERROR_REPORTING']}\n`;
  content += `NEXT_PUBLIC_ENABLE_DEBUG_MODE=${envVars['NEXT_PUBLIC_ENABLE_DEBUG_MODE']}\n\n`;

  // Environment-specific features
  if (envName === 'staging') {
    content += '# Staging-specific Settings\n';
    content += `NEXT_PUBLIC_STAGING_MODE=${envVars['NEXT_PUBLIC_STAGING_MODE']}\n`;
    content += `NEXT_PUBLIC_DEBUG_NAVIGATION=true\n`;
    content += `NEXT_PUBLIC_SHOW_PERFORMANCE_MONITOR=true\n`;
    content += `NEXT_PUBLIC_CACHE_BUST=true\n\n`;
  }

  if (envName === 'production') {
    content += '# Production-specific Settings\n';
    content += `NEXT_PUBLIC_PERFORMANCE_MONITORING=true\n`;
    content += `NEXT_PUBLIC_OPTIMIZE_IMAGES=true\n`;
    content += `NEXT_PUBLIC_ENABLE_CSP=true\n\n`;
  }

  if (envName === 'development') {
    content += '# Development-specific Settings\n';
    content += `NEXT_PUBLIC_DEV_MODE=true\n`;
    content += `NEXT_PUBLIC_DEBUG_BUNDLE=true\n`;
    content += `NEXT_PUBLIC_FAST_REFRESH=true\n\n`;
  }

  // Analytics configuration
  content += '# Analytics Configuration\n';
  content += `NEXT_PUBLIC_MICROSOFT_CLARITY_ID=${envVars['NEXT_PUBLIC_MICROSOFT_CLARITY_ID']}\n`;
  if (envName !== 'development') {
    content += `NEXT_PUBLIC_VERCEL_ANALYTICS=true\n`;
  }

  // Write environment file
  const envFilePath = join(projectRoot, envConfig.envFile);
  writeFileSync(envFilePath, content);

  logSuccess(`Environment file created: ${envConfig.envFile}`);

  return envFilePath;
}

function validateEnvironment(envName) {
  logStep(`Validating ${envName} Environment`);

  const envConfig = getEnvironmentConfig(envName);
  const envFilePath = join(projectRoot, envConfig.envFile);

  // Check if environment file exists
  if (!existsSync(envFilePath)) {
    logError(`Environment file not found: ${envConfig.envFile}`);
    logInfo(`Create it with: node scripts/deploy/environment-manager.js create ${envName}`);
    process.exit(1);
  }

  // Load environment variables
  const envVars = loadEnvironmentVariables(envConfig.envFile);

  // Validate required variables
  const missingVars = envConfig.requiredVars.filter(varName => !envVars[varName]);

  if (missingVars.length > 0) {
    logError(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }

  // Validate variable values
  if (envVars['NEXT_PUBLIC_API_BASE_URL']) {
    try {
      new URL(envVars['NEXT_PUBLIC_API_BASE_URL']);
      logSuccess('API base URL is valid');
    } catch (error) {
      logError('Invalid API base URL format');
      process.exit(1);
    }
  }

  logSuccess(`Environment ${envName} is valid`);

  return envVars;
}

function loadEnvironmentVariables(envFile) {
  const envVars = {};

  try {
    const envContent = readFileSync(join(projectRoot, envFile), 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Parse variable assignment
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();

        // Remove quotes if present
        const unquotedValue = value.replace(/^["']|["']$/g, '');
        envVars[key] = unquotedValue;
      }
    }
  } catch (error) {
    logError(`Failed to load environment variables from ${envFile}: ${error.message}`);
  }

  return envVars;
}

function switchEnvironment(envName) {
  logStep(`Switching to ${envName} Environment`);

  const envConfig = getEnvironmentConfig(envName);

  // Create environment file if it doesn't exist
  const envFilePath = join(projectRoot, envConfig.envFile);
  if (!existsSync(envFilePath)) {
    logInfo(`Environment file not found, creating it...`);
    createEnvironmentFile(envName);
  }

  // Validate environment
  validateEnvironment(envName);

  logSuccess(`Switched to ${envName} environment`);
  logInfo(`Configuration file: ${envConfig.envFile}`);
  logInfo(`API domain: ${envConfig.apiDomain}`);
  logInfo(`Application domain: ${envConfig.domain}`);

  // Show environment-specific commands
  log('\n📋 Environment Commands:', 'blue');
  log(`Start: ${envConfig.startCommand}`, 'blue');
  log(`Build: ${envConfig.buildCommand}`, 'blue');

  if (envName === 'development') {
    log('URL: http://localhost:3000', 'blue');
  } else {
    log(`URL: https://${envConfig.domain}`, 'blue');
  }
}

function listEnvironments() {
  logStep('Available Environments');

  for (const [envName, envConfig] of Object.entries(ENVIRONMENTS)) {
    const envFilePath = join(projectRoot, envConfig.envFile);
    const exists = existsSync(envFilePath);

    log(`\n🏷️  ${envName}`, 'bright');
    log(`   Description: ${envConfig.description}`, 'blue');
    log(`   Domain: ${envConfig.domain}`, 'blue');
    log(`   API: ${envConfig.apiDomain}`, 'blue');
    log(`   Config File: ${envConfig.envFile}`, exists ? 'green' : 'red');
    log(`   Status: ${exists ? '✅ Configured' : '❌ Not configured'}`, exists ? 'green' : 'red');

    // Show features
    const features = Object.entries(envConfig.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature);

    if (features.length > 0) {
      log(`   Features: ${features.join(', ')}`, 'cyan');
    }
  }
}

function showEnvironmentInfo(envName) {
  logStep(`${envName} Environment Information`);

  const envConfig = getEnvironmentConfig(envName);
  const envFilePath = join(projectRoot, envConfig.envFile);

  log(`\n📋 Environment Details:`, 'bright');
  log(`Name: ${envConfig.name}`, 'blue');
  log(`Description: ${envConfig.description}`, 'blue');
  log(`Domain: ${envConfig.domain}`, 'blue');
  log(`API Domain: ${envConfig.apiDomain}`, 'blue');

  if (envConfig.port) {
    log(`Port: ${envConfig.port}`, 'blue');
  }

  log(`\n⚙️  Configuration:`, 'bright');
  log(`Environment File: ${envConfig.envFile}`, existsSync(envFilePath) ? 'green' : 'red');
  log(`Build Command: ${envConfig.buildCommand}`, 'blue');
  log(`Start Command: ${envConfig.startCommand}`, 'blue');

  log(`\n🚀 Features:`, 'bright');
  for (const [feature, enabled] of Object.entries(envConfig.features)) {
    log(`${enabled ? '✅' : '❌'} ${feature}`, enabled ? 'green' : 'red');
  }

  log(`\n📝 Required Variables:`, 'bright');
  for (const varName of envConfig.requiredVars) {
    log(`• ${varName}`, 'blue');
  }

  // Show current environment variables if file exists
  if (existsSync(envFilePath)) {
    const envVars = loadEnvironmentVariables(envConfig.envFile);

    log(`\n🌍 Current Environment Variables:`, 'bright');
    for (const [key, value] of Object.entries(envVars)) {
      // Hide sensitive values
      const displayValue = key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
        ? '***'
        : value;
      log(`${key}=${displayValue}`, 'blue');
    }
  }
}

function cleanEnvironment(envName) {
  logStep(`Cleaning ${envName} Environment`);

  const envConfig = getEnvironmentConfig(envName);
  const envFilePath = join(projectRoot, envConfig.envFile);

  if (!existsSync(envFilePath)) {
    logWarning(`Environment file does not exist: ${envConfig.envFile}`);
    return;
  }

  // Backup current file
  const backupPath = `${envFilePath}.backup.${Date.now()}`;
  try {
    const content = readFileSync(envFilePath, 'utf8');
    writeFileSync(backupPath, content);
    logInfo(`Backup created: ${backupPath}`);
  } catch (error) {
    logWarning('Could not create backup');
  }

  // Remove environment file
  try {
    unlinkSync(envFilePath);
    logSuccess(`Environment file removed: ${envConfig.envFile}`);
  } catch (error) {
    logError(`Failed to remove environment file: ${error.message}`);
  }

  // Clean build artifacts
  const buildDirs = ['.next', 'dist', 'out', '.vercel'];
  for (const dir of buildDirs) {
    const dirPath = join(projectRoot, dir);
    if (existsSync(dirPath)) {
      try {
        execSync(`rm -rf ${dirPath}`, { cwd: projectRoot });
        logInfo(`Removed build directory: ${dir}`);
      } catch (error) {
        logWarning(`Could not remove ${dir}: ${error.message}`);
      }
    }
  }

  logSuccess(`${envName} environment cleaned`);
}

function generateEnvironmentReport() {
  logStep('Generating Environment Report');

  const report = {
    generatedAt: new Date().toISOString(),
    environments: {},
    summary: {
      total: Object.keys(ENVIRONMENTS).length,
      configured: 0,
      unconfigured: 0,
    },
  };

  for (const [envName, envConfig] of Object.entries(ENVIRONMENTS)) {
    const envFilePath = join(projectRoot, envConfig.envFile);
    const exists = existsSync(envFilePath);

    report.environments[envName] = {
      name: envConfig.name,
      description: envConfig.description,
      domain: envConfig.domain,
      apiDomain: envConfig.apiDomain,
      configured: exists,
      configFile: envConfig.envFile,
      features: envConfig.features,
      requiredVars: envConfig.requiredVars,
    };

    if (exists) {
      report.summary.configured++;
      report.environments[envName].variables = loadEnvironmentVariables(envConfig.envFile);
    } else {
      report.summary.unconfigured++;
    }
  }

  // Save report
  const reportsDir = join(projectRoot, 'reports');
  mkdirSync(reportsDir, { recursive: true });

  const reportPath = join(reportsDir, 'environment-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  logSuccess(`Environment report generated: ${reportPath}`);

  // Display summary
  log(`\n📊 Environment Summary:`, 'bright');
  log(`Total environments: ${report.summary.total}`, 'blue');
  log(`Configured: ${report.summary.configured}`, 'green');
  log(`Unconfigured: ${report.summary.unconfigured}`, 'yellow');

  return reportPath;
}

function showHelp() {
  logStep('Environment Manager Help');

  log('\nUsage: node scripts/deploy/environment-manager.js [command] [options]', 'blue');

  log('\n📋 Commands:', 'bright');
  log('  create <env>           Create environment configuration file', 'blue');
  log('  validate <env>         Validate environment configuration', 'blue');
  log('  switch <env>           Switch to environment', 'blue');
  log('  list                   List all available environments', 'blue');
  log('  info <env>             Show environment information', 'blue');
  log('  clean <env>            Clean environment files', 'blue');
  log('  report                 Generate environment report', 'blue');
  log('  help                   Show this help message', 'blue');

  log('\n🏷️  Available Environments:', 'bright');
  log('  development            Local development environment', 'blue');
  log('  staging                Staging environment for testing', 'blue');
  log('  production             Production environment', 'blue');

  log('\n📝 Examples:', 'bright');
  log('  node scripts/deploy/environment-manager.js create staging', 'blue');
  log('  node scripts/deploy/environment-manager.js switch development', 'blue');
  log('  node scripts/deploy/environment-manager.js validate production', 'blue');
  log('  node scripts/deploy/environment-manager.js list', 'blue');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1];

  log('⚙️  Parsify.dev Environment Manager', 'bright');
  log('===================================', 'cyan');

  try {
    switch (command) {
      case 'create':
        if (!environment) {
          logError('Environment name is required');
          showHelp();
          process.exit(1);
        }
        createEnvironmentFile(environment);
        break;

      case 'validate':
        if (!environment) {
          logError('Environment name is required');
          showHelp();
          process.exit(1);
        }
        validateEnvironment(environment);
        break;

      case 'switch':
        if (!environment) {
          logError('Environment name is required');
          showHelp();
          process.exit(1);
        }
        switchEnvironment(environment);
        break;

      case 'list':
        listEnvironments();
        break;

      case 'info':
        if (!environment) {
          logError('Environment name is required');
          showHelp();
          process.exit(1);
        }
        showEnvironmentInfo(environment);
        break;

      case 'clean':
        if (!environment) {
          logError('Environment name is required');
          showHelp();
          process.exit(1);
        }
        cleanEnvironment(environment);
        break;

      case 'report':
        generateEnvironmentReport();
        break;

      case 'help':
      default:
        showHelp();
        break;
    }

  } catch (error) {
    logError(`Environment manager failed: ${error.message}`);
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

// Run the environment manager
main();

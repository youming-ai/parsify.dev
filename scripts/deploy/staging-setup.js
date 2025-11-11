#!/usr/bin/env node

/**
 * Staging Environment Setup Script
 * Sets up and configures staging environment for Parsify.dev
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '../..');

// Staging configuration
const STAGING_CONFIG = {
  environment: 'staging',
  domain: 'parsify-staging.vercel.app',
  apiDomain: 'api-staging.parsify.dev',
  buildCommand: 'pnpm build',
  outputDir: '.next',
  envFile: '.env.staging',
  vercelProjectId: process.env.VERCEL_PROJECT_ID_STAGING,
  vercelOrgId: process.env.VERCEL_ORG_ID,
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
  log(`🚀 ${step}`, 'bright');
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

function validateStagingPrerequisites() {
  logStep('Validating Staging Prerequisites');

  // Check if Vercel CLI is installed
  try {
    const vercelVersion = execSync('vercel --version', { encoding: 'utf8' }).trim();
    logSuccess(`Vercel CLI version: ${vercelVersion}`);
  } catch (error) {
    logError('Vercel CLI is not installed');
    logInfo('Install it with: npm i -g vercel');
    process.exit(1);
  }

  // Check if user is logged into Vercel
  try {
    execSync('vercel whoami', { encoding: 'utf8' });
    logSuccess('Authenticated with Vercel');
  } catch (error) {
    logError('Not authenticated with Vercel');
    logInfo('Run: vercel login');
    process.exit(1);
  }

  // Check for required environment variables
  const requiredEnvVars = [
    'VERCEL_PROJECT_ID_STAGING',
    'VERCEL_ORG_ID',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    logWarning(`Missing environment variables: ${missingVars.join(', ')}`);
    logInfo('These should be set in your CI/CD environment or .env file');
  }

  logSuccess('Staging prerequisites validated');
}

function createStagingEnvironment() {
  logStep('Creating Staging Environment Configuration');

  const stagingEnvContent = `# Staging Environment Configuration
NODE_ENV=staging
NEXT_PUBLIC_ENVIRONMENT=staging

# API Configuration
NEXT_PUBLIC_API_BASE_URL=${STAGING_CONFIG.apiDomain}
NEXT_PUBLIC_API_BASE_URL_STAGING=${STAGING_CONFIG.apiDomain}

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true

# Analytics and Monitoring
NEXT_PUBLIC_MICROSOFT_CLARITY_ID=tx90x0sxzq
NEXT_PUBLIC_VERCEL_ANALYTICS=true

# Development Tools
NEXT_PUBLIC_DEBUG_BUNDLE=true
NEXT_PUBLIC_DEBUG_PERFORMANCE=true

# Staging-specific settings
NEXT_PUBLIC_DEBUG_NAVIGATION=true
NEXT_PUBLIC_STAGING_MODE=true
NEXT_PUBLIC_SHOW_PERFORMANCE_MONITOR=true

# Cache Configuration
NEXT_PUBLIC_CACHE_BUST=true
`;

  const stagingEnvPath = join(projectRoot, STAGING_CONFIG.envFile);
  writeFileSync(stagingEnvPath, stagingEnvContent);

  logSuccess(`Staging environment file created: ${STAGING_CONFIG.envFile}`);
}

function createVercelStagingConfig() {
  logStep('Creating Vercel Staging Configuration');

  const vercelStagingConfig = {
    framework: 'nextjs',
    buildCommand: STAGING_CONFIG.buildCommand,
    installCommand: 'pnpm install',
    outputDirectory: STAGING_CONFIG.outputDir,

    // Staging-specific build environment
    build: {
      env: {
        NODE_ENV: 'staging',
        NEXT_PUBLIC_ENVIRONMENT: 'staging',
        NEXT_PUBLIC_API_BASE_URL: STAGING_CONFIG.apiDomain,
        NEXT_PUBLIC_STAGING_MODE: 'true',
      },
    },

    // Environment variables for staging
    env: {
      NODE_ENV: 'staging',
      NEXT_PUBLIC_ENVIRONMENT: 'staging',
      NEXT_PUBLIC_API_BASE_URL: STAGING_CONFIG.apiDomain,
      NEXT_PUBLIC_STAGING_MODE: 'true',
      NEXT_PUBLIC_ENABLE_ANALYTICS: 'true',
      NEXT_PUBLIC_ENABLE_ERROR_REPORTING: 'true',
    },

    // Staging-specific headers for debugging
    headers: [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Environment',
            value: 'staging',
          },
          {
            key: 'X-Debug-Mode',
            value: 'enabled',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ],

    // Staging-specific rewrites for testing
    rewrites: [
      {
        source: '/debug',
        destination: '/api/debug',
      },
      {
        source: '/health',
        destination: '/api/health',
      },
    ],

    // Alias configuration for staging
    alias: STAGING_CONFIG.domain,
  };

  const vercelConfigPath = join(projectRoot, 'vercel.staging.json');
  writeFileSync(vercelConfigPath, JSON.stringify(vercelStagingConfig, null, 2));

  logSuccess(`Vercel staging configuration created: ${vercelConfigPath}`);
}

function setupStagingProject() {
  logStep('Setting Up Staging Project');

  // Link to existing Vercel project or create new one
  try {
    // Try to link to existing project first
    const projectExists = execSync(
      `vercel projects ls | grep "${STAGING_CONFIG.vercelProjectId || 'parsify-staging'}"`,
      { encoding: 'utf8', silent: true }
    );

    if (projectExists.trim()) {
      logInfo('Linking to existing Vercel project...');
      execCommand(`vercel link --scope ${process.env.VERCEL_ORG_ID}`, 'Linking to Vercel project');
    } else {
      logInfo('Creating new Vercel project...');
      execCommand('vercel --scope $VERCEL_ORG_ID', 'Creating new Vercel project');
    }
  } catch (error) {
    logInfo('Setting up new Vercel project...');
    execCommand('vercel', 'Setting up Vercel project');
  }
}

function deployToStaging() {
  logStep('Deploying to Staging Environment');

  // Set environment for staging
  const stagingEnv = {
    ...process.env,
    NODE_ENV: 'staging',
    NEXT_PUBLIC_ENVIRONMENT: 'staging',
    VERCEL_ENV: 'staging',
  };

  // Deploy to staging
  try {
    // Use staging-specific Vercel config
    execCommand(
      `vercel --env NODE_ENV=staging --env NEXT_PUBLIC_ENVIRONMENT=staging --env NEXT_PUBLIC_STAGING_MODE=true`,
      'Deploying to Vercel staging',
      { env: stagingEnv }
    );

    logSuccess('Deployed to staging environment');
  } catch (error) {
    logError('Staging deployment failed');
    throw error;
  }
}

function configureStagingDomain() {
  logStep('Configuring Staging Domain');

  if (STAGING_CONFIG.domain && STAGING_CONFIG.domain !== 'parsify-staging.vercel.app') {
    try {
      execCommand(
        `vercel alias set ${STAGING_CONFIG.domain} --scope ${process.env.VERCEL_ORG_ID}`,
        `Setting domain alias: ${STAGING_CONFIG.domain}`
      );
      logSuccess(`Staging domain configured: ${STAGING_CONFIG.domain}`);
    } catch (error) {
      logWarning('Domain alias configuration failed - using default Vercel domain');
    }
  } else {
    logInfo('Using default Vercel staging domain');
  }
}

function createStagingHealthCheck() {
  logStep('Creating Staging Health Check');

  // Create health check API endpoint
  const healthCheckDir = join(projectRoot, 'src/app/api/health');
  mkdirSync(healthCheckDir, { recursive: true });

  const healthCheckContent = `
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
`;

  const healthCheckPath = join(healthCheckDir, 'route.ts');

  if (!existsSync(healthCheckPath)) {
    writeFileSync(healthCheckPath, healthCheckContent);
    logSuccess('Health check API endpoint created');
  } else {
    logInfo('Health check API endpoint already exists');
  }
}

function createStagingDebugEndpoint() {
  logStep('Creating Staging Debug Endpoint');

  // Create debug API endpoint for staging
  const debugDir = join(projectRoot, 'src/app/api/debug');
  mkdirSync(debugDir, { recursive: true });

  const debugContent = `
import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in staging/development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    publicEnv: {
      NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      NEXT_PUBLIC_STAGING_MODE: process.env.NEXT_PUBLIC_STAGING_MODE,
    },
    buildInfo: {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  });
}
`;

  const debugPath = join(debugDir, 'route.ts');

  if (!existsSync(debugPath)) {
    writeFileSync(debugPath, debugContent);
    logSuccess('Debug API endpoint created');
  } else {
    logInfo('Debug API endpoint already exists');
  }
}

function createStagingTestScript() {
  logStep('Creating Staging Test Script');

  const testScriptContent = `#!/usr/bin/env node

/**
 * Staging Environment Test Script
 * Tests the staging deployment
 */

import { execSync } from 'child_process';

const STAGING_URL = process.env.STAGING_URL || 'https://${STAGING_CONFIG.domain}';

console.log('🧪 Testing Staging Environment...');
console.log(\`📡 Staging URL: \${STAGING_URL}\`);

try {
  // Test health endpoint
  console.log('\\n🏥 Testing health endpoint...');
  const healthResponse = execSync(\`curl -f \${STAGING_URL}/api/health\`, { encoding: 'utf8' });
  const healthData = JSON.parse(healthResponse);
  console.log('✅ Health check passed:', healthData.status);

  // Test debug endpoint
  console.log('\\n🐛 Testing debug endpoint...');
  const debugResponse = execSync(\`curl -f \${STAGING_URL}/api/debug\`, { encoding: 'utf8' });
  const debugData = JSON.parse(debugResponse);
  console.log('✅ Debug endpoint working:', debugData.environment);

  // Test main page
  console.log('\\n🏠 Testing main page...');
  execSync(\`curl -f -I \${STAGING_URL}/\`, { encoding: 'utf8' });
  console.log('✅ Main page accessible');

  console.log('\\n🎉 All staging tests passed!');

} catch (error) {
  console.error('❌ Staging test failed:', error.message);
  process.exit(1);
}
`;

  const testScriptPath = join(projectRoot, 'scripts/test-staging.js');
  writeFileSync(testScriptPath, testScriptContent);

  // Make it executable
  try {
    execSync(`chmod +x ${testScriptPath}`);
  } catch (error) {
    logWarning('Could not make test script executable');
  }

  logSuccess('Staging test script created');
}

function generateStagingReport() {
  logStep('Generating Staging Setup Report');

  const report = {
    setupTime: new Date().toISOString(),
    environment: STAGING_CONFIG.environment,
    domain: STAGING_CONFIG.domain,
    apiDomain: STAGING_CONFIG.apiDomain,
    configuration: {
      envFile: STAGING_CONFIG.envFile,
      vercelConfig: 'vercel.staging.json',
      healthEndpoint: '/api/health',
      debugEndpoint: '/api/debug',
    },
    nextSteps: [
      'Run staging tests: node scripts/test-staging.js',
      'Test the staging deployment manually',
      'Run E2E tests against staging: pnpm test:e2e:staging',
      'Verify performance metrics',
      'Check error reporting and analytics',
    ],
  };

  const reportPath = join(projectRoot, 'reports', 'staging-setup-report.json');
  mkdirSync(join(projectRoot, 'reports'), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  logSuccess(`Staging setup report generated: ${reportPath}`);
}

function main() {
  log('🚀 Parsify.dev Staging Environment Setup', 'bright');
  log('==========================================', 'cyan');

  const startTime = Date.now();

  try {
    // Setup pipeline
    validateStagingPrerequisites();
    createStagingEnvironment();
    createVercelStagingConfig();
    setupStagingProject();
    createStagingHealthCheck();
    createStagingDebugEndpoint();
    createStagingTestScript();
    deployToStaging();
    configureStagingDomain();
    generateStagingReport();

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    logStep('Staging Setup Summary');
    logSuccess(`Staging environment setup completed in ${duration}s`);
    logSuccess(`Staging URL: https://${STAGING_CONFIG.domain}`);
    logSuccess(`API URL: https://${STAGING_CONFIG.apiDomain}`);

    log('\n📋 Next Steps:', 'blue');
    log('1. Test the staging deployment: node scripts/test-staging.js', 'blue');
    log('2. Run E2E tests against staging: pnpm test:e2e:staging', 'blue');
    log('3. Verify all functionality works correctly', 'blue');
    log('4. Check performance and error reporting', 'blue');
    log('5. Deploy to production: pnpm deploy:production', 'blue');

  } catch (error) {
    logError(`Staging setup failed: ${error.message}`);
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

// Run the staging setup
main();

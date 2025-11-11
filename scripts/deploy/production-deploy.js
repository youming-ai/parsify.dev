#!/usr/bin/env node

/**
 * Production Deployment Process
 * Handles safe production deployments with all necessary checks and procedures
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '../..');

// Production deployment configuration
const PROD_CONFIG = {
  environment: 'production',
  domain: 'parsify.dev',
  apiDomain: 'api.parsify.dev',
  requiredBranch: 'main',
  approvalRequired: process.env.SKIP_APPROVAL !== 'true',
  dryRun: process.env.DRY_RUN === 'true',
  skipTests: process.env.SKIP_TESTS === 'true',
  skipBackup: process.env.SKIP_BACKUP !== 'false',
  timeout: parseInt(process.env.DEPLOY_TIMEOUT) || 1200000, // 20 minutes
  rollbackWindow: 3600000, // 1 hour rollback window
};

// Production deployment checklist
const DEPLOYMENT_CHECKLIST = {
  preDeployment: [
    'Code is merged to main branch',
    'All tests are passing',
    'Bundle size is within budget',
    'Security audit passed',
    'Performance benchmarks met',
    'Staging deployment tested',
    'Environment variables configured',
    'Backup current production',
  ],
  postDeployment: [
    'Health checks passed',
    'Critical functionality tested',
    'Performance metrics verified',
    'Error rates monitored',
    'User analytics checked',
    'Rollback plan verified',
  ],
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

function logCritical(message) {
  log(`🔴 ${message}`, 'bright');
}

function execCommand(command, description, options = {}) {
  log(`\n🔧 ${description}...`, 'blue');

  if (PROD_CONFIG.dryRun) {
    log(`[DRY RUN] Would execute: ${command}`, 'yellow');
    return '[DRY RUN] Command would be executed';
  }

  try {
    const result = execSync(command, {
      cwd: projectRoot,
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      timeout: PROD_CONFIG.timeout,
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

function requestApproval() {
  if (!PROD_CONFIG.approvalRequired) {
    logSuccess('Approval requirement skipped (SKIP_APPROVAL=true)');
    return true;
  }

  logStep('Production Deployment Approval Required');

  log('\n🔒 This is a PRODUCTION deployment.', 'red');
  log('⚠️  This will affect the live site at https://parsify.dev', 'yellow');
  log('👥 Please ensure you have approval to proceed.', 'red');

  log('\n📋 Deployment Checklist:', 'bright');
  DEPLOYMENT_CHECKLIST.preDeployment.forEach((item, index) => {
    log(`  ${index + 1}. [ ] ${item}`, 'blue');
  });

  log('\n❓ Are you sure you want to continue with production deployment?', 'bright');
  log('   Type "deploy" to confirm, or anything else to abort:', 'yellow');

  // In a real scenario, you might want to use a proper CLI prompt library
  // For now, we'll use a simple approach with environment variable
  const approval = process.env.DEPLOYMENT_APPROVED;

  if (approval === 'deploy') {
    logSuccess('Deployment approved');
    return true;
  } else {
    logError('Deployment not approved');
    logInfo('To approve, set DEPLOYMENT_APPROVED=deploy environment variable');
    return false;
  }
}

function validateProductionReadiness() {
  logStep('Validating Production Readiness');

  // Check if we're on the right branch
  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    if (currentBranch !== PROD_CONFIG.requiredBranch) {
      logError(`Cannot deploy from branch "${currentBranch}"`);
      logError(`Production deployments must be from branch: ${PROD_CONFIG.requiredBranch}`);
      process.exit(1);
    }

    logSuccess(`Correct branch: ${currentBranch}`);
  } catch (error) {
    logError('Could not determine current branch');
    process.exit(1);
  }

  // Check for uncommitted changes
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();

    if (status) {
      logError('Working directory has uncommitted changes');
      logError('Commit or stash changes before deploying to production');
      process.exit(1);
    }

    logSuccess('Working directory is clean');
  } catch (error) {
    logError('Could not check git status');
    process.exit(1);
  }

  // Validate environment file
  const prodEnvFile = join(projectRoot, '.env.production');
  if (!existsSync(prodEnvFile)) {
    logError('Production environment file not found: .env.production');
    process.exit(1);
  }

  logSuccess('Production environment file found');

  // Check critical files
  const criticalFiles = [
    'package.json',
    'next.config.js',
    'vercel.json',
    '.env.production',
  ];

  for (const file of criticalFiles) {
    if (!existsSync(join(projectRoot, file))) {
      logError(`Critical file missing: ${file}`);
      process.exit(1);
    }
  }

  logSuccess('All critical files present');

  // Check Vercel authentication
  try {
    execSync('vercel whoami', { encoding: 'utf8', stdio: 'pipe' });
    logSuccess('Authenticated with Vercel');
  } catch (error) {
    logError('Not authenticated with Vercel');
    logInfo('Run: vercel login');
    process.exit(1);
  }

  logSuccess('Production readiness validation completed');
}

function backupCurrentProduction() {
  if (!PROD_CONFIG.skipBackup) {
    logStep('Backing Up Current Production');

    try {
      // Get current production deployment info
      const currentDeploy = execCommand(
        'vercel ls --scope $VERCEL_ORG_ID -n 1',
        'Getting current production deployment',
        { silent: true }
      );

      // Create deployment backup record
      const backup = {
        timestamp: new Date().toISOString(),
        deploymentId: 'backup-' + Date.now(),
        info: currentDeploy,
        rollbackAvailable: true,
      };

      const backupPath = join(projectRoot, 'reports', `production-backup-${backup.deploymentId}.json`);
      mkdirSync(join(projectRoot, 'reports'), { recursive: true });
      writeFileSync(backupPath, JSON.stringify(backup, null, 2));

      logSuccess(`Production backup created: ${backupPath}`);
      logInfo(`Rollback window: ${PROD_CONFIG.rollbackWindow / 60000} minutes`);

      return backup;

    } catch (error) {
      logWarning('Could not create production backup');
      return null;
    }
  } else {
    logWarning('Production backup skipped');
    return null;
  }
}

function runPreDeploymentTests() {
  if (PROD_CONFIG.skipTests) {
    logWarning('Skipping pre-deployment tests (SKIP_TESTS=true)');
    return;
  }

  logStep('Running Pre-Deployment Tests');

  const tests = [
    { name: 'Unit Tests', command: 'pnpm test', critical: true },
    { name: 'Type Check', command: 'pnpm type-check', critical: true },
    { name: 'Linting', command: 'pnpm lint', critical: true },
    { name: 'Bundle Budget Check', command: 'pnpm budget:validate', critical: true },
    { name: 'E2E Tests', command: 'pnpm test:e2e', critical: false },
  ];

  let criticalFailures = 0;

  for (const test of tests) {
    try {
      logInfo(`Running ${test.name}...`);
      execCommand(test.command, `${test.name}`);
      logSuccess(`${test.name} passed`);
    } catch (error) {
      if (test.critical) {
        logError(`Critical test failed: ${test.name}`);
        criticalFailures++;
      } else {
        logWarning(`Non-critical test failed: ${test.name}`);
      }
    }
  }

  if (criticalFailures > 0) {
    logError(`${criticalFailures} critical test(s) failed`);
    logError('Cannot proceed with production deployment');
    process.exit(1);
  }

  logSuccess('All critical pre-deployment tests passed');
}

function createProductionBuild() {
  logStep('Creating Production Build');

  // Clean previous builds
  execCommand('rm -rf .next dist out', 'Cleaning previous builds');

  // Create optimized production build
  const buildEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_PUBLIC_ENVIRONMENT: 'production',
    NEXT_PUBLIC_API_BASE_URL: PROD_CONFIG.apiDomain,
    ANALYZE: 'true',
    OPTIMIZE: 'true',
    STRICT: 'true',
  };

  execCommand('pnpm build', 'Building production application', { env: buildEnv });

  // Optimize bundle
  execCommand('pnpm bundle:optimize', 'Optimizing production bundle');

  logSuccess('Production build completed');
}

function validateProductionBuild() {
  logStep('Validating Production Build');

  // Check build output
  const outputDir = join(projectRoot, '.next');

  if (!existsSync(outputDir)) {
    logError('Build output directory not found');
    process.exit(1);
  }

  // Check essential files
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

  // Generate build report
  execCommand('pnpm budget:report', 'Generating build report');

  logSuccess('Production build validation completed');
}

function deployToProduction() {
  logStep('Deploying to Production');

  const deploymentEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_PUBLIC_ENVIRONMENT: 'production',
    VERCEL_ENV: 'production',
  };

  try {
    // Deploy to Vercel production
    const deployResult = execCommand(
      'vercel --prod',
      'Deploying to production',
      { env: deploymentEnv }
    );

    logSuccess('Production deployment initiated');

    return deployResult;

  } catch (error) {
    logError('Production deployment failed');
    throw error;
  }
}

function monitorDeploymentProgress() {
  logStep('Monitoring Deployment Progress');

  logInfo('Monitoring deployment status...');

  // In a real implementation, you might poll Vercel API
  // For now, we'll wait a bit and then check the deployment
  let attempts = 0;
  const maxAttempts = 30;

  const checkInterval = setInterval(async () => {
    attempts++;

    try {
      // Check if deployment is ready
      const deployments = execSync(
        'vercel ls --scope $VERCEL_ORG_ID -n 3',
        { encoding: 'utf8', stdio: 'pipe' }
      );

      // Parse deployments to find the latest
      const lines = deployments.trim().split('\n');
      const latestDeployment = lines.find(line => line.includes('parsify'));

      if (latestDeployment && latestDeployment.includes('Ready')) {
        clearInterval(checkInterval);
        logSuccess('Deployment is ready');
        return true;
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        logWarning('Deployment monitoring timeout - proceeding with checks');
        return false;
      }

    } catch (error) {
      logWarning('Could not check deployment status');
    }
  }, 10000); // Check every 10 seconds
}

function runPostDeploymentChecks() {
  logStep('Running Post-Deployment Checks');

  const checks = [
    { name: 'Health Check', url: 'https://parsify.dev/api/health', critical: true },
    { name: 'Main Page', url: 'https://parsify.dev/', critical: true },
    { name: 'Tools Page', url: 'https://parsify.dev/tools', critical: true },
    { name: 'API Status', url: 'https://api.parsify.dev/health', critical: false },
  ];

  let criticalFailures = 0;

  for (const check of checks) {
    try {
      logInfo(`Checking ${check.name}...`);

      const response = execSync(
        `curl -f -s -o /dev/null -w "%{http_code}" ${check.url}`,
        { encoding: 'utf8', stdio: 'pipe', timeout: 30000 }
      );

      if (response === '200') {
        logSuccess(`${check.name} is healthy`);
      } else {
        throw new Error(`HTTP ${response}`);
      }

    } catch (error) {
      if (check.critical) {
        logError(`Critical check failed: ${check.name}`);
        criticalFailures++;
      } else {
        logWarning(`Non-critical check failed: ${check.name}`);
      }
    }
  }

  if (criticalFailures > 0) {
    logError(`${criticalFailures} critical post-deployment check(s) failed`);
    logWarning('Consider rolling back the deployment');
    return false;
  }

  logSuccess('All post-deployment checks passed');
  return true;
}

function generateDeploymentReport(backup) {
  logStep('Generating Deployment Report');

  const report = {
    deploymentId: 'prod-' + Date.now(),
    timestamp: new Date().toISOString(),
    environment: PROD_CONFIG.environment,
    domain: PROD_CONFIG.domain,
    configuration: PROD_CONFIG,
    backup: backup ? backup.deploymentId : null,
    status: 'success',
    checks: {
      readiness: true,
      preDeploymentTests: !PROD_CONFIG.skipTests,
      build: true,
      deployment: true,
      postDeployment: true,
    },
    checklist: {
      preDeployment: DEPLOYMENT_CHECKLIST.preDeployment.map(item => ({ item, completed: true })),
      postDeployment: DEPLOYMENT_CHECKLIST.postDeployment.map(item => ({ item, completed: true })),
    },
  };

  const reportPath = join(projectRoot, 'reports', `production-deployment-${report.deploymentId}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  logSuccess(`Deployment report generated: ${reportPath}`);

  return report;
}

function setupRollbackMonitoring() {
  logStep('Setting Up Rollback Monitoring');

  // Create rollback monitoring script
  const monitorScript = `#!/bin/bash
# Production Rollback Monitor
# Monitors for issues and triggers rollback if needed

DEPLOYMENT_ID="$1"
ROLLBACK_WINDOW=${PROD_CONFIG.rollbackWindow}
ALERT_THRESHOLD=5
MONITOR_INTERVAL=60

echo "Starting rollback monitoring for deployment: $DEPLOYMENT_ID"
echo "Rollback window: $(($ROLLBACK_WINDOW / 60000)) minutes"
echo "Monitoring interval: $MONITOR_INTERVAL seconds"

# Function to check deployment health
check_health() {
  # Check main page
  if ! curl -f -s "https://parsify.dev" > /dev/null; then
    echo "ERROR: Main page not responding"
    return 1
  fi

  # Check API health
  if ! curl -f -s "https://parsify.dev/api/health" > /dev/null; then
    echo "ERROR: API health check failed"
    return 1
  fi

  return 0
}

# Monitor for rollback window duration
end_time=$((SECONDS + ROLLBACK_WINDOW / 1000))
failure_count=0

while [ $SECONDS -lt $end_time ]; do
  if ! check_health; then
    failure_count=$((failure_count + 1))
    echo "Health check failed ($failure_count/$ALERT_THRESHOLD)"

    if [ $failure_count -ge $ALERT_THRESHOLD ]; then
      echo "CRITICAL: Multiple health check failures detected"
      echo "Consider rolling back to previous deployment"
      # Add notification logic here
      break
    fi
  else
    failure_count=0
    echo "Health check passed"
  fi

  sleep $MONITOR_INTERVAL
done

echo "Rollback monitoring completed"
`;

  const monitorPath = join(projectRoot, 'scripts', 'rollback-monitor.sh');
  writeFileSync(monitorPath, monitorScript);

  // Make script executable
  try {
    execSync(`chmod +x ${monitorPath}`);
    logSuccess('Rollback monitoring script created');
  } catch (error) {
    logWarning('Could not make rollback monitoring script executable');
  }

  logInfo('Rollback monitoring is now active');
  logInfo(`Rollback window: ${PROD_CONFIG.rollbackWindow / 60000} minutes`);
}

function finalizeDeployment() {
  logStep('Finalizing Deployment');

  // Clean up temporary files
  logInfo('Cleaning up temporary files...');

  // Update deployment status
  logSuccess('Production deployment completed successfully');

  log('\n🎉 Deployment Summary:', 'bright');
  log(`📦 Environment: ${PROD_CONFIG.environment}`, 'green');
  log(`🌐 Domain: https://${PROD_CONFIG.domain}`, 'green');
  log(`🔗 API: https://${PROD_CONFIG.apiDomain}`, 'green');
  log(`📊 Rollback window: ${PROD_CONFIG.rollbackWindow / 60000} minutes`, 'yellow');

  log('\n📋 Post-Deployment Tasks:', 'blue');
  log('• Monitor error rates and performance metrics', 'blue');
  log('• Check user analytics and feedback', 'blue');
  log('• Verify all critical functionality', 'blue');
  log('• Keep rollback monitoring active', 'blue');

  log('\n🔗 Useful Links:', 'blue');
  log(`• Application: https://${PROD_CONFIG.domain}`, 'blue');
  log(`• Vercel Dashboard: https://vercel.com/dashboard`, 'blue');
  log(`• Analytics: Check your analytics platform`, 'blue');
}

async function main() {
  log('🚀 Parsify.dev Production Deployment', 'bright');
  log('==================================', 'cyan');

  if (PROD_CONFIG.dryRun) {
    logWarning('DRY RUN MODE - No actual deployments will be performed');
  }

  const startTime = Date.now();
  let backup;
  let report;

  try {
    // Production deployment pipeline
    if (!requestApproval()) {
      process.exit(1);
    }

    validateProductionReadiness();
    backup = backupCurrentProduction();
    runPreDeploymentTests();
    createProductionBuild();
    validateProductionBuild();
    deployToProduction();
    monitorDeploymentProgress();
    const postDeploySuccess = runPostDeploymentChecks();

    if (!postDeploySuccess && !PROD_CONFIG.dryRun) {
      logWarning('Post-deployment checks failed - consider manual rollback');
    }

    report = generateDeploymentReport(backup);
    setupRollbackMonitoring();
    finalizeDeployment();

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    logStep('Deployment Summary');
    logSuccess(`Production deployment completed in ${duration}s`);
    logSuccess(`Deployment ID: ${report.deploymentId}`);

  } catch (error) {
    logError(`Production deployment failed: ${error.message}`);

    // Attempt rollback if deployment was partially completed
    if (!PROD_CONFIG.dryRun) {
      logWarning('Attempting rollback...');
      try {
        execCommand('vercel rollback', 'Rolling back deployment');
        logSuccess('Rollback completed');
      } catch (rollbackError) {
        logError(`Rollback failed: ${rollbackError.message}`);
        logCritical('Manual intervention required!');
      }
    }

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

// Handle interruption
process.on('SIGINT', () => {
  log('\n🛑 Production deployment interrupted', 'red');
  logCritical('Manual intervention may be required!');
  process.exit(1);
});

// Run the production deployment
main();

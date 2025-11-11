#!/usr/bin/env node

/**
 * Deployment Pipeline Automation Script
 * Handles automated deployment workflows for Parsify.dev
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '../..');

// Pipeline configuration
const PIPELINE_CONFIG = {
  target: process.env.DEPLOY_TARGET || 'staging',
  branch: process.env.BRANCH_NAME || 'main',
  skipTests: process.env.SKIP_TESTS === 'true',
  skipBuild: process.env.SKIP_BUILD === 'true',
  dryRun: process.env.DRY_RUN === 'true',
  force: process.env.FORCE_DEPLOY === 'true',
  timeout: parseInt(process.env.DEPLOY_TIMEOUT) || 600000, // 10 minutes
};

// Environment configurations
const ENVIRONMENTS = {
  staging: {
    name: 'staging',
    domain: 'parsify-staging.vercel.app',
    apiDomain: 'api-staging.parsify.dev',
    branch: 'develop',
    requiredChecks: ['build', 'test', 'lint', 'type-check'],
    environmentFile: '.env.staging',
  },
  production: {
    name: 'production',
    domain: 'parsify.dev',
    apiDomain: 'api.parsify.dev',
    branch: 'main',
    requiredChecks: ['build', 'test', 'lint', 'type-check', 'e2e', 'bundle-check'],
    environmentFile: '.env.production',
  },
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

  if (PIPELINE_CONFIG.dryRun) {
    log(`[DRY RUN] Would execute: ${command}`, 'yellow');
    return '[DRY RUN] Command would be executed';
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, [], {
      cwd: projectRoot,
      shell: true,
      stdio: options.silent ? 'pipe' : 'inherit',
      env: { ...process.env, ...options.env },
    });

    let stdout = '';
    let stderr = '';

    if (options.silent) {
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Command timed out after ${PIPELINE_CONFIG.timeout}ms`));
    }, PIPELINE_CONFIG.timeout);

    child.on('close', (code) => {
      clearTimeout(timeout);

      if (code === 0) {
        logSuccess(`${description} completed`);
        resolve({ stdout, stderr, code });
      } else {
        logError(`${description} failed with exit code ${code}`);
        reject(new Error(`${description} failed: ${stderr || stdout}`));
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      logError(`${description} error: ${error.message}`);
      reject(error);
    });
  });
}

function validatePipelineConfiguration() {
  logStep('Validating Pipeline Configuration');

  // Validate target environment
  if (!ENVIRONMENTS[PIPELINE_CONFIG.target]) {
    logError(`Invalid deployment target: ${PIPELINE_CONFIG.target}`);
    log(`Valid targets: ${Object.keys(ENVIRONMENTS).join(', ')}`, 'blue');
    process.exit(1);
  }

  const env = ENVIRONMENTS[PIPELINE_CONFIG.target];
  logInfo(`Target environment: ${env.name}`);
  logInfo(`Target domain: ${env.domain}`);

  // Validate branch
  if (PIPELINE_CONFIG.target === 'production' && PIPELINE_CONFIG.branch !== env.branch) {
    logError(`Cannot deploy to production from branch ${PIPELINE_CONFIG.branch}`);
    logError(`Production deployments must be from branch: ${env.branch}`);

    if (!PIPELINE_CONFIG.force) {
      process.exit(1);
    } else {
      logWarning('Force deployment enabled - proceeding anyway');
    }
  }

  // Check if we're on the right branch
  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    if (currentBranch !== PIPELINE_CONFIG.branch && !PIPELINE_CONFIG.force) {
      logError(`Cannot deploy from branch ${currentBranch} to ${PIPELINE_CONFIG.target}`);
      logError(`Expected branch: ${PIPELINE_CONFIG.branch}`);
      logInfo('Use FORCE_DEPLOY=true to override');
      process.exit(1);
    }

    logInfo(`Current branch: ${currentBranch}`);
  } catch (error) {
    logWarning('Could not determine current branch');
  }

  // Check for uncommitted changes
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();

    if (status && !PIPELINE_CONFIG.force) {
      logError('Working directory has uncommitted changes');
      logError('Commit or stash changes before deploying');
      logInfo('Use FORCE_DEPLOY=true to override');
      process.exit(1);
    } else if (status && PIPELINE_CONFIG.force) {
      logWarning('Proceeding despite uncommitted changes (force mode)');
    }
  } catch (error) {
    logWarning('Could not check git status');
  }

  // Validate environment file
  const envFile = join(projectRoot, env.environmentFile);
  if (!existsSync(envFile)) {
    logWarning(`Environment file not found: ${env.environmentFile}`);

    if (PIPELINE_CONFIG.target === 'production') {
      logError('Production environment file is required');
      process.exit(1);
    }
  } else {
    logInfo(`Environment file found: ${env.environmentFile}`);
  }

  logSuccess('Pipeline configuration validated');
}

async function runPreDeploymentChecks() {
  logStep('Running Pre-Deployment Checks');

  const env = ENVIRONMENTS[PIPELINE_CONFIG.target];

  if (PIPELINE_CONFIG.skipBuild) {
    logWarning('Skipping build steps (SKIP_BUILD=true)');
    return;
  }

  // Run required checks
  for (const check of env.requiredChecks) {
    logInfo(`Running check: ${check}`);

    try {
      switch (check) {
        case 'build':
          await execCommand('pnpm build', 'Building application');
          break;
        case 'test':
          await execCommand('pnpm test', 'Running unit tests');
          break;
        case 'e2e':
          await execCommand('pnpm test:e2e', 'Running E2E tests');
          break;
        case 'lint':
          await execCommand('pnpm lint', 'Running linting checks');
          break;
        case 'type-check':
          await execCommand('pnpm type-check', 'Running type checks');
          break;
        case 'bundle-check':
          await execCommand('pnpm budget:validate', 'Validating bundle budget');
          break;
        default:
          logWarning(`Unknown check: ${check}`);
      }

      logSuccess(`Check passed: ${check}`);
    } catch (error) {
      logError(`Check failed: ${check}`);

      if (!PIPELINE_CONFIG.force) {
        throw new Error(`Pre-deployment check failed: ${check}`);
      } else {
        logWarning('Proceeding despite failed check (force mode)');
      }
    }
  }

  logSuccess('All pre-deployment checks completed');
}

async function createDeploymentArtifact() {
  logStep('Creating Deployment Artifact');

  if (PIPELINE_CONFIG.skipBuild) {
    logWarning('Skipping artifact creation (SKIP_BUILD=true)');
    return;
  }

  try {
    // Create reports directory
    const reportsDir = join(projectRoot, 'reports');
    mkdirSync(reportsDir, { recursive: true });

    // Generate deployment manifest
    const manifest = {
      deploymentId: generateDeploymentId(),
      timestamp: new Date().toISOString(),
      target: PIPELINE_CONFIG.target,
      branch: PIPELINE_CONFIG.branch,
      commit: getCurrentCommit(),
      version: getPackageVersion(),
      configuration: PIPELINE_CONFIG,
      environment: ENVIRONMENTS[PIPELINE_CONFIG.target],
    };

    const manifestPath = join(reportsDir, `deployment-${manifest.deploymentId}.json`);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    logSuccess(`Deployment manifest created: ${manifestPath}`);
    logSuccess(`Deployment ID: ${manifest.deploymentId}`);

    return manifest;
  } catch (error) {
    logError('Failed to create deployment artifact');
    throw error;
  }
}

function generateDeploymentId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6);
  return `deploy-${timestamp}-${random}`;
}

function getCurrentCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function getPackageVersion() {
  try {
    const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
    return packageJson.version;
  } catch (error) {
    return '1.0.0';
  }
}

async function executeDeployment() {
  logStep('Executing Deployment');

  const env = ENVIRONMENTS[PIPELINE_CONFIG.target];

  try {
    // Set deployment environment variables
    const deploymentEnv = {
      NODE_ENV: PIPELINE_CONFIG.target === 'production' ? 'production' : 'staging',
      NEXT_PUBLIC_ENVIRONMENT: env.name,
      VERCEL_ENV: env.name,
      DEPLOYMENT_ID: generateDeploymentId(),
      ...loadEnvironmentVariables(env.environmentFile),
    };

    // Execute deployment
    if (PIPELINE_CONFIG.target === 'production') {
      await execCommand('vercel --prod', 'Deploying to production', { env: deploymentEnv });
    } else {
      await execCommand('vercel', 'Deploying to staging', { env: deploymentEnv });
    }

    logSuccess(`Deployment to ${env.name} completed`);

    // Get deployment URL
    const deploymentUrl = await getDeploymentUrl();
    logSuccess(`Deployment URL: ${deploymentUrl}`);

    return deploymentUrl;
  } catch (error) {
    logError('Deployment failed');
    throw error;
  }
}

function loadEnvironmentVariables(envFile) {
  const envVars = {};

  try {
    const envContent = readFileSync(join(projectRoot, envFile), 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1]] = match[2];
      }
    }
  } catch (error) {
    logWarning(`Could not load environment variables from ${envFile}`);
  }

  return envVars;
}

async function getDeploymentUrl() {
  try {
    const result = await execCommand('vercel ls --scope $VERCEL_ORG_ID', 'Getting deployment URL', { silent: true });

    // Parse the output to get the latest deployment URL
    const lines = result.stdout.split('\n');
    const latestLine = lines.find(line => line.includes('parsify'));

    if (latestLine) {
      const match = latestLine.match(/https:\/\/[^\s]+/);
      if (match) {
        return match[0];
      }
    }

    return 'https://parsify.vercel.app'; // fallback
  } catch (error) {
    return 'https://parsify.vercel.app'; // fallback
  }
}

async function runPostDeploymentChecks(deploymentUrl) {
  logStep('Running Post-Deployment Checks');

  const checks = [
    { name: 'Health Check', path: '/api/health' },
    { name: 'Main Page', path: '/' },
  ];

  // Add debug endpoint for staging
  if (PIPELINE_CONFIG.target === 'staging') {
    checks.push({ name: 'Debug Endpoint', path: '/api/debug' });
  }

  for (const check of checks) {
    logInfo(`Running check: ${check.name}`);

    try {
      await execCommand(
        `curl -f -s -o /dev/null -w "%{http_code}" ${deploymentUrl}${check.path}`,
        `Checking ${check.name}`,
        { silent: true }
      );

      logSuccess(`${check.name} passed`);
    } catch (error) {
      logError(`${check.name} failed`);

      if (!PIPELINE_CONFIG.force) {
        throw new Error(`Post-deployment check failed: ${check.name}`);
      } else {
        logWarning('Proceeding despite failed check (force mode)');
      }
    }
  }

  logSuccess('All post-deployment checks completed');
}

function generateDeploymentReport(manifest, deploymentUrl) {
  logStep('Generating Deployment Report');

  const report = {
    ...manifest,
    deploymentUrl,
    completedAt: new Date().toISOString(),
    status: 'success',
    checks: {
      preDeployment: true,
      deployment: true,
      postDeployment: true,
    },
  };

  const reportPath = join(projectRoot, 'reports', `deployment-report-${manifest.deploymentId}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  logSuccess(`Deployment report generated: ${reportPath}`);

  return report;
}

async function notifyDeployment(report) {
  logStep('Notifying Deployment Completion');

  try {
    // Log deployment to console (could be extended to Slack, Discord, etc.)
    logInfo(`🎉 Deployment completed successfully!`);
    logInfo(`📦 Deployment ID: ${report.deploymentId}`);
    logInfo(`🌐 Deployment URL: ${report.deploymentUrl}`);
    logInfo(`🌍 Environment: ${report.target}`);
    logInfo(`📊 Version: ${report.version}`);
    logInfo(`🔗 Commit: ${report.commit}`);

    // Could add external notifications here
    // await notifySlack(report);
    // await notifyDiscord(report);

  } catch (error) {
    logWarning('Deployment notification failed');
  }
}

async function rollback() {
  logStep('Rolling Back Deployment');

  try {
    // Get previous deployment
    const result = await execCommand('vercel ls --scope $VERCEL_ORG_ID -n 2', 'Getting previous deployment', { silent: true });

    // Promote previous deployment
    await execCommand('vercel promote --scope $VERCEL_ORG_ID', 'Rolling back to previous deployment');

    logSuccess('Rollback completed');
  } catch (error) {
    logError('Rollback failed');
    throw error;
  }
}

async function main() {
  log('🚀 Parsify.dev Deployment Pipeline', 'bright');
  log('==================================', 'cyan');

  if (PIPELINE_CONFIG.dryRun) {
    logWarning('DRY RUN MODE - No actual deployments will be performed');
  }

  const startTime = Date.now();
  let deploymentManifest;
  let deploymentUrl;
  let deploymentReport;

  try {
    // Deployment pipeline
    validatePipelineConfiguration();
    await runPreDeploymentChecks();
    deploymentManifest = await createDeploymentArtifact();
    deploymentUrl = await executeDeployment();
    await runPostDeploymentChecks(deploymentUrl);
    deploymentReport = generateDeploymentReport(deploymentManifest, deploymentUrl);
    await notifyDeployment(deploymentReport);

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    logStep('Pipeline Summary');
    logSuccess(`Deployment pipeline completed in ${duration}s`);
    logSuccess(`Target: ${PIPELINE_CONFIG.target}`);
    logSuccess(`Deployment URL: ${deploymentUrl}`);
    logSuccess(`Deployment ID: ${deploymentManifest.deploymentId}`);

  } catch (error) {
    logError(`Deployment pipeline failed: ${error.message}`);

    // Attempt rollback if deployment was partially completed
    if (deploymentUrl && !PIPELINE_CONFIG.dryRun) {
      logWarning('Attempting rollback...');
      try {
        await rollback();
      } catch (rollbackError) {
        logError(`Rollback failed: ${rollbackError.message}`);
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
  log('\n🛑 Deployment pipeline interrupted', 'yellow');
  process.exit(1);
});

// Run the deployment pipeline
main();

#!/usr/bin/env tsx

/**
 * Performance Budget CLI
 * Command-line interface for performance budget system
 */

import { performanceBudgetSystem } from './performance-budget-system';
import { performanceBudgetManager } from './performance-budget-manager';
import { buildTimeBudgetValidator } from './build-time-budget-validator';
import { runtimeBudgetMonitor } from './runtime-budget-monitor';
import { budgetAlertSystem } from './budget-alert-system';
import { performanceRegressionDetector } from './performance-regression-detector';
import { budgetOptimizationEngine } from './budget-optimization-engine';
import { ciBudgetIntegration } from './ci-cd-integration';

const commands = {
  // System commands
  init: 'Initialize the performance budget system',
  status: 'Get system status and health',
  validate: 'Run comprehensive budget validation',
  stop: 'Stop the performance budget system',

  // Budget commands
  'budget:list': 'List all configured budgets',
  'budget:add': 'Add a new budget (JSON input)',
  'budget:report': 'Generate budget report',

  // Build commands
  'build:validate': 'Validate build-time budgets',
  'build:analyze': 'Analyze build artifacts',

  // Runtime commands
  'runtime:start': 'Start runtime monitoring',
  'runtime:session': 'Get current runtime session',
  'runtime:measurements': 'Get runtime measurements',

  // Alert commands
  'alerts:list': 'List active alerts',
  'alerts:acknowledge': 'Acknowledge alert (ID required)',
  'alerts:resolve': 'Resolve alert (ID required)',

  // Regression commands
  'regressions:list': 'List active regressions',
  'regressions:report': 'Generate regression report',
  'regressions:resolve': 'Resolve regression (ID required)',

  // Optimization commands
  'optimize:recommendations': 'Generate optimization recommendations',
  'optimize:plan': 'Generate optimization plan',
  'optimize:apply': 'Apply safe optimizations',

  // CI commands
  'ci:validate': 'Run CI/CD budget validation',
  'ci:config': 'Show CI configuration',

  // Report commands
  'report:generate': 'Generate comprehensive report',
  'report:export': 'Export data in specified format',
};

function showHelp(): void {
  console.log('Performance Budget CLI');
  console.log('');
  console.log('Usage: npm run budget <command> [options]');
  console.log('');
  console.log('Available commands:');

  Object.entries(commands).forEach(([command, description]) => {
    console.log(`  ${command.padEnd(25)} ${description}`);
  });

  console.log('');
  console.log('Examples:');
  console.log('  npm run budget init');
  console.log('  npm run budget validate');
  console.log('  npm run budget build:validate --path=.next');
  console.log('  npm run budget alerts:list --severity=critical');
  console.log('  npm run budget report:generate --format=markdown');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (!commands[command]) {
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }

  try {
    await executeCommand(command, args.slice(1));
  } catch (error) {
    console.error(`Error executing command '${command}':`, error);
    process.exit(1);
  }
}

async function executeCommand(command: string, args: string[]): Promise<void> {
  switch (command) {
    case 'init':
      await initSystem();
      break;

    case 'status':
      await showStatus();
      break;

    case 'validate':
      await runValidation();
      break;

    case 'stop':
      await stopSystem();
      break;

    case 'budget:list':
      await listBudgets();
      break;

    case 'budget:add':
      await addBudget(args);
      break;

    case 'budget:report':
      await generateBudgetReport();
      break;

    case 'build:validate':
      await validateBuild(args);
      break;

    case 'build:analyze':
      await analyzeBuild(args);
      break;

    case 'runtime:start':
      await startRuntimeMonitoring();
      break;

    case 'runtime:session':
      await showRuntimeSession();
      break;

    case 'runtime:measurements':
      await showRuntimeMeasurements(args);
      break;

    case 'alerts:list':
      await listAlerts(args);
      break;

    case 'alerts:acknowledge':
      await acknowledgeAlert(args);
      break;

    case 'alerts:resolve':
      await resolveAlert(args);
      break;

    case 'regressions:list':
      await listRegressions(args);
      break;

    case 'regressions:report':
      await generateRegressionReport();
      break;

    case 'regressions:resolve':
      await resolveRegression(args);
      break;

    case 'optimize:recommendations':
      await generateOptimizationRecommendations();
      break;

    case 'optimize:plan':
      await generateOptimizationPlan();
      break;

    case 'optimize:apply':
      await applyOptimizations();
      break;

    case 'ci:validate':
      await runCIValidation(args);
      break;

    case 'ci:config':
      await showCIConfig();
      break;

    case 'report:generate':
      await generateReport(args);
      break;

    case 'report:export':
      await exportData(args);
      break;

    default:
      throw new Error(`Command not implemented: ${command}`);
  }
}

// System commands
async function initSystem(): Promise<void> {
  console.log('🚀 Initializing Performance Budget System...');
  await performanceBudgetSystem.initialize();
  console.log('✅ System initialized successfully');
}

async function showStatus(): Promise<void> {
  const status = performanceBudgetSystem.getStatus();

  console.log('Performance Budget System Status');
  console.log('='.repeat(40));
  console.log(`Enabled: ${status.enabled ? 'Yes' : 'No'}`);
  console.log(`Initialized: ${status.initialized ? 'Yes' : 'No'}`);
  console.log(`Environment: ${status.environment}`);
  console.log(`Health: ${status.health}`);
  console.log(`Uptime: ${Math.round(status.uptime / 1000)}s`);
  console.log(`Last Activity: ${status.lastActivity.toISOString()}`);
  console.log('');
  console.log('Components:');
  Object.entries(status.components).forEach(([component, enabled]) => {
    console.log(`  ${component}: ${enabled ? '✅' : '❌'}`);
  });
  console.log('');
  console.log('Metrics:');
  console.log(`  Budgets Monitored: ${status.metrics.budgetsMonitored}`);
  console.log(`  Active Alerts: ${status.metrics.alertsActive}`);
  console.log(`  Active Regressions: ${status.metrics.regressionsActive}`);
  console.log(`  Total Savings: ${status.metrics.totalSavings} bytes`);
}

async function runValidation(): Promise<void> {
  console.log('🔍 Running comprehensive validation...');
  const report = await performanceBudgetSystem.runValidation();

  console.log('Validation Results');
  console.log('='.repeat(40));
  console.log(`Overall Score: ${report.summary.overallScore.toFixed(1)}`);
  console.log(`Performance Grade: ${report.summary.performanceGrade}`);
  console.log(`Health Status: ${report.summary.healthStatus}`);
  console.log(`Budgets Compliant: ${report.summary.budgetsCompliant}/${report.summary.budgetsMonitored}`);
  console.log(`Active Alerts: ${report.summary.activeAlerts}`);
  console.log(`Critical Alerts: ${report.summary.criticalAlerts}`);
  console.log(`Regressions Detected: ${report.summary.regressionsDetected}`);
  console.log(`Estimated Savings: ${Math.round(report.summary.estimatedSavings / 1024)}KB`);

  if (report.recommendations.length > 0) {
    console.log('');
    console.log('Top Recommendations:');
    report.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.title} (${rec.priority})`);
    });
  }
}

async function stopSystem(): Promise<void> {
  console.log('⏹️ Stopping Performance Budget System...');
  performanceBudgetSystem.stop();
  console.log('✅ System stopped successfully');
}

// Budget commands
async function listBudgets(): Promise<void> {
  const budgets = performanceBudgetManager.getBudgets();

  console.log(`Configured Budgets (${budgets.length})`);
  console.log('='.repeat(40));

  budgets.forEach(budget => {
    console.log(`${budget.name} (${budget.id})`);
    console.log(`  Category: ${budget.category}`);
    console.log(`  Severity: ${budget.severity}`);
    console.log(`  Enabled: ${budget.enabled ? 'Yes' : 'No'}`);
    console.log(`  Metrics: ${budget.metrics.length}`);
    console.log(`  Tags: ${budget.tags.join(', ')}`);
    console.log('');
  });
}

async function addBudget(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error('Budget definition required (JSON format)');
    console.log('Example: npm run budget:add \'{"name":"Custom Budget","category":"bundle",...}\'');
    return;
  }

  try {
    const budgetDefinition = JSON.parse(args[0]);
    performanceBudgetManager.addBudget(budgetDefinition);
    console.log('✅ Budget added successfully');
  } catch (error) {
    console.error('Failed to parse budget definition:', error);
  }
}

async function generateBudgetReport(): Promise<void> {
  console.log('📊 Generating budget report...');

  // Get current measurements
  const measurements = {
    totalSize: 450 * 1024,
    compressedSize: 135 * 1024,
    maxChunkSize: 200 * 1024,
    firstContentfulPaint: 1200,
    largestContentfulPaint: 2000,
    firstInputDelay: 80,
    cumulativeLayoutShift: 0.08,
    totalRequests: 35,
    totalTransferSize: 800 * 1024,
    timeToFirstByte: 500,
  };

  const report = await performanceBudgetManager.generateBudgetReport(
    measurements,
    `cli_${Date.now()}`,
    'development'
  );

  console.log('Budget Report');
  console.log('='.repeat(40));
  console.log(`Status: ${report.status}`);
  console.log(`Overall Score: ${report.summary.overallScore.toFixed(1)}`);
  console.log(`Budgets Passed: ${report.summary.passedBudgets}/${report.summary.totalBudgets}`);
  console.log(`Critical Violations: ${report.summary.criticalViolations}`);
  console.log(`Recommendations: ${report.recommendations.length}`);

  if (report.violations.length > 0) {
    console.log('');
    console.log('Violations:');
    report.violations.forEach(violation => {
      console.log(`  - ${violation.budgetName}: ${violation.metric} (${violation.severity})`);
    });
  }
}

// Build commands
async function validateBuild(args: string[]): Promise<void> {
  const buildPath = getArgValue(args, '--path') || '.next';

  console.log(`🏗️ Validating build at: ${buildPath}`);
  const result = await buildTimeBudgetValidator.validateBuild(buildPath);

  console.log('Build Validation Results');
  console.log('='.repeat(40));
  console.log(`Success: ${result.success ? 'Yes' : 'No'}`);
  console.log(`Should Block Build: ${result.shouldBlockBuild ? 'Yes' : 'No'}`);
  console.log(`Total Time: ${result.metrics.totalTime}ms`);
  console.log(`Budgets Checked: ${result.metrics.budgetsChecked}`);
  console.log(`Violations Found: ${result.metrics.violationsFound}`);
  console.log(`Critical Violations: ${result.metrics.criticalViolations}`);

  if (result.violations.length > 0) {
    console.log('');
    console.log('Violations:');
    result.violations.forEach(violation => {
      const icon = violation.severity === 'critical' ? '🚨' :
                  violation.severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${icon} ${violation.category}: ${violation.message}`);
    });
  }

  if (result.recommendations.length > 0) {
    console.log('');
    console.log('Recommendations:');
    result.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.title} (${rec.priority})`);
    });
  }
}

async function analyzeBuild(args: string[]): Promise<void> {
  const buildPath = getArgValue(args, '--path') || '.next';

  console.log(`🔍 Analyzing build at: ${buildPath}`);

  // This would implement detailed build analysis
  console.log('Build Analysis');
  console.log('='.repeat(40));
  console.log('Analysis features coming soon...');
}

// Runtime commands
async function startRuntimeMonitoring(): Promise<void> {
  console.log('🔍 Starting runtime monitoring...');
  await runtimeBudgetMonitor.initialize();
  console.log('✅ Runtime monitoring started');
}

async function showRuntimeSession(): Promise<void> {
  const session = runtimeBudgetMonitor.getSession();

  console.log('Runtime Session');
  console.log('='.repeat(40));
  console.log(`Session ID: ${session.id}`);
  console.log(`Start Time: ${session.startTime.toISOString()}`);
  console.log(`URL: ${session.url}`);
  console.log(`User Agent: ${session.userAgent}`);
  console.log(`Measurements: ${session.measurements.length}`);
  console.log(`Budget Checks: ${session.checks.length}`);
  console.log(`Alerts: ${session.alerts.length}`);
  console.log(`Compliance Score: ${session.complianceScore.toFixed(1)}`);
  console.log(`Violations: ${session.violations}`);
}

async function showRuntimeMeasurements(args: string[]): Promise<void> {
  const metricName = getArgValue(args, '--metric');

  const measurements = runtimeBudgetMonitor.getMeasurements(metricName);

  console.log(`Runtime Measurements${metricName ? ` (${metricName})` : ''}`);
  console.log('='.repeat(40));
  console.log(`Total Measurements: ${measurements.length}`);

  if (measurements.length > 0) {
    const latest = measurements[measurements.length - 1];
    console.log(`Latest Value: ${latest.value} ${latest.unit}`);
    console.log(`Latest Timestamp: ${latest.timestamp.toISOString()}`);
    console.log(`Source: ${latest.source}`);

    if (measurements.length > 1) {
      const oldest = measurements[0];
      const change = latest.value - oldest.value;
      const changePercent = (change / oldest.value) * 100;
      console.log(`Change: ${change.toFixed(2)} (${changePercent.toFixed(1)}%)`);
    }
  }
}

// Alert commands
async function listAlerts(args: string[]): Promise<void> {
  const severity = getArgValue(args, '--severity');

  let alerts = budgetAlertSystem.getActiveAlerts();

  if (severity) {
    alerts = alerts.filter(alert => alert.severity === severity);
  }

  console.log(`Active Alerts${severity ? ` (${severity})` : ''} (${alerts.length})`);
  console.log('='.repeat(40));

  alerts.forEach(alert => {
    const emoji = alert.severity === 'critical' ? '🚨' :
                  alert.severity === 'error' ? '❌' :
                  alert.severity === 'warning' ? '⚠️' : 'ℹ️';

    console.log(`${emoji} ${alert.type.toUpperCase()}: ${alert.message}`);
    console.log(`   Metric: ${alert.metric}`);
    console.log(`   Current: ${alert.currentValue} (Threshold: ${alert.threshold})`);
    console.log(`   Timestamp: ${alert.timestamp.toISOString()}`);
    console.log(`   Acknowledged: ${alert.acknowledged ? 'Yes' : 'No'}`);
    console.log('');
  });
}

async function acknowledgeAlert(args: string[]): Promise<void> {
  const alertId = getArgValue(args, '--id');
  const userId = getArgValue(args, '--user') || 'cli-user';

  if (!alertId) {
    console.error('Alert ID required (--id)');
    return;
  }

  budgetAlertSystem.acknowledgeAlert(alertId, userId);
  console.log(`✅ Alert ${alertId} acknowledged`);
}

async function resolveAlert(args: string[]): Promise<void> {
  const alertId = getArgValue(args, '--id');
  const userId = getArgValue(args, '--user') || 'cli-user';
  const message = getArgValue(args, '--message') || 'Resolved via CLI';

  if (!alertId) {
    console.error('Alert ID required (--id)');
    return;
  }

  budgetAlertSystem.resolveAlert(alertId, userId, message);
  console.log(`✅ Alert ${alertId} resolved`);
}

// Regression commands
async function listRegressions(args: string[]): Promise<void> {
  const severity = getArgValue(args, '--severity');
  const status = getArgValue(args, '--status');

  let regressions = performanceRegressionDetector.getRegressions();

  if (severity) {
    regressions = regressions.filter(reg => reg.severity === severity);
  }

  if (status) {
    regressions = regressions.filter(reg => reg.status === status);
  }

  console.log(`Regressions${severity ? ` (${severity})` : ''}${status ? ` (${status})` : ''} (${regressions.length})`);
  console.log('='.repeat(40));

  regressions.forEach(regression => {
    const emoji = regression.severity === 'critical' ? '🚨' :
                  regression.severity === 'major' ? '❌' :
                  regression.severity === 'moderate' ? '⚠️' : 'ℹ️';

    console.log(`${emoji} ${regression.metric}`);
    console.log(`   Change: ${regression.changePercentage.toFixed(1)}%`);
    console.log(`   Current: ${regression.currentValue} (Baseline: ${regression.baselineValue})`);
    console.log(`   Build: ${regression.buildId}`);
    console.log(`   Status: ${regression.status}`);
    console.log(`   Detected: ${regression.detectedAt.toISOString()}`);
    console.log('');
  });
}

async function generateRegressionReport(): Promise<void> {
  console.log('📈 Generating regression report...');
  const report = await performanceRegressionDetector.generateRegressionReport();

  console.log('Regression Report');
  console.log('='.repeat(40));
  console.log(`Total Regressions: ${report.summary.totalRegressions}`);
  console.log(`Active Regressions: ${report.summary.activeRegressions}`);
  console.log(`Critical Regressions: ${report.summary.criticalRegressions}`);
  console.log(`Overall Impact: ${report.summary.overallImpact}`);

  if (report.regressions.length > 0) {
    console.log('');
    console.log('Regressions:');
    report.regressions.slice(0, 3).forEach((reg, index) => {
      console.log(`  ${index + 1}. ${reg.metric}: ${reg.changePercentage.toFixed(1)}% (${reg.severity})`);
    });
  }
}

async function resolveRegression(args: string[]): Promise<void> {
  const regressionId = getArgValue(args, '--id');
  const resolvedBy = getArgValue(args, '--by') || 'cli-user';
  const resolution = getArgValue(args, '--resolution') || 'Resolved via CLI';

  if (!regressionId) {
    console.error('Regression ID required (--id)');
    return;
  }

  performanceRegressionDetector.resolveRegression(regressionId, resolvedBy, resolution);
  console.log(`✅ Regression ${regressionId} resolved`);
}

// Optimization commands
async function generateOptimizationRecommendations(): Promise<void> {
  console.log('⚡ Generating optimization recommendations...');

  const context = {
    buildId: `cli_${Date.now()}`,
    timestamp: new Date(),
    bundleSize: 450 * 1024,
    compressedSize: 135 * 1024,
    metrics: {
      totalSize: 450 * 1024,
      compressedSize: 135 * 1024,
      maxChunkSize: 200 * 1024,
    },
    violations: [],
    dependencies: [],
    assets: [],
    chunks: [],
    usage: {
      features: {},
      routes: {},
      components: {},
      apis: {},
    },
  };

  const recommendations = await budgetOptimizationEngine.generateRecommendations(context);

  console.log(`Optimization Recommendations (${recommendations.length})`);
  console.log('='.repeat(40));

  recommendations.forEach((rec, index) => {
    const emoji = rec.priority === 'critical' ? '🚨' :
                  rec.priority === 'high' ? '⚡' :
                  rec.priority === 'medium' ? '💡' : 'ℹ️';

    console.log(`${emoji} ${index + 1}. ${rec.title} (${rec.priority})`);
    console.log(`   Type: ${rec.type} | Category: ${rec.category}`);
    console.log(`   Size Savings: ${Math.round(rec.impact.sizeSavings / 1024)}KB`);
    console.log(`   Automatable: ${rec.automation.automatable ? 'Yes' : 'No'}`);
    console.log(`   Estimated Effort: ${rec.effort.estimatedTime}h`);
    console.log('');
  });
}

async function generateOptimizationPlan(): Promise<void> {
  console.log('📋 Generating optimization plan...');

  const context = {
    buildId: `cli_${Date.now()}`,
    timestamp: new Date(),
    bundleSize: 450 * 1024,
    compressedSize: 135 * 1024,
    metrics: {
      totalSize: 450 * 1024,
      compressedSize: 135 * 1024,
    },
    violations: [],
    dependencies: [],
    assets: [],
    chunks: [],
    usage: {
      features: {},
      routes: {},
      components: {},
      apis: {},
    },
  };

  const plan = await budgetOptimizationEngine.generateOptimizationPlan(context);

  console.log('Optimization Plan');
  console.log('='.repeat(40));
  console.log(`Total Recommendations: ${plan.summary.totalRecommendations}`);
  console.log(`Critical Recommendations: ${plan.summary.criticalRecommendations}`);
  console.log(`Estimated Size Savings: ${Math.round(plan.summary.estimatedSizeSavings / 1024)}KB`);
  console.log(`Total Effort: ${plan.summary.totalEffort}h`);
  console.log(`Automation Potential: ${plan.automationPotential.toFixed(1)}%`);
  console.log(`Quick Wins: ${plan.summary.quickWins}`);
  console.log(`Risk Assessment: ${plan.summary.riskAssessment}`);

  console.log('');
  console.log('Implementation Phases:');
  plan.phases.forEach((phase, index) => {
    console.log(`  ${index + 1}. ${phase.name} (${phase.duration} days)`);
    console.log(`     Recommendations: ${phase.recommendations.length}`);
  });
}

async function applyOptimizations(): Promise<void> {
  console.log('⚡ Applying safe optimizations...');
  console.log('Automated optimization features coming soon...');
}

// CI commands
async function runCIValidation(args: string[]): Promise<void> {
  const buildPath = getArgValue(args, '--path');

  console.log('🔄 Running CI/CD validation...');
  const result = await ciBudgetIntegration.runBudgetValidation(buildPath);

  console.log('CI/CD Validation Results');
  console.log('='.repeat(40));
  console.log(`Success: ${result.success ? 'Yes' : 'No'}`);
  console.log(`Blocked: ${result.blocked ? 'Yes' : 'No'}`);
  console.log(`Gate: ${result.gate}`);
  console.log(`Duration: ${Math.round(result.duration / 1000)}s`);
  console.log(`Violations: ${result.violations.length}`);
  console.log(`Recommendations: ${result.recommendations.length}`);

  if (result.violations.length > 0) {
    console.log('');
    console.log('Violations:');
    result.violations.forEach(violation => {
      const icon = violation.severity === 'critical' ? '🚨' :
                  violation.severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${icon} ${violation.description} (${violation.type})`);
    });
  }
}

async function showCIConfig(): Promise<void> {
  const ciConfig = ciBudgetIntegration.getCIConfig();

  console.log('CI/CD Configuration');
  console.log('='.repeat(40));
  console.log(`Enabled: ${ciConfig.enabled ? 'Yes' : 'No'}`);
  console.log(`Provider: ${ciConfig.provider}`);
  console.log(`Environment: ${ciConfig.environment}`);
  console.log(`Branch: ${ciConfig.branch}`);
  console.log(`Build Number: ${ciConfig.build.number}`);
  console.log(`Commit: ${ciConfig.commit.hash} (${ciConfig.commit.author})`);

  if (ciConfig.pullRequest) {
    console.log(`Pull Request: #${ciConfig.pullRequest.number}`);
  }
}

// Report commands
async function generateReport(args: string[]): Promise<void> {
  const format = getArgValue(args, '--format') || 'console';

  console.log('📊 Generating comprehensive report...');
  const report = await performanceBudgetSystem.runValidation();

  if (format === 'console') {
    console.log('Comprehensive Performance Report');
    console.log('='.repeat(50));
    console.log(`Generated: ${report.timestamp.toISOString()}`);
    console.log(`Environment: development`);
    console.log('');
    console.log('Summary:');
    console.log(`  Overall Score: ${report.summary.overallScore.toFixed(1)}/100`);
    console.log(`  Performance Grade: ${report.summary.performanceGrade}`);
    console.log(`  Health Status: ${report.summary.healthStatus}`);
    console.log(`  Budgets Compliant: ${report.summary.budgetsCompliant}/${report.summary.budgetsMonitored}`);
    console.log('');
    console.log('Issues:');
    console.log(`  Active Alerts: ${report.summary.activeAlerts}`);
    console.log(`  Critical Alerts: ${report.summary.criticalAlerts}`);
    console.log(`  Regressions Detected: ${report.summary.regressionsDetected}`);
    console.log('');
    console.log('Impact:');
    console.log(`  Estimated Savings: ${Math.round(report.summary.estimatedSavings / 1024)}KB`);
    console.log(`  Recommendations Generated: ${report.recommendations.length}`);

    if (report.trends.length > 0) {
      console.log('');
      console.log('Trends:');
      report.trends.forEach(trend => {
        const arrow = trend.direction === 'improving' ? '↑' :
                     trend.direction === 'degrading' ? '↓' : '→';
        console.log(`  ${trend.metric}: ${arrow} ${trend.changePercentage.toFixed(1)}% (${trend.significance})`);
      });
    }
  } else {
    console.log(`Report generation for format '${format}' coming soon...`);
  }
}

async function exportData(args: string[]): Promise<void> {
  const format = getArgValue(args, '--format') || 'json';
  const outputPath = getArgValue(args, '--output') || `budget-export.${Date.now()}.${format}`;

  console.log(`Exporting data in ${format} format to ${outputPath}...`);
  console.log('Data export features coming soon...');
}

// Utility functions
function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
}

// Run CLI
if (require.main === module) {
  main().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

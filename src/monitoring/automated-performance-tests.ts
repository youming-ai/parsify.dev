/**
 * Automated Performance Test Execution and Comparison Script
 * Main entry point for automated performance testing in CI/CD pipelines
 * Orchestrates all performance testing components and provides unified reporting
 */

import { CICDIntegration, CIConfig } from './ci-cd-integration';
import { PerformanceRegressionTester } from './performance-regression-testing';
import { PerformanceBenchmarking } from './performance-benchmarking';
import { PerformanceRegressionDetector } from './performance-regression-detector';

export interface AutomatedTestConfig {
  // Test execution settings
  execution: {
    environments: string[]; // ['desktop-chrome', 'mobile-chrome', 'tablet-safari']
    scenarios: string[]; // Specific scenarios to test, empty for all
    parallel: boolean;
    maxConcurrency: number;
    timeout: number; // minutes
    retries: number;
  };

  // Baseline and comparison settings
  baselines: {
    createIfMissing: boolean;
    compareAgainstLatest: boolean;
    compareAgainstVersion?: string; // Specific version to compare against
    autoApproveBaseline: boolean;
  };

  // Performance gates and thresholds
  gates: {
    enabled: boolean;
    blockOnRegressions: boolean;
    requireMinimumImprovement: number; // percentage
    allowedRegressionTypes: Array<'warning' | 'critical'>;
  };

  // Reporting and notifications
  reporting: {
    generateHTMLReport: boolean;
    generateJSONReport: boolean;
    generateJUnitReport: boolean;
    generatePRComment: boolean;
    uploadToStorage: boolean;
    storageUrl?: string;
  };

  // CI/CD integration
  cicd: {
    platform: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'azure-devops' | 'none';
    updateStatusChecks: boolean;
    createArtifacts: boolean;
    notifyOnFailure: boolean;
    notifyOnSuccess: boolean;
  };
}

export interface AutomatedTestResult {
  execution: {
    id: string;
    startTime: Date;
    endTime: Date;
    duration: number; // milliseconds
    environment: string;
    config: AutomatedTestConfig;
  };

  results: {
    testResults: import('./performance-regression-testing').PerformanceTestResult[];
    benchmarkResults: import('./performance-benchmarking').BenchmarkResult[];
    regressionResults: import('./performance-regression-detector').RegressionDetectionResult[];
  };

  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
    criticalRegressions: number;
    warningRegressions: number;
    improvements: number;
    performanceScore: number; // 0-100
    baselineCreated: boolean;
  };

  status: {
    overall: 'success' | 'warning' | 'failure' | 'error';
    gates: 'passed' | 'failed' | 'bypassed';
    action: 'deploy' | 'investigate' | 'rollback' | 'retry';
  };

  artifacts: {
    reports: Array<{
      type: 'html' | 'json' | 'junit' | 'pr-comment';
      path: string;
      url?: string;
    }>;
    screenshots: string[];
    traces: string[];
    baselines: string[];
  };

  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'performance' | 'regression' | 'improvement' | 'infrastructure';
    description: string;
    action: string;
    impact: string;
  }>;
}

/**
 * Automated Performance Test Orchestrator
 */
export class AutomatedPerformanceTests {
  private static instance: AutomatedPerformanceTests;
  private config: AutomatedTestConfig;
  private cicdIntegration: CICDIntegration;
  private isInitialized = false;

  // Core components
  private performanceTester: PerformanceRegressionTester;
  private benchmarking: PerformanceBenchmarking;
  private regressionDetector: PerformanceRegressionDetector;

  private constructor(config?: Partial<AutomatedTestConfig>) {
    this.config = this.getDefaultConfig(config);
    this.cicdIntegration = CICDIntegration.getInstance();
    this.performanceTester = PerformanceRegressionTester.getInstance();
    this.benchmarking = PerformanceBenchmarking.getInstance();
    this.regressionDetector = PerformanceRegressionDetector.getInstance();
  }

  public static getInstance(config?: Partial<AutomatedTestConfig>): AutomatedPerformanceTests {
    if (!AutomatedPerformanceTests.instance) {
      AutomatedPerformanceTests.instance = new AutomatedPerformanceTests(config);
    }
    return AutomatedPerformanceTests.instance;
  }

  private getDefaultConfig(overrides?: Partial<AutomatedTestConfig>): AutomatedTestConfig {
    const isCI = process.env.CI === 'true';
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      execution: {
        environments: ['desktop-chrome', 'mobile-chrome'],
        scenarios: [], // Empty means run all scenarios
        parallel: !isCI, // Disable parallel in CI for consistency
        maxConcurrency: isCI ? 1 : 3,
        timeout: isProduction ? 45 : 30, // minutes
        retries: isCI ? 3 : 1,
      },
      baselines: {
        createIfMissing: true,
        compareAgainstLatest: true,
        autoApproveBaseline: !isProduction, // Auto-approve in non-production
      },
      gates: {
        enabled: true,
        blockOnRegressions: isProduction,
        requireMinimumImprovement: 0, // Don't require improvements by default
        allowedRegressionTypes: isProduction ? [] : ['warning'], // Allow warnings in non-production
      },
      reporting: {
        generateHTMLReport: true,
        generateJSONReport: true,
        generateJUnitReport: true,
        generatePRComment: isCI,
        uploadToStorage: !!process.env.REPORT_SERVER_URL,
        storageUrl: process.env.REPORT_SERVER_URL,
      },
      cicd: {
        platform: this.detectCIPlatform(),
        updateStatusChecks: isCI,
        createArtifacts: isCI,
        notifyOnFailure: true,
        notifyOnSuccess: process.env.NOTIFY_ON_SUCCESS === 'true',
      },
      ...overrides,
    };
  }

  private detectCIPlatform(): AutomatedTestConfig['cicd']['platform'] {
    if (process.env.GITHUB_ACTIONS) return 'github-actions';
    if (process.env.GITLAB_CI) return 'gitlab-ci';
    if (process.env.JENKINS_URL) return 'jenkins';
    if (process.env.AZURE_PIPELINES) return 'azure-devops';
    return 'none';
  }

  /**
   * Initialize the automated performance testing system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🚀 Initializing Automated Performance Tests...');

    try {
      // Initialize CI/CD integration if enabled
      if (this.config.cicd.platform !== 'none') {
        await this.cicdIntegration.initialize();
      }

      // Initialize core performance testing components
      await this.performanceTester.initialize();
      await this.benchmarking.initialize();
      await this.regressionDetector.initialize();

      this.isInitialized = true;
      console.log('✅ Automated Performance Tests initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Automated Performance Tests:', error);
      throw error;
    }
  }

  /**
   * Execute the complete automated performance test suite
   */
  public async execute(options?: {
    environments?: string[];
    scenarios?: string[];
    createBaseline?: boolean;
    dryRun?: boolean;
    forceRun?: boolean;
  }): Promise<AutomatedTestResult> {
    if (!this.isInitialized) {
      throw new Error('Automated Performance Tests not initialized');
    }

    const executionId = `perf-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔄 Starting automated performance test execution: ${executionId}`);

    const startTime = Date.now();

    // Override config with options
    const execConfig = {
      ...this.config,
      execution: {
        ...this.config.execution,
        environments: options?.environments || this.config.execution.environments,
        scenarios: options?.scenarios || this.config.execution.scenarios,
      },
    };

    const result: AutomatedTestResult = {
      execution: {
        id: executionId,
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        environment: process.env.NODE_ENV || 'development',
        config: execConfig,
      },
      results: {
        testResults: [],
        benchmarkResults: [],
        regressionResults: [],
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        warningTests: 0,
        criticalRegressions: 0,
        warningRegressions: 0,
        improvements: 0,
        performanceScore: 0,
        baselineCreated: false,
      },
      status: {
        overall: 'success',
        gates: 'passed',
        action: 'deploy',
      },
      artifacts: {
        reports: [],
        screenshots: [],
        traces: [],
        baselines: [],
      },
      recommendations: [],
    };

    try {
      // Update status if in CI
      if (this.config.cicd.updateStatusChecks && this.config.cicd.platform !== 'none') {
        await this.updateCIStatus('pending', 'Running automated performance tests...');
      }

      // Step 1: Execute performance tests
      console.log('📋 Step 1: Executing performance tests...');
      result.results.testResults = await this.executePerformanceTests(execConfig.execution);

      // Step 2: Execute benchmarking if enabled
      console.log('📊 Step 2: Executing benchmarking...');
      result.results.benchmarkResults = await this.executeBenchmarking(execConfig.execution, options?.createBaseline);

      // Step 3: Perform regression detection
      console.log('🔍 Step 3: Performing regression detection...');
      result.results.regressionResults = await this.performRegressionDetection(result.results.testResults);

      // Step 4: Generate summary
      console.log('📈 Step 4: Generating summary...');
      result.summary = this.generateSummary(result.results, execConfig.baselines);

      // Step 5: Evaluate gates and determine status
      console.log('🚪 Step 5: Evaluating performance gates...');
      result.status = await this.evaluateGatesAndStatus(result.summary, execConfig.gates);

      // Step 6: Generate reports and artifacts
      console.log('📄 Step 6: Generating reports and artifacts...');
      result.artifacts = await this.generateReportsAndArtifacts(result);

      // Step 7: Generate recommendations
      console.log('💡 Step 7: Generating recommendations...');
      result.recommendations = this.generateRecommendations(result);

      // Step 8: Handle CI/CD integration
      console.log('🔄 Step 8: Handling CI/CD integration...');
      await this.handleCIDCIntegration(result);

      // Update execution details
      result.execution.endTime = new Date();
      result.execution.duration = Date.now() - startTime;

      console.log(`✅ Automated performance test execution completed: ${executionId} (${result.status.overall})`);
      return result;
    } catch (error) {
      console.error(`❌ Automated performance test execution failed: ${executionId}`, error);

      // Update with error details
      result.execution.endTime = new Date();
      result.execution.duration = Date.now() - startTime;
      result.status.overall = 'error';
      result.status.gates = 'failed';
      result.status.action = 'investigate';

      // Update CI status
      if (this.config.cicd.updateStatusChecks && this.config.cicd.platform !== 'none') {
        await this.updateCIStatus('error', `Performance tests failed: ${error}`);
      }

      return result;
    }
  }

  /**
   * Execute performance tests with specified configuration
   */
  private async executePerformanceTests(execConfig: AutomatedTestConfig['execution']): Promise<import('./performance-regression-testing').PerformanceTestResult[]> {
    try {
      const testResults = await this.performanceTester.runTestSuite({
        environments: execConfig.environments,
        scenarios: execConfig.scenarios.length > 0 ? execConfig.scenarios : undefined,
        parallel: execConfig.parallel,
      });

      return testResults;
    } catch (error) {
      console.error('Performance test execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute benchmarking with specified configuration
   */
  private async executeBenchmarking(
    execConfig: AutomatedTestConfig['execution'],
    createBaseline?: boolean
  ): Promise<import('./performance-benchmarking').BenchmarkResult[]> {
    try {
      const benchmarkResults = await this.benchmarking.runBenchmarkSuite({
        environments: execConfig.environments,
        scenarios: execConfig.scenarios.length > 0 ? execConfig.scenarios : undefined,
        parallel: execConfig.parallel,
        createBaseline: createBaseline || this.config.baselines.createIfMissing,
      });

      return benchmarkResults;
    } catch (error) {
      console.error('Benchmarking execution failed:', error);
      throw error;
    }
  }

  /**
   * Perform regression detection on test results
   */
  private async performRegressionDetection(
    testResults: import('./performance-regression-testing').PerformanceTestResult[]
  ): Promise<import('./performance-regression-detector').RegressionDetectionResult[]> {
    const regressionResults: import('./performance-regression-detector').RegressionDetectionResult[] = [];

    for (const result of testResults) {
      try {
        // Get latest baseline for comparison
        const baseline = await this.getLatestBaseline(result.scenario, result.environment);

        if (baseline) {
          const detectionResult = await this.regressionDetector.detectRegressions(result, baseline);
          regressionResults.push(detectionResult);
        } else {
          console.warn(`No baseline found for ${result.scenario} in ${result.environment}`);
        }
      } catch (error) {
        console.error(`Regression detection failed for ${result.scenario}:`, error);
      }
    }

    return regressionResults;
  }

  /**
   * Generate summary statistics from all results
   */
  private generateSummary(
    results: AutomatedTestResult['results'],
    baselineConfig: AutomatedTestConfig['baselines']
  ): AutomatedTestResult['summary'] {
    const { testResults, regressionResults } = results;

    // Test statistics
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'passed').length;
    const failedTests = testResults.filter(r => r.status === 'failed').length;
    const warningTests = testResults.filter(r => r.status === 'warning').length;

    // Regression statistics
    const criticalRegressions = regressionResults.reduce((count, r) =>
      count + r.regressions.filter(reg => reg.severity === 'critical').length, 0
    );
    const warningRegressions = regressionResults.reduce((count, r) =>
      count + r.regressions.filter(reg => reg.severity === 'warning').length, 0
    );
    const improvements = regressionResults.reduce((count, r) =>
      count + r.improvements.length, 0
    );

    // Performance score
    const scoreResults = testResults.map(r => r.score.overall);
    const performanceScore = scoreResults.length > 0
      ? Math.round(scoreResults.reduce((sum, score) => sum + score, 0) / scoreResults.length)
      : 0;

    // Baseline creation
    const baselineCreated = regressionResults.some(r =>
      r.regressions.length === 0 && testResults.some(tr => tr.scenario === r.scenario && tr.environment === r.environment)
    );

    return {
      totalTests,
      passedTests,
      failedTests,
      warningTests,
      criticalRegressions,
      warningRegressions,
      improvements,
      performanceScore,
      baselineCreated,
    };
  }

  /**
   * Evaluate performance gates and determine status
   */
  private async evaluateGatesAndStatus(
    summary: AutomatedTestResult['summary'],
    gateConfig: AutomatedTestConfig['gates']
  ): Promise<Pick<AutomatedTestResult['status'], 'overall' | 'gates' | 'action'>> {
    let overall: AutomatedTestResult['status']['overall'] = 'success';
    let gates: AutomatedTestResult['status']['gates'] = 'passed';
    let action: AutomatedTestResult['status']['action'] = 'deploy';

    if (!gateConfig.enabled) {
      return { overall, gates, action };
    }

    // Check for critical regressions
    if (summary.criticalRegressions > 0) {
      overall = 'failure';
      gates = 'failed';
      action = 'rollback';

      if (gateConfig.allowedRegressionTypes.includes('critical')) {
        overall = 'warning';
        gates = 'bypassed';
        action = 'investigate';
      }
    }
    // Check for warning regressions
    else if (summary.warningRegressions > 0) {
      if (!gateConfig.allowedRegressionTypes.includes('warning')) {
        overall = 'failure';
        gates = 'failed';
        action = 'investigate';
      } else {
        overall = 'warning';
        gates = 'bypassed';
        action = 'deploy'; // Warnings don't block deployment
      }
    }
    // Check for test failures
    else if (summary.failedTests > 0) {
      overall = 'failure';
      gates = 'failed';
      action = 'investigate';
    }
    // Check for minimum improvement requirement
    else if (gateConfig.requireMinimumImprovement > 0 && summary.improvements < gateConfig.requireMinimumImprovement) {
      overall = 'warning';
      action = 'investigate';
    }

    return { overall, gates, action };
  }

  /**
   * Generate reports and artifacts
   */
  private async generateReportsAndArtifacts(result: AutomatedTestResult): Promise<AutomatedTestResult['artifacts']> {
    const artifacts: AutomatedTestResult['artifacts'] = {
      reports: [],
      screenshots: [],
      traces: [],
      baselines: [],
    };

    try {
      // Ensure reports directory exists
      const fs = require('fs').promises;
      const path = require('path');
      const reportsDir = path.join(process.cwd(), 'performance-reports');
      await fs.mkdir(reportsDir, { recursive: true });

      // Generate HTML report
      if (this.config.reporting.generateHTMLReport) {
        const htmlPath = await this.generateHTMLReport(result, reportsDir);
        artifacts.reports.push({
          type: 'html',
          path: htmlPath,
          url: this.config.reporting.storageUrl ? `${this.config.reporting.storageUrl}/reports/${path.basename(htmlPath)}` : undefined,
        });
      }

      // Generate JSON report
      if (this.config.reporting.generateJSONReport) {
        const jsonPath = await this.generateJSONReport(result, reportsDir);
        artifacts.reports.push({
          type: 'json',
          path: jsonPath,
          url: this.config.reporting.storageUrl ? `${this.config.reporting.storageUrl}/reports/${path.basename(jsonPath)}` : undefined,
        });
      }

      // Generate JUnit report
      if (this.config.reporting.generateJUnitReport) {
        const junitPath = await this.generateJUnitReport(result, reportsDir);
        artifacts.reports.push({
          type: 'junit',
          path: junitPath,
        });
      }

      // Generate PR comment
      if (this.config.reporting.generatePRComment) {
        const commentPath = await this.generatePRComment(result, reportsDir);
        artifacts.reports.push({
          type: 'pr-comment',
          path: commentPath,
        });
      }

      // Upload to storage if enabled
      if (this.config.reporting.uploadToStorage && this.config.reporting.storageUrl) {
        await this.uploadArtifactsToStorage(artifacts);
      }

    } catch (error) {
      console.error('Failed to generate reports and artifacts:', error);
    }

    return artifacts;
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(result: AutomatedTestResult): AutomatedTestResult['recommendations'] {
    const recommendations: AutomatedTestResult['recommendations'] = [];

    // Critical regression recommendations
    if (result.summary.criticalRegressions > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'regression',
        description: `Critical performance regressions detected (${result.summary.criticalRegressions})`,
        action: 'Investigate and fix critical regressions before deployment',
        impact: 'Severe impact on user experience and system performance',
      });
    }

    // Warning regression recommendations
    if (result.summary.warningRegressions > 0) {
      recommendations.push({
        priority: 'high',
        category: 'regression',
        description: `Performance warnings detected (${result.summary.warningRegressions})`,
        action: 'Monitor and optimize performance regressions',
        impact: 'Moderate impact on user experience',
      });
    }

    // Test failure recommendations
    if (result.summary.failedTests > 0) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        description: `Performance test failures (${result.summary.failedTests})`,
        action: 'Fix failing performance tests and investigate root causes',
        impact: 'Performance tests not providing reliable metrics',
      });
    }

    // Improvement recommendations
    if (result.summary.improvements > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'improvement',
        description: `Performance improvements detected (${result.summary.improvements})`,
        action: 'Document and maintain successful optimization strategies',
        impact: 'Positive impact on user experience and system performance',
      });
    }

    // Performance score recommendations
    if (result.summary.performanceScore < 70) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        description: `Low performance score (${result.summary.performanceScore}/100)`,
        action: 'Comprehensive performance optimization recommended',
        impact: 'Poor overall performance affecting user experience',
      });
    } else if (result.summary.performanceScore < 85) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        description: `Moderate performance score (${result.summary.performanceScore}/100)`,
        action: 'Consider targeted performance optimizations',
        impact: 'Room for improvement in overall performance',
      });
    }

    return recommendations;
  }

  /**
   * Handle CI/CD integration
   */
  private async handleCIDCIntegration(result: AutomatedTestResult): Promise<void> {
    if (this.config.cicd.platform === 'none') {
      return;
    }

    try {
      // Update status checks
      if (this.config.cicd.updateStatusChecks) {
        await this.updateCIStatus(
          result.status.overall,
          this.getStatusDescription(result)
        );
      }

      // Create artifacts in CI system
      if (this.config.cicd.createArtifacts) {
        await this.createCIArtifacts(result);
      }

      // Send notifications
      if ((this.config.cicd.notifyOnFailure && result.status.overall !== 'success') ||
          (this.config.cicd.notifyOnSuccess && result.status.overall === 'success')) {
        await this.sendCINotifications(result);
      }

    } catch (error) {
      console.error('CI/CD integration failed:', error);
    }
  }

  /**
   * Update CI status checks
   */
  private async updateCIStatus(state: 'pending' | 'success' | 'failure' | 'error', description: string): Promise<void> {
    // This would integrate with the specific CI platform
    console.log(`CI Status Update: ${state} - ${description}`);
  }

  /**
   * Get status description for CI updates
   */
  private getStatusDescription(result: AutomatedTestResult): string {
    const { summary, status } = result;

    switch (status.overall) {
      case 'success':
        return `Performance tests passed (${summary.passedTests}/${summary.totalTests}) - Score: ${summary.performanceScore}/100`;
      case 'warning':
        return `Performance tests completed with warnings (${summary.warningTests} warnings, ${summary.warningRegressions} regressions)`;
      case 'failure':
        return `Performance tests failed (${summary.failedTests} failures, ${summary.criticalRegressions} critical regressions)`;
      case 'error':
        return 'Performance tests encountered an error';
      default:
        return 'Performance tests status unknown';
    }
  }

  /**
   * Create CI artifacts
   */
  private async createCIArtifacts(result: AutomatedTestResult): Promise<void> {
    // This would create artifacts in the specific CI platform
    console.log('Creating CI artifacts...');
  }

  /**
   * Send CI notifications
   */
  private async sendCINotifications(result: AutomatedTestResult): Promise<void> {
    // This would send notifications through the CI platform or external services
    console.log('Sending CI notifications...');
  }

  /**
   * Upload artifacts to storage
   */
  private async uploadArtifactsToStorage(artifacts: AutomatedTestResult['artifacts']): Promise<void> {
    // This would upload artifacts to external storage
    console.log('Uploading artifacts to storage...');
  }

  // Report generation methods
  private async generateHTMLReport(result: AutomatedTestResult, outputDir: string): Promise<string> {
    const html = this.generateHTMLContent(result);
    const filePath = require('path').join(outputDir, `performance-report-${result.execution.id}.html`);

    await require('fs').promises.writeFile(filePath, html, 'utf8');
    return filePath;
  }

  private async generateJSONReport(result: AutomatedTestResult, outputDir: string): Promise<string> {
    const json = JSON.stringify(result, null, 2);
    const filePath = require('path').join(outputDir, `performance-results-${result.execution.id}.json`);

    await require('fs').promises.writeFile(filePath, json, 'utf8');
    return filePath;
  }

  private async generateJUnitReport(result: AutomatedTestResult, outputDir: string): Promise<string> {
    const xml = this.generateJUnitContent(result);
    const filePath = require('path').join(outputDir, `performance-junit-${result.execution.id}.xml`);

    await require('fs').promises.writeFile(filePath, xml, 'utf8');
    return filePath;
  }

  private async generatePRComment(result: AutomatedTestResult, outputDir: string): Promise<string> {
    const comment = this.generatePRCommentContent(result);
    const filePath = require('path').join(outputDir, `pr-comment-${result.execution.id}.md`);

    await require('fs').promises.writeFile(filePath, comment, 'utf8');
    return filePath;
  }

  private generateHTMLContent(result: AutomatedTestResult): string {
    const { summary, status, results } = result;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report - ${result.execution.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .status-${status.overall} { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .status-success { background: #d4edda; color: #155724; }
        .status-warning { background: #fff3cd; color: #856404; }
        .status-failure { background: #f8d7da; color: #721c24; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; }
        .metric-label { color: #666; }
        .section { margin: 30px 0; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; }
        .critical { color: #dc3545; font-weight: bold; }
        .high { color: #fd7e14; font-weight: bold; }
        .medium { color: #ffc107; font-weight: bold; }
        .low { color: #28a745; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Performance Test Report</h1>
        <p><strong>Execution ID:</strong> ${result.execution.id}</p>
        <p><strong>Environment:</strong> ${result.execution.environment}</p>
        <p><strong>Start Time:</strong> ${result.execution.startTime.toISOString()}</p>
        <p><strong>Duration:</strong> ${Math.round(result.execution.duration / 1000)}s</p>
    </div>

    <div class="status-${status.overall}">
        <h2>🎯 Status: ${status.overall.toUpperCase()}</h2>
        <p><strong>Action:</strong> ${status.action}</p>
        <p><strong>Gates:</strong> ${status.gates}</p>
    </div>

    <div class="section">
        <h2>📊 Summary</h2>
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #28a745;">${summary.passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #dc3545;">${summary.failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #ffc107;">${summary.warningTests}</div>
                <div class="metric-label">Warnings</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.performanceScore}</div>
                <div class="metric-label">Score/100</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📉 Regressions</h2>
        <p><strong>Critical:</strong> ${summary.criticalRegressions}</p>
        <p><strong>Warnings:</strong> ${summary.warningRegressions}</p>
        <p><strong>Improvements:</strong> ${summary.improvements}</p>
    </div>

    <div class="section">
        <h2>🧪 Test Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Scenario</th>
                    <th>Environment</th>
                    <th>Status</th>
                    <th>Duration (ms)</th>
                    <th>Load Time (ms)</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${results.testResults.map(test => `
                    <tr>
                        <td>${test.scenario}</td>
                        <td>${test.environment}</td>
                        <td class="status-${test.status}">${test.status}</td>
                        <td>${test.duration}</td>
                        <td>${test.metrics.loadTime}</td>
                        <td>${test.score.overall}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    ${result.recommendations.length > 0 ? `
    <div class="section">
        <h2>💡 Recommendations</h2>
        <div class="recommendations">
            ${result.recommendations.map(rec => `
                <div class="${rec.priority}">
                    <strong>${rec.category.toUpperCase()} - ${rec.priority.toUpperCase()}:</strong>
                    <p>${rec.description}</p>
                    <p><strong>Action:</strong> ${rec.action}</p>
                    <p><strong>Impact:</strong> ${rec.impact}</p>
                </div>
                <hr>
            `).join('')}
        </div>
    </div>
    ` : ''}
</body>
</html>
`;
  }

  private generateJUnitContent(result: AutomatedTestResult): string {
    const { results } = result;

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Performance Tests" tests="${results.testResults.length}" failures="${results.testResults.filter(r => r.status === 'failed').length}" time="${result.execution.duration / 1000}">
    ${results.testResults.map(test => `
    <testsuite name="${test.scenario}" tests="1" failures="${test.status === 'failed' ? 1 : 0}" time="${test.duration / 1000}">
        <testcase name="${test.scenario} - ${test.environment}" classname="PerformanceTest" time="${test.duration / 1000}">
            ${test.status === 'failed' ? `<failure message="${test.execution.errors.join('; ')}"></failure>` : ''}
            ${test.status === 'warning' ? `<skipped message="${test.execution.warnings.join('; ')}"></skipped>` : ''}
        </testcase>
    </testsuite>
    `).join('')}
</testsuites>`;
  }

  private generatePRCommentContent(result: AutomatedTestResult): string {
    const { summary, status } = result;

    let comment = `## 🚀 Performance Test Results

**Status:** ${status.overall === 'success' ? '✅ Passed' : status.overall === 'warning' ? '⚠️ Warnings' : '❌ Failed'}
**Performance Score:** ${summary.performanceScore}/100
**Action:** ${status.action}

### 📊 Summary
- **Total Tests:** ${summary.totalTests}
- **Passed:** ${summary.passedTests} ✅
- **Failed:** ${summary.failedTests} ${summary.failedTests > 0 ? '❌' : ''}
- **Warnings:** ${summary.warningTests} ${summary.warningTests > 0 ? '⚠️' : ''}

### 📉 Performance Analysis
- **Critical Regressions:** ${summary.criticalRegressions} ${summary.criticalRegressions > 0 ? '🚨' : '✅'}
- **Warning Regressions:** ${summary.warningRegressions} ${summary.warningRegressions > 0 ? '⚠️' : '✅'}
- **Improvements:** ${summary.improvements} ${summary.improvements > 0 ? '🎉' : ''}`;

    if (result.recommendations.length > 0) {
      comment += `

### 💡 Recommendations

${result.recommendations.map(rec =>
  `- **${rec.priority.toUpperCase()}** ${rec.category}: ${rec.description}`
).join('\n')}`;
    }

    comment += `

[📊 View Full Report](${result.artifacts.reports.find(r => r.type === 'html')?.url})`;

    return comment;
  }

  // Helper methods
  private async getLatestBaseline(scenario: string, environment: string): Promise<any> {
    // This would retrieve the latest baseline from storage
    // For now, return null
    return null;
  }

  // Public API methods
  public updateConfig(config: Partial<AutomatedTestConfig>): void {
    this.config = { ...this.config, ...config };

    // Update CI/CD integration config
    const ciConfig: Partial<CIConfig> = {
      platform: this.config.cicd.platform,
      reporting: {
        createPRComments: this.config.reporting.generatePRComment,
        generateReports: this.config.reporting.generateHTMLReport || this.config.reporting.generateJSONReport,
        uploadArtifacts: this.config.reporting.uploadToStorage,
        notifySlack: false, // Would be set from environment
        notifyEmail: false, // Would be set from environment
      },
    };

    this.cicdIntegration.updateConfig(ciConfig);
  }

  public getConfig(): AutomatedTestConfig {
    return { ...this.config };
  }

  public async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Automated Performance Tests...');

    if (this.isInitialized) {
      await this.performanceTester.cleanup?.();
      await this.benchmarking.cleanup?.();
      await this.regressionDetector.cleanup?.();
      this.isInitialized = false;
    }

    console.log('✅ Automated Performance Tests cleaned up');
  }
}

// CLI interface for standalone execution
export async function runAutomatedPerformanceTests(args: {
  environments?: string[];
  scenarios?: string[];
  createBaseline?: boolean;
  dryRun?: boolean;
  config?: string; // Path to config file
}): Promise<void> {
  try {
    // Load config from file if specified
    let config: Partial<AutomatedTestConfig> = {};
    if (args.config) {
      const fs = require('fs').promises;
      const configData = await fs.readFile(args.config, 'utf8');
      config = JSON.parse(configData);
    }

    // Override config with CLI args
    if (args.environments) {
      config.execution = { ...config.execution, environments: args.environments };
    }
    if (args.scenarios) {
      config.execution = { ...config.execution, scenarios: args.scenarios };
    }
    if (args.createBaseline) {
      config.baselines = { ...config.baselines, createIfMissing: true };
    }
    if (args.dryRun) {
      config.execution = { ...config.execution, parallel: false };
    }

    // Initialize and run tests
    const automatedTests = AutomatedPerformanceTests.getInstance(config);
    await automatedTests.initialize();

    const result = await automatedTests.execute({
      environments: args.environments,
      scenarios: args.scenarios,
      createBaseline: args.createBaseline,
      dryRun: args.dryRun,
    });

    // Output results
    console.log('\n📋 Test Execution Summary:');
    console.log(`Status: ${result.status.overall}`);
    console.log(`Action: ${result.status.action}`);
    console.log(`Performance Score: ${result.summary.performanceScore}/100`);
    console.log(`Tests: ${result.summary.passedTests}/${result.summary.totalTests} passed`);

    if (result.summary.criticalRegressions > 0) {
      console.log(`❌ Critical regressions: ${result.summary.criticalRegressions}`);
      process.exit(1);
    } else if (result.status.overall === 'warning') {
      console.log(`⚠️ Warning regressions: ${result.summary.warningRegressions}`);
      process.exit(2);
    } else {
      console.log('✅ All performance tests passed');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Automated performance tests failed:', error);
    process.exit(3);
  }
}

// Export for use in other modules
export default AutomatedPerformanceTests;

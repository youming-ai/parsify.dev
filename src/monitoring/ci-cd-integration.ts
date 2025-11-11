/**
 * CI/CD Integration and Automation Scripts
 * Comprehensive integration with GitHub Actions, GitLab CI, Jenkins, and other CI/CD systems
 * Features automated performance testing, regression detection, and deployment gating
 */

import { PerformanceRegressionTester, PerformanceTestResult } from './performance-regression-testing';
import { PerformanceBenchmarking, BenchmarkResult } from './performance-benchmarking';
import { PerformanceRegressionDetector, RegressionDetectionResult } from './performance-regression-detector';

export interface CIConfig {
  platform: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'azure-devops' | 'circleci';
  environment: 'development' | 'staging' | 'production';
  execution: {
    parallel: boolean;
    maxConcurrency: number;
    timeout: number; // minutes
    retryAttempts: number;
    retryDelay: number; // minutes
    artifactsRetention: number; // days
  };
  triggers: {
    onPullRequest: boolean;
    onPush: boolean;
    onSchedule: boolean;
    scheduleCron?: string;
    onRelease: boolean;
    onTag: boolean;
    paths?: string[]; // File paths that trigger CI
  };
  performanceGates: {
    enabled: boolean;
    strictMode: boolean;
    regressionThreshold: 'warning' | 'critical';
    improvementThreshold: number; // minimum improvement to pass
    allowManualOverride: boolean;
    requireApprovalForFailure: boolean;
    approvers?: string[];
  };
  reporting: {
    createPRComments: boolean;
    generateReports: boolean;
    uploadArtifacts: boolean;
    notifySlack: boolean;
    notifyEmail: boolean;
    customWebhooks: Array<{
      url: string;
      events: Array<'success' | 'failure' | 'warning'>;
      headers?: Record<string, string>;
    }>;
  };
  caching: {
    enabled: boolean;
    baselinesCache: boolean;
    resultsCache: boolean;
    cacheVersion: string;
  };
  secrets: {
    slackWebhook?: string;
    emailApiKey?: string;
    customWebhooks?: Record<string, string>;
    reportServerUrl?: string;
    authToken?: string;
  };
}

export interface CIExecutionContext {
  runId: string;
  jobId: string;
  platform: CIConfig['platform'];
  environment: CIConfig['environment'];
  branch: string;
  commit: string;
  prNumber?: number;
  isPullRequest: boolean;
  isMainBranch: boolean;
  isRelease: boolean;
  startTime: Date;
  workingDirectory: string;
  artifacts: CIArtifacts;
}

export interface CIArtifacts {
  performanceResults: PerformanceTestResult[];
  benchmarkResults: BenchmarkResult[];
  regressionResults: RegressionDetectionResult[];
  reports: Array<{
    name: string;
    path: string;
    format: 'json' | 'html' | 'markdown' | 'junit';
  }>;
  screenshots: Array<{
    name: string;
    path: string;
  }>;
  traces: Array<{
    name: string;
    path: string;
  }>;
  videos: Array<{
    name: string;
    path: string;
  }>;
}

export interface PRCComment {
  id: string;
  url: string;
  body: string;
  createdAt: Date;
  author: string;
  reactions: {
    '+1': number;
    '-1': number;
    'laugh': number;
    'hooray': number;
    'confused': number;
    'heart': number;
    'rocket': number;
    'eyes': number;
  };
}

export interface StatusCheck {
  context: string;
  state: 'pending' | 'success' | 'failure' | 'error';
  target_url?: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export interface CIResult {
  id: string;
  runId: string;
  platform: CIConfig['platform'];
  status: 'success' | 'failure' | 'warning' | 'pending';
  duration: number; // milliseconds
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
    regressionsDetected: number;
    improvementsDetected: number;
    performanceScore: number; // 0-100
  };
  artifacts: CIArtifacts;
  reports: string[];
  notifications: Array<{
    channel: string;
    status: 'sent' | 'failed' | 'skipped';
    message?: string;
  }>;
  gates: {
    passed: boolean;
    blocked: boolean;
    manualOverride: boolean;
    approvers?: string[];
  };
}

/**
 * Advanced CI/CD Integration System
 */
export class CICDIntegration {
  private static instance: CICDIntegration;
  private config: CIConfig;
  private context: CIExecutionContext | null = null;
  private performanceTester: PerformanceRegressionTester;
  private benchmarking: PerformanceBenchmarking;
  private regressionDetector: PerformanceRegressionDetector;

  // Platform-specific integrations
  private githubIntegration: GitHubIntegration;
  private gitlabIntegration: GitLabIntegration;
  private jenkinsIntegration: JenkinsIntegration;
  private azureDevOpsIntegration: AzureDevOpsIntegration;

  // Notification and reporting systems
  private notificationManager: NotificationManager;
  private reportManager: ReportManager;
  private artifactManager: ArtifactManager;

  // Performance gates and validation
  private performanceGate: PerformanceGate;
  private cachingSystem: CachingSystem;

  private constructor(config?: Partial<CIConfig>) {
    this.config = this.getDefaultConfig(config);
    this.performanceTester = PerformanceRegressionTester.getInstance();
    this.benchmarking = PerformanceBenchmarking.getInstance();
    this.regressionDetector = PerformanceRegressionDetector.getInstance();

    this.githubIntegration = new GitHubIntegration();
    this.gitlabIntegration = new GitLabIntegration();
    this.jenkinsIntegration = new JenkinsIntegration();
    this.azureDevOpsIntegration = new AzureDevOpsIntegration();

    this.notificationManager = new NotificationManager(this.config.reporting, this.config.secrets);
    this.reportManager = new ReportManager(this.config.reporting);
    this.artifactManager = new ArtifactManager(this.config.execution.artifactsRetention);
    this.performanceGate = new PerformanceGate(this.config.performanceGates);
    this.cachingSystem = new CachingSystem(this.config.caching);
  }

  public static getInstance(config?: Partial<CIConfig>): CICDIntegration {
    if (!CICDIntegration.instance) {
      CICDIntegration.instance = new CICDIntegration(config);
    }
    return CICDIntegration.instance;
  }

  private getDefaultConfig(overrides?: Partial<CIConfig>): CIConfig {
    const platform = this.detectCIPlatform();

    return {
      platform,
      environment: this.detectEnvironment(),
      execution: {
        parallel: !process.env.CI || process.env.CI === 'false',
        maxConcurrency: 3,
        timeout: 30, // 30 minutes
        retryAttempts: 2,
        retryDelay: 5, // 5 minutes
        artifactsRetention: 30, // 30 days
      },
      triggers: {
        onPullRequest: true,
        onPush: process.env.CI === 'true',
        onSchedule: false,
        onRelease: true,
        onTag: false,
        paths: ['src/**/*', 'package.json', 'next.config.js', 'tailwind.config.ts'],
      },
      performanceGates: {
        enabled: true,
        strictMode: process.env.NODE_ENV === 'production',
        regressionThreshold: 'warning',
        improvementThreshold: 0,
        allowManualOverride: true,
        requireApprovalForFailure: false,
      },
      reporting: {
        createPRComments: true,
        generateReports: true,
        uploadArtifacts: true,
        notifySlack: !!process.env.SLACK_WEBHOOK_URL,
        notifyEmail: !!process.env.EMAIL_API_KEY,
        customWebhooks: [],
      },
      caching: {
        enabled: true,
        baselinesCache: true,
        resultsCache: true,
        cacheVersion: 'v1',
      },
      secrets: {
        slackWebhook: process.env.SLACK_WEBHOOK_URL,
        emailApiKey: process.env.EMAIL_API_KEY,
        reportServerUrl: process.env.REPORT_SERVER_URL,
        authToken: process.env.PERFORMANCE_AUTH_TOKEN,
      },
      ...overrides,
    };
  }

  private detectCIPlatform(): CIConfig['platform'] {
    if (process.env.GITHUB_ACTIONS) return 'github-actions';
    if (process.env.GITLAB_CI) return 'gitlab-ci';
    if (process.env.JENKINS_URL) return 'jenkins';
    if (process.env.AZURE_PIPELINES) return 'azure-devops';
    if (process.env.CIRCLECI) return 'circleci';

    return 'github-actions'; // Default
  }

  private detectEnvironment(): CIConfig['environment'] {
    const branch = process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_REF_NAME || 'main';

    if (branch === 'main' || branch === 'master') {
      return process.env.NODE_ENV === 'production' ? 'production' : 'staging';
    } else if (branch.includes('release/') || branch.includes('hotfix/')) {
      return 'staging';
    } else {
      return 'development';
    }
  }

  /**
   * Initialize CI/CD integration
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing CI/CD Integration...');

    try {
      // Detect and set up execution context
      this.context = await this.createExecutionContext();

      // Initialize performance testing components
      await this.performanceTester.initialize();
      await this.benchmarking.initialize();
      await this.regressionDetector.initialize();

      // Initialize platform-specific integrations
      await this.initializePlatformIntegration();

      // Initialize notification and reporting systems
      await this.notificationManager.initialize();
      await this.reportManager.initialize();
      await this.artifactManager.initialize();

      // Initialize performance gates
      await this.performanceGate.initialize();

      // Initialize caching system
      await this.cachingSystem.initialize();

      console.log(`✅ CI/CD Integration initialized for ${this.config.platform}`);
    } catch (error) {
      console.error('❌ Failed to initialize CI/CD Integration:', error);
      throw error;
    }
  }

  /**
   * Run the complete CI/CD performance pipeline
   */
  public async runPerformancePipeline(options?: {
    skipBenchmarking?: boolean;
    createBaseline?: boolean;
    customScenarios?: string[];
    dryRun?: boolean;
  }): Promise<CIResult> {
    if (!this.context) {
      throw new Error('CI/CD Integration not initialized');
    }

    const runId = this.context.runId;
    console.log(`🔄 Starting performance pipeline: ${runId}`);

    const startTime = Date.now();
    let result: CIResult;

    try {
      // Update status to pending
      await this.updateStatusCheck('performance-tests', 'pending', 'Running performance tests...');

      // Execute performance testing
      const testResults = await this.executePerformanceTests(options);

      // Execute benchmarking if enabled
      let benchmarkResults: BenchmarkResult[] = [];
      if (!options?.skipBenchmarking) {
        benchmarkResults = await this.executeBenchmarking(options);
      }

      // Perform regression detection
      const regressionResults = await this.performRegressionDetection(testResults);

      // Generate reports and artifacts
      const artifacts = await this.generateArtifacts(testResults, benchmarkResults, regressionResults);

      // Calculate summary
      const summary = this.calculateSummary(testResults, regressionResults);

      // Evaluate performance gates
      const gateResult = await this.evaluatePerformanceGates(regressionResults, summary);

      // Determine overall status
      const status = this.determineOverallStatus(gateResult, summary);

      // Send notifications
      const notifications = await this.sendNotifications(status, summary, regressionResults);

      // Create result object
      result = {
        id: `ci-result-${runId}`,
        runId,
        platform: this.config.platform,
        status,
        duration: Date.now() - startTime,
        summary,
        artifacts,
        reports: artifacts.reports.map(r => r.path),
        notifications,
        gates: gateResult,
      };

      // Update final status
      const statusDescription = this.getStatusDescription(status, summary);
      await this.updateStatusCheck('performance-tests', status, statusDescription,
        result.reports.find(r => r.endsWith('.html')));

      console.log(`✅ Performance pipeline completed: ${runId} (${status})`);
      return result;
    } catch (error) {
      console.error(`❌ Performance pipeline failed: ${runId}`, error);

      // Update status to failure
      await this.updateStatusCheck('performance-tests', 'failure', `Performance tests failed: ${error}`);

      const errorResult: CIResult = {
        id: `ci-result-${runId}`,
        runId,
        platform: this.config.platform,
        status: 'failure',
        duration: Date.now() - startTime,
        summary: {
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          warningTests: 0,
          regressionsDetected: 0,
          improvementsDetected: 0,
          performanceScore: 0,
        },
        artifacts: this.getEmptyArtifacts(),
        reports: [],
        notifications: [{
          channel: 'console',
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        }],
        gates: {
          passed: false,
          blocked: true,
          manualOverride: false,
        },
      };

      return errorResult;
    }
  }

  /**
   * Create execution context from environment variables
   */
  private async createExecutionContext(): Promise<CIExecutionContext> {
    const platform = this.config.platform;
    let runId = '';
    let jobId = '';
    let branch = '';
    let commit = '';
    let prNumber: number | undefined;
    let isPullRequest = false;

    switch (platform) {
      case 'github-actions':
        runId = process.env.GITHUB_RUN_ID || Date.now().toString();
        jobId = process.env.GITHUB_JOB || 'performance-tests';
        branch = process.env.GITHUB_REF_NAME || 'main';
        commit = process.env.GITHUB_SHA || '';
        prNumber = this.extractPRNumber(process.env.GITHUB_REF || '');
        isPullRequest = !!process.env.GITHUB_HEAD_REF;
        break;

      case 'gitlab-ci':
        runId = process.env.CI_JOB_ID || Date.now().toString();
        jobId = process.env.CI_JOB_NAME || 'performance-tests';
        branch = process.env.CI_COMMIT_REF_NAME || 'main';
        commit = process.env.CI_COMMIT_SHA || '';
        prNumber = this.extractPRNumber(process.env.CI_MERGE_REQUEST_IID || '');
        isPullRequest = !!process.env.CI_MERGE_REQUEST_IID;
        break;

      case 'jenkins':
        runId = process.env.BUILD_ID || Date.now().toString();
        jobId = process.env.JOB_NAME || 'performance-tests';
        branch = process.env.GIT_BRANCH || 'main';
        commit = process.env.GIT_COMMIT || '';
        isPullRequest = branch.includes('PR-');
        if (isPullRequest) {
          prNumber = parseInt(branch.replace('PR-', ''));
        }
        break;

      default:
        runId = Date.now().toString();
        jobId = 'performance-tests';
        branch = 'main';
        commit = '';
    }

    const isMainBranch = branch === 'main' || branch === 'master';
    const isRelease = branch.includes('release') || branch.includes('hotfix');

    return {
      runId,
      jobId,
      platform,
      environment: this.config.environment,
      branch,
      commit,
      prNumber,
      isPullRequest,
      isMainBranch,
      isRelease,
      startTime: new Date(),
      workingDirectory: process.cwd(),
      artifacts: this.getEmptyArtifacts(),
    };
  }

  /**
   * Initialize platform-specific integration
   */
  private async initializePlatformIntegration(): Promise<void> {
    switch (this.config.platform) {
      case 'github-actions':
        await this.githubIntegration.initialize();
        break;
      case 'gitlab-ci':
        await this.gitlabIntegration.initialize();
        break;
      case 'jenkins':
        await this.jenkinsIntegration.initialize();
        break;
      case 'azure-devops':
        await this.azureDevOpsIntegration.initialize();
        break;
      default:
        console.warn(`Platform ${this.config.platform} not fully supported`);
    }
  }

  /**
   * Execute performance tests
   */
  private async executePerformanceTests(options?: {
    customScenarios?: string[];
    dryRun?: boolean;
  }): Promise<PerformanceTestResult[]> {
    console.log('🧪 Executing performance tests...');

    // Check cache for previous results
    const cacheKey = this.generateCacheKey('performance-tests', this.context!.branch, this.context!.commit);
    const cachedResults = await this.cachingSystem.get<PerformanceTestResult[]>(cacheKey);

    if (cachedResults && !options?.dryRun) {
      console.log('📋 Using cached performance test results');
      return cachedResults;
    }

    // Execute tests
    const testResults = await this.performanceTester.runTestSuite({
      scenarios: options?.customScenarios,
      parallel: this.config.execution.parallel,
      dryRun: options?.dryRun,
    });

    // Cache results
    if (!options?.dryRun) {
      await this.cachingSystem.set(cacheKey, testResults, 24 * 60 * 60 * 1000); // 24 hours
    }

    console.log(`✅ Performance tests completed: ${testResults.length} results`);
    return testResults;
  }

  /**
   * Execute benchmarking
   */
  private async executeBenchmarking(options?: {
    createBaseline?: boolean;
    dryRun?: boolean;
  }): Promise<BenchmarkResult[]> {
    console.log('📊 Executing benchmarking...');

    // Check cache for previous benchmark results
    const cacheKey = this.generateCacheKey('benchmarking', this.context!.branch, this.context!.commit);
    const cachedResults = await this.cachingSystem.get<BenchmarkResult[]>(cacheKey);

    if (cachedResults && !options?.dryRun) {
      console.log('📋 Using cached benchmark results');
      return cachedResults;
    }

    // Execute benchmarking
    const benchmarkResults = await this.benchmarking.runBenchmarkSuite({
      createBaseline: options?.createBaseline,
      parallel: this.config.execution.parallel,
      dryRun: options?.dryRun,
    });

    // Cache results
    if (!options?.dryRun) {
      await this.cachingSystem.set(cacheKey, benchmarkResults, 24 * 60 * 60 * 1000); // 24 hours
    }

    console.log(`✅ Benchmarking completed: ${benchmarkResults.length} results`);
    return benchmarkResults;
  }

  /**
   * Perform regression detection
   */
  private async performRegressionDetection(
    testResults: PerformanceTestResult[]
  ): Promise<RegressionDetectionResult[]> {
    console.log('🔍 Performing regression detection...');

    const regressionResults: RegressionDetectionResult[] = [];

    // Get historical data for ML training
    const historicalData = await this.getHistoricalData();

    for (const result of testResults) {
      // Get latest baseline for comparison
      const baseline = await this.getLatestBaseline(result.scenario, result.environment);

      if (baseline) {
        const detectionResult = await this.regressionDetector.detectRegressions(
          result,
          baseline,
          historicalData
        );

        regressionResults.push(detectionResult);
      } else {
        console.warn(`No baseline found for ${result.scenario} in ${result.environment}`);
      }
    }

    console.log(`✅ Regression detection completed: ${regressionResults.length} results`);
    return regressionResults;
  }

  /**
   * Generate artifacts and reports
   */
  private async generateArtifacts(
    testResults: PerformanceTestResult[],
    benchmarkResults: BenchmarkResult[],
    regressionResults: RegressionDetectionResult[]
  ): Promise<CIArtifacts> {
    console.log('📋 Generating artifacts and reports...');

    const artifacts: CIArtifacts = {
      performanceResults: testResults,
      benchmarkResults,
      regressionResults,
      reports: [],
      screenshots: [],
      traces: [],
      videos: [],
    };

    // Generate reports
    const reports = await this.reportManager.generateReports({
      testResults,
      benchmarkResults,
      regressionResults,
      context: this.context!,
      config: this.config,
    });

    artifacts.reports = reports;

    // Upload artifacts if enabled
    if (this.config.reporting.uploadArtifacts) {
      await this.artifactManager.uploadArtifacts(artifacts, this.context!);
    }

    console.log(`✅ Artifacts generated: ${reports.length} reports`);
    return artifacts;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    testResults: PerformanceTestResult[],
    regressionResults: RegressionDetectionResult[]
  ): CIResult['summary'] {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'passed').length;
    const failedTests = testResults.filter(r => r.status === 'failed').length;
    const warningTests = testResults.filter(r => r.status === 'warning').length;

    const regressionsDetected = regressionResults.filter(r =>
      r.regressions.some(reg => reg.severity === 'critical' ||
      (this.config.performanceGates.strictMode && reg.severity === 'warning'))
    ).length;

    const improvementsDetected = regressionResults.reduce((count, r) =>
      count + r.improvements.length, 0
    );

    // Calculate performance score
    const scoreResults = testResults.map(r => r.score.overall);
    const performanceScore = scoreResults.length > 0
      ? Math.round(scoreResults.reduce((sum, score) => sum + score, 0) / scoreResults.length)
      : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      warningTests,
      regressionsDetected,
      improvementsDetected,
      performanceScore,
    };
  }

  /**
   * Evaluate performance gates
   */
  private async evaluatePerformanceGates(
    regressionResults: RegressionDetectionResult[],
    summary: CIResult['summary']
  ): Promise<CIResult['gates']> {
    if (!this.config.performanceGates.enabled) {
      return {
        passed: true,
        blocked: false,
        manualOverride: false,
      };
    }

    return await this.performanceGate.evaluate(regressionResults, summary, this.context!);
  }

  /**
   * Determine overall CI status
   */
  private determineOverallStatus(
    gateResult: CIResult['gates'],
    summary: CIResult['summary']
  ): CIResult['status'] {
    if (gateResult.blocked && !gateResult.manualOverride) {
      return 'failure';
    } else if (gateResult.blocked && gateResult.manualOverride) {
      return 'warning';
    } else if (summary.regressionsDetected > 0) {
      return 'warning';
    } else {
      return 'success';
    }
  }

  /**
   * Send notifications
   */
  private async sendNotifications(
    status: CIResult['status'],
    summary: CIResult['summary'],
    regressionResults: RegressionDetectionResult[]
  ): Promise<CIResult['notifications']> {
    console.log('📢 Sending notifications...');

    const notifications = await this.notificationManager.sendNotifications({
      status,
      summary,
      regressionResults,
      context: this.context!,
      config: this.config,
    });

    console.log(`✅ Notifications sent: ${notifications.length}`);
    return notifications;
  }

  /**
   * Update status check (GitHub Actions) or equivalent
   */
  private async updateStatusCheck(
    context: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    description: string,
    targetUrl?: string
  ): Promise<void> {
    switch (this.config.platform) {
      case 'github-actions':
        await this.githubIntegration.updateStatusCheck(context, state, description, targetUrl);
        break;
      case 'gitlab-ci':
        await this.gitlabIntegration.updateStatusCheck(context, state, description, targetUrl);
        break;
      case 'jenkins':
        // Jenkins doesn't have equivalent status checks
        break;
      case 'azure-devops':
        await this.azureDevOpsIntegration.updateStatusCheck(context, state, description, targetUrl);
        break;
    }
  }

  /**
   * Generate status description
   */
  private getStatusDescription(status: CIResult['status'], summary: CIResult['summary']): string {
    switch (status) {
      case 'success':
        return `Performance tests passed (${summary.passedTests}/${summary.totalTests}) - Score: ${summary.performanceScore}/100`;
      case 'warning':
        return `Performance tests completed with warnings (${summary.warningTests} warnings, ${summary.regressionsDetected} regressions)`;
      case 'failure':
        return `Performance tests failed (${summary.failedTests} failures, ${summary.regressionsDetected} regressions)`;
      case 'pending':
        return 'Performance tests in progress...';
      default:
        return 'Performance tests status unknown';
    }
  }

  // Helper methods
  private extractPRNumber(ref: string): number | undefined {
    const match = ref.match(/(?:pull|merge)\/(\d+)/i);
    return match ? parseInt(match[1]) : undefined;
  }

  private generateCacheKey(type: string, branch: string, commit: string): string {
    return `${type}:${branch}:${commit}:${this.config.caching.cacheVersion}`;
  }

  private getEmptyArtifacts(): CIArtifacts {
    return {
      performanceResults: [],
      benchmarkResults: [],
      regressionResults: [],
      reports: [],
      screenshots: [],
      traces: [],
      videos: [],
    };
  }

  private async getHistoricalData(): Promise<PerformanceTestResult[]> {
    // Get historical data from cache or storage
    const cacheKey = `historical-data:${this.context!.environment}`;
    return await this.cachingSystem.get<PerformanceTestResult[]>(cacheKey) || [];
  }

  private async getLatestBaseline(scenario: string, environment: string): Promise<any> {
    // Get latest baseline from cache or storage
    const cacheKey = `baseline:${scenario}:${environment}`;
    return await this.cachingSystem.get<any>(cacheKey);
  }

  // Public API methods
  public updateConfig(config: Partial<CIConfig>): void {
    this.config = { ...this.config, ...config };

    // Update component configurations
    this.notificationManager.updateConfig(this.config.reporting, this.config.secrets);
    this.performanceGate.updateConfig(this.config.performanceGates);
    this.cachingSystem.updateConfig(this.config.caching);
  }

  public getConfig(): CIConfig {
    return { ...this.config };
  }

  public getContext(): CIExecutionContext | null {
    return this.context;
  }

  public async generateCIConfigurationFiles(outputDir: string): Promise<void> {
    console.log('📝 Generating CI configuration files...');

    switch (this.config.platform) {
      case 'github-actions':
        await this.generateGitHubActionsWorkflow(outputDir);
        break;
      case 'gitlab-ci':
        await this.generateGitLabCIConfig(outputDir);
        break;
      case 'jenkins':
        await this.generateJenkinsfile(outputDir);
        break;
      case 'azure-devops':
        await this.generateAzurePipelines(outputDir);
        break;
    }

    console.log('✅ CI configuration files generated');
  }

  private async generateGitHubActionsWorkflow(outputDir: string): Promise<void> {
    const workflow = `
name: Performance Tests

on:
  pull_request:
    branches: [ main, develop ]
    paths: ${JSON.stringify(this.config.triggers.paths || [])}
  push:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  release:
    types: [ published ]

jobs:
  performance-tests:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x]

    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Run performance tests
      run: npm run test:performance
      env:
        CI: true
        NODE_ENV: test
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}

    - name: Upload performance reports
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: performance-reports
        path: |
          test-results/
          performance-reports/
        retention-days: ${this.config.execution.artifactsRetention}

    - name: Comment PR with results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          // Read and post performance results as PR comment
          const fs = require('fs');
          if (fs.existsSync('performance-reports/pr-comment.md')) {
            const comment = fs.readFileSync('performance-reports/pr-comment.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
          }
`;

    const filePath = `${outputDir}/.github/workflows/performance-tests.yml`;
    await this.writeConfigFile(filePath, workflow);
  }

  private async generateGitLabCIConfig(outputDir: string): Promise<void> {
    const config = `
stages:
  - test
  - report

variables:
  NODE_VERSION: "20"

performance-tests:
  stage: test
  image: node:\${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  artifacts:
    reports:
      junit: test-results/junit.xml
    paths:
      - performance-reports/
    expire_in: ${this.config.execution.artifactsRetention} days
  script:
    - npm ci
    - npm run build
    - npm run test:performance
  only:
    - merge_requests
    - main
    - schedules
    - tags
  except:
    - /^hotfix\\/.*$/
  coverage: '/Coverage: \\d+\\.\\d+%/'
  tags:
    - docker

performance-report:
  stage: report
  image: alpine:latest
  dependencies:
    - performance-tests
  script:
    - echo "Performance tests completed"
  only:
    - merge_requests
    - main
  artifacts:
    paths:
      - performance-reports/
    expire_in: ${this.config.execution.artifactsRetention} days
`;

    const filePath = `${outputDir}/.gitlab-ci.yml`;
    await this.writeConfigFile(filePath, config);
  }

  private async generateJenkinsfile(outputDir: string): Promise<void> {
    const jenkinsfile = `
pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        CI = 'true'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: ${this.config.execution.timeout}, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git fetch --prune --unshallow'
            }
        }

        stage('Setup') {
            steps {
                nodejs(nodeJSInstallationName: 'Node \${NODE_VERSION}') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build') {
            steps {
                nodejs(nodeJSInstallationName: 'Node \${NODE_VERSION}') {
                    sh 'npm run build'
                }
            }
        }

        stage('Performance Tests') {
            steps {
                nodejs(nodeJSInstallationName: 'Node \${NODE_VERSION}') {
                    sh 'npm run test:performance'
                }
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results/*.xml'
                    archiveArtifacts artifacts: 'performance-reports/**/*', fingerprint: true
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            slackSend(
                channel: '#performance',
                color: 'good',
                message: "Performance tests passed for \${env.JOB_NAME} - \${env.BUILD_NUMBER}"
            )
        }
        failure {
            slackSend(
                channel: '#performance',
                color: 'danger',
                message: "Performance tests failed for \${env.JOB_NAME} - \${env.BUILD_NUMBER}"
            )
        }
    }
}
`;

    const filePath = `${outputDir}/Jenkinsfile`;
    await this.writeConfigFile(filePath, jenkinsfile);
  }

  private async generateAzurePipelines(outputDir: string): Promise<void> {
    const pipeline = `
trigger:
  branches:
    include:
    - main
    - develop
  paths:
    include:
    - src/*
    - package.json

pr:
  branches:
    include:
    - main
    - develop

schedules:
- cron: "0 2 * * *"
  displayName: Daily performance tests
  branches:
    include:
    - main
  always: true

variables:
  nodeVersion: '20.x'

pool:
  vmImage: 'ubuntu-latest'

stages:
- stage: PerformanceTests
  displayName: 'Performance Tests'
  jobs:
  - job: PerformanceTests
    displayName: 'Run Performance Tests'
    timeoutInMinutes: ${this.config.execution.timeout}

    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: \$(nodeVersion)
      displayName: 'Install Node.js'

    - script: |
        npm ci
      displayName: 'Install dependencies'

    - script: |
        npm run build
      displayName: 'Build application'

    - script: |
        npm run test:performance
      displayName: 'Run performance tests'
      env:
        CI: true
        NODE_ENV: test

    - task: PublishTestResults@2
      condition: always()
      inputs:
        testResultsFiles: 'test-results/*.xml'
        testRunTitle: 'Performance Tests'
      displayName: 'Publish test results'

    - task: PublishBuildArtifacts@1
      condition: always()
      inputs:
        pathToPublish: 'performance-reports'
        artifactName: 'performance-reports'
      displayName: 'Publish performance reports'
`;

    const filePath = `${outputDir}/azure-pipelines.yml`;
    await this.writeConfigFile(filePath, pipeline);
  }

  private async writeConfigFile(filePath: string, content: string): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write file
    await fs.writeFile(filePath, content, 'utf8');
  }

  public async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up CI/CD Integration...');

    // Cleanup components
    await this.performanceTester.cleanup?.();
    await this.benchmarking.cleanup?.();
    await this.regressionDetector.cleanup?.();
    await this.cachingSystem.cleanup();

    this.context = null;

    console.log('✅ CI/CD Integration cleaned up');
  }
}

// Platform integration classes
class GitHubIntegration {
  private token: string;

  async initialize(): Promise<void> {
    this.token = process.env.GITHUB_TOKEN || '';
  }

  async updateStatusCheck(
    context: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    description: string,
    targetUrl?: string
  ): Promise<void> {
    if (!this.token) {
      console.warn('GitHub token not available, skipping status check');
      return;
    }

    try {
      // Implementation would use GitHub API
      console.log(`GitHub status check: ${context} - ${state} - ${description}`);
    } catch (error) {
      console.error('Failed to update GitHub status check:', error);
    }
  }
}

class GitLabIntegration {
  async initialize(): Promise<void> {
    // Initialize GitLab integration
  }

  async updateStatusCheck(
    context: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    description: string,
    targetUrl?: string
  ): Promise<void> {
    console.log(`GitLab status check: ${context} - ${state} - ${description}`);
  }
}

class JenkinsIntegration {
  async initialize(): Promise<void> {
    // Initialize Jenkins integration
  }
}

class AzureDevOpsIntegration {
  async initialize(): Promise<void> {
    // Initialize Azure DevOps integration
  }

  async updateStatusCheck(
    context: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    description: string,
    targetUrl?: string
  ): Promise<void> {
    console.log(`Azure DevOps status check: ${context} - ${state} - ${description}`);
  }
}

// Supporting classes
class NotificationManager {
  constructor(
    private reportingConfig: CIConfig['reporting'],
    private secrets: CIConfig['secrets']
  ) {}

  async initialize(): Promise<void> {
    console.log('📢 Initializing Notification Manager...');
  }

  async sendNotifications(params: {
    status: CIResult['status'];
    summary: CIResult['summary'];
    regressionResults: RegressionDetectionResult[];
    context: CIExecutionContext;
    config: CIConfig;
  }): Promise<CIResult['notifications']> {
    const notifications: CIResult['notifications'][] = [];

    // Console notification (always sent)
    notifications.push({
      channel: 'console',
      status: 'sent',
      message: `Performance tests ${params.status}: ${params.summary.passedTests}/${params.summary.totalTests} passed`,
    });

    // Slack notification
    if (this.reportingConfig.notifySlack && this.secrets.slackWebhook) {
      try {
        await this.sendSlackNotification(params);
        notifications.push({
          channel: 'slack',
          status: 'sent',
        });
      } catch (error) {
        notifications.push({
          channel: 'slack',
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Email notification
    if (this.reportingConfig.notifyEmail && this.secrets.emailApiKey) {
      try {
        await this.sendEmailNotification(params);
        notifications.push({
          channel: 'email',
          status: 'sent',
        });
      } catch (error) {
        notifications.push({
          channel: 'email',
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Custom webhooks
    for (const webhook of this.reportingConfig.customWebhooks) {
      try {
        await this.sendWebhookNotification(webhook, params);
        notifications.push({
          channel: `webhook:${webhook.url}`,
          status: 'sent',
        });
      } catch (error) {
        notifications.push({
          channel: `webhook:${webhook.url}`,
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return notifications;
  }

  private async sendSlackNotification(params: any): Promise<void> {
    // Implementation would send Slack notification
    console.log('📱 Sending Slack notification...');
  }

  private async sendEmailNotification(params: any): Promise<void> {
    // Implementation would send email notification
    console.log('📧 Sending email notification...');
  }

  private async sendWebhookNotification(webhook: any, params: any): Promise<void> {
    // Implementation would send webhook notification
    console.log(`🔗 Sending webhook notification to ${webhook.url}...`);
  }

  updateConfig(reportingConfig: CIConfig['reporting'], secrets: CIConfig['secrets']): void {
    this.reportingConfig = reportingConfig;
    this.secrets = secrets;
  }
}

class ReportManager {
  constructor(private config: CIConfig['reporting']) {}

  async initialize(): Promise<void> {
    console.log('📊 Initializing Report Manager...');
  }

  async generateReports(params: {
    testResults: PerformanceTestResult[];
    benchmarkResults: BenchmarkResult[];
    regressionResults: RegressionDetectionResult[];
    context: CIExecutionContext;
    config: CIConfig;
  }): Promise<CIArtifacts['reports']> {
    const reports: CIArtifacts['reports'] = [];

    // JSON report
    const jsonReportPath = await this.generateJSONReport(params);
    reports.push({
      name: 'performance-results.json',
      path: jsonReportPath,
      format: 'json',
    });

    // HTML report
    const htmlReportPath = await this.generateHTMLReport(params);
    reports.push({
      name: 'performance-report.html',
      path: htmlReportPath,
      format: 'html',
    });

    // Markdown report
    const mdReportPath = await this.generateMarkdownReport(params);
    reports.push({
      name: 'performance-summary.md',
      path: mdReportPath,
      format: 'markdown',
    });

    // JUnit report
    const junitReportPath = await this.generateJUnitReport(params);
    reports.push({
      name: 'junit-results.xml',
      path: junitReportPath,
      format: 'junit',
    });

    // PR comment
    if (params.context.isPullRequest && this.config.createPRComments) {
      await this.generatePRComment(params);
    }

    return reports;
  }

  private async generateJSONReport(params: any): Promise<string> {
    const report = {
      metadata: {
        runId: params.context.runId,
        platform: params.context.platform,
        branch: params.context.branch,
        commit: params.context.commit,
        timestamp: new Date().toISOString(),
      },
      summary: this.calculateSummary(params.testResults, params.regressionResults),
      testResults: params.testResults,
      benchmarkResults: params.benchmarkResults,
      regressionResults: params.regressionResults,
    };

    const filePath = 'performance-reports/results.json';
    await this.writeReportFile(filePath, JSON.stringify(report, null, 2));
    return filePath;
  }

  private async generateHTMLReport(params: any): Promise<string> {
    // Generate HTML report
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; }
        .metric-label { color: #666; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Test Report</h1>
        <p><strong>Run ID:</strong> ${params.context.runId}</p>
        <p><strong>Branch:</strong> ${params.context.branch}</p>
        <p><strong>Commit:</strong> ${params.context.commit}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-value passed">${params.testResults.filter(r => r.status === 'passed').length}</div>
            <div class="metric-label">Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value failed">${params.testResults.filter(r => r.status === 'failed').length}</div>
            <div class="metric-label">Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value warning">${params.testResults.filter(r => r.status === 'warning').length}</div>
            <div class="metric-label">Warnings</div>
        </div>
        <div class="metric">
            <div class="metric-value">${this.calculateSummary(params.testResults, params.regressionResults).performanceScore}</div>
            <div class="metric-label">Performance Score</div>
        </div>
    </div>

    <h2>Test Results</h2>
    <table border="1" style="width: 100%; border-collapse: collapse;">
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
            ${params.testResults.map(result => `
                <tr>
                    <td>${result.scenario}</td>
                    <td>${result.environment}</td>
                    <td class="${result.status}">${result.status}</td>
                    <td>${result.duration}</td>
                    <td>${result.metrics.loadTime}</td>
                    <td>${result.score.overall}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    ${params.regressionResults.length > 0 ? `
    <h2>Regression Analysis</h2>
    ${params.regressionResults.map(result => `
        <h3>${result.scenario}</h3>
        ${result.regressions.length > 0 ? `
            <ul>
                ${result.regressions.map(reg => `
                    <li class="${reg.severity}">
                        <strong>${reg.metric}:</strong> ${reg.regression.toFixed(1)}% regression
                        (${reg.baselineValue} → ${reg.currentValue})
                    </li>
                `).join('')}
            </ul>
        ` : '<p>No regressions detected</p>'}
    `).join('')}
    ` : ''}
</body>
</html>
`;

    const filePath = 'performance-reports/report.html';
    await this.writeReportFile(filePath, html);
    return filePath;
  }

  private async generateMarkdownReport(params: any): Promise<string> {
    const summary = this.calculateSummary(params.testResults, params.regressionResults);

    const markdown = `# Performance Test Report

## Summary

- **Run ID:** ${params.context.runId}
- **Branch:** ${params.context.branch}
- **Commit:** ${params.context.commit}
- **Timestamp:** ${new Date().toISOString()}

### Test Results
- **Total Tests:** ${summary.totalTests}
- **Passed:** ${summary.passedTests}
- **Failed:** ${summary.failedTests}
- **Warnings:** ${summary.warningTests}
- **Performance Score:** ${summary.performanceScore}/100

### Regression Analysis
- **Regressions Detected:** ${summary.regressionsDetected}
- **Improvements Detected:** ${summary.improvementsDetected}

## Test Results

| Scenario | Environment | Status | Duration (ms) | Load Time (ms) | Score |
|----------|-------------|--------|----------------|----------------|-------|
${params.testResults.map(result =>
  `| ${result.scenario} | ${result.environment} | ${result.status} | ${result.duration} | ${result.metrics.loadTime} | ${result.score.overall} |`
).join('\n')}

${params.regressionResults.length > 0 ? `
## Regression Analysis

${params.regressionResults.map(result => `
### ${result.scenario}

${result.regressions.length > 0 ? `
**Regressions:**
${result.regressions.map(reg =>
  `- **${reg.metric}:** ${reg.regression.toFixed(1)}% regression (${reg.baselineValue} → ${reg.currentValue})`
).join('\n')}
` : '✅ No regressions detected'}

${result.improvements.length > 0 ? `
**Improvements:**
${result.improvements.map(imp =>
  `- **${imp.metric}:** ${imp.improvement.toFixed(1)}% improvement (${imp.baselineValue} → ${imp.currentValue})`
).join('\n')}
` : ''}
`).join('\n')}
` : ''}
`;

    const filePath = 'performance-reports/summary.md';
    await this.writeReportFile(filePath, markdown);
    return filePath;
  }

  private async generateJUnitReport(params: any): Promise<string> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Performance Tests" tests="${params.testResults.length}" failures="${params.testResults.filter(r => r.status === 'failed').length}" time="${params.testResults.reduce((sum: number, r: PerformanceTestResult) => sum + r.duration, 0) / 1000}">
    ${params.testResults.map(result => `
    <testcase name="${result.scenario} - ${result.environment}" classname="PerformanceTest" time="${result.duration / 1000}">
        ${result.status === 'failed' ? `<failure message="${result.execution.errors.join('; ')}"></failure>` : ''}
        ${result.status === 'warning' ? `<skipped message="${result.execution.warnings.join('; ')}"></skipped>` : ''}
    </testcase>
    `).join('')}
</testsuite>`;

    const filePath = 'test-results/junit.xml';
    await this.writeReportFile(filePath, xml);
    return filePath;
  }

  private async generatePRComment(params: any): Promise<void> {
    const summary = this.calculateSummary(params.testResults, params.regressionResults);

    let comment = `## 🚀 Performance Test Results

**Status:** ${summary.failedTests === 0 ? '✅ Passed' : '❌ Failed'}
**Performance Score:** ${summary.performanceScore}/100

### Summary
- **Total Tests:** ${summary.totalTests}
- **Passed:** ${summary.passedTests} ✅
- **Failed:** ${summary.failedTests} ❌
- **Warnings:** ${summary.warningTests} ⚠️

### Regressions
${summary.regressionsDetected === 0 ? '✅ No regressions detected!' : `⚠️ ${summary.regressionsDetected} regression(s) detected`}

### Improvements
${summary.improvementsDetected === 0 ? 'No improvements detected' : `🎉 ${summary.improvementsDetected} improvement(s) detected`}`;

    if (summary.regressionsDetected > 0) {
      comment += `

### 📉 Regression Details
${params.regressionResults
  .filter(result => result.regressions.length > 0)
  .map(result => `
**${result.scenario}:**
${result.regressions.map(reg =>
  `- ${reg.metric}: ${reg.regression.toFixed(1)}% regression (${reg.baselineValue} → ${reg.currentValue})`
).join('\n')}
`).join('\n')}`;
    }

    comment += `

[View detailed report](${this.config.secrets.reportServerUrl}/runs/${params.context.runId})`;

    const filePath = 'performance-reports/pr-comment.md';
    await this.writeReportFile(filePath, comment);
  }

  private calculateSummary(testResults: PerformanceTestResult[], regressionResults: RegressionDetectionResult[]): any {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'passed').length;
    const failedTests = testResults.filter(r => r.status === 'failed').length;
    const warningTests = testResults.filter(r => r.status === 'warning').length;

    const regressionsDetected = regressionResults.filter(r =>
      r.regressions.some(reg => reg.severity === 'critical' || reg.severity === 'warning')
    ).length;

    const improvementsDetected = regressionResults.reduce((count, r) =>
      count + r.improvements.length, 0
    );

    const scoreResults = testResults.map(r => r.score.overall);
    const performanceScore = scoreResults.length > 0
      ? Math.round(scoreResults.reduce((sum, score) => sum + score, 0) / scoreResults.length)
      : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      warningTests,
      regressionsDetected,
      improvementsDetected,
      performanceScore,
    };
  }

  private async writeReportFile(filePath: string, content: string): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write file
    await fs.writeFile(filePath, content, 'utf8');
  }
}

class ArtifactManager {
  constructor(private retentionDays: number) {}

  async initialize(): Promise<void> {
    console.log('📦 Initializing Artifact Manager...');
  }

  async uploadArtifacts(artifacts: CIArtifacts, context: CIExecutionContext): Promise<void> {
    console.log(`📤 Uploading artifacts for ${context.runId}...`);

    // Implementation would upload artifacts to the CI platform
    // This is a placeholder for the actual upload logic
  }
}

class PerformanceGate {
  constructor(private config: CIConfig['performanceGates']) {}

  async initialize(): Promise<void> {
    console.log('🚪 Initializing Performance Gate...');
  }

  async evaluate(
    regressionResults: RegressionDetectionResult[],
    summary: CIResult['summary'],
    context: CIExecutionContext
  ): Promise<CIResult['gates']> {
    if (!this.config.enabled) {
      return {
        passed: true,
        blocked: false,
        manualOverride: false,
      };
    }

    const criticalRegressions = regressionResults.filter(r =>
      r.regressions.some(reg => reg.severity === 'critical')
    ).length;

    const warningRegressions = regressionResults.filter(r =>
      r.regressions.some(reg => reg.severity === 'warning')
    ).length;

    let passed = true;
    let blocked = false;

    if (criticalRegressions > 0) {
      passed = false;
      blocked = true;
    } else if (this.config.strictMode && warningRegressions > 0) {
      passed = false;
      blocked = true;
    } else if (!this.config.strictMode && warningRegressions > 0) {
      passed = true; // Warning doesn't block in non-strict mode
      blocked = false;
    }

    return {
      passed,
      blocked,
      manualOverride: blocked && this.config.allowManualOverride,
      approvers: blocked && this.config.requireApprovalForFailure ? this.config.approvers : undefined,
    };
  }

  updateConfig(config: CIConfig['performanceGates']): void {
    this.config = { ...this.config, ...config };
  }
}

class CachingSystem {
  private cache = new Map<string, { data: any; expiry: number }>();

  constructor(private config: CIConfig['caching']) {}

  async initialize(): Promise<void> {
    console.log('💾 Initializing Caching System...');
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.config.enabled) {
      return undefined;
    }

    const item = this.cache.get(key);
    if (!item) {
      return undefined;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.data;
  }

  async set(key: string, data: any, ttlMs: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  updateConfig(config: CIConfig['caching']): void {
    this.config = { ...this.config, ...config };
  }

  async cleanup(): Promise<void> {
    await this.clear();
  }
}

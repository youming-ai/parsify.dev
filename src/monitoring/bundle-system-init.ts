/**
 * Bundle System Initialization
 * Integrates bundle optimization with build process and monitoring systems
 */

import { BundleAnalyzer } from './bundle-analyzer';
import { BundleOptimizationEngine, type OptimizationConfig } from './bundle-optimization-engine';
import { SizeBudgetManager } from './size-budget-manager';
import { TreeShakingAnalyzer } from './tree-shaking-analyzer';
import { AssetOptimizer, type CompressionConfig } from './asset-optimizer';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface BundleSystemConfig {
  enabled: boolean;
  analysis: {
    enabled: boolean;
    onBuild: boolean;
    schedule: string; // cron pattern
    historyDays: number;
  };
  optimization: {
    enabled: boolean;
    autoApply: boolean;
    dryRun: boolean;
    config: OptimizationConfig;
  };
  budget: {
    enabled: boolean;
    enforce: boolean;
    failOnExceed: boolean;
    alertOnExceed: boolean;
  };
  treeShaking: {
    enabled: boolean;
    autoFix: boolean;
    analyzeOnBuild: boolean;
  };
  assetOptimization: {
    enabled: boolean;
    optimizeOnBuild: boolean;
    config: CompressionConfig;
  };
  monitoring: {
    enabled: boolean;
    realTime: boolean;
    alerting: boolean;
    webhooks: string[];
  };
  reporting: {
    enabled: boolean;
    generateOnBuild: boolean;
    outputPath: string;
    formats: ('json' | 'markdown' | 'html')[];
  };
}

interface BundleMetrics {
  timestamp: Date;
  buildNumber: string;
  bundleSize: number;
  gzippedSize: number;
  optimizationSavings: number;
  budgetStatus: 'pass' | 'warning' | 'fail';
  performanceScore: number;
  recommendations: number;
}

interface BuildIntegration {
  preBuild: () => Promise<void>;
  postBuild: () => Promise<void>;
  onOptimization: (metrics: BundleMetrics) => Promise<void>;
  onError: (error: Error) => Promise<void>;
}

class BundleSystemInitializer {
  private config: BundleSystemConfig;
  private analyzer: BundleAnalyzer;
  private optimizer: BundleOptimizationEngine;
  private budgetManager: SizeBudgetManager;
  private treeShakingAnalyzer: TreeShakingAnalyzer;
  private assetOptimizer: AssetOptimizer;
  private projectRoot: string;
  private buildIntegration: BuildIntegration;
  private metrics: BundleMetrics[] = [];

  constructor(projectRoot: string = process.cwd(), config?: Partial<BundleSystemConfig>) {
    this.projectRoot = projectRoot;

    this.config = {
      enabled: true,
      analysis: {
        enabled: true,
        onBuild: true,
        schedule: '0 2 * * *', // Daily at 2 AM
        historyDays: 30,
      },
      optimization: {
        enabled: true,
        autoApply: false,
        dryRun: true,
        config: {
          enabled: true,
          dryRun: true,
          autoApply: false,
          compressionEnabled: true,
          treeShakingEnabled: true,
          codeSplittingEnabled: true,
          minificationEnabled: true,
          assetOptimizationEnabled: true,
          performanceBudget: {
            enabled: true,
            failOnExceed: false,
            warnOnExceed: true,
          },
        },
      },
      budget: {
        enabled: true,
        enforce: true,
        failOnExceed: false,
        alertOnExceed: true,
      },
      treeShaking: {
        enabled: true,
        autoFix: false,
        analyzeOnBuild: true,
      },
      assetOptimization: {
        enabled: true,
        optimizeOnBuild: false, // Disabled by default to avoid slowing builds
        config: {
          images: {
            jpeg: { quality: 85, progressive: true },
            png: { compressionLevel: 9, lossless: false },
            webp: { quality: 80 },
            avif: { quality: 75 },
            svg: { removeMetadata: true, removeComments: true },
          },
          fonts: {
            woff2: true,
            subset: true,
            preload: false,
          },
          compression: {
            gzip: { level: 9 },
            brotli: { level: 11 },
          },
        },
      },
      monitoring: {
        enabled: true,
        realTime: false,
        alerting: true,
        webhooks: [],
      },
      reporting: {
        enabled: true,
        generateOnBuild: true,
        outputPath: '.bundle-reports',
        formats: ['json', 'markdown'],
      },
      ...config,
    };

    this.initializeComponents();
    this.setupBuildIntegration();
  }

  private initializeComponents(): void {
    this.analyzer = new BundleAnalyzer(
      join(this.projectRoot, '.next'),
      join(this.projectRoot, '.bundle-analysis')
    );

    this.optimizer = new BundleOptimizationEngine(
      this.projectRoot,
      this.config.optimization.config
    );

    this.budgetManager = new SizeBudgetManager(join(this.projectRoot, '.budget-tracking'));

    this.treeShakingAnalyzer = new TreeShakingAnalyzer(this.projectRoot);

    this.assetOptimizer = new AssetOptimizer(
      this.projectRoot,
      this.config.assetOptimization.config
    );

    // Ensure output directories exist
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const directories = [
      this.config.reporting.outputPath,
      '.bundle-analysis',
      '.budget-tracking',
      '.optimized-assets',
    ];

    directories.forEach(dir => {
      const fullPath = join(this.projectRoot, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  private setupBuildIntegration(): void {
    this.buildIntegration = {
      preBuild: this.preBuildHook.bind(this),
      postBuild: this.postBuildHook.bind(this),
      onOptimization: this.onOptimizationHook.bind(this),
      onError: this.onErrorHook.bind(this),
    };
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Bundle Optimization System...');

    try {
      // Load existing configuration
      await this.loadConfiguration();

      // Initialize monitoring if enabled
      if (this.config.monitoring.enabled) {
        await this.initializeMonitoring();
      }

      // Setup scheduled tasks if needed
      if (this.config.analysis.onBuild || this.config.analysis.schedule) {
        await this.setupScheduledTasks();
      }

      console.log('✅ Bundle Optimization System initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Bundle Optimization System:', error);
      throw error;
    }
  }

  private async loadConfiguration(): Promise<void> {
    const configPath = join(this.projectRoot, '.bundle-config.json');

    if (existsSync(configPath)) {
      const existingConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
      this.config = { ...this.config, ...existingConfig };
    } else {
      // Save default configuration
      await this.saveConfiguration();
    }
  }

  private async saveConfiguration(): Promise<void> {
    const configPath = join(this.projectRoot, '.bundle-config.json');
    writeFileSync(configPath, JSON.stringify(this.config, null, 2));
  }

  private async initializeMonitoring(): Promise<void> {
    // This would setup real-time monitoring, webhooks, etc.
    console.log('📊 Setting up bundle monitoring...');

    if (this.config.monitoring.realTime) {
      // Setup real-time monitoring
    }

    if (this.config.monitoring.alerting) {
      // Setup alerting system
      await this.setupAlerting();
    }
  }

  private async setupAlerting(): Promise<void> {
    console.log('🚨 Setting up bundle alerting...');
    // Implementation would setup webhook notifications, email alerts, etc.
  }

  private async setupScheduledTasks(): Promise<void> {
    console.log('⏰ Setting up scheduled bundle analysis...');
    // Implementation would setup cron jobs or scheduled tasks
  }

  // Build integration hooks
  private async preBuildHook(): Promise<void> {
    if (!this.config.enabled) return;

    console.log('🏗️ Pre-build bundle analysis...');

    try {
      // Run analysis before build to establish baseline
      if (this.config.analysis.enabled) {
        const baseline = await this.analyzer.analyzeBundle();
        console.log(`📊 Baseline bundle size: ${this.formatSize(baseline.totalSize)}`);
      }

      // Check performance budget
      if (this.config.budget.enabled) {
        await this.budgetManager.updateCurrentSizes();
        const budgetStatus = this.budgetManager.enforceBudget(this.config.budget.failOnExceed);

        if (!budgetStatus.passed && this.config.budget.failOnExceed) {
          throw new Error(`Budget validation failed: ${budgetStatus.message}`);
        }
      }

    } catch (error) {
      await this.buildIntegration.onError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async postBuildHook(): Promise<void> {
    if (!this.config.enabled) return;

    console.log('🎯 Post-build bundle optimization...');

    try {
      let bundleMetrics: BundleMetrics;

      // Analyze built bundle
      if (this.config.analysis.enabled) {
        const analysis = await this.analyzer.analyzeBundle();

        bundleMetrics = {
          timestamp: new Date(),
          buildNumber: this.getBuildNumber(),
          bundleSize: analysis.totalSize,
          gzippedSize: analysis.totalGzippedSize,
          optimizationSavings: 0,
          budgetStatus: analysis.performanceBudget.status,
          performanceScore: this.calculatePerformanceScore(analysis),
          recommendations: analysis.recommendations.length,
        };

        this.metrics.push(bundleMetrics);
      } else {
        bundleMetrics = {
          timestamp: new Date(),
          buildNumber: this.getBuildNumber(),
          bundleSize: 0,
          gzippedSize: 0,
          optimizationSavings: 0,
          budgetStatus: 'pass',
          performanceScore: 0,
          recommendations: 0,
        };
      }

      // Run optimizations if enabled
      if (this.config.optimization.enabled) {
        const result = await this.optimizer.runOptimizationPipeline();
        bundleMetrics.optimizationSavings = result.sizeBefore - result.sizeAfter;

        if (result.optimizationsApplied.length > 0) {
          console.log(`✨ Applied ${result.optimizationsApplied.length} optimizations`);
        }
      }

      // Analyze tree shaking opportunities
      if (this.config.treeShaking.enabled && this.config.treeShaking.analyzeOnBuild) {
        const treeShakingReport = await this.treeShakingAnalyzer.analyzeCodebase();
        console.log(`🌳 Found ${treeShakingReport.filesWithDeadCode.length} files with dead code`);

        if (this.config.treeShaking.autoFix) {
          await this.treeShakingAnalyzer.applyTreeShakingOptimizations(this.config.optimization.config.dryRun);
        }
      }

      // Optimize assets if enabled
      if (this.config.assetOptimization.enabled && this.config.assetOptimization.optimizeOnBuild) {
        const assetReport = await this.assetOptimizer.optimizeAllAssets();
        console.log(`🖼️ Optimized ${assetReport.totalAssets} assets, saved ${this.formatSize(assetReport.totalSavings)}`);
      }

      // Generate reports if enabled
      if (this.config.reporting.enabled && this.config.reporting.generateOnBuild) {
        await this.generateReports(bundleMetrics);
      }

      // Trigger monitoring hooks
      await this.buildIntegration.onOptimization(bundleMetrics);

    } catch (error) {
      await this.buildIntegration.onError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async onOptimizationHook(metrics: BundleMetrics): Promise<void> {
    console.log(`📈 Bundle optimization completed:`);
    console.log(`   Build: ${metrics.buildNumber}`);
    console.log(`   Size: ${this.formatSize(metrics.bundleSize)}`);
    console.log(`   Gzipped: ${this.formatSize(metrics.gzippedSize)}`);
    console.log(`   Savings: ${this.formatSize(metrics.optimizationSavings)}`);
    console.log(`   Budget: ${metrics.budgetStatus}`);
    console.log(`   Score: ${metrics.performanceScore}/100`);

    // Send metrics to monitoring systems
    if (this.config.monitoring.enabled) {
      await this.sendMetrics(metrics);
    }

    // Trigger webhooks if configured
    if (this.config.monitoring.webhooks.length > 0) {
      await this.triggerWebhooks(metrics);
    }
  }

  private async onErrorHook(error: Error): Promise<void> {
    console.error('❌ Bundle optimization error:', error.message);

    // This would send error notifications to monitoring systems
    if (this.config.monitoring.alerting) {
      await this.sendErrorAlert(error);
    }
  }

  private getBuildNumber(): string {
    // Try to get build number from environment or git
    try {
      return process.env.BUILD_NUMBER ||
             process.env.CI_BUILD_NUMBER ||
             `build-${Date.now()}`;
    } catch {
      return `build-${Date.now()}`;
    }
  }

  private calculatePerformanceScore(analysis: any): number {
    let score = 100;

    // Deduct points for budget overages
    analysis.performanceBudget.overages.forEach((overage: any) => {
      score -= overage.overagePercentage * 2;
    });

    // Deduct points for large bundle size
    if (analysis.totalSize > 1024 * 1024) { // > 1MB
      score -= 20;
    }

    // Deduct points for many recommendations
    score -= Math.min(analysis.recommendations.length * 2, 30);

    return Math.max(0, Math.round(score));
  }

  private async generateReports(metrics: BundleMetrics): Promise<void> {
    const outputPath = join(this.projectRoot, this.config.reporting.outputPath);

    for (const format of this.config.reporting.formats) {
      switch (format) {
        case 'json':
          await this.generateJSONReport(outputPath, metrics);
          break;
        case 'markdown':
          await this.generateMarkdownReport(outputPath, metrics);
          break;
        case 'html':
          await this.generateHTMLReport(outputPath, metrics);
          break;
      }
    }
  }

  private async generateJSONReport(outputPath: string, metrics: BundleMetrics): Promise<void> {
    const report = {
      timestamp: metrics.timestamp,
      buildNumber: metrics.buildNumber,
      bundleMetrics: metrics,
      configuration: this.config,
    };

    const filename = join(outputPath, `bundle-report-${metrics.buildNumber}.json`);
    writeFileSync(filename, JSON.stringify(report, null, 2));
  }

  private async generateMarkdownReport(outputPath: string, metrics: BundleMetrics): Promise<void> {
    let report = `# Bundle Optimization Report\n\n`;
    report += `**Build:** ${metrics.buildNumber}\n`;
    report += `**Date:** ${metrics.timestamp.toISOString()}\n\n`;

    report += `## Bundle Metrics\n`;
    report += `- **Bundle Size:** ${this.formatSize(metrics.bundleSize)}\n`;
    report += `- **Gzipped Size:** ${this.formatSize(metrics.gzippedSize)}\n`;
    report += `- **Optimization Savings:** ${this.formatSize(metrics.optimizationSavings)}\n`;
    report += `- **Performance Score:** ${metrics.performanceScore}/100\n`;
    report += `- **Budget Status:** ${metrics.budgetStatus}\n\n`;

    const filename = join(outputPath, `bundle-report-${metrics.buildNumber}.md`);
    writeFileSync(filename, report);
  }

  private async generateHTMLReport(outputPath: string, metrics: BundleMetrics): Promise<void> {
    // Generate HTML report with charts and visualizations
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Bundle Optimization Report - ${metrics.buildNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { display: inline-block; margin: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .score { font-size: 48px; font-weight: bold; color: ${metrics.performanceScore > 80 ? '#4CAF50' : metrics.performanceScore > 60 ? '#FF9800' : '#F44336'}; }
        .status { padding: 8px 16px; border-radius: 4px; color: white; font-weight: bold;
                 background-color: ${metrics.budgetStatus === 'pass' ? '#4CAF50' : metrics.budgetStatus === 'warning' ? '#FF9800' : '#F44336'}; }
    </style>
</head>
<body>
    <h1>Bundle Optimization Report</h1>
    <p><strong>Build:</strong> ${metrics.buildNumber}</p>
    <p><strong>Date:</strong> ${metrics.timestamp.toISOString()}</p>

    <div class="metric">
        <div>Bundle Size</div>
        <div style="font-size: 24px;">${this.formatSize(metrics.bundleSize)}</div>
    </div>

    <div class="metric">
        <div>Gzipped Size</div>
        <div style="font-size: 24px;">${this.formatSize(metrics.gzippedSize)}</div>
    </div>

    <div class="metric">
        <div>Optimization Savings</div>
        <div style="font-size: 24px;">${this.formatSize(metrics.optimizationSavings)}</div>
    </div>

    <div class="metric">
        <div>Performance Score</div>
        <div class="score">${metrics.performanceScore}</div>
    </div>

    <div class="metric">
        <div>Budget Status</div>
        <div class="status">${metrics.budgetStatus.toUpperCase()}</div>
    </div>
</body>
</html>`;

    const filename = join(outputPath, `bundle-report-${metrics.buildNumber}.html`);
    writeFileSync(filename, html);
  }

  private async sendMetrics(metrics: BundleMetrics): Promise<void> {
    // This would send metrics to monitoring systems like DataDog, New Relic, etc.
    console.log('📊 Sending metrics to monitoring systems...');
  }

  private async triggerWebhooks(metrics: BundleMetrics): Promise<void> {
    // This would trigger configured webhooks with bundle metrics
    console.log('🔗 Triggering optimization webhooks...');
  }

  private async sendErrorAlert(error: Error): Promise<void> {
    // This would send error alerts to configured channels
    console.log('🚨 Sending error alert...');
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Public API methods
  getBuildIntegration(): BuildIntegration {
    return this.buildIntegration;
  }

  async runManualOptimization(): Promise<BundleMetrics> {
    console.log('🔧 Running manual bundle optimization...');

    await this.preBuildHook();
    await this.postBuildHook();

    return this.metrics[this.metrics.length - 1];
  }

  updateConfiguration(newConfig: Partial<BundleSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfiguration();
  }

  getMetrics(): BundleMetrics[] {
    return this.metrics;
  }

  async getSystemStatus(): Promise<{
    enabled: boolean;
    lastAnalysis: Date | null;
    lastOptimization: Date | null;
    budgetStatus: string;
    metricsCount: number;
  }> {
    return {
      enabled: this.config.enabled,
      lastAnalysis: null, // Would get from analyzer
      lastOptimization: null, // Would get from optimizer
      budgetStatus: 'unknown', // Would get from budget manager
      metricsCount: this.metrics.length,
    };
  }
}

export {
  BundleSystemInitializer,
  type BundleSystemConfig,
  type BundleMetrics,
  type BuildIntegration,
};

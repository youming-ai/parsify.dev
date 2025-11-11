/**
 * CDN Optimization System - Main Entry Point
 * Comprehensive CDN optimization for Parsify.dev developer tools platform
 * This is T157 in the implementation plan
 */

import { CDNOptimizer, CDNOptimizerConfig, CDNOptimizationResult } from './cdn-optimizer';
import { CDNIntegration, CDNIntegrationConfig } from './cdn-integration';
import { CDNCacheManager } from './cdn-cache-manager';
import { CDNPerformanceMonitor } from './cdn-performance-monitor';
import { CDNGeoOptimizer } from './cdn-geo-optimizer';
import { CDNReporter } from './cdn-reporter';
import * as types from './cdn-types';

// Export all components and types
export {
  CDNOptimizer,
  CDNIntegration,
  CDNCacheManager,
  CDNPerformanceMonitor,
  CDNGeoOptimizer,
  CDNReporter,
  types,
};

export type {
  CDNOptimizerConfig,
  CDNOptimizationResult,
  CDNIntegrationConfig,
} from './cdn-optimizer';

/**
 * CDN Optimization System - Main class
 * Provides a unified interface for all CDN optimization functionality
 */
export class CDNOptimizationSystem {
  private config: CDNOptimizerConfig;
  private optimizer: CDNOptimizer;
  private integration: CDNIntegration | null = null;
  private isInitialized = false;

  constructor(config: CDNOptimizerConfig) {
    this.config = config;
    this.optimizer = new CDNOptimizer(config);
  }

  /**
   * Initialize the CDN optimization system
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing CDN Optimization System...');

    try {
      // Validate configuration
      await this.validateConfiguration();

      // Initialize the core optimizer
      await this.optimizer.initialize();

      // Initialize integration if monitoring is enabled
      if (this.config.optimizationLevel !== 'conservative') {
        await this.initializeIntegration();
      }

      this.isInitialized = true;
      console.log('✅ CDN Optimization System initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize CDN Optimization System:', error);
      throw error;
    }
  }

  /**
   * Run comprehensive CDN optimization
   */
  async optimizeCDN(options: {
    dryRun?: boolean;
    focusArea?: 'cache' | 'performance' | 'geography' | 'all';
    regions?: string[];
    integration?: boolean;
  } = {}): Promise<{
    cdnOptimization: CDNOptimizationResult;
    integration?: any;
    recommendations: string[];
    estimatedSavings: {
      bandwidth?: number;
      latency?: number;
      cost?: number;
    };
  }> {
    if (!this.isInitialized) {
      throw new Error('CDN Optimization System not initialized. Call initialize() first.');
    }

    console.log('🎯 Running CDN optimization...');

    try {
      // Run core CDN optimization
      const cdnOptimization = await this.optimizer.optimizeCDN(options);

      // Run integration optimization if requested
      let integration = null;
      if (options.integration && this.integration) {
        integration = await this.integration.runIntegratedOptimization();
      }

      // Combine recommendations
      const recommendations = [
        ...cdnOptimization.recommendations,
        ...(integration?.combinedRecommendations || []),
      ];

      // Calculate estimated savings
      const estimatedSavings = this.calculateEstimatedSavings(cdnOptimization, integration);

      const result = {
        cdnOptimization,
        integration,
        recommendations,
        estimatedSavings,
      };

      console.log('✅ CDN optimization completed successfully');
      return result;

    } catch (error) {
      console.error('❌ CDN optimization failed:', error);
      throw error;
    }
  }

  /**
   * Get current CDN status and metrics
   */
  async getStatus(): Promise<{
    isOptimized: boolean;
    optimizationScore: number;
    lastOptimized: Date | null;
    nextRecommendedOptimization: Date;
    currentMetrics: any;
    costAnalysis: any;
    geographicPerformance: any;
  }> {
    if (!this.isInitialized) {
      throw new Error('CDN Optimization System not initialized. Call initialize() first.');
    }

    console.log('📊 Retrieving CDN status...');

    try {
      // Get optimization status
      const optimizationStatus = await this.optimizer.getOptimizationStatus();

      // Get current metrics
      const currentMetrics = await this.optimizer.optimizeCDN({ dryRun: true });

      // Get cost analysis
      const costAnalysis = await this.optimizer.getCostOptimization();

      // Get geographic performance
      const geographicPerformance = await this.optimizer.optimizeCDN({
        focusArea: 'geography',
        dryRun: true,
      });

      const status = {
        isOptimized: optimizationStatus.isOptimized,
        optimizationScore: optimizationStatus.optimizationScore,
        lastOptimized: optimizationStatus.lastOptimized,
        nextRecommendedOptimization: optimizationStatus.nextRecommendedOptimization,
        currentMetrics: currentMetrics.performance,
        costAnalysis,
        geographicPerformance: geographicPerformance.performance,
      };

      console.log('✅ CDN status retrieved successfully');
      return status;

    } catch (error) {
      console.error('❌ Failed to retrieve CDN status:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive CDN report
   */
  async generateReport(options: {
    type: 'performance' | 'optimization' | 'cost' | 'geographic' | 'unified';
    timeRange?: {
      start: Date;
      end: Date;
    };
    format?: 'pdf' | 'html' | 'json' | 'csv';
    includeIntegration?: boolean;
  } = {}): Promise<{
    report: any;
    insights: string[];
    recommendations: string[];
    metrics: any;
  }> {
    if (!this.isInitialized) {
      throw new Error('CDN Optimization System not initialized. Call initialize() first.');
    }

    console.log(`📄 Generating ${options.type} report...`);

    try {
      let report: any;

      // Generate report based on type
      switch (options.type) {
        case 'performance':
          report = await this.generatePerformanceReport(options.timeRange);
          break;
        case 'optimization':
          report = await this.generateOptimizationReport(options.timeRange);
          break;
        case 'cost':
          report = await this.generateCostReport(options.timeRange);
          break;
        case 'geographic':
          report = await this.generateGeographicReport(options.timeRange);
          break;
        case 'unified':
          report = await this.generateUnifiedReport(options.timeRange);
          break;
        default:
          throw new Error(`Unknown report type: ${options.type}`);
      }

      // Generate insights and recommendations
      const insights = await this.generateInsights(report);
      const recommendations = await this.generateReportRecommendations(report);

      // Get relevant metrics
      const metrics = await this.getReportMetrics(options.type, options.timeRange);

      const result = {
        report,
        insights,
        recommendations,
        metrics,
      };

      console.log(`✅ ${options.type} report generated successfully`);
      return result;

    } catch (error) {
      console.error(`❌ Failed to generate ${options.type} report:`, error);
      throw error;
    }
  }

  /**
   * Setup automated optimization
   */
  async setupAutomatedOptimization(config: {
    enabled: boolean;
    schedule: 'hourly' | 'daily' | 'weekly';
    threshold: number;
    autoApply: boolean;
    notifications: {
      email?: string;
      webhook?: string;
      slack?: string;
    };
  }): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('CDN Optimization System not initialized. Call initialize() first.');
    }

    console.log('⚙️ Setting up automated optimization...');

    try {
      if (config.enabled) {
        // Setup automated optimization in integration
        if (this.integration) {
          await this.integration.setupAutomatedOptimization({
            frequency: config.schedule,
            threshold: config.threshold,
            autoApply: config.autoApply,
          });
        }

        // Setup notifications
        await this.setupNotifications(config.notifications);

        console.log('✅ Automated optimization setup successfully');
      } else {
        // Disable automated optimization
        await this.disableAutomatedOptimization();
        console.log('✅ Automated optimization disabled');
      }

    } catch (error) {
      console.error('❌ Failed to setup automated optimization:', error);
      throw error;
    }
  }

  /**
   * Create dashboard for CDN monitoring
   */
  async createDashboard(options: {
    type: 'overview' | 'performance' | 'geographic' | 'cost' | 'unified';
    name?: string;
    sharing?: {
      enabled: boolean;
      public?: boolean;
      allowedUsers?: string[];
    };
  } = {}): Promise<{
    dashboardId: string;
    url: string;
    widgets: any[];
  }> {
    if (!this.isInitialized) {
      throw new Error('CDN Optimization System not initialized. Call initialize() first.');
    }

    console.log(`📊 Creating ${options.type} dashboard...`);

    try {
      // Create dashboard using the reporter
      const reporter = new CDNReporter(this.config);
      await reporter.initialize();

      const dashboard = await reporter.createDashboard(options.type);

      const result = {
        dashboardId: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: `/dashboards/${dashboard.name.toLowerCase().replace(/\s+/g, '-')}`,
        widgets: dashboard.widgets,
      };

      console.log(`✅ ${options.type} dashboard created successfully`);
      return result;

    } catch (error) {
      console.error(`❌ Failed to create ${options.type} dashboard:`, error);
      throw error;
    }
  }

  /**
   * Get optimization recommendations
   */
  async getRecommendations(): Promise<{
    immediate: Array<{
      type: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      estimatedSavings: any;
      implementation: string;
    }>;
    shortTerm: Array<{
      type: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      estimatedSavings: any;
      implementation: string;
    }>;
    longTerm: Array<{
      type: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      estimatedSavings: any;
      implementation: string;
    }>;
  }> {
    if (!this.isInitialized) {
      throw new Error('CDN Optimization System not initialized. Call initialize() first.');
    }

    console.log('💡 Getting optimization recommendations...');

    try {
      // Run optimization analysis
      const analysis = await this.optimizer.optimizeCDN({
        dryRun: true,
        focusArea: 'all',
      });

      // Categorize recommendations
      const immediate = analysis.optimizations.filter(opt =>
        opt.impact === 'high' && opt.savings.latency && opt.savings.latency > 100
      );

      const shortTerm = analysis.optimizations.filter(opt =>
        (opt.impact === 'high' || opt.impact === 'medium') &&
        opt.savings.latency && opt.savings.latency > 50
      );

      const longTerm = analysis.optimizations.filter(opt =>
        opt.savings.bandwidth && opt.savings.bandwidth > 20
      );

      const recommendations = {
        immediate: immediate.map(opt => ({
          type: opt.type,
          description: opt.description,
          impact: opt.impact,
          estimatedSavings: opt.savings,
          implementation: 'Can be applied immediately with minimal risk',
        })),
        shortTerm: shortTerm.map(opt => ({
          type: opt.type,
          description: opt.description,
          impact: opt.impact,
          estimatedSavings: opt.savings,
          implementation: 'Requires 1-2 weeks of implementation time',
        })),
        longTerm: longTerm.map(opt => ({
          type: opt.type,
          description: opt.description,
          impact: opt.impact,
          estimatedSavings: opt.savings,
          implementation: 'Requires 1-3 months of implementation time',
        })),
      };

      console.log('✅ Optimization recommendations retrieved successfully');
      return recommendations;

    } catch (error) {
      console.error('❌ Failed to get optimization recommendations:', error);
      throw error;
    }
  }

  /**
   * Stop the CDN optimization system
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping CDN Optimization System...');

    try {
      // Stop integration if active
      if (this.integration) {
        this.integration.stop();
      }

      // Stop optimizer if needed
      // The optimizer doesn't have a stop method, but we can clean up resources

      this.isInitialized = false;
      console.log('✅ CDN Optimization System stopped successfully');

    } catch (error) {
      console.error('❌ Failed to stop CDN Optimization System:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async validateConfiguration(): Promise<void> {
    if (!this.config.domain) {
      throw new Error('CDN domain is required');
    }

    if (!this.config.zones || this.config.zones.length === 0) {
      throw new Error('At least one CDN zone is required');
    }

    // Validate budget limits
    if (this.config.budgetLimits) {
      const { monthlyRequests, monthlyBandwidthGB, costThreshold } = this.config.budgetLimits;

      if (monthlyRequests <= 0) {
        throw new Error('Monthly requests must be greater than 0');
      }

      if (monthlyBandwidthGB <= 0) {
        throw new Error('Monthly bandwidth must be greater than 0');
      }

      if (costThreshold <= 0) {
        throw new Error('Cost threshold must be greater than 0');
      }
    }
  }

  private async initializeIntegration(): Promise<void> {
    const integrationConfig: CDNIntegrationConfig = {
      ...this.config,
      existingMonitoring: {
        bundleAnalyzer: true,
        userAnalytics: true,
        errorTracking: true,
        performanceMonitoring: true,
      },
      integration: {
        sharedDashboards: true,
        unifiedAlerting: true,
        correlatedMetrics: true,
        automatedOptimization: this.config.optimizationLevel === 'aggressive',
      },
      reporting: {
        existingReports: true,
        unifiedReports: true,
        scheduledReports: true,
        realTimeAlerts: true,
      },
    };

    this.integration = new CDNIntegration(integrationConfig);
    await this.integration.initialize();
  }

  private calculateEstimatedSavings(cdnOptimization: any, integration: any): {
    bandwidth?: number;
    latency?: number;
    cost?: number;
  } {
    const savings: any = {};

    // Calculate CDN savings
    if (cdnOptimization.optimizations) {
      for (const opt of cdnOptimization.optimizations) {
        if (opt.savings) {
          if (opt.savings.bandwidth) {
            savings.bandwidth = (savings.bandwidth || 0) + opt.savings.bandwidth;
          }
          if (opt.savings.latency) {
            savings.latency = (savings.latency || 0) + opt.savings.latency;
          }
          if (opt.savings.cost) {
            savings.cost = (savings.cost || 0) + opt.savings.cost;
          }
        }
      }
    }

    // Add integration savings if available
    if (integration?.estimatedROI > 1) {
      savings.cost = (savings.cost || 0) * integration.estimatedROI;
    }

    return savings;
  }

  private async generatePerformanceReport(timeRange?: any): Promise<any> {
    const reporter = new CDNReporter(this.config);
    await reporter.initialize();
    return await reporter.generatePerformanceReport({ timeRange });
  }

  private async generateOptimizationReport(timeRange?: any): Promise<any> {
    const reporter = new CDNReporter(this.config);
    await reporter.initialize();
    return await reporter.generateOptimizationReport({ timeRange });
  }

  private async generateCostReport(timeRange?: any): Promise<any> {
    const reporter = new CDNReporter(this.config);
    await reporter.initialize();
    return await reporter.generateCostReport({ timeRange });
  }

  private async generateGeographicReport(timeRange?: any): Promise<any> {
    const reporter = new CDNReporter(this.config);
    await reporter.initialize();
    return await reporter.generateGeographicReport({ timeRange });
  }

  private async generateUnifiedReport(timeRange?: any): Promise<any> {
    if (!this.integration) {
      throw new Error('Integration not enabled for unified reports');
    }
    return await this.integration.generateUnifiedReport(timeRange || {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    });
  }

  private async generateInsights(report: any): Promise<string[]> {
    const insights: string[] = [];

    // Analyze report data and generate insights
    if (report.summary?.overallScore) {
      const score = report.summary.overallScore;
      if (score > 90) {
        insights.push('Excellent CDN performance with optimal configuration');
      } else if (score > 70) {
        insights.push('Good CDN performance with room for improvement');
      } else {
        insights.push('CDN performance requires optimization attention');
      }
    }

    return insights;
  }

  private async generateReportRecommendations(report: any): Promise<string[]> {
    // Extract recommendations from report or generate new ones
    return report.recommendations || [
      'Review CDN configuration for optimization opportunities',
      'Implement automated monitoring and alerting',
      'Consider geographic optimization for better global performance',
    ];
  }

  private async getReportMetrics(type: string, timeRange?: any): Promise<any> {
    // Get relevant metrics based on report type
    return {
      generatedAt: new Date(),
      type,
      timeRange,
      // Additional metrics would be added here
    };
  }

  private async setupNotifications(notifications: any): Promise<void> {
    // Setup notification channels
    if (notifications.email) {
      console.log(`📧 Setting up email notifications to: ${notifications.email}`);
    }

    if (notifications.webhook) {
      console.log(`🔗 Setting up webhook notifications to: ${notifications.webhook}`);
    }

    if (notifications.slack) {
      console.log(`💬 Setting up Slack notifications to: ${notifications.slack}`);
    }
  }

  private async disableAutomatedOptimization(): Promise<void> {
    if (this.integration) {
      this.integration.stop();
    }
  }
}

/**
 * Convenience function to initialize CDN optimization system
 */
export async function initializeCDNOptimization(config: CDNOptimizerConfig): Promise<CDNOptimizationSystem> {
  const system = new CDNOptimizationSystem(config);
  await system.initialize();
  return system;
}

/**
 * Convenience function to run one-time CDN optimization
 */
export async function runCDNOptimization(config: CDNOptimizerConfig, options: {
  dryRun?: boolean;
  focusArea?: 'cache' | 'performance' | 'geography' | 'all';
  regions?: string[];
} = {}): Promise<{
  optimizations: any[];
  recommendations: string[];
  estimatedSavings: any;
  appliedConfiguration: any;
}> {
  const optimizer = new CDNOptimizer(config);
  await optimizer.initialize();

  const result = await optimizer.optimizeCDN(options);

  return {
    optimizations: result.optimizations,
    recommendations: result.recommendations,
    estimatedSavings: result.optimizations.reduce((total: any, opt: any) => {
      return {
        bandwidth: (total.bandwidth || 0) + (opt.savings?.bandwidth || 0),
        latency: (total.latency || 0) + (opt.savings?.latency || 0),
        cost: (total.cost || 0) + (opt.savings?.cost || 0),
      };
    }, {}),
    appliedConfiguration: result.appliedConfig,
  };
}

// Command line interface
export async function runCLI(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  // Example configuration - in production, this would come from config files
  const config: CDNOptimizerConfig = {
    provider: 'cloudflare',
    domain: 'parsify.dev',
    zones: ['parsify.dev'],
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    optimizationLevel: 'balanced',
    budgetLimits: {
      monthlyRequests: 10000000,
      monthlyBandwidthGB: 1000,
      costThreshold: 500,
    },
  };

  switch (command) {
    case 'init':
      const system = await initializeCDNOptimization(config);
      console.log('✅ CDN Optimization System initialized');
      break;

    case 'optimize':
      const optimization = await runCDNOptimization(config, {
        dryRun: args.includes('--dry-run'),
        focusArea: args.includes('--cache') ? 'cache' :
                  args.includes('--performance') ? 'performance' :
                  args.includes('--geography') ? 'geography' : 'all',
      });

      console.log('\n🎯 CDN Optimization Results:');
      console.log(`Optimizations: ${optimization.optimizations.length}`);
      console.log(`Recommendations: ${optimization.recommendations.length}`);
      console.log(`Estimated Bandwidth Savings: ${optimization.estimatedSavings.bandwidth || 0}%`);
      console.log(`Estimated Latency Improvement: ${optimization.estimatedSavings.latency || 0}ms`);
      console.log(`Estimated Cost Savings: $${optimization.estimatedSavings.cost || 0}`);
      break;

    case 'status':
      const statusSystem = await initializeCDNOptimization(config);
      const status = await statusSystem.getStatus();

      console.log('\n📊 CDN Status:');
      console.log(`Optimized: ${status.isOptimized ? 'Yes' : 'No'}`);
      console.log(`Optimization Score: ${status.optimizationScore}/100`);
      console.log(`Last Optimized: ${status.lastOptimized || 'Never'}`);
      console.log(`Next Optimization: ${status.nextRecommendedOptimization}`);
      break;

    case 'report':
      const reportSystem = await initializeCDNOptimization(config);
      const reportType = args.includes('--cost') ? 'cost' :
                        args.includes('--geographic') ? 'geographic' :
                        args.includes('--performance') ? 'performance' : 'unified';

      const report = await reportSystem.generateReport({ type: reportType });
      console.log(`\n📄 ${reportType.toUpperCase()} Report Generated:`);
      console.log(`Insights: ${report.insights.length}`);
      console.log(`Recommendations: ${report.recommendations.length}`);
      break;

    case 'recommendations':
      const recSystem = await initializeCDNOptimization(config);
      const recommendations = await recSystem.getRecommendations();

      console.log('\n💡 Optimization Recommendations:');
      console.log(`Immediate: ${recommendations.immediate.length}`);
      console.log(`Short-term: ${recommendations.shortTerm.length}`);
      console.log(`Long-term: ${recommendations.longTerm.length}`);

      if (recommendations.immediate.length > 0) {
        console.log('\n🚀 Immediate Actions:');
        recommendations.immediate.forEach((rec, i) => {
          console.log(`${i + 1}. ${rec.description} (${rec.impact} impact)`);
        });
      }
      break;

    default:
      console.log(`
🌐 Parsify.dev CDN Optimization System

Usage:
  cdn-tools <command> [options]

Commands:
  init                     Initialize CDN optimization system
  optimize                 Run CDN optimization analysis
  status                   Get current CDN status
  report                   Generate performance report
  recommendations          Get optimization recommendations

Options:
  --dry-run              Show optimizations without applying them
  --cache                Focus on cache optimizations
  --performance          Focus on performance optimizations
  --geography            Focus on geographic optimizations
  --cost                 Generate cost analysis report
  --performance          Generate performance report
  --geographic           Generate geographic report

Examples:
  cdn-tools init
  cdn-tools optimize --dry-run
  cdn-tools optimize --cache --performance
  cdn-tools status
  cdn-tools report --cost
  cdn-tools recommendations
      `);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  runCLI().catch(console.error);
}

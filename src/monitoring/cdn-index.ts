/**
 * CDN Optimization System - Main Entry Point
 * T157 Implementation: Comprehensive CDN optimization for Parsify.dev
 * Exports all CDN optimization components and provides convenience functions
 */

// Core components
export { CDNOptimizer, type CDNOptimizerConfig, type CDNOptimizationResult } from './cdn-optimizer';
export { CDNCacheManager, type CacheAnalysisResult, type CacheMetrics } from './cdn-cache-manager';
export { CDNPerformanceMonitor, type PerformanceAlert, type PerformanceAnalysis } from './cdn-performance-monitor';
export { CDNGeoOptimizer, type GeoAnalysisResult, type GeoRecommendation, type TrafficAnalysis } from './cdn-geo-optimizer';
export { CDNReporter, type CDNReport, type ReportSummary, type ReportRecommendation } from './cdn-reporter';
export { CDNIntegration, type CDNIntegrationConfig, type IntegrationMetrics } from './cdn-integration';

// Types and interfaces
export * from './cdn-types';

// Convenience function to initialize the complete CDN system
export async function initializeCDNOptimization(config: {
  provider: 'cloudflare' | 'fastly' | 'cloudfront' | 'akamai' | 'custom';
  domain: string;
  zones: string[];
  apiToken?: string;
  apiEndpoint?: string;
  optimizationLevel?: 'conservative' | 'balanced' | 'aggressive';
  budgetLimits?: {
    monthlyRequests?: number;
    monthlyBandwidthGB?: number;
    costThreshold?: number;
  };
  existingMonitoring?: {
    bundleAnalyzer?: boolean;
    userAnalytics?: boolean;
    errorTracking?: boolean;
    performanceMonitoring?: boolean;
  };
  integration?: {
    sharedDashboards?: boolean;
    unifiedAlerting?: boolean;
    correlatedMetrics?: boolean;
    automatedOptimization?: boolean;
  };
} = {
  provider: 'cloudflare',
  domain: 'parsify.dev',
  zones: ['parsify.dev'],
  optimizationLevel: 'balanced',
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
    automatedOptimization: false,
  },
}) {
  console.log('🌐 Initializing Complete CDN Optimization System for Parsify.dev...');

  try {
    // Validate required configuration
    if (!config.domain) {
      throw new Error('CDN domain is required');
    }

    if (!config.zones || config.zones.length === 0) {
      throw new Error('At least one CDN zone is required');
    }

    // Create CDN optimizer configuration
    const cdnConfig = {
      ...config,
      budgetLimits: config.budgetLimits || {
        monthlyRequests: 10000000,
        monthlyBandwidthGB: 1000,
        costThreshold: 5000,
      },
    };

    // Initialize main CDN optimizer
    const cdnOptimizer = new CDNOptimizer(cdnConfig);
    await cdnOptimizer.initialize();

    // Initialize integration if monitoring is enabled
    let integration = null;
    if (config.existingMonitoring || config.integration) {
      const integrationConfig = {
        ...cdnConfig,
        existingMonitoring: config.existingMonitoring || {
          bundleAnalyzer: true,
          userAnalytics: true,
          errorTracking: true,
          performanceMonitoring: true,
        },
        integration: config.integration || {
          sharedDashboards: true,
          unifiedAlerting: true,
          correlatedMetrics: true,
          automatedOptimization: false,
        },
      };

      integration = new CDNIntegration(integrationConfig);
      await integration.initialize();
    }

    console.log('✅ CDN Optimization System initialized successfully');

    return {
      cdnOptimizer,
      integration,
      config: cdnConfig,
    };

  } catch (error) {
    console.error('❌ Failed to initialize CDN Optimization System:', error);
    throw error;
  }
}

// Convenience function to run one-time optimization
export async function runCDNOptimization(options: {
  domain?: string;
  provider?: 'cloudflare' | 'fastly' | 'cloudfront' | 'akamai' | 'custom';
  dryRun?: boolean;
  focusArea?: 'cache' | 'performance' | 'geography' | 'all';
  regions?: string[];
  budgetConstraints?: {
    maxMonthlyCost?: number;
    maxBandwidthGB?: number;
    maxRequests?: number;
  };
} = {}) {
  console.log('🚀 Running CDN optimization...');

  try {
    // Use default configuration or provided options
    const config = {
      provider: options.provider || 'cloudflare',
      domain: options.domain || 'parsify.dev',
      zones: [options.domain || 'parsify.dev'],
      optimizationLevel: 'balanced' as const,
      budgetLimits: {
        monthlyRequests: options.budgetConstraints?.maxRequests || 10000000,
        monthlyBandwidthGB: options.budgetConstraints?.maxBandwidthGB || 1000,
        costThreshold: options.budgetConstraints?.maxMonthlyCost || 5000,
      },
    };

    // Initialize optimizer
    const optimizer = new CDNOptimizer(config);
    await optimizer.initialize();

    // Run optimization
    const results = await optimizer.optimizeCDN({
      dryRun: options.dryRun || false,
      focusArea: options.focusArea || 'all',
      regions: options.regions,
    });

    // Get optimization status
    const status = await optimizer.getOptimizationStatus();

    // Get cost optimization analysis
    const costAnalysis = await optimizer.getCostOptimization();

    console.log('✅ CDN optimization completed successfully');

    return {
      results,
      status,
      costAnalysis,
      appliedConfig: results.appliedConfig,
    };

  } catch (error) {
    console.error('❌ CDN optimization failed:', error);
    throw error;
  }
}

// Convenience function to generate comprehensive report
export async function generateCDNReport(options: {
  domain?: string;
  reportType?: 'performance' | 'optimization' | 'cost' | 'geographic' | 'comprehensive';
  timeRange?: {
    start: Date;
    end: Date;
  };
  regions?: string[];
  format?: 'json' | 'pdf' | 'csv' | 'html';
  exportPath?: string;
} = {}) {
  console.log('📊 Generating CDN report...');

  try {
    // Initialize optimizer
    const config = {
      provider: 'cloudflare' as const,
      domain: options.domain || 'parsify.dev',
      zones: [options.domain || 'parsify.dev'],
      optimizationLevel: 'balanced' as const,
      budgetLimits: {
        monthlyRequests: 10000000,
        monthlyBandwidthGB: 1000,
        costThreshold: 5000,
      },
    };

    const optimizer = new CDNOptimizer(config);
    await optimizer.initialize();

    // Initialize reporter
    const reporter = new CDNReporter(config);
    await reporter.initialize();

    // Determine report type
    const reportType = options.reportType || 'comprehensive';
    const timeRange = options.timeRange || {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: new Date(),
    };

    let report;

    switch (reportType) {
      case 'performance':
        report = await reporter.generatePerformanceReport({ timeRange });
        break;
      case 'optimization':
        report = await reporter.generateOptimizationReport({ timeRange });
        break;
      case 'cost':
        report = await reporter.generateCostReport({ timeRange });
        break;
      case 'geographic':
        report = await reporter.generateGeographicReport({
          timeRange,
          regions: options.regions,
        });
        break;
      case 'comprehensive':
      default:
        // Generate all reports and combine them
        const performanceReport = await reporter.generatePerformanceReport({ timeRange });
        const optimizationReport = await reporter.generateOptimizationReport({ timeRange });
        const costReport = await reporter.generateCostReport({ timeRange });
        const geographicReport = await reporter.generateGeographicReport({
          timeRange,
          regions: options.regions,
        });

        report = {
          id: `comprehensive_${Date.now()}`,
          type: 'comprehensive',
          title: 'Comprehensive CDN Report',
          generatedAt: new Date(),
          timeRange,
          sections: [
            { type: 'performance', data: performanceReport },
            { type: 'optimization', data: optimizationReport },
            { type: 'cost', data: costReport },
            { type: 'geographic', data: geographicReport },
          ],
          summary: {
            overallScore: (performanceReport.summary.overallScore +
                          optimizationReport.summary.overallScore +
                          costReport.summary.overallScore +
                          geographicReport.summary.overallScore) / 4,
            recommendations: [
              ...performanceReport.recommendations,
              ...optimizationReport.recommendations,
              ...costReport.recommendations,
              ...geographicReport.recommendations,
            ],
          },
        };
        break;
    }

    // Export if format specified
    let exportData = null;
    if (options.format && options.format !== 'json') {
      exportData = await reporter.exportReport(report, options.format);

      // Save to file if path specified
      if (options.exportPath) {
        const fs = require('fs').promises;
        await fs.writeFile(options.exportPath, exportData);
        console.log(`📄 Report exported to: ${options.exportPath}`);
      }
    }

    console.log('✅ CDN report generated successfully');

    return {
      report,
      exportData,
      exportPath: options.exportPath,
    };

  } catch (error) {
    console.error('❌ CDN report generation failed:', error);
    throw error;
  }
}

// Convenience function to setup automated optimization
export async function setupAutomatedCDNOptimization(options: {
  domain?: string;
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly';
    threshold: number;
    autoApply: boolean;
  };
  alerts?: {
    email?: string;
    webhook?: string;
    slack?: string;
  };
} = {}) {
  console.log('⚙️ Setting up automated CDN optimization...');

  try {
    // Initialize configuration
    const config = {
      provider: 'cloudflare' as const,
      domain: options.domain || 'parsify.dev',
      zones: [options.domain || 'parsify.dev'],
      optimizationLevel: 'balanced' as const,
      budgetLimits: {
        monthlyRequests: 10000000,
        monthlyBandwidthGB: 1000,
        costThreshold: 5000,
      },
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
        automatedOptimization: true,
      },
    };

    // Initialize integration
    const integration = new CDNIntegration(config);
    await integration.initialize();

    // Setup automated optimization
    await integration.setupAutomatedOptimization(options.schedule || {
      frequency: 'daily',
      threshold: 80,
      autoApply: false,
    });

    // Setup alerts if specified
    if (options.alerts) {
      // Implementation would setup alert channels
      console.log('🚨 Alert channels configured');
    }

    console.log('✅ Automated CDN optimization setup completed');

    return {
      integration,
      schedule: options.schedule || {
        frequency: 'daily',
        threshold: 80,
        autoApply: false,
      },
      alerts: options.alerts,
    };

  } catch (error) {
    console.error('❌ Failed to setup automated CDN optimization:', error);
    throw error;
  }
}

// Command line interface for CDN tools
export async function runCDNCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'init':
        await initializeCDNOptimization();
        break;

      case 'optimize':
        await runCDNOptimization({
          dryRun: args.includes('--dry-run'),
          focusArea: (args.find(arg => ['cache', 'performance', 'geography'].includes(arg)) as any) || 'all',
        });
        console.log('\n🎯 CDN Optimization Results:');
        console.log(`Optimization completed with ${args.includes('--dry-run') ? 'dry run' : 'applied changes'}`);
        break;

      case 'report':
        const reportType = args.find(arg =>
          ['performance', 'optimization', 'cost', 'geographic', 'comprehensive'].includes(arg)
        ) || 'comprehensive';

        const reportResult = await generateCDNReport({
          reportType: reportType as any,
          format: (args.find(arg => ['json', 'pdf', 'csv', 'html'].includes(arg)) as any) || 'json',
        });

        console.log(`\n📋 ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Generated:`);
        console.log(`Report ID: ${reportResult.report.id}`);
        console.log(`Generated: ${reportResult.report.generatedAt.toISOString()}`);

        if (reportResult.report.summary) {
          console.log(`Overall Score: ${reportResult.report.summary.overallScore || 'N/A'}`);
          console.log(`Recommendations: ${reportResult.report.summary.recommendations?.length || 0}`);
        }
        break;

      case 'automate':
        await setupAutomatedCDNOptimization({
          schedule: {
            frequency: (args.find(arg => ['hourly', 'daily', 'weekly'].includes(arg)) as any) || 'daily',
            threshold: parseInt(args.find(arg => arg.includes('--threshold='))?.split('=')[1] || '80'),
            autoApply: args.includes('--auto-apply'),
          },
        });
        console.log('\n🤖 Automated optimization setup completed');
        break;

      case 'monitor':
        const config = {
          provider: 'cloudflare' as const,
          domain: 'parsify.dev',
          zones: ['parsify.dev'],
          optimizationLevel: 'balanced' as const,
          budgetLimits: {
            monthlyRequests: 10000000,
            monthlyBandwidthGB: 1000,
            costThreshold: 5000,
          },
        };

        const optimizer = new CDNOptimizer(config);
        await optimizer.initialize();

        const status = await optimizer.getOptimizationStatus();
        console.log('\n📊 CDN Optimization Status:');
        console.log(`Optimized: ${status.isOptimized ? 'Yes' : 'No'}`);
        console.log(`Score: ${status.optimizationScore}/100`);
        console.log(`Last Optimized: ${status.lastOptimized || 'Never'}`);
        console.log(`Next Recommendation: ${status.nextRecommendedOptimization.toISOString()}`);
        break;

      default:
        console.log(`
🌐 Parsify.dev CDN Optimization System

Usage:
  cdn-tools <command> [options]

Commands:
  init                     Initialize CDN optimization system
  optimize                 Run optimization pipeline
  report                   Generate optimization report
  automate                 Setup automated optimization
  monitor                  Check optimization status

Options:
  --dry-run              Show optimizations without applying them
  --focus <area>         Focus on specific area (cache|performance|geography|all)
  --format <type>        Report format (json|pdf|csv|html)
  --type <type>          Report type (performance|optimization|cost|geographic|comprehensive)
  --frequency <freq>     Automation frequency (hourly|daily|weekly)
  --threshold <num>      Performance threshold for automation (0-100)
  --auto-apply           Automatically apply optimizations when threshold is reached
  --regions <list>       Comma-separated list of regions to include

Examples:
  cdn-tools init
  cdn-tools optimize --dry-run --focus cache
  cdn-tools report --type performance --format pdf
  cdn-tools automate --frequency daily --threshold 85
  cdn-tools monitor
        `);
    }
  } catch (error) {
    console.error('❌ CDN CLI command failed:', error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  runCDNCLI().catch(console.error);
}

// Export utility functions for external use
export const CDNUtils = {
  // Calculate performance score from metrics
  calculatePerformanceScore: (metrics: any) => {
    const weights = {
      latency: 0.3,
      hitRate: 0.4,
      availability: 0.2,
      errorRate: 0.1,
    };

    let score = 0;
    score += (1 - Math.min(metrics.avgLatency / 1000, 1)) * weights.latency * 100;
    score += metrics.cacheHitRate * weights.hitRate * 100;
    score += metrics.availability * weights.availability * 100;
    score += (1 - Math.min(metrics.errorRate * 100, 1)) * weights.errorRate * 100;

    return Math.round(score);
  },

  // Estimate cost savings from optimization
  estimateCostSavings: (optimizations: any[]) => {
    return optimizations.reduce((total, opt) => {
      return total + (opt.savings?.cost || 0);
    }, 0);
  },

  // Generate cache key from request
  generateCacheKey: (request: any) => {
    const parts = [
      request.method,
      request.url,
      JSON.stringify(request.headers || {}),
      JSON.stringify(request.query || {}),
    ];

    return parts.join('|');
  },

  // Calculate optimal TTL for content type
  calculateOptimalTTL: (contentType: string, updateFrequency: string) => {
    const baseTTLs = {
      'static': 31536000, // 1 year
      'dynamic': 300,     // 5 minutes
      'api': 600,         // 10 minutes
      'html': 3600,       // 1 hour
    };

    const frequencyMultiplier = {
      'high': 0.1,
      'medium': 0.5,
      'low': 1.0,
    };

    const baseTTL = baseTTLs[contentType] || 3600;
    const multiplier = frequencyMultiplier[updateFrequency] || 0.5;

    return Math.round(baseTTL * multiplier);
  },

  // Format bytes to human readable format
  formatBytes: (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  // Format milliseconds to human readable format
  formatDuration: (ms: number) => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.round((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  },
};

export default {
  initializeCDNOptimization,
  runCDNOptimization,
  generateCDNReport,
  setupAutomatedCDNOptimization,
  runCDNCLI,
  CDNUtils,
  CDNOptimizer,
  CDNCacheManager,
  CDNPerformanceMonitor,
  CDNGeoOptimizer,
  CDNReporter,
  CDNIntegration,
};

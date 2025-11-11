/**
 * Asset Optimization System Initialization
 * Initializes and configures the asset optimization monitoring system
 */

import { assetOptimizationSystem } from './asset-optimization-system';
import { bundleOptimizationSystem } from './bundle-optimization-system';
import { realtimeBundleMonitor } from './realtime-bundle-monitor';

export interface AssetOptimizationConfig {
  enabled: boolean;
  autoMode: boolean;
  thresholds: {
    assetSizeThreshold: number; // MB
    compressionRatioThreshold: number;
    optimizationScoreThreshold: number;
    formatModernizationThreshold: number;
  };
  schedule: {
    enabled: boolean;
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    timeWindow?: { start: string; end: string };
  };
  integrations: {
    budgeting: boolean;
    monitoring: boolean;
    analytics: boolean;
    notifications: boolean;
  };
  automation: {
    autoOptimize: boolean;
    autoConvert: boolean;
    autoCompress: boolean;
    generateReports: boolean;
    enforceBudgets: boolean;
  };
}

const DEFAULT_CONFIG: AssetOptimizationConfig = {
  enabled: true,
  autoMode: true,
  thresholds: {
    assetSizeThreshold: 2, // 2MB
    compressionRatioThreshold: 1.5,
    optimizationScoreThreshold: 70,
    formatModernizationThreshold: 80, // 80% modern formats
  },
  schedule: {
    enabled: true,
    frequency: 'daily',
    timeWindow: { start: '02:00', end: '04:00' }, // Night optimization window
  },
  integrations: {
    budgeting: true,
    monitoring: true,
    analytics: true,
    notifications: true,
  },
  automation: {
    autoOptimize: false, // Start conservative
    autoConvert: false,
    autoCompress: true,
    generateReports: true,
    enforceBudgets: true,
  },
};

/**
 * Initialize the asset optimization system with configuration
 */
export async function initializeAssetOptimization(
  config: Partial<AssetOptimizationConfig> = {}
): Promise<void> {
  try {
    console.log('[Asset Optimization] Initializing system...');

    // Merge with default configuration
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // Update asset optimization system configuration
    assetOptimizationSystem.updateConfig({
      enabled: finalConfig.enabled,
      autoMode: finalConfig.autoMode,
      thresholds: {
        assetSizeThreshold: finalConfig.thresholds.assetSizeThreshold,
        compressionRatioThreshold: finalConfig.thresholds.compressionRatioThreshold,
        optimizationScoreThreshold: finalConfig.thresholds.optimizationScoreThreshold,
        assetCountThreshold: 100,
        formatModernizationThreshold: finalConfig.thresholds.formatModernizationThreshold,
      },
      schedule: finalConfig.schedule,
      integrations: finalConfig.integrations,
      automation: {
        autoOptimize: finalConfig.automation.autoOptimize,
        autoConvert: finalConfig.automation.autoConvert,
        autoCompress: finalConfig.automation.autoCompress,
        autoResize: false,
        generateReports: finalConfig.automation.generateReports,
        enforceBudgets: finalConfig.automation.enforceBudgets,
        sendAlerts: finalConfig.integrations.notifications,
      },
    });

    // Initialize the asset optimization system
    await assetOptimizationSystem.initialize();

    // Set up event listeners for integration with other monitoring systems
    setupIntegrationEventListeners();

    // Perform initial analysis if enabled
    if (finalConfig.enabled && finalConfig.automation.generateReports) {
      // Small delay to ensure other systems are initialized
      setTimeout(async () => {
        try {
          await assetOptimizationSystem.performAssetAnalysis();
          console.log('[Asset Optimization] Initial analysis completed');
        } catch (error) {
          console.error('[Asset Optimization] Initial analysis failed:', error);
        }
      }, 5000);
    }

    console.log('[Asset Optimization] System initialized successfully');
    console.log('[Asset Optimization] Configuration:', {
      enabled: finalConfig.enabled,
      autoMode: finalConfig.autoMode,
      schedule: finalConfig.schedule.frequency,
      integrations: Object.values(finalConfig.integrations).filter(Boolean).length,
    });

  } catch (error) {
    console.error('[Asset Optimization] Initialization failed:', error);
    throw error;
  }
}

/**
 * Set up event listeners for integration with other monitoring systems
 */
function setupIntegrationEventListeners(): void {
  // Listen to bundle optimization events
  assetOptimizationSystem.on('analysis:completed', (data) => {
    console.log('[Asset Optimization] Analysis completed:', {
      assets: data.report.summary.totalAssets,
      compression: data.report.summary.overallCompressionRatio.toFixed(2),
      score: data.report.summary.optimizationScore,
    });

    // Notify bundle optimization system of asset changes
    if (bundleOptimizationSystem && data.result.performanceImpact.bundleSizeReduction > 0) {
      // This would trigger bundle re-analysis if the bundle system is available
      console.log('[Asset Optimization] Asset optimization may impact bundle size');
    }
  });

  // Listen to budget alerts
  assetOptimizationSystem.on('alert:created', (data) => {
    console.warn(`[Asset Optimization] Alert: ${data.alert.title}`, data.alert.message);

    // Forward critical alerts to other monitoring systems
    if (data.alert.severity === 'critical' && realtimeBundleMonitor) {
      // This would trigger immediate performance analysis
      console.log('[Asset Optimization] Critical asset issue detected - triggering performance analysis');
    }
  });

  // Listen to recommendation executions
  assetOptimizationSystem.on('recommendation:executed', (data) => {
    console.log(`[Asset Optimization] Executed recommendation: ${data.recommendation.title}`);

    // Trigger new analysis after significant changes
    if (data.recommendation.estimatedSavings > 1024 * 1024) { // > 1MB saved
      setTimeout(async () => {
        try {
          await assetOptimizationSystem.performAssetAnalysis();
        } catch (error) {
          console.error('[Asset Optimization] Post-optimization analysis failed:', error);
        }
      }, 10000);
    }
  });
}

/**
 * Get asset optimization system status
 */
export function getAssetOptimizationStatus() {
  const state = assetOptimizationSystem.getState();

  return {
    initialized: true,
    enabled: state.system.enabled,
    autoMode: state.system.autoMode,
    lastAnalysis: state.lastOptimization,
    currentReport: state.currentReport ? {
      totalAssets: state.currentReport.summary.totalAssets,
      optimizationScore: state.currentReport.summary.optimizationScore,
      compressionRatio: state.currentReport.summary.overallCompressionRatio,
    } : null,
    recommendations: state.recommendations.length,
    activeAlerts: state.alerts.filter(alert => !alert.resolved && !alert.acknowledged).length,
    activeOptimizations: state.activeOptimizations.size,
  };
}

/**
 * Cleanup asset optimization system
 */
export async function cleanupAssetOptimization(): Promise<void> {
  try {
    console.log('[Asset Optimization] Cleaning up system...');
    await assetOptimizationSystem.cleanup();
    console.log('[Asset Optimization] System cleaned up successfully');
  } catch (error) {
    console.error('[Asset Optimization] Cleanup failed:', error);
  }
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeAssetOptimization().catch(console.error);
    });
  } else {
    // DOM already loaded
    initializeAssetOptimization().catch(console.error);
  }
}

// Export for manual initialization
export { assetOptimizationSystem };

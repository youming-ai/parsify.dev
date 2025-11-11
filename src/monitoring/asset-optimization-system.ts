/**
 * Asset Optimization System Integration
 * Integrates asset optimization with monitoring and budget systems
 */

import { analyzeDirectory, type AssetOptimizationReport, type AssetAnalysis } from '@/lib/asset-optimization/analyzer';
import { sizeBudgetManager, type BudgetStatus } from './size-budget-manager';
import { realtimeBundleMonitor, type RealtimeBundleState } from './realtime-bundle-monitor';
import { bundleAnalyzer, type BundleAnalysis } from '@/analytics/bundle-analyzer';

export interface AssetOptimizationSystem {
  enabled: boolean;
  autoMode: boolean;
  schedule: OptimizationSchedule;
  thresholds: SystemThresholds;
  integrations: SystemIntegrations;
  automation: AutomationConfig;
}

export interface OptimizationSchedule {
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  timeWindow?: { start: string; end: string }; // HH:MM format
  lastRun?: Date;
  nextRun?: Date;
}

export interface SystemThresholds {
  assetSizeThreshold: number; // MB
  compressionRatioThreshold: number; // minimum ratio
  optimizationScoreThreshold: number; // 0-100
  assetCountThreshold: number; // maximum number of assets
  formatModernizationThreshold: number; // percentage of modern formats
}

export interface SystemIntegrations {
  budgeting: boolean;
  monitoring: boolean;
  analytics: boolean;
  notifications: boolean;
  logging: boolean;
  ciCd: boolean;
  performance: boolean;
}

export interface AutomationConfig {
  autoOptimize: boolean;
  autoConvert: boolean;
  autoCompress: boolean;
  autoResize: boolean;
  generateReports: boolean;
  enforceBudgets: boolean;
  sendAlerts: boolean;
}

export interface AssetOptimizationState {
  system: AssetOptimizationSystem;
  currentReport?: AssetOptimizationReport;
  lastOptimization?: Date;
  optimizationHistory: AssetOptimizationResult[];
  activeOptimizations: Map<string, Promise<void>>;
  recommendations: AssetRecommendation[];
  alerts: AssetAlert[];
}

export interface AssetOptimizationResult {
  timestamp: Date;
  totalAssets: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  optimizationsPerformed: string[];
  issuesResolved: string[];
  performanceImpact: {
    loadTimeImprovement: number; // milliseconds
    bundleSizeReduction: number; // bytes
  };
}

export interface AssetRecommendation {
  id: string;
  type: 'image' | 'format' | 'compression' | 'size' | 'bundle';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  assets: string[];
  estimatedSavings: number; // bytes
  estimatedImprovement: number; // percentage
  action: AssetOptimizationAction;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
}

export interface AssetAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  assets?: string[];
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export interface AssetOptimizationAction {
  type: 'convert' | 'compress' | 'resize' | 'bundle' | 'remove' | 'replace';
  parameters: Record<string, any>;
  automated: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AssetOptimizationMetrics {
  totalAssetsOptimized: number;
  totalSpaceSaved: number;
  averageCompressionRatio: number;
  modernFormatAdoption: number; // percentage
  bundleSizeImpact: number; // bytes
  performanceImpact: {
    firstContentfulPaint: number; // milliseconds improvement
    largestContentfulPaint: number; // milliseconds improvement
    cumulativeLayoutShift: number; // improvement score
  };
}

class AssetOptimizationSystemManager {
  private state: AssetOptimizationState;
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();
  private optimizationTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor() {
    this.state = {
      system: this.getDefaultConfig(),
      optimizationHistory: [],
      activeOptimizations: new Map(),
      recommendations: [],
      alerts: [],
    };
  }

  /**
   * Initialize the asset optimization system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[Asset Optimization] Initializing system...');

      // Set up event listeners
      this.setupEventListeners();

      // Start automatic optimization if enabled
      if (this.state.system.autoMode && this.state.system.schedule.enabled) {
        this.startAutomaticOptimization();
      }

      // Perform initial asset analysis
      if (this.state.system.enabled) {
        await this.performAssetAnalysis();
      }

      this.isInitialized = true;
      console.log('[Asset Optimization] System initialized successfully');

      this.emit('system:initialized', {
        timestamp: new Date(),
        config: this.state.system,
      });
    } catch (error) {
      console.error('[Asset Optimization] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get default system configuration
   */
  private getDefaultConfig(): AssetOptimizationSystem {
    return {
      enabled: true,
      autoMode: true,
      schedule: {
        enabled: true,
        frequency: 'daily',
        timeWindow: { start: '02:00', end: '04:00' }, // Night optimization window
      },
      thresholds: {
        assetSizeThreshold: 2, // 2MB
        compressionRatioThreshold: 1.5,
        optimizationScoreThreshold: 70,
        assetCountThreshold: 100,
        formatModernizationThreshold: 80, // 80% modern formats
      },
      integrations: {
        budgeting: true,
        monitoring: true,
        analytics: true,
        notifications: true,
        logging: true,
        ciCd: false,
        performance: true,
      },
      automation: {
        autoOptimize: false, // Start conservative
        autoConvert: false,
        autoCompress: true,
        autoResize: false,
        generateReports: true,
        enforceBudgets: true,
        sendAlerts: true,
      },
    };
  }

  /**
   * Setup event listeners for integrations
   */
  private setupEventListeners(): void {
    // Budget integration
    if (this.state.system.integrations.budgeting) {
      this.on('budget:exceeded', (data: BudgetStatus) => {
        this.handleBudgetExceeded(data);
      });
    }

    // Performance integration
    if (this.state.system.integrations.performance) {
      this.on('performance:degraded', (data: any) => {
        this.handlePerformanceDegradation(data);
      });
    }

    // Bundle integration
    if (this.state.system.integrations.monitoring) {
      this.on('bundle:size-changed', (data: BundleAnalysis) => {
        this.handleBundleSizeChange(data);
      });
    }
  }

  /**
   * Perform comprehensive asset analysis
   */
  async performAssetAnalysis(): Promise<AssetOptimizationReport> {
    try {
      console.log('[Asset Optimization] Starting asset analysis...');

      // Analyze public directory assets
      const publicDirPath = './public';
      const report = await analyzeDirectory(publicDirPath, {
        includeResponsiveImages: true,
        imageFormats: ['webp', 'avif'],
        quality: 80,
        compressionLevel: 6,
        skipOptimizations: !this.state.system.automation.autoCompress,
      });

      // Update current report
      this.state.currentReport = report;
      this.state.lastOptimization = new Date();

      // Generate recommendations
      const recommendations = this.generateRecommendations(report);
      this.state.recommendations = recommendations;

      // Check for budget compliance
      if (this.state.system.integrations.budgeting) {
        await this.checkBudgetCompliance(report);
      }

      // Generate alerts for critical issues
      this.generateAlerts(report);

      // Create optimization result
      const result: AssetOptimizationResult = {
        timestamp: new Date(),
        totalAssets: report.summary.totalAssets,
        originalSize: report.summary.totalOriginalSize,
        optimizedSize: report.summary.totalOptimizedSize,
        compressionRatio: report.summary.overallCompressionRatio,
        optimizationsPerformed: report.recommendations,
        issuesResolved: report.issues.map(i => i.message),
        performanceImpact: this.calculatePerformanceImpact(report),
      };

      this.state.optimizationHistory.push(result);

      console.log('[Asset Optimization] Analysis completed:', {
        assets: report.summary.totalAssets,
        compression: report.summary.overallCompressionRatio.toFixed(2),
        score: report.summary.optimizationScore,
      });

      this.emit('analysis:completed', { report, result });
      return report;
    } catch (error) {
      console.error('[Asset Optimization] Asset analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(report: AssetOptimizationReport): AssetRecommendation[] {
    const recommendations: AssetRecommendation[] = [];

    // Image optimization recommendations
    if (report.byType.image) {
      const imageData = report.byType.image;

      if (imageData.optimizationPotential.high > 0) {
        recommendations.push({
          id: `image-optimize-${Date.now()}`,
          type: 'image',
          priority: 'high',
          title: 'Optimize Large Images',
          description: `${imageData.optimizationPotential.high} images can be significantly optimized by resizing and format conversion`,
          assets: report.topOptimizations
            .filter(opt => opt.type === 'image')
            .map(opt => opt.path),
          estimatedSavings: imageData.originalSize - imageData.optimizedSize,
          estimatedImprovement: ((imageData.originalSize - imageData.optimizedSize) / imageData.originalSize) * 100,
          action: {
            type: 'convert',
            parameters: { formats: ['webp', 'avif'], quality: 80 },
            automated: this.state.system.automation.autoConvert,
            riskLevel: 'low',
          },
          status: 'pending',
        });
      }
    }

    // Bundle optimization recommendations
    if (report.summary.totalAssets > this.state.system.thresholds.assetCountThreshold) {
      recommendations.push({
        id: `bundle-optimize-${Date.now()}`,
        type: 'bundle',
        priority: 'medium',
        title: 'Reduce Asset Count',
        description: `Too many individual assets (${report.summary.totalAssets}). Consider bundling or removing unused assets.`,
        assets: [],
        estimatedSavings: (report.summary.totalAssets - this.state.system.thresholds.assetCountThreshold) * 1024,
        estimatedImprovement: 5,
        action: {
          type: 'bundle',
          parameters: {},
          automated: false,
          riskLevel: 'medium',
        },
        status: 'pending',
      });
    }

    // Compression recommendations
    if (report.summary.overallCompressionRatio < this.state.system.thresholds.compressionRatioThreshold) {
      recommendations.push({
        id: `compression-improve-${Date.now()}`,
        type: 'compression',
        priority: 'medium',
        title: 'Improve Compression',
        description: `Current compression ratio (${report.summary.overallCompressionRatio.toFixed(2)}x) is below threshold (${this.state.system.thresholds.compressionRatioThreshold}x)`,
        assets: [],
        estimatedSavings: report.summary.totalOriginalSize * 0.2,
        estimatedImprovement: 15,
        action: {
          type: 'compress',
          parameters: { level: 9, algorithms: ['gzip', 'brotli'] },
          automated: this.state.system.automation.autoCompress,
          riskLevel: 'low',
        },
        status: 'pending',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Check budget compliance
   */
  private async checkBudgetCompliance(report: AssetOptimizationReport): Promise<void> {
    const budgetThresholds = this.state.system.thresholds;

    // Check asset size budget
    const largestAsset = report.topOptimizations[0];
    if (largestAsset && largestAsset.originalSize > budgetThresholds.assetSizeThreshold * 1024 * 1024) {
      const alert: AssetAlert = {
        id: `budget-asset-size-${Date.now()}`,
        severity: 'warning',
        title: 'Asset Size Budget Exceeded',
        message: `Asset ${largestAsset.path} (${(largestAsset.originalSize / 1024 / 1024).toFixed(2)}MB) exceeds budget of ${budgetThresholds.assetSizeThreshold}MB`,
        assets: [largestAsset.path],
        timestamp: new Date(),
        acknowledged: false,
        resolved: false,
      };

      this.state.alerts.push(alert);
      this.emit('alert:created', alert);
    }

    // Check optimization score budget
    if (report.summary.optimizationScore < budgetThresholds.optimizationScoreThreshold) {
      const alert: AssetAlert = {
        id: `budget-score-${Date.now()}`,
        severity: 'warning',
        title: 'Optimization Score Below Target',
        message: `Current optimization score (${report.summary.optimizationScore}) is below target (${budgetThresholds.optimizationScoreThreshold})`,
        timestamp: new Date(),
        acknowledged: false,
        resolved: false,
      };

      this.state.alerts.push(alert);
      this.emit('alert:created', alert);
    }
  }

  /**
   * Generate alerts for critical issues
   */
  private generateAlerts(report: AssetOptimizationReport): void {
    const criticalIssues = report.issues.filter(issue => issue.severity === 'critical');

    criticalIssues.forEach(issue => {
      const alert: AssetAlert = {
        id: `critical-${Date.now()}-${Math.random()}`,
        severity: 'critical',
        title: 'Critical Asset Issue',
        message: issue.message,
        assets: issue.path ? [issue.path] : undefined,
        timestamp: new Date(),
        acknowledged: false,
        resolved: false,
      };

      this.state.alerts.push(alert);
      this.emit('alert:created', alert);
    });
  }

  /**
   * Calculate performance impact of optimizations
   */
  private calculatePerformanceImpact(report: AssetOptimizationReport): AssetOptimizationResult['performanceImpact'] {
    const sizeReduction = report.summary.totalOriginalSize - report.summary.totalOptimizedSize;

    // Estimate performance improvements based on size reduction
    // These are rough estimates based on typical network conditions
    const loadTimeImprovement = (sizeReduction / (1024 * 1024)) * 100; // 100ms per MB reduced

    return {
      loadTimeImprovement: Math.max(0, loadTimeImprovement),
      bundleSizeReduction: sizeReduction,
    };
  }

  /**
   * Start automatic optimization scheduling
   */
  private startAutomaticOptimization(): void {
    if (!this.state.system.schedule.enabled) return;

    const schedule = this.state.system.schedule;
    const interval = this.getIntervalFromFrequency(schedule.frequency);

    this.optimizationTimer = setInterval(async () => {
      if (this.isWithinTimeWindow(schedule.timeWindow)) {
        try {
          await this.performAssetAnalysis();
        } catch (error) {
          console.error('[Asset Optimization] Scheduled optimization failed:', error);
        }
      }
    }, interval);

    console.log(`[Asset Optimization] Automatic scheduling started (${schedule.frequency})`);
  }

  /**
   * Get interval in milliseconds from frequency
   */
  private getIntervalFromFrequency(frequency: OptimizationSchedule['frequency']): number {
    switch (frequency) {
      case 'realtime': return 5 * 60 * 1000; // 5 minutes
      case 'hourly': return 60 * 60 * 1000; // 1 hour
      case 'daily': return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly': return 7 * 24 * 60 * 60 * 1000; // 7 days
      default: return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Check if current time is within optimization window
   */
  private isWithinTimeWindow(timeWindow?: { start: string; end: string }): boolean {
    if (!timeWindow) return true;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = timeWindow.start.split(':').map(Number);
    const [endHour, endMinute] = timeWindow.end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Handle overnight windows (e.g., 22:00 to 04:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Handle budget exceeded events
   */
  private handleBudgetExceeded(budgetStatus: BudgetStatus): void {
    console.warn('[Asset Optimization] Budget exceeded:', budgetStatus);

    if (this.state.system.automation.enforceBudgets) {
      // Trigger immediate optimization
      this.performAssetAnalysis().catch(console.error);
    }

    this.emit('budget:action', {
      action: 'optimization-triggered',
      budget: budgetStatus,
      timestamp: new Date(),
    });
  }

  /**
   * Handle performance degradation events
   */
  private handlePerformanceDegradation(data: any): void {
    console.warn('[Asset Optimization] Performance degradation detected:', data);

    // Check if assets might be causing performance issues
    if (this.state.currentReport) {
      const score = this.state.currentReport.summary.optimizationScore;
      if (score < 60) {
        this.performAssetAnalysis().catch(console.error);
      }
    }
  }

  /**
   * Handle bundle size changes
   */
  private handleBundleSizeChange(bundleAnalysis: BundleAnalysis): void {
    console.log('[Asset Optimization] Bundle size changed:', bundleAnalysis);

    // Trigger analysis if bundle size increases significantly
    if (bundleAnalysis.size > 0) { // Placeholder logic
      this.performAssetAnalysis().catch(console.error);
    }
  }

  /**
   * Get current system state
   */
  getState(): AssetOptimizationState {
    return { ...this.state };
  }

  /**
   * Update system configuration
   */
  updateConfig(config: Partial<AssetOptimizationSystem>): void {
    this.state.system = { ...this.state.system, ...config };

    // Restart scheduling if frequency changed
    if (config.schedule?.frequency && this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.startAutomaticOptimization();
    }

    this.emit('config:updated', { config: this.state.system });
  }

  /**
   * Execute optimization recommendation
   */
  async executeRecommendation(recommendationId: string): Promise<void> {
    const recommendation = this.state.recommendations.find(r => r.id === recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }

    if (recommendation.status !== 'pending') {
      throw new Error(`Recommendation ${recommendationId} is not pending`);
    }

    recommendation.status = 'in-progress';

    try {
      // Execute the optimization action
      await this.executeOptimizationAction(recommendation.action, recommendation.assets);

      recommendation.status = 'completed';
      this.emit('recommendation:executed', { recommendation });
    } catch (error) {
      recommendation.status = 'pending';
      this.emit('recommendation:failed', { recommendation, error });
      throw error;
    }
  }

  /**
   * Execute optimization action
   */
  private async executeOptimizationAction(action: AssetOptimizationAction, assets: string[]): Promise<void> {
    // This would integrate with actual optimization tools
    // For now, we'll just log the action
    console.log(`[Asset Optimization] Executing ${action.type} action on ${assets.length} assets:`, action.parameters);

    // In a real implementation, this would:
    // - Call image optimization utilities
    // - Update asset files
    // - Update references in code
    // - Generate new bundles

    return new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
  }

  /**
   * Event handling
   */
  on(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[Asset Optimization] Event listener error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup system resources
   */
  async cleanup(): Promise<void> {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }

    // Wait for active optimizations to complete
    const activeOptimizations = Array.from(this.state.activeOptimizations.values());
    await Promise.all(activeOptimizations);

    this.eventListeners.clear();
    this.isInitialized = false;

    console.log('[Asset Optimization] System cleaned up');
  }
}

// Singleton instance
export const assetOptimizationSystem = new AssetOptimizationSystemManager();

// Type exports
export type {
  AssetOptimizationSystem,
  OptimizationSchedule,
  SystemThresholds,
  SystemIntegrations,
  AutomationConfig,
  AssetOptimizationState,
  AssetOptimizationResult,
  AssetRecommendation,
  AssetAlert,
  AssetOptimizationAction,
  AssetOptimizationMetrics,
};

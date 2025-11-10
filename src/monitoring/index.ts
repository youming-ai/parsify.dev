/**
 * Bundle Monitoring System Initialization
 * Initializes and configures all bundle monitoring and optimization components
 * Provides unified access to SC-14 compliance monitoring
 */

import { bundleAnalyzer } from "@/analytics/bundle-analyzer";
import { bundleOptimizationEngine } from "./bundle-optimization-engine";
import { sizeBudgetManager } from "./size-budget-manager";
import { realtimeBundleMonitor } from "./realtime-bundle-monitor";
import { bundleOptimizationSystem } from "./bundle-optimization-system";
import { performanceObserver } from "../performance-observer";

export interface MonitoringSystemConfig {
  enabled: boolean;
  environment: "development" | "staging" | "production";
  sc14: {
    enabled: boolean;
    budgetKB: number; // 500KB for SC-14
    enforcement: "passive" | "warning" | "blocking";
    autoOptimize: boolean;
  };
  monitoring: {
    realtime: boolean;
    budget: boolean;
    performance: boolean;
    health: boolean;
  };
  notifications: {
    browser: boolean;
    console: boolean;
    analytics: boolean;
    teams: boolean;
    email: boolean;
  };
  automation: {
    enabled: boolean;
    safeMode: boolean;
    manualApproval: boolean;
    maxRiskLevel: "low" | "medium" | "high";
  };
}

export interface MonitoringSystemStatus {
  initialized: boolean;
  components: {
    analyzer: boolean;
    optimization: boolean;
    budget: boolean;
    realtime: boolean;
    system: boolean;
    performance: boolean;
  };
  health: {
    score: number;
    status: "healthy" | "warning" | "critical";
    issues: string[];
  };
  metrics: {
    lastAnalysis: Date;
    totalSavings: number;
    optimizations: number;
    complianceScore: number;
  };
}

export class BundleMonitoringSystem {
  private static instance: BundleMonitoringSystem;
  private config: MonitoringSystemConfig;
  private status: MonitoringSystemStatus;
  private initialized = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.status = this.getInitialStatus();
  }

  public static getInstance(): BundleMonitoringSystem {
    if (!BundleMonitoringSystem.instance) {
      BundleMonitoringSystem.instance = new BundleMonitoringSystem();
    }
    return BundleMonitoringSystem.instance;
  }

  // Get default configuration based on environment
  private getDefaultConfig(): MonitoringSystemConfig {
    const isDevelopment = process.env.NODE_ENV === "development";
    const isProduction = process.env.NODE_ENV === "production";

    return {
      enabled: true,
      environment:
        (process.env.NODE_ENV as "development" | "staging" | "production") ||
        "development",
      sc14: {
        enabled: true, // SC-14 is always important
        budgetKB: 500, // 500KB requirement
        enforcement: isProduction ? "warning" : "passive",
        autoOptimize: isDevelopment, // Enable in development for testing
      },
      monitoring: {
        realtime: isDevelopment,
        budget: true,
        performance: true,
        health: true,
      },
      notifications: {
        browser: isDevelopment,
        console: true,
        analytics: !isDevelopment,
        teams: false, // Configure as needed
        email: false, // Configure as needed
      },
      automation: {
        enabled: isDevelopment,
        safeMode: true,
        manualApproval: !isDevelopment,
        maxRiskLevel: isDevelopment ? "medium" : "low",
      },
    };
  }

  // Get initial status
  private getInitialStatus(): MonitoringSystemStatus {
    return {
      initialized: false,
      components: {
        analyzer: false,
        optimization: false,
        budget: false,
        realtime: false,
        system: false,
        performance: false,
      },
      health: {
        score: 100,
        status: "healthy",
        issues: [],
      },
      metrics: {
        lastAnalysis: new Date(),
        totalSavings: 0,
        optimizations: 0,
        complianceScore: 100,
      },
    };
  }

  // Initialize the monitoring system
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn("Bundle monitoring system already initialized");
      return;
    }

    if (!this.config.enabled) {
      console.log("Bundle monitoring system is disabled");
      return;
    }

    try {
      console.log("🚀 Initializing Bundle Monitoring System...");
      console.log(`Environment: ${this.config.environment}`);
      console.log(
        `SC-14 Compliance: ${this.config.sc14.enabled ? "Enabled" : "Disabled"} (${this.config.sc14.budgetKB}KB limit)`,
      );

      // Initialize core components
      await this.initializeCoreComponents();

      // Configure SC-14 compliance
      await this.configureSC14Compliance();

      // Setup monitoring based on configuration
      await this.setupMonitoring();

      // Setup notifications
      this.setupNotifications();

      // Initialize automation if enabled
      if (this.config.automation.enabled) {
        await this.initializeAutomation();
      }

      // Run initial analysis
      await this.runInitialAnalysis();

      this.initialized = true;
      this.status.initialized = true;

      console.log("✅ Bundle Monitoring System initialized successfully");
      this.logSystemStatus();
    } catch (error) {
      console.error("❌ Failed to initialize Bundle Monitoring System:", error);
      throw error;
    }
  }

  // Initialize core components
  private async initializeCoreComponents(): Promise<void> {
    console.log("📦 Initializing core components...");

    // Bundle analyzer is always available (no initialization needed)
    this.status.components.analyzer = true;

    // Bundle optimization engine
    this.status.components.optimization = true;

    // Size budget manager
    this.status.components.budget = true;

    // Real-time monitor
    if (this.config.monitoring.realtime) {
      this.status.components.realtime = true;
    }

    // Bundle optimization system
    this.status.components.system = true;

    // Performance observer
    this.status.components.performance = true;

    console.log("✅ Core components initialized");
  }

  // Configure SC-14 compliance
  private async configureSC14Compliance(): Promise<void> {
    if (!this.config.sc14.enabled) {
      console.log("SC-14 compliance monitoring is disabled");
      return;
    }

    console.log("⚖️ Configuring SC-14 compliance...");

    // Configure budget manager with SC-14 requirements
    const budgetConfig = {
      totalBudget: this.config.sc14.budgetKB * 1024, // Convert to bytes
      enforcementLevel: this.config.sc14.enforcement,
      toleranceLevel: 5, // 5% tolerance
      gracePeriod: this.config.environment === "production" ? 1 : 24, // hours
    };

    sizeBudgetManager.updateConstraints(budgetConfig);

    // Configure optimization engine for SC-14 compliance
    const optimizationConfig = {
      enabled: true,
      aggressiveMode: false,
      autoApplySafeOptimizations: this.config.sc14.autoOptimize,
      targetBudget: this.config.sc14.budgetKB * 1024,
      maxRiskLevel: this.config.automation.maxRiskLevel,
    };

    bundleOptimizationEngine.updateConfig(optimizationConfig);

    // Configure real-time monitor for SC-14
    if (this.config.monitoring.realtime) {
      const realtimeConfig = {
        enabled: true,
        updateInterval:
          this.config.environment === "production" ? 60000 : 30000, // 1 min prod, 30 sec dev
        enableNotifications:
          this.config.notifications.browser ||
          this.config.notifications.console,
        thresholds: {
          sizeWarning: 85, // 85% of SC-14 budget
          sizeCritical: 95, // 95% of SC-14 budget
          complianceWarning: 85,
          complianceCritical: 70,
        },
      };

      realtimeBundleMonitor.updateConfig(realtimeConfig);
    }

    // Configure bundle optimization system
    const systemConfig = {
      enabled: true,
      autoMode: this.config.sc14.autoOptimize && this.config.automation.enabled,
      schedule: {
        enabled: true,
        frequency:
          this.config.environment === "production" ? "daily" : "hourly",
      },
      thresholds: {
        budgetThreshold: 90,
        complianceThreshold: 80,
        riskThreshold: 0.7,
      },
      automation: {
        autoOptimize: this.config.sc14.autoOptimize,
        autoDeploy: false,
        safeMode: this.config.automation.safeMode,
        manualApproval: this.config.automation.manualApproval,
        maxRiskLevel: this.config.automation.maxRiskLevel,
      },
    };

    bundleOptimizationSystem.updateConfig(systemConfig);

    console.log("✅ SC-14 compliance configured");
  }

  // Setup monitoring
  private async setupMonitoring(): Promise<void> {
    console.log("🔍 Setting up monitoring...");

    // Start budget monitoring
    if (this.config.monitoring.budget) {
      const interval = this.config.environment === "production" ? 60 : 30; // minutes
      sizeBudgetManager.startMonitoring(interval);
      console.log("✅ Budget monitoring started");
    }

    // Start real-time monitoring
    if (this.config.monitoring.realtime) {
      realtimeBundleMonitor.startMonitoring();
      console.log("✅ Real-time monitoring started");
    }

    // Setup event listeners
    this.setupEventListeners();

    console.log("✅ Monitoring setup completed");
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Listen to real-time alerts
    realtimeBundleMonitor.addEventListener("alert", (event) => {
      this.handleRealtimeAlert(event.data);
    });

    // Listen to optimization system events
    bundleOptimizationSystem.addEventListener("violation-detected", (event) => {
      this.handleViolationDetected(event.data);
    });

    bundleOptimizationSystem.addEventListener(
      "compliance-achieved",
      (event) => {
        this.handleComplianceAchieved(event.data);
      },
    );
  }

  // Handle real-time alerts
  private handleRealtimeAlert(alert: any): void {
    console.log("🚨 Real-time alert received:", alert.title);

    // Send notifications based on configuration
    if (this.config.notifications.console) {
      const severity =
        alert.severity === "critical"
          ? "error"
          : alert.severity === "error"
            ? "error"
            : alert.severity === "warning"
              ? "warn"
              : "log";
      console[severity](`[BUNDLE ALERT] ${alert.title}: ${alert.message}`);
    }

    // In production, you might send to analytics, teams, etc.
    if (
      this.config.environment === "production" &&
      this.config.notifications.analytics
    ) {
      // Send to analytics service
      this.sendToAnalytics("bundle_alert", alert);
    }
  }

  // Handle violation detected
  private handleViolationDetected(data: any): void {
    console.warn("⚠️ SC-14 violation detected:", data);

    // Update health status
    this.status.health.score = Math.max(0, this.status.health.score - 20);
    if (this.status.health.score < 70) {
      this.status.health.status = "critical";
    } else if (this.status.health.score < 85) {
      this.status.health.status = "warning";
    }

    this.status.health.issues.push("SC-14 compliance violation detected");

    // Send notifications
    this.sendComplianceAlert("violation", data);
  }

  // Handle compliance achieved
  private handleComplianceAchieved(data: any): void {
    console.log("✅ SC-14 compliance achieved:", data);

    // Update health status
    this.status.health.score = Math.min(100, this.status.health.score + 10);
    if (this.status.health.score >= 90) {
      this.status.health.status = "healthy";
    } else if (this.status.health.score >= 70) {
      this.status.health.status = "warning";
    }

    // Remove compliance issues
    this.status.health.issues = this.status.health.issues.filter(
      (issue) => !issue.includes("SC-14 compliance"),
    );

    // Send success notification
    this.sendComplianceAlert("success", data);
  }

  // Setup notifications
  private setupNotifications(): void {
    if (
      !this.config.notifications.browser &&
      !this.config.notifications.console
    ) {
      return;
    }

    console.log("📢 Setting up notifications...");

    // Request browser notification permission
    if (this.config.notifications.browser) {
      realtimeBundleMonitor.requestNotificationPermission().then((granted) => {
        console.log(
          `Browser notifications ${granted ? "enabled" : "disabled"}`,
        );
      });
    }

    console.log("✅ Notifications setup completed");
  }

  // Initialize automation
  private async initializeAutomation(): Promise<void> {
    if (!this.config.automation.enabled) {
      console.log("Automation is disabled");
      return;
    }

    console.log("🤖 Initializing automation...");

    try {
      // Start the bundle optimization system
      await bundleOptimizationSystem.start();

      console.log("✅ Automation initialized");
    } catch (error) {
      console.error("❌ Failed to initialize automation:", error);
    }
  }

  // Run initial analysis
  private async runInitialAnalysis(): Promise<void> {
    console.log("📊 Running initial bundle analysis...");

    try {
      const analysis = await bundleAnalyzer.analyzeBundle();

      // Update metrics
      this.status.metrics.lastAnalysis = new Date();
      this.status.metrics.complianceScore = analysis.compliance.complianceScore;

      // Log analysis results
      console.log(`📈 Analysis completed:`);
      console.log(`  - Total size: ${Math.round(analysis.totalSize / 1024)}KB`);
      console.log(
        `  - SC-14 compliance: ${analysis.compliance.complianceStatus}`,
      );
      console.log(
        `  - Compliance score: ${analysis.compliance.complianceScore}`,
      );
      console.log(
        `  - Budget utilization: ${analysis.compliance.budgetUtilization.toFixed(1)}%`,
      );
      console.log(
        `  - Optimization opportunities: ${analysis.optimization.recommendations.length}`,
      );

      // Check SC-14 compliance
      if (analysis.compliance.complianceStatus !== "compliant") {
        console.warn(
          `⚠️ SC-14 compliance issue: ${
            analysis.compliance.overageAmount > 0
              ? `${Math.round(analysis.compliance.overageAmount / 1024)}KB over budget`
              : "Approaching budget limit"
          }`,
        );

        if (this.config.sc14.autoOptimize) {
          console.log("🔧 Starting automatic optimization...");
          bundleOptimizationSystem.runOptimizationIfNeeded().then((success) => {
            console.log(
              `Automatic optimization ${success ? "succeeded" : "failed"}`,
            );
          });
        }
      } else {
        console.log("✅ SC-14 compliant: Bundle size within 500KB limit");
      }
    } catch (error) {
      console.error("❌ Initial analysis failed:", error);
    }
  }

  // Send to analytics (placeholder implementation)
  private sendToAnalytics(event: string, data: any): void {
    // In a real implementation, this would send to your analytics service
    console.log(`[ANALYTICS] ${event}:`, data);
  }

  // Send compliance alert
  private sendComplianceAlert(type: "violation" | "success", data: any): void {
    const message =
      type === "violation"
        ? `SC-14 Compliance Violation: Bundle exceeds 500KB limit`
        : `SC-14 Compliance Achieved: Bundle within 500KB limit`;

    if (this.config.notifications.console) {
      console.log(type === "violation" ? "⚠️" : "✅", message);
    }

    // Send to other notification channels based on configuration
    if (this.config.notifications.analytics) {
      this.sendToAnalytics("sc14_compliance", { type, data });
    }
  }

  // Log system status
  private logSystemStatus(): void {
    console.log("📋 Bundle Monitoring System Status:");
    console.log(`  - Environment: ${this.config.environment}`);
    console.log(
      `  - SC-14 Compliance: ${this.config.sc14.enabled ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `  - Real-time Monitoring: ${this.config.monitoring.realtime ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `  - Budget Monitoring: ${this.config.monitoring.budget ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `  - Automation: ${this.config.automation.enabled ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `  - Health Score: ${this.status.health.score}/100 (${this.status.health.status})`,
    );
    console.log(
      `  - Components: ${Object.values(this.status.components).filter(Boolean).length}/${Object.keys(this.status.components).length} active`,
    );
  }

  // Public API methods

  // Get system configuration
  public getConfig(): MonitoringSystemConfig {
    return { ...this.config };
  }

  // Update configuration
  public updateConfig(newConfig: Partial<MonitoringSystemConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // If key settings changed, reinitialize
    const needsReinit =
      oldConfig.enabled !== this.config.enabled ||
      oldConfig.sc14.enabled !== this.config.sc14.enabled ||
      oldConfig.monitoring.realtime !== this.config.monitoring.realtime ||
      oldConfig.automation.enabled !== this.config.automation.enabled;

    if (needsReinit && this.initialized) {
      console.log(
        "🔄 Reinitializing monitoring system due to configuration changes",
      );
      this.shutdown().then(() => {
        this.initialize().catch(console.error);
      });
    }
  }

  // Get system status
  public getStatus(): MonitoringSystemStatus {
    return { ...this.status };
  }

  // Get SC-14 compliance status
  public async getSC14Status(): Promise<{
    compliant: boolean;
    currentSize: number;
    budgetLimit: number;
    utilization: number;
    score: number;
    issues: string[];
    recommendations: number;
    lastCheck: Date;
  }> {
    const analysis = await bundleAnalyzer.analyzeBundle();

    return {
      compliant: analysis.compliance.complianceStatus === "compliant",
      currentSize: analysis.totalSize,
      budgetLimit: this.config.sc14.budgetKB * 1024,
      utilization: analysis.compliance.budgetUtilization,
      score: analysis.compliance.complianceScore,
      issues: analysis.compliance.criticalIssues.map(
        (issue) => issue.description,
      ),
      recommendations: analysis.optimization.recommendations.length,
      lastCheck: new Date(),
    };
  }

  // Run on-demand analysis
  public async runAnalysis(): Promise<any> {
    if (!this.initialized) {
      throw new Error("Monitoring system not initialized");
    }

    return await bundleOptimizationSystem.generateOptimizationReport();
  }

  // Run on-demand optimization
  public async runOptimization(): Promise<any> {
    if (!this.initialized) {
      throw new Error("Monitoring system not initialized");
    }

    if (!this.config.sc14.autoOptimize) {
      throw new Error("Automatic optimization is disabled");
    }

    return await bundleOptimizationSystem.runOptimizationIfNeeded();
  }

  // Enable/disable SC-14 compliance
  public setSC14Compliance(enabled: boolean, autoOptimize?: boolean): void {
    this.config.sc14.enabled = enabled;
    if (autoOptimize !== undefined) {
      this.config.sc14.autoOptimize = autoOptimize;
    }

    console.log(`SC-14 compliance ${enabled ? "enabled" : "disabled"}`);
    console.log(
      `Auto-optimization ${this.config.sc14.autoOptimize ? "enabled" : "disabled"}`,
    );

    // Reconfigure if initialized
    if (this.initialized) {
      this.configureSC14Compliance().catch(console.error);
    }
  }

  // Get comprehensive health report
  public async getHealthReport(): Promise<{
    overall: {
      score: number;
      status: "healthy" | "warning" | "critical";
    };
    sc14: any;
    performance: any;
    budget: any;
    optimizations: any;
    timestamp: Date;
  }> {
    const sc14Status = await this.getSC14Status();
    const systemStatus = bundleOptimizationSystem.getStatus();
    const realtimeState = realtimeBundleMonitor.getState();

    return {
      overall: this.status.health,
      sc14: sc14Status,
      performance: {
        score: this.status.metrics.complianceScore,
        metrics: realtimeState.performance,
      },
      budget: {
        status: sizeBudgetManager.getMonitoringStatus(),
        health: realtimeState.health,
      },
      optimizations: {
        total: this.status.metrics.optimizations,
        savings: this.status.metrics.totalSavings,
        successRate: systemStatus.metrics.successRate,
        opportunities: realtimeState.optimizations.length,
      },
      timestamp: new Date(),
    };
  }

  // Shutdown the monitoring system
  public async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log("🛑 Shutting down Bundle Monitoring System...");

    try {
      // Stop components
      realtimeBundleMonitor.stopMonitoring();
      sizeBudgetManager.stopMonitoring();
      bundleOptimizationSystem.stop();

      // Reset status
      this.initialized = false;
      this.status.initialized = false;
      Object.keys(this.status.components).forEach((key) => {
        (this.status.components as any)[key] = false;
      });

      console.log("✅ Bundle Monitoring System shutdown completed");
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
    }
  }

  // Reset the system
  public async reset(): Promise<void> {
    console.log("🔄 Resetting Bundle Monitoring System...");

    await this.shutdown();
    this.config = this.getDefaultConfig();
    this.status = this.getInitialStatus();

    console.log("✅ Bundle Monitoring System reset completed");
  }
}

// Export singleton instance
export const bundleMonitoringSystem = BundleMonitoringSystem.getInstance();

// Convenience function for initialization
export const initializeBundleMonitoring = async (
  config?: Partial<MonitoringSystemConfig>,
): Promise<void> => {
  if (config) {
    bundleMonitoringSystem.updateConfig(config);
  }
  await bundleMonitoringSystem.initialize();
};

// Export SC-14 specific convenience functions
export const checkSC14Compliance = async (): Promise<any> => {
  return await bundleMonitoringSystem.getSC14Status();
};

export const optimizeForSC14 = async (): Promise<any> => {
  return await bundleMonitoringSystem.runOptimization();
};

export const getBundleHealthReport = async (): Promise<any> => {
  return await bundleMonitoringSystem.getHealthReport();
};

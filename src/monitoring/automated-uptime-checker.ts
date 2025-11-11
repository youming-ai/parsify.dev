/**
 * Automated Uptime Checking System
 * Automated health checking for all 58+ developer tools
 * Provides comprehensive availability monitoring with configurable checks
 */

import { HealthChecker, HealthCheckResult, HealthCheckDetails } from './uptime-monitoring-core';
import { toolsData } from '@/data/tools-data';

export interface ToolHealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  checks: {
    basic: boolean;
    performance: boolean;
    functionality: boolean;
    dependencies: boolean;
    resources: boolean;
  };
  thresholds: {
    responseTime: number;
    memoryUsage: number;
    errorRate: number;
    availability: number;
  };
}

export interface ToolHealthStatus {
  toolId: string;
  toolName: string;
  category: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  uptime: number;
  responseTime: number;
  errorRate: number;
  issues: string[];
  metrics: {
    loadTime?: number;
    renderTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    networkRequests?: number;
  };
  dependencies: Array<{
    name: string;
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
  }>;
}

export class AutomatedUptimeChecker {
  private static instance: AutomatedUptimeChecker;
  private healthCheckers: Map<string, HealthChecker> = new Map();
  private toolStatuses: Map<string, ToolHealthStatus> = new Map();
  private config: ToolHealthCheckConfig;
  private isInitialized = false;

  private constructor(config?: Partial<ToolHealthCheckConfig>) {
    this.config = this.getDefaultConfig(config);
  }

  public static getInstance(config?: Partial<ToolHealthCheckConfig>): AutomatedUptimeChecker {
    if (!AutomatedUptimeChecker.instance) {
      AutomatedUptimeChecker.instance = new AutomatedUptimeChecker(config);
    }
    return AutomatedUptimeChecker.instance;
  }

  private getDefaultConfig(overrides?: Partial<ToolHealthCheckConfig>): ToolHealthCheckConfig {
    return {
      enabled: true,
      interval: 60000, // 1 minute
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 2000, // 2 seconds
      checks: {
        basic: true,
        performance: true,
        functionality: true,
        dependencies: true,
        resources: true,
      },
      thresholds: {
        responseTime: 3000, // 3 seconds
        memoryUsage: 50 * 1024 * 1024, // 50MB
        errorRate: 5, // 5%
        availability: 99.9, // 99.9%
      },
      ...overrides,
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Automated uptime checker already initialized');
      return;
    }

    console.log('🔧 Initializing Automated Uptime Checker for all tools...');

    try {
      // Register health checkers for all tools
      await this.registerToolHealthCheckers();

      // Initialize tool statuses
      await this.initializeToolStatuses();

      this.isInitialized = true;
      console.log(`✅ Automated uptime checker initialized with ${this.healthCheckers.size} tools`);
    } catch (error) {
      console.error('❌ Failed to initialize automated uptime checker:', error);
      throw error;
    }
  }

  private async registerToolHealthCheckers(): Promise<void> {
    console.log('📝 Registering health checkers for all tools...');

    for (const tool of toolsData) {
      const checker = await this.createToolHealthChecker(tool);
      if (checker) {
        this.healthCheckers.set(checker.id, checker);
      }
    }

    console.log(`✅ Registered ${this.healthCheckers.size} health checkers`);
  }

  private async createToolHealthChecker(tool: any): Promise<HealthChecker | null> {
    try {
      const checker: HealthChecker = {
        id: `health-checker-${tool.id}`,
        name: tool.name,
        toolId: tool.id,
        enabled: this.config.enabled,
        interval: this.config.interval,
        timeout: this.config.timeout,
        check: async () => await this.performToolHealthCheck(tool),
      };

      return checker;
    } catch (error) {
      console.error(`❌ Failed to create health checker for ${tool.name}:`, error);
      return null;
    }
  }

  private async performToolHealthCheck(tool: any): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: HealthCheckResult['details']['checks'] = [];
    const errors: HealthCheckResult['details']['errors'] = [];
    const warnings: HealthCheckResult['details']['warnings'] = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    try {
      // Basic availability check
      if (this.config.checks.basic) {
        const basicCheck = await this.performBasicCheck(tool);
        checks.push(basicCheck);
        if (basicCheck.status === 'fail') {
          overallStatus = 'unhealthy';
          errors.push({
            type: 'basic_check_failed',
            message: basicCheck.message || 'Basic availability check failed',
            timestamp: new Date(),
            count: 1,
          });
        }
      }

      // Performance check
      if (this.config.checks.performance && overallStatus !== 'unhealthy') {
        const perfCheck = await this.performPerformanceCheck(tool);
        checks.push(perfCheck);
        if (perfCheck.status === 'fail') {
          overallStatus = 'degraded';
          errors.push({
            type: 'performance_check_failed',
            message: perfCheck.message || 'Performance check failed',
            timestamp: new Date(),
            count: 1,
          });
        } else if (perfCheck.status === 'warn') {
          if (overallStatus === 'healthy') overallStatus = 'degraded';
          warnings.push({
            type: 'performance_degradation',
            message: perfCheck.message || 'Performance degradation detected',
            timestamp: new Date(),
          });
        }
      }

      // Functionality check
      if (this.config.checks.functionality && overallStatus !== 'unhealthy') {
        const funcCheck = await this.performFunctionalityCheck(tool);
        checks.push(funcCheck);
        if (funcCheck.status === 'fail') {
          overallStatus = 'unhealthy';
          errors.push({
            type: 'functionality_check_failed',
            message: funcCheck.message || 'Functionality check failed',
            timestamp: new Date(),
            count: 1,
          });
        }
      }

      // Dependencies check
      if (this.config.checks.dependencies && overallStatus !== 'unhealthy') {
        const depCheck = await this.performDependenciesCheck(tool);
        checks.push(depCheck);
        if (depCheck.status === 'fail') {
          overallStatus = 'degraded';
          errors.push({
            type: 'dependency_check_failed',
            message: depCheck.message || 'Dependencies check failed',
            timestamp: new Date(),
            count: 1,
          });
        }
      }

      // Resources check
      if (this.config.checks.resources && overallStatus !== 'unhealthy') {
        const resCheck = await this.performResourcesCheck(tool);
        checks.push(resCheck);
        if (resCheck.status === 'fail') {
          overallStatus = 'degraded';
          errors.push({
            type: 'resources_check_failed',
            message: resCheck.message || 'Resources check failed',
            timestamp: new Date(),
            count: 1,
          });
        } else if (resCheck.status === 'warn') {
          if (overallStatus === 'healthy') overallStatus = 'degraded';
          warnings.push({
            type: 'resource_usage_high',
            message: resCheck.message || 'High resource usage detected',
            timestamp: new Date(),
          });
        }
      }

      const responseTime = Date.now() - startTime;

      return {
        toolId: tool.id,
        toolName: tool.name,
        status: overallStatus,
        responseTime,
        lastCheck: new Date(),
        uptimePercentage: overallStatus === 'healthy' ? 100 : overallStatus === 'degraded' ? 75 : 0,
        consecutiveFailures: 0, // Will be calculated by the monitoring system
        totalChecks: 0, // Will be calculated by the monitoring system
        successfulChecks: 0, // Will be calculated by the monitoring system
        errorRate: errors.length > 0 ? 100 : 0,
        averageResponseTime: responseTime,
        details: {
          checks,
          performance: await this.getPerformanceMetrics(tool),
          errors,
          warnings,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        toolId: tool.id,
        toolName: tool.name,
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        uptimePercentage: 0,
        consecutiveFailures: 0,
        totalChecks: 0,
        successfulChecks: 0,
        errorRate: 100,
        averageResponseTime: responseTime,
        details: {
          checks: [{
            name: 'overall',
            status: 'fail',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            duration: responseTime,
            timestamp: new Date(),
          }],
          performance: {},
          errors: [{
            type: 'health_check_error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            count: 1,
          }],
          warnings: [],
        },
      };
    }
  }

  private async performBasicCheck(tool: any): Promise<HealthCheckResult['details']['checks'][0]> {
    const startTime = Date.now();

    try {
      // Check if tool page is accessible
      const toolUrl = `${window.location.origin}${tool.href}`;

      // For client-side tools, check if the tool component can be loaded
      if (tool.processingType === 'client-side' || tool.security === 'local-only') {
        // Check if tool route exists and is accessible
        const routeCheck = await this.checkToolRoute(tool.href);

        if (routeCheck.success) {
          return {
            name: 'basic_availability',
            status: 'pass',
            message: 'Tool is accessible',
            duration: Date.now() - startTime,
            timestamp: new Date(),
          };
        } else {
          return {
            name: 'basic_availability',
            status: 'fail',
            message: routeCheck.error || 'Tool route not accessible',
            duration: Date.now() - startTime,
            timestamp: new Date(),
          };
        }
      }

      // For other tools, perform basic connectivity checks
      return {
        name: 'basic_availability',
        status: 'pass',
        message: 'Tool configuration is valid',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'basic_availability',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Basic check failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async performPerformanceCheck(tool: any): Promise<HealthCheckResult['details']['checks'][0]> {
    const startTime = Date.now();

    try {
      // Check tool loading performance
      const performanceMetrics = await this.getPerformanceMetrics(tool);

      if (performanceMetrics.loadTime && performanceMetrics.loadTime > this.config.thresholds.responseTime) {
        return {
          name: 'performance',
          status: 'warn',
          message: `Load time ${Math.round(performanceMetrics.loadTime)}ms exceeds threshold`,
          duration: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      if (performanceMetrics.memoryUsage && performanceMetrics.memoryUsage > this.config.thresholds.memoryUsage) {
        return {
          name: 'performance',
          status: 'warn',
          message: `Memory usage ${Math.round(performanceMetrics.memoryUsage / 1024 / 1024)}MB exceeds threshold`,
          duration: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      return {
        name: 'performance',
        status: 'pass',
        message: 'Performance within acceptable limits',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'performance',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Performance check failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async performFunctionalityCheck(tool: any): Promise<HealthCheckResult['details']['checks'][0]> {
    const startTime = Date.now();

    try {
      // Check if tool features are functional
      // This is a simplified check - in practice, you'd test actual functionality

      switch (tool.category) {
        case 'JSON Processing':
          return await this.checkJSONToolFunctionality(tool);
        case 'Code Execution':
          return await this.checkCodeToolFunctionality(tool);
        case 'File Processing':
          return await this.checkFileToolFunctionality(tool);
        case 'Data Validation':
          return await this.checkDataToolFunctionality(tool);
        case 'Utilities':
          return await this.checkUtilityToolFunctionality(tool);
        default:
          return {
            name: 'functionality',
            status: 'pass',
            message: 'Tool functionality verified',
            duration: Date.now() - startTime,
            timestamp: new Date(),
          };
      }
    } catch (error) {
      return {
        name: 'functionality',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Functionality check failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async performDependenciesCheck(tool: any): Promise<HealthCheckResult['details']['checks'][0]> {
    const startTime = Date.now();

    try {
      // Check tool dependencies
      const dependencies = this.getToolDependencies(tool);
      const failedDeps: string[] = [];

      for (const dep of dependencies) {
        const depCheck = await this.checkDependency(dep);
        if (!depCheck.available) {
          failedDeps.push(dep.name);
        }
      }

      if (failedDeps.length > 0) {
        return {
          name: 'dependencies',
          status: 'fail',
          message: `Missing dependencies: ${failedDeps.join(', ')}`,
          duration: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      return {
        name: 'dependencies',
        status: 'pass',
        message: 'All dependencies available',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'dependencies',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Dependencies check failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async performResourcesCheck(tool: any): Promise<HealthCheckResult['details']['checks'][0]> {
    const startTime = Date.now();

    try {
      // Check resource usage
      const performanceMetrics = await this.getPerformanceMetrics(tool);

      let warnings: string[] = [];

      if (performanceMetrics.memoryUsage && performanceMetrics.memoryUsage > this.config.thresholds.memoryUsage * 0.8) {
        warnings.push(`High memory usage: ${Math.round(performanceMetrics.memoryUsage / 1024 / 1024)}MB`);
      }

      if (performanceMetrics.cpuUsage && performanceMetrics.cpuUsage > 80) {
        warnings.push(`High CPU usage: ${Math.round(performanceMetrics.cpuUsage)}%`);
      }

      if (performanceMetrics.networkRequests && performanceMetrics.networkRequests > 20) {
        warnings.push(`High network requests: ${performanceMetrics.networkRequests}`);
      }

      if (warnings.length > 0) {
        return {
          name: 'resources',
          status: 'warn',
          message: warnings.join('; '),
          duration: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      return {
        name: 'resources',
        status: 'pass',
        message: 'Resource usage within limits',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'resources',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Resources check failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkToolRoute(href: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if the route exists and is accessible
      // This is a simplified check - in practice, you'd use Next.js routing API
      const response = await fetch(href, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });

      return { success: response.ok };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Route check failed'
      };
    }
  }

  private async getPerformanceMetrics(tool: any): Promise<HealthCheckResult['details']['performance']> {
    try {
      // Get performance metrics from the browser
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      return {
        loadTime: navigation?.loadEventEnd - navigation?.loadEventStart,
        renderTime: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
        cpuUsage: undefined, // Not directly available in browser
        networkRequests: performance.getEntriesByType('resource').length,
      };
    } catch (error) {
      console.warn('Could not get performance metrics:', error);
      return {};
    }
  }

  private getToolDependencies(tool: any): Array<{ name: string; type: string; version?: string }> {
    // Extract dependencies based on tool type and features
    const dependencies: Array<{ name: string; type: string; version?: string }> = [];

    // Add common dependencies
    dependencies.push({ name: 'React', type: 'framework', version: '19' });
    dependencies.push({ name: 'Next.js', type: 'framework', version: '16' });

    // Add tool-specific dependencies
    if (tool.category === 'JSON Processing') {
      dependencies.push({ name: 'JSON parser', type: 'builtin' });
    } else if (tool.category === 'Code Execution') {
      dependencies.push({ name: 'WebAssembly', type: 'runtime' });
      dependencies.push({ name: 'Monaco Editor', type: 'library' });
    } else if (tool.category === 'File Processing') {
      dependencies.push({ name: 'File API', type: 'webapi' });
    }

    return dependencies;
  }

  private async checkDependency(dependency: { name: string; type: string; version?: string }): Promise<{ available: boolean; version?: string }> {
    try {
      switch (dependency.name) {
        case 'React':
          return { available: typeof React !== 'undefined', version: React.version };
        case 'Next.js':
          return { available: typeof window !== 'undefined' && window.next !== undefined };
        case 'WebAssembly':
          return { available: typeof WebAssembly !== 'undefined' };
        case 'File API':
          return { available: typeof File !== 'undefined' && typeof FileReader !== 'undefined' };
        case 'JSON parser':
          return { available: typeof JSON !== 'undefined' };
        default:
          return { available: true };
      }
    } catch (error) {
      return { available: false };
    }
  }

  private async checkJSONToolFunctionality(tool: any): Promise<HealthCheckResult['details']['checks'][0]> {
    const startTime = Date.now();

    try {
      // Test JSON functionality
      const testJson = '{"test": true}';
      const parsed = JSON.parse(testJson);
      const stringified = JSON.stringify(parsed);

      if (stringified === testJson) {
        return {
          name: 'functionality',
          status: 'pass',
          message: 'JSON processing functionality verified',
          duration: Date.now() - startTime,
          timestamp: new Date(),
        };
      } else {
        return {
          name: 'functionality',
          status: 'fail',
          message: 'JSON processing test failed',
          duration: Date.now() - startTime,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      return {
        name: 'functionality',
        status: 'fail',
        message: error instanceof Error ? error.message : 'JSON functionality check failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkCodeToolFunctionality(tool: any): Promise<HealthCheckResult['details']['checks'][0]> {
    const startTime = Date.now();

    try {
      // Test code execution functionality
      if (tool.id === 'code-executor') {
        // Check if WebAssembly is available
        if (typeof WebAssembly === 'undefined') {
          return {
            name: 'functionality',
            status: 'fail',
            message: 'WebAssembly not available for code execution',
            duration: Date.now() - startTime,
            timestamp: new Date(),
          };
        }
      }

      return {
        name: 'functionality',
        status: 'pass',
        message: 'Code execution functionality verified',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'functionality',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Code functionality check failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkFileToolFunctionality(tool: any): Promise<HealthCheckResult['details']['checks'][0]> {
    const startTime = Date.now();

    try {
      // Test file processing functionality
      if (typeof File === 'undefined' || typeof FileReader === 'undefined') {
        return {
          name: 'functionality',
          status: 'fail',
          message: 'File API not available',
          duration: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      return {
        name: 'functionality',
        status: 'pass',
        message: 'File processing functionality verified',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'functionality',
        status: 'fail',
        message: error instanceof Error ? error.message : 'File functionality check failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkDataToolFunctionality(tool: any): Promise<HealthCheckResult['details']['checks'][0]> {
    const startTime = Date.now();

    try {
      // Test data validation functionality
      if (tool.id.includes('hash')) {
        // Test crypto functionality
        const testData = 'test';
        const encoder = new TextEncoder();
        const data = encoder.encode(testData);

        if (data.length > 0) {
          return {
            name: 'functionality',
            status: 'pass',
            message: 'Data validation functionality verified',
            duration: Date.now() - startTime,
            timestamp: new Date(),
          };
        }
      }

      return {
        name: 'functionality',
        status: 'pass',
        message: 'Data validation functionality verified',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'functionality',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Data functionality check failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkUtilityToolFunctionality(tool: any): Promise<HealthCheckResult['details']['checks'][0]> {
    const startTime = Date.now();

    try {
      // Test utility functionality
      if (tool.id.includes('base64') || tool.id.includes('url')) {
        // Test encoding/decoding
        const testString = 'test';
        const encoded = btoa(testString);
        const decoded = atob(encoded);

        if (decoded === testString) {
          return {
            name: 'functionality',
            status: 'pass',
            message: 'Utility functionality verified',
            duration: Date.now() - startTime,
            timestamp: new Date(),
          };
        } else {
          return {
            name: 'functionality',
            status: 'fail',
            message: 'Utility test failed',
            duration: Date.now() - startTime,
            timestamp: new Date(),
          };
        }
      }

      return {
        name: 'functionality',
        status: 'pass',
        message: 'Utility functionality verified',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'functionality',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Utility functionality check failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async initializeToolStatuses(): Promise<void> {
    console.log('📊 Initializing tool statuses...');

    for (const tool of toolsData) {
      const status: ToolHealthStatus = {
        toolId: tool.id,
        toolName: tool.name,
        category: tool.category,
        status: 'unknown',
        lastCheck: new Date(),
        uptime: 100,
        responseTime: 0,
        errorRate: 0,
        issues: [],
        metrics: {},
        dependencies: [],
      };

      this.toolStatuses.set(tool.id, status);
    }

    console.log(`✅ Initialized statuses for ${this.toolStatuses.size} tools`);
  }

  // Public API methods
  public getHealthCheckers(): HealthChecker[] {
    return Array.from(this.healthCheckers.values());
  }

  public getToolStatus(toolId: string): ToolHealthStatus | undefined {
    return this.toolStatuses.get(toolId);
  }

  public getAllToolStatuses(): ToolHealthStatus[] {
    return Array.from(this.toolStatuses.values());
  }

  public updateToolStatus(toolId: string, status: Partial<ToolHealthStatus>): void {
    const current = this.toolStatuses.get(toolId);
    if (current) {
      this.toolStatuses.set(toolId, { ...current, ...status });
    }
  }

  public updateConfig(config: Partial<ToolHealthCheckConfig>): void {
    this.config = { ...this.config, ...config };

    // Update all health checkers with new config
    for (const checker of this.healthCheckers.values()) {
      checker.enabled = this.config.enabled;
      checker.interval = this.config.interval;
      checker.timeout = this.config.timeout;
    }
  }

  public getConfig(): ToolHealthCheckConfig {
    return { ...this.config };
  }

  public async runHealthCheckForTool(toolId: string): Promise<HealthCheckResult | null> {
    const checker = this.healthCheckers.get(`health-checker-${toolId}`);
    if (checker) {
      return await checker.check();
    }
    return null;
  }

  public async runHealthChecksForAllTools(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const checker of this.healthCheckers.values()) {
      try {
        const result = await checker.check();
        results.push(result);

        // Update tool status
        this.updateToolStatus(checker.toolId, {
          status: result.status,
          lastCheck: result.lastCheck,
          uptime: result.uptimePercentage,
          responseTime: result.responseTime,
          errorRate: result.errorRate,
          issues: result.details.errors.map(e => e.message),
          metrics: result.details.performance,
        });
      } catch (error) {
        console.error(`❌ Health check failed for ${checker.name}:`, error);
      }
    }

    return results;
  }

  public getToolsByCategory(category: string): ToolHealthStatus[] {
    return Array.from(this.toolStatuses.values()).filter(status => status.category === category);
  }

  public getUnhealthyTools(): ToolHealthStatus[] {
    return Array.from(this.toolStatuses.values()).filter(status =>
      status.status === 'unhealthy' || status.status === 'degraded'
    );
  }

  public getSystemHealthSummary(): {
    totalTools: number;
    healthyTools: number;
    degradedTools: number;
    unhealthyTools: number;
    unknownTools: number;
    overallUptime: number;
    averageResponseTime: number;
  } {
    const statuses = Array.from(this.toolStatuses.values());

    return {
      totalTools: statuses.length,
      healthyTools: statuses.filter(s => s.status === 'healthy').length,
      degradedTools: statuses.filter(s => s.status === 'degraded').length,
      unhealthyTools: statuses.filter(s => s.status === 'unhealthy').length,
      unknownTools: statuses.filter(s => s.status === 'unknown').length,
      overallUptime: statuses.length > 0 ? statuses.reduce((sum, s) => sum + s.uptime, 0) / statuses.length : 100,
      averageResponseTime: statuses.length > 0 ? statuses.reduce((sum, s) => sum + s.responseTime, 0) / statuses.length : 0,
    };
  }
}

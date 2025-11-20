/**
 * Constitutional Compliance Validator
 * Validates compliance with Parsify.dev constitutional principles in real-time
 */

import type { BundleMetrics } from "./performance/bundle-analyzer";
import type { ToolMetadata } from "./registry/tool-registry";

export interface ConstitutionalPrinciple {
  id: string;
  title: string;
  description: string;
  requirements: ConstitutionalRequirement[];
  priority: "critical" | "high" | "medium" | "low";
}

export interface ConstitutionalRequirement {
  id: string;
  description: string;
  validator: (context: ValidationContext) => Promise<ValidationResult>;
  category: "performance" | "security" | "accessibility" | "architecture" | "compliance";
  threshold?: number;
  unit?: string;
}

export interface ValidationContext {
  toolMetadata?: ToolMetadata;
  bundleMetrics?: BundleMetrics;
  codeContent?: string;
  executionEnvironment?: "browser" | "wasm" | "worker";
  userInterface?: any;
  performanceData?: any;
  securityContext?: any;
}

export interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  violations: ConstitutionalViolation[];
  warnings: ConstitutionalWarning[];
  recommendations: string[];
  metrics: Record<string, number>;
}

export interface ConstitutionalViolation {
  principleId: string;
  requirementId: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  actualValue?: number;
  expectedValue?: number;
  suggestion?: string;
  code?: string;
  line?: number;
}

export interface ConstitutionalWarning {
  principleId: string;
  requirementId: string;
  message: string;
  suggestion?: string;
}

export interface ComplianceReport {
  timestamp: number;
  overallScore: number;
  overallStatus: "compliant" | "warning" | "non-compliant";
  principleResults: Record<string, ValidationResult>;
  summary: {
    totalViolations: number;
    criticalViolations: number;
    totalWarnings: number;
    recommendations: number;
  };
  bundleAnalysis: {
    totalSize: number;
    toolSizes: Record<string, number>;
    violations: string[];
  };
  trends?: {
    previousScore?: number;
    scoreChange: number;
    improvementAreas: string[];
    regressionAreas: string[];
  };
}

export class ConstitutionalValidator {
  private principles: Map<string, ConstitutionalPrinciple>;
  private validationCache: Map<string, ValidationResult>;
  private violationHistory: ConstitutionalViolation[];
  private maxHistorySize: number;
  private eventListeners: Map<string, Function[]>;

  private constructor() {
    this.principles = new Map();
    this.validationCache = new Map();
    this.violationHistory = [];
    this.maxHistorySize = 1000;
    this.eventListeners = new Map();

    this.initializePrinciples();
  }

  public static getInstance(): ConstitutionalValidator {
    if (!ConstitutionalValidator.instance) {
      ConstitutionalValidator.instance = new ConstitutionalValidator();
    }
    return ConstitutionalValidator.instance;
  }

  /**
   * Validate tool compliance
   */
  public async validateTool(toolId: string, context: ValidationContext): Promise<ValidationResult> {
    // Check cache first
    const cacheKey = this.generateCacheKey(toolId, context);
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    const results: ValidationResult = {
      passed: true,
      score: 100,
      violations: [],
      warnings: [],
      recommendations: [],
      metrics: {},
    };

    // Validate against all principles
    for (const [_principleId, principle] of this.principles) {
      const principleResults = await this.validatePrinciple(principle, context);

      // Merge results
      results.violations.push(...principleResults.violations);
      results.warnings.push(...principleResults.warnings);
      results.recommendations.push(...principleResults.recommendations);

      // Update score (weighted by priority)
      const weight = this.getPriorityWeight(principle.priority);
      results.score = Math.max(0, results.score - (100 - principleResults.score) * weight);
    }

    // Determine overall compliance
    const criticalViolations = results.violations.filter((v) => v.severity === "critical");
    results.passed = criticalViolations.length === 0;

    // Cache results
    this.validationCache.set(cacheKey, results);

    // Update violation history
    results.violations.forEach((violation) => {
      this.addToHistory(violation);
    });

    // Emit validation event
    this.emit("tool:validated", { toolId, results, context });

    return results;
  }

  /**
   * Validate principle
   */
  private async validatePrinciple(
    principle: ConstitutionalPrinciple,
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const results: ValidationResult = {
      passed: true,
      score: 100,
      violations: [],
      warnings: [],
      recommendations: [],
      metrics: {},
    };

    for (const requirement of principle.requirements) {
      try {
        const requirementResult = await requirement.validator(context);

        if (!requirementResult.passed) {
          results.passed = false;
          results.violations.push(...requirementResult.violations);

          // Deduct points based on violation severity
          const deduction = requirementResult.violations.reduce((sum, v) => {
            return sum + this.getSeverityDeduction(v.severity);
          }, 0);

          results.score = Math.max(0, results.score - deduction);
        }

        results.warnings.push(...requirementResult.warnings);
        results.recommendations.push(...requirementResult.recommendations);
        results.metrics = { ...results.metrics, ...requirementResult.metrics };
      } catch (error) {
        console.error(`Error validating requirement ${requirement.id}:`, error);

        results.violations.push({
          principleId: principle.id,
          requirementId: requirement.id,
          severity: "high",
          message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
          suggestion: "Check validator implementation",
        });

        results.score = Math.max(0, results.score - 20);
        results.passed = false;
      }
    }

    return results;
  }

  /**
   * Validate entire platform compliance
   */
  public async validatePlatform(
    toolMetadata: ToolMetadata[],
    bundleMetrics: BundleMetrics,
  ): Promise<ComplianceReport> {
    const timestamp = Date.now();
    const principleResults: Record<string, ValidationResult> = {};

    let totalViolations = 0;
    let criticalViolations = 0;
    let totalWarnings = 0;
    let totalRecommendations = 0;
    let overallScore = 100;

    // Validate each tool
    const toolResults: Record<string, ValidationResult> = {};
    for (const tool of toolMetadata) {
      const toolContext: ValidationContext = {
        toolMetadata: tool,
        bundleMetrics,
        executionEnvironment: "browser",
      };

      const result = await this.validateTool(tool.id, toolContext);
      toolResults[tool.id] = result;

      totalViolations += result.violations.length;
      criticalViolations += result.violations.filter((v) => v.severity === "critical").length;
      totalWarnings += result.warnings.length;
      totalRecommendations += result.recommendations.length;

      overallScore = Math.min(overallScore, result.score);
    }

    // Validate platform-level requirements
    for (const [principleId, principle] of this.principles) {
      const platformContext: ValidationContext = {
        bundleMetrics,
        executionEnvironment: "browser",
      };

      const result = await this.validatePrinciple(principle, platformContext);
      principleResults[principleId] = result;

      totalViolations += result.violations.length;
      criticalViolations += result.violations.filter((v) => v.severity === "critical").length;
      totalWarnings += result.warnings.length;
      totalRecommendations += result.recommendations.length;
    }

    // Determine overall status
    const overallStatus =
      criticalViolations > 0 ? "non-compliant" : totalViolations > 0 ? "warning" : "compliant";

    // Generate bundle analysis
    const bundleAnalysis = this.analyzeBundleCompliance(bundleMetrics);

    const report: ComplianceReport = {
      timestamp,
      overallScore,
      overallStatus,
      principleResults,
      summary: {
        totalViolations,
        criticalViolations,
        totalWarnings,
        totalRecommendations,
      },
      bundleAnalysis,
    };

    this.emit("platform:validated", { report });
    return report;
  }

  /**
   * Get compliance trends
   */
  public getComplianceTrends(timeRange: number = 24 * 60 * 60 * 1000): {
    violationRate: number;
    mostViolatedPrinciples: string[];
    improvementRate: number;
    criticalIssues: ConstitutionalViolation[];
  } {
    const cutoff = Date.now() - timeRange;
    const recentViolations = this.violationHistory.filter(
      (v) => v.timestamp && v.timestamp > cutoff,
    );

    const violationRate =
      this.violationHistory.length > 0
        ? (recentViolations.length / this.violationHistory.length) * 100
        : 0;

    const principleCounts = new Map<string, number>();
    recentViolations.forEach((violation) => {
      principleCounts.set(
        violation.principleId,
        (principleCounts.get(violation.principleId) || 0) + 1,
      );
    });

    const mostViolatedPrinciples = Array.from(principleCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([principleId]) => principleId);

    const criticalIssues = recentViolations.filter((v) => v.severity === "critical");

    return {
      violationRate,
      mostViolatedPrinciples,
      improvementRate: 0, // Would need historical comparison data
      criticalIssues,
    };
  }

  /**
   * Get violation history
   */
  public getViolationHistory(
    principleId?: string,
    severity?: ConstitutionalViolation["severity"],
    limit?: number,
  ): ConstitutionalViolation[] {
    let violations = this.violationHistory;

    if (principleId) {
      violations = violations.filter((v) => v.principleId === principleId);
    }

    if (severity) {
      violations = violations.filter((v) => v.severity === severity);
    }

    // Sort by timestamp (most recent first)
    violations.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (limit && limit > 0) {
      violations = violations.slice(0, limit);
    }

    return violations;
  }

  /**
   * Clear violation history
   */
  public clearViolationHistory(olderThan?: number): void {
    if (olderThan) {
      this.violationHistory = this.violationHistory.filter(
        (v) => v.timestamp && v.timestamp > olderThan,
      );
    } else {
      this.violationHistory = [];
    }

    this.emit("history:cleared");
  }

  /**
   * Get constitutional principles
   */
  public getPrinciples(): ConstitutionalPrinciple[] {
    return Array.from(this.principles.values());
  }

  /**
   * Add custom principle
   */
  public addPrinciple(principle: ConstitutionalPrinciple): void {
    this.principles.set(principle.id, principle);
    this.emit("principle:added", { principle });
  }

  /**
   * Remove principle
   */
  public removePrinciple(principleId: string): boolean {
    const removed = this.principles.delete(principleId);
    if (removed) {
      this.emit("principle:removed", { principleId });
    }
    return removed;
  }

  /**
   * Clear validation cache
   */
  public clearCache(): void {
    this.validationCache.clear();
    this.emit("cache:cleared");
  }

  private analyzeBundleCompliance(bundleMetrics: BundleMetrics): {
    totalSize: number;
    toolSizes: Record<string, number>;
    violations: string[];
  } {
    const violations: string[] = [];

    if (bundleMetrics.totalSize > 2 * 1024 * 1024) {
      violations.push(`Total bundle size ${this.formatBytes(bundleMetrics.totalSize)} exceeds 2MB`);
    }

    Object.entries(bundleMetrics.toolSizes).forEach(([toolId, size]) => {
      if (size > 200 * 1024) {
        violations.push(`Tool ${toolId} bundle size ${this.formatBytes(size)} exceeds 200KB`);
      }
    });

    return {
      totalSize: bundleMetrics.totalSize,
      toolSizes: bundleMetrics.toolSizes,
      violations,
    };
  }

  private addToHistory(violation: ConstitutionalViolation): void {
    const violationWithTimestamp = { ...violation, timestamp: Date.now() };
    this.violationHistory.push(violationWithTimestamp);

    // Maintain history size
    if (this.violationHistory.length > this.maxHistorySize) {
      this.violationHistory.shift();
    }
  }

  private generateCacheKey(toolId: string, context: ValidationContext): string {
    const contextHash = this.hashContext(context);
    return `${toolId}:${contextHash}`;
  }

  private hashContext(context: ValidationContext): string {
    // Simple hash implementation
    const str = JSON.stringify({
      toolMetadata: context.toolMetadata?.id,
      bundleMetrics: context.bundleMetrics?.totalSize,
      executionEnvironment: context.executionEnvironment,
    });

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private getPriorityWeight(priority: ConstitutionalPrinciple["priority"]): number {
    switch (priority) {
      case "critical":
        return 1.0;
      case "high":
        return 0.8;
      case "medium":
        return 0.6;
      case "low":
        return 0.4;
      default:
        return 0.5;
    }
  }

  private getSeverityDeduction(severity: ConstitutionalViolation["severity"]): number {
    switch (severity) {
      case "critical":
        return 25;
      case "high":
        return 15;
      case "medium":
        return 10;
      case "low":
        return 5;
      default:
        return 10;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Event handling
   */
  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in constitutional validator event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.validationCache.clear();
    this.violationHistory = [];
    this.eventListeners.clear();
    this.emit("validator:disposed");
  }
}

export default ConstitutionalValidator;

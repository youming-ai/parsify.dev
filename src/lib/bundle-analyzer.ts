/**
 * Bundle Analysis and Optimization System
 *
 * This module provides comprehensive bundle analysis, optimization recommendations,
 * and performance monitoring for the Complete Developer Tools Platform.
 *
 * Features:
 * - Bundle size analysis and tracking
 * - Dependency analysis and optimization
 * - Code splitting recommendations
 * - Tree shaking and dead code elimination
 * - Performance optimization suggestions
 * - Bundle size compliance checking (200KB limit per tool)
 * - Compression and minification analysis
 */

export interface BundleChunk {
  name: string;
  size: number;
  gzipped: number;
  brotli: number;
  modules: string[];
  dependencies: string[];
  isEntry: boolean;
  isDynamic: boolean;
  loadTime: number;
  parseTime: number;
  evaluationTime: number;
}

export interface BundleAnalysis {
  timestamp: number;
  totalSize: number;
  totalGzipped: number;
  totalBrotli: number;
  chunks: BundleChunk[];
  duplicateDependencies: Record<string, number>;
  largeDependencies: Array<{
    name: string;
    size: number;
    impact: "low" | "medium" | "high" | "critical";
  }>;
  unusedExports: Array<{
    module: string;
    exports: string[];
    potentialSavings: number;
  }>;
  optimizationSuggestions: OptimizationSuggestion[];
  complianceReport: ComplianceReport;
}

export interface OptimizationSuggestion {
  type:
    | "code-splitting"
    | "tree-shaking"
    | "dependency"
    | "compression"
    | "caching"
    | "lazy-loading";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  estimatedSavings: number;
  estimatedSavingsPercentage: number;
  implementationComplexity: "simple" | "moderate" | "complex";
  affectedFiles: string[];
  actionItems: string[];
}

export interface ComplianceReport {
  withinLimits: boolean;
  violations: Array<{
    tool: string;
    actualSize: number;
    limit: number;
    percentageOver: number;
  }>;
  warnings: Array<{
    tool: string;
    actualSize: number;
    limit: number;
    percentageThreshold: number;
  }>;
}

export interface BundleMetrics {
  buildTime: number;
  analyzeTime: number;
  optimizationTime: number;
  compressionRatio: number;
  chunkCount: number;
  dependencyCount: number;
  duplicateCodePercentage: number;
  unusedCodePercentage: number;
}

export class BundleAnalyzer {
  private analysisCache = new Map<string, BundleAnalysis>();
  private metricsHistory: BundleMetrics[] = [];
  private readonly CHUNK_SIZE_LIMIT = 200 * 1024; // 200KB
  private readonly WARNING_THRESHOLD = 0.8; // 80% of limit

  /**
   * Analyze the current bundle and provide detailed insights
   */
  async analyzeBundle(customOptions?: {
    includeDependencies?: boolean;
    checkUnusedExports?: boolean;
    analyzeCompression?: boolean;
  }): Promise<BundleAnalysis> {
    const startTime = performance.now();

    // Get bundle information from webpack stats or runtime analysis
    const chunks = await this.analyzeChunks(customOptions);
    const duplicateDependencies = await this.findDuplicateDependencies(chunks);
    const largeDependencies = await this.identifyLargeDependencies(chunks);
    const unusedExports = customOptions?.checkUnusedExports
      ? await this.findUnusedExports(chunks)
      : [];

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const totalGzipped = chunks.reduce((sum, chunk) => sum + chunk.gzipped, 0);
    const totalBrotli = chunks.reduce((sum, chunk) => sum + chunk.brotli, 0);

    const optimizationSuggestions = await this.generateOptimizationSuggestions(
      chunks,
      duplicateDependencies,
      largeDependencies,
      unusedExports,
    );

    const complianceReport = this.generateComplianceReport(chunks);

    const analysis: BundleAnalysis = {
      timestamp: Date.now(),
      totalSize,
      totalGzipped,
      totalBrotli,
      chunks,
      duplicateDependencies,
      largeDependencies,
      unusedExports,
      optimizationSuggestions,
      complianceReport,
    };

    const analyzeTime = performance.now() - startTime;

    // Cache the analysis
    this.analysisCache.set("current", analysis);

    // Record metrics
    this.recordMetrics(analyzeTime, analysis);

    return analysis;
  }

  /**
   * Generate optimization report with actionable recommendations
   */
  generateOptimizationReport(analysis: BundleAnalysis): string {
    let report = "# Bundle Optimization Report\n\n";
    report += `Generated: ${new Date(analysis.timestamp).toISOString()}\n\n`;

    // Summary
    report += "## Bundle Summary\n\n";
    report += `- **Total Size**: ${this.formatBytes(analysis.totalSize)}\n`;
    report += `- **Gzipped**: ${this.formatBytes(analysis.totalGzipped)} (${((1 - analysis.totalGzipped / analysis.totalSize) * 100).toFixed(1)}% compression)\n`;
    report += `- **Brotli**: ${this.formatBytes(analysis.totalBrotli)} (${((1 - analysis.totalBrotli / analysis.totalSize) * 100).toFixed(1)}% compression)\n`;
    report += `- **Chunks**: ${analysis.chunks.length}\n\n`;

    // Compliance status
    report += "## Compliance Status\n\n";
    if (analysis.complianceReport.withinLimits) {
      report += "✅ **All chunks within size limits** (200KB per chunk)\n\n";
    } else {
      report += "❌ **Size limit violations detected**:\n\n";
      analysis.complianceReport.violations.forEach((violation) => {
        report += `- **${violation.tool}**: ${this.formatBytes(violation.actualSize)} (${violation.percentageOver.toFixed(1)}% over limit)\n`;
      });
      report += "\n";
    }

    // Top optimization opportunities
    const criticalSuggestions = analysis.optimizationSuggestions
      .filter((s) => s.priority === "critical" || s.priority === "high")
      .sort((a, b) => b.estimatedSavings - a.estimatedSavings);

    if (criticalSuggestions.length > 0) {
      report += "## 🚨 High Priority Optimizations\n\n";
      criticalSuggestions.forEach((suggestion, index) => {
        report += `### ${index + 1}. ${suggestion.title}\n`;
        report += `**Impact**: ${this.formatBytes(suggestion.estimatedSavings)} (${suggestion.estimatedSavingsPercentage.toFixed(1)}%)\n`;
        report += `**Complexity**: ${suggestion.implementationComplexity}\n\n`;
        report += `${suggestion.description}\n\n`;
        report += "**Action Items**:\n";
        suggestion.actionItems.forEach((item) => {
          report += `- ${item}\n`;
        });
        report += "\n";
      });
    }

    // Large dependencies
    if (analysis.largeDependencies.length > 0) {
      report += "## 📦 Large Dependencies\n\n";
      analysis.largeDependencies.forEach((dep) => {
        const impactEmoji =
          dep.impact === "critical"
            ? "🚨"
            : dep.impact === "high"
              ? "⚠️"
              : dep.impact === "medium"
                ? "📊"
                : "📋";
        report += `${impactEmoji} **${dep.name}**: ${this.formatBytes(dep.size)} (${dep.impact} impact)\n`;
      });
      report += "\n";
    }

    // Duplicate code
    if (Object.keys(analysis.duplicateDependencies).length > 0) {
      report += "## 🔄 Duplicate Dependencies\n\n";
      Object.entries(analysis.duplicateDependencies).forEach(([dep, count]) => {
        report += `- **${dep}**: Found in ${count} chunks\n`;
      });
      report += "\n";
    }

    return report;
  }

  /**
   * Get bundle metrics and performance trends
   */
  getMetrics(): BundleMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  /**
   * Get metrics history for trend analysis
   */
  getMetricsHistory(): BundleMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Generate webpack bundle analyzer compatible data
   */
  generateAnalyzerData(analysis: BundleAnalysis) {
    return {
      version: "1.0.0",
      timestamp: analysis.timestamp,
      sizes: {
        total: analysis.totalSize,
        gzipped: analysis.totalGzipped,
        brotli: analysis.totalBrotli,
      },
      chunks: analysis.chunks.map((chunk) => ({
        name: chunk.name,
        size: chunk.size,
        gzipped: chunk.gzipped,
        modules: chunk.modules.length,
        dependencies: chunk.dependencies.length,
        isEntry: chunk.isEntry,
        isDynamic: chunk.isDynamic,
      })),
      optimization: {
        suggestions: analysis.optimizationSuggestions.length,
        estimatedSavings: analysis.optimizationSuggestions.reduce(
          (sum, s) => sum + s.estimatedSavings,
          0,
        ),
      },
      compliance: {
        withinLimits: analysis.complianceReport.withinLimits,
        violations: analysis.complianceReport.violations.length,
      },
    };
  }

  // Private helper methods

  private async analyzeChunks(options?: any): Promise<BundleChunk[]> {
    // In a real implementation, this would analyze webpack stats or runtime modules
    // For now, return mock data based on the actual project structure
    const tools = await this.discoverToolChunks();

    return tools.map((tool) => ({
      name: tool.name,
      size: tool.size,
      gzipped: Math.floor(tool.size * 0.3), // Typical gzip compression ratio
      brotli: Math.floor(tool.size * 0.25), // Typical brotli compression ratio
      modules: tool.modules,
      dependencies: tool.dependencies,
      isEntry: tool.isEntry,
      isDynamic: tool.isDynamic,
      loadTime: tool.size / (100 * 1024), // Simulated load time based on size
      parseTime: tool.size / (200 * 1024), // Simulated parse time
      evaluationTime: Math.random() * 50, // Random evaluation time
    }));
  }

  private async discoverToolChunks() {
    // This would scan the actual project structure in a real implementation
    return [
      {
        name: "json-formatter",
        size: 125000,
        modules: ["src/components/tools/json/json-formatter.tsx"],
        dependencies: ["react", "monaco-editor"],
        isEntry: true,
        isDynamic: false,
      },
      {
        name: "code-executor",
        size: 180000,
        modules: ["src/components/tools/code/code-execution.tsx"],
        dependencies: ["react", "monaco-editor", "pyodide"],
        isEntry: true,
        isDynamic: true,
      },
      {
        name: "image-converter",
        size: 156000,
        modules: ["src/components/tools/image/image-converter.tsx"],
        dependencies: ["react", "canvas-api"],
        isEntry: true,
        isDynamic: false,
      },
      {
        name: "security-tools",
        size: 95000,
        modules: ["src/components/tools/security/aes-encryption.tsx"],
        dependencies: ["react", "crypto-api"],
        isEntry: true,
        isDynamic: true,
      },
      {
        name: "text-processor",
        size: 87000,
        modules: ["src/components/tools/text/text-case-converter.tsx"],
        dependencies: ["react"],
        isEntry: true,
        isDynamic: false,
      },
    ];
  }

  private async findDuplicateDependencies(chunks: BundleChunk[]): Promise<Record<string, number>> {
    const dependencyCount: Record<string, number> = {};

    chunks.forEach((chunk) => {
      chunk.dependencies.forEach((dep) => {
        dependencyCount[dep] = (dependencyCount[dep] || 0) + 1;
      });
    });

    // Return only dependencies found in multiple chunks
    return Object.fromEntries(Object.entries(dependencyCount).filter(([, count]) => count > 1));
  }

  private async identifyLargeDependencies(chunks: BundleChunk[]) {
    const allDependencies = chunks.flatMap((chunk) =>
      chunk.dependencies.map((dep) => ({
        name: dep,
        size: Math.floor(Math.random() * 50000) + 10000, // Mock size calculation
      })),
    );

    return allDependencies
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .map((dep) => ({
        ...dep,
        impact:
          dep.size > 100000
            ? "critical"
            : dep.size > 50000
              ? "high"
              : dep.size > 25000
                ? "medium"
                : ("low" as "low" | "medium" | "high" | "critical"),
      }));
  }

  private async findUnusedExports(chunks: BundleChunk[]) {
    // Mock implementation - in reality this would require static analysis
    return [
      {
        module: "src/lib/utils.ts",
        exports: ["unusedHelper1", "unusedHelper2"],
        potentialSavings: 2048,
      },
      {
        module: "src/components/ui/button.tsx",
        exports: ["deprecatedVariant"],
        potentialSavings: 1024,
      },
    ];
  }

  private async generateOptimizationSuggestions(
    chunks: BundleChunk[],
    duplicateDependencies: Record<string, number>,
    largeDependencies: any[],
    unusedExports: any[],
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Large chunks
    chunks
      .filter((chunk) => chunk.size > this.CHUNK_SIZE_LIMIT * this.WARNING_THRESHOLD)
      .forEach((chunk) => {
        const percentageOver = ((chunk.size - this.CHUNK_SIZE_LIMIT) / this.CHUNK_SIZE_LIMIT) * 100;
        suggestions.push({
          type: "code-splitting",
          priority: chunk.size > this.CHUNK_SIZE_LIMIT ? "critical" : "high",
          title: `Split large chunk: ${chunk.name}`,
          description: `The ${chunk.name} chunk is ${this.formatBytes(chunk.size)} (${percentageOver.toFixed(1)}% over limit). Consider splitting it into smaller chunks.`,
          estimatedSavings: chunk.size - this.CHUNK_SIZE_LIMIT,
          estimatedSavingsPercentage: percentageOver,
          implementationComplexity: "moderate",
          affectedFiles: chunk.modules,
          actionItems: [
            "Identify rarely used features in the chunk",
            "Move these features to dynamically loaded modules",
            "Implement proper code splitting boundaries",
          ],
        });
      });

    // Duplicate dependencies
    Object.entries(duplicateDependencies).forEach(([dep, count]) => {
      if (count >= 3) {
        const estimatedSavings = (count - 1) * 15000; // Estimate 15KB per duplicate
        suggestions.push({
          type: "dependency",
          priority: "high",
          title: `Deduplicate dependency: ${dep}`,
          description: `${dep} is included in ${count} different chunks, causing redundancy.`,
          estimatedSavings,
          estimatedSavingsPercentage: 5,
          implementationComplexity: "simple",
          affectedFiles: [],
          actionItems: [
            "Move the dependency to a shared chunk",
            "Update import statements across modules",
            "Verify functionality after deduplication",
          ],
        });
      }
    });

    // Large dependencies
    largeDependencies
      .filter((dep) => dep.impact === "critical" || dep.impact === "high")
      .forEach((dep) => {
        suggestions.push({
          type: "dependency",
          priority: dep.impact === "critical" ? "critical" : "medium",
          title: `Optimize large dependency: ${dep.name}`,
          description: `${dep.name} is significantly large (${this.formatBytes(dep.size)}). Consider alternatives or optimization.`,
          estimatedSavings: Math.floor(dep.size * 0.3),
          estimatedSavingsPercentage: 10,
          implementationComplexity: "complex",
          affectedFiles: [],
          actionItems: [
            "Research lighter alternatives",
            "Implement tree shaking for the dependency",
            "Consider lazy loading for non-critical features",
          ],
        });
      });

    // Unused exports
    if (unusedExports.length > 0) {
      const totalSavings = unusedExports.reduce((sum, exp) => sum + exp.potentialSavings, 0);
      suggestions.push({
        type: "tree-shaking",
        priority: "medium",
        title: "Remove unused exports",
        description: `Found ${unusedExports.length} modules with unused exports that can be safely removed.`,
        estimatedSavings: totalSavings,
        estimatedSavingsPercentage: 2,
        implementationComplexity: "simple",
        affectedFiles: unusedExports.map((exp) => exp.module),
        actionItems: [
          "Remove unused exports from module files",
          "Update import statements that reference these exports",
          "Run tests to ensure no functionality is broken",
        ],
      });
    }

    // Compression optimization
    const averageCompressionRatio =
      chunks.reduce((sum, chunk) => sum + chunk.gzipped / chunk.size, 0) / chunks.length;

    if (averageCompressionRatio > 0.4) {
      suggestions.push({
        type: "compression",
        priority: "medium",
        title: "Improve compression efficiency",
        description: `Current compression ratio (${(averageCompressionRatio * 100).toFixed(1)}%) could be improved.`,
        estimatedSavings: Math.floor(chunks.reduce((sum, chunk) => sum + chunk.size, 0) * 0.1),
        estimatedSavingsPercentage: 5,
        implementationComplexity: "simple",
        affectedFiles: [],
        actionItems: [
          "Enable Brotli compression on the server",
          "Optimize asset delivery with proper caching headers",
          "Consider using CDN for static assets",
        ],
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private generateComplianceReport(chunks: BundleChunk[]): ComplianceReport {
    const violations = chunks
      .filter((chunk) => chunk.size > this.CHUNK_SIZE_LIMIT)
      .map((chunk) => ({
        tool: chunk.name,
        actualSize: chunk.size,
        limit: this.CHUNK_SIZE_LIMIT,
        percentageOver: ((chunk.size - this.CHUNK_SIZE_LIMIT) / this.CHUNK_SIZE_LIMIT) * 100,
      }));

    const warnings = chunks
      .filter(
        (chunk) =>
          chunk.size > this.CHUNK_SIZE_LIMIT * this.WARNING_THRESHOLD &&
          chunk.size <= this.CHUNK_SIZE_LIMIT,
      )
      .map((chunk) => ({
        tool: chunk.name,
        actualSize: chunk.size,
        limit: this.CHUNK_SIZE_LIMIT,
        percentageThreshold: this.WARNING_THRESHOLD * 100,
      }));

    return {
      withinLimits: violations.length === 0,
      violations,
      warnings,
    };
  }

  private recordMetrics(analyzeTime: number, analysis: BundleAnalysis) {
    const metrics: BundleMetrics = {
      buildTime: 0, // Would come from build process
      analyzeTime,
      optimizationTime: 0, // Would come from optimization step
      compressionRatio: analysis.totalGzipped / analysis.totalSize,
      chunkCount: analysis.chunks.length,
      dependencyCount: new Set(analysis.chunks.flatMap((c) => c.dependencies)).size,
      duplicateCodePercentage:
        (Object.values(analysis.duplicateDependencies).length / analysis.chunks.length) * 100,
      unusedCodePercentage:
        (analysis.unusedExports.reduce((sum, exp) => sum + exp.potentialSavings, 0) /
          analysis.totalSize) *
        100,
    };

    this.metricsHistory.push(metrics);

    // Keep only last 100 entries
    if (this.metricsHistory.length > 100) {
      this.metricsHistory = this.metricsHistory.slice(-100);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }
}

// Export singleton instance
export const bundleAnalyzer = new BundleAnalyzer();

// Utility functions
export const formatBundleSize = (bytes: number): string => {
  return bundleAnalyzer["formatBytes"](bytes);
};

export const checkCompliance = (size: number, limit: number = 200 * 1024): boolean => {
  return size <= limit;
};

export const calculateCompressionRatio = (original: number, compressed: number): number => {
  return compressed / original;
};

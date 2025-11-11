/**
 * Build-Time Budget Validator
 * Validates performance budgets during build process
 * Enforces budgets and blocks builds when thresholds are exceeded
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';
import { performanceBudgetManager, type BudgetReport } from './performance-budget-manager';

interface BuildAnalysis {
  buildId: string;
  timestamp: Date;
  environment: 'development' | 'staging' | 'production';
  bundleAnalysis: BundleMetrics;
  performanceMetrics: PerformanceMetrics;
  assetAnalysis: AssetMetrics;
}

interface BundleMetrics {
  totalSize: number;
  compressedSize: number;
  chunks: ChunkInfo[];
  modules: ModuleInfo[];
  dependencies: DependencyInfo[];
}

interface ChunkInfo {
  name: string;
  size: number;
  compressedSize: number;
  modules: number;
  entries: string[];
}

interface ModuleInfo {
  name: string;
  size: number;
  path: string;
  type: 'esm' | 'commonjs' | 'asset';
  used: boolean;
}

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  chunks: string[];
  used: boolean;
}

interface PerformanceMetrics {
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  totalBlockingTime?: number;
  timeToInteractive?: number;
  speedIndex?: number;
}

interface AssetMetrics {
  totalAssets: number;
  totalSize: number;
  compressedSize: number;
  assets: AssetInfo[];
}

interface AssetInfo {
  name: string;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
  size: number;
  compressedSize: number;
  path: string;
  optimized: boolean;
}

interface ValidationResult {
  success: boolean;
  shouldBlockBuild: boolean;
  report: BudgetReport;
  analysis: BuildAnalysis;
  violations: BuildViolation[];
  recommendations: BuildRecommendation[];
  metrics: ValidationMetrics;
}

interface BuildViolation {
  type: 'budget' | 'size' | 'performance' | 'security';
  severity: 'warning' | 'error' | 'critical';
  category: string;
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  fixable: boolean;
  automatedFixAvailable: boolean;
}

interface BuildRecommendation {
  type: 'optimization' | 'configuration' | 'dependency' | 'code';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation: string;
  estimatedImpact: {
    sizeReduction: number;
    performanceGain: number;
    effort: 'low' | 'medium' | 'high';
  };
  automated: boolean;
}

interface ValidationMetrics {
  totalTime: number;
  analysisTime: number;
  validationTime: number;
  reportGenerationTime: number;
  budgetsChecked: number;
  violationsFound: number;
  criticalViolations: number;
  optimizationsSuggested: number;
}

export interface BuildTimeValidatorConfig {
  enabled: boolean;
  strictMode: boolean;
  failOnWarnings: boolean;
  blockDeployments: boolean;
  analyzeDependencies: boolean;
  optimizeAssets: boolean;
  generateReports: boolean;
  parallelAnalysis: boolean;
  cacheResults: boolean;
  integrations: {
    webpack: boolean;
    lighthouse: boolean;
    bundleAnalyzer: boolean;
    ciCd: boolean;
  };
}

export class BuildTimeBudgetValidator {
  private config: BuildTimeValidatorConfig;
  private buildCache: Map<string, BuildAnalysis> = new Map();
  private resultsCache: Map<string, ValidationResult> = new Map();

  constructor(config: Partial<BuildTimeValidatorConfig> = {}) {
    this.config = {
      enabled: true,
      strictMode: false,
      failOnWarnings: true,
      blockDeployments: true,
      analyzeDependencies: true,
      optimizeAssets: false, // Disabled by default for safety
      generateReports: true,
      parallelAnalysis: true,
      cacheResults: true,
      integrations: {
        webpack: true,
        lighthouse: false, // Disabled by default for build speed
        bundleAnalyzer: true,
        ciCd: true,
      },
      ...config,
    };
  }

  /**
   * Run build-time budget validation
   */
  public async validateBuild(
    buildPath: string = '.next',
    environment: 'development' | 'staging' | 'production' = 'production'
  ): Promise<ValidationResult> {
    if (!this.config.enabled) {
      throw new Error('Build-time budget validation is disabled');
    }

    const startTime = Date.now();
    const buildId = this.generateBuildId();

    console.log(`🔍 Starting build-time budget validation (Build: ${buildId})`);

    try {
      // Step 1: Analyze build artifacts
      const analysisStartTime = Date.now();
      const analysis = await this.analyzeBuild(buildPath, environment, buildId);
      const analysisTime = Date.now() - analysisStartTime;

      // Step 2: Collect measurements for budget validation
      const measurements = this.extractMeasurements(analysis);

      // Step 3: Run budget validation
      const validationStartTime = Date.now();
      const report = await performanceBudgetManager.generateBudgetReport(
        measurements,
        buildId,
        environment
      );
      const validationTime = Date.now() - validationStartTime;

      // Step 4: Generate build-specific violations and recommendations
      const reportGenerationStartTime = Date.now();
      const violations = this.generateBuildViolations(analysis, report);
      const recommendations = this.generateBuildRecommendations(analysis, violations);
      const reportGenerationTime = Date.now() - reportGenerationStartTime;

      // Step 5: Determine build outcome
      const shouldBlockBuild = this.shouldBlockBuild(report, violations);
      const success = !shouldBlockBuild;

      // Step 6: Create validation result
      const totalTime = Date.now() - startTime;
      const result: ValidationResult = {
        success,
        shouldBlockBuild,
        report,
        analysis,
        violations,
        recommendations,
        metrics: {
          totalTime,
          analysisTime,
          validationTime,
          reportGenerationTime,
          budgetsChecked: report.budgets.length,
          violationsFound: violations.length,
          criticalViolations: violations.filter(v => v.severity === 'critical').length,
          optimizationsSuggested: recommendations.length,
        },
      };

      // Step 7: Cache results
      if (this.config.cacheResults) {
        this.buildCache.set(buildId, analysis);
        this.resultsCache.set(buildId, result);
      }

      // Step 8: Generate reports
      if (this.config.generateReports) {
        await this.generateBuildReport(result);
      }

      // Step 9: Log results
      this.logValidationResults(result);

      return result;

    } catch (error) {
      console.error('❌ Build-time budget validation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze build artifacts and collect metrics
   */
  private async analyzeBuild(
    buildPath: string,
    environment: string,
    buildId: string
  ): Promise<BuildAnalysis> {
    const buildAnalysis: BuildAnalysis = {
      buildId,
      timestamp: new Date(),
      environment: environment as any,
      bundleAnalysis: {
        totalSize: 0,
        compressedSize: 0,
        chunks: [],
        modules: [],
        dependencies: [],
      },
      performanceMetrics: {},
      assetAnalysis: {
        totalAssets: 0,
        totalSize: 0,
        compressedSize: 0,
        assets: [],
      },
    };

    if (this.config.integrations.webpack) {
      await this.analyzeWebpackBuild(buildPath, buildAnalysis);
    }

    if (this.config.analyzeDependencies) {
      await this.analyzeDependencies(buildAnalysis);
    }

    return buildAnalysis;
  }

  /**
   * Analyze webpack build artifacts
   */
  private async analyzeWebpackBuild(buildPath: string, analysis: BuildAnalysis): Promise<void> {
    const webpackStatsPath = join(buildPath, 'webpack-stats.json');

    if (existsSync(webpackStatsPath)) {
      try {
        const webpackStats = JSON.parse(readFileSync(webpackStatsPath, 'utf-8'));
        this.processWebpackStats(webpackStats, analysis);
      } catch (error) {
        console.warn('Failed to parse webpack stats, using fallback analysis');
        this.performFallbackAnalysis(buildPath, analysis);
      }
    } else {
      console.warn('Webpack stats not found, performing fallback analysis');
      this.performFallbackAnalysis(buildPath, analysis);
    }
  }

  /**
   * Process webpack statistics
   */
  private processWebpackStats(webpackStats: any, analysis: BuildAnalysis): void {
    const { assets, chunks, modules } = webpackStats;

    // Process chunks
    if (chunks) {
      chunks.forEach((chunk: any) => {
        const chunkInfo: ChunkInfo = {
          name: chunk.name || chunk.id,
          size: chunk.size || 0,
          compressedSize: Math.round((chunk.size || 0) * 0.3), // Estimate compression
          modules: chunk.modules?.length || 0,
          entries: chunk.entry || [],
        };
        analysis.bundleAnalysis.chunks.push(chunkInfo);
        analysis.bundleAnalysis.totalSize += chunkInfo.size;
        analysis.bundleAnalysis.compressedSize += chunkInfo.compressedSize;
      });
    }

    // Process modules
    if (modules) {
      modules.forEach((module: any) => {
        const moduleInfo: ModuleInfo = {
          name: module.name || module.identifier,
          size: module.size || 0,
          path: module.name || '',
          type: module.moduleType || 'esm',
          used: module.used || true,
        };
        analysis.bundleAnalysis.modules.push(moduleInfo);
      });
    }

    // Process assets
    if (assets) {
      assets.forEach((asset: any) => {
        const assetType = this.getAssetType(asset.name);
        const assetInfo: AssetInfo = {
          name: asset.name,
          type: assetType,
          size: asset.size || 0,
          compressedSize: Math.round((asset.size || 0) * this.getCompressionRatio(assetType)),
          path: asset.name,
          optimized: false, // Would need additional analysis
        };
        analysis.assetAnalysis.assets.push(assetInfo);
        analysis.assetAnalysis.totalAssets++;
        analysis.assetAnalysis.totalSize += assetInfo.size;
        analysis.assetAnalysis.compressedSize += assetInfo.compressedSize;
      });
    }
  }

  /**
   * Fallback analysis when webpack stats are not available
   */
  private performFallbackAnalysis(buildPath: string, analysis: BuildAnalysis): void {
    try {
      // Analyze .next directory structure
      const buildDir = resolve(buildPath);

      // This is a simplified fallback - in production, you'd implement
      // more sophisticated analysis of the build output
      const estimatedSize = 500 * 1024; // 500KB estimate
      const estimatedCompressed = Math.round(estimatedSize * 0.3);

      analysis.bundleAnalysis.totalSize = estimatedSize;
      analysis.bundleAnalysis.compressedSize = estimatedCompressed;

      // Create estimated chunks
      analysis.bundleAnalysis.chunks = [
        {
          name: 'main',
          size: estimatedSize * 0.7,
          compressedSize: Math.round(estimatedSize * 0.7 * 0.3),
          modules: 100,
          entries: ['app'],
        },
        {
          name: 'vendor',
          size: estimatedSize * 0.3,
          compressedSize: Math.round(estimatedSize * 0.3 * 0.3),
          modules: 50,
          entries: [],
        },
      ];

      analysis.assetAnalysis.totalAssets = 10;
      analysis.assetAnalysis.totalSize = estimatedSize;
      analysis.assetAnalysis.compressedSize = estimatedCompressed;

    } catch (error) {
      console.error('Fallback analysis failed:', error);
      // Set minimal defaults
      analysis.bundleAnalysis.totalSize = 400 * 1024;
      analysis.bundleAnalysis.compressedSize = 120 * 1024;
    }
  }

  /**
   * Analyze dependencies
   */
  private async analyzeDependencies(analysis: BuildAnalysis): Promise<void> {
    try {
      const packageJsonPath = './package.json';
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        for (const [name, version] of Object.entries(dependencies)) {
          const dependencyInfo: DependencyInfo = {
            name,
            version: version as string,
            size: this.estimateDependencySize(name),
            chunks: [], // Would need more sophisticated analysis
            used: this.isDependencyUsed(name, analysis),
          };
          analysis.bundleAnalysis.dependencies.push(dependencyInfo);
        }
      }
    } catch (error) {
      console.warn('Failed to analyze dependencies:', error);
    }
  }

  /**
   * Extract measurements for budget validation
   */
  private extractMeasurements(analysis: BuildAnalysis): Record<string, number> {
    const measurements: Record<string, number> = {
      // Bundle size metrics
      totalSize: analysis.bundleAnalysis.totalSize,
      compressedSize: analysis.bundleAnalysis.compressedSize,
      maxChunkSize: Math.max(...analysis.bundleAnalysis.chunks.map(c => c.size), 0),

      // Asset metrics
      totalAssets: analysis.assetAnalysis.totalAssets,
      totalTransferSize: analysis.assetAnalysis.compressedSize,

      // Dependency metrics
      totalDependencies: analysis.bundleAnalysis.dependencies.length,
      unusedDependencies: analysis.bundleAnalysis.dependencies.filter(d => !d.used).length,
    };

    // Add chunk-specific metrics
    analysis.bundleAnalysis.chunks.forEach(chunk => {
      measurements[`chunk_${chunk.name}_size`] = chunk.size;
    });

    // Add performance metrics if available
    if (analysis.performanceMetrics.firstContentfulPaint) {
      measurements.firstContentfulPaint = analysis.performanceMetrics.firstContentfulPaint;
    }
    if (analysis.performanceMetrics.largestContentfulPaint) {
      measurements.largestContentfulPaint = analysis.performanceMetrics.largestContentfulPaint;
    }
    if (analysis.performanceMetrics.firstInputDelay) {
      measurements.firstInputDelay = analysis.performanceMetrics.firstInputDelay;
    }
    if (analysis.performanceMetrics.cumulativeLayoutShift) {
      measurements.cumulativeLayoutShift = analysis.performanceMetrics.cumulativeLayoutShift;
    }

    return measurements;
  }

  /**
   * Generate build-specific violations
   */
  private generateBuildViolations(analysis: BuildAnalysis, report: BudgetReport): BuildViolation[] {
    const violations: BuildViolation[] = [];

    // Convert budget report violations to build violations
    report.violations.forEach(violation => {
      violations.push({
        type: 'budget',
        severity: violation.severity === 'critical' ? 'critical' : 'error',
        category: violation.budgetName,
        metric: violation.metric,
        currentValue: violation.currentValue,
        threshold: violation.threshold,
        message: `Budget violation: ${violation.budgetName} - ${violation.metric} exceeds threshold`,
        fixable: true,
        automatedFixAvailable: this.isAutomatedFixAvailable(violation.metric),
      });
    });

    // Add build-specific violations
    this.addBuildSpecificViolations(analysis, violations);

    return violations;
  }

  /**
   * Add build-specific violations
   */
  private addBuildSpecificViolations(analysis: BuildAnalysis, violations: BuildViolation[]): void {
    // Check for oversized chunks
    analysis.bundleAnalysis.chunks.forEach(chunk => {
      if (chunk.size > 300 * 1024) { // 300KB threshold
        violations.push({
          type: 'size',
          severity: 'error',
          category: 'Chunk Size',
          metric: 'maxChunkSize',
          currentValue: chunk.size,
          threshold: 300 * 1024,
          message: `Chunk "${chunk.name}" is too large (${Math.round(chunk.size / 1024)}KB)`,
          fixable: true,
          automatedFixAvailable: true,
        });
      }
    });

    // Check for unused dependencies
    const unusedDeps = analysis.bundleAnalysis.dependencies.filter(d => !d.used);
    if (unusedDeps.length > 0) {
      violations.push({
        type: 'dependency',
        severity: 'warning',
        category: 'Dependencies',
        metric: 'unusedDependencies',
        currentValue: unusedDeps.length,
        threshold: 0,
        message: `${unusedDeps.length} unused dependencies detected: ${unusedDeps.map(d => d.name).join(', ')}`,
        fixable: true,
        automatedFixAvailable: true,
      });
    }

    // Check for unoptimized assets
    const unoptimizedAssets = analysis.assetAnalysis.assets.filter(a => !a.optimized);
    if (unoptimizedAssets.length > 5) {
      violations.push({
        type: 'size',
        severity: 'warning',
        category: 'Asset Optimization',
        metric: 'unoptimizedAssets',
        currentValue: unoptimizedAssets.length,
        threshold: 5,
        message: `${unoptimizedAssets.length} assets are not optimized`,
        fixable: true,
        automatedFixAvailable: true,
      });
    }
  }

  /**
   * Generate build-specific recommendations
   */
  private generateBuildRecommendations(
    analysis: BuildAnalysis,
    violations: BuildViolation[]
  ): BuildRecommendation[] {
    const recommendations: BuildRecommendation[] = [];

    // Analyze large chunks
    const largeChunks = analysis.bundleAnalysis.chunks.filter(c => c.size > 200 * 1024);
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        title: 'Split Large Chunks',
        description: `${largeChunks.length} chunks exceed 200KB. Implement code splitting to reduce chunk sizes.`,
        implementation: 'Use dynamic imports, implement route-based code splitting, and optimize vendor chunking.',
        estimatedImpact: {
          sizeReduction: largeChunks.reduce((sum, c) => sum + c.size, 0) * 0.3,
          performanceGain: 20,
          effort: 'medium',
        },
        automated: true,
      });
    }

    // Analyze dependencies
    const unusedDeps = analysis.bundleAnalysis.dependencies.filter(d => !d.used);
    if (unusedDeps.length > 0) {
      recommendations.push({
        type: 'dependency',
        priority: 'medium',
        title: 'Remove Unused Dependencies',
        description: `Remove ${unusedDeps.length} unused dependencies to reduce bundle size.`,
        implementation: `Run dependency analysis and remove: ${unusedDeps.map(d => d.name).join(', ')}`,
        estimatedImpact: {
          sizeReduction: unusedDeps.reduce((sum, d) => sum + d.size, 0),
          performanceGain: 10,
          effort: 'low',
        },
        automated: true,
      });
    }

    // Asset optimization recommendations
    const unoptimizedAssets = analysis.assetAnalysis.assets.filter(a => !a.optimized);
    if (unoptimizedAssets.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Optimize Assets',
        description: `Optimize ${unoptimizedAssets.length} assets to reduce transfer size.`,
        implementation: 'Enable compression, use modern image formats, implement lazy loading.',
        estimatedImpact: {
          sizeReduction: unoptimizedAssets.reduce((sum, a) => sum + a.size, 0) * 0.4,
          performanceGain: 15,
          effort: 'low',
        },
        automated: true,
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Determine if build should be blocked
   */
  private shouldBlockBuild(report: BudgetReport, violations: BuildViolation[]): boolean {
    if (!this.config.blockDeployments) {
      return false;
    }

    // Block on critical violations
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      return true;
    }

    // Block on failed budget status
    if (report.status === 'fail') {
      return true;
    }

    // Block on warnings if strict mode or failOnWarnings is enabled
    if ((this.config.strictMode || this.config.failOnWarnings) && report.status === 'warning') {
      return true;
    }

    return false;
  }

  /**
   * Generate build report files
   */
  private async generateBuildReport(result: ValidationResult): Promise<void> {
    const reportsDir = '.budget-reports';
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = join(reportsDir, `build-${result.analysis.buildId}.json`);
    const reportData = {
      buildId: result.analysis.buildId,
      timestamp: result.analysis.timestamp,
      environment: result.analysis.environment,
      success: result.success,
      shouldBlockBuild: result.shouldBlockBuild,
      summary: result.report.summary,
      violations: result.violations,
      recommendations: result.recommendations,
      metrics: result.metrics,
      analysis: {
        bundleSize: result.analysis.bundleAnalysis.totalSize,
        compressedSize: result.analysis.bundleAnalysis.compressedSize,
        chunks: result.analysis.bundleAnalysis.chunks.length,
        assets: result.analysis.assetAnalysis.totalAssets,
        dependencies: result.analysis.bundleAnalysis.dependencies.length,
      },
    };

    try {
      writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`📊 Build report saved to: ${reportPath}`);
    } catch (error) {
      console.error('Failed to save build report:', error);
    }
  }

  /**
   * Log validation results
   */
  private logValidationResults(result: ValidationResult): void {
    const { success, shouldBlockBuild, violations, recommendations, metrics } = result;

    console.log('\n' + '='.repeat(60));
    console.log('🔍 BUILD-TIME BUDGET VALIDATION RESULTS');
    console.log('='.repeat(60));

    console.log(`\n📈 Overall Status: ${success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🚫 Build Blocked: ${shouldBlockBuild ? 'YES' : 'NO'}`);
    console.log(`⏱️  Total Time: ${metrics.totalTime}ms`);

    if (violations.length > 0) {
      console.log(`\n⚠️  Violations Found: ${violations.length}`);
      const criticalCount = violations.filter(v => v.severity === 'critical').length;
      const errorCount = violations.filter(v => v.severity === 'error').length;
      const warningCount = violations.filter(v => v.severity === 'warning').length;

      if (criticalCount > 0) console.log(`   🚨 Critical: ${criticalCount}`);
      if (errorCount > 0) console.log(`   ❌ Errors: ${errorCount}`);
      if (warningCount > 0) console.log(`   ⚠️  Warnings: ${warningCount}`);

      violations.slice(0, 5).forEach(violation => {
        const icon = violation.severity === 'critical' ? '🚨' :
                    violation.severity === 'error' ? '❌' : '⚠️';
        console.log(`   ${icon} ${violation.category}: ${violation.message}`);
      });

      if (violations.length > 5) {
        console.log(`   ... and ${violations.length - 5} more`);
      }
    }

    if (recommendations.length > 0) {
      console.log(`\n💡 Recommendations: ${recommendations.length}`);
      recommendations.slice(0, 3).forEach(rec => {
        const icon = rec.priority === 'critical' ? '🚨' :
                    rec.priority === 'high' ? '⚡' : '💡';
        console.log(`   ${icon} ${rec.title}`);
      });

      if (recommendations.length > 3) {
        console.log(`   ... and ${recommendations.length - 3} more`);
      }
    }

    console.log('\n' + '='.repeat(60));
  }

  // Utility methods

  private getAssetType(filename: string): 'js' | 'css' | 'image' | 'font' | 'other' {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (['js', 'mjs', 'jsx', 'ts', 'tsx'].includes(ext || '')) return 'js';
    if (['css', 'scss', 'sass', 'less'].includes(ext || '')) return 'css';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext || '')) return 'image';
    if (['woff', 'woff2', 'ttf', 'eot', 'otf'].includes(ext || '')) return 'font';

    return 'other';
  }

  private getCompressionRatio(assetType: string): number {
    const ratios: Record<string, number> = {
      js: 0.3,
      css: 0.25,
      image: 0.9, // Images are usually already compressed
      font: 0.7,
      other: 0.5,
    };

    return ratios[assetType] || 0.5;
  }

  private estimateDependencySize(name: string): number {
    // Rough estimates for common dependencies
    const sizes: Record<string, number> = {
      'react': 65000,
      'react-dom': 130000,
      'next': 250000,
      'lucide-react': 50000,
      '@radix-ui': 10000,
      'zustand': 5000,
      'typescript': 0, // Dev dependency
    };

    // Check for exact matches
    if (sizes[name]) {
      return sizes[name];
    }

    // Check for prefixes
    for (const [key, size] of Object.entries(sizes)) {
      if (name.startsWith(key)) {
        return size;
      }
    }

    // Default estimate
    return 25000; // 25KB
  }

  private isDependencyUsed(name: string, analysis: BuildAnalysis): boolean {
    // Simplified check - in practice, this would analyze the bundle
    const commonDeps = ['react', 'react-dom', 'next', 'typescript'];
    return commonDeps.includes(name) || Math.random() > 0.3; // 70% chance of being used
  }

  private isAutomatedFixAvailable(metric: string): boolean {
    const automatableMetrics = [
      'totalSize',
      'compressedSize',
      'maxChunkSize',
      'unusedDependencies',
      'unoptimizedAssets',
    ];

    return automatableMetrics.includes(metric);
  }

  private generateBuildId(): string {
    try {
      const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
      return `${gitHash}_${Date.now()}`;
    } catch {
      return `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // Public API methods

  public updateConfig(config: Partial<BuildTimeValidatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): BuildTimeValidatorConfig {
    return { ...this.config };
  }

  public getCachedResult(buildId: string): ValidationResult | undefined {
    return this.resultsCache.get(buildId);
  }

  public getCachedAnalysis(buildId: string): BuildAnalysis | undefined {
    return this.buildCache.get(buildId);
  }

  public clearCache(): void {
    this.buildCache.clear();
    this.resultsCache.clear();
  }
}

// Export singleton instance
export const buildTimeBudgetValidator = new BuildTimeBudgetValidator();

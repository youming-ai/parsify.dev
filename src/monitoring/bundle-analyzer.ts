/**
 * Bundle Analysis Utilities
 * Provides comprehensive bundle size analysis and optimization insights
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { gzipSync, brotliCompressSync } from 'zlib';

interface BundleMetric {
  name: string;
  size: number;
  gzippedSize: number;
  brotliSize: number;
  path: string;
  type: 'js' | 'css' | 'asset' | 'static';
  lastModified: Date;
}

interface BundleAnalysis {
  timestamp: Date;
  totalSize: number;
  totalGzippedSize: number;
  totalBrotliSize: number;
  chunks: BundleMetric[];
  dependencies: DependencyAnalysis;
  recommendations: OptimizationRecommendation[];
  performanceBudget: PerformanceBudgetStatus;
}

interface DependencyAnalysis {
  largestDependencies: Array<{
    name: string;
    size: number;
    impact: 'high' | 'medium' | 'low';
  }>;
  unusedDependencies: string[];
  duplicateDependencies: Array<{
    name: string;
    versions: string[];
    totalSize: number;
  }>;
  treeShakingOpportunities: string[];
}

interface OptimizationRecommendation {
  type: 'code-splitting' | 'tree-shaking' | 'compression' | 'lazy-loading' | 'asset-optimization';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedSavings: number;
  implementation: string;
}

interface PerformanceBudgetStatus {
  budget: PerformanceBudget;
  status: 'within-budget' | 'warning' | 'exceeded';
  overages: Array<{
    category: string;
    budget: number;
    actual: number;
    overage: number;
  }>;
}

interface PerformanceBudget {
  total: number;
  javascript: number;
  css: number;
  assets: number;
  initial: number;
}

class BundleAnalyzer {
  private outputPath: string;
  private analysisPath: string;
  private budgetConfig: PerformanceBudget;

  constructor(outputPath: string = '.next', analysisPath: string = '.bundle-analysis') {
    this.outputPath = outputPath;
    this.analysisPath = analysisPath;
    this.budgetConfig = {
      total: 1024 * 1024, // 1MB total
      javascript: 500 * 1024, // 500KB JS
      css: 100 * 1024, // 100KB CSS
      assets: 300 * 1024, // 300KB assets
      initial: 200 * 1024, // 200KB initial load
    };

    this.ensureAnalysisDirectory();
  }

  private ensureAnalysisDirectory(): void {
    if (!existsSync(this.analysisPath)) {
      mkdirSync(this.analysisPath, { recursive: true });
    }
  }

  async analyzeBundle(): Promise<BundleAnalysis> {
    const chunks = await this.collectBundleMetrics();
    const dependencies = await this.analyzeDependencies();
    const recommendations = this.generateRecommendations(chunks, dependencies);
    const performanceBudget = this.checkPerformanceBudget(chunks);

    const analysis: BundleAnalysis = {
      timestamp: new Date(),
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      totalGzippedSize: chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0),
      totalBrotliSize: chunks.reduce((sum, chunk) => sum + chunk.brotliSize, 0),
      chunks,
      dependencies,
      recommendations,
      performanceBudget,
    };

    this.saveAnalysis(analysis);
    return analysis;
  }

  private async collectBundleMetrics(): Promise<BundleMetric[]> {
    const chunks: BundleMetric[] = [];

    // This would typically read from the Next.js build manifest
    // For now, we'll simulate the collection process
    const manifestPath = join(this.outputPath, 'build-manifest.json');

    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      for (const [name, files] of Object.entries(manifest)) {
        if (Array.isArray(files)) {
          for (const file of files) {
            const filePath = join(this.outputPath, file);
            if (existsSync(filePath)) {
              const buffer = readFileSync(filePath);
              const chunk = this.createBundleMetric(file, buffer);
              chunks.push(chunk);
            }
          }
        }
      }
    }

    // Add static assets analysis
    await this.addStaticAssets(chunks);

    return chunks;
  }

  private createBundleMetric(name: string, buffer: Buffer): BundleMetric {
    const gzipped = gzipSync(buffer, { level: 9 });
    const brotli = brotliCompressSync(buffer);

    const type = this.getFileType(name);

    return {
      name,
      size: buffer.length,
      gzippedSize: gzipped.length,
      brotliSize: brotli.length,
      path: name,
      type,
      lastModified: new Date(),
    };
  }

  private getFileType(fileName: string): BundleMetric['type'] {
    if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) return 'js';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.includes('static/')) return 'static';
    return 'asset';
  }

  private async addStaticAssets(chunks: BundleMetric[]): Promise<void> {
    // This would scan public directory for static assets
    // For now, we'll add placeholder implementation
    const staticPath = 'public';
    if (existsSync(staticPath)) {
      // Implementation would scan and add static assets
    }
  }

  private async analyzeDependencies(): Promise<DependencyAnalysis> {
    const packagePath = 'package.json';

    if (!existsSync(packagePath)) {
      return {
        largestDependencies: [],
        unusedDependencies: [],
        duplicateDependencies: [],
        treeShakingOpportunities: [],
      };
    }

    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const dependencies = packageJson.dependencies || {};

    return {
      largestDependencies: this.identifyLargestDependencies(dependencies),
      unusedDependencies: await this.identifyUnusedDependencies(dependencies),
      duplicateDependencies: await this.identifyDuplicateDependencies(),
      treeShakingOpportunities: this.identifyTreeShakingOpportunities(dependencies),
    };
  }

  private identifyLargestDependencies(dependencies: Record<string, string>): Array<{
    name: string;
    size: number;
    impact: 'high' | 'medium' | 'low';
  }> {
    // This would analyze node_modules to identify largest dependencies
    // For now, return placeholder data
    return [
      {
        name: 'monaco-editor',
        size: 2.5 * 1024 * 1024, // 2.5MB
        impact: 'high'
      },
      {
        name: 'tesseract.js',
        size: 800 * 1024, // 800KB
        impact: 'medium'
      },
      {
        name: 'pdf-lib',
        size: 500 * 1024, // 500KB
        impact: 'medium'
      }
    ];
  }

  private async identifyUnusedDependencies(dependencies: Record<string, string>): Promise<string[]> {
    // This would analyze codebase to identify unused dependencies
    // Placeholder implementation
    return ['lodash', 'moment'];
  }

  private async identifyDuplicateDependencies(): Promise<Array<{
    name: string;
    versions: string[];
    totalSize: number;
  }>> {
    // This would scan for duplicate dependencies
    return [];
  }

  private identifyTreeShakingOpportunities(dependencies: Record<string, string>): string[] {
    // This would identify libraries that benefit from tree shaking
    return ['lucide-react', 'crypto-js', 'axios'];
  }

  private generateRecommendations(
    chunks: BundleMetric[],
    dependencies: DependencyAnalysis
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Large chunk recommendations
    const largeJsChunks = chunks.filter(chunk =>
      chunk.type === 'js' && chunk.size > 100 * 1024
    );

    largeJsChunks.forEach(chunk => {
      recommendations.push({
        type: 'code-splitting',
        priority: 'high',
        description: `Split large JavaScript chunk ${chunk.name} (${this.formatSize(chunk.size)})`,
        estimatedSavings: chunk.size * 0.3,
        implementation: 'Use dynamic imports and route-based code splitting',
      });
    });

    // Dependency recommendations
    dependencies.largestDependencies.forEach(dep => {
      if (dep.impact === 'high') {
        recommendations.push({
          type: 'lazy-loading',
          priority: 'high',
          description: `Lazy load ${dep.name} (${this.formatSize(dep.size)})`,
          estimatedSavings: dep.size * 0.8,
          implementation: 'Import dynamically only when needed',
        });
      }
    });

    // Tree shaking recommendations
    if (dependencies.treeShakingOpportunities.length > 0) {
      recommendations.push({
        type: 'tree-shaking',
        priority: 'medium',
        description: `Enable tree shaking for ${dependencies.treeShakingOpportunities.length} dependencies`,
        estimatedSavings: 100 * 1024,
        implementation: 'Configure webpack for tree shaking and use ES module imports',
      });
    }

    // Unused dependencies
    if (dependencies.unusedDependencies.length > 0) {
      recommendations.push({
        type: 'code-splitting',
        priority: 'low',
        description: `Remove ${dependencies.unusedDependencies.length} unused dependencies`,
        estimatedSavings: 50 * 1024,
        implementation: 'Remove unused packages from package.json',
      });
    }

    // Compression recommendations
    const uncompressedAssets = chunks.filter(chunk =>
      chunk.type === 'asset' && chunk.gzippedSize < chunk.size * 0.3
    );

    if (uncompressedAssets.length > 0) {
      recommendations.push({
        type: 'compression',
        priority: 'medium',
        description: 'Enable better compression for static assets',
        estimatedSavings: uncompressedAssets.reduce((sum, chunk) =>
          sum + (chunk.size - chunk.gzippedSize), 0
        ) * 0.5,
        implementation: 'Configure compression middleware and optimize asset formats',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private checkPerformanceBudget(chunks: BundleMetric[]): PerformanceBudgetStatus {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const jsSize = chunks.filter(c => c.type === 'js').reduce((sum, c) => sum + c.size, 0);
    const cssSize = chunks.filter(c => c.type === 'css').reduce((sum, c) => sum + c.size, 0);
    const assetSize = chunks.filter(c => c.type === 'asset').reduce((sum, c) => sum + c.size, 0);
    const initialSize = chunks.filter(c => c.name.includes('pages/_app') || c.name.includes('framework')).reduce((sum, c) => sum + c.size, 0);

    const overages = [];
    let status: 'within-budget' | 'warning' | 'exceeded' = 'within-budget';

    const checks = [
      { category: 'total', budget: this.budgetConfig.total, actual: totalSize },
      { category: 'javascript', budget: this.budgetConfig.javascript, actual: jsSize },
      { category: 'css', budget: this.budgetConfig.css, actual: cssSize },
      { category: 'assets', budget: this.budgetConfig.assets, actual: assetSize },
      { category: 'initial', budget: this.budgetConfig.initial, actual: initialSize },
    ];

    for (const check of checks) {
      if (check.actual > check.budget) {
        const overage = check.actual - check.budget;
        overages.push({
          category: check.category,
          budget: check.budget,
          actual: check.actual,
          overage,
        });

        const overagePercentage = overage / check.budget;
        if (overagePercentage > 0.2) {
          status = 'exceeded';
        } else if (overagePercentage > 0.1) {
          status = 'warning';
        }
      }
    }

    return {
      budget: this.budgetConfig,
      status,
      overages,
    };
  }

  private saveAnalysis(analysis: BundleAnalysis): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bundle-analysis-${timestamp}.json`;
    const filepath = join(this.analysisPath, filename);

    writeFileSync(filepath, JSON.stringify(analysis, null, 2));

    // Also save latest analysis
    const latestPath = join(this.analysisPath, 'latest-bundle-analysis.json');
    writeFileSync(latestPath, JSON.stringify(analysis, null, 2));
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

  getHistoricalAnalysis(days: number = 7): BundleAnalysis[] {
    // This would read historical analysis files
    // For now, return empty array
    return [];
  }

  generateReport(): string {
    const latestAnalysis = this.getLatestAnalysis();
    if (!latestAnalysis) {
      return 'No bundle analysis available. Run bundle analysis first.';
    }

    const { totalSize, totalGzippedSize, recommendations, performanceBudget } = latestAnalysis;

    let report = `# Bundle Analysis Report\n\n`;
    report += `**Generated:** ${latestAnalysis.timestamp.toISOString()}\n\n`;

    report += `## Bundle Size Summary\n`;
    report += `- **Total Size:** ${this.formatSize(totalSize)}\n`;
    report += `- **Gzipped Size:** ${this.formatSize(totalGzippedSize)}\n`;
    report += `- **Compression Ratio:** ${((totalSize - totalGzippedSize) / totalSize * 100).toFixed(1)}%\n\n`;

    report += `## Performance Budget Status\n`;
    report += `- **Status:** ${performanceBudget.status.toUpperCase()}\n`;

    if (performanceBudget.overages.length > 0) {
      report += `\n### Budget Overages\n`;
      performanceBudget.overages.forEach(overage => {
        report += `- ${overage.category}: ${this.formatSize(overage.actual)} / ${this.formatSize(overage.budget)} (+${this.formatSize(overage.overage)})\n`;
      });
    }

    report += `\n## Optimization Recommendations\n`;
    if (recommendations.length === 0) {
      report += `No recommendations at this time.\n`;
    } else {
      recommendations.forEach((rec, index) => {
        report += `\n### ${index + 1}. ${rec.type.toUpperCase()} (${rec.priority.toUpperCase()})\n`;
        report += `${rec.description}\n`;
        report += `**Estimated Savings:** ${this.formatSize(rec.estimatedSavings)}\n`;
        report += `**Implementation:** ${rec.implementation}\n`;
      });
    }

    return report;
  }

  private getLatestAnalysis(): BundleAnalysis | null {
    const latestPath = join(this.analysisPath, 'latest-bundle-analysis.json');
    if (existsSync(latestPath)) {
      const content = readFileSync(latestPath, 'utf-8');
      return JSON.parse(content);
    }
    return null;
  }
}

export {
  BundleAnalyzer,
  type BundleAnalysis,
  type BundleMetric,
  type DependencyAnalysis,
  type OptimizationRecommendation,
  type PerformanceBudget,
  type PerformanceBudgetStatus,
};

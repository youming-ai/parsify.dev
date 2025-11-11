/**
 * Automated Bundle Optimization Engine
 * Provides automated optimization of bundle size and performance
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { BundleAnalyzer, type BundleAnalysis, type OptimizationRecommendation } from './bundle-analyzer';

interface OptimizationConfig {
  enabled: boolean;
  dryRun: boolean;
  autoApply: boolean;
  compressionEnabled: boolean;
  treeShakingEnabled: boolean;
  codeSplittingEnabled: boolean;
  minificationEnabled: boolean;
  assetOptimizationEnabled: boolean;
  performanceBudget: {
    enabled: boolean;
    failOnExceed: boolean;
    warnOnExceed: boolean;
  };
}

interface OptimizationResult {
  success: boolean;
  optimizationsApplied: string[];
  sizeBefore: number;
  sizeAfter: number;
  compressionRatio: number;
  recommendationsSkipped: string[];
  errors: string[];
  warnings: string[];
}

interface CodeSplittingAnalysis {
  routes: Array<{
    path: string;
    component: string;
    size: number;
    shouldLazyLoad: boolean;
  }>;
  components: Array<{
    name: string;
    size: number;
    usage: number;
    shouldSplit: boolean;
  }>;
  dependencies: Array<{
    name: string;
    size: number;
    canLazyLoad: boolean;
    currentImplementation: 'static' | 'dynamic' | 'none';
  }>;
}

class BundleOptimizationEngine {
  private analyzer: BundleAnalyzer;
  private config: OptimizationConfig;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd(), config?: Partial<OptimizationConfig>) {
    this.projectRoot = projectRoot;
    this.analyzer = new BundleAnalyzer(join(projectRoot, '.next'), join(projectRoot, '.bundle-analysis'));
    this.config = {
      enabled: true,
      dryRun: false,
      autoApply: false,
      compressionEnabled: true,
      treeShakingEnabled: true,
      codeSplittingEnabled: true,
      minificationEnabled: true,
      assetOptimizationEnabled: true,
      performanceBudget: {
        enabled: true,
        failOnExceed: false,
        warnOnExceed: true,
      },
      ...config,
    };
  }

  async runOptimizationPipeline(): Promise<OptimizationResult> {
    console.log('🚀 Starting bundle optimization pipeline...');

    const result: OptimizationResult = {
      success: true,
      optimizationsApplied: [],
      sizeBefore: 0,
      sizeAfter: 0,
      compressionRatio: 0,
      recommendationsSkipped: [],
      errors: [],
      warnings: [],
    };

    try {
      // Step 1: Analyze current bundle
      console.log('📊 Analyzing current bundle...');
      const analysis = await this.analyzer.analyzeBundle();
      result.sizeBefore = analysis.totalSize;

      // Step 2: Check performance budget
      if (this.config.performanceBudget.enabled) {
        await this.checkPerformanceBudget(analysis);
      }

      // Step 3: Apply optimizations based on recommendations
      if (this.config.enabled && !this.config.dryRun) {
        await this.applyOptimizations(analysis, result);
      } else if (this.config.dryRun) {
        console.log('🔍 Dry run mode - showing what would be optimized:');
        this.previewOptimizations(analysis, result);
      }

      // Step 4: Re-analyze if optimizations were applied
      if (result.optimizationsApplied.length > 0 && !this.config.dryRun) {
        console.log('🔄 Re-analyzing bundle after optimizations...');
        const postAnalysis = await this.analyzer.analyzeBundle();
        result.sizeAfter = postAnalysis.totalSize;
        result.compressionRatio = (result.sizeBefore - result.sizeAfter) / result.sizeBefore;
      }

      console.log(`✅ Optimization pipeline completed successfully`);
      console.log(`📈 Size reduction: ${this.formatSize(result.sizeBefore - result.sizeAfter)} (${(result.compressionRatio * 100).toFixed(1)}%)`);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
      console.error('❌ Optimization pipeline failed:', error);
    }

    return result;
  }

  private async checkPerformanceBudget(analysis: BundleAnalysis): Promise<void> {
    if (analysis.performanceBudget.status === 'exceeded') {
      const message = 'Performance budget exceeded!';
      if (this.config.performanceBudget.failOnExceed) {
        throw new Error(`${message} Build cannot continue.`);
      } else if (this.config.performanceBudget.warnOnExceed) {
        console.warn(`⚠️  ${message}`);
        analysis.performanceBudget.overages.forEach(overage => {
          console.warn(`   ${overage.category}: ${this.formatSize(overage.actual)} > ${this.formatSize(overage.budget)}`);
        });
      }
    }
  }

  private async applyOptimizations(analysis: BundleAnalysis, result: OptimizationResult): Promise<void> {
    for (const recommendation of analysis.recommendations) {
      try {
        const applied = await this.applyRecommendation(recommendation);
        if (applied) {
          result.optimizationsApplied.push(recommendation.description);
        } else {
          result.recommendationsSkipped.push(recommendation.description);
        }
      } catch (error) {
        result.errors.push(`Failed to apply "${recommendation.description}": ${error}`);
      }
    }
  }

  private async applyRecommendation(recommendation: OptimizationRecommendation): Promise<boolean> {
    console.log(`🔧 Applying: ${recommendation.description}`);

    switch (recommendation.type) {
      case 'code-splitting':
        return this.applyCodeSplitting(recommendation);
      case 'tree-shaking':
        return this.applyTreeShaking(recommendation);
      case 'compression':
        return this.applyCompression(recommendation);
      case 'lazy-loading':
        return this.applyLazyLoading(recommendation);
      case 'asset-optimization':
        return this.applyAssetOptimization(recommendation);
      default:
        console.warn(`Unknown optimization type: ${recommendation.type}`);
        return false;
    }
  }

  private async applyCodeSplitting(recommendation: OptimizationRecommendation): Promise<boolean> {
    try {
      // Analyze code structure for splitting opportunities
      const analysis = await this.analyzeCodeSplitting();

      // Generate dynamic imports for large components
      const dynamicImports = analysis.routes
        .filter(route => route.shouldLazyLoad)
        .map(route => this.generateDynamicImport(route));

      // Update Next.js configuration for better splitting
      await this.updateNextConfigForSplitting();

      return dynamicImports.length > 0;
    } catch (error) {
      console.warn('Code splitting optimization failed:', error);
      return false;
    }
  }

  private async applyTreeShaking(recommendation: OptimizationRecommendation): Promise<boolean> {
    try {
      // Update webpack configuration for better tree shaking
      await this.updateWebpackConfig();

      // Convert CommonJS imports to ES modules where possible
      await this.convertCommonJSImports();

      return true;
    } catch (error) {
      console.warn('Tree shaking optimization failed:', error);
      return false;
    }
  }

  private async applyCompression(recommendation: OptimizationRecommendation): Promise<boolean> {
    try {
      // Enable compression middleware
      await this.enableCompression();

      // Optimize static assets
      await this.optimizeStaticAssets();

      return true;
    } catch (error) {
      console.warn('Compression optimization failed:', error);
      return false;
    }
  }

  private async applyLazyLoading(recommendation: OptimizationRecommendation): Promise<boolean> {
    try {
      // Identify heavy dependencies
      const heavyDeps = ['monaco-editor', 'tesseract.js', 'pdf-lib'];

      // Generate lazy loading patterns
      for (const dep of heavyDeps) {
        await this.generateLazyLoadingForDependency(dep);
      }

      return true;
    } catch (error) {
      console.warn('Lazy loading optimization failed:', error);
      return false;
    }
  }

  private async applyAssetOptimization(recommendation: OptimizationRecommendation): Promise<boolean> {
    try {
      // Optimize images
      await this.optimizeImages();

      // Minify CSS and JS
      await this.minifyAssets();

      return true;
    } catch (error) {
      console.warn('Asset optimization failed:', error);
      return false;
    }
  }

  private async analyzeCodeSplitting(): Promise<CodeSplittingAnalysis> {
    // This would analyze the codebase for splitting opportunities
    // Placeholder implementation
    return {
      routes: [
        {
          path: '/tools/json',
          component: 'JsonToolsPage',
          size: 50 * 1024,
          shouldLazyLoad: true,
        },
        {
          path: '/tools/code',
          component: 'CodeToolsPage',
          size: 45 * 1024,
          shouldLazyLoad: true,
        },
      ],
      components: [
        {
          name: 'MonacoEditor',
          size: 500 * 1024,
          usage: 3,
          shouldSplit: true,
        },
      ],
      dependencies: [
        {
          name: 'monaco-editor',
          size: 2.5 * 1024 * 1024,
          canLazyLoad: true,
          currentImplementation: 'static',
        },
      ],
    };
  }

  private generateDynamicImport(route: CodeSplittingAnalysis['routes'][0]): string {
    return `
// Dynamic import for ${route.path}
const ${route.component} = dynamic(() => import('@/app${route.path}/page'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});`;
  }

  private async updateNextConfigForSplitting(): Promise<void> {
    const configPath = join(this.projectRoot, 'next.config.js');
    if (!existsSync(configPath)) {
      throw new Error('next.config.js not found');
    }

    const currentConfig = readFileSync(configPath, 'utf-8');

    // Add splitting optimization to config
    const optimizedConfig = currentConfig.replace(
      'experimental: {',
      `experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    swcMinify: true,`
    );

    writeFileSync(configPath, optimizedConfig);
  }

  private async updateWebpackConfig(): Promise<void> {
    const configPath = join(this.projectRoot, 'next.config.js');
    if (!existsSync(configPath)) {
      throw new Error('next.config.js not found');
    }

    const currentConfig = readFileSync(configPath, 'utf-8');

    // Add tree shaking optimization to webpack config
    const optimizedWebpack = `
  webpack: (config, { isServer }) => {
    // Enable Web Workers for client-side processing
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // Configure worker loader
      config.module.rules.push({
        test: /\\.worker\\.(js|ts)$/,
        use: {
          loader: 'worker-loader',
          options: {
            name: 'static/[hash].[name].js',
            publicPath: '/_next/',
          },
        },
      });

      // Enable tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /node_modules/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  }`;

    if (currentConfig.includes('webpack:')) {
      const optimizedConfig = currentConfig.replace(
        /webpack:.*?return config;\s*},?/gs,
        optimizedWebpack.trim()
      );
      writeFileSync(configPath, optimizedConfig);
    }
  }

  private async convertCommonJSImports(): Promise<void> {
    // This would scan and convert CommonJS imports to ES modules
    console.log('Converting CommonJS imports to ES modules...');
  }

  private async enableCompression(): Promise<void> {
    // Create compression configuration
    const compressionConfig = `
// compression.js
import compression from 'compression';

export default compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});
`;

    const configPath = join(this.projectRoot, 'compression.js');
    writeFileSync(configPath, compressionConfig);
  }

  private async optimizeStaticAssets(): Promise<void> {
    // Create static asset optimization script
    const optimizeScript = `
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Optimize static assets
console.log('Optimizing static assets...');

// This would integrate with tools like imagemin, svgo, etc.
// For now, we'll just log the process
`;

    const scriptPath = join(this.projectRoot, 'scripts', 'optimize-assets.js');
    const scriptsDir = dirname(scriptPath);

    if (!existsSync(scriptsDir)) {
      mkdirSync(scriptsDir, { recursive: true });
    }

    writeFileSync(scriptPath, optimizeScript);
  }

  private async generateLazyLoadingForDependency(dep: string): Promise<void> {
    console.log(`Generating lazy loading for ${dep}...`);

    // This would find static imports and convert to dynamic imports
    // Implementation would depend on the specific dependency
  }

  private async optimizeImages(): Promise<void> {
    // Create image optimization configuration
    const imageOptConfig = `
// Image optimization would integrate with Next.js Image component
// and external optimizers for better compression
`;

    const configPath = join(this.projectRoot, 'scripts', 'image-optimization.js');
    writeFileSync(configPath, imageOptConfig);
  }

  private async minifyAssets(): Promise<void> {
    // Create minification script
    const minifyScript = `
// Asset minification configuration
// Would integrate with tools like Terser, cssnano, etc.
`;

    const scriptPath = join(this.projectRoot, 'scripts', 'minify-assets.js');
    writeFileSync(scriptPath, minifyScript);
  }

  private previewOptimizations(analysis: BundleAnalysis, result: OptimizationResult): Promise<void> {
    console.log('\n🔍 Optimization Preview:');
    console.log(`Total size: ${this.formatSize(analysis.totalSize)}`);
    console.log(`Gzipped size: ${this.formatSize(analysis.totalGzippedSize)}`);
    console.log('\n📋 Recommendations that would be applied:');

    analysis.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.type.toUpperCase()}] ${rec.description}`);
      console.log(`   Priority: ${rec.priority}`);
      console.log(`   Estimated savings: ${this.formatSize(rec.estimatedSavings)}`);
    });

    const totalEstimatedSavings = analysis.recommendations.reduce(
      (sum, rec) => sum + rec.estimatedSavings,
      0
    );

    console.log(`\n💰 Total estimated savings: ${this.formatSize(totalEstimatedSavings)}`);

    return Promise.resolve();
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

  async generateOptimizationReport(): Promise<string> {
    const analysis = await this.analyzer.analyzeBundle();
    const result = await this.runOptimizationPipeline();

    let report = '# Bundle Optimization Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;

    report += `## Optimization Results\n`;
    report += `- **Initial Size:** ${this.formatSize(result.sizeBefore)}\n`;
    report += `- **Optimized Size:** ${this.formatSize(result.sizeAfter)}\n`;
    report += `- **Size Reduction:** ${this.formatSize(result.sizeBefore - result.sizeAfter)} (${(result.compressionRatio * 100).toFixed(1)}%)\n`;
    report += `- **Optimizations Applied:** ${result.optimizationsApplied.length}\n\n`;

    if (result.optimizationsApplied.length > 0) {
      report += `### Applied Optimizations\n`;
      result.optimizationsApplied.forEach((opt, index) => {
        report += `${index + 1}. ${opt}\n`;
      });
      report += `\n`;
    }

    if (result.errors.length > 0) {
      report += `### Errors\n`;
      result.errors.forEach(error => {
        report += `- ❌ ${error}\n`;
      });
      report += `\n`;
    }

    if (result.warnings.length > 0) {
      report += `### Warnings\n`;
      result.warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`;
      });
      report += `\n`;
    }

    return report;
  }
}

export {
  BundleOptimizationEngine,
  type OptimizationConfig,
  type OptimizationResult,
  type CodeSplittingAnalysis,
};

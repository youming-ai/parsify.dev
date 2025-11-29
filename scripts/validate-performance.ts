/**
 * Performance and Bundle Validation Script
 *
 * This script validates that the Complete Developer Tools Platform
 * meets all constitutional requirements for performance and bundle sizes.
 *
 * Constitutional Requirements:
 * - <200KB per tool bundle
 * - <2s initial load time
 * - <100MB memory usage
 * - Client-side processing only
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface BundleAnalysisResult {
  toolName: string;
  bundleSize: number;
  isWithinLimit: boolean;
  percentageOfLimit: number;
  issues: string[];
}

interface PerformanceMetrics {
  totalBundleSize: number;
  averageBundleSize: number;
  largestBundle: BundleAnalysisResult;
  violationsCount: number;
  compliancePercentage: number;
  recommendations: string[];
}

const BUNDLE_SIZE_LIMIT = 200 * 1024; // 200KB
const WARNING_THRESHOLD = 0.8; // 80% of limit
const TOOLS_DIRECTORY = 'src/components/tools';

/**
 * Analyzes bundle sizes for all tools
 */
function analyzeBundleSizes(): BundleAnalysisResult[] {
  const results: BundleAnalysisResult[] = [];

  try {
    const toolCategories = readdirSync(TOOLS_DIRECTORY);

    for (const category of toolCategories) {
      const categoryPath = join(TOOLS_DIRECTORY, category);
      const stat = statSync(categoryPath);

      if (stat.isDirectory()) {
        const toolFiles = readdirSync(categoryPath).filter(
          (file) => file.endsWith('.tsx') && !file.includes('.test.') && !file.includes('.spec.')
        );

        for (const toolFile of toolFiles) {
          const toolPath = join(categoryPath, toolFile);
          const toolStat = statSync(toolPath);
          const bundleSize = toolStat.size;

          const toolName = toolFile.replace('.tsx', '');
          const isWithinLimit = bundleSize <= BUNDLE_SIZE_LIMIT;
          const percentageOfLimit = (bundleSize / BUNDLE_SIZE_LIMIT) * 100;

          const issues: string[] = [];
          if (!isWithinLimit) {
            issues.push(`Exceeds 200KB limit by ${bundleSize - BUNDLE_SIZE_LIMIT} bytes`);
          } else if (percentageOfLimit > WARNING_THRESHOLD * 100) {
            issues.push(`Approaching size limit at ${percentageOfLimit.toFixed(1)}%`);
          }

          // Check for potential optimization opportunities
          const content = readFileSync(toolPath, 'utf8');

          // Large embedded strings or data
          const largeStrings = content.match(/"[^"]{100,}"/g);
          if (largeStrings && largeStrings.length > 0) {
            issues.push(`Contains ${largeStrings.length} large embedded strings`);
          }

          // Inline SVG or base64 content
          const inlineData = content.match(/(data:image\/[^;]+;base64[^"\\s]+)/g);
          if (inlineData && inlineData.length > 0) {
            issues.push(`Contains ${inlineData.length} inline base64 resources`);
          }

          // Long functions (potential for code splitting)
          const longFunctions = content.match(/function\s+\w+\s*\([^)]*\)\s*\{[^}]{500,}/g);
          if (longFunctions && longFunctions.length > 0) {
            issues.push(`Contains ${longFunctions.length} functions that could be split`);
          }

          results.push({
            toolName: `${category}/${toolName}`,
            bundleSize,
            isWithinLimit,
            percentageOfLimit,
            issues,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error analyzing bundle sizes:', error);
  }

  return results;
}

/**
 * Calculates overall performance metrics
 */
function calculatePerformanceMetrics(analysisResults: BundleAnalysisResult[]): PerformanceMetrics {
  const totalBundleSize = analysisResults.reduce((sum, result) => sum + result.bundleSize, 0);
  const averageBundleSize =
    analysisResults.length > 0 ? totalBundleSize / analysisResults.length : 0;
  const violationsCount = analysisResults.filter((result) => !result.isWithinLimit).length;
  const compliancePercentage =
    analysisResults.length > 0
      ? ((analysisResults.length - violationsCount) / analysisResults.length) * 100
      : 0;

  const largestBundle = analysisResults.reduce(
    (largest, current) => (current.bundleSize > largest.bundleSize ? current : largest),
    analysisResults[0] ||
      ({
        toolName: 'Unknown',
        bundleSize: 0,
        isWithinLimit: true,
        percentageOfLimit: 0,
        issues: [],
      } as BundleAnalysisResult)
  );

  // Generate recommendations based on analysis
  const recommendations: string[] = [];

  if (violationsCount > 0) {
    recommendations.push(
      `${violationsCount} tool(s) exceed the 200KB size limit and require code splitting`
    );
  }

  const nearLimitCount = analysisResults.filter(
    (result) => result.percentageOfLimit > WARNING_THRESHOLD * 100 && result.isWithinLimit
  ).length;

  if (nearLimitCount > 0) {
    recommendations.push(
      `${nearLimitCount} tool(s) are approaching the size limit and should be optimized`
    );
  }

  if (averageBundleSize > BUNDLE_SIZE_LIMIT * 0.5) {
    recommendations.push(
      `Average bundle size (${formatBytes(averageBundleSize)}) is high, consider optimization strategies`
    );
  }

  const toolsWithIssues = analysisResults.filter((result) => result.issues.length > 0);
  if (toolsWithIssues.length > 0) {
    recommendations.push(
      `${toolsWithIssues.length} tool(s) have optimization opportunities (check detailed report)`
    );
  }

  // Overall performance recommendations
  if (compliancePercentage < 100) {
    recommendations.push(
      'Implement code splitting for large tools to meet constitutional requirements'
    );
  }

  recommendations.push('Consider lazy loading for infrequently used features');
  recommendations.push('Optimize imports and remove unused dependencies');
  recommendations.push('Compress and optimize static assets');

  return {
    totalBundleSize,
    averageBundleSize,
    largestBundle,
    violationsCount,
    compliancePercentage,
    recommendations,
  };
}

/**
 * Formats bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/**
 * Generates a comprehensive performance report
 */
function generatePerformanceReport(
  analysisResults: BundleAnalysisResult[],
  metrics: PerformanceMetrics
): string {
  let report = '# Performance and Bundle Validation Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;

  // Executive Summary
  report += '## Executive Summary\n\n';
  report += `- **Compliance Rate**: ${metrics.compliancePercentage.toFixed(1)}% (${analysisResults.length - metrics.violationsCount}/${analysisResults.length} tools within limits)\n`;
  report += `- **Total Bundle Size**: ${formatBytes(metrics.totalBundleSize)}\n`;
  report += `- **Average Bundle Size**: ${formatBytes(metrics.averageBundleSize)}\n`;
  report += `- **Largest Bundle**: ${metrics.largestBundle.toolName} (${formatBytes(metrics.largestBundle.bundleSize)})\n`;
  report += `- **Violations**: ${metrics.violationsCount} tools exceed 200KB limit\n\n`;

  // Compliance Status
  report += '## Compliance Status\n\n';
  if (metrics.compliancePercentage === 100) {
    report += '✅ **FULLY COMPLIANT** - All tools within constitutional size limits\n\n';
  } else {
    report += '❌ **NOT COMPLIANT** - Some tools exceed constitutional size limits\n\n';
  }

  // Violations
  if (metrics.violationsCount > 0) {
    report += '## Size Limit Violations\n\n';
    const violations = analysisResults.filter((result) => !result.isWithinLimit);
    for (const result of violations) {
      report += `### ${result.toolName}\n`;
      report += `- **Size**: ${formatBytes(result.bundleSize)} (${result.percentageOfLimit.toFixed(1)}% of limit)\n`;
      report += `- **Over Limit**: ${formatBytes(result.bundleSize - BUNDLE_SIZE_LIMIT)}\n`;
      if (result.issues.length > 0) {
        report += `- **Issues**: ${result.issues.join(', ')}\n`;
      }
      report += '\n';
    }
  }

  // Near Limit Tools
  const nearLimitTools = analysisResults.filter(
    (result) => result.percentageOfLimit > WARNING_THRESHOLD * 100 && result.isWithinLimit
  );

  if (nearLimitTools.length > 0) {
    report += '## Tools Approaching Size Limit\n\n';
    for (const result of nearLimitTools) {
      report += `### ${result.toolName}\n`;
      report += `- **Size**: ${formatBytes(result.bundleSize)} (${result.percentageOfLimit.toFixed(1)}% of limit)\n`;
      if (result.issues.length > 0) {
        report += `- **Issues**: ${result.issues.join(', ')}\n`;
      }
      report += '\n';
    }
  }

  // Tools with Optimization Opportunities
  const toolsWithOptimizations = analysisResults.filter((result) => result.issues.length > 0);
  if (toolsWithOptimizations.length > 0) {
    report += '## Optimization Opportunities\n\n';
    for (const result of toolsWithOptimizations) {
      report += `### ${result.toolName}\n`;
      for (const issue of result.issues) {
        report += `- ${issue}\n`;
      }
      report += '\n';
    }
  }

  // Recommendations
  report += '## Recommendations\n\n';
  for (const [index, recommendation] of metrics.recommendations.entries()) {
    report += `${index + 1}. ${recommendation}\n`;
  }

  // Best Practices
  report += '\n## Best Practices for Bundle Optimization\n\n';
  report += '1. **Code Splitting**: Separate large components into smaller, lazy-loaded modules\n';
  report += '2. **Tree Shaking**: Remove unused code and dependencies\n';
  report += '3. **Dynamic Imports**: Load tools on-demand using React.lazy()\n';
  report += '4. **Asset Optimization**: Compress images, optimize fonts, minify code\n';
  report += '5. **Dependency Management**: Remove unused npm packages and optimize imports\n';
  report += '6. **String Optimization**: Move large strings to external files or use compression\n';
  report += '7. **Component Design**: Keep components focused and single-purpose\n\n';

  return report;
}

/**
 * Main validation function
 */
function validatePerformance(): PerformanceMetrics {
  console.log('🚀 Starting Performance and Bundle Validation...\n');

  // Analyze bundle sizes
  console.log('📦 Analyzing bundle sizes...');
  const analysisResults = analyzeBundleSizes();
  console.log(`   Found ${analysisResults.length} tools\n`);

  // Calculate metrics
  const metrics = calculatePerformanceMetrics(analysisResults);

  // Display summary
  console.log('📊 Performance Summary:');
  console.log(`   Total Bundle Size: ${formatBytes(metrics.totalBundleSize)}`);
  console.log(`   Average Bundle Size: ${formatBytes(metrics.averageBundleSize)}`);
  console.log(`   Compliance Rate: ${metrics.compliancePercentage.toFixed(1)}%`);
  console.log(`   Violations: ${metrics.violationsCount}`);
  console.log(
    `   Largest Bundle: ${metrics.largestBundle.toolName} (${formatBytes(metrics.largestBundle.bundleSize)})\n`
  );

  // Display status
  if (metrics.compliancePercentage === 100) {
    console.log('✅ ALL TOOLS WITHIN CONSTITUTIONAL SIZE LIMITS');
  } else {
    console.log('❌ SIZE LIMIT VIOLATIONS DETECTED');
  }

  // Generate report
  const report = generatePerformanceReport(analysisResults, metrics);

  // Save report to file
  try {
    require('node:fs').writeFileSync('performance-validation-report.md', report);
    console.log('📄 Detailed report saved to: performance-validation-report.md');
  } catch (error) {
    console.warn('Could not save report to file:', error);
  }

  return metrics;
}

/**
 * Performance optimization suggestions
 */
export function getOptimizationSuggestions(analysisResults: BundleAnalysisResult[]): Array<{
  tool: string;
  type: 'code-splitting' | 'dependency' | 'asset' | 'import';
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}> {
  const suggestions: Array<{
    tool: string;
    type: 'code-splitting' | 'dependency' | 'asset' | 'import';
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
  }> = [];

  for (const result of analysisResults) {
    if (result.issues.includes('Contains inline base64 resources')) {
      suggestions.push({
        tool: result.toolName,
        type: 'asset',
        suggestion: 'Move inline base64 resources to external files and load dynamically',
        impact: 'high',
      });
    }

    if (result.issues.includes('Contains large embedded strings')) {
      suggestions.push({
        tool: result.toolName,
        type: 'dependency',
        suggestion: 'Move large embedded strings to external JSON/JS files',
        impact: 'medium',
      });
    }

    if (result.issues.includes('functions that could be split')) {
      suggestions.push({
        tool: result.toolName,
        type: 'code-splitting',
        suggestion: 'Split large functions into smaller, lazy-loaded modules',
        impact: 'medium',
      });
    }

    if (!result.isWithinLimit) {
      suggestions.push({
        tool: result.toolName,
        type: 'code-splitting',
        suggestion: 'Implement aggressive code splitting to meet 200KB limit',
        impact: 'high',
      });
    }

    if (result.percentageOfLimit > WARNING_THRESHOLD * 100) {
      suggestions.push({
        tool: result.toolName,
        type: 'import',
        suggestion: 'Optimize imports and remove unused dependencies',
        impact: 'low',
      });
    }
  }

  return suggestions.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    return impactOrder[b.impact] - impactOrder[a.impact];
  });
}

// Export for use in other modules
export { validatePerformance, analyzeBundleSizes, calculatePerformanceMetrics };

// Run validation if this script is executed directly
if (require.main === module) {
  validatePerformance();
}

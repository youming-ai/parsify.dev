/**
 * Asset optimization analysis and reporting utilities
 */

import { promises as fs } from 'fs';
import { join, extname, basename } from 'path';
import { optimizeImage, generateResponsiveImages, getImageMetadata, type OptimizationOptions } from './image-optimizer';
import { optimizeAsset, batchOptimizeAssets, getAssetMetrics, type AssetMetrics } from './asset-compressor';

export interface AssetAnalysis {
  path: string;
  type: 'image' | 'css' | 'js' | 'html' | 'json' | 'font' | 'other';
  originalSize: number;
  optimizedSize?: number;
  compressionRatio?: number;
  metadata: any;
  recommendations: string[];
  optimizationPotential: 'high' | 'medium' | 'low' | 'none';
}

export interface AssetOptimizationReport {
  summary: {
    totalAssets: number;
    totalOriginalSize: number;
    totalOptimizedSize: number;
    overallCompressionRatio: number;
    optimizationScore: number; // 0-100
  };
  byType: Record<string, {
    count: number;
    originalSize: number;
    optimizedSize: number;
    averageCompressionRatio: number;
    optimizationPotential: Record<string, number>;
  }>;
  topOptimizations: Array<{
    path: string;
    type: string;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  }>;
  recommendations: string[];
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    path?: string;
    type?: string;
  }>;
}

export interface AnalysisOptions {
  includeResponsiveImages?: boolean;
  imageFormats?: string[];
  compressionLevel?: number;
  quality?: number;
  skipOptimizations?: boolean;
  generateDetailedReport?: boolean;
}

/**
 * Analyze a single asset file
 */
export async function analyzeAsset(
  filePath: string,
  options: AnalysisOptions = {}
): Promise<AssetAnalysis> {
  try {
    const content = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);
    const ext = extname(filePath).toLowerCase();
    const fileName = basename(filePath);

    let analysis: AssetAnalysis = {
      path: filePath,
      type: getAssetType(ext),
      originalSize: stats.size,
      metadata: {},
      recommendations: [],
      optimizationPotential: 'none',
    };

    // Get basic metadata
    analysis.metadata = {
      extension: ext,
      fileName,
      lastModified: stats.mtime,
    };

    // Analyze based on asset type
    switch (analysis.type) {
      case 'image':
        analysis = await analyzeImageAsset(filePath, content, analysis, options);
        break;
      case 'css':
      case 'js':
      case 'html':
      case 'json':
        analysis = await analyzeTextAsset(filePath, content, analysis, options);
        break;
      case 'font':
        analysis = await analyzeFontAsset(filePath, content, analysis, options);
        break;
      default:
        analysis.optimizationPotential = 'low';
        analysis.recommendations.push('Asset type not supported for optimization');
    }

    return analysis;
  } catch (error) {
    throw new Error(`Failed to analyze asset ${filePath}: ${error}`);
  }
}

/**
 * Analyze image assets specifically
 */
async function analyzeImageAsset(
  filePath: string,
  content: Buffer,
  analysis: AssetAnalysis,
  options: AnalysisOptions
): Promise<AssetAnalysis> {
  try {
    const metadata = await getImageMetadata(content);
    analysis.metadata = { ...analysis.metadata, ...metadata };

    // Check for optimization opportunities
    const recommendations: string[] = [];
    let optimizationPotential: AssetAnalysis['optimizationPotential'] = 'low';

    // Check image size
    if (metadata.width > 1920 || metadata.height > 1920) {
      recommendations.push(`Image dimensions (${metadata.width}x${metadata.height}) exceed recommended maximum (1920px)`);
      optimizationPotential = 'high';
    }

    // Check file format
    if (!['webp', 'avif'].includes(metadata.format)) {
      recommendations.push(`Convert from ${metadata.format.toUpperCase()} to WebP or AVIF for better compression`);
      optimizationPotential = optimizationPotential === 'high' ? 'high' : 'medium';
    }

    // Check file size
    const sizeMB = metadata.size / (1024 * 1024);
    if (sizeMB > 2) {
      recommendations.push(`Large image file (${sizeMB.toFixed(2)}MB) - consider compression or resizing`);
      optimizationPotential = 'high';
    } else if (sizeMB > 500) {
      recommendations.push(`Image file is moderately large (${(sizeMB * 1024).toFixed(0)}KB) - can benefit from optimization`);
      optimizationPotential = optimizationPotential === 'high' ? 'high' : 'medium';
    }

    // Check for progressive JPEG or optimized PNG
    if (metadata.format === 'jpeg' && !metadata.progressive) {
      recommendations.push('Use progressive JPEG for better loading experience');
      optimizationPotential = optimizationPotential === 'high' ? 'high' : 'medium';
    }

    // Check for alpha channel necessity
    if (metadata.hasAlpha && metadata.format === 'png') {
      recommendations.push('Consider using WebP with alpha channel for better compression');
    }

    analysis.recommendations = recommendations;
    analysis.optimizationPotential = optimizationPotential;

    // Perform actual optimization if not skipped
    if (!options.skipOptimizations) {
      const optimized = await optimizeImage(content, {
        quality: options.quality || 80,
        format: 'webp',
        width: metadata.width > 1920 ? 1920 : undefined,
      });

      analysis.optimizedSize = optimized.compressedSize;
      analysis.compressionRatio = optimized.compressionRatio;
    }

    return analysis;
  } catch (error) {
    throw new Error(`Image analysis failed for ${filePath}: ${error}`);
  }
}

/**
 * Analyze text-based assets (CSS, JS, HTML, JSON)
 */
async function analyzeTextAsset(
  filePath: string,
  content: Buffer,
  analysis: AssetAnalysis,
  options: AnalysisOptions
): Promise<AssetAnalysis> {
  try {
    const textContent = content.toString('utf8');
    analysis.metadata = {
      ...analysis.metadata,
      characterCount: textContent.length,
      lineCount: textContent.split('\n').length,
    };

    const recommendations: string[] = [];
    let optimizationPotential: AssetAnalysis['optimizationPotential'] = 'low';

    // Analyze based on type
    switch (analysis.type) {
      case 'css':
        // Check for CSS-specific optimizations
        if (textContent.includes('    ')) {
          recommendations.push('Remove unnecessary whitespace and indentation');
          optimizationPotential = 'medium';
        }
        if (textContent.includes('/*')) {
          recommendations.push('Remove CSS comments for production');
          optimizationPotential = 'low';
        }
        if (textContent.length > 50000) {
          recommendations.push('Consider splitting large CSS files');
          optimizationPotential = 'medium';
        }
        break;

      case 'js':
        // Check for JavaScript-specific optimizations
        if (textContent.includes('console.log') || textContent.includes('debugger')) {
          recommendations.push('Remove debug statements for production');
          optimizationPotential = 'medium';
        }
        if (textContent.includes('    ') || textContent.includes('\t')) {
          recommendations.push('Remove unnecessary whitespace');
          optimizationPotential = 'medium';
        }
        if (textContent.length > 100000) {
          recommendations.push('Consider code splitting for large JavaScript files');
          optimizationPotential = 'high';
        }
        break;

      case 'html':
        // Check for HTML-specific optimizations
        if (textContent.includes('    ') || textContent.includes('\t')) {
          recommendations.push('Minify HTML by removing whitespace');
          optimizationPotential = 'medium';
        }
        if (textContent.includes('<!--')) {
          recommendations.push('Remove HTML comments');
          optimizationPotential = 'low';
        }
        break;

      case 'json':
        // Check for JSON-specific optimizations
        if (textContent.includes('    ') || textContent.includes('\t')) {
          recommendations.push('Minify JSON for production');
          optimizationPotential = 'low';
        }
        break;
    }

    analysis.recommendations = recommendations;
    analysis.optimizationPotential = optimizationPotential;

    // Perform actual optimization if not skipped
    if (!options.skipOptimizations) {
      const optimized = await optimizeAsset(textContent, filePath, {
        minify: true,
        compress: false, // We'll analyze compression separately
      });

      analysis.optimizedSize = Buffer.isBuffer(optimized.optimized)
        ? optimized.optimized.length
        : Buffer.byteLength(optimized.optimized);
      analysis.compressionRatio = analysis.originalSize / analysis.optimizedSize;
    }

    return analysis;
  } catch (error) {
    throw new Error(`Text asset analysis failed for ${filePath}: ${error}`);
  }
}

/**
 * Analyze font assets
 */
async function analyzeFontAsset(
  filePath: string,
  content: Buffer,
  analysis: AssetAnalysis,
  options: AnalysisOptions
): Promise<AssetAnalysis> {
  const recommendations: string[] = [];
  const ext = extname(filePath).toLowerCase();

  // Check font format
  if (ext === '.ttf' || ext === '.otf') {
    recommendations.push('Consider converting to WOFF2 for better compression');
    analysis.optimizationPotential = 'medium';
  } else if (ext === '.woff') {
    recommendations.push('Consider upgrading to WOFF2 for better compression');
    analysis.optimizationPotential = 'low';
  } else {
    analysis.optimizationPotential = 'none';
  }

  // Check font size
  const sizeKB = content.length / 1024;
  if (sizeKB > 200) {
    recommendations.push(`Large font file (${sizeKB.toFixed(0)}KB) - consider font subsetting`);
    analysis.optimizationPotential = 'high';
  }

  analysis.recommendations = recommendations;
  analysis.metadata = {
    ...analysis.metadata,
    format: ext.replace('.', '').toUpperCase(),
    sizeKB: sizeKB.toFixed(0),
  };

  return analysis;
}

/**
 * Get asset type from file extension
 */
function getAssetType(ext: string): AssetAnalysis['type'] {
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
  const cssExts = ['.css', '.scss', '.sass', '.less'];
  const jsExts = ['.js', '.mjs', '.jsx', '.ts', '.tsx'];
  const htmlExts = ['.html', '.htm', '.xhtml'];
  const jsonExts = ['.json'];
  const fontExts = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];

  if (imageExts.includes(ext)) return 'image';
  if (cssExts.includes(ext)) return 'css';
  if (jsExts.includes(ext)) return 'js';
  if (htmlExts.includes(ext)) return 'html';
  if (jsonExts.includes(ext)) return 'json';
  if (fontExts.includes(ext)) return 'font';

  return 'other';
}

/**
 * Analyze all assets in a directory
 */
export async function analyzeDirectory(
  directoryPath: string,
  options: AnalysisOptions = {}
): Promise<AssetOptimizationReport> {
  const analyses: AssetAnalysis[] = [];

  async function scanDirectory(dirPath: string) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await scanDirectory(fullPath);
      } else if (entry.isFile() && !entry.name.startsWith('.')) {
        try {
          const analysis = await analyzeAsset(fullPath, options);
          analyses.push(analysis);
        } catch (error) {
          console.warn(`Failed to analyze ${fullPath}:`, error);
        }
      }
    }
  }

  await scanDirectory(directoryPath);

  return generateOptimizationReport(analyses);
}

/**
 * Generate comprehensive optimization report
 */
function generateOptimizationReport(analyses: AssetAnalysis[]): AssetOptimizationReport {
  const totalAssets = analyses.length;
  const totalOriginalSize = analyses.reduce((sum, a) => sum + a.originalSize, 0);
  const totalOptimizedSize = analyses.reduce((sum, a) => sum + (a.optimizedSize || a.originalSize), 0);
  const overallCompressionRatio = totalOriginalSize / totalOptimizedSize;

  // Group by type
  const byType: Record<string, any> = {};
  analyses.forEach(analysis => {
    if (!byType[analysis.type]) {
      byType[analysis.type] = {
        count: 0,
        originalSize: 0,
        optimizedSize: 0,
        averageCompressionRatio: 0,
        optimizationPotential: { high: 0, medium: 0, low: 0, none: 0 },
      };
    }

    const typeData = byType[analysis.type];
    typeData.count++;
    typeData.originalSize += analysis.originalSize;
    typeData.optimizedSize += analysis.optimizedSize || analysis.originalSize;
    typeData.optimizationPotential[analysis.optimizationPotential]++;
  });

  // Calculate averages
  Object.values(byType).forEach((typeData: any) => {
    typeData.averageCompressionRatio = typeData.originalSize / typeData.optimizedSize;
  });

  // Get top optimizations
  const topOptimizations = analyses
    .filter(a => a.optimizedSize && a.compressionRatio && a.compressionRatio > 1.1)
    .sort((a, b) => (b.compressionRatio || 0) - (a.compressionRatio || 0))
    .slice(0, 10)
    .map(a => ({
      path: a.path,
      type: a.type,
      originalSize: a.originalSize,
      optimizedSize: a.optimizedSize || 0,
      compressionRatio: a.compressionRatio || 0,
    }));

  // Generate recommendations
  const recommendations: string[] = [];
  const issues: AssetOptimizationReport['issues'] = [];

  // Analyze types for recommendations
  if (byType.image) {
    const imageData = byType.image;
    if (imageData.optimizationPotential.high > 0) {
      recommendations.push(`Convert ${imageData.optimizationPotential.high} large images to WebP/AVIF format`);
    }
    if (imageData.averageCompressionRatio < 2) {
      recommendations.push('Optimize images for better compression ratios');
    }
  }

  if (byType.js) {
    const jsData = byType.js;
    if (jsData.optimizationPotential.high > 0) {
      recommendations.push(`Optimize ${jsData.optimizationPotential.high} large JavaScript files`);
    }
    if (jsData.count > 20) {
      recommendations.push('Consider bundling JavaScript files to reduce HTTP requests');
    }
  }

  if (byType.css) {
    if (byType.css.count > 10) {
      recommendations.push('Consider merging CSS files or using CSS-in-JS solutions');
    }
  }

  // Identify issues
  analyses.forEach(analysis => {
    if (analysis.originalSize > 5 * 1024 * 1024) { // > 5MB
      issues.push({
        severity: 'critical',
        message: `Extremely large asset file (${(analysis.originalSize / 1024 / 1024).toFixed(1)}MB)`,
        path: analysis.path,
        type: analysis.type,
      });
    } else if (analysis.originalSize > 1024 * 1024) { // > 1MB
      issues.push({
        severity: 'warning',
        message: `Large asset file (${(analysis.originalSize / 1024 / 1024).toFixed(1)}MB)`,
        path: analysis.path,
        type: analysis.type,
      });
    }
  });

  // Calculate optimization score (0-100)
  let score = 100;
  if (overallCompressionRatio < 1.5) score -= 20;
  if (overallCompressionRatio < 2) score -= 10;
  if (issues.some(i => i.severity === 'critical')) score -= 25;
  if (issues.filter(i => i.severity === 'warning').length > 5) score -= 15;
  score = Math.max(0, score);

  return {
    summary: {
      totalAssets,
      totalOriginalSize,
      totalOptimizedSize,
      overallCompressionRatio,
      optimizationScore: score,
    },
    byType,
    topOptimizations,
    recommendations,
    issues,
  };
}

/**
 * Export analysis results to JSON file
 */
export async function exportAnalysisReport(
  report: AssetOptimizationReport,
  outputPath: string
): Promise<void> {
  const reportData = {
    ...report,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };

  await fs.writeFile(outputPath, JSON.stringify(reportData, null, 2));
}

/**
 * Generate HTML report for asset optimization
 */
export function generateHtmlReport(report: AssetOptimizationReport): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Optimization Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .score { font-size: 48px; font-weight: bold; color: ${report.summary.optimizationScore > 80 ? '#10b981' : report.summary.optimizationScore > 60 ? '#f59e0b' : '#ef4444'}; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric { background: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6; }
        .metric h3 { margin: 0 0 10px 0; color: #1e40af; }
        .metric .value { font-size: 24px; font-weight: bold; color: #1e293b; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .recommendations { list-style: none; padding: 0; }
        .recommendations li { background: #fef3c7; padding: 12px; margin-bottom: 8px; border-radius: 4px; border-left: 4px solid #f59e0b; }
        .issues { list-style: none; padding: 0; }
        .issues.critical { background: #fee2e2; border-left-color: #ef4444; }
        .issues.warning { background: #fef3c7; border-left-color: #f59e0b; }
        .issues li { padding: 12px; margin-bottom: 8px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
        .compression-good { color: #10b981; }
        .compression-medium { color: #f59e0b; }
        .compression-poor { color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Asset Optimization Report</h1>
            <div class="score">${report.summary.optimizationScore}/100</div>
            <p>Optimization Score</p>
        </div>

        <div class="metrics">
            <div class="metric">
                <h3>Total Assets</h3>
                <div class="value">${report.summary.totalAssets}</div>
            </div>
            <div class="metric">
                <h3>Original Size</h3>
                <div class="value">${formatBytes(report.summary.totalOriginalSize)}</div>
            </div>
            <div class="metric">
                <h3>Optimized Size</h3>
                <div class="value">${formatBytes(report.summary.totalOptimizedSize)}</div>
            </div>
            <div class="metric">
                <h3>Compression Ratio</h3>
                <div class="value">${report.summary.overallCompressionRatio.toFixed(2)}x</div>
            </div>
        </div>

        ${report.recommendations.length > 0 ? `
        <div class="section">
            <h2>Recommendations</h2>
            <ul class="recommendations">
                ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${report.issues.length > 0 ? `
        <div class="section">
            <h2>Issues Found</h2>
            <ul class="issues">
                ${report.issues.map(issue => `
                    <li class="${issue.severity}">
                        <strong>${issue.severity.toUpperCase()}:</strong> ${issue.message}
                        ${issue.path ? `<br><small>${issue.path}</small>` : ''}
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        ${report.topOptimizations.length > 0 ? `
        <div class="section">
            <h2>Top Optimization Opportunities</h2>
            <table>
                <thead>
                    <tr>
                        <th>File</th>
                        <th>Type</th>
                        <th>Original Size</th>
                        <th>Optimized Size</th>
                        <th>Compression</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.topOptimizations.map(opt => `
                        <tr>
                            <td>${opt.path.split('/').pop()}</td>
                            <td>${opt.type}</td>
                            <td>${formatBytes(opt.originalSize)}</td>
                            <td>${formatBytes(opt.optimizedSize)}</td>
                            <td class="${opt.compressionRatio > 3 ? 'compression-good' : opt.compressionRatio > 2 ? 'compression-medium' : 'compression-poor'}">
                                ${opt.compressionRatio.toFixed(2)}x
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="section">
            <h2>Breakdown by Type</h2>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Count</th>
                        <th>Original Size</th>
                        <th>Optimized Size</th>
                        <th>Avg Compression</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(report.byType).map(([type, data]: [string, any]) => `
                        <tr>
                            <td>${type.toUpperCase()}</td>
                            <td>${data.count}</td>
                            <td>${formatBytes(data.originalSize)}</td>
                            <td>${formatBytes(data.optimizedSize)}</td>
                            <td>${data.averageCompressionRatio.toFixed(2)}x</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

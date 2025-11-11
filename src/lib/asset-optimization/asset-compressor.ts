/**
 * Asset compression and minification utilities
 */

import { createHash } from 'crypto';
import { promisify } from 'util';
import { gzip, brotliCompress } from 'zlib';
import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as minifyCss } from 'terser';
import { minify as minifyJs } from 'terser';

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

export interface AssetMetrics {
  originalSize: number;
  gzipSize: number;
  brotliSize: number;
  compressionRatio: {
    gzip: number;
    brotli: number;
  };
  type: 'js' | 'css' | 'html' | 'json' | 'image' | 'font' | 'other';
}

export interface CompressionOptions {
  algorithm: 'gzip' | 'brotli' | 'both';
  level?: number;
  threshold?: number;
}

export interface MinificationOptions {
  html?: {
    collapseWhitespace: boolean;
    removeComments: boolean;
    minifyCSS: boolean;
    minifyJS: boolean;
    removeEmptyAttributes: boolean;
    removeOptionalTags: boolean;
    removeRedundantAttributes: boolean;
  };
  css?: {
    compress: boolean;
    mangle: boolean;
    removeComments: boolean;
  };
  js?: {
    compress: boolean;
    mangle: boolean;
    removeComments: boolean;
    ecma: number;
    module: boolean;
  };
}

/**
 * Detect asset type from filename or content
 */
export function detectAssetType(content: string | Buffer, filename?: string): AssetMetrics['type'] {
  // First try to detect from filename extension
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'js':
      case 'mjs':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return 'js';
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return 'css';
      case 'html':
      case 'htm':
      case 'xhtml':
        return 'html';
      case 'json':
        return 'json';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'avif':
      case 'svg':
        return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
      case 'eot':
        return 'font';
    }
  }

  // Detect from content if filename doesn't provide clear info
  const contentStr = Buffer.isBuffer(content) ? content.toString() : content;

  if (contentStr.trim().startsWith('<!DOCTYPE') || contentStr.includes('<html')) {
    return 'html';
  }

  if (contentStr.includes('{') && contentStr.includes('}') && contentStr.includes('"')) {
    try {
      JSON.parse(contentStr);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  if (contentStr.includes('{') && contentStr.includes('function') || contentStr.includes('const')) {
    return 'js';
  }

  if (contentStr.includes('{') && contentStr.includes('color') || contentStr.includes('margin')) {
    return 'css';
  }

  return 'other';
}

/**
 * Minify HTML content
 */
export async function minifyHtmlContent(
  html: string,
  options: MinificationOptions['html'] = {}
): Promise<string> {
  const defaultOptions = {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
    removeEmptyAttributes: true,
    removeOptionalTags: true,
    removeRedundantAttributes: true,
    ...options,
  };

  try {
    return await minifyHtml(html, defaultOptions);
  } catch (error) {
    console.warn('HTML minification failed:', error);
    return html;
  }
}

/**
 * Minify CSS content
 */
export async function minifyCssContent(
  css: string,
  options: MinificationOptions['css'] = {}
): Promise<string> {
  const defaultOptions = {
    compress: {
      drop_console: false,
      passes: 2,
    },
    mangle: {
      toplevel: false,
    },
    format: {
      comments: false,
    },
    ...options,
  };

  try {
    const result = await minifyJs(css, {
      compress: defaultOptions.compress,
      mangle: defaultOptions.mangle,
      format: defaultOptions.format,
    });
    return result.code || css;
  } catch (error) {
    console.warn('CSS minification failed:', error);
    return css;
  }
}

/**
 * Minify JavaScript content
 */
export async function minifyJsContent(
  js: string,
  options: MinificationOptions['js'] = {}
): Promise<string> {
  const defaultOptions = {
    compress: {
      drop_console: false,
      drop_debugger: true,
      passes: 2,
    },
    mangle: {
      toplevel: false,
    },
    format: {
      comments: false,
    },
    ecma: 2020,
    module: false,
    ...options,
  };

  try {
    const result = await minifyJs(js, defaultOptions);
    return result.code || js;
  } catch (error) {
    console.warn('JavaScript minification failed:', error);
    return js;
  }
}

/**
 * Compress content using specified algorithm
 */
export async function compressContent(
  content: string | Buffer,
  options: CompressionOptions = { algorithm: 'both' }
): Promise<{ gzip: Buffer; brotli: Buffer }> {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

  const gzipPromise = options.algorithm !== 'brotli'
    ? gzipAsync(buffer, { level: options.level || 9 })
    : Promise.resolve(Buffer.alloc(0));

  const brotliPromise = options.algorithm !== 'gzip'
    ? brotliAsync(buffer, {
        params: {
          [require('zlib').constants.BROTLI_PARAM_QUALITY]: options.level || 11,
        },
      })
    : Promise.resolve(Buffer.alloc(0));

  const [gzip, brotli] = await Promise.all([gzipPromise, brotliPromise]);

  return { gzip, brotli };
}

/**
 * Get comprehensive asset metrics
 */
export async function getAssetMetrics(
  content: string | Buffer,
  filename?: string,
  options: {
    minify?: boolean;
    compress?: boolean;
  } = {}
): Promise<AssetMetrics> {
  const originalSize = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content);
  const assetType = detectAssetType(content, filename);

  let contentToCompress = content;

  // Apply minification if requested and applicable
  if (options.minify && typeof content === 'string') {
    switch (assetType) {
      case 'html':
        contentToCompress = await minifyHtmlContent(content);
        break;
      case 'css':
        contentToCompress = await minifyCssContent(content);
        break;
      case 'js':
        contentToCompress = await minifyJsContent(content);
        break;
    }
  }

  // Apply compression if requested
  if (options.compress !== false) {
    const { gzip, brotli } = await compressContent(contentToCompress);

    return {
      originalSize,
      gzipSize: gzip.length,
      brotliSize: brotli.length,
      compressionRatio: {
        gzip: originalSize / gzip.length,
        brotli: originalSize / brotli.length,
      },
      type: assetType,
    };
  }

  return {
    originalSize,
    gzipSize: 0,
    brotliSize: 0,
    compressionRatio: {
      gzip: 0,
      brotli: 0,
    },
    type: assetType,
  };
}

/**
 * Optimize asset based on type
 */
export async function optimizeAsset(
  content: string | Buffer,
  filename?: string,
  optimizationOptions: {
    minify?: boolean;
    compress?: boolean;
    minificationOptions?: MinificationOptions;
    compressionOptions?: CompressionOptions;
  } = {}
): Promise<{
  optimized: string | Buffer;
  metrics: AssetMetrics;
  hash: string;
}> {
  const {
    minify = true,
    compress = true,
    minificationOptions = {},
    compressionOptions = {},
  } = optimizationOptions;

  const assetType = detectAssetType(content, filename);
  let optimized = content;

  // Apply minification
  if (minify && typeof content === 'string') {
    switch (assetType) {
      case 'html':
        optimized = await minifyHtmlContent(content, minificationOptions.html);
        break;
      case 'css':
        optimized = await minifyCssContent(content, minificationOptions.css);
        break;
      case 'js':
        optimized = await minifyJsContent(content, minificationOptions.js);
        break;
    }
  }

  // Get metrics
  const metrics = await getAssetMetrics(content, filename, { minify, compress });

  // Create content hash for cache busting
  const hash = createHash('sha256')
    .update(Buffer.isBuffer(optimized) ? optimized : optimized)
    .digest('hex')
    .substring(0, 16);

  return {
    optimized,
    metrics,
    hash,
  };
}

/**
 * Batch optimize multiple assets
 */
export async function batchOptimizeAssets(
  assets: Array<{ name: string; content: string | Buffer }>,
  options: {
    minify?: boolean;
    compress?: boolean;
    minificationOptions?: MinificationOptions;
    compressionOptions?: CompressionOptions;
  } = {}
): Promise<Array<{
  name: string;
  result: Awaited<ReturnType<typeof optimizeAsset>>;
  error?: string;
}>> {
  const results = await Promise.allSettled(
    assets.map(async ({ name, content }) => {
      const result = await optimizeAsset(content, name, options);
      return { name, result };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        name: assets[index].name,
        result: {} as Awaited<ReturnType<typeof optimizeAsset>>,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      };
    }
  });
}

/**
 * Generate asset optimization report
 */
export function generateAssetReport(metrics: AssetMetrics[]): {
  totalOriginalSize: number;
  totalGzipSize: number;
  totalBrotliSize: number;
  averageCompressionRatio: {
    gzip: number;
    brotli: number;
  };
  typeBreakdown: Record<string, {
    count: number;
    totalSize: number;
    averageCompressionRatio: {
      gzip: number;
      brotli: number;
    };
  }>;
  recommendations: string[];
} {
  const totalOriginalSize = metrics.reduce((sum, m) => sum + m.originalSize, 0);
  const totalGzipSize = metrics.reduce((sum, m) => sum + m.gzipSize, 0);
  const totalBrotliSize = metrics.reduce((sum, m) => sum + m.brotliSize, 0);

  const averageCompressionRatio = {
    gzip: metrics.reduce((sum, m) => sum + m.compressionRatio.gzip, 0) / metrics.length,
    brotli: metrics.reduce((sum, m) => sum + m.compressionRatio.brotli, 0) / metrics.length,
  };

  const typeBreakdown: Record<string, any> = {};
  metrics.forEach(metric => {
    if (!typeBreakdown[metric.type]) {
      typeBreakdown[metric.type] = {
        count: 0,
        totalSize: 0,
        averageCompressionRatio: { gzip: 0, brotli: 0 },
      };
    }

    const breakdown = typeBreakdown[metric.type];
    breakdown.count++;
    breakdown.totalSize += metric.originalSize;
    breakdown.averageCompressionRatio.gzip += metric.compressionRatio.gzip;
    breakdown.averageCompressionRatio.brotli += metric.compressionRatio.brotli;
  });

  // Calculate averages for each type
  Object.values(typeBreakdown).forEach((breakdown: any) => {
    breakdown.averageCompressionRatio.gzip /= breakdown.count;
    breakdown.averageCompressionRatio.brotli /= breakdown.count;
  });

  const recommendations: string[] = [];

  if (averageCompressionRatio.gzip < 2) {
    recommendations.push('Consider improving gzip compression configuration');
  }

  if (typeBreakdown.js && typeBreakdown.js.averageCompressionRatio.brotli < 3) {
    recommendations.push('Enable more aggressive JavaScript minification');
  }

  if (typeBreakdown.css && typeBreakdown.css.count > 10) {
    recommendations.push('Consider merging CSS files to reduce HTTP requests');
  }

  if (typeBreakdown.html && typeBreakdown.html.averageCompressionRatio.gzip < 3) {
    recommendations.push('Optimize HTML structure for better compression');
  }

  return {
    totalOriginalSize,
    totalGzipSize,
    totalBrotliSize,
    averageCompressionRatio,
    typeBreakdown,
    recommendations,
  };
}

/**
 * Generate optimized filename with hash
 */
export function generateOptimizedFilename(
  originalName: string,
  hash: string,
  format?: string
): string {
  const parts = originalName.split('.');
  const ext = format || parts.pop() || '';
  const baseName = parts.join('.');

  return `${baseName}.${hash}.${ext}`;
}

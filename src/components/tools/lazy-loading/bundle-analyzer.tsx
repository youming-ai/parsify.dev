/**
 * Bundle Analysis and Optimization - T152 Implementation
 * Advanced bundle analysis tools for optimizing lazy loading and component bundling
 * Provides real-time bundle monitoring, optimization suggestions, and size budgeting
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Treemap,
  TreemapChart,
} from 'recharts';
import {
  Package,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Download,
  Upload,
  Loader2,
  FileText,
  Code,
  Image,
  Database,
  Globe,
  Settings,
  Activity,
  Target,
  Archive,
  Layers
} from 'lucide-react';
import { bundleMonitoringSystem } from '@/monitoring';

// Types for bundle analysis
export interface BundleMetrics {
  totalSize: number; // bytes
  gzippedSize: number; // bytes
  chunkCount: number;
  lazyChunks: number;
  initialLoadTime: number; // ms
  fullLoadTime: number; // ms
  parseTime: number; // ms
  evalTime: number; // ms
  cacheHitRate: number; // percentage
  compressionRatio: number; // percentage
}

export interface ChunkAnalysis {
  id: string;
  name: string;
  size: number; // bytes
  gzippedSize: number; // bytes
  type: 'initial' | 'lazy' | 'vendor' | 'common' | 'async';
  modules: string[];
  dependencies: string[];
  loadTime: number; // ms
  usage: {
    loaded: boolean;
    loadCount: number;
    averageLoadTime: number;
    failureRate: number;
  };
}

export interface OptimizationSuggestion {
  id: string;
  type: 'splitting' | 'tree-shaking' | 'compression' | 'caching' | 'preload' | 'code-splitting';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    sizeReduction: number; // bytes
    performanceGain: number; // ms
    complexity: 'low' | 'medium' | 'high';
  };
  implementation: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  dependencies?: string[];
}

export interface BundleBudget {
  total: number; // bytes
  initial: number; // bytes
  perChunk: number; // bytes
  compression: {
    target: number; // percentage
    current: number; // percentage
  };
  alerts: {
    warning: number; // percentage
    critical: number; // percentage
  };
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// Bundle analyzer component
export function BundleAnalyzer({
  realTime = true,
  showOptimizations = true,
  onOptimizationApply
}: {
  realTime?: boolean;
  showOptimizations?: boolean;
  onOptimizationApply?: (suggestion: OptimizationSuggestion) => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [bundleMetrics, setBundleMetrics] = useState<BundleMetrics | null>(null);
  const [chunkAnalysis, setChunkAnalysis] = useState<ChunkAnalysis[]>([]);
  const [optimizations, setOptimizations] = useState<OptimizationSuggestion[]>([]);
  const [budget, setBudget] = useState<BundleBudget | null>(null);
  const [analysisTime, setAnalysisTime] = useState<Date>(new Date());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simulate bundle analysis
  const analyzeBundle = useCallback(async () => {
    setIsAnalyzing(true);
    const startTime = performance.now();

    try {
      // Simulate API call to analyze bundle
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock bundle metrics
      const metrics: BundleMetrics = {
        totalSize: 2457600, // 2.4MB
        gzippedSize: 768000, // 750KB
        chunkCount: 12,
        lazyChunks: 8,
        initialLoadTime: 850, // ms
        fullLoadTime: 2100, // ms
        parseTime: 120, // ms
        evalTime: 180, // ms
        cacheHitRate: 85, // percentage
        compressionRatio: 69, // percentage
      };

      // Mock chunk analysis
      const chunks: ChunkAnalysis[] = [
        {
          id: 'main',
          name: 'Main Bundle',
          size: 512000, // 500KB
          gzippedSize: 180000, // 175KB
          type: 'initial',
          modules: ['App', 'Layout', 'Navigation', 'HomePage'],
          dependencies: ['react', 'react-dom'],
          loadTime: 350,
          usage: { loaded: true, loadCount: 1, averageLoadTime: 350, failureRate: 0 },
        },
        {
          id: 'monaco-editor',
          name: 'Monaco Editor',
          size: 1024000, // 1MB
          gzippedSize: 320000, // 312KB
          type: 'lazy',
          modules: ['Editor', 'LanguageServices', 'Themes'],
          dependencies: ['@monaco-editor/react'],
          loadTime: 850,
          usage: { loaded: false, loadCount: 0, averageLoadTime: 0, failureRate: 0 },
        },
        {
          id: 'tesseract-ocr',
          name: 'Tesseract OCR',
          size: 1536000, // 1.5MB
          gzippedSize: 480000, // 468KB
          type: 'lazy',
          modules: ['OCR', 'ImageProcessing', 'TextRecognition'],
          dependencies: ['tesseract.js'],
          loadTime: 1200,
          usage: { loaded: false, loadCount: 0, averageLoadTime: 0, failureRate: 0 },
        },
        {
          id: 'vendor-react',
          name: 'React & Vendor',
          size: 256000, // 250KB
          gzippedSize: 78000, // 76KB
          type: 'vendor',
          modules: ['react', 'react-dom', 'react-router'],
          dependencies: [],
          loadTime: 150,
          usage: { loaded: true, loadCount: 1, averageLoadTime: 150, failureRate: 0 },
        },
      ];

      // Mock optimization suggestions
      const suggestions: OptimizationSuggestion[] = [
        {
          id: 'monaco-splitting',
          type: 'splitting',
          priority: 'high',
          title: 'Split Monaco Editor by Language',
          description: 'Separate Monaco Editor language services into individual chunks to reduce initial bundle size.',
          impact: {
            sizeReduction: 600000, // 600KB
            performanceGain: 400, // ms
            complexity: 'medium',
          },
          implementation: [
            'Configure Webpack to split Monaco languages',
            'Use dynamic imports for language-specific features',
            'Implement language preloading strategy',
          ],
          estimatedEffort: 'medium',
          dependencies: ['@monaco-editor/react'],
        },
        {
          id: 'ocr-optimization',
          type: 'compression',
          priority: 'medium',
          title: 'Optimize Tesseract.js Bundle',
          description: 'Use custom Tesseract build with only required languages and features.',
          impact: {
            sizeReduction: 800000, // 800KB
            performanceGain: 600, // ms
            complexity: 'high',
          },
          implementation: [
            'Create custom Tesseract build',
            'Remove unused language data',
            'Enable compression and minification',
          ],
          estimatedEffort: 'high',
          dependencies: ['tesseract.js'],
        },
        {
          id: 'preload-critical',
          type: 'preload',
          priority: 'medium',
          title: 'Preload Critical Components',
          description: 'Preload frequently used components during idle time to improve perceived performance.',
          impact: {
            sizeReduction: 0, // No size reduction
            performanceGain: 300, // ms
            complexity: 'low',
          },
          implementation: [
            'Implement intersection observer for preloading',
            'Add idle time detection',
            'Configure preloading priorities',
          ],
          estimatedEffort: 'low',
        },
        {
          id: 'tree-shaking',
          type: 'tree-shaking',
          priority: 'low',
          title: 'Improve Tree Shaking',
          description: 'Configure better tree shaking to remove unused code and dependencies.',
          impact: {
            sizeReduction: 150000, // 150KB
            performanceGain: 100, // ms
            complexity: 'low',
          },
          implementation: [
            'Update package.json sideEffects',
            'Configure Webpack for better tree shaking',
            'Remove unused imports',
          ],
          estimatedEffort: 'low',
        },
      ];

      // Mock budget
      const bundleBudget: BundleBudget = {
        total: 3145728, // 3MB
        initial: 1048576, // 1MB
        perChunk: 524288, // 512KB
        compression: {
          target: 75, // 75% compression
          current: 69, // 69% compression
        },
        alerts: {
          warning: 80, // 80% of budget
          critical: 95, // 95% of budget
        },
      };

      setBundleMetrics(metrics);
      setChunkAnalysis(chunks);
      setOptimizations(suggestions);
      setBudget(bundleBudget);
      setAnalysisTime(new Date());

      const analysisTime = performance.now() - startTime;
      console.debug(`Bundle analysis completed in ${analysisTime.toFixed(2)}ms`);

    } catch (error) {
      console.error('Failed to analyze bundle:', error);
    } finally {
      setIsAnalyzing(false);
      setIsLoading(false);
    }
  }, []);

  // Initial analysis
  useEffect(() => {
    analyzeBundle();
  }, [analyzeBundle]);

  // Real-time updates
  useEffect(() => {
    if (!realTime) return;

    const interval = setInterval(() => {
      analyzeBundle();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [realTime, analyzeBundle]);

  // Chart data preparation
  const chunkSizeData = useMemo(() => {
    return chunkAnalysis.map(chunk => ({
      name: chunk.name,
      size: Math.round(chunk.size / 1024), // KB
      gzipped: Math.round(chunk.gzippedSize / 1024), // KB
      type: chunk.type,
    }));
  }, [chunkAnalysis]);

  const chunkTypeData = useMemo(() => {
    const typeSizes = chunkAnalysis.reduce((acc, chunk) => {
      acc[chunk.type] = (acc[chunk.type] || 0) + chunk.gzippedSize;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeSizes).map(([type, size]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: Math.round(size / 1024), // KB
    }));
  }, [chunkAnalysis]);

  const treemapData = useMemo(() => {
    return chunkAnalysis.map(chunk => ({
      name: chunk.name,
      size: chunk.gzippedSize,
      type: chunk.type,
    }));
  }, [chunkAnalysis]);

  // Budget status calculation
  const getBudgetStatus = useCallback(() => {
    if (!bundleMetrics || !budget) return null;

    const totalUtilization = (bundleMetrics.totalSize / budget.total) * 100;
    const initialUtilization = (bundleMetrics.gzippedSize / budget.initial) * 100;

    return {
      total: totalUtilization,
      initial: initialUtilization,
      status: totalUtilization > budget.alerts.critical ? 'critical' :
              totalUtilization > budget.alerts.warning ? 'warning' : 'healthy',
    };
  }, [bundleMetrics, budget]);

  const budgetStatus = getBudgetStatus();

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span>Analyzing bundle...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Bundle Analysis</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={analyzeBundle}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Refresh Analysis
          </Button>
        </div>
      </div>

      {/* Budget Status */}
      {budgetStatus && (
        <Alert className={budgetStatus.status === 'critical' ? 'border-red-200' :
                             budgetStatus.status === 'warning' ? 'border-yellow-200' :
                             'border-green-200'}>
          {budgetStatus.status === 'critical' ? (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">
                Bundle Status: {budgetStatus.status.toUpperCase()}
              </div>
              <div className="text-sm">
                Total: {budgetStatus.total.toFixed(1)}% of budget ({formatBytes(bundleMetrics!.totalSize)} / {formatBytes(budget!.total)})
              </div>
              <div className="text-sm">
                Initial: {budgetStatus.initial.toFixed(1)}% of budget ({formatBytes(bundleMetrics!.gzippedSize)} / {formatBytes(budget!.initial)})
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{formatBytes(bundleMetrics!.totalSize)}</div>
                <div className="text-sm text-gray-600">Total Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Archive className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{formatBytes(bundleMetrics!.gzippedSize)}</div>
                <div className="text-sm text-gray-600">Gzipped Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{bundleMetrics!.initialLoadTime}ms</div>
                <div className="text-sm text-gray-600">Initial Load</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{bundleMetrics!.compressionRatio}%</div>
                <div className="text-sm text-gray-600">Compression</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="chunks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chunks">Chunks</TabsTrigger>
          <TabsTrigger value="types">Bundle Types</TabsTrigger>
          <TabsTrigger value="treemap">Size Distribution</TabsTrigger>
          {showOptimizations && <TabsTrigger value="optimizations">Optimizations</TabsTrigger>}
        </TabsList>

        <TabsContent value="chunks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chunk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chunkSizeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} KB`,
                      name === 'size' ? 'Original Size' : 'Gzipped Size'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="size" fill="#3b82f6" name="Original Size" />
                  <Bar dataKey="gzipped" fill="#10b981" name="Gzipped Size" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chunkTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chunkTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} KB`, 'Size']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treemap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Size Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <TreemapChart
                  data={[{ name: 'bundle', children: treemapData }]}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  fill="#8884d8"
                >
                  <Treemap
                    content={({ x, y, width, height, name, size }: any) => (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          style={{
                            fill: COLORS[Math.floor(Math.random() * COLORS.length)],
                            stroke: '#fff',
                            strokeWidth: 2,
                          }}
                        />
                        {width > 50 && height > 30 && (
                          <>
                            <text
                              x={x + width / 2}
                              y={y + height / 2 - 5}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize={12}
                              fontWeight="bold"
                            >
                              {name}
                            </text>
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 10}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize={10}
                            >
                              {formatBytes(size)}
                            </text>
                          </>
                        )}
                      </g>
                    )}
                  />
                </TreemapChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {showOptimizations && (
          <TabsContent value="optimizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizations.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={suggestion.priority === 'high' ? 'destructive' :
                                    suggestion.priority === 'medium' ? 'default' : 'secondary'}
                          >
                            {suggestion.priority.toUpperCase()}
                          </Badge>
                          <h3 className="font-semibold">{suggestion.title}</h3>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <TrendingDown className="h-4 w-4" />
                          <span>{formatBytes(suggestion.impact.sizeReduction)}</span>
                          <Zap className="h-4 w-4 ml-2" />
                          <span>{suggestion.impact.performanceGain}ms</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600">{suggestion.description}</p>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Implementation:</div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {suggestion.implementation.map((step, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-500">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <Badge variant="outline">
                            Complexity: {suggestion.impact.complexity}
                          </Badge>
                          <Badge variant="outline">
                            Effort: {suggestion.estimatedEffort}
                          </Badge>
                        </div>

                        {onOptimizationApply && (
                          <Button
                            size="sm"
                            onClick={() => onOptimizationApply(suggestion)}
                          >
                            Apply Optimization
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Analysis Footer */}
      <div className="text-center text-sm text-gray-500">
        Last analysis: {analysisTime.toLocaleString()}
      </div>
    </div>
  );
}

// Bundle optimization utilities
export const BundleOptimizationUtils = {
  // Analyze component usage patterns
  analyzeComponentUsage: (componentIds: string[]) => {
    // This would analyze which components are used most frequently
    // to inform preloading and bundling decisions
    console.debug('Analyzing component usage patterns...');
  },

  // Suggest bundle splitting strategy
  suggestSplittingStrategy: (chunks: ChunkAnalysis[]) => {
    const strategies = [];

    // Find large chunks that should be split
    const largeChunks = chunks.filter(chunk => chunk.size > 500000);
    if (largeChunks.length > 0) {
      strategies.push({
        type: 'size-based',
        chunks: largeChunks,
        suggestion: 'Split large chunks into smaller, more focused modules',
      });
    }

    // Find chunks with low usage that could be further lazy-loaded
    const lowUsageChunks = chunks.filter(chunk =>
      chunk.type !== 'lazy' && chunk.usage.loadCount === 0
    );
    if (lowUsageChunks.length > 0) {
      strategies.push({
        type: 'usage-based',
        chunks: lowUsageChunks,
        suggestion: 'Convert unused initial chunks to lazy-loaded chunks',
      });
    }

    return strategies;
  },

  // Calculate compression opportunities
  calculateCompressionOpportunities: (metrics: BundleMetrics) => {
    const currentCompression = (1 - metrics.gzippedSize / metrics.totalSize) * 100;
    const targetCompression = 75; // 75% compression target

    if (currentCompression < targetCompression) {
      const potentialSavings = metrics.totalSize * (targetCompression - currentCompression) / 100;
      return {
        current: currentCompression,
        target: targetCompression,
        potentialSavings,
        suggestions: [
          'Enable Brotli compression',
          'Minimize and uglify code',
          'Optimize asset compression',
          'Remove unused code and dependencies',
        ],
      };
    }

    return null;
  },
};

export default BundleAnalyzer;

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  PieChart,
  Share2,
  TrendingUp,
} from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';

export interface NLPResultMetric {
  name: string;
  value: number | string;
  unit?: string;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

export interface NLPResultData {
  id: string;
  type: 'classification' | 'extraction' | 'analysis' | 'generation' | 'translation';
  title: string;
  description?: string;
  confidence?: number;
  processingTime?: number;
  timestamp: Date;
  metrics?: NLPResultMetric[];
  visualizations?: {
    type: 'chart' | 'graph' | 'heatmap' | 'wordcloud' | 'timeline';
    data: any;
    title?: string;
  }[];
  rawData?: any;
  summary?: string;
  tags?: string[];
}

interface NLPResultsProps {
  results: NLPResultData[];
  loading?: boolean;
  error?: string;
  className?: string;
  showMetrics?: boolean;
  showVisualizations?: boolean;
  showRawData?: boolean;
  allowExport?: boolean;
  onExport?: (format: 'json' | 'csv' | 'xml' | 'txt', results: NLPResultData[]) => void;
  onShare?: (result: NLPResultData) => void;
  onResultClick?: (result: NLPResultData) => void;
}

const RESULT_TYPE_COLORS = {
  classification: 'bg-blue-500',
  extraction: 'bg-green-500',
  analysis: 'bg-purple-500',
  generation: 'bg-orange-500',
  translation: 'bg-pink-500',
};

const CONFIDENCE_COLORS = {
  high: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-red-600 bg-red-50',
};

function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

function MetricCard({ metric }: { metric: NLPResultMetric }) {
  const trendIcon = useMemo(() => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 rotate-180 text-red-500" />;
      default:
        return null;
    }
  }, [metric.trend]);

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex-1">
        <div className="font-medium text-sm">{metric.name}</div>
        {metric.description && (
          <div className="mt-1 text-gray-500 text-xs">{metric.description}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('font-semibold text-lg', metric.color)}>
          {metric.value}
          {metric.unit && <span className="ml-1 font-normal text-sm">{metric.unit}</span>}
        </span>
        {trendIcon}
      </div>
    </div>
  );
}

function VisualizationCard({ visualization }: { visualization: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {visualization.type === 'chart' && <BarChart3 className="h-4 w-4" />}
            {visualization.type === 'graph' && <Activity className="h-4 w-4" />}
            {visualization.type === 'wordcloud' && <PieChart className="h-4 w-4" />}
            <CardTitle className="text-sm">
              {visualization.title || `${visualization.type} Visualization`}
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50">
            <div className="text-center text-gray-500">
              <BarChart3 className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm">Visualization placeholder</p>
              <p className="text-xs">
                Data: {JSON.stringify(visualization.data).substring(0, 100)}...
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function ResultCard({
  result,
  onClick,
  onShare,
  showMetrics = true,
  showVisualizations = true,
}: {
  result: NLPResultData;
  onClick?: (result: NLPResultData) => void;
  onShare?: (result: NLPResultData) => void;
  showMetrics?: boolean;
  showVisualizations?: boolean;
}) {
  const [showRawData, setShowRawData] = useState(false);
  const confidence = typeof result.confidence === 'number' ? result.confidence : null;
  const confidenceLevel = confidence !== null ? getConfidenceLevel(confidence) : null;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        onClick && 'hover:border-primary'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <div className={cn('h-3 w-3 rounded-full', RESULT_TYPE_COLORS[result.type])} />
              <Badge variant="secondary" className="capitalize">
                {result.type}
              </Badge>
              {confidenceLevel !== null && confidence !== null && (
                <Badge variant="outline" className={CONFIDENCE_COLORS[confidenceLevel]}>
                  {Math.round(confidence * 100)}% confidence
                </Badge>
              )}
              {result.processingTime && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {result.processingTime}ms
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-tight">{result.title}</CardTitle>
            {result.description && (
              <p className="mt-1 text-gray-600 text-sm">{result.description}</p>
            )}
          </div>
          <div className="flex gap-1">
            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(result);
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {result.tags && result.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {result.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        {result.summary && (
          <div>
            <h4 className="mb-2 font-medium text-sm">Summary</h4>
            <p className="text-gray-700 text-sm">{result.summary}</p>
          </div>
        )}

        {/* Metrics */}
        {showMetrics && result.metrics && result.metrics.length > 0 && (
          <div>
            <h4 className="mb-3 font-medium text-sm">Key Metrics</h4>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {result.metrics.slice(0, 6).map((metric, index) => (
                <MetricCard key={index} metric={metric} />
              ))}
            </div>
          </div>
        )}

        {/* Visualizations */}
        {showVisualizations && result.visualizations && result.visualizations.length > 0 && (
          <div>
            <h4 className="mb-3 font-medium text-sm">Visualizations</h4>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {result.visualizations.map((viz, index) => (
                <VisualizationCard key={index} visualization={viz} />
              ))}
            </div>
          </div>
        )}

        {/* Raw Data Toggle */}
        {result.rawData && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
              className="mb-2"
            >
              {showRawData ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showRawData ? 'Hide' : 'Show'} Raw Data
            </Button>
            {showRawData && (
              <ScrollArea className="h-48 w-full rounded-lg border p-3">
                <pre className="overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                  {JSON.stringify(result.rawData, null, 2)}
                </pre>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 border-t pt-2 text-gray-500 text-xs">
          <Clock className="h-3 w-3" />
          {result.timestamp.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export function NlpResults({
  results,
  loading = false,
  error,
  className,
  showMetrics = true,
  showVisualizations = true,
  showRawData = true,
  allowExport = true,
  onExport,
  onShare,
  onResultClick,
}: NLPResultsProps) {
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

  const _handleSelectResult = useCallback((resultId: string) => {
    setSelectedResults((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(results.map((r) => r.id)));
    }
  }, [results, selectedResults]);

  const handleExport = useCallback(
    (format: 'json' | 'csv' | 'xml' | 'txt') => {
      const selectedResultData = results.filter((r) => selectedResults.has(r.id));
      onExport?.(format, selectedResultData.length > 0 ? selectedResultData : results);
    },
    [results, selectedResults, onExport]
  );

  const handleCopyResults = useCallback(() => {
    const selectedResultData = results.filter((r) => selectedResults.has(r.id));
    const dataToCopy = selectedResultData.length > 0 ? selectedResultData : results;
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
  }, [results, selectedResults]);

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="h-20 rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-2 text-red-700 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className={cn('border-gray-200 bg-gray-50', className)}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <h3 className="mb-2 font-medium">No Results Yet</h3>
            <p className="text-sm">Run an NLP analysis to see results here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Export Controls */}
      {allowExport && results.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedResults.size === results.length}
                  onChange={handleSelectAll}
                  className="rounded"
                />
                <span className="text-sm">
                  {selectedResults.size === 0
                    ? `${results.length} results`
                    : `${selectedResults.size} of ${results.length} selected`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyResults}
                  disabled={!results.length}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('json')}
                  disabled={!results.length}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  disabled={!results.length}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-4">
        {results.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            onClick={onResultClick}
            onShare={onShare}
            showMetrics={showMetrics}
            showVisualizations={showVisualizations}
          />
        ))}
      </div>
    </div>
  );
}

export default NlpResults;

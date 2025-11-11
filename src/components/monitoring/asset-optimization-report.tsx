/**
 * Asset Optimization Report Component
 * Displays comprehensive asset optimization analysis and recommendations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Package,
  Image,
  FileText,
  Code,
  Zap,
  Download,
  RefreshCw,
  Settings,
  Info,
  AlertCircle
} from 'lucide-react';
import { assetOptimizationSystem, type AssetOptimizationReport, type AssetRecommendation, type AssetAlert } from '@/monitoring/asset-optimization-system';
import { formatBytes } from '@/lib/utils';

interface AssetOptimizationReportProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function AssetOptimizationReport({
  className,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: AssetOptimizationReportProps) {
  const [report, setReport] = useState<AssetOptimizationReport | null>(null);
  const [recommendations, setRecommendations] = useState<AssetRecommendation[]>([]);
  const [alerts, setAlerts] = useState<AssetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReport();

    if (autoRefresh) {
      const interval = setInterval(loadReport, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadReport = async () => {
    try {
      setError(null);
      const state = assetOptimizationSystem.getState();
      setReport(state.currentReport || null);
      setRecommendations(state.recommendations);
      setAlerts(state.alerts.filter(alert => !alert.resolved));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load optimization report');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const newReport = await assetOptimizationSystem.performAssetAnalysis();
      setReport(newReport);
      loadReport(); // Reload state to get updated recommendations and alerts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh analysis');
    } finally {
      setRefreshing(false);
    }
  };

  const executeRecommendation = async (recommendationId: string) => {
    try {
      await assetOptimizationSystem.executeRecommendation(recommendationId);
      await loadReport(); // Reload to see updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute recommendation');
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    // Update alert as acknowledged
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const exportReport = async () => {
    if (!report) return;

    const reportData = {
      ...report,
      timestamp: new Date().toISOString(),
      recommendations,
      alerts: alerts.filter(a => !a.acknowledged),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-optimization-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Asset Optimization Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Asset Optimization Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Asset Optimization Report
          </CardTitle>
          <CardDescription>No optimization analysis available</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-8 w-8 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
    return <AlertCircle className="h-8 w-8 text-red-600" />;
  };

  const getPriorityColor = (priority: AssetRecommendation['priority']) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: AssetAlert['severity']) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Asset Optimization Report
          </h2>
          <p className="text-muted-foreground">
            Last analysis: {report.summary.totalOptimizedSize > 0 ?
              new Date().toLocaleString() : 'Not yet analyzed'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Score Overview */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Optimization Score</h3>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${getScoreColor(report.summary.optimizationScore)}`}>
                  {report.summary.optimizationScore}/100
                </div>
                {getScoreIcon(report.summary.optimizationScore)}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{report.summary.totalAssets}</div>
                <div className="text-sm text-muted-foreground">Total Assets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatBytes(report.summary.totalOriginalSize)}</div>
                <div className="text-sm text-muted-foreground">Original Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatBytes(report.summary.totalOptimizedSize)}</div>
                <div className="text-sm text-muted-foreground">Optimized Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{report.summary.overallCompressionRatio.toFixed(2)}x</div>
                <div className="text-sm text-muted-foreground">Compression</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">
            Recommendations ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts ({alerts.filter(a => !a.acknowledged).length})
          </TabsTrigger>
          <TabsTrigger value="assets">Asset Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Asset Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(report.byType).map(([type, data]) => {
                  const icon = {
                    image: <Image className="h-4 w-4" />,
                    js: <Code className="h-4 w-4" />,
                    css: <FileText className="h-4 w-4" />,
                    html: <FileText className="h-4 w-4" />,
                    json: <FileText className="h-4 w-4" />,
                    font: <FileText className="h-4 w-4" />,
                  }[type] || <Package className="h-4 w-4" />;

                  return (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {icon}
                        <div>
                          <div className="font-medium capitalize">{type}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.count} files • {formatBytes(data.originalSize)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{data.averageCompressionRatio.toFixed(2)}x</div>
                        <div className="text-sm text-muted-foreground">compression</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Optimizations */}
          {report.topOptimizations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Optimization Opportunities</CardTitle>
                <CardDescription>
                  Assets with the highest potential for size reduction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.topOptimizations.slice(0, 5).map((optimization, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium truncate max-w-md">
                          {optimization.path.split('/').pop()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {optimization.type.toUpperCase()} • {formatBytes(optimization.originalSize)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={optimization.compressionRatio > 3 ? 'default' : 'secondary'}>
                          {optimization.compressionRatio.toFixed(2)}x
                        </Badge>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            -{formatBytes(optimization.originalSize - optimization.optimizedSize)}
                          </div>
                          <div className="text-sm text-muted-foreground">saved</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Optimized!</h3>
                  <p className="text-muted-foreground">
                    No optimization recommendations at this time.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            recommendations.map((recommendation) => (
              <Card key={recommendation.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{recommendation.title}</h3>
                        <Badge variant={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">
                        {recommendation.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-4 w-4 text-green-600" />
                          <span className="font-medium">
                            {formatBytes(recommendation.estimatedSavings)} saved
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">
                            {recommendation.estimatedImprovement.toFixed(1)}% improvement
                          </span>
                        </div>
                        {recommendation.assets.length > 0 && (
                          <div className="text-muted-foreground">
                            {recommendation.assets.length} asset{recommendation.assets.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {recommendation.action.automated && (
                        <Button
                          onClick={() => executeRecommendation(recommendation.id)}
                          disabled={recommendation.status === 'in-progress'}
                          variant="default"
                        >
                          {recommendation.status === 'in-progress' ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4 mr-2" />
                          )}
                          {recommendation.status === 'in-progress' ? 'Executing...' : 'Auto-Fix'}
                        </Button>
                      )}
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Manual
                      </Button>
                    </div>
                  </div>
                  {recommendation.assets.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="text-sm text-muted-foreground mb-2">Affected assets:</div>
                      <div className="space-y-1">
                        {recommendation.assets.slice(0, 3).map((asset, index) => (
                          <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                            {asset.split('/').pop()}
                          </div>
                        ))}
                        {recommendation.assets.length > 3 && (
                          <div className="text-sm text-muted-foreground">
                            ... and {recommendation.assets.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                  <p className="text-muted-foreground">
                    All systems operating within normal parameters.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                {getSeverityIcon(alert.severity)}
                <AlertTitle className="flex items-center justify-between">
                  <span>{alert.title}</span>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="mt-2">
                  <p>{alert.message}</p>
                  {alert.assets && alert.assets.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-sm font-medium">Affected assets:</div>
                      {alert.assets.map((asset, index) => (
                        <div key={index} className="text-sm font-mono bg-muted p-1 rounded">
                          {asset.split('/').pop()}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleString()}
                    </span>
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))
          )}
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
              <CardDescription>
                Detailed information about all analyzed assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Count</th>
                      <th className="text-left p-2">Original Size</th>
                      <th className="text-left p-2">Optimized Size</th>
                      <th className="text-left p-2">Compression</th>
                      <th className="text-left p-2">Potential</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.byType).map(([type, data]) => (
                      <tr key={type} className="border-b">
                        <td className="p-2 capitalize">{type}</td>
                        <td className="p-2">{data.count}</td>
                        <td className="p-2">{formatBytes(data.originalSize)}</td>
                        <td className="p-2">{formatBytes(data.optimizedSize)}</td>
                        <td className="p-2">
                          <Badge variant={data.averageCompressionRatio > 2 ? 'default' : 'secondary'}>
                            {data.averageCompressionRatio.toFixed(2)}x
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            {data.optimizationPotential.high > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                H: {data.optimizationPotential.high}
                              </Badge>
                            )}
                            {data.optimizationPotential.medium > 0 && (
                              <Badge variant="default" className="text-xs">
                                M: {data.optimizationPotential.medium}
                              </Badge>
                            )}
                            {data.optimizationPotential.low > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                L: {data.optimizationPotential.low}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

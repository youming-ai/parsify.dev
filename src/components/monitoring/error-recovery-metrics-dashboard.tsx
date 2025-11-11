/**
 * Comprehensive Error Recovery Metrics Dashboard for SC-009 Compliance
 * Advanced dashboard for monitoring error recovery performance and compliance
 * Features real-time metrics, detailed analytics, and actionable insights
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Users,
  AlertCircle,
  Info,
  BarChart3,
  Settings,
  Download,
  Eye,
  Play,
  Pause,
  RotateCcw,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Zap,
  Shield,
  Timer,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Trophy,
  Flame,
  Icecream,
  Target as TargetIcon,
  Gauge,
  Brain,
  Lightbulb,
  Database,
  Cpu,
  Wifi,
  Monitor,
  Globe,
  Smartphone,
  Tablet,
  MonitorSpeaker
} from 'lucide-react';

import {
  ErrorRecoveryMetrics,
  ErrorEvent,
  ErrorType,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  RecoveryOutcome,
  SC009TargetProgress,
  ErrorRecoveryRecommendation,
  RealtimeErrorRecoveryMetrics,
  ErrorRecoveryAlert,
  EffectivenessMetrics,
  StrategyPerformance,
  RecoveryOptimization
} from '@/monitoring/error-recovery-types';

interface ErrorRecoveryMetricsDashboardProps {
  className?: string;
  sessionId?: string;
  toolId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showRealtime?: boolean;
  showAlerts?: boolean;
  showRecommendations?: boolean;
  showPredictions?: boolean;
  enableDrillDown?: boolean;
  exportEnabled?: boolean;
}

export function ErrorRecoveryMetricsDashboard({
  className,
  sessionId,
  toolId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  showRealtime = true,
  showAlerts = true,
  showRecommendations = true,
  showPredictions = true,
  enableDrillDown = true,
  exportEnabled = true
}: ErrorRecoveryMetricsDashboardProps) {
  // State management
  const [metrics, setMetrics] = useState<ErrorRecoveryMetrics | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeErrorRecoveryMetrics | null>(null);
  const [recentErrors, setRecentErrors] = useState<ErrorEvent[]>([]);
  const [alerts, setAlerts] = useState<ErrorRecoveryAlert[]>([]);
  const [recommendations, setRecommendations] = useState<ErrorRecoveryRecommendation[]>([]);
  const [optimizations, setOptimizations] = useState<RecoveryOptimization[]>([]);
  const [effectivenessMetrics, setEffectivenessMetrics] = useState<Map<string, EffectivenessMetrics>>(new Map());
  const [strategyPerformance, setStrategyPerformance] = useState<Map<RecoveryStrategy, StrategyPerformance>>(new Map());

  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(autoRefresh);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [selectedErrorType, setSelectedErrorType] = useState<ErrorType | 'all'>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<RecoveryStrategy | 'all'>('all');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed' | 'expert'>('summary');

  // Data fetching
  const fetchErrorRecoveryData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        range: selectedTimeRange,
        ...(sessionId && { sessionId }),
        ...(toolId && { toolId }),
        ...(selectedErrorType !== 'all' && { errorType: selectedErrorType }),
        ...(selectedStrategy !== 'all' && { strategy: selectedStrategy })
      });

      const response = await fetch(`/api/error-recovery/comprehensive-metrics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch error recovery metrics');

      const data = await response.json();
      setMetrics(data.metrics);
      setRealtimeMetrics(data.realtimeMetrics);
      setRecentErrors(data.recentErrors);
      setAlerts(data.alerts);
      setRecommendations(data.recommendations);
      setOptimizations(data.optimizations);
      setEffectivenessMetrics(new Map(Object.entries(data.effectivenessMetrics || {})));
      setStrategyPerformance(new Map(Object.entries(data.strategyPerformance || {})));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch error recovery data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange, sessionId, toolId, selectedErrorType, selectedStrategy]);

  // Auto-refresh effect
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(fetchErrorRecoveryData, refreshInterval);
    return () => clearInterval(interval);
  }, [isLive, refreshInterval, fetchErrorRecoveryData]);

  // Initial data fetch
  useEffect(() => {
    fetchErrorRecoveryData();
  }, [fetchErrorRecoveryData]);

  // Memoized calculations
  const sc009Compliance = useMemo(() => {
    if (!metrics) return { compliant: false, rate: 0, gap: 0 };

    const rate = metrics.overallRecoveryRate;
    const target = 0.98; // 98% target for SC-009
    const gap = target - rate;

    return {
      compliant: rate >= target,
      rate: Math.round(rate * 100),
      gap: Math.max(0, Math.round(gap * 100))
    };
  }, [metrics]);

  const topPerformingStrategies = useMemo(() => {
    if (!strategyPerformance.size) return [];

    return Array.from(strategyPerformance.values())
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 5);
  }, [strategyPerformance]);

  const criticalAlerts = useMemo(() => {
    return alerts.filter(alert => alert.severity === 'critical' && !alert.acknowledged);
  }, [alerts]);

  const highImpactRecommendations = useMemo(() => {
    return recommendations
      .filter(rec => rec.expectedImprovement.sc009ComplianceImpact > 0.05)
      .sort((a, b) => b.expectedImprovement.sc009ComplianceImpact - a.expectedImprovement.sc009ComplianceImpact)
      .slice(0, 5);
  }, [recommendations]);

  // Render functions
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* SC-009 Compliance Hero Section */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold text-blue-900">SC-009 Compliance Status</CardTitle>
          <div className="flex items-center space-x-2">
            <Shield className={`h-6 w-6 ${sc009Compliance.compliant ? 'text-green-600' : 'text-red-600'}`} />
            {sc009Compliance.compliant ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">Compliant</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 border-red-200">Non-Compliant</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900">
                {sc009Compliance.rate}%
              </div>
              <p className="text-sm text-blue-700 mb-2">Current Recovery Rate</p>
              <Progress
                value={sc009Compliance.rate}
                className="h-3 bg-blue-100"
              />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900">
                98%
              </div>
              <p className="text-sm text-blue-700 mb-2">SC-009 Target</p>
              <div className="flex items-center justify-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-600">98% Error Recovery</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900">
                {sc009Compliance.gap > 0 ? `-${sc009Compliance.gap}%` : '✓'}
              </div>
              <p className="text-sm text-blue-700 mb-2">Gap to Target</p>
              {sc009Compliance.gap > 0 && (
                <div className="flex items-center justify-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-orange-600">Needs Improvement</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Recovery Rate */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${(metrics.overallRecoveryRate * 100).toFixed(1)}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics ? `${metrics.totalErrors} total errors` : 'Loading...'}
            </p>
            {metrics && (
              <div className="flex items-center mt-2">
                {metrics.overallRecoveryRate >= 0.98 ? (
                  <div className="flex items-center text-green-600 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Above SC-009 target
                  </div>
                ) : (
                  <div className="flex items-center text-red-600 text-xs">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Below SC-009 target
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Average Recovery Time */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Recovery Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${(metrics.averageRecoveryTime / 1000).toFixed(1)}s` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics ? `Median: ${(metrics.medianRecoveryTime / 1000).toFixed(1)}s` : 'Loading...'}
            </p>
            {metrics && metrics.averageRecoveryTime <= 30000 ? (
              <div className="flex items-center text-green-600 text-xs mt-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Fast recovery
              </div>
            ) : metrics && (
              <div className="flex items-center text-orange-600 text-xs mt-2">
                <AlertCircle className="h-3 w-3 mr-1" />
                Above optimal time
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Satisfaction */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${(metrics.userSatisfactionScore * 100).toFixed(0)}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average user rating
            </p>
            {metrics && (
              <div className="flex items-center mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.round(metrics.userSatisfactionScore * 5)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {(metrics.userSatisfactionScore * 5).toFixed(1)}/5.0
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${metrics.systemHealthScore}/100` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall system performance
            </p>
            {metrics && (
              <div className="flex items-center mt-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  metrics.systemHealthScore >= 90 ? 'bg-green-500' :
                  metrics.systemHealthScore >= 70 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className={`text-xs ${
                  metrics.systemHealthScore >= 90 ? 'text-green-600' :
                  metrics.systemHealthScore >= 70 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {metrics.systemHealthScore >= 90 ? 'Excellent' :
                   metrics.systemHealthScore >= 70 ? 'Good' :
                   'Needs Attention'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Strategy Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Performing Recovery Strategies</CardTitle>
              <CardDescription>Most effective strategies for error recovery</CardDescription>
            </div>
            <Badge variant="outline">
              {topPerformingStrategies.length} strategies
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformingStrategies.map((strategy, index) => (
              <div key={strategy.strategy} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index === 0 ? <Trophy className="h-4 w-4" /> :
                 index === 1 ? <Trophy className="h-4 w-4" /> :
                 index === 2 ? <Trophy className="h-4 w-4" /> :
                 index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{strategy.strategy.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      {strategy.successRate >= 0.98 ? (
                        <span className="text-green-600">SC-009 Compliant</span>
                      ) : (
                        <span className="text-orange-600">Non-Compliant</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="font-medium">{(strategy.performanceScore * 100).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Effectiveness</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{(strategy.successRate * 100).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{(strategy.averageTime / 1000).toFixed(1)}s</p>
                    <p className="text-xs text-muted-foreground">Avg Time</p>
                  </div>
                  <Progress
                    value={strategy.performanceScore * 100}
                    className="w-20"
                  />
                </div>
              </div>
            ))}

            {topPerformingStrategies.length === 0 && (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No strategy performance data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {showAlerts && criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-800">Critical Alerts</CardTitle>
              </div>
              <Badge variant="destructive">{criticalAlerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.slice(0, 3).map((alert) => (
                <Alert key={alert.id} className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">{alert.title}</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {alert.message}
                    {alert.recommendedActions.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Recommended Actions:</p>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {alert.recommendedActions.slice(0, 2).map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Impact Recommendations */}
      {showRecommendations && highImpactRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <CardTitle>High Impact Recommendations</CardTitle>
              </div>
              <Badge variant="outline">{highImpactRecommendations.length}</Badge>
            </div>
            <CardDescription>Optimizations with significant SC-009 impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highImpactRecommendations.map((rec) => (
                <div key={rec.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={
                        rec.priority === 'critical' ? 'destructive' :
                        rec.priority === 'high' ? 'destructive' :
                        rec.priority === 'medium' ? 'secondary' : 'outline'
                      }>
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline">
                        {rec.category.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <h4 className="font-medium mb-1">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="font-bold text-green-700">
                          +{rec.expectedImprovement.sc009ComplianceImpact}%
                        </p>
                        <p className="text-xs text-muted-foreground">SC-009 Impact</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="font-bold text-blue-700">
                          {rec.effort.complexity}
                        </p>
                        <p className="text-xs text-muted-foreground">Complexity</p>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <p className="font-bold text-orange-700">
                          {rec.timeframe}
                        </p>
                        <p className="text-xs text-muted-foreground">Timeframe</p>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <p className="font-bold text-purple-700">
                          {(rec.confidence * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Info className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    <Button size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Implement
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderEffectivenessTab = () => (
    <div className="space-y-6">
      {/* Strategy Effectiveness Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Effectiveness Matrix</CardTitle>
          <CardDescription>Comprehensive analysis of recovery strategy performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Strategy</th>
                  <th className="text-center p-2">Success Rate</th>
                  <th className="text-center p-2">Avg Time</th>
                  <th className="text-center p-2">User Satisfaction</th>
                  <th className="text-center p-2">Effectiveness Score</th>
                  <th className="text-center p-2">SC-009 Compliant</th>
                  <th className="text-center p-2">Reliability</th>
                  <th className="text-center p-2">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(effectivenessMetrics.values()).map((metrics) => (
                  <tr key={metrics.strategyId} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{metrics.strategy.replace(/_/g, ' ')}</span>
                        {metrics.overall.sc009Compliant && (
                          <Shield className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <div className="flex items-center justify-center">
                        <span className="font-medium">{(metrics.overall.successRate * 100).toFixed(1)}%</span>
                        {metrics.overall.successRate >= 0.98 ? (
                          <ArrowUp className="h-4 w-4 text-green-600 ml-2" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-600 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <span className="font-medium">{(metrics.overall.averageTime / 1000).toFixed(1)}s</span>
                    </td>
                    <td className="text-center p-2">
                      <div className="flex items-center justify-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= Math.round(metrics.overall.userSatisfaction * 5)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <div className="flex items-center justify-center">
                        <Progress
                          value={metrics.overall.effectivenessScore * 100}
                          className="w-16"
                        />
                        <span className="ml-2 font-medium">
                          {(metrics.overall.effectivenessScore * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center p-2">
                      {metrics.overall.sc009Compliant ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge variant="destructive">No</Badge>
                      )}
                    </td>
                    <td className="text-center p-2">
                      <Progress
                        value={this.calculateReliability(metrics) * 100}
                        className="w-12"
                      />
                    </td>
                    <td className="text-center p-2">
                      <Progress
                        value={this.calculateEfficiency(metrics) * 100}
                        className="w-12"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Opportunities</CardTitle>
          <CardDescription>Automated recommendations for improving recovery effectiveness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {optimizations.slice(0, 6).map((opt) => (
              <div key={opt.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{opt.type.replace(/_/g, ' ')}</Badge>
                    <Badge variant={
                      opt.status === 'completed' ? 'default' :
                      opt.status === 'in_progress' ? 'secondary' :
                      'outline'
                    }>
                      {opt.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +{opt.expectedImprovement.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Expected Improvement</p>
                  </div>
                </div>

                <h4 className="font-medium mb-2">{opt.strategy.replace(/_/g, ' ')}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Current: {(opt.currentPerformance * 100).toFixed(1)}% → Target: {((opt.currentPerformance + opt.expectedImprovement) * 100).toFixed(1)}%
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>Confidence: {(opt.confidence * 100).toFixed(0)}%</span>
                  <span>Effort: {opt.effort.complexity}</span>
                  <span>Time: {opt.effort.estimatedHours}h</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Info className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                  <Button size="sm" className="flex-1">
                    {opt.status === 'proposed' ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Monitor
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {/* Error Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Error Recovery by Type</CardTitle>
          <CardDescription>Recovery performance analysis by error type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Error Types Chart */}
            <div className="space-y-4">
              <h4 className="font-medium">Recovery Rate by Error Type</h4>
              {metrics?.errorsByType.map((errorType) => (
                <div key={errorType.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{errorType.type.replace(/_/g, ' ')}</span>
                    <span className="text-sm">{(errorType.recoveryRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={errorType.recoveryRate * 100}
                      className="flex-1"
                    />
                    {errorType.sc009Compliant ? (
                      <Shield className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{errorType.count} occurrences</span>
                    <span>{(errorType.averageRecoveryTime / 1000).toFixed(1)}s avg</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recovery Time Distribution */}
            <div className="space-y-4">
              <h4 className="font-medium">Recovery Time Distribution</h4>
              {metrics?.recoveryTimeDistribution.map((dist) => (
                <div key={dist.range} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dist.range}</span>
                    <span className="text-sm">{dist.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={dist.percentage} className="w-full" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{dist.count} errors</span>
                    <span>{(dist.successRate * 100).toFixed(1)}% success</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Feedback Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>User Feedback Analysis</CardTitle>
          <CardDescription>Satisfaction ratings and user experience insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Satisfaction */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {metrics ? `${(metrics.userSatisfactionScore * 100).toFixed(0)}%` : '--'}
              </div>
              <p className="text-sm text-blue-700 mb-4">Overall User Satisfaction</p>
              <div className="flex justify-center mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= Math.round((metrics?.userSatisfactionScore || 0) * 5)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs text-blue-600">
                Based on {metrics?.totalErrors || 0} error recoveries
              </div>
            </div>

            {/* Satisfaction by Error Type */}
            <div className="p-6 border rounded-lg">
              <h4 className="font-medium mb-4">Satisfaction by Error Type</h4>
              <div className="space-y-3">
                {metrics?.satisfactionByErrorType.slice(0, 5).map((sat) => (
                  <div key={sat.errorType} className="flex items-center justify-between">
                    <span className="text-sm">{sat.errorType.replace(/_/g, ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= Math.round(sat.averageRating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({sat.totalRatings})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Issues */}
            <div className="p-6 border rounded-lg">
              <h4 className="font-medium mb-4">Common User Issues</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Unclear error messages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Slow recovery times</span>
                </div>
                <div className="flex items-center space-x-2">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Insufficient guidance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">Multiple retry attempts</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trends and Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Recovery Trends and Patterns</CardTitle>
          <CardDescription>Historical analysis and trend identification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Daily Trend */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Daily Trend</h4>
                {metrics?.dailyMetrics && metrics.dailyMetrics.length > 1 && (
                  <Badge variant={
                    metrics.dailyMetrics[metrics.dailyMetrics.length - 1].improvementFromPreviousDay > 0
                      ? 'default' : 'destructive'
                  }>
                    {metrics.dailyMetrics[metrics.dailyMetrics.length - 1].improvementFromPreviousDay > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(metrics.dailyMetrics[metrics.dailyMetrics.length - 1].improvementFromPreviousDay * 100).toFixed(1)}%
                  </Badge>
                )}
              </div>
              <div className="text-2xl font-bold mb-2">
                {metrics?.dailyMetrics && metrics.dailyMetrics.length > 0
                  ? `${(metrics.dailyMetrics[metrics.dailyMetrics.length - 1].recoveryRate * 100).toFixed(1)}%`
                  : '--'
                }
              </div>
              <p className="text-xs text-muted-foreground">Current daily recovery rate</p>
            </div>

            {/* Weekly Trend */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Weekly Trend</h4>
                {metrics?.weeklyMetrics && metrics.weeklyMetrics.length > 1 && (
                  <Badge variant={
                    metrics.weeklyMetrics[metrics.weeklyMetrics.length - 1].weekOverWeekChange > 0
                      ? 'default' : 'destructive'
                  }>
                    {metrics.weeklyMetrics[metrics.weeklyMetrics.length - 1].weekOverWeekChange > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(metrics.weeklyMetrics[metrics.weeklyMetrics.length - 1].weekOverWeekChange * 100).toFixed(1)}%
                  </Badge>
                )}
              </div>
              <div className="text-2xl font-bold mb-2">
                {metrics?.weeklyMetrics && metrics.weeklyMetrics.length > 0
                  ? `${(metrics.weeklyMetrics[metrics.weeklyMetrics.length - 1].recoveryRate * 100).toFixed(1)}%`
                  : '--'
                }
              </div>
              <p className="text-xs text-muted-foreground">Current weekly recovery rate</p>
            </div>

            {/* Best Performance */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <h4 className="font-medium">Best Performance</h4>
              </div>
              <div className="text-2xl font-bold mb-2">
                {metrics?.monthlyTrends && metrics.monthlyTrends.length > 0
                  ? `${(Math.max(...metrics.monthlyTrends.map(t => t.recoveryRate)) * 100).toFixed(1)}%`
                  : '--'
                }
              </div>
              <p className="text-xs text-muted-foreground">Highest monthly rate</p>
            </div>

            {/* System Resilience */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">System Resilience</h4>
              </div>
              <div className="text-2xl font-bold mb-2">
                {metrics ? `${metrics.resilienceScore}/100` : '--'}
              </div>
              <p className="text-xs text-muted-foreground">Overall resilience score</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecommendationsTab = () => (
    <div className="space-y-6">
      {/* Priority Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Actionable insights for improving SC-009 compliance</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {recommendations.length} total
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Critical Priority */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold">Critical Priority</h3>
                <Badge variant="destructive">
                  {recommendations.filter(r => r.priority === 'critical').length}
                </Badge>
              </div>
              <div className="space-y-4">
                {recommendations
                  .filter(r => r.priority === 'critical')
                  .map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
              </div>
            </div>

            {/* High Priority */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">High Priority</h3>
                <Badge variant="secondary">
                  {recommendations.filter(r => r.priority === 'high').length}
                </Badge>
              </div>
              <div className="space-y-4">
                {recommendations
                  .filter(r => r.priority === 'high')
                  .map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
              </div>
            </div>

            {/* Medium Priority */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Info className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Medium Priority</h3>
                <Badge variant="outline">
                  {recommendations.filter(r => r.priority === 'medium').length}
                </Badge>
              </div>
              <div className="space-y-4">
                {recommendations
                  .filter(r => r.priority === 'medium')
                  .slice(0, 3) // Limit to 3 for readability
                  .map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Roadmap</CardTitle>
          <CardDescription>Suggested timeline for implementing recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Immediate (This Week) */}
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Flame className="h-4 w-4 text-red-600 mr-2" />
                Immediate (This Week)
              </h4>
              <div className="space-y-2">
                {recommendations
                  .filter(r => r.priority === 'critical' && r.effort.complexity === 'low')
                  .slice(0, 2)
                  .map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{rec.title}</p>
                        <p className="text-sm text-muted-foreground">{rec.timeframe}</p>
                      </div>
                      <Button size="sm">Start Now</Button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Short-term (Next 2 Weeks) */}
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Clock className="h-4 w-4 text-blue-600 mr-2" />
                Short-term (Next 2 Weeks)
              </h4>
              <div className="space-y-2">
                {recommendations
                  .filter(r => (r.priority === 'high' || r.effort.complexity === 'medium'))
                  .slice(0, 3)
                  .map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{rec.title}</p>
                        <p className="text-sm text-muted-foreground">{rec.timeframe}</p>
                      </div>
                      <Button size="sm" variant="outline">Schedule</Button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Long-term (Next Month) */}
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <TargetIcon className="h-4 w-4 text-green-600 mr-2" />
                Long-term (Next Month)
              </h4>
              <div className="space-y-2">
                {recommendations
                  .filter(r => r.effort.complexity === 'high' || r.priority === 'medium')
                  .slice(0, 2)
                  .map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{rec.title}</p>
                        <p className="text-sm text-muted-foreground">{rec.timeframe}</p>
                      </div>
                      <Button size="sm" variant="outline">Plan</Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Helper component for recommendation cards
  const RecommendationCard = ({ recommendation }: { recommendation: ErrorRecoveryRecommendation }) => (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Badge variant={
            recommendation.priority === 'critical' ? 'destructive' :
            recommendation.priority === 'high' ? 'destructive' :
            recommendation.priority === 'medium' ? 'secondary' : 'outline'
          }>
            {recommendation.priority}
          </Badge>
          <Badge variant="outline">
            {recommendation.category.replace(/_/g, ' ')}
          </Badge>
        </div>
        <div className="text-right">
          <p className="font-bold text-green-600">
            +{recommendation.expectedImprovement.sc009ComplianceImpact}%
          </p>
          <p className="text-xs text-muted-foreground">SC-009 Impact</p>
        </div>
      </div>

      <h4 className="font-medium mb-2">{recommendation.title}</h4>
      <p className="text-sm text-muted-foreground mb-4">{recommendation.description}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
        <div>
          <p className="font-medium">Recovery Rate</p>
          <p className="text-green-600">+{recommendation.expectedImprovement.recoveryRateImprovement}%</p>
        </div>
        <div>
          <p className="font-medium">Time to Recovery</p>
          <p className="text-blue-600">-{recommendation.expectedImprovement.timeToRecoveryReduction}s</p>
        </div>
        <div>
          <p className="font-medium">User Satisfaction</p>
          <p className="text-purple-600">+{recommendation.expectedImprovement.userSatisfactionImprovement}%</p>
        </div>
        <div>
          <p className="font-medium">Confidence</p>
          <p className="text-orange-600">{(recommendation.confidence * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <span>Effort: {recommendation.effort.complexity}</span>
        <span>Time: {recommendation.effort.estimatedHours}h</span>
        <span>Risk: {recommendation.effort.riskLevel}</span>
      </div>

      <div className="flex items-center space-x-2">
        <Button size="sm" variant="outline" className="flex-1">
          <Info className="h-4 w-4 mr-2" />
          View Details
        </Button>
        <Button size="sm" className="flex-1">
          <Play className="h-4 w-4 mr-2" />
          Implement
        </Button>
      </div>
    </div>
  );

  // Helper functions
  const calculateReliability = (metrics: EffectivenessMetrics): number => {
    return metrics.overall.successRate;
  };

  const calculateEfficiency = (metrics: EffectivenessMetrics): number => {
    return Math.max(0, 1 - (metrics.overall.averageTime / 60000));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Error Recovery Metrics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive SC-009 compliance monitoring and recovery effectiveness analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Mode Selector */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="view-mode" className="text-sm">View:</Label>
            <select
              id="view-mode"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-3 py-1 text-sm border rounded-md bg-background"
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="time-range" className="text-sm">Period:</Label>
            <select
              id="time-range"
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-1 text-sm border rounded-md bg-background"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>

          {/* Live Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="live-mode"
              checked={isLive}
              onCheckedChange={setIsLive}
            />
            <Label htmlFor="live-mode" className="text-sm flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              Live
            </Label>
          </div>

          {/* Refresh Button */}
          <Button variant="outline" size="sm" onClick={fetchErrorRecoveryData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Export Button */}
          {exportEnabled && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Last Update */}
      <div className="flex items-center text-sm text-muted-foreground">
        <Clock className="h-4 w-4 mr-1" />
        Last updated: {lastUpdate.toLocaleTimeString()}
        {isLive && <span className="ml-2 text-green-600">(Live)</span>}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="effectiveness" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Effectiveness</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>Recommendations</span>
            {recommendations.length > 0 && (
              <Badge variant="outline" className="ml-1 text-xs">
                {recommendations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="effectiveness" className="space-y-4">
          {renderEffectivenessTab()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {renderAnalyticsTab()}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {renderRecommendationsTab()}
        </TabsContent>
      </Tabs>

      {/* Real-time Status */}
      {showRealtime && realtimeMetrics && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-900">Real-time monitoring active</span>
              <span className="text-sm text-blue-700">
                Session: {realtimeMetrics.currentSession.sessionId.slice(-8)}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-blue-700">
              <span>Active: {realtimeMetrics.currentSession.errorsEncountered} errors</span>
              <span>Recoveries: {realtimeMetrics.currentSession.recoveriesAttempted}</span>
              <span>Rate: {(realtimeMetrics.currentSession.currentRecoveryRate * 100).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Error Recovery Tracker Component
 * Real-time tracking and management of error recovery attempts for SC-009 compliance
 * Provides comprehensive monitoring of error recovery success rates and user satisfaction
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  ChevronRight
} from 'lucide-react';

import {
  ErrorEvent,
  ErrorRecoveryMetrics,
  ErrorType,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  RecoveryOutcome,
  RealtimeErrorRecoveryMetrics,
  ErrorRecoveryAlert,
  SC009TargetProgress,
  ErrorRecoveryRecommendation
} from '@/monitoring/error-recovery-types';

interface ErrorRecoveryTrackerProps {
  className?: string;
  sessionId?: string;
  toolId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showRealtime?: boolean;
  showAlerts?: boolean;
  showRecommendations?: boolean;
}

export function ErrorRecoveryTracker({
  className,
  sessionId,
  toolId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  showRealtime = true,
  showAlerts = true,
  showRecommendations = true
}: ErrorRecoveryTrackerProps) {
  // State management
  const [metrics, setMetrics] = useState<ErrorRecoveryMetrics | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeErrorRecoveryMetrics | null>(null);
  const [recentErrors, setRecentErrors] = useState<ErrorEvent[]>([]);
  const [alerts, setAlerts] = useState<ErrorRecoveryAlert[]>([]);
  const [recommendations, setRecommendations] = useState<ErrorRecoveryRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(autoRefresh);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [selectedErrorType, setSelectedErrorType] = useState<ErrorType | 'all'>('all');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Refs for cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Data fetching
  const fetchErrorRecoveryData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        range: selectedTimeRange,
        ...(sessionId && { sessionId }),
        ...(toolId && { toolId }),
        ...(selectedErrorType !== 'all' && { errorType: selectedErrorType })
      });

      const response = await fetch(`/api/error-recovery/metrics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch error recovery metrics');

      const data = await response.json();
      setMetrics(data.metrics);
      setRealtimeMetrics(data.realtime);
      setRecentErrors(data.recentErrors);
      setAlerts(data.alerts);
      setRecommendations(data.recommendations);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch error recovery data:', error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange, sessionId, toolId, selectedErrorType]);

  // Auto-refresh effect
  useEffect(() => {
    if (!isLive) return;

    refreshIntervalRef.current = setInterval(fetchErrorRecoveryData, refreshInterval);
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
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

  const filteredErrors = useMemo(() => {
    let filtered = recentErrors;

    if (filterText) {
      filtered = filtered.filter(error =>
        error.message.toLowerCase().includes(filterText.toLowerCase()) ||
        error.type.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    if (selectedErrorType !== 'all') {
      filtered = filtered.filter(error => error.type === selectedErrorType);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [recentErrors, filterText, selectedErrorType]);

  const errorTypeDistribution = useMemo(() => {
    if (!metrics) return [];

    return metrics.errorsByType.map(type => ({
      type: type.type,
      count: type.count,
      recoveryRate: Math.round(type.recoveryRate * 100),
      sc009Compliant: type.sc009Compliant
    }));
  }, [metrics]);

  const strategyEffectiveness = useMemo(() => {
    if (!metrics) return [];

    return metrics.mostEffectiveStrategies.slice(0, 5).map(strategy => ({
      strategy: strategy.strategy,
      effectiveness: Math.round(strategy.effectivenessScore * 100),
      successRate: Math.round(strategy.successRate * 100),
      usage: strategy.usageCount
    }));
  }, [metrics]);

  // Event handlers
  const toggleErrorExpansion = (errorId: string) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(errorId)) {
        newSet.delete(errorId);
      } else {
        newSet.add(errorId);
      }
      return newSet;
    });
  };

  const handleRetry = async (errorId: string) => {
    try {
      await fetch(`/api/error-recovery/retry/${errorId}`, { method: 'POST' });
      fetchErrorRecoveryData();
    } catch (error) {
      console.error('Failed to retry error:', error);
    }
  };

  const handleFeedback = async (errorId: string, helpful: boolean, comment?: string) => {
    try {
      await fetch(`/api/error-recovery/feedback/${errorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful, comment })
      });
      fetchErrorRecoveryData();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  // Render functions
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* SC-009 Compliance Status */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SC-009 Compliance</CardTitle>
          <Shield className={`h-4 w-4 ${sc009Compliance.compliant ? 'text-green-600' : 'text-red-600'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {sc009Compliance.rate}% / 98%
          </div>
          <p className="text-xs text-muted-foreground">
            Error Recovery Rate
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <Progress
              value={sc009Compliance.rate}
              className="flex-1"
            />
            <Badge variant={sc009Compliance.compliant ? 'default' : 'destructive'}>
              {sc009Compliance.compliant ? 'Compliant' : `${sc009Compliance.gap}% gap`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Errors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedTimeRange} period
            </p>
          </CardContent>
        </Card>

        {/* Average Recovery Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Recovery Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${(metrics.averageRecoveryTime / 1000).toFixed(1)}s` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics && metrics.averageRecoveryTime <= 30000 ? (
                <span className="text-green-600">Within 30s target</span>
              ) : (
                <span className="text-orange-600">Above 30s target</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* User Satisfaction */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${(metrics.userSatisfactionScore * 100).toFixed(0)}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average satisfaction rating
            </p>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${metrics.systemHealthScore}/100` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall system performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Error Distribution by Type</CardTitle>
          <CardDescription>Breakdown of errors and their recovery rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {errorTypeDistribution.map((item) => (
              <div key={item.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-medium">{item.type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">{item.count} occurrences</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{item.recoveryRate}%</p>
                    <p className="text-sm text-muted-foreground">recovery rate</p>
                  </div>
                  <Badge variant={item.sc009Compliant ? 'default' : 'destructive'}>
                    {item.sc009Compliant ? 'SC-009' : 'Non-compliant'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategy Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle>Most Effective Recovery Strategies</CardTitle>
          <CardDescription>Top strategies for successful error recovery</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {strategyEffectiveness.map((strategy, index) => (
              <div key={strategy.strategy} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-800">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{strategy.strategy.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">Used {strategy.usage} times</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{strategy.effectiveness}%</p>
                    <p className="text-sm text-muted-foreground">effectiveness</p>
                  </div>
                  <Progress value={strategy.effectiveness} className="w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecentErrorsTab = () => (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center space-x-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search errors..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1 px-3 py-1 text-sm border rounded-md bg-background"
          />
        </div>

        <select
          value={selectedErrorType}
          onChange={(e) => setSelectedErrorType(e.target.value as any)}
          className="px-3 py-1 text-sm border rounded-md bg-background"
        >
          <option value="all">All Types</option>
          {metrics?.errorsByType.map(type => (
            <option key={type.type} value={type.type}>
              {type.type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {showDetails ? 'Hide' : 'Show'} Details
        </Button>
      </div>

      {/* Errors List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {filteredErrors.map((error) => (
            <Card key={error.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={error.severity === 'critical' ? 'destructive' :
                                      error.severity === 'high' ? 'destructive' :
                                      error.severity === 'medium' ? 'secondary' : 'outline'}>
                        {error.severity}
                      </Badge>
                      <Badge variant="outline">
                        {error.type.replace(/_/g, ' ')}
                      </Badge>
                      {error.sc009Compliant ? (
                        <Badge variant="default" className="text-xs">
                          SC-009
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Non-SC-009
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-medium text-sm mb-1">{error.message}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {error.timestamp.toLocaleString()} • {error.toolId || 'Unknown tool'}
                    </p>

                    {/* Recovery Outcome */}
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="flex items-center">
                        {error.finalOutcome === 'success_on_first_retry' ||
                         error.finalOutcome === 'success_after_multiple_retries' ? (
                          <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-600 mr-1" />
                        )}
                        {error.finalOutcome.replace(/_/g, ' ')}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {(error.totalRecoveryTime / 1000).toFixed(1)}s
                      </span>
                      <span className="flex items-center">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {error.recoveryAttempts.length} attempts
                      </span>
                    </div>

                    {/* Expandable Details */}
                    {expandedErrors.has(error.id) && showDetails && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs font-medium mb-1">Recovery Attempts:</p>
                          {error.recoveryAttempts.map((attempt, index) => (
                            <div key={attempt.id} className="text-xs ml-4 mb-2">
                              <p className="font-medium">
                                Attempt {index + 1}: {attempt.strategy.replace(/_/g, ' ')}
                                {attempt.success ? (
                                  <CheckCircle className="h-3 w-3 text-green-600 inline ml-2" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-red-600 inline ml-2" />
                                )}
                              </p>
                              <p className="text-muted-foreground">
                                Duration: {(attempt.duration / 1000).toFixed(1)}s
                                {attempt.automated && ' • Automated'}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div>
                          <p className="text-xs font-medium mb-1">Context:</p>
                          <div className="text-xs text-muted-foreground ml-4">
                            <p>Device: {error.context.deviceType}</p>
                            <p>Browser: {error.context.browserInfo}</p>
                            {error.context.fileName && <p>File: {error.context.fileName}</p>}
                            {error.context.inputSize && <p>Input Size: {(error.context.inputSize / 1024).toFixed(1)}KB</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleErrorExpansion(error.id)}
                    >
                      {expandedErrors.has(error.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {error.finalOutcome.includes('success') && (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(error.id, true)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(error.id, false)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {!error.finalOutcome.includes('success') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(error.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredErrors.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No errors found</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="space-y-4">
      {alerts.length > 0 ? (
        alerts.map((alert) => (
          <Alert key={alert.id} className={
            alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
            alert.severity === 'error' ? 'border-orange-200 bg-orange-50' :
            alert.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
            'border-blue-200 bg-blue-50'
          }>
            <AlertTriangle className={`h-4 w-4 ${
              alert.severity === 'critical' ? 'text-red-600' :
              alert.severity === 'error' ? 'text-orange-600' :
              alert.severity === 'warning' ? 'text-yellow-600' :
              'text-blue-600'
            }`} />
            <AlertTitle className={
              alert.severity === 'critical' ? 'text-red-800' :
              alert.severity === 'error' ? 'text-orange-800' :
              alert.severity === 'warning' ? 'text-yellow-800' :
              'text-blue-800'
            }>
              {alert.title}
            </AlertTitle>
            <AlertDescription className={
              alert.severity === 'critical' ? 'text-red-700' :
              alert.severity === 'error' ? 'text-orange-700' :
              alert.severity === 'warning' ? 'text-yellow-700' :
              'text-blue-700'
            }>
              <p>{alert.message}</p>
              {alert.recommendedActions.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Recommended Actions:</p>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {alert.recommendedActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs mt-2 text-muted-foreground">
                {alert.timestamp.toLocaleString()}
              </p>
            </AlertDescription>
          </Alert>
        ))
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active alerts</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderRecommendationsTab = () => (
    <div className="space-y-4">
      {recommendations.length > 0 ? (
        recommendations.map((rec) => (
          <Card key={rec.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{rec.title}</CardTitle>
                <div className="flex items-center space-x-2">
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
              </div>
              <CardDescription>{rec.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Expected Impact */}
                <div>
                  <h5 className="font-medium mb-2">Expected Impact:</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-700">
                        +{rec.expectedImprovement.recoveryRateImprovement}%
                      </p>
                      <p className="text-xs text-muted-foreground">Recovery Rate</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-lg font-bold text-blue-700">
                        +{rec.expectedImprovement.userSatisfactionImprovement}%
                      </p>
                      <p className="text-xs text-muted-foreground">Satisfaction</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <p className="text-lg font-bold text-orange-700">
                        -{rec.expectedImprovement.timeToRecoveryReduction}s
                      </p>
                      <p className="text-xs text-muted-foreground">Recovery Time</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <p className="text-lg font-bold text-purple-700">
                        +{rec.expectedImprovement.sc009ComplianceImpact}%
                      </p>
                      <p className="text-xs text-muted-foreground">SC-009 Impact</p>
                    </div>
                  </div>
                </div>

                {/* Implementation Details */}
                <div>
                  <h5 className="font-medium mb-2">Implementation:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Effort:</p>
                      <p className="text-muted-foreground">{rec.effort.complexity}</p>
                    </div>
                    <div>
                      <p className="font-medium">Timeframe:</p>
                      <p className="text-muted-foreground">{rec.timeframe}</p>
                    </div>
                    <div>
                      <p className="font-medium">Risk:</p>
                      <p className="text-muted-foreground">{rec.riskLevel}</p>
                    </div>
                  </div>
                </div>

                {/* Affected Error Types */}
                <div>
                  <h5 className="font-medium mb-2">Affects:</h5>
                  <div className="flex flex-wrap gap-2">
                    {rec.affectedErrorTypes.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 pt-2">
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Implement
                  </Button>
                  <Button variant="outline" size="sm">
                    <Info className="h-4 w-4 mr-2" />
                    Learn More
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Discuss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Info className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recommendations available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Error Recovery Tracker</h2>
          <p className="text-muted-foreground">
            SC-009 compliance monitoring and error recovery analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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
          <TabsTrigger value="errors" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Recent Errors</span>
            {recentErrors.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {recentErrors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>Alerts</span>
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4" />
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

        <TabsContent value="errors" className="space-y-4">
          {renderRecentErrorsTab()}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {renderAlertsTab()}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {renderRecommendationsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

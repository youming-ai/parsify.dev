/**
 * Uptime Monitoring Dashboard
 * Real-time dashboard for SC-005 compliance monitoring with comprehensive metrics
 * Features live updates, interactive visualizations, and detailed system health status
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Zap,
  Shield,
  BarChart3,
  RefreshCw,
  Settings,
  Download,
  Bell,
  BellOff,
  Eye,
  Target,
  Timer,
  Cpu,
  Wifi,
  Monitor,
  Database,
  AlertCircle,
  Info,
  Uptime,
  AlertOctagon,
  FileCheck,
  Gauge,
  LineChart,
  PieChart,
  Calendar,
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Play,
  Pause,
  RotateCcw,
  DownloadCloud,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircleIcon,
  ZapIcon,
  ActivityIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from 'lucide-react';

// Import monitoring systems
import { MonitoringIntegrationSystem } from './uptime-monitoring-integration';
import type {
  UnifiedMetrics,
  CrossSystemIncident,
  UnifiedAlert,
  UnifiedReport
} from './uptime-monitoring-integration';

interface DashboardConfig {
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  showNotifications: boolean;
  soundAlerts: boolean;
  theme: 'light' | 'dark';
  defaultTimeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  expandSections: boolean;
  showDetails: boolean;
}

interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
}

interface ToolStatusCard {
  toolId: string;
  toolName: string;
  category: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  uptime: number;
  responseTime: number;
  lastCheck: Date;
  issues: string[];
  trend: 'up' | 'down' | 'stable';
}

interface MetricCard {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  status?: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
  description?: string;
  details?: Record<string, any>;
}

export const UptimeMonitoringDashboard: React.FC = () => {
  const [config, setConfig] = useState<DashboardConfig>({
    autoRefresh: true,
    refreshInterval: 30,
    showNotifications: true,
    soundAlerts: false,
    theme: 'light',
    defaultTimeRange: '24h',
    expandSections: false,
    showDetails: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<DashboardConfig['defaultTimeRange']>('24h');
  const [activeTab, setActiveTab] = useState('overview');

  // Data state
  const [unifiedMetrics, setUnifiedMetrics] = useState<UnifiedMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<UnifiedMetrics | null>(null);
  const [incidents, setIncidents] = useState<CrossSystemIncident[]>([]);
  const [alerts, setAlerts] = useState<UnifiedAlert[]>([]);
  const [reports, setReports] = useState<UnifiedReport[]>([]);
  const [toolStatuses, setToolStatuses] = useState<ToolStatusCard[]>([]);

  // Integration system
  const [integrationSystem] = useState(() => MonitoringIntegrationSystem.getInstance());

  // Initialize dashboard
  useEffect(() => {
    initializeDashboard();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!config.autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, config.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [config.autoRefresh, config.refreshInterval]);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);

      // Initialize integration system if not already done
      if (!integrationSystem) {
        throw new Error('Integration system not available');
      }

      // Load initial data
      await refreshData();

    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get unified metrics
      const timeRangeInDays = getTimeRangeInDays(selectedTimeRange);
      const metrics = integrationSystem.getUnifiedMetrics(timeRangeInDays);
      setUnifiedMetrics(metrics);

      if (metrics.length > 0) {
        setCurrentMetrics(metrics[metrics.length - 1]);

        // Update tool statuses
        updateToolStatuses(metrics[metrics.length - 1]);
      }

      // Get incidents
      const currentIncidents = integrationSystem.getCrossSystemIncidents(timeRangeInDays);
      setIncidents(currentIncidents);

      // Get alerts
      const currentAlerts = integrationSystem.getUnifiedAlerts(false);
      setAlerts(currentAlerts);

      // Get reports
      const currentReports = integrationSystem.getUnifiedReports();
      setReports(currentReports);

      setLastUpdate(new Date());

    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [integrationSystem, selectedTimeRange]);

  const updateToolStatuses = (metrics: UnifiedMetrics) => {
    const tools: ToolStatusCard[] = [];

    // This would come from the actual tool data
    // For now, create sample data based on system health
    const systemHealth = metrics.systemHealth;

    // Convert system health to tool status cards
    systemHealth.tools.forEach(tool => {
      tools.push({
        toolId: tool.toolId,
        toolName: tool.toolName,
        category: 'Tools', // Would get from tools data
        status: tool.status,
        uptime: tool.uptimePercentage,
        responseTime: tool.responseTime,
        lastCheck: tool.lastCheck,
        issues: tool.details.errors.map(e => e.message),
        trend: 'stable', // Would calculate from historical data
      });
    });

    setToolStatuses(tools);
  };

  const getTimeRangeInDays = (range: string): number => {
    switch (range) {
      case '1h': return 1/24;
      case '6h': return 6/24;
      case '24h': return 1;
      case '7d': return 7;
      case '30d': return 30;
      default: return 1;
    }
  };

  // Calculate metric cards for overview
  const overviewMetrics = useMemo((): MetricCard[] => {
    if (!currentMetrics) return [];

    const { systemHealth, uptime, sc005 } = currentMetrics;

    return [
      {
        title: 'System Health',
        value: systemHealth.overall.score,
        unit: '/100',
        trend: systemHealth.overall.score > 90 ? 'up' : systemHealth.overall.score > 70 ? 'stable' : 'down',
        status: systemHealth.overall.score > 90 ? 'good' : systemHealth.overall.score > 70 ? 'warning' : 'critical',
        icon: <Activity className="h-4 w-4" />,
        description: 'Overall system health score',
        details: {
          status: systemHealth.overall.status,
          activeTools: systemHealth.overall.activeTools,
          totalTools: systemHealth.overall.totalTools,
        },
      },
      {
        title: 'Uptime',
        value: systemHealth.overall.uptime.toFixed(2),
        unit: '%',
        trend: systemHealth.overall.uptime > 99.5 ? 'up' : 'stable',
        status: systemHealth.overall.uptime > 99.5 ? 'good' : systemHealth.overall.uptime > 99.0 ? 'warning' : 'critical',
        icon: <Uptime className="h-4 w-4" />,
        description: 'Current system uptime',
        details: {
          target: sc005?.target.uptime || 99.9,
          variance: sc005?.variance.uptimeVariance || 0,
        },
      },
      {
        title: 'Active Incidents',
        value: uptime.incidents,
        trend: uptime.incidents === 0 ? 'stable' : 'down',
        status: uptime.incidents === 0 ? 'good' : uptime.incidents > 5 ? 'critical' : 'warning',
        icon: <AlertTriangle className="h-4 w-4" />,
        description: 'Currently active incidents',
        details: {
          critical: incidents.filter(i => i.severity === 'critical').length,
          high: incidents.filter(i => i.severity === 'high').length,
        },
      },
      {
        title: 'SC-005 Compliance',
        value: sc005?.compliance.compliant ? 100 : 0,
        unit: '%',
        trend: sc005?.compliance.compliant ? 'up' : 'down',
        status: sc005?.compliance.compliant ? 'good' : 'critical',
        icon: <Shield className="h-4 w-4" />,
        description: 'SC-005 compliance status',
        details: {
          targetUptime: sc005?.target.uptime || 99.9,
          currentUptime: sc005?.actual.uptime || 0,
          violations: sc005?.compliance.violations.length || 0,
        },
      },
      {
        title: 'Response Time',
        value: Math.round(systemHealth.performance.averageResponseTime),
        unit: 'ms',
        trend: systemHealth.performance.averageResponseTime < 1000 ? 'up' : 'down',
        status: systemHealth.performance.averageResponseTime < 1000 ? 'good' :
               systemHealth.performance.averageResponseTime < 3000 ? 'warning' : 'critical',
        icon: <Timer className="h-4 w-4" />,
        description: 'Average system response time',
        details: {
          slowest: systemHealth.performance.slowestTool,
          fastest: systemHealth.performance.fastestTool,
        },
      },
      {
        title: 'Performance Degradations',
        value: uptime.degradations,
        trend: uptime.degradations === 0 ? 'stable' : 'down',
        status: uptime.degradations === 0 ? 'good' : uptime.degradations > 3 ? 'critical' : 'warning',
        icon: <TrendingDown className="h-4 w-4" />,
        description: 'Active performance degradations',
        details: {
          critical: 0, // Would get from performance monitor
          warning: 0, // Would get from performance monitor
        },
      },
    ];
  }, [currentMetrics, incidents]);

  // Generate time series data for charts
  const uptimeTimeSeries = useMemo((): TimeSeriesData[] => {
    return unifiedMetrics.map(metric => ({
      timestamp: metric.timestamp,
      value: metric.systemHealth.overall.uptime,
    }));
  }, [unifiedMetrics]);

  const responseTimeTimeSeries = useMemo((): TimeSeriesData[] => {
    return unifiedMetrics.map(metric => ({
      timestamp: metric.timestamp,
      value: metric.systemHealth.performance.averageResponseTime,
    }));
  }, [unifiedMetrics]);

  const renderMetricCard = (metric: MetricCard) => (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <div className={`h-4 w-4 ${
          metric.status === 'good' ? 'text-green-600' :
          metric.status === 'warning' ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {metric.icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline">
          <div className="text-2xl font-bold">
            {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
          </div>
          {metric.unit && (
            <span className="ml-1 text-sm text-muted-foreground">{metric.unit}</span>
          )}
          {metric.trend && (
            <div className={`ml-2 flex items-center text-xs ${
              metric.trend === 'up' ? 'text-green-600' :
              metric.trend === 'down' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {metric.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
              {metric.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
              {metric.trendValue && `${Math.abs(metric.trendValue)}%`}
            </div>
          )}
        </div>
        {metric.description && (
          <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
        )}
        {config.showDetails && metric.details && (
          <div className="mt-2 space-y-1">
            {Object.entries(metric.details).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-muted-foreground capitalize">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderToolStatusCard = (tool: ToolStatusCard) => (
    <Card className={`border-l-4 ${
      tool.status === 'healthy' ? 'border-l-green-500' :
      tool.status === 'degraded' ? 'border-l-yellow-500' :
      tool.status === 'unhealthy' ? 'border-l-red-500' :
      'border-l-gray-500'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{tool.toolName}</CardTitle>
          <Badge variant={tool.status === 'healthy' ? 'default' :
                        tool.status === 'degraded' ? 'secondary' :
                        'destructive'}>
            {tool.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Uptime</div>
            <div className="font-medium">{tool.uptime.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Response Time</div>
            <div className="font-medium">{tool.responseTime}ms</div>
          </div>
        </div>

        {tool.issues.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-muted-foreground mb-1">Issues:</div>
            <div className="space-y-1">
              {tool.issues.slice(0, 2).map((issue, index) => (
                <div key={index} className="text-xs text-red-600">{issue}</div>
              ))}
              {tool.issues.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{tool.issues.length - 2} more
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Last check: {tool.lastCheck.toLocaleTimeString()}</span>
          {tool.trend !== 'stable' && (
            <div className={`flex items-center ${
              tool.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {tool.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderIncidentCard = (incident: CrossSystemIncident) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{incident.title}</CardTitle>
          <Badge variant={incident.severity === 'critical' ? 'destructive' :
                        incident.severity === 'high' ? 'secondary' :
                        'outline'}>
            {incident.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <div className="text-muted-foreground">Duration</div>
            <div className="font-medium">
              {incident.duration ? `${Math.round(incident.duration / 60000)}m` : 'Active'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Affected Systems</div>
            <div className="font-medium">{incident.affectedSystems.length}</div>
          </div>
        </div>

        {incident.affectedSystems.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">Impact:</div>
            <div className="space-y-1">
              {incident.affectedSystems.slice(0, 2).map((system, index) => (
                <div key={index} className="text-xs">
                  <span className="font-medium">{system.name}:</span> {system.impact}
                </div>
              ))}
              {incident.affectedSystems.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{incident.affectedSystems.length - 2} more systems
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Started: {incident.startTime.toLocaleTimeString()}</span>
          {!incident.endTime && (
            <Badge variant="outline" className="text-xs">Active</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderAlertCard = (alert: UnifiedAlert) => (
    <Card className={`border-l-4 ${
      alert.severity === 'critical' ? 'border-l-red-500' :
      alert.severity === 'error' ? 'border-l-orange-500' :
      alert.severity === 'warning' ? 'border-l-yellow-500' :
      'border-l-blue-500'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{alert.title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">{alert.source}</Badge>
            {alert.resolution.status !== 'resolved' && (
              <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                {alert.resolution.status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <div className="text-muted-foreground">Impact</div>
            <div className="font-medium">{alert.impact.userImpact}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Tools Affected</div>
            <div className="font-medium">{alert.impact.affectedTools.length}</div>
          </div>
        </div>

        {alert.resolution.actions.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">Actions:</div>
            <div className="space-y-1">
              {alert.resolution.actions.slice(0, 2).map((action, index) => (
                <div key={index} className="text-xs">• {action}</div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{alert.timestamp.toLocaleTimeString()}</span>
          {alert.resolution.assignedTo && (
            <span>Assigned to: {alert.resolution.assignedTo}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderMiniChart = (data: TimeSeriesData[], color: string = 'blue') => {
    if (data.length === 0) return null;

    const width = 200;
    const height = 60;
    const padding = 8;

    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = padding + (1 - (point.value - minValue) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="w-full h-full">
        <polyline
          points={points}
          fill="none"
          stroke={color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#ef4444'}
          strokeWidth="2"
        />
        {data.length > 0 && (
          <circle
            cx={padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding)}
            cy={padding + (1 - (values[values.length - 1] - minValue) / range) * (height - 2 * padding)}
            r="3"
            fill={color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#ef4444'}
          />
        )}
      </svg>
    );
  };

  if (isLoading && unifiedMetrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading uptime monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Uptime Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            SC-005 Compliance Monitoring • Real-time system health and availability
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-refresh">Auto-refresh</Label>
            <Switch
              id="auto-refresh"
              checked={config.autoRefresh}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoRefresh: checked }))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="time-range">Time range:</Label>
            <select
              id="time-range"
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="show-details">Details</Label>
            <Switch
              id="show-details"
              checked={config.showDetails}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showDetails: checked }))}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Alert for critical issues */}
      {alerts.some(a => a.severity === 'critical' && a.resolution.status !== 'resolved') && (
        <Alert className="border-red-200 bg-red-50">
          <AlertOctagon className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Issues Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            {alerts.filter(a => a.severity === 'critical' && a.resolution.status !== 'resolved').length} critical alerts require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">SC-005</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {overviewMetrics.map((metric, index) => (
              <div key={index}>{renderMetricCard(metric)}</div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Uptime Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  Uptime Trend
                </CardTitle>
                <CardDescription>
                  System uptime over the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {uptimeTimeSeries.length > 0 ? (
                    renderMiniChart(uptimeTimeSeries, 'green')
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Response Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Response Time Trend
                </CardTitle>
                <CardDescription>
                  Average response time over the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {responseTimeTimeSeries.length > 0 ? (
                    renderMiniChart(responseTimeTimeSeries, 'blue')
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Incidents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Recent Incidents
                  </span>
                  <Badge variant="outline">
                    {incidents.filter(i => !i.endTime).length} active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {incidents.slice(0, 5).map((incident, index) => (
                      <div key={index}>{renderIncidentCard(incident)}</div>
                    ))}
                    {incidents.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p>No incidents in the selected period</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Recent Alerts
                  </span>
                  <Badge variant="outline">
                    {alerts.filter(a => a.resolution.status === 'pending').length} pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert, index) => (
                      <div key={index}>{renderAlertCard(alert)}</div>
                    ))}
                    {alerts.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p>No alerts in the selected period</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Tool Status</h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Healthy
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Degraded
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Unhealthy
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {toolStatuses.map((tool, index) => (
              <div key={index}>{renderToolStatusCard(tool)}</div>
            ))}
          </div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Incidents</h2>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {incidents.filter(i => !i.endTime).length} active
              </Badge>
              <Badge variant="outline">
                {incidents.length} total
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {incidents.map((incident, index) => (
              <div key={index}>{renderIncidentCard(incident)}</div>
            ))}
            {incidents.length === 0 && (
              <div className="col-span-full text-center py-12">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-semibold mb-2">No Incidents</h3>
                <p className="text-muted-foreground">Great! No incidents reported in the selected period.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Performance Metrics</h2>
            <Badge variant="outline">
              {currentMetrics?.uptime.degradations || 0} degradations
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>
                  Distribution of response times across all tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <PieChart className="h-16 w-16 mb-4" />
                  <p>Response time chart would be rendered here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  Performance trends and degradation patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <LineChart className="h-16 w-16 mb-4" />
                  <p>Performance trends chart would be rendered here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SC-005 Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">SC-005 Compliance</h2>
            <Badge variant={currentMetrics?.sc005?.compliance.compliant ? 'default' : 'destructive'}>
              {currentMetrics?.sc005?.compliance.compliant ? 'Compliant' : 'Non-Compliant'}
            </Badge>
          </div>

          {currentMetrics?.sc005 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Current Uptime</span>
                        <span className="font-medium">{currentMetrics.sc005.actual.uptime.toFixed(3)}%</span>
                      </div>
                      <Progress
                        value={currentMetrics.sc005.actual.uptime}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Target Uptime</span>
                        <span className="font-medium">{currentMetrics.sc005.target.uptime}%</span>
                      </div>
                      <Progress
                        value={currentMetrics.sc005.target.uptime}
                        className="h-2"
                      />
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Variance</span>
                        <span className={`font-medium ${
                          currentMetrics.sc005.variance.uptimeVariance <= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {currentMetrics.sc005.variance.uptimeVariance > 0 ? '+' : ''}
                          {currentMetrics.sc005.variance.uptimeVariance.toFixed(3)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Period</span>
                      <span className="font-medium">{currentMetrics.sc005.period.duration / (24 * 60 * 60 * 1000)} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Incidents</span>
                      <span className="font-medium">{currentMetrics.sc005.actual.incidents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Downtime</span>
                      <span className="font-medium">{currentMetrics.sc005.actual.downtimeMinutes.toFixed(1)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Violations</span>
                      <span className="font-medium">{currentMetrics.sc005.compliance.violations.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Reports</h2>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report</span>
                    <Badge variant="outline">
                      {report.period.start.toLocaleDateString()}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Generated on {report.generatedAt.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Health</span>
                      <span className="font-medium">{report.summary.overallHealth.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Uptime</span>
                      <span className="font-medium">{report.summary.uptimePercentage.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Incidents</span>
                      <span className="font-medium">{report.summary.incidentCount}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

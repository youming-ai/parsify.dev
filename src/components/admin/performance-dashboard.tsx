'use client';

import {
  Activity,
  AlertTriangle,
  Cpu,
  Download,
  HardDrive,
  MemoryStick,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface PerformanceMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    downloadSpeed: number;
    uploadSpeed: number;
    latency: number;
  };
  bundle: {
    size: number;
    compressed: number;
    loadTime: number;
    parsed: number;
  };
  tools: {
    loaded: number;
    total: number;
    loadTimes: Record<string, number>;
    memoryUsage: Record<string, number>;
  };
  user: {
    activeUsers: number;
    pageViews: number;
    errors: number;
    sessionDuration: number;
  };
}

export interface ToolPerformance {
  id: string;
  name: string;
  category: string;
  bundleSize: number;
  loadTime: number;
  memoryUsage: number;
  usage: number;
  errors: number;
  status: 'healthy' | 'warning' | 'error';
  lastUsed: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'cpu' | 'memory' | 'network' | 'bundle' | 'tool' | 'error';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  resolved?: boolean;
}

interface PerformanceDashboardProps {
  className?: string;
}

// Mock data generation
const generateMockMetrics = (): PerformanceMetrics => ({
  timestamp: Date.now(),
  cpu: {
    usage: Math.random() * 100,
    temperature: 45 + Math.random() * 20,
  },
  memory: {
    used: 512 + Math.random() * 256,
    total: 1024,
    percentage: 50 + Math.random() * 30,
  },
  network: {
    downloadSpeed: 10 + Math.random() * 50,
    uploadSpeed: 5 + Math.random() * 20,
    latency: 20 + Math.random() * 100,
  },
  bundle: {
    size: 2.1 + Math.random() * 0.5,
    compressed: 0.7 + Math.random() * 0.2,
    loadTime: 1.2 + Math.random() * 0.8,
    parsed: 0.8 + Math.random() * 0.3,
  },
  tools: {
    loaded: 45 + Math.floor(Math.random() * 20),
    total: 70,
    loadTimes: {
      'json-formatter': 120 + Math.random() * 50,
      'code-executor': 250 + Math.random() * 100,
      'image-converter': 180 + Math.random() * 80,
      'password-generator': 45 + Math.random() * 20,
    },
    memoryUsage: {
      'json-formatter': 12 + Math.random() * 5,
      'code-executor': 35 + Math.random() * 15,
      'image-converter': 28 + Math.random() * 10,
      'password-generator': 8 + Math.random() * 4,
    },
  },
  user: {
    activeUsers: 150 + Math.floor(Math.random() * 50),
    pageViews: 1200 + Math.floor(Math.random() * 300),
    errors: 2 + Math.floor(Math.random() * 5),
    sessionDuration: 180 + Math.random() * 120,
  },
});

const generateMockTools = (): ToolPerformance[] => [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    category: 'JSON',
    bundleSize: 125000,
    loadTime: 120,
    memoryUsage: 15,
    usage: 85,
    errors: 0,
    status: 'healthy',
    lastUsed: Date.now() - 1000 * 60 * 5,
  },
  {
    id: 'code-executor',
    name: 'Code Executor',
    category: 'Code',
    bundleSize: 180000,
    loadTime: 280,
    memoryUsage: 42,
    usage: 92,
    errors: 1,
    status: 'warning',
    lastUsed: Date.now() - 1000 * 60 * 2,
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    category: 'Image',
    bundleSize: 156000,
    loadTime: 195,
    memoryUsage: 38,
    usage: 78,
    errors: 0,
    status: 'healthy',
    lastUsed: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    category: 'Security',
    bundleSize: 45000,
    loadTime: 45,
    memoryUsage: 8,
    usage: 65,
    errors: 0,
    status: 'healthy',
    lastUsed: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'text-analyzer',
    name: 'Text Analyzer',
    category: 'Text',
    bundleSize: 98000,
    loadTime: 88,
    memoryUsage: 22,
    usage: 45,
    errors: 3,
    status: 'error',
    lastUsed: Date.now() - 1000 * 60 * 60,
  },
];

const generateMockAlerts = (): PerformanceAlert[] => [
  {
    id: '1',
    type: 'memory',
    severity: 'warning',
    title: 'High Memory Usage',
    message: 'Memory usage exceeds 80% threshold',
    timestamp: Date.now() - 1000 * 60 * 10,
  },
  {
    id: '2',
    type: 'tool',
    severity: 'error',
    title: 'Tool Error',
    message: 'Text Analyzer encountered 3 errors in the last hour',
    timestamp: Date.now() - 1000 * 60 * 30,
  },
  {
    id: '3',
    type: 'bundle',
    severity: 'info',
    title: 'Bundle Optimization Available',
    message: 'Code Executor bundle can be optimized by 15%',
    timestamp: Date.now() - 1000 * 60 * 45,
  },
];

export function PerformanceDashboard({ className }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(generateMockMetrics());
  const [tools, setTools] = React.useState<ToolPerformance[]>(generateMockTools());
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>(generateMockAlerts());
  const [timeRange, setTimeRange] = React.useState('1h');
  const [refreshInterval, _setRefreshInterval] = React.useState(5000);
  const [isLive, setIsLive] = React.useState(true);

  // Update metrics periodically
  React.useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics(generateMockMetrics());

      // Occasionally update tools and alerts
      if (Math.random() > 0.7) {
        setTools(generateMockTools());
      }
      if (Math.random() > 0.8) {
        setAlerts(generateMockAlerts());
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isLive, refreshInterval]);

  const getStatusColor = React.useCallback((status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }, []);

  const getSeverityColor = React.useCallback((severity: string) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'critical':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const formatBytes = React.useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }, []);

  const formatDuration = React.useCallback((ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }, []);

  const downloadReport = React.useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      tools,
      alerts,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [metrics, tools, alerts]);

  const criticalAlerts = alerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'error'
  ).length;
  const totalBundleSize = tools.reduce((sum, tool) => sum + tool.bundleSize, 0);
  const averageLoadTime = tools.reduce((sum, tool) => sum + tool.loadTime, 0) / tools.length;

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl text-gray-900">Performance Dashboard</h1>
            <p className="text-gray-600">Real-time monitoring and optimization insights</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5m">5m</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
              </SelectContent>
            </Select>

            <Button variant={isLive ? 'default' : 'outline'} onClick={() => setIsLive(!isLive)}>
              <Activity className="mr-2 h-4 w-4" />
              {isLive ? 'Live' : 'Paused'}
            </Button>

            <Button variant="outline" onClick={downloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Users</p>
                  <p className="font-bold text-2xl">{metrics.user.activeUsers}</p>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                    <span className="text-green-600">+12%</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">CPU Usage</p>
                  <p className="font-bold text-2xl">{metrics.cpu.usage.toFixed(1)}%</p>
                  <div className="flex items-center text-sm">
                    {metrics.cpu.usage > 80 ? (
                      <TrendingUp className="mr-1 h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="mr-1 h-4 w-4 text-green-500" />
                    )}
                    <span className={metrics.cpu.usage > 80 ? 'text-red-600' : 'text-green-600'}>
                      {metrics.cpu.usage > 80 ? 'High' : 'Normal'}
                    </span>
                  </div>
                </div>
                <Cpu className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Memory Usage</p>
                  <p className="font-bold text-2xl">{metrics.memory.percentage.toFixed(1)}%</p>
                  <div className="flex items-center text-sm">
                    <MemoryStick className="mr-1 h-4 w-4 text-purple-500" />
                    <span className="text-gray-600">
                      {formatBytes(metrics.memory.used * 1024 * 1024)} /{' '}
                      {formatBytes(metrics.memory.total * 1024 * 1024)}
                    </span>
                  </div>
                </div>
                <HardDrive className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Critical Alerts</p>
                  <p className="font-bold text-2xl">{criticalAlerts}</p>
                  <div className="flex items-center text-sm">
                    <AlertTriangle className="mr-1 h-4 w-4 text-red-500" />
                    <span className={criticalAlerts > 0 ? 'text-red-600' : 'text-green-600'}>
                      {criticalAlerts > 0 ? 'Action Required' : 'All Clear'}
                    </span>
                  </div>
                </div>
                <Zap className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-lg border p-3 ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{alert.title}</h4>
                        <p className="text-sm opacity-80">{alert.message}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="capitalize">
                          {alert.severity}
                        </Badge>
                        <div className="mt-1 text-xs opacity-70">
                          {formatDuration(Date.now() - alert.timestamp)} ago
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Metrics */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>System Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>CPU Usage</span>
                      <span>{metrics.cpu.usage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${
                          metrics.cpu.usage > 80
                            ? 'bg-red-500'
                            : metrics.cpu.usage > 60
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${metrics.cpu.usage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>{metrics.memory.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${
                          metrics.memory.percentage > 80
                            ? 'bg-red-500'
                            : metrics.memory.percentage > 60
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${metrics.memory.percentage}%` }}
                      />
                    </div>
                  </div>

                  {metrics.cpu.temperature && (
                    <div>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>CPU Temperature</span>
                        <span>{metrics.cpu.temperature.toFixed(1)}°C</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${
                            metrics.cpu.temperature > 70
                              ? 'bg-red-500'
                              : metrics.cpu.temperature > 50
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${(metrics.cpu.temperature / 100) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Active Users</span>
                    <span className="font-semibold">{metrics.user.activeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Page Views</span>
                    <span className="font-semibold">{metrics.user.pageViews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Errors</span>
                    <span className="font-semibold text-red-600">{metrics.user.errors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Session</span>
                    <span className="font-semibold">
                      {formatDuration(metrics.user.sessionDuration * 1000)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tool Performance ({tools.length} tools)</span>
                  <div className="flex gap-2 text-sm">
                    <span className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      Healthy
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      Warning
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      Error
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tools.map((tool) => (
                    <div key={tool.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{tool.name}</h4>
                          <p className="text-gray-600 text-sm">
                            {tool.category} • {formatBytes(tool.bundleSize)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(tool.status)}>{tool.status}</Badge>
                          <div className="mt-1 text-gray-600 text-sm">
                            {formatDuration(tool.loadTime)} load time
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                        <div>
                          <span className="text-gray-600">Usage:</span>
                          <div className="flex items-center gap-1">
                            <div className="h-1 flex-1 rounded-full bg-gray-200">
                              <div
                                className="h-1 rounded-full bg-blue-500"
                                style={{ width: `${tool.usage}%` }}
                              />
                            </div>
                            <span>{tool.usage}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Memory:</span>
                          <div>{tool.memoryUsage} MB</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Errors:</span>
                          <div className={tool.errors > 0 ? 'text-red-600' : 'text-green-600'}>
                            {tool.errors}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Used:</span>
                          <div>{formatDuration(Date.now() - tool.lastUsed)} ago</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bundle" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bundle Size Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Bundle Size:</span>
                    <span className="font-semibold">{formatBytes(totalBundleSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Tool Size:</span>
                    <span className="font-semibold">
                      {formatBytes(totalBundleSize / tools.length)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Load Time:</span>
                    <span className="font-semibold">{formatDuration(averageLoadTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compression Ratio:</span>
                    <span className="font-semibold">
                      {((1 - metrics.bundle.compressed / metrics.bundle.size) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Bundle Size vs 200KB Limit</span>
                      <span>{((totalBundleSize / (200 * 1024)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${
                          totalBundleSize > 200 * 1024
                            ? 'bg-red-500'
                            : totalBundleSize > 150 * 1024
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min((totalBundleSize / (200 * 1024)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Largest Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tools
                      .sort((a, b) => b.bundleSize - a.bundleSize)
                      .slice(0, 5)
                      .map((tool, index) => (
                        <div
                          key={tool.id}
                          className="flex items-center justify-between rounded bg-gray-50 p-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">#{index + 1}</span>
                            <span>{tool.name}</span>
                          </div>
                          <span className="font-semibold text-sm">
                            {formatBytes(tool.bundleSize)}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Network Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Download Speed:</span>
                    <span className="font-semibold">
                      {metrics.network.downloadSpeed.toFixed(1)} Mbps
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upload Speed:</span>
                    <span className="font-semibold">
                      {metrics.network.uploadSpeed.toFixed(1)} Mbps
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span className="font-semibold">{metrics.network.latency.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bundle Load Time:</span>
                    <span className="font-semibold">
                      {formatDuration(metrics.bundle.loadTime * 1000)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parse Time:</span>
                    <span className="font-semibold">
                      {formatDuration(metrics.bundle.parsed * 1000)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Optimization Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <h4 className="font-semibold text-blue-800">Bundle Splitting</h4>
                      <p className="text-blue-700 text-sm">
                        Consider splitting {tools.filter((t) => t.bundleSize > 150000).length} large
                        tools for better loading performance
                      </p>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <h4 className="font-semibold text-green-800">Caching Strategy</h4>
                      <p className="text-green-700 text-sm">
                        Implement aggressive caching for static assets to reduce load times
                      </p>
                    </div>
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <h4 className="font-semibold text-yellow-800">Image Optimization</h4>
                      <p className="text-sm text-yellow-700">
                        Compress and optimize images to reduce bundle size by up to 30%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Feedback Dashboard Component
 * Comprehensive dashboard for viewing feedback analytics, insights, and management
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Calendar,
  Star
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeedbackStore } from '@/lib/feedback/feedback-store';
import { FeedbackAnalytics, FeedbackInsight, FeedbackRecommendation, FeedbackAlert } from '@/types/feedback';

interface FeedbackDashboardProps {
  className?: string;
  refreshInterval?: number;
  showFilters?: boolean;
  showExports?: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function FeedbackDashboard({
  className,
  refreshInterval = 300000, // 5 minutes
  showFilters = true,
  showExports = true
}: FeedbackDashboardProps) {
  const { analytics, refreshAnalytics, isAnalyzing } = useFeedbackStore();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshAnalytics();

    if (refreshInterval > 0) {
      const interval = setInterval(refreshAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshAnalytics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAnalytics();
    setIsRefreshing(false);
  };

  const exportData = (format: 'json' | 'csv') => {
    if (!analytics) return;

    const data = format === 'json'
      ? JSON.stringify(analytics, null, 2)
      : convertToCSV(analytics);

    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (analytics: FeedbackAnalytics): string => {
    // Convert analytics data to CSV format
    const headers = [
      'Metric',
      'Value',
      'Change',
      'Trend'
    ];

    const rows = [
      ['Total Submissions', analytics.summary.totalSubmissions.toString(), '', ''],
      ['Average Rating', analytics.summary.averageRating.toFixed(2), '', ''],
      ['Satisfaction Score', analytics.summary.satisfactionScore.toFixed(2), '', ''],
      ['NPS Score', analytics.summary.npsScore.toFixed(2), '', ''],
      ['Completion Rate', `${analytics.summary.completionRate.toFixed(1)}%`, '', ''],
      ['Insights Generated', analytics.insights.length.toString(), '', ''],
      ['Recommendations', analytics.recommendations.length.toString(), '', ''],
      ['Active Alerts', analytics.alerts.length.toString(), '', '']
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">Loading feedback analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Feedback Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor user feedback and generate actionable insights
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {showFilters && (
            <div className="flex items-center space-x-1 border rounded-lg p-1">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={dateRange === range ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDateRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isAnalyzing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {showExports && (
            <div className="flex items-center space-x-1 border rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportData('json')}
              >
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportData('csv')}
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Submissions"
          value={analytics.summary.totalSubmissions}
          icon={<MessageSquare className="h-5 w-5" />}
          color="blue"
          trend={getTrendData(analytics.trends, 'daily_volume')}
        />
        <SummaryCard
          title="Average Rating"
          value={analytics.summary.averageRating.toFixed(1)}
          icon={<Star className="h-5 w-5" />}
          color="yellow"
          suffix="/5"
          trend={getTrendData(analytics.trends, 'average_rating')}
        />
        <SummaryCard
          title="Satisfaction Score"
          value={analytics.summary.satisfactionScore.toFixed(1)}
          icon={<Users className="h-5 w-5" />}
          color="green"
          suffix="/5"
          trend={getTrendData(analytics.trends, 'average_satisfaction')}
        />
        <SummaryCard
          title="Completion Rate"
          value={`${analytics.summary.completionRate.toFixed(1)}%`}
          icon={<CheckCircle className="h-5 w-5" />}
          color="purple"
          trend={getTrendData(analytics.trends, 'completion_rate')}
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submission Volume Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Submission Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData(analytics.trends, 'daily_volume')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Sentiment Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getSentimentData(analytics.summary.breakdown.bySentiment)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getSentimentData(analytics.summary.breakdown.bySentiment).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Feedback Types */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Feedback by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTypeData(analytics.summary.breakdown.byType)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {analytics.insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.trends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {analytics.recommendations.map((recommendation) => (
              <RecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {analytics.alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tool Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Feedback by Tool</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getToolData(analytics.summary.breakdown.byTool)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tool" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Priority Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Feedback by Priority</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getPriorityData(analytics.summary.breakdown.byPriority)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getPriorityData(analytics.summary.breakdown.byPriority).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Status Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Feedback by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getStatusData(analytics.summary.breakdown.byStatus)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#EC4899" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Journey Stage Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Feedback by Journey Stage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getJourneyStageData(analytics.summary.breakdown.byJourneyStage)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Summary Card Component
interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  suffix?: string;
  trend?: any;
}

function SummaryCard({ title, value, icon, color, suffix = '', trend }: SummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  };

  const isPositive = trend?.change?.direction === 'up';
  const hasTrend = trend && trend.change?.percentage !== 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}{suffix}
          </p>
          {hasTrend && (
            <div className="flex items-center mt-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(trend.change.percentage).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Insight Card Component
interface InsightCardProps {
  insight: FeedbackInsight;
}

function InsightCard({ insight }: InsightCardProps) {
  const severityColors = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold">{insight.title}</h3>
            <Badge className={severityColors[insight.severity]}>
              {insight.severity}
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {insight.description}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Confidence:</span>
              <div className="flex items-center space-x-2">
                <Progress value={insight.confidence * 100} className="w-20 h-2" />
                <span className="text-gray-700 dark:text-gray-300">
                  {(insight.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Impact:</span>
              <span className="text-gray-700 dark:text-gray-300">
                {insight.impact.level} ({insight.impact.area})
              </span>
            </div>
          </div>

          {insight.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recommendations:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {insight.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Trend Card Component
interface TrendCardProps {
  trend: any;
}

function TrendCard({ trend }: TrendCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{trend.metric.replace(/_/g, ' ')}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trend.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-500">Pattern:</span>
        <Badge>{trend.pattern}</Badge>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-gray-500">Change:</span>
        <span className={trend.change?.direction === 'up' ? 'text-green-500' : 'text-red-500'}>
          {trend.change?.percentage.toFixed(1)}%
        </span>
      </div>
    </Card>
  );
}

// Recommendation Card Component
interface RecommendationCardProps {
  recommendation: FeedbackRecommendation;
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    high: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold">{recommendation.title}</h3>
            <Badge className={priorityColors[recommendation.priority]}>
              {recommendation.priority}
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {recommendation.description}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Category:</span>
              <Badge variant="outline">{recommendation.category}</Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Effort:</span>
              <Badge variant="outline">{recommendation.effort}</Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Timeframe:</span>
              <span className="text-gray-700 dark:text-gray-300">
                {recommendation.timeframe}
              </span>
            </div>
          </div>

          {recommendation.expectedOutcome && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Outcome:
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {recommendation.expectedOutcome.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Alert Card Component
interface AlertCardProps {
  alert: FeedbackAlert;
}

function AlertCard({ alert }: AlertCardProps) {
  const severityColors = {
    low: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
    medium: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
    high: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950',
    critical: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
  };

  return (
    <Card className={`p-6 ${severityColors[alert.severity]} border`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-current" />
            <h3 className="text-lg font-semibold">{alert.title}</h3>
            <Badge>{alert.type.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-current mb-4">
            {alert.message}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Current Value:</span>
              <span className="font-medium">{alert.current}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Threshold:</span>
              <span className="font-medium">{alert.threshold.value}</span>
            </div>
          </div>

          {alert.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {alert.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Data transformation functions
function getChartData(trends: any[], metric: string): any[] {
  const trend = trends.find(t => t.metric === metric);
  if (!trend) return [];

  return trend.data.map((point: any) => ({
    date: new Date(point.timestamp).toLocaleDateString(),
    value: point.value,
  }));
}

function getSentimentData(sentiment: Record<string, number>): any[] {
  return Object.entries(sentiment).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));
}

function getTypeData(types: Record<string, number>): any[] {
  return Object.entries(types).map(([key, value]) => ({
    type: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));
}

function getToolData(tools: Record<string, number>): any[] {
  return Object.entries(tools).map(([key, value]) => ({
    tool: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));
}

function getPriorityData(priorities: Record<string, number>): any[] {
  return Object.entries(priorities).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));
}

function getStatusData(statuses: Record<string, number>): any[] {
  return Object.entries(statuses).map(([key, value]) => ({
    status: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));
}

function getJourneyStageData(stages: Record<string, number>): any[] {
  return Object.entries(stages).map(([key, value]) => ({
    stage: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));
}

function getTrendData(trends: any[], metric: string): any {
  const trend = trends.find(t => t.metric === metric);
  return trend?.change;
}

export default FeedbackDashboard;

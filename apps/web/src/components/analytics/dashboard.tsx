/**
 * Analytics Dashboard Component
 * Provides comprehensive analytics visualization
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Analytics types
interface DashboardData {
  overview: {
    totalPageViews: number
    uniqueSessions: number
    activeUsers: number
    totalToolUsage: number
    errorRate: number
    averageResponseTime: number
  }
  timeline: Array<{
    date: string
    pageViews: number
    sessions: number
    users: number
    toolUsage: number
  }>
  tools: Array<{
    name: string
    usage: number
    avgProcessingTime: number
    errorRate: number
  }>
  performance: {
    averageLCP: number
    averageFID: number
    averageCLS: number
    averageFCP: number
    averageTTFB: number
  }
  realTime: {
    currentUsers: number
    pageViewsLastHour: number
    toolUsageLastHour: number
    activeSessions: number
  }
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/v1/analytics/dashboard?startDate=${getStartDate()}&endDate=${getEndDate()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const analyticsData = await response.json()
      setData(analyticsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const getStartDate = () => {
    const now = new Date()
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return startDate.toISOString()
  }

  const getEndDate = () => {
    return new Date().toISOString()
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884D8',
    '#82CA9D',
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchAnalyticsData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your application performance and user engagement
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
            >
              {range === '7d'
                ? '7 Days'
                : range === '30d'
                  ? '30 Days'
                  : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Page Views</div>
          <div className="text-2xl font-bold">
            {formatNumber(data.overview.totalPageViews)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Sessions</div>
          <div className="text-2xl font-bold">
            {formatNumber(data.overview.uniqueSessions)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Active Users</div>
          <div className="text-2xl font-bold">
            {formatNumber(data.overview.activeUsers)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Tool Usage</div>
          <div className="text-2xl font-bold">
            {formatNumber(data.overview.totalToolUsage)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Error Rate</div>
          <div className="text-2xl font-bold">
            {formatPercentage(data.overview.errorRate)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Response</div>
          <div className="text-2xl font-bold">
            {formatDuration(data.overview.averageResponseTime)}
          </div>
        </Card>
      </div>

      {/* Real-time Stats */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Real-time Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(data.realTime.currentUsers)}
            </div>
            <div className="text-sm text-muted-foreground">Current Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(data.realTime.pageViewsLastHour)}
            </div>
            <div className="text-sm text-muted-foreground">Page Views (1h)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(data.realTime.toolUsageLastHour)}
            </div>
            <div className="text-sm text-muted-foreground">Tool Usage (1h)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(data.realTime.activeSessions)}
            </div>
            <div className="text-sm text-muted-foreground">Active Sessions</div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Traffic Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Page Views"
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Sessions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* User Growth Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">User Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Active Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Sessions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tool Usage Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Tool Usage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.tools}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#8884d8" name="Usage Count" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Tool Performance */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Tool Performance</h3>
              <div className="space-y-4">
                {data.tools.map((tool, index) => (
                  <div
                    key={tool.name}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="font-medium">{tool.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{tool.usage} uses</Badge>
                      <Badge variant="outline">
                        {formatDuration(tool.avgProcessingTime)}
                      </Badge>
                      <Badge
                        variant={
                          tool.errorRate > 5 ? 'destructive' : 'secondary'
                        }
                      >
                        {formatPercentage(tool.errorRate)} errors
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Web Vitals */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Core Web Vitals</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      Largest Contentful Paint (LCP)
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Time to load largest content
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatDuration(data.performance.averageLCP)}
                    </div>
                    <Badge
                      variant={
                        data.performance.averageLCP < 2500
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {data.performance.averageLCP < 2500
                        ? 'Good'
                        : 'Needs Improvement'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">First Input Delay (FID)</div>
                    <div className="text-sm text-muted-foreground">
                      Time to respond to first interaction
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatDuration(data.performance.averageFID)}
                    </div>
                    <Badge
                      variant={
                        data.performance.averageFID < 100
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {data.performance.averageFID < 100
                        ? 'Good'
                        : 'Needs Improvement'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      Cumulative Layout Shift (CLS)
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Visual stability score
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {data.performance.averageCLS.toFixed(3)}
                    </div>
                    <Badge
                      variant={
                        data.performance.averageCLS < 0.1
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {data.performance.averageCLS < 0.1
                        ? 'Good'
                        : 'Needs Improvement'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Performance Metrics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Additional Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      First Contentful Paint (FCP)
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Time to render first content
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {formatDuration(data.performance.averageFCP)}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Time to First Byte (TTFB)</div>
                    <div className="text-sm text-muted-foreground">
                      Server response time
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {formatDuration(data.performance.averageTTFB)}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">User Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {formatNumber(data.overview.activeUsers)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Active Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {formatNumber(data.overview.uniqueSessions)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Sessions
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {(
                    data.overview.totalPageViews / data.overview.uniqueSessions
                  ).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Pages per Session
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Real-time Monitoring</h3>
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-4">
                {formatNumber(data.realTime.currentUsers)}
              </div>
              <div className="text-xl text-muted-foreground">
                Current Active Users
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

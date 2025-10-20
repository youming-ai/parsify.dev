/**
 * Tool Analytics Component
 * Provides detailed analytics for specific tools
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ToolAnalyticsData {
  toolName: string
  overview: {
    totalUsage: number
    uniqueUsers: number
    avgProcessingTime: number
    successRate: number
    errorRate: number
    avgInputSize: number
    avgOutputSize: number
  }
  timeline: Array<{
    date: string
    usage: number
    users: number
    avgTime: number
    errors: number
  }>
  actions: Array<{
    name: string
    count: number
    avgTime: number
    successRate: number
    errorRate: number
  }>
  errors: Array<{
    message: string
    count: number
    lastOccurred: string
  }>
  performance: {
    percentiles: {
      p50: number
      p75: number
      p90: number
      p95: number
      p99: number
    }
    distribution: Array<{
      range: string
      count: number
      percentage: number
    }>
  }
}

interface ToolAnalyticsProps {
  toolId: string
  toolName: string
}

export function ToolAnalytics({ toolId, toolName }: ToolAnalyticsProps) {
  const [data, setData] = useState<ToolAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    fetchToolAnalytics()
  }, [toolId, timeRange])

  const fetchToolAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/analytics/tools/${toolId}?startDate=${getStartDate()}&endDate=${getEndDate()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch tool analytics')
      }

      const analyticsData = await response.json()
      setData(analyticsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tool analytics')
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

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tool analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchToolAnalytics} className="mt-4">
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
          <h1 className="text-3xl font-bold">{data.toolName} Analytics</h1>
          <p className="text-muted-foreground">Detailed usage and performance metrics for {data.toolName}</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Usage</div>
          <div className="text-2xl font-bold">{formatNumber(data.overview.totalUsage)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Unique Users</div>
          <div className="text-2xl font-bold">{formatNumber(data.overview.uniqueUsers)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Processing Time</div>
          <div className="text-2xl font-bold">{formatDuration(data.overview.avgProcessingTime)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Success Rate</div>
          <div className="text-2xl font-bold">{formatPercentage(data.overview.successRate)}</div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Error Rate</div>
                    <div className="text-sm text-muted-foreground">Percentage of failed operations</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatPercentage(data.overview.errorRate)}</div>
                    <Badge variant={data.overview.errorRate < 5 ? 'default' : 'destructive'}>
                      {data.overview.errorRate < 5 ? 'Good' : 'High'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Average Input Size</div>
                    <div className="text-sm text-muted-foreground">Typical input data size</div>
                  </div>
                  <div className="text-lg font-bold">{formatBytes(data.overview.avgInputSize)}</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Average Output Size</div>
                    <div className="text-sm text-muted-foreground">Typical output data size</div>
                  </div>
                  <div className="text-lg font-bold">{formatBytes(data.overview.avgOutputSize)}</div>
                </div>
              </div>
            </Card>

            {/* Usage by Action */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Usage by Action</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.actions}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.actions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Trends Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Usage Trends</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="usage" stackId="1" stroke="#8884d8" fill="#8884d8" name="Usage Count" />
                <Area yAxisId="right" type="monotone" dataKey="users" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Unique Users" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Percentiles */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Percentiles</h3>
              <div className="space-y-4">
                {Object.entries(data.performance.percentiles).map(([percentile, time]) => (
                  <div key={percentile} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="font-medium">{percentile.toUpperCase()}</div>
                    <div className="text-lg font-bold">{formatDuration(time)}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Performance Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Response Time Distribution</h3>
              <div className="space-y-3">
                {data.performance.distribution.map((item, index) => (
                  <div key={item.range} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.range}</span>
                      <span>{formatPercentage(item.percentage)}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Performance Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgTime" stroke="#8884d8" strokeWidth={2} name="Avg Processing Time" />
                <Line type="monotone" dataKey="errors" stroke="#ff7300" strokeWidth={2} name="Error Count" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Action Breakdown</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.actions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Usage Count" />
                <Bar dataKey="avgTime" fill="#82ca9d" name="Avg Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Action Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.actions.map((action) => (
              <Card key={action.name} className="p-4">
                <h4 className="font-semibold mb-3">{action.name}</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Count</span>
                    <span className="font-medium">{formatNumber(action.count)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Time</span>
                    <span className="font-medium">{formatDuration(action.avgTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <Badge variant={action.successRate > 95 ? 'default' : 'secondary'}>
                      {formatPercentage(action.successRate)}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Common Errors</h3>
            {data.errors.length > 0 ? (
              <div className="space-y-3">
                {data.errors.map((error, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-red-600 mb-1">{error.message}</div>
                        <div className="text-sm text-muted-foreground">
                          Last occurred: {new Date(error.lastOccurred).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="destructive">{formatNumber(error.count)} occurrences</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-green-500 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-muted-foreground">No errors reported in the selected time period</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Performance Charts Component
 * Interactive charts and visualizations for performance metrics
 * Uses Recharts for responsive, animated data visualization
 */

'use client';

import React, { useMemo } from 'react';
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
	ReferenceLine,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
	TrendingUp,
	TrendingDown,
	Activity,
	Clock,
	Target,
	Zap,
	AlertTriangle,
	CheckCircle
} from 'lucide-react';

import { PerformanceMetrics, RealtimeMetrics } from '@/monitoring/types';

interface PerformanceChartsProps {
	metrics: PerformanceMetrics;
	realtimeMetrics?: RealtimeMetrics | null;
	timeRange: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function PerformanceCharts({ metrics, realtimeMetrics, timeRange }: PerformanceChartsProps) {
	// Generate time-series data for response time chart
	const responseTimeData = useMemo(() => {
		const now = new Date();
		const dataPoints = timeRange === '1h' ? 12 : timeRange === '6h' ? 24 : timeRange === '24h' ? 24 : 7;
		const interval = timeRange === '7d' ? 'day' : 'hour';

		return Array.from({ length: dataPoints }, (_, i) => {
			const time = new Date(now);
			if (interval === 'hour') {
				time.setHours(now.getHours() - (dataPoints - i - 1));
			} else {
				time.setDate(now.getDate() - (dataPoints - i - 1));
			}

			// Simulate realistic response time variations
			const baseTime = metrics.averageResponseTime;
			const variation = Math.sin(i * 0.5) * baseTime * 0.2 + Math.random() * baseTime * 0.1;
			const responseTime = Math.max(100, baseTime + variation);

			return {
				time: interval === 'hour' ? time.getHours() + ':00' : time.toLocaleDateString('en-US', { weekday: 'short' }),
				responseTime: Math.round(responseTime),
				pageLoadTime: Math.round(metrics.pageLoadTime + Math.random() * 500),
				targetTime: 5000,
			};
		});
	}, [metrics, timeRange]);

	// Generate task completion trend data
	const taskCompletionData = useMemo(() => {
		const now = new Date();
		const dataPoints = timeRange === '1h' ? 12 : timeRange === '6h' ? 24 : timeRange === '24h' ? 24 : 7;
		const interval = timeRange === '7d' ? 'day' : 'hour';

		return Array.from({ length: dataPoints }, (_, i) => {
			const time = new Date(now);
			if (interval === 'hour') {
				time.setHours(now.getHours() - (dataPoints - i - 1));
			} else {
				time.setDate(now.getDate() - (dataPoints - i - 1));
			}

			// Simulate task completion rate variations
			const baseRate = metrics.taskSuccessRate * 100;
			const variation = Math.sin(i * 0.3) * 5 + Math.random() * 3;
			const completionRate = Math.min(100, Math.max(70, baseRate + variation));

			return {
				time: interval === 'hour' ? time.getHours() + ':00' : time.toLocaleDateString('en-US', { weekday: 'short' }),
				completionRate: Math.round(completionRate),
				targetRate: 90,
				tasksCompleted: Math.floor(Math.random() * 50) + 20,
				tasksAttempted: Math.floor(Math.random() * 10) + 25,
			};
		});
	}, [metrics, timeRange]);

	// Generate tool performance distribution data
	const toolPerformanceData = useMemo(() => {
		const tools = [
			{ name: 'JSON Tools', usage: 35, performance: 92 },
			{ name: 'Code Tools', usage: 25, performance: 88 },
			{ name: 'File Tools', usage: 20, performance: 95 },
			{ name: 'Text Tools', usage: 12, performance: 90 },
			{ name: 'Security Tools', usage: 5, performance: 85 },
			{ name: 'Network Tools', usage: 3, performance: 87 },
		];

		return tools.map(tool => ({
			...tool,
			performance: tool.performance + Math.random() * 10 - 5,
		}));
	}, []);

	// Generate error distribution data
	const errorDistributionData = useMemo(() => {
		const errors = [
			{ type: 'Validation Errors', count: Math.floor(metrics.totalTasksAttempted * 0.03), severity: 'medium' },
			{ type: 'Network Errors', count: Math.floor(metrics.totalTasksAttempted * 0.02), severity: 'high' },
			{ type: 'Parse Errors', count: Math.floor(metrics.totalTasksAttempted * 0.015), severity: 'medium' },
			{ type: 'Timeout Errors', count: Math.floor(metrics.totalTasksAttempted * 0.01), severity: 'high' },
			{ type: 'User Errors', count: Math.floor(metrics.totalTasksAttempted * 0.025), severity: 'low' },
		];

		return errors;
	}, [metrics]);

	// Generate user activity data
	const userActivityData = useMemo(() => {
		return Array.from({ length: 24 }, (_, i) => ({
			hour: i,
			activity: Math.max(10, Math.sin((i - 6) * Math.PI / 12) * 50 + Math.random() * 20 + 20),
		}));
	}, []);

	// Custom tooltip component
	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			return (
				<div className="bg-background border rounded-lg p-3 shadow-lg">
					<p className="font-semibold">{label}</p>
					{payload.map((entry: any, index: number) => (
						<p key={index} className="text-sm" style={{ color: entry.color }}>
							{entry.name}: {entry.value.toLocaleString()}
							{entry.name.includes('Rate') && '%'}
							{entry.name.includes('Time') && 'ms'}
						</p>
					))}
				</div>
			);
		}
		return null;
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			{/* Response Time Trend */}
			<Card className="lg:col-span-2">
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span className="flex items-center">
							<Clock className="h-5 w-5 mr-2" />
							Response Time Trend
						</span>
						<Badge variant={metrics.averageResponseTime <= 5000 ? 'default' : 'destructive'}>
							{metrics.averageResponseTime <= 5000 ? 'Healthy' : 'Slow'}
						</Badge>
					</CardTitle>
					<CardDescription>
						Average response time and page load performance over time
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={300}>
						<LineChart data={responseTimeData}>
							<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
							<XAxis dataKey="time" />
							<YAxis />
							<Tooltip content={<CustomTooltip />} />
							<Legend />
							<ReferenceLine y={5000} stroke="#ef4444" strokeDasharray="5 5" label="Target (5s)" />
							<Line
								type="monotone"
								dataKey="responseTime"
								stroke="#8884d8"
								strokeWidth={2}
								name="Response Time"
								dot={{ r: 4 }}
							/>
							<Line
								type="monotone"
								dataKey="pageLoadTime"
								stroke="#82ca9d"
								strokeWidth={2}
								name="Page Load Time"
								dot={{ r: 4 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Task Completion Rate */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span className="flex items-center">
							<Target className="h-5 w-5 mr-2" />
							Task Completion Rate
						</span>
						<Badge variant={metrics.taskSuccessRate >= 0.9 ? 'default' : 'destructive'}>
							{metrics.taskSuccessRate >= 0.9 ? 'SC-011 Compliant' : 'Below Target'}
						</Badge>
					</CardTitle>
					<CardDescription>
						SC-011 compliance: 90% task completion target
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={250}>
						<AreaChart data={taskCompletionData}>
							<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
							<XAxis dataKey="time" />
							<YAxis domain={[70, 100]} />
							<Tooltip content={<CustomTooltip />} />
							<ReferenceLine y={90} stroke="#10b981" strokeDasharray="5 5" label="SC-011 Target" />
							<Area
								type="monotone"
								dataKey="completionRate"
								stroke="#10b981"
								fill="#10b981"
								fillOpacity={0.3}
								name="Completion Rate"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Tool Performance Distribution */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Activity className="h-5 w-5 mr-2" />
						Tool Performance Distribution
					</CardTitle>
					<CardDescription>
						Performance metrics by tool category
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={250}>
						<BarChart data={toolPerformanceData} layout="horizontal">
							<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
							<XAxis type="number" domain={[0, 100]} />
							<YAxis dataKey="name" type="category" width={80} />
							<Tooltip content={<CustomTooltip />} />
							<Bar dataKey="performance" fill="#8884d8" name="Performance Score">
								{toolPerformanceData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Error Distribution */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<AlertTriangle className="h-5 w-5 mr-2" />
						Error Distribution
					</CardTitle>
					<CardDescription>
						Breakdown of error types and frequency
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={250}>
						<PieChart>
							<Pie
								data={errorDistributionData}
								cx="50%"
								cy="50%"
								labelLine={false}
								label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
								outerRadius={80}
								fill="#8884d8"
								dataKey="count"
							>
								{errorDistributionData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
								))}
							</Pie>
							<Tooltip content={<CustomTooltip />} />
						</PieChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* User Activity Heat Map */}
			<Card className="lg:col-span-2">
				<CardHeader>
					<CardTitle className="flex items-center">
						<Zap className="h-5 w-5 mr-2" />
						User Activity Pattern
					</CardTitle>
					<CardDescription>
						Hourly user activity distribution over 24 hours
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={200}>
						<AreaChart data={userActivityData}>
							<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
							<XAxis dataKey="hour" />
							<YAxis />
							<Tooltip content={<CustomTooltip />} />
							<Area
								type="monotone"
								dataKey="activity"
								stroke="#f59e0b"
								fill="#f59e0b"
								fillOpacity={0.3}
								name="Active Users"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Performance Metrics Summary */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<CheckCircle className="h-5 w-5 mr-2" />
						Performance Summary
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium">Task Success Rate</span>
								<span className="text-sm">{(metrics.taskSuccessRate * 100).toFixed(1)}%</span>
							</div>
							<Progress value={metrics.taskSuccessRate * 100} className="h-2" />
						</div>
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium">Error Rate</span>
								<span className="text-sm">{((1 - metrics.taskSuccessRate) * 100).toFixed(1)}%</span>
							</div>
							<Progress value={(1 - metrics.taskSuccessRate) * 100} className="h-2" />
						</div>
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium">Bundle Size</span>
								<span className="text-sm">{(metrics.bundleSize / 1024 / 1024).toFixed(1)}MB</span>
							</div>
							<Progress value={(metrics.bundleSize / (10 * 1024 * 1024)) * 100} className="h-2" />
						</div>
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium">User Satisfaction</span>
								<span className="text-sm">{metrics.userSatisfactionScore.toFixed(1)}/5.0</span>
							</div>
							<Progress value={(metrics.userSatisfactionScore / 5) * 100} className="h-2" />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Real-time Metrics */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Activity className="h-5 w-5 mr-2" />
						Real-time Metrics
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{realtimeMetrics ? (
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm font-medium">Session Duration</p>
								<p className="text-2xl font-bold">{Math.floor(realtimeMetrics.sessionDuration / 60)}m</p>
							</div>
							<div>
								<p className="text-sm font-medium">Interactions/min</p>
								<p className="text-2xl font-bold">{realtimeMetrics.interactionsPerMinute.toFixed(1)}</p>
							</div>
							<div>
								<p className="text-sm font-medium">Response Time</p>
								<p className="text-2xl font-bold">{realtimeMetrics.currentResponseTime.toFixed(0)}ms</p>
							</div>
							<div>
								<p className="text-sm font-medium">Memory Usage</p>
								<p className="text-2xl font-bold">{(realtimeMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</p>
							</div>
						</div>
					) : (
						<div className="text-center text-muted-foreground py-4">
							<Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
							<p>Real-time data not available</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

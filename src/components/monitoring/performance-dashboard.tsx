/**
 * Real-time Performance Dashboard
 * Comprehensive monitoring dashboard for tools platform performance
 * Features real-time metrics, SC-011 compliance tracking, and interactive visualizations
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
	Info
} from 'lucide-react';

import {
	PerformanceMetrics,
	SC011ComplianceStatus,
	ComplianceAlert,
	UnifiedAnalyticsMetrics,
	RealtimeMetrics
} from '@/monitoring/types';

import { PerformanceCharts } from './performance-charts';
import { ComplianceTracker } from './compliance-tracker';
import { AlertPanel } from './alert-panel';
import { ToolPerformanceTable } from './tool-performance-table';
import { UserActivityHeatmap } from './user-activity-heatmap';
import { BundleSizeMonitor } from './bundle-size-monitor';
import { RealtimeDataStream } from './realtime-data-stream';

interface PerformanceDashboardProps {
	className?: string;
	initialMetrics?: PerformanceMetrics;
	autoRefresh?: boolean;
	refreshInterval?: number;
}

export function PerformanceDashboard({
	className,
	initialMetrics,
	autoRefresh = true,
	refreshInterval = 30000 // 30 seconds
}: PerformanceDashboardProps) {
	// State management
	const [metrics, setMetrics] = useState<PerformanceMetrics | null>(initialMetrics || null);
	const [complianceStatus, setComplianceStatus] = useState<SC011ComplianceStatus | null>(null);
	const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
	const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
	const [isLive, setIsLive] = useState(autoRefresh);
	const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
	const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
	const [isLoading, setIsLoading] = useState(false);
	const [notificationsEnabled, setNotificationsEnabled] = useState(true);
	const [selectedTab, setSelectedTab] = useState('overview');

	// Data fetching
	const fetchPerformanceData = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/performance/metrics?range=${selectedTimeRange}`);
			if (!response.ok) throw new Error('Failed to fetch performance metrics');

			const data = await response.json();
			setMetrics(data.metrics);
			setComplianceStatus(data.compliance);
			setAlerts(data.alerts);
			setRealtimeMetrics(data.realtime);
			setLastUpdate(new Date());
		} catch (error) {
			console.error('Failed to fetch performance data:', error);
			// TODO: Show error toast
		} finally {
			setIsLoading(false);
		}
	}, [selectedTimeRange]);

	// Auto-refresh effect
	useEffect(() => {
		if (!isLive) return;

		const interval = setInterval(fetchPerformanceData, refreshInterval);
		return () => clearInterval(interval);
	}, [isLive, refreshInterval, fetchPerformanceData]);

	// Initial data fetch
	useEffect(() => {
		fetchPerformanceData();
	}, [fetchPerformanceData]);

	// Memoized calculations
	const performanceScore = useMemo(() => {
		if (!metrics) return 0;

		const completionScore = (metrics.taskCompletionTime / 10000) * 40; // 40% weight
		const successScore = metrics.taskSuccessRate * 30; // 30% weight
		const speedScore = Math.max(0, (1 - metrics.pageLoadTime / 5000)) * 30; // 30% weight

		return Math.round(completionScore + successScore + speedScore);
	}, [metrics]);

	const healthStatus = useMemo(() => {
		if (!metrics) return 'unknown';
		if (performanceScore >= 90) return 'excellent';
		if (performanceScore >= 75) return 'good';
		if (performanceScore >= 60) return 'warning';
		return 'critical';
	}, [performanceScore]);

	const criticalAlerts = useMemo(() => {
		return alerts.filter(alert => alert.severity === 'critical' && !alert.resolved);
	}, [alerts]);

	// Render functions
	const renderOverviewTab = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{/* Performance Score */}
			<Card className="relative overflow-hidden">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Performance Score</CardTitle>
					<Activity className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{performanceScore}/100</div>
					<div className="flex items-center space-x-2 mt-2">
						<Progress value={performanceScore} className="flex-1" />
						<Badge variant={
							healthStatus === 'excellent' ? 'default' :
							healthStatus === 'good' ? 'secondary' :
							healthStatus === 'warning' ? 'destructive' : 'destructive'
						}>
							{healthStatus}
						</Badge>
					</div>
				</CardContent>
			</Card>

			{/* Task Completion Rate */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Task Completion</CardTitle>
					<Target className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{metrics ? `${(metrics.taskSuccessRate * 100).toFixed(1)}%` : '--'}
					</div>
					<p className="text-xs text-muted-foreground">
						{metrics ? `${metrics.totalTasksCompleted}/${metrics.totalTasksAttempted} tasks` : 'Loading...'}
					</p>
					{metrics?.taskSuccessRate && metrics.taskSuccessRate >= 0.9 ? (
						<div className="flex items-center text-green-600 text-xs mt-1">
							<TrendingUp className="h-3 w-3 mr-1" />
							Meet SC-011 target
						</div>
					) : metrics?.taskSuccessRate && metrics.taskSuccessRate < 0.9 ? (
						<div className="flex items-center text-red-600 text-xs mt-1">
							<TrendingDown className="h-3 w-3 mr-1" />
							Below SC-011 target
						</div>
					) : null}
				</CardContent>
			</Card>

			{/* Average Response Time */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
					<Timer className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{metrics ? `${metrics.averageResponseTime.toFixed(0)}ms` : '--'}
					</div>
					<p className="text-xs text-muted-foreground">
						{metrics ? `Page load: ${metrics.pageLoadTime.toFixed(0)}ms` : 'Loading...'}
					</p>
					{metrics && metrics.averageResponseTime <= 5000 ? (
						<div className="flex items-center text-green-600 text-xs mt-1">
							<CheckCircle className="h-3 w-3 mr-1" />
							Within target
						</div>
					) : metrics && metrics.averageResponseTime > 5000 ? (
						<div className="flex items-center text-orange-600 text-xs mt-1">
							<AlertTriangle className="h-3 w-3 mr-1" />
							Above target
						</div>
					) : null}
				</CardContent>
			</Card>

			{/* Active Users */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
					<Users className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{realtimeMetrics ? realtimeMetrics.currentSessionId.slice(-8) : '--'}
					</div>
					<p className="text-xs text-muted-foreground">
						{realtimeMetrics ? `${realtimeMetrics.totalInteractions} interactions` : 'Loading...'}
					</p>
					<div className="flex items-center text-blue-600 text-xs mt-1">
						<Activity className="h-3 w-3 mr-1" />
						Real-time tracking
					</div>
				</CardContent>
			</Card>

			{/* Critical Alerts */}
			<Card className="md:col-span-2 lg:col-span-4">
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<CardTitle className="text-sm font-medium">System Alerts</CardTitle>
					<div className="flex items-center space-x-2">
						{criticalAlerts.length > 0 && (
							<Badge variant="destructive" className="animate-pulse">
								{criticalAlerts.length} critical
							</Badge>
						)}
						<Button variant="outline" size="sm" onClick={fetchPerformanceData}>
							<RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
							Refresh
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{criticalAlerts.length > 0 ? (
						<div className="space-y-2">
							{criticalAlerts.slice(0, 3).map((alert) => (
								<Alert key={alert.id} className="border-red-200 bg-red-50">
									<AlertTriangle className="h-4 w-4 text-red-600" />
									<AlertTitle className="text-red-800">{alert.title}</AlertTitle>
									<AlertDescription className="text-red-700">
										{alert.description}
									</AlertDescription>
								</Alert>
							))}
							{criticalAlerts.length > 3 && (
								<p className="text-sm text-muted-foreground">
									... and {criticalAlerts.length - 3} more critical alerts
								</p>
							)}
						</div>
					) : (
						<div className="flex items-center text-green-600">
							<CheckCircle className="h-4 w-4 mr-2" />
							<span className="text-sm">No critical alerts</span>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);

	const renderComplianceTab = () => (
		<div className="space-y-6">
			{complianceStatus ? (
				<ComplianceTracker
					complianceStatus={complianceStatus}
					alerts={alerts}
					onUpdate={fetchPerformanceData}
				/>
			) : (
				<Card>
					<CardContent className="flex items-center justify-center h-32">
						<div className="text-center">
							<RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
							<p className="text-sm text-muted-foreground">Loading compliance data...</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);

	const renderAnalyticsTab = () => (
		<div className="space-y-6">
			{metrics ? (
				<PerformanceCharts
					metrics={metrics}
					realtimeMetrics={realtimeMetrics}
					timeRange={selectedTimeRange}
				/>
			) : (
				<Card>
					<CardContent className="flex items-center justify-center h-64">
						<div className="text-center">
							<RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
							<p className="text-sm text-muted-foreground">Loading analytics data...</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);

	const renderToolsTab = () => (
		<div className="space-y-6">
			{metrics ? (
				<ToolPerformanceTable metrics={metrics} />
			) : (
				<Card>
					<CardContent className="flex items-center justify-center h-64">
						<div className="text-center">
							<RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
							<p className="text-sm text-muted-foreground">Loading tool performance data...</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);

	const renderRealtimeTab = () => (
		<div className="space-y-6">
			<RealtimeDataStream
				metrics={realtimeMetrics}
				isLive={isLive}
				onToggleLive={() => setIsLive(!isLive)}
			/>
			<UserActivityHeatmap />
			<BundleSizeMonitor />
		</div>
	);

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Performance Dashboard</h2>
					<p className="text-muted-foreground">
						Real-time monitoring and SC-011 compliance tracking
					</p>
				</div>
				<div className="flex items-center space-x-4">
					{/* Time Range Selector */}
					<div className="flex items-center space-x-2">
						<Label htmlFor="time-range" className="text-sm">Time Range:</Label>
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

					{/* Notifications */}
					<Button
						variant="outline"
						size="sm"
						onClick={() => setNotificationsEnabled(!notificationsEnabled)}
					>
						{notificationsEnabled ? (
							<Bell className="h-4 w-4" />
						) : (
							<BellOff className="h-4 w-4" />
						)}
					</Button>

					{/* Export */}
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
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="overview" className="flex items-center space-x-2">
						<Monitor className="h-4 w-4" />
						<span>Overview</span>
					</TabsTrigger>
					<TabsTrigger value="compliance" className="flex items-center space-x-2">
						<Shield className="h-4 w-4" />
						<span>SC-011</span>
						{complianceStatus && !complianceStatus.compliant && (
							<Badge variant="destructive" className="ml-1 text-xs">!</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="analytics" className="flex items-center space-x-2">
						<BarChart3 className="h-4 w-4" />
						<span>Analytics</span>
					</TabsTrigger>
					<TabsTrigger value="tools" className="flex items-center space-x-2">
						<Database className="h-4 w-4" />
						<span>Tools</span>
					</TabsTrigger>
					<TabsTrigger value="realtime" className="flex items-center space-x-2">
						<Activity className="h-4 w-4" />
						<span>Real-time</span>
						{isLive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1" />}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					{renderOverviewTab()}
				</TabsContent>

				<TabsContent value="compliance" className="space-y-4">
					{renderComplianceTab()}
				</TabsContent>

				<TabsContent value="analytics" className="space-y-4">
					{renderAnalyticsTab()}
				</TabsContent>

				<TabsContent value="tools" className="space-y-4">
					{renderToolsTab()}
				</TabsContent>

				<TabsContent value="realtime" className="space-y-4">
					{renderRealtimeTab()}
				</TabsContent>
			</Tabs>

			{/* Alert Panel */}
			{alerts.length > 0 && (
				<AlertPanel
					alerts={alerts}
					onDismiss={(alertId) => {
						setAlerts(prev => prev.filter(a => a.id !== alertId));
					}}
				/>
			)}
		</div>
	);
}

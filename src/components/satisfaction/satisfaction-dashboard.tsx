/**
 * Satisfaction Dashboard Component
 * Comprehensive dashboard for monitoring user satisfaction and SC-006 compliance
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
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
	RadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	Radar
} from 'recharts';

import {
	TrendingUp,
	TrendingDown,
	Users,
	Target,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Star,
	Shield,
	Activity,
	BarChart3,
	PieChart as PieChartIcon,
	Download,
	Filter,
	RefreshCw,
	Eye,
	ThumbsUp,
	ThumbsDown,
	MessageSquare,
	Zap,
	Brain,
	Clock,
	Award,
	TrendingUpIcon,
	Settings,
	FileText,
	Lightbulb
} from 'lucide-react';

import type {
	SatisfactionAnalytics,
	SatisfactionMetrics,
	ToolSatisfactionData,
	CategorySatisfactionData,
	SC006ComplianceReport,
	SatisfactionAlert,
	SatisfactionGoal,
	SatisfactionTrend
} from '@/types/satisfaction';

interface SatisfactionDashboardProps {
	toolId?: string;
	category?: string;
	autoRefresh?: boolean;
	refreshInterval?: number;
	showFilters?: boolean;
	compact?: boolean;
}

const SATISFACTION_COLORS = {
	excellent: '#10b981', // green-500
	good: '#3b82f6',      // blue-500
	average: '#f59e0b',   // amber-500
	poor: '#ef4444',      // red-500
	target: '#8b5cf6'     // violet-500
};

const SC006_TARGET_SCORE = 4.5;

export function SatisfactionDashboard({
	toolId,
	category,
	autoRefresh = true,
	refreshInterval = 30000, // 30 seconds
	showFilters = true,
	compact = false
}: SatisfactionDashboardProps) {
	const [analytics, setAnalytics] = useState<SatisfactionAnalytics | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
	const [selectedTool, setSelectedTool] = useState<string>(toolId || 'all');
	const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all');
	const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
	const [refreshing, setRefreshing] = useState(false);

	// Load analytics data
	const loadAnalytics = useCallback(async () => {
		setLoading(true);
		try {
			const { satisfactionAnalyticsEngine } = await import('@/lib/satisfaction/analytics-engine');
			const filter = {
				toolIds: selectedTool !== 'all' ? [selectedTool] : undefined,
				categories: selectedCategory !== 'all' ? [selectedCategory] : undefined,
				dateRange: getDateRange(selectedTimeRange)
			};

			const data = await satisfactionAnalyticsEngine.generateAnalytics(filter);
			setAnalytics(data);
			setLastRefresh(new Date());
		} catch (error) {
			console.error('Failed to load satisfaction analytics:', error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [selectedTool, selectedCategory, selectedTimeRange]);

	// Auto-refresh
	useEffect(() => {
		loadAnalytics();

		if (autoRefresh) {
			const interval = setInterval(() => {
				loadAnalytics();
			}, refreshInterval);

			return () => clearInterval(interval);
		}
	}, [loadAnalytics, autoRefresh, refreshInterval]);

	// Manual refresh
	const handleRefresh = useCallback(() => {
		setRefreshing(true);
		loadAnalytics();
	}, [loadAnalytics]);

	// Get SC-006 compliance status
	const complianceStatus = useMemo(() => {
		if (!analytics) return null;

		const overallScore = analytics.summary.overallSatisfactionScore;
		const compliant = overallScore >= SC006_TARGET_SCORE;

		return {
			compliant,
			score: overallScore,
			target: SC006_TARGET_SCORE,
			gap: Math.max(0, SC006_TARGET_SCORE - overallScore),
			percentage: (overallScore / 5) * 100,
			compliancePercentage: analytics.compliance.complianceScore
		};
	}, [analytics]);

	// Get trend data for charts
	const trendData = useMemo(() => {
		if (!analytics) return [];

		return analytics.trends.map(trend => ({
			name: trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→',
			current: trend.current,
			previous: trend.previous,
			change: trend.percentageChange,
			direction: trend.direction
		}));
	}, [analytics]);

	// Get satisfaction distribution data
	const distributionData = useMemo(() => {
		if (!analytics) return [];

		const distribution = analytics.summary.satisfactionDistribution;
		return [
			{ name: '1 Star', value: distribution[1], color: '#ef4444' },
			{ name: '2 Stars', value: distribution[2], color: '#f87171' },
			{ name: '3 Stars', value: distribution[3], color: '#fbbf24' },
			{ name: '4 Stars', value: distribution[4], color: '#60a5fa' },
			{ name: '5 Stars', value: distribution[5], color: '#10b981' }
		];
	}, [analytics]);

	// Get category performance data
	const categoryData = useMemo(() => {
		if (!analytics) return [];

		return analytics.categories.map(cat => ({
			name: cat.category,
			satisfaction: cat.averageSatisfaction,
			target: SC006_TARGET_SCORE,
			compliant: cat.compliance.compliant,
			surveys: cat.totalSurveys
		}));
	}, [analytics]);

	if (loading && !analytics) {
		return (
			<div className="flex items-center justify-center h-96">
				<div className="flex items-center space-x-2">
					<RefreshCw className="h-6 w-6 animate-spin" />
					<span>Loading satisfaction analytics...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Star className="h-6 w-6 text-yellow-500" />
						User Satisfaction Dashboard
					</h2>
					<p className="text-muted-foreground">
						SC-006 Compliance Monitoring & Analytics
						{lastRefresh && (
							<span className="ml-2 text-xs">
								Last updated: {lastRefresh.toLocaleTimeString()}
							</span>
						)}
					</p>
				</div>

				<div className="flex items-center gap-2">
					{showFilters && (
						<>
							<Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="7d">Last 7 days</SelectItem>
									<SelectItem value="30d">Last 30 days</SelectItem>
									<SelectItem value="90d">Last 90 days</SelectItem>
									<SelectItem value="1y">Last year</SelectItem>
								</SelectContent>
							</Select>

							{!toolId && (
								<Select value={selectedTool} onValueChange={setSelectedTool}>
									<SelectTrigger className="w-48">
										<SelectValue placeholder="All tools" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All tools</SelectItem>
										{analytics?.tools.map(tool => (
											<SelectItem key={tool.toolId} value={tool.toolId}>
												{tool.toolName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</>
					)}

					<Button
						variant="outline"
						size="sm"
						onClick={handleRefresh}
						disabled={refreshing}
					>
						<RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
						Refresh
					</Button>
				</div>
			</div>

			{/* SC-006 Compliance Status */}
			{complianceStatus && (
				<Alert className={complianceStatus.compliant ? 'border-green-500' : 'border-red-500'}>
					<Shield className={`h-4 w-4 ${complianceStatus.compliant ? 'text-green-500' : 'text-red-500'}`} />
					<AlertTitle className="flex items-center justify-between">
						<span>SC-006 Compliance Status</span>
						<Badge variant={complianceStatus.compliant ? 'default' : 'destructive'}>
							{complianceStatus.compliant ? 'Compliant' : 'Non-Compliant'}
						</Badge>
					</AlertTitle>
					<AlertDescription>
						<div className="mt-2 space-y-2">
							<div className="flex items-center justify-between">
								<span>Overall Satisfaction Score:</span>
								<span className="font-semibold">{complianceStatus.score.toFixed(2)}/5.0</span>
							</div>
							<Progress
								value={complianceStatus.percentage}
								className="h-2"
							/>
							{!complianceStatus.compliant && (
								<div className="text-sm text-red-600">
									Gap to target: {complianceStatus.gap.toFixed(2)} points
								</div>
							)}
						</div>
					</AlertDescription>
				</Alert>
			)}

			{/* Key Metrics */}
			{analytics && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<MetricCard
						title="Overall Satisfaction"
						value={analytics.summary.overallSatisfactionScore.toFixed(2)}
						subtitle="/5.0"
						icon={Star}
						trend={analytics.summary.satisfactionTrend}
						color={getSatisfactionColor(analytics.summary.overallSatisfactionScore)}
					/>

					<MetricCard
						title="Net Promoter Score"
						value={analytics.summary.netPromoterScore.toFixed(0)}
						subtitle="NPS"
						icon={TrendingUp}
						trend="stable"
						color={getNPSColor(analytics.summary.netPromoterScore)}
					/>

					<MetricCard
						title="Completion Rate"
						value={`${(analytics.summary.completionRate * 100).toFixed(1)}%`}
						subtitle="Task completion"
						icon={Target}
						trend="stable"
						color={analytics.summary.completionRate > 0.8 ? 'text-green-500' : 'text-yellow-500'}
					/>

					<MetricCard
						title="Response Rate"
						value={`${(analytics.summary.responseRate * 100).toFixed(1)}%`}
						subtitle="Survey responses"
						icon={Users}
						trend="stable"
						color={analytics.summary.responseRate > 0.7 ? 'text-green-500' : 'text-yellow-500'}
					/>
				</div>
			)}

			{/* Main Dashboard Content */}
			{analytics && (
				<Tabs defaultValue="overview" className="space-y-4">
					<TabsList className="grid w-full grid-cols-6">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="tools">Tools</TabsTrigger>
						<TabsTrigger value="categories">Categories</TabsTrigger>
						<TabsTrigger value="trends">Trends</TabsTrigger>
						<TabsTrigger value="compliance">SC-006</TabsTrigger>
						<TabsTrigger value="alerts">Alerts</TabsTrigger>
					</TabsList>

					{/* Overview Tab */}
					<TabsContent value="overview" className="space-y-4">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Satisfaction Distribution */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<PieChartIcon className="h-5 w-5" />
										Satisfaction Distribution
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={300}>
										<PieChart>
											<Pie
												data={distributionData}
												cx="50%"
												cy="50%"
												outerRadius={80}
												dataKey="value"
												label={({ name, value }) => `${name}: ${value}`}
											>
												{distributionData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.color} />
												))}
											</Pie>
											<Tooltip />
										</PieChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>

							{/* Category Performance */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<BarChart3 className="h-5 w-5" />
										Category Performance
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={300}>
										<BarChart data={categoryData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="name" />
											<YAxis domain={[0, 5]} />
											<Tooltip />
											<Bar dataKey="satisfaction" fill="#3b82f6" />
											<Bar dataKey="target" fill="#8b5cf6" opacity={0.3} />
										</BarChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						</div>

						{/* Recent Alerts */}
						{analytics.alerts.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<AlertTriangle className="h-5 w-5 text-yellow-500" />
										Recent Alerts
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{analytics.alerts.slice(0, 5).map(alert => (
											<div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
												<div className="flex items-center gap-3">
													<AlertTriangle className={`h-4 w-4 ${
														alert.severity === 'critical' ? 'text-red-500' :
														alert.severity === 'error' ? 'text-red-400' :
														alert.severity === 'warning' ? 'text-yellow-500' :
														'text-blue-500'
													}`} />
													<div>
														<div className="font-medium">{alert.title}</div>
														<div className="text-sm text-muted-foreground">{alert.description}</div>
													</div>
												</div>
												<Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
													{alert.severity}
												</Badge>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					{/* Tools Tab */}
					<TabsContent value="tools" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Tool Performance</CardTitle>
								<CardDescription>
									Satisfaction scores and metrics for individual tools
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{analytics.tools.map(tool => (
										<ToolPerformanceCard key={tool.toolId} tool={tool} />
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Categories Tab */}
					<TabsContent value="categories" className="space-y-4">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{analytics.categories.map(category => (
								<CategoryPerformanceCard key={category.category} category={category} />
							))}
						</div>
					</TabsContent>

					{/* Trends Tab */}
					<TabsContent value="trends" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Satisfaction Trends</CardTitle>
								<CardDescription>
									Historical trends and patterns in user satisfaction
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={400}>
									<LineChart data={trendData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="name" />
										<YAxis domain={[0, 5]} />
										<Tooltip />
										<Legend />
										<Line
											type="monotone"
											dataKey="current"
											stroke="#3b82f6"
											strokeWidth={2}
											name="Current Score"
										/>
										<Line
											type="monotone"
											dataKey="previous"
											stroke="#10b981"
											strokeWidth={2}
											name="Previous Score"
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</TabsContent>

					{/* SC-006 Compliance Tab */}
					<TabsContent value="compliance" className="space-y-4">
						<SC006ComplianceView complianceReport={analytics.compliance} />
					</TabsContent>

					{/* Alerts Tab */}
					<TabsContent value="alerts" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Active Alerts</CardTitle>
								<CardDescription>
									{analytics.alerts.length} active alert{analytics.alerts.length !== 1 ? 's' : ''}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{analytics.alerts.map(alert => (
										<AlertCard key={alert.id} alert={alert} />
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}

// Helper Components
interface MetricCardProps {
	title: string;
	value: string;
	subtitle: string;
	icon: React.ComponentType<any>;
	trend: 'up' | 'down' | 'stable';
	color: string;
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, color }: MetricCardProps) {
	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium text-muted-foreground">{title}</p>
						<div className="flex items-baseline space-x-1">
							<h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
							<span className="text-sm text-muted-foreground">{subtitle}</span>
						</div>
					</div>
					<div className="flex flex-col items-center space-y-2">
						<Icon className={`h-8 w-8 ${color}`} />
						{trend !== 'stable' && (
							<div className={`flex items-center text-xs ${
								trend === 'up' ? 'text-green-500' : 'text-red-500'
							}`}>
								{trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

interface ToolPerformanceCardProps {
	tool: ToolSatisfactionData;
}

function ToolPerformanceCard({ tool }: ToolPerformanceCardProps) {
	const satisfactionColor = getSatisfactionColor(tool.averageSatisfaction);

	return (
		<div className="flex items-center justify-between p-4 border rounded-lg">
			<div className="flex-1">
				<div className="flex items-center gap-2">
					<h4 className="font-medium">{tool.toolName}</h4>
					<Badge variant={tool.sc006Compliant ? 'default' : 'destructive'}>
						{tool.sc006Compliant ? 'Compliant' : 'Non-Compliant'}
					</Badge>
				</div>
				<p className="text-sm text-muted-foreground">{tool.toolCategory}</p>
				<div className="flex items-center gap-4 mt-2 text-sm">
					<span className={satisfactionColor}>
						{tool.averageSatisfaction.toFixed(2)}/5.0
					</span>
					<span>{tool.totalSurveys} surveys</span>
					<span className="flex items-center gap-1">
						{tool.satisfactionTrend.direction === 'up' ? (
							<TrendingUp className="h-3 w-3 text-green-500" />
						) : tool.satisfactionTrend.direction === 'down' ? (
							<TrendingDown className="h-3 w-3 text-red-500" />
						) : null}
						{tool.satisfactionTrend.percentageChange.toFixed(1)}%
					</span>
				</div>
			</div>

			<div className="w-32">
				<Progress
					value={(tool.averageSatisfaction / 5) * 100}
					className="h-2"
				/>
			</div>
		</div>
	);
}

interface CategoryPerformanceCardProps {
	category: CategorySatisfactionData;
}

function CategoryPerformanceCard({ category }: CategoryPerformanceCardProps) {
	const satisfactionColor = getSatisfactionColor(category.averageSatisfaction);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>{category.category}</span>
					<Badge variant={category.compliance.compliant ? 'default' : 'destructive'}>
						{category.compliance.compliant ? 'Compliant' : 'Non-Compliant'}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Average Satisfaction</span>
						<span className={`font-semibold ${satisfactionColor}`}>
							{category.averageSatisfaction.toFixed(2)}/5.0
						</span>
					</div>

					<Progress value={(category.averageSatisfaction / 5) * 100} className="h-2" />

					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">Total Surveys:</span>
							<span className="ml-2 font-medium">{category.totalSurveys}</span>
						</div>
						<div>
							<span className="text-muted-foreground">Tools:</span>
							<span className="ml-2 font-medium">{category.tools.length}</span>
						</div>
					</div>

					{category.trend.direction !== 'stable' && (
						<div className="flex items-center gap-2 text-sm">
							{category.trend.direction === 'up' ? (
								<TrendingUp className="h-4 w-4 text-green-500" />
							) : (
								<TrendingDown className="h-4 w-4 text-red-500" />
							)}
							<span>{category.trend.percentageChange.toFixed(1)}% change</span>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

interface SC006ComplianceViewProps {
	complianceReport: SC006ComplianceReport;
}

function SC006ComplianceView({ complianceReport }: SC006ComplianceViewProps) {
	return (
		<div className="space-y-6">
			{/* Overall Compliance Status */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Overall SC-006 Compliance
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="text-center">
							<div className={`text-3xl font-bold ${
								complianceReport.compliant ? 'text-green-500' : 'text-red-500'
							}`}>
								{complianceReport.complianceScore.toFixed(1)}%
							</div>
							<p className="text-sm text-muted-foreground">Compliance Score</p>
						</div>
						<div className="text-center">
							<div className={`text-3xl font-bold ${
								complianceReport.compliant ? 'text-green-500' : 'text-red-500'
							}`}>
								{complianceReport.overallMetrics.overallSatisfactionScore.toFixed(2)}
							</div>
							<p className="text-sm text-muted-foreground">Current Score</p>
						</div>
						<div className="text-center">
							<div className="text-3xl font-bold text-purple-500">
								{complianceReport.targetScore}
							</div>
							<p className="text-sm text-muted-foreground">Target Score</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tool Compliance */}
			<Card>
				<CardHeader>
					<CardTitle>Tool Compliance Status</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{complianceReport.toolCompliance.map(tool => (
							<div key={tool.toolId} className="flex items-center justify-between p-3 border rounded">
								<div>
									<div className="font-medium">{tool.toolName}</div>
									<div className="text-sm text-muted-foreground">{tool.category}</div>
								</div>
								<div className="text-right">
									<div className={`font-semibold ${
										tool.compliant ? 'text-green-500' : 'text-red-500'
									}`}>
										{tool.satisfactionScore.toFixed(2)}/5.0
									</div>
									<div className="text-xs text-muted-foreground">
										{tool.sampleSize} surveys
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Issues and Actions */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Compliance Issues</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{complianceReport.issues.map(issue => (
								<div key={issue.id} className="p-3 border rounded-lg">
									<div className="flex items-center justify-between">
										<span className="font-medium">{issue.description}</span>
										<Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
											{issue.severity}
										</Badge>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Recommended Actions</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{complianceReport.recommendations.map(rec => (
								<div key={rec.id} className="p-3 border rounded-lg">
									<div className="font-medium">{rec.title}</div>
									<div className="text-sm text-muted-foreground mt-1">
										{rec.description}
									</div>
									<div className="flex items-center gap-2 mt-2">
										<Badge variant="outline">{rec.category}</Badge>
										<Badge variant="outline">{rec.effort} effort</Badge>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

interface AlertCardProps {
	alert: SatisfactionAlert;
}

function AlertCard({ alert }: AlertCardProps) {
	return (
		<div className={`p-4 border rounded-lg ${
			alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
			alert.severity === 'error' ? 'border-red-300 bg-red-50' :
			alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
			'border-blue-500 bg-blue-50'
		}`}>
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-3">
					<AlertTriangle className={`h-5 w-5 mt-0.5 ${
						alert.severity === 'critical' ? 'text-red-500' :
						alert.severity === 'error' ? 'text-red-400' :
						alert.severity === 'warning' ? 'text-yellow-500' :
						'text-blue-500'
					}`} />
					<div>
						<h4 className="font-medium">{alert.title}</h4>
						<p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
						<div className="flex items-center gap-2 mt-2">
							<Badge variant="outline">{alert.type}</Badge>
							<span className="text-xs text-muted-foreground">
								{alert.timestamp.toLocaleString()}
							</span>
						</div>
					</div>
				</div>

				{alert.actionRequired && (
					<Button size="sm" variant="outline">
						Action Required
					</Button>
				)}
			</div>
		</div>
	);
}

// Helper functions
function getSatisfactionColor(score: number): string {
	if (score >= 4.5) return 'text-green-500';
	if (score >= 4.0) return 'text-blue-500';
	if (score >= 3.0) return 'text-yellow-500';
	return 'text-red-500';
}

function getNPSColor(nps: number): string {
	if (nps >= 70) return 'text-green-500';
	if (nps >= 50) return 'text-yellow-500';
	if (nps >= 0) return 'text-orange-500';
	return 'text-red-500';
}

function getDateRange(range: string): { startDate: Date; endDate: Date } {
	const endDate = new Date();
	const startDate = new Date();

	switch (range) {
		case '7d':
			startDate.setDate(startDate.getDate() - 7);
			break;
		case '30d':
			startDate.setDate(startDate.getDate() - 30);
			break;
		case '90d':
			startDate.setDate(startDate.getDate() - 90);
			break;
		case '1y':
			startDate.setFullYear(startDate.getFullYear() - 1);
			break;
		default:
			startDate.setDate(startDate.getDate() - 30);
	}

	return { startDate, endDate };
}

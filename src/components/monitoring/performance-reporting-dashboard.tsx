/**
 * Performance Reporting Dashboard - T167 Implementation
 * Comprehensive performance reporting dashboard with advanced analytics and visualizations
 * Provides actionable insights, KPI tracking, and performance optimization guidance
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

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
	Upload,
	Calendar,
	Filter,
	Search,
	Target,
	Timer,
	Cpu,
	Wifi,
	Monitor,
	Database,
	AlertCircle,
	Info,
	ArrowUp,
	ArrowDown,
	Minus,
	Eye,
	Edit,
	Trash2,
	Plus,
	MoreHorizontal,
	ChevronRight,
	ChevronDown,
	Star,
	TrendingUpIcon,
	FileText,
	Share2,
	Print,
	Mail,
	Link,
	Bell,
	BellOff,
} from 'lucide-react';

// Import performance monitoring systems
import { performanceObserver } from '@/monitoring/performance-observer';
import { performanceBenchmarkingFramework } from '@/monitoring/performance-benchmarking-framework';
import { realtimePerformanceMonitor } from '@/monitoring/realtime-performance-monitor';
import { historicalPerformanceAnalyzer } from '@/monitoring/historical-performance-analyzer';
import { performanceOptimizationRecommendationEngine } from '@/monitoring/performance-optimization-recommendation-engine';

import type {
	BenchmarkResult,
	OptimizationRecommendation
} from '@/monitoring/performance-benchmarking-framework';
import type {
	RealtimeMetrics,
	RealtimeAlert
} from '@/monitoring/realtime-performance-monitor';
import type {
	HistoricalInsights,
	TrendAnalysis,
	HistoricalAnomaly
} from '@/monitoring/historical-performance-analyzer';
import type {
	OptimizationRecommendationExtended,
	RecommendationAnalysis
} from '@/monitoring/performance-optimization-recommendation-engine';

// Dashboard configuration interfaces
interface DashboardConfig {
	timeRange: '1h' | '6h' | '24h' | '7d' | '30d' | '90d';
	refreshInterval: number; // seconds
	autoRefresh: boolean;
	expandedSections: Set<string>;
	filters: DashboardFilters;
	views: Set<string>;
}

interface DashboardFilters {
	categories: Set<string>;
	priorities: Set<string>;
	statuses: Set<string>;
	metrics: Set<string>;
	searchTerm: string;
}

interface KPIMetric {
	id: string;
	name: string;
	value: number | string;
	unit?: string;
	target?: number;
	previous?: number;
	change?: number;
	changePercent?: number;
	trend?: 'up' | 'down' | 'stable';
	status: 'good' | 'warning' | 'critical' | 'unknown';
	description: string;
	icon?: React.ComponentType<any>;
}

interface ReportSection {
	id: string;
	title: string;
	description: string;
	type: 'kpi' | 'chart' | 'table' | 'list' | 'custom';
	data: any;
	config?: any;
	expanded: boolean;
	loading?: boolean;
	error?: string;
}

interface PerformanceReport {
	id: string;
	title: string;
	description: string;
	generatedAt: Date;
	timeRange: string;
	summary: ReportSummary;
	sections: ReportSection[];
	recommendations: OptimizationRecommendationExtended[];
	insights: string[];
}

interface ReportSummary {
	overallScore: number;
	performanceGrade: string;
	keyHighlights: string[];
	concerns: string[];
	trends: TrendAnalysis[];
}

export function PerformanceReportingDashboard({
	className,
}: {
	className?: string;
}) {
	// State management
	const [config, setConfig] = useState<DashboardConfig>({
		timeRange: '24h',
		refreshInterval: 60,
		autoRefresh: true,
		expandedSections: new Set(['overview', 'kpis']),
		filters: {
			categories: new Set(),
			priorities: new Set(),
			statuses: new Set(),
			metrics: new Set(),
			searchTerm: '',
		},
		views: new Set(['dashboard', 'recommendations']),
	});

	const [currentMetrics, setCurrentMetrics] = useState<RealtimeMetrics | null>(null);
	const [historicalInsights, setHistoricalInsights] = useState<HistoricalInsights | null>(null);
	const [recommendationAnalysis, setRecommendationAnalysis] = useState<RecommendationAnalysis | null>(null);
	const [activeAlerts, setActiveAlerts] = useState<RealtimeAlert[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

	// Report generation state
	const [isGeneratingReport, setIsGeneratingReport] = useState(false);
	const [currentReport, setCurrentReport] = useState<PerformanceReport | null>(null);
	const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);

	// Data fetching
	const fetchDashboardData = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			// Fetch real-time metrics
			const realtimeState = realtimePerformanceMonitor.getState();
			setCurrentMetrics(realtimeState.currentMetrics);
			setActiveAlerts(realtimeState.getActiveAlerts());

			// Fetch historical insights
			const insights = await historicalPerformanceAnalyzer.getCurrentInsights();
			setHistoricalInsights(insights);

			// Fetch recommendations
			const recommendations = await performanceOptimizationRecommendationEngine.getCurrentRecommendations();
			setRecommendationAnalysis({
				summary: {
					totalRecommendations: recommendations.length,
					newRecommendations: recommendations.filter(r =>
						(Date.now() - r.generatedAt.getTime()) < (24 * 60 * 60 * 1000)
					).length,
					updatedRecommendations: recommendations.filter(r => r.lastUpdated > r.generatedAt).length,
					completedRecommendations: recommendations.filter(r => r.status === 'completed').length,
					priorityDistribution: {
						critical: recommendations.filter(r => r.priority === 'critical').length,
						high: recommendations.filter(r => r.priority === 'high').length,
						medium: recommendations.filter(r => r.priority === 'medium').length,
						low: recommendations.filter(r => r.priority === 'low').length,
					},
					categoryDistribution: {
						performance: recommendations.filter(r => r.category === 'performance').length,
						'user-experience': recommendations.filter(r => r.category === 'user-experience').length,
						reliability: recommendations.filter(r => r.category === 'reliability').length,
					},
					estimatedTotalImpact: recommendations.reduce((sum, r) => sum + r.impactScore, 0),
					estimatedTotalEffort: recommendations.reduce((sum, r) => sum + r.effortScore, 0),
				},
				recommendations: recommendations.slice(0, 20), // Top 20
				trends: [], // Would be calculated
				conflicts: [], // Would be calculated
				roadmap: {
					quarterly: {
						quarters: [],
						forecast: {
							predictedPerformance: 0,
							confidenceInterval: [0, 0],
							keyRisks: [],
						},
					},
					milestoneTracking: {
						milestones: [],
						completionRate: 0,
						onTimeDeliveryRate: 0,
					},
				},
			});

			setLastUpdate(new Date());
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
		} finally {
			setLoading(false);
		}
	}, []);

	// Auto-refresh effect
	useEffect(() => {
		if (!config.autoRefresh) return;

		const interval = setInterval(fetchDashboardData, config.refreshInterval * 1000);
		return () => clearInterval(interval);
	}, [config.autoRefresh, config.refreshInterval, fetchDashboardData]);

	// Initial data fetch
	useEffect(() => {
		fetchDashboardData();
	}, [fetchDashboardData]);

	// Memoized KPI calculations
	const kpiMetrics = useMemo((): KPIMetric[] => {
		if (!currentMetrics || !historicalInsights) return [];

		const metrics = [
			{
				id: 'overall-score',
				name: 'Overall Performance Score',
				value: Math.round(historicalInsights.summary.overallPerformance.currentScore || 0),
				unit: '/100',
				target: 90,
				previous: historicalInsights.summary.overallPerformance.previousScore || 0,
				changePercent: historicalInsights.summary.overallPerformance.changePercent || 0,
				status: historicalInsights.summary.overallPerformance.currentScore >= 90 ? 'good' :
						historicalInsights.summary.overallPerformance.currentScore >= 75 ? 'warning' : 'critical',
				description: 'Combined performance score across all metrics',
				icon: BarChart3,
			},
			{
				id: 'lcp',
				name: 'Largest Contentful Paint',
				value: Math.round(currentMetrics.coreWebVitals.lcp),
				unit: 'ms',
				target: 2500,
				status: currentMetrics.coreWebVitals.lcp <= 2500 ? 'good' :
						currentMetrics.coreWebVitals.lcp <= 4000 ? 'warning' : 'critical',
				description: 'Time to load the largest content element',
				icon: Timer,
			},
			{
				id: 'fid',
				name: 'First Input Delay',
				value: Math.round(currentMetrics.coreWebVitals.fid),
				unit: 'ms',
				target: 100,
				status: currentMetrics.coreWebVitals.fid <= 100 ? 'good' :
						currentMetrics.coreWebVitals.fid <= 300 ? 'warning' : 'critical',
				description: 'Time from user input to browser response',
				icon: Zap,
			},
			{
				id: 'cls',
				name: 'Cumulative Layout Shift',
				value: currentMetrics.coreWebVitals.cls.toFixed(3),
				target: 0.1,
				status: currentMetrics.coreWebVitals.cls <= 0.1 ? 'good' :
						currentMetrics.coreWebVitals.cls <= 0.25 ? 'warning' : 'critical',
				description: 'Measure of visual stability',
				icon: Eye,
			},
			{
				id: 'task-completion',
				name: 'Task Completion Time',
				value: Math.round(currentMetrics.runtime.taskCompletionTime),
				unit: 'ms',
				target: 5000,
				status: currentMetrics.runtime.taskCompletionTime <= 5000 ? 'good' :
						currentMetrics.runtime.taskCompletionTime <= 8000 ? 'warning' : 'critical',
				description: 'Average time to complete user tasks',
				icon: Target,
			},
			{
				id: 'success-rate',
				name: 'Task Success Rate',
				value: Math.round(currentMetrics.runtime.taskSuccessRate * 100),
				unit: '%',
				target: 95,
				status: currentMetrics.runtime.taskSuccessRate >= 0.95 ? 'good' :
						currentMetrics.runtime.taskSuccessRate >= 0.90 ? 'warning' : 'critical',
				description: 'Percentage of tasks completed successfully',
				icon: CheckCircle,
			},
			{
				id: 'error-rate',
				name: 'Error Rate',
				value: Math.round(currentMetrics.network.errorRate * 100),
				unit: '%',
				target: 5,
				status: currentMetrics.network.errorRate <= 0.05 ? 'good' :
						currentMetrics.network.errorRate <= 0.1 ? 'warning' : 'critical',
				description: 'Percentage of operations that result in errors',
				icon: AlertTriangle,
			},
			{
				id: 'memory-usage',
				name: 'Memory Usage',
				value: Math.round(currentMetrics.runtime.memoryUsage),
				unit: 'MB',
				target: 50,
				status: currentMetrics.runtime.memoryUsage <= 50 ? 'good' :
						currentMetrics.runtime.memoryUsage <= 100 ? 'warning' : 'critical',
				description: 'Current memory usage of the application',
				icon: Cpu,
			},
		];

		return metrics;
	}, [currentMetrics, historicalInsights]);

	// Generate performance report
	const generatePerformanceReport = async (template?: ReportTemplate) => {
		setIsGeneratingReport(true);

		try {
			const report: PerformanceReport = {
				id: `report_${Date.now()}`,
				title: template?.title || 'Performance Analysis Report',
				description: template?.description || 'Comprehensive performance analysis and optimization recommendations',
				generatedAt: new Date(),
				timeRange: config.timeRange,
				summary: {
					overallScore: historicalInsights?.summary.overallPerformance.currentScore || 0,
					performanceGrade: getPerformanceGrade(historicalInsights?.summary.overallPerformance.currentScore || 0),
					keyHighlights: generateKeyHighlights(),
					concerns: generateConcerns(),
					trends: historicalInsights?.trends || [],
				},
				sections: generateReportSections(),
				recommendations: recommendationAnalysis?.recommendations || [],
				insights: generateInsights(),
			};

			setCurrentReport(report);
		} catch (err) {
			setError('Failed to generate performance report');
		} finally {
			setIsGeneratingReport(false);
		}
	};

	// Helper functions
	const getPerformanceGrade = (score: number): string => {
		if (score >= 95) return 'A+';
		if (score >= 90) return 'A';
		if (score >= 85) return 'A-';
		if (score >= 80) return 'B+';
		if (score >= 75) return 'B';
		if (score >= 70) return 'B-';
		if (score >= 65) return 'C+';
		if (score >= 60) return 'C';
		return 'D';
	};

	const generateKeyHighlights = (): string[] => {
		const highlights: string[] = [];

		if (kpiMetrics.length > 0) {
			const goodMetrics = kpiMetrics.filter(m => m.status === 'good');
			if (goodMetrics.length > 0) {
				highlights.push(`${goodMetrics.length} key metrics are performing within targets`);
			}

			const bestMetric = kpiMetrics.reduce((best, current) => {
				const bestScore = best.target ? best.previous / best.target : 0;
				const currentScore = current.target ? current.previous / current.target : 0;
				return currentScore > bestScore ? current : best;
			});

			highlights.push(`${bestMetric.name} is performing ${bestScore > 1 ? 'well' : 'excellently'} at ${bestMetric.value}${bestMetric.unit}`);
		}

		if (recommendationAnalysis) {
			const completedCount = recommendationAnalysis.summary.completedRecommendations;
			if (completedCount > 0) {
				highlights.push(`${completedCount} recommendations have been successfully implemented`);
			}
		}

		return highlights;
	};

	const generateConcerns = (): string[] => {
		const concerns: string[] = [];

		if (kpiMetrics.length > 0) {
			const criticalMetrics = kpiMetrics.filter(m => m.status === 'critical');
			if (criticalMetrics.length > 0) {
				concerns.push(`${criticalMetrics.length} metrics require immediate attention`);
				criticalMetrics.forEach(m => {
					concerns.push(`${m.name} is at ${m.value}${m.unit || ''} (target: ${m.target}${m.unit || ''})`);
				});
			}

			const warningMetrics = kpiMetrics.filter(m => m.status === 'warning');
			if (warningMetrics.length > 0) {
				concerns.push(`${warningMetrics.length} metrics show performance degradation`);
			}
		}

		if (activeAlerts.length > 0) {
			concerns.push(`${activeAlerts.length} active alerts require investigation`);
		}

		return concerns;
	};

	const generateReportSections = (): ReportSection[] => {
		const sections: ReportSection[] = [];

		// Executive Summary
		sections.push({
			id: 'executive-summary',
			title: 'Executive Summary',
			description: 'High-level performance overview and key insights',
			type: 'kpi',
			data: kpiMetrics,
			expanded: true,
		});

		// Performance Metrics
		sections.push({
			id: 'performance-metrics',
			title: 'Detailed Performance Metrics',
			description: 'Comprehensive breakdown of all performance indicators',
			type: 'table',
			data: kpiMetrics,
			expanded: false,
		});

		// Trends Analysis
		if (historicalInsights?.trends.length > 0) {
			sections.push({
				id: 'trends-analysis',
				title: 'Trends Analysis',
				description: 'Performance trends and patterns over time',
				type: 'custom',
				data: historicalInsights.trends,
				expanded: false,
			});
		}

		// Alerts and Issues
		if (activeAlerts.length > 0) {
			sections.push({
				id: 'alerts-issues',
				title: 'Active Alerts and Issues',
				description: 'Current performance alerts and system issues',
				type: 'list',
				data: activeAlerts,
				expanded: false,
			});
		}

		// Recommendations
		if (recommendationAnalysis?.recommendations.length > 0) {
			sections.push({
				id: 'recommendations',
				title: 'Optimization Recommendations',
				description: 'Actionable recommendations for performance improvement',
				type: 'list',
				data: recommendationAnalysis.recommendations,
				expanded: false,
			});
		}

		return sections;
	};

	const generateInsights = (): string[] => {
		const insights: string[] = [];

		// Performance insights
		if (historicalInsights?.trends.length > 0) {
			const improvingTrends = historicalInsights.trends.filter(t =>
				t.trend === 'improving' || t.trend === 'strongly_improving'
			);

			if (improvingTrends.length > 0) {
				insights.push(`${improvingTrends.length} metrics show improving trends`);
			}

			const decliningTrends = historicalInsights.trends.filter(t =>
				t.trend === 'declining' || t.trend === 'strongly_declining'
			);

			if (decliningTrends.length > 0) {
				insights.push(`${decliningTrends.length} metrics show declining trends that require attention`);
			}
		}

		// Recommendation insights
		if (recommendationAnalysis) {
			const highPriorityRecs = recommendationAnalysis.recommendations.filter(r =>
				r.priority === 'critical' || r.priority === 'high'
			);

			if (highPriorityRecs.length > 0) {
				insights.push(`${highPriorityRecs.length} high-priority recommendations could improve performance by ${highPriorityRecs.reduce((sum, r) => sum + r.impactScore, 0)} points`);
			}
		}

		return insights;
	};

	// Toggle section expansion
	const toggleSection = (sectionId: string) => {
		setConfig(prev => {
			const newExpanded = new Set(prev.expandedSections);
			if (newExpanded.has(sectionId)) {
				newExpanded.delete(sectionId);
			} else {
				newExpanded.add(sectionId);
			}
			return { ...prev, expandedSections: newExpanded };
		});
	};

	// Render functions
	const renderKPIMetric = (metric: KPIMetric) => {
		const IconComponent = metric.icon || BarChart3;

		return (
			<Card key={metric.id} className="relative">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
					<IconComponent className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{metric.value}
						{metric.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>}
					</div>
					<p className="text-xs text-muted-foreground mt-1">{metric.description}</p>

					{metric.target && (
						<div className="mt-2">
							<Progress
								value={Math.min(100, (Number(metric.value) / metric.target) * 100)}
								className="h-1"
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Target: {metric.target}{metric.unit}
							</p>
						</div>
					)}

					<div className="flex items-center mt-2">
						<Badge variant={
							metric.status === 'good' ? 'default' :
							metric.status === 'warning' ? 'secondary' : 'destructive'
						}>
							{metric.status}
						</Badge>

						{metric.changePercent !== undefined && (
							<div className="flex items-center ml-2 text-xs">
								{metric.changePercent > 0 ? (
									<ArrowUp className="h-3 w-3 text-red-500 mr-1" />
								) : metric.changePercent < 0 ? (
									<ArrowDown className="h-3 w-3 text-green-500 mr-1" />
								) : (
									<Minus className="h-3 w-3 text-gray-500 mr-1" />
								)}
								<span className={
									metric.changePercent > 0 ? 'text-red-500' :
									metric.changePercent < 0 ? 'text-green-500' : 'text-gray-500'
								}>
									{Math.abs(metric.changePercent).toFixed(1)}%
								</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	};

	const renderRecommendationCard = (rec: OptimizationRecommendationExtended) => {
		return (
			<Card key={rec.id} className="mb-4">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<CardTitle className="text-lg flex items-center gap-2">
								{rec.title}
								<Badge variant={
									rec.priority === 'critical' ? 'destructive' :
									rec.priority === 'high' ? 'default' :
									rec.priority === 'medium' ? 'secondary' : 'outline'
								}>
									{rec.priority}
								</Badge>
							</CardTitle>
							<CardDescription className="mt-1">{rec.description}</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="outline">{rec.category}</Badge>
							<div className="text-sm text-muted-foreground">
								Score: {rec.priorityScore}
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					<div className="grid grid-cols-2 gap-4 mb-4">
						<div>
							<div className="text-sm text-muted-foreground">Impact</div>
							<Progress value={rec.impactScore} className="mt-1" />
							<div className="text-xs text-muted-foreground mt-1">{rec.impactScore}/100</div>
						</div>
						<div>
							<div className="text-sm text-muted-foreground">Effort</div>
							<Progress value={rec.effortScore} className="mt-1" />
							<div className="text-xs text-muted-foreground mt-1">{rec.effortScore}/100</div>
						</div>
					</div>

					<div className="text-sm">
						<span className="font-medium">Implementation:</span> {rec.implementation.timeEstimate} • {rec.implementation.difficulty}
					</div>

					<div className="flex items-center gap-2 mt-3">
						<Button variant="outline" size="sm">
							View Details
						</Button>
						<Button variant="outline" size="sm">
							<Edit className="h-4 w-4 mr-1" />
							Edit
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	};

	const renderAlertCard = (alert: RealtimeAlert) => {
		return (
			<Card key={alert.id} className="border-l-4 border-l-red-500">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-red-500" />
							{alert.metric} Alert
							<Badge variant={
								alert.type === 'critical' ? 'destructive' :
								alert.type === 'warning' ? 'default' : 'secondary'
							}>
								{alert.type}
							</Badge>
						</CardTitle>
						<div className="text-sm text-muted-foreground">
							{alert.timestamp.toLocaleTimeString()}
						</div>
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					<p className="text-sm mb-3">{alert.description}</p>

					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">Current:</span> {alert.currentValue}
						</div>
						<div>
							<span className="text-muted-foreground">Threshold:</span> {alert.thresholdValue}
						</div>
					</div>

					<div className="mt-3">
						<div className="text-sm font-medium mb-1">Impact:</div>
						<p className="text-sm text-muted-foreground">{alert.impact}</p>
					</div>

					<div className="flex items-center gap-2 mt-3">
						<Button variant="outline" size="sm">
							Investigate
						</Button>
						<Button variant="outline" size="sm">
							Resolve
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	};

	if (loading && !currentMetrics) {
		return (
			<div className={`space-y-6 ${className}`}>
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
						<p className="text-lg font-medium">Loading Performance Dashboard...</p>
						<p className="text-sm text-muted-foreground">Please wait while we gather performance data</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={`space-y-6 ${className}`}>
				<Card className="border-red-200 bg-red-50">
					<CardContent className="flex items-center justify-center h-64">
						<div className="text-center">
							<AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
							<p className="text-lg font-medium text-red-800">Error Loading Dashboard</p>
							<p className="text-sm text-red-600 mb-4">{error}</p>
							<Button onClick={fetchDashboardData}>
								<RefreshCw className="h-4 w-4 mr-2" />
								Try Again
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Performance Reporting Dashboard</h1>
					<p className="text-muted-foreground">
						Comprehensive performance monitoring, analysis, and optimization recommendations
					</p>
				</div>

				<div className="flex items-center gap-4">
					{/* Time Range Selector */}
					<Select value={config.timeRange} onValueChange={(value: any) => setConfig(prev => ({ ...prev, timeRange: value }))}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1h">Last Hour</SelectItem>
							<SelectItem value="6h">Last 6 Hours</SelectItem>
							<SelectItem value="24h">Last 24 Hours</SelectItem>
							<SelectItem value="7d">Last 7 Days</SelectItem>
							<SelectItem value="30d">Last 30 Days</SelectItem>
							<SelectItem value="90d">Last 90 Days</SelectItem>
						</SelectContent>
					</Select>

					{/* Auto-refresh Toggle */}
					<div className="flex items-center gap-2">
						<Switch
							checked={config.autoRefresh}
							onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoRefresh: checked }))}
						/>
						<Label className="text-sm">Auto-refresh</Label>
					</div>

					{/* Refresh Button */}
					<Button onClick={fetchDashboardData} disabled={loading}>
						<RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
						Refresh
					</Button>

					{/* Generate Report Button */}
					<Button onClick={() => generatePerformanceReport()} disabled={isGeneratingReport}>
						<FileText className="h-4 w-4 mr-2" />
						{isGeneratingReport ? 'Generating...' : 'Generate Report'}
					</Button>
				</div>
			</div>

			{/* Last Update */}
			<div className="flex items-center text-sm text-muted-foreground">
				<Clock className="h-4 w-4 mr-1" />
				Last updated: {lastUpdate.toLocaleString()}
				{config.autoRefresh && <span className="ml-2 text-green-600">(Live)</span>}
			</div>

			{/* Main Dashboard Content */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="metrics">Metrics</TabsTrigger>
					<TabsTrigger value="recommendations">
						Recommendations
						{recommendationAnalysis && recommendationAnalysis.summary.newRecommendations > 0 && (
							<Badge variant="destructive" className="ml-2 text-xs">
								{recommendationAnalysis.summary.newRecommendations}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="alerts">
						Alerts
						{activeAlerts.length > 0 && (
							<Badge variant="destructive" className="ml-2 text-xs">
								{activeAlerts.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="reports">Reports</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					{/* KPI Overview */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{kpiMetrics.slice(0, 8).map(renderKPIMetric)}
					</div>

					{/* Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Performance Score</CardTitle>
								<BarChart3 className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{historicalInsights?.summary.overallPerformance.currentScore || 0}/100
								</div>
								<p className="text-xs text-muted-foreground">
									Grade: {getPerformanceGrade(historicalInsights?.summary.overallPerformance.currentScore || 0)}
								</p>
								{historicalInsights && (
									<div className={`text-xs mt-1 ${
										historicalInsights.summary.overallPerformance.changePercent > 0
											? 'text-green-600'
											: historicalInsights.summary.overallPerformance.changePercent < 0
											? 'text-red-600'
											: 'text-gray-600'
									}`}>
										{historicalInsights.summary.overallPerformance.changePercent > 0 && '+'}
										{historicalInsights.summary.overallPerformance.changePercent.toFixed(1)}% from previous
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Active Recommendations</CardTitle>
								<TrendingUp className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{recommendationAnalysis?.summary.totalRecommendations || 0}
								</div>
								<p className="text-xs text-muted-foreground">
									{recommendationAnalysis?.summary.newRecommendations || 0} new this week
								</p>
								<div className="text-xs text-muted-foreground mt-1">
									{recommendationAnalysis?.summary.completedRecommendations || 0} completed
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">System Health</CardTitle>
								<Shield className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{activeAlerts.length === 0 ? 'Healthy' :
									 activeAlerts.filter(a => a.type === 'critical').length > 0 ? 'Critical' : 'Warning'}
								</div>
								<p className="text-xs text-muted-foreground">
									{activeAlerts.length} active alerts
								</p>
								<div className={`text-xs mt-1 ${
									activeAlerts.length === 0 ? 'text-green-600' :
									activeAlerts.filter(a => a.type === 'critical').length > 0 ? 'text-red-600' : 'text-yellow-600'
								}`}>
									{activeAlerts.filter(a => a.type === 'critical').length} critical issues
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Recent Activity */}
					<Card>
						<CardHeader>
							<CardTitle>Recent Activity</CardTitle>
							<CardDescription>Latest performance events and recommendations</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-64">
								<div className="space-y-4">
									{recommendationAnalysis?.recommendations.slice(0, 3).map(renderRecommendationCard)}
									{activeAlerts.slice(0, 2).map(renderAlertCard)}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="metrics" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{kpiMetrics.map(renderKPIMetric)}
					</div>

					{/* Detailed Metrics Table */}
					<Card>
						<CardHeader>
							<CardTitle>Detailed Metrics Analysis</CardTitle>
							<CardDescription>Comprehensive breakdown of all performance indicators</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="relative overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b">
											<th className="text-left p-2">Metric</th>
											<th className="text-left p-2">Current</th>
											<th className="text-left p-2">Target</th>
											<th className="text-left p-2">Status</th>
											<th className="text-left p-2">Change</th>
											<th className="text-left p-2">Progress</th>
										</tr>
									</thead>
									<tbody>
										{kpiMetrics.map((metric) => (
											<tr key={metric.id} className="border-b">
												<td className="p-2 font-medium">{metric.name}</td>
												<td className="p-2">{metric.value}{metric.unit}</td>
												<td className="p-2">{metric.target}{metric.unit}</td>
												<td className="p-2">
													<Badge variant={
														metric.status === 'good' ? 'default' :
														metric.status === 'warning' ? 'secondary' : 'destructive'
													}>
														{metric.status}
													</Badge>
												</td>
												<td className="p-2">
													{metric.changePercent !== undefined && (
														<div className="flex items-center">
															{metric.changePercent > 0 ? (
																<ArrowUp className="h-3 w-3 text-red-500 mr-1" />
															) : metric.changePercent < 0 ? (
																<ArrowDown className="h-3 w-3 text-green-500 mr-1" />
															) : (
																<Minus className="h-3 w-3 text-gray-500 mr-1" />
															)}
															<span className={
																metric.changePercent > 0 ? 'text-red-500' :
																metric.changePercent < 0 ? 'text-green-500' : 'text-gray-500'
															}>
																{Math.abs(metric.changePercent).toFixed(1)}%
															</span>
														</div>
													)}
												</td>
												<td className="p-2">
													{metric.target && (
														<Progress
															value={Math.min(100, (Number(metric.value) / metric.target) * 100)}
															className="h-2 w-24"
														/>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="recommendations" className="space-y-4">
					{/* Recommendations Summary */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Total</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{recommendationAnalysis?.summary.totalRecommendations || 0}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Critical</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									{recommendationAnalysis?.summary.priorityDistribution.critical || 0}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">High Priority</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-orange-600">
									{recommendationAnalysis?.summary.priorityDistribution.high || 0}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Completed</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-600">
									{recommendationAnalysis?.summary.completedRecommendations || 0}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Recommendations List */}
					<Card>
						<CardHeader>
							<CardTitle>Optimization Recommendations</CardTitle>
							<CardDescription>Actionable recommendations to improve performance</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-96">
								<div className="space-y-4">
									{recommendationAnalysis?.recommendations.map(renderRecommendationCard)}
									{(!recommendationAnalysis || recommendationAnalysis.recommendations.length === 0) && (
										<div className="text-center py-8">
											<CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
											<p className="text-lg font-medium">No Recommendations Available</p>
											<p className="text-sm text-muted-foreground">
												Your system is performing well within targets
											</p>
										</div>
									)}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="alerts" className="space-y-4">
					{/* Alerts Summary */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Critical</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									{activeAlerts.filter(a => a.type === 'critical').length}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Warning</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-yellow-600">
									{activeAlerts.filter(a => a.type === 'warning').length}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Info</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-blue-600">
									{activeAlerts.filter(a => a.type === 'info').length}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Alerts List */}
					<Card>
						<CardHeader>
							<CardTitle>Active Alerts</CardTitle>
							<CardDescription>Current performance alerts and issues requiring attention</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-96">
								<div className="space-y-4">
									{activeAlerts.map(renderAlertCard)}
									{activeAlerts.length === 0 && (
										<div className="text-center py-8">
											<CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
											<p className="text-lg font-medium">No Active Alerts</p>
											<p className="text-sm text-muted-foreground">
												All systems are operating normally
											</p>
										</div>
									)}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="reports" className="space-y-4">
					{/* Report Generation */}
					<Card>
						<CardHeader>
							<CardTitle>Performance Reports</CardTitle>
							<CardDescription>Generate and manage comprehensive performance analysis reports</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center gap-4">
									<Button onClick={() => generatePerformanceReport()} disabled={isGeneratingReport}>
										<FileText className="h-4 w-4 mr-2" />
										{isGeneratingReport ? 'Generating...' : 'Generate New Report'}
									</Button>
									<Button variant="outline">
										<Upload className="h-4 w-4 mr-2" />
										Import Template
									</Button>
									<Button variant="outline">
										<Settings className="h-4 w-4 mr-2" />
										Configure Templates
									</Button>
								</div>

								{/* Current Report Display */}
								{currentReport && (
									<Card className="border-l-4 border-l-blue-500">
										<CardHeader>
											<div className="flex items-center justify-between">
												<div>
													<CardTitle className="text-lg">{currentReport.title}</CardTitle>
													<CardDescription>
														Generated: {currentReport.generatedAt.toLocaleString()} •
														Time Range: {currentReport.timeRange} •
														Grade: {currentReport.summary.performanceGrade}
													</CardDescription>
												</div>
												<div className="flex items-center gap-2">
													<Button variant="outline" size="sm">
														<Download className="h-4 w-4 mr-2" />
														Download
													</Button>
													<Button variant="outline" size="sm">
														<Share2 className="h-4 w-4 mr-2" />
														Share
													</Button>
													<Button variant="outline" size="sm">
														<Mail className="h-4 w-4 mr-2" />
														Email
													</Button>
												</div>
											</div>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												<div>
													<h4 className="font-medium mb-2">Key Highlights</h4>
													<ul className="text-sm space-y-1">
														{currentReport.summary.keyHighlights.map((highlight, index) => (
															<li key={index} className="flex items-center">
																<CheckCircle className="h-3 w-3 text-green-500 mr-2" />
																{highlight}
															</li>
														))}
													</ul>
												</div>

												{currentReport.summary.concerns.length > 0 && (
													<div>
														<h4 className="font-medium mb-2">Areas of Concern</h4>
														<ul className="text-sm space-y-1">
															{currentReport.summary.concerns.map((concern, index) => (
																<li key={index} className="flex items-center">
																	<AlertTriangle className="h-3 w-3 text-yellow-500 mr-2" />
																	{concern}
																</li>
															))}
														</ul>
													</div>
												)}

												<div>
													<h4 className="font-medium mb-2">Top Recommendations</h4>
													<div className="space-y-2">
														{currentReport.recommendations.slice(0, 3).map((rec) => (
															<div key={rec.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
																<div>
																	<span className="font-medium">{rec.title}</span>
																	<span className="text-muted-foreground ml-2">
																		({rec.priority} • {rec.impact.score} impact)
																	</span>
																</div>
																<Button variant="ghost" size="sm">
																	<ChevronRight className="h-4 w-4" />
																</Button>
															</div>
														))}
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								)}

								{/* Report History */}
								{!currentReport && (
									<div className="text-center py-8">
										<FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
										<p className="text-lg font-medium">No Reports Generated</p>
										<p className="text-sm text-muted-foreground">
											Generate your first performance report to get started
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

// Additional type definitions
interface ReportTemplate {
	id: string;
	title: string;
	description: string;
	sections: string[];
	filters: DashboardFilters;
	schedule?: string;
	recipients?: string[];
}

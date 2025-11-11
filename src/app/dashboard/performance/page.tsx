/**
 * Performance Dashboard Page
 * Real-time performance monitoring and SC-011 compliance tracking
 * Comprehensive dashboard for monitoring the tools platform
 */

import { Metadata } from 'next';
import { PerformanceDashboard } from '@/components/monitoring/performance-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Activity,
	Shield,
	TrendingUp,
	AlertTriangle,
	Users,
	Zap,
	Monitor
} from 'lucide-react';

export const metadata: Metadata = {
	title: 'Performance Dashboard | Parsify.dev',
	description: 'Real-time monitoring and SC-011 compliance tracking for the developer tools platform',
	keywords: ['performance', 'monitoring', 'analytics', 'SC-011', 'compliance', 'dashboard'],
	robots: 'noindex, nofollow', // Internal monitoring dashboard
};

// Mock initial metrics - in production, this would come from your monitoring system
const initialMetrics = {
	taskCompletionTime: 4500,
	taskSuccessRate: 0.89,
	totalTasksCompleted: 1250,
	totalTasksAttempted: 1400,
	pageLoadTime: 1800,
	firstContentfulPaint: 1200,
	largestContentfulPaint: 2500,
	cumulativeLayoutShift: 0.15,
	firstInputDelay: 80,
	bundleSize: 2.8 * 1024 * 1024, // 2.8MB
	totalResourcesSize: 4.2 * 1024 * 1024, // 4.2MB
	resourceLoadTimes: [450, 320, 680, 290, 510, 380, 420],
	averageResponseTime: 650,
	errorRate: 0.11,
	userSatisfactionScore: 4.1,
	timestamp: new Date(),
	sessionId: 'session_' + Math.random().toString(36).substr(2, 9),
};

export default function PerformanceDashboardPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="border-b">
				<div className="container mx-auto px-4 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
							<p className="text-muted-foreground">
								Real-time monitoring and SC-011 compliance tracking
							</p>
						</div>
						<div className="flex items-center space-x-4">
							<Badge variant="outline" className="flex items-center">
								<Activity className="h-3 w-3 mr-1" />
								Live Monitoring
							</Badge>
							<Badge variant="secondary" className="flex items-center">
								<Shield className="h-3 w-3 mr-1" />
								SC-011 Tracking
							</Badge>
						</div>
					</div>
				</div>
			</div>

			{/* Quick Stats Bar */}
			<div className="border-b bg-muted/30">
				<div className="container mx-auto px-4 py-4">
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
						<div className="flex items-center space-x-3">
							<div className="p-2 bg-blue-100 rounded-lg">
								<Monitor className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<p className="text-sm font-medium">58 Tools</p>
								<p className="text-xs text-muted-foreground">Total tools</p>
							</div>
						</div>
						<div className="flex items-center space-x-3">
							<div className="p-2 bg-green-100 rounded-lg">
								<Users className="h-5 w-5 text-green-600" />
							</div>
							<div>
								<p className="text-sm font-medium">1.2K Users</p>
								<p className="text-xs text-muted-foreground">Active today</p>
							</div>
						</div>
						<div className="flex items-center space-x-3">
							<div className="p-2 bg-yellow-100 rounded-lg">
								<TrendingUp className="h-5 w-5 text-yellow-600" />
							</div>
							<div>
								<p className="text-sm font-medium">89%</p>
								<p className="text-xs text-muted-foreground">Task completion</p>
							</div>
						</div>
						<div className="flex items-center space-x-3">
							<div className="p-2 bg-purple-100 rounded-lg">
								<Zap className="h-5 w-5 text-purple-600" />
							</div>
							<div>
								<p className="text-sm font-medium">650ms</p>
								<p className="text-xs text-muted-foreground">Avg response</p>
							</div>
						</div>
						<div className="flex items-center space-x-3">
							<div className="p-2 bg-red-100 rounded-lg">
								<AlertTriangle className="h-5 w-5 text-red-600" />
							</div>
							<div>
								<p className="text-sm font-medium">3</p>
								<p className="text-xs text-muted-foreground">Critical alerts</p>
							</div>
						</div>
						<div className="flex items-center space-x-3">
							<div className="p-2 bg-green-100 rounded-lg">
								<Shield className="h-5 w-5 text-green-600" />
							</div>
							<div>
								<p className="text-sm font-medium">87/100</p>
								<p className="text-xs text-muted-foreground">Compliance score</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Dashboard */}
			<div className="container mx-auto px-4 py-6">
				<PerformanceDashboard
					initialMetrics={initialMetrics}
					autoRefresh={true}
					refreshInterval={30000} // 30 seconds
				/>
			</div>

			{/* Footer */}
			<div className="border-t mt-12">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between text-sm text-muted-foreground">
						<p>
							Performance Dashboard - Real-time monitoring and analytics
						</p>
						<p>
							Last updated: {new Date().toLocaleString()}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

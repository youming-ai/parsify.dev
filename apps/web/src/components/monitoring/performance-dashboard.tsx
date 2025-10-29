/**
 * 性能监控仪表板组件
 * 实时显示系统性能指标和告警
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Activity,
	AlertTriangle,
	BarChart2,
	BatteryCharging,
	Clock,
	Cpu,
	Database,
	LineChart,
	type LucideIcon,
	Shield,
	Timer,
	Zap,
} from 'lucide-react';
import React from 'react';
import { useEffect, useState } from 'react';

interface PerformanceMetric {
	name: string;
	value: string | number;
	unit: string;
	trend: 'up' | 'down' | 'stable';
	icon: LucideIcon;
	status: 'normal' | 'warning' | 'critical';
}

interface PerformanceAlert {
	id: string;
	title: string;
	message: string;
	severity: 'info' | 'warning' | 'critical';
	timestamp: string;
	resolved: boolean;
	resolvedAt?: string;
}

export const PerformanceDashboard: React.FC = () => {
	const [metrics, _setMetrics] = useState<PerformanceMetric[]>([
		{
			name: '响应时间',
			value: '242ms',
			unit: 'ms',
			trend: 'stable',
			icon: Timer,
			status: 'normal',
		},
		{
			name: '错误率',
			value: '0.8%',
			unit: '%',
			trend: 'up',
			icon: AlertTriangle,
			status: 'normal',
		},
		{
			name: '缓存命中率',
			value: '94%',
			unit: '%',
			trend: 'stable',
			icon: Database,
			status: 'normal',
		},
		{
			name: '活跃连接',
			value: '42',
			unit: '',
			trend: 'down',
			icon: Activity,
			status: 'warning',
		},
		{
			name: '内存使用',
			value: '64MB',
			unit: 'MB',
			trend: 'up',
			icon: Cpu,
			status: 'normal',
		},
		{
			name: 'CPU 使用',
			value: '12%',
			unit: '%',
			trend: 'stable',
			icon: BatteryCharging,
			status: 'normal',
		},
	]);

	const [alerts, _setAlerts] = useState<PerformanceAlert[]>([
		{
			id: '1',
			title: '响应时间异常',
			message: '过去5分钟平均响应时间超过500ms',
			severity: 'warning',
			timestamp: '2024-01-15T14:30:00',
			resolved: false,
		},
		{
			id: '2',
			title: '高错误率',
			message: '错误率达到8%，超过警戒线',
			severity: 'critical',
			timestamp: '2024-01-15T14:25:00',
			resolved: false,
		},
	]);

	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// 模拟从 API 获取数据
		const fetchMetrics = async () => {
			// 这里应该调用实际的 API
			setIsLoading(false);
		};

		// 每10秒更新一次数据
		const interval = setInterval(fetchMetrics, 10000);

		return () => clearInterval(interval);
	}, []);

	const getStatusColor = (status: PerformanceMetric['status']) => {
		switch (status) {
			case 'normal':
				return 'text-green-600 bg-green-100';
			case 'warning':
				return 'text-yellow-600 bg-yellow-100';
			case 'critical':
				return 'text-red-600 bg-red-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	};

	const getTrendIcon = (trend: PerformanceMetric['trend']) => {
		switch (trend) {
			case 'up':
				return <BarChart2 className="h-4 w-4 text-green-500" />;
			case 'down':
				return <BarChart2 className="h-4 w-4 text-red-500" />;
			case 'stable':
				return <LineChart className="h-4 w-4 text-blue-500" />;
		}
	};

	const getAlertIcon = (severity: PerformanceAlert['severity']) => {
		switch (severity) {
			case 'info':
				return <Activity className="h-4 w-4 text-blue-500" />;
			case 'warning':
				return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
			case 'critical':
				return <Shield className="h-4 w-4 text-red-500" />;
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-gray-400 border-t-transparent border-b-2" />
				<p className="ml-3 text-gray-600">加载性能数据中...</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="mb-4 font-bold text-4xl text-gray-900 dark:text-white">
					性能监控仪表板
				</h1>
				<p className="text-gray-600 dark:text-gray-300">
					实时监控系统性能指标，及时发现和解决问题
				</p>
			</div>

			{/* 告警信息 */}
			{alerts.length > 0 && (
				<div className="mb-6">
					<h2 className="mb-4 font-semibold text-lg text-red-600">
						活跃告警 ({alerts.length})
					</h2>
					<div className="space-y-3">
						{alerts.map((alert) => (
							<Card
								key={alert.id}
								className={`border-l-4 ${getStatusColor(alert.severity === 'critical' ? 'critical' : 'warning')}`}
							>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											{getAlertIcon(alert.severity)}
											<CardTitle className="text-base">{alert.title}</CardTitle>
											{!alert.resolved && (
												<Badge variant="destructive">未解决</Badge>
											)}
										</div>
										<div className="flex items-center space-x-2 text-gray-500 text-sm">
											<Clock className="h-4 w-4" />
											<span>
												{new Date(alert.timestamp).toLocaleString('zh-CN')}
											</span>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-gray-700 dark:text-gray-300">
										{alert.message}
									</p>
									{alert.resolved && (
										<div className="mt-2 text-green-600 text-sm">
											已于 {new Date(alert.resolvedAt!).toLocaleString('zh-CN')}{' '}
											解决
										</div>
									)}
									{!alert.resolved && (
										<button
											onClick={() => {
												// 这里应该调用 API 来解决告警
												console.log('Resolving alert:', alert.id);
											}}
											className="mt-4 rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
										>
											标记为已解决
										</button>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}

			{/* 性能指标概览 */}
			<div className="mb-8">
				<h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
					关键指标
				</h2>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					{metrics.map((metric, index) => (
						<Card key={index} className={getStatusColor(metric.status)}>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<CardTitle className="font-medium text-sm">
										{metric.name}
									</CardTitle>
									<div className="flex items-center space-x-1">
										{React.createElement(metric.icon, {
											className: `h-4 w-4 ${getStatusColor(metric.status)}`,
										})}
										{getTrendIcon(metric.trend)}
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex items-baseline justify-between">
									<span className="font-bold text-2xl text-gray-900 dark:text-white">
										{metric.value}
									</span>
									<span className="text-gray-600 text-sm dark:text-gray-400">
										{metric.unit}
									</span>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* 详细指标 */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* 响应时间分布 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Timer className="h-5 w-5" />
							响应时间分布
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">P50</span>
								<span className="font-medium text-blue-600">142ms</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">P95</span>
								<span className="font-medium text-yellow-600">580ms</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">P99</span>
								<span className="font-medium text-red-600">1,240ms</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 错误分析 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<AlertTriangle className="h-5 w-5 text-red-500" />
							错误分析
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="grid grid-cols-3 gap-4">
								<div className="text-center">
									<div className="font-bold text-2xl text-red-600">42</div>
									<div className="text-gray-600 text-sm">服务器错误</div>
								</div>
								<div className="text-center">
									<div className="font-bold text-2xl text-yellow-600">8</div>
									<div className="text-gray-600 text-sm">客户端错误</div>
								</div>
								<div className="text-center">
									<div className="font-bold text-2xl text-blue-600">3</div>
									<div className="text-gray-600 text-sm">网络错误</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 缓存分析 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Database className="h-5 w-5 text-blue-500" />
							缓存分析
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">命中率</span>
								<span className="font-medium text-green-600">94%</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">平均响应时间</span>
								<span className="font-medium text-blue-600">56ms</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">缓存条目</span>
								<span className="font-medium text-gray-600">1,242</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 连接池状态 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Activity className="h-5 w-5 text-purple-500" />
							连接池状态
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">活跃连接</span>
								<span className="font-medium text-blue-600">42/50</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">空闲连接</span>
								<span className="font-medium text-green-600">8</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">连接等待时间</span>
								<span className="font-medium text-gray-600">125ms</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 资源使用 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Zap className="h-5 w-5 text-orange-500" />
							资源使用
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">CPU 使用</span>
								<span className="font-medium text-blue-600">12%</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">内存使用</span>
								<span className="font-medium text-green-600">64MB/256MB</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-600 text-sm">WASM 执行时间</span>
								<span className="font-medium text-gray-600">85ms</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 快捷操作 */}
			<div className="flex space-x-4">
				<button
					onClick={() => {
						// 导出报告
						console.log('Exporting performance report');
					}}
					className="rounded bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
				>
					导出报告
				</button>
				<button
					onClick={() => {
						// 刷新数据
						console.log('Refreshing performance data');
						setIsLoading(true);
						setTimeout(() => setIsLoading(false), 1000);
					}}
					className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
				>
					刷新数据
				</button>
			</div>
		</div>
	);
};

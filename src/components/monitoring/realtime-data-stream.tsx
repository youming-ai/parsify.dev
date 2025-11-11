/**
 * Real-time Data Stream Component
 * WebSocket-based real-time performance monitoring
 * Live streaming of metrics and system status
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Activity,
	Wifi,
	WifiOff,
	Clock,
	Zap,
	Cpu,
	Database,
	Monitor,
	RefreshCw,
	AlertTriangle,
	CheckCircle,
	TrendingUp,
	TrendingDown,
	Pause,
	Play
} from 'lucide-react';

import { RealtimeMetrics } from '@/monitoring/types';

interface RealtimeDataStreamProps {
	metrics: RealtimeMetrics | null;
	isLive: boolean;
	onToggleLive: () => void;
}

interface StreamEvent {
	id: string;
	timestamp: Date;
	type: 'metric' | 'alert' | 'system';
	message: string;
	value?: number;
	severity?: 'info' | 'warning' | 'error';
}

export function RealtimeDataStream({ metrics, isLive, onToggleLive }: RealtimeDataStreamProps) {
	const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
	const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
	const [isPaused, setIsPaused] = useState(false);
	const [ws, setWs] = useState<WebSocket | null>(null);
	const eventScrollRef = useRef<HTMLDivElement>(null);

	// Simulate WebSocket connection
	useEffect(() => {
		if (!isLive) {
			if (ws) {
				ws.close();
				setWs(null);
			}
			setConnectionStatus('disconnected');
			return;
		}

		// Simulate connection
		setConnectionStatus('connecting');

		const connectionTimer = setTimeout(() => {
			setConnectionStatus('connected');

			// Simulate receiving real-time data
			const dataInterval = setInterval(() => {
				if (!isPaused) {
					const event: StreamEvent = {
						id: Math.random().toString(36).substr(2, 9),
						timestamp: new Date(),
						type: Math.random() > 0.7 ? 'metric' : Math.random() > 0.5 ? 'alert' : 'system',
						message: generateRandomEventMessage(),
						value: Math.random() * 100,
						severity: Math.random() > 0.8 ? 'error' : Math.random() > 0.6 ? 'warning' : 'info',
					};

					setStreamEvents(prev => {
						const newEvents = [event, ...prev];
						return newEvents.slice(0, 100); // Keep last 100 events
					});
				}
			}, 2000 + Math.random() * 3000);

			return () => clearInterval(dataInterval);
		}, 1000);

		return () => {
			clearTimeout(connectionTimer);
			if (ws) {
				ws.close();
			}
		};
	}, [isLive, isPaused, ws]);

	// Auto-scroll to latest event
	useEffect(() => {
		if (eventScrollRef.current) {
			eventScrollRef.current.scrollTop = 0;
		}
	}, [streamEvents]);

	// Generate random event message
	const generateRandomEventMessage = (): string => {
		const messages = [
			'Task completed successfully',
			'Performance threshold exceeded',
			'User session started',
			'Memory usage optimized',
			'Cache refreshed',
			'New user interaction detected',
			'Resource loading completed',
			'API response time improved',
			'Bundle size optimized',
			'Error rate decreased',
			'Component rendered successfully',
			'Data validated',
			'Security scan completed',
			'Performance metrics updated',
			'Real-time monitoring active',
		];

		return messages[Math.floor(Math.random() * messages.length)];
	};

	// Get connection status color
	const getConnectionColor = () => {
		switch (connectionStatus) {
			case 'connected': return 'text-green-600 bg-green-50 border-green-200';
			case 'connecting': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'disconnected': return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	};

	// Get event severity color
	const getEventSeverityColor = (severity?: string) => {
		switch (severity) {
			case 'error': return 'text-red-600 bg-red-50 border-red-200';
			case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
			default: return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	};

	// Clear events
	const clearEvents = () => {
		setStreamEvents([]);
	};

	// Export events
	const exportEvents = () => {
		const data = {
			events: streamEvents,
			exportedAt: new Date().toISOString(),
			totalEvents: streamEvents.length,
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `realtime-events-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			{/* Connection Status */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="flex items-center">
							<Activity className="h-5 w-5 mr-2" />
							Real-time Data Stream
						</CardTitle>
						<CardDescription>
							Live streaming of performance metrics and system events
						</CardDescription>
					</div>
					<div className="flex items-center space-x-4">
						<div className={`px-3 py-1 rounded-full border flex items-center space-x-2 ${getConnectionColor()}`}>
							{connectionStatus === 'connected' ? (
								<Wifi className="h-4 w-4" />
							) : connectionStatus === 'connecting' ? (
								<RefreshCw className="h-4 w-4 animate-spin" />
							) : (
								<WifiOff className="h-4 w-4" />
							)}
							<span className="text-sm font-medium">{connectionStatus.toUpperCase()}</span>
						</div>

						<Switch
							checked={isLive}
							onCheckedChange={onToggleLive}
						/>

						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPaused(!isPaused)}
							disabled={!isLive}
						>
							{isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
						</Button>
					</div>
				</CardHeader>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Real-time Metrics */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Monitor className="h-5 w-5 mr-2" />
							Live Metrics
						</CardTitle>
						<CardDescription>
							Current system performance indicators
						</CardDescription>
					</CardHeader>
					<CardContent>
						{metrics ? (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium">Response Time</span>
											<span className="text-sm">{metrics.currentResponseTime.toFixed(0)}ms</span>
										</div>
										<Progress
											value={(1 - metrics.currentResponseTime / 10000) * 100}
											className="h-2"
										/>
									</div>
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium">Memory Usage</span>
											<span className="text-sm">{(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
										</div>
										<Progress
											value={(metrics.memoryUsage / (512 * 1024 * 1024)) * 100}
											className="h-2"
										/>
									</div>
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium">CPU Usage</span>
											<span className="text-sm">{metrics.cpuUsage.toFixed(1)}%</span>
										</div>
										<Progress value={metrics.cpuUsage} className="h-2" />
									</div>
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium">Interactions/min</span>
											<span className="text-sm">{metrics.interactionsPerMinute.toFixed(1)}</span>
										</div>
										<Progress
											value={Math.min(100, metrics.interactionsPerMinute * 2)}
											className="h-2"
										/>
									</div>
								</div>

								<div className="pt-4 border-t">
									<div className="grid grid-cols-2 gap-4 text-sm">
										<div>
											<span className="font-medium">Session Duration:</span>
											<div className="text-lg font-bold">
												{Math.floor(metrics.sessionDuration / 60)}m {Math.floor(metrics.sessionDuration % 60)}s
											</div>
										</div>
										<div>
											<span className="font-medium">Total Interactions:</span>
											<div className="text-lg font-bold">{metrics.totalInteractions}</div>
										</div>
										<div>
											<span className="font-medium">Idle Time:</span>
											<div className="text-lg font-bold">{Math.floor(metrics.idleTime / 60)}s</div>
										</div>
										<div>
											<span className="font-medium">Error Rate:</span>
											<div className="text-lg font-bold">{(metrics.errorRate * 100).toFixed(1)}%</div>
										</div>
									</div>
								</div>
							</div>
						) : (
							<div className="text-center text-muted-foreground py-8">
								<Activity className="h-8 w-8 mx-auto mb-2" />
								<p>Waiting for real-time data...</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Event Stream */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle className="flex items-center">
								<Zap className="h-5 w-5 mr-2" />
								Event Stream
							</CardTitle>
							<CardDescription>
								Live system events and notifications
							</CardDescription>
						</div>
						<div className="flex items-center space-x-2">
							<Button variant="outline" size="sm" onClick={clearEvents}>
								Clear
							</Button>
							<Button variant="outline" size="sm" onClick={exportEvents}>
								Export
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-96" ref={eventScrollRef}>
							{streamEvents.length > 0 ? (
								<div className="space-y-2">
									{streamEvents.map((event) => (
										<div key={event.id} className="border rounded-lg p-3">
											<div className="flex items-center justify-between mb-1">
												<div className="flex items-center space-x-2">
													<Badge variant="outline" className="text-xs">
														{event.type.toUpperCase()}
													</Badge>
													<div className={`px-2 py-0.5 rounded-full text-xs ${getEventSeverityColor(event.severity)}`}>
														{event.severity?.toUpperCase()}
													</div>
												</div>
												<span className="text-xs text-muted-foreground">
													{event.timestamp.toLocaleTimeString()}
												</span>
											</div>
											<p className="text-sm font-medium">{event.message}</p>
											{event.value !== undefined && (
												<p className="text-xs text-muted-foreground mt-1">
													Value: {event.value.toFixed(2)}
												</p>
											)}
										</div>
									))}
								</div>
							) : (
								<div className="text-center text-muted-foreground py-8">
									{isLive ? (
										<>
											<RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
											<p>Listening for events...</p>
										</>
									) : (
										<>
											<WifiOff className="h-8 w-8 mx-auto mb-2" />
											<p>Stream disconnected</p>
										</>
									)}
								</div>
							)}
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* System Status */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Cpu className="h-5 w-5 mr-2" />
						System Status
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="text-center">
							<div className="text-2xl font-bold mb-2">
								{metrics ? `${metrics.interactionsPerMinute.toFixed(1)}` : '--'}
							</div>
							<p className="text-sm font-medium">Interactions/min</p>
							<p className="text-xs text-muted-foreground">
								{metrics && metrics.interactionsPerMinute > 10 ? 'High activity' : 'Normal activity'}
							</p>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold mb-2">
								{metrics ? `${metrics.currentResponseTime.toFixed(0)}ms` : '--'}
							</div>
							<p className="text-sm font-medium">Current Response</p>
							<p className="text-xs text-muted-foreground">
								{metrics && metrics.currentResponseTime < 500 ? 'Fast' : metrics && metrics.currentResponseTime < 2000 ? 'Normal' : 'Slow'}
							</p>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold mb-2">
								{metrics ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB` : '--'}
							</div>
							<p className="text-sm font-medium">Memory Usage</p>
							<p className="text-xs text-muted-foreground">
								{metrics && metrics.memoryUsage < 100 * 1024 * 1024 ? 'Optimal' : metrics && metrics.memoryUsage < 200 * 1024 * 1024 ? 'Normal' : 'High'}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

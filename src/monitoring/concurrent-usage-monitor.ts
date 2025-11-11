/**
 * Concurrent Usage Monitor - T158 Implementation
 * Real-time monitoring and analytics for 100+ concurrent users
 * Provides resource usage optimization, session management, and load balancing insights
 */

import { analyticsHub } from './analytics-hub';
import { performanceObserver } from './performance-observer';

// Types for concurrent usage monitoring
export interface ConcurrentUserMetrics {
	// Current usage metrics
	currentActiveUsers: number;
	currentSessions: number;
	peakConcurrentUsers: number;
	peakConcurrentUsersTime: Date;

	// Capacity metrics
	maxConcurrentUsers: number;
	capacityUtilization: number; // 0-1
	resourceUtilization: {
		cpu: number; // 0-1
		memory: number; // 0-1
		bandwidth: number; // 0-1
		storage: number; // 0-1
	};

	// Performance under load
	averageResponseTime: number;
	p95ResponseTime: number;
	errorRate: number;
	throughput: number; // requests per second

	// Session metrics
	averageSessionDuration: number;
	sessionCreationRate: number; // sessions per minute
	sessionTerminationRate: number; // sessions per minute
	activeSessions: ActiveSession[];

	// Tool-specific usage
	toolUsage: Record<string, {
		activeUsers: number;
		averageProcessingTime: number;
		errorRate: number;
		resourceUsage: number;
	}>;

	// Geographic distribution (if available)
	geographicDistribution: Record<string, number>; // region -> user count

	// Device distribution
	deviceDistribution: {
		desktop: number;
		mobile: number;
		tablet: number;
		unknown: number;
	};

	// Browser distribution
	browserDistribution: Record<string, number>;

	// Timestamps
	metricsCollectedAt: Date;
	lastUpdated: Date;
}

export interface ActiveSession {
	id: string;
	userId?: string;
	startTime: Date;
	lastActivity: Date;
	duration: number; // milliseconds
	currentPage: string;
	toolInUse?: string;
	interactionCount: number;
	requestCount: number;
	resourceUsage: {
		memoryEstimate: number;
		processingTime: number;
		networkRequests: number;
	};
	deviceInfo?: {
		userAgent: string;
		device: string;
		browser: string;
		region?: string;
	};
	sessionHealth: 'healthy' | 'degraded' | 'unhealthy';
}

export interface ConcurrentUsageAlert {
	id: string;
	type: 'capacity' | 'performance' | 'resource' | 'session' | 'scalability';
	severity: 'info' | 'warning' | 'error' | 'critical';
	title: string;
	description: string;
	metrics: {
		current: number;
		threshold: number;
		percentage: number;
	};
	affectedUsers: number;
	impactedTools: string[];
	recommendations: string[];
	timestamp: Date;
	resolved: boolean;
	resolutionTime?: Date;
}

export interface LoadBalancingMetrics {
	// Distribution across resources
	serverLoad: Array<{
		serverId: string;
		load: number; // 0-1
		activeUsers: number;
		averageResponseTime: number;
		status: 'healthy' | 'degraded' | 'overloaded';
	}>;

	// CDN and caching metrics
	cacheHitRate: number;
	cdnUtilization: number;
	edgeServerDistribution: Record<string, number>;

	// Resource allocation
	memoryAllocation: {
		used: number;
		available: number;
		fragmentation: number;
	};

	cpuAllocation: {
		used: number;
		available: number;
		bottlenecks: string[];
	};

	// Network metrics
	bandwidthUtilization: number;
	latencyDistribution: {
		p50: number;
		p75: number;
		p90: number;
		p95: number;
		p99: number;
	};

	// Load balancing recommendations
	recommendations: Array<{
		type: 'scale-up' | 'scale-out' | 'optimize' | 'cache' | 'compress';
		priority: 'low' | 'medium' | 'high' | 'critical';
		description: string;
		expectedImpact: string;
		implementationComplexity: 'low' | 'medium' | 'high';
	}>;
}

export interface CapacityPlanningMetrics {
	// Current capacity
	currentCapacity: {
		maxConcurrentUsers: number;
		maxRequestsPerSecond: number;
		maxBandwidth: number; // Mbps
		maxMemory: number; // MB
	};

	// Projected growth
	growthProjection: {
		userGrowthRate: number; // % per month
		trafficGrowthRate: number; // % per month
		resourceGrowthRate: number; // % per month
		projectedCapacityNeeds: Array<{
			date: Date;
			expectedUsers: number;
			expectedRPS: number;
			expectedMemory: number;
			expectedBandwidth: number;
		}>;
	};

	// Scaling recommendations
	scalingPlan: Array<{
		trigger: string; // e.g., "80% capacity utilization"
		action: string; // e.g., "Add 2 more servers"
		timeline: string; // e.g., "Within 24 hours"
		costEstimate?: number;
		impact: string;
		priority: 'low' | 'medium' | 'high' | 'critical';
	}>;

	// Bottleneck analysis
	bottlenecks: Array<{
		resource: 'cpu' | 'memory' | 'bandwidth' | 'storage' | 'database';
		severity: 'low' | 'medium' | 'high' | 'critical';
		description: string;
		suggestedSolution: string;
		estimatedCost?: number;
		timeToResolve: string;
	}>;
}

export interface ConcurrentUsageConfig {
	// Monitoring settings
	monitoring: {
		updateInterval: number; // milliseconds
		sessionTimeout: number; // milliseconds
		maxSessionsToTrack: number;
		enableGeographicTracking: boolean;
		enableDeviceTracking: boolean;
		enableResourceMonitoring: boolean;
	};

	// Thresholds
	thresholds: {
		maxConcurrentUsers: number;
		criticalUtilization: number; // 0-1
		warningUtilization: number; // 0-1
		maxResponseTime: number; // milliseconds
		maxErrorRate: number; // 0-1
		minSessionDuration: number; // milliseconds
		maxSessionDuration: number; // milliseconds
	};

	// Load balancing
	loadBalancing: {
		enableAutoScaling: boolean;
		scaleUpThreshold: number; // 0-1
		scaleDownThreshold: number; // 0-1
		targetUtilization: number; // 0-1
		maxServers: number;
		minServers: number;
	};

	// Performance optimization
	optimization: {
		enableResourcePooling: boolean;
		enableLazyLoading: boolean;
		enableCompression: boolean;
		enableCaching: boolean;
		cacheSize: number; // MB
		enableConnectionPooling: boolean;
		maxConnections: number;
	};

	// Privacy settings
	privacy: {
		anonymizeSessions: boolean;
		maxSessionDataAge: number; // days
		trackUserAgents: boolean;
		trackGeographicData: boolean;
		trackDeviceData: boolean;
	};
}

export class ConcurrentUsageMonitor {
	private static instance: ConcurrentUsageMonitor;
	private config: ConcurrentUsageConfig;
	private isMonitoring = false;
	private monitoringInterval?: NodeJS.Timeout;
	private sessions: Map<string, ActiveSession> = new Map();
	private metrics: ConcurrentUserMetrics;
	private alerts: ConcurrentUsageAlert[] = [];
	private loadBalancingMetrics: LoadBalancingMetrics;
	private capacityPlanning: CapacityPlanningMetrics;
	private sessionCleanupInterval?: NodeJS.Timeout;
	private metricsHistory: Array<{
		timestamp: Date;
		metrics: ConcurrentUserMetrics;
	}> = [];

	// Performance tracking
	private responseTimeHistory: number[] = [];
	private cpuUsageHistory: number[] = [];
	private memoryUsageHistory: number[] = [];
	private requestRateHistory: number[] = [];

	private constructor() {
		this.config = this.getDefaultConfig();
		this.metrics = this.initializeMetrics();
		this.loadBalancingMetrics = this.initializeLoadBalancingMetrics();
		this.capacityPlanning = this.initializeCapacityPlanning();
	}

	public static getInstance(): ConcurrentUsageMonitor {
		if (!ConcurrentUsageMonitor.instance) {
			ConcurrentUsageMonitor.instance = new ConcurrentUsageMonitor();
		}
		return ConcurrentUsageMonitor.instance;
	}

	// Initialize concurrent usage monitoring
	public async initialize(config?: Partial<ConcurrentUsageConfig>): Promise<void> {
		if (this.isMonitoring) {
			console.warn('Concurrent usage monitor already initialized');
			return;
		}

		// Merge configuration
		if (config) {
			this.config = { ...this.config, ...config };
		}

		try {
			// Setup monitoring interval
			this.monitoringInterval = setInterval(() => {
				this.updateMetrics();
				this.checkThresholds();
				this.cleanupExpiredSessions();
			}, this.config.monitoring.updateInterval);

			// Setup session cleanup
			this.sessionCleanupInterval = setInterval(() => {
				this.cleanupExpiredSessions();
			}, this.config.monitoring.sessionTimeout / 10);

			// Initialize capacity planning
			this.initializeCapacityPlanning();

			this.isMonitoring = true;
			console.log('Concurrent usage monitor initialized successfully');
			console.log(`Monitoring up to ${this.config.thresholds.maxConcurrentUsers} concurrent users`);
		} catch (error) {
			console.error('Failed to initialize concurrent usage monitor:', error);
			throw error;
		}
	}

	// Start monitoring concurrent usage
	public startMonitoring(): void {
		if (!this.isMonitoring) {
			throw new Error('Concurrent usage monitor must be initialized first');
		}

		console.log('Started concurrent usage monitoring');
	}

	// Stop monitoring
	public stopMonitoring(): void {
		if (!this.isMonitoring) return;

		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
		}

		if (this.sessionCleanupInterval) {
			clearInterval(this.sessionCleanupInterval);
		}

		this.isMonitoring = false;
		console.log('Stopped concurrent usage monitoring');
	}

	// Register a new session
	public registerSession(sessionData: Partial<ActiveSession>): string {
		const sessionId = this.generateSessionId();
		const now = new Date();

		const session: ActiveSession = {
			id: sessionId,
			userId: sessionData.userId,
			startTime: now,
			lastActivity: now,
			duration: 0,
			currentPage: sessionData.currentPage || '/',
			toolInUse: sessionData.toolInUse,
			interactionCount: 0,
			requestCount: 0,
			resourceUsage: {
				memoryEstimate: 0,
				processingTime: 0,
				networkRequests: 0,
			},
			deviceInfo: sessionData.deviceInfo,
			sessionHealth: 'healthy',
		};

		// Add to sessions map
		this.sessions.set(sessionId, session);

		// Update metrics immediately
		this.updateMetrics();

		console.log(`Registered new session: ${sessionId}`);
		return sessionId;
	}

	// Update session activity
	public updateSessionActivity(sessionId: string, updates: Partial<ActiveSession>): void {
		const session = this.sessions.get(sessionId);
		if (!session) {
			console.warn(`Session not found: ${sessionId}`);
			return;
		}

		const now = new Date();

		// Update session data
		Object.assign(session, updates, {
			lastActivity: now,
			duration: now.getTime() - session.startTime.getTime(),
		});

		// Update session health
		this.updateSessionHealth(session);

		// Update metrics
		this.updateMetrics();
	}

	// Terminate a session
	public terminateSession(sessionId: string, reason?: string): void {
		const session = this.sessions.get(sessionId);
		if (!session) {
			console.warn(`Session not found: ${sessionId}`);
			return;
		}

		// Record session completion
		session.duration = Date.now() - session.startTime.getTime();

		// Remove from active sessions
		this.sessions.delete(sessionId);

		// Update metrics
		this.updateMetrics();

		console.log(`Terminated session: ${sessionId}${reason ? ` (${reason})` : ''}`);
	}

	// Get current concurrent usage metrics
	public getConcurrentMetrics(): ConcurrentUserMetrics {
		return { ...this.metrics };
	}

	// Get load balancing metrics
	public getLoadBalancingMetrics(): LoadBalancingMetrics {
		return { ...this.loadBalancingMetrics };
	}

	// Get capacity planning metrics
	public getCapacityPlanningMetrics(): CapacityPlanningMetrics {
		return { ...this.capacityPlanning };
	}

	// Get active sessions
	public getActiveSessions(): ActiveSession[] {
		return Array.from(this.sessions.values()).filter(
			session => session.sessionHealth !== 'unhealthy'
		);
	}

	// Get session by ID
	public getSession(sessionId: string): ActiveSession | undefined {
		return this.sessions.get(sessionId);
	}

	// Get current alerts
	public getAlerts(): ConcurrentUsageAlert[] {
		return this.alerts.filter(alert => !alert.resolved);
	}

	// Get metrics history for trend analysis
	public getMetricsHistory(hours: number = 24): Array<{
		timestamp: Date;
		metrics: ConcurrentUserMetrics;
	}> {
		const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
		return this.metricsHistory.filter(entry => entry.timestamp >= cutoff);
	}

	// Simulate load for testing
	public simulateLoad(userCount: number, duration: number): void {
		console.log(`Simulating load: ${userCount} users for ${duration}ms`);

		const sessions: string[] = [];

		// Create sessions
		for (let i = 0; i < userCount; i++) {
			const sessionId = this.registerSession({
				userId: `sim_user_${i}`,
				currentPage: `/tools/json`,
				toolInUse: 'json-formatter',
				deviceInfo: {
					userAgent: 'Simulated Load Test',
					device: 'desktop',
					browser: 'chrome',
				},
			});
			sessions.push(sessionId);
		}

		// Simulate activity
		const activityInterval = setInterval(() => {
			sessions.forEach(sessionId => {
				this.updateSessionActivity(sessionId, {
					interactionCount: Math.floor(Math.random() * 5) + 1,
					requestCount: Math.floor(Math.random() * 10) + 1,
					resourceUsage: {
						memoryEstimate: Math.random() * 50 + 10,
						processingTime: Math.random() * 100 + 50,
						networkRequests: Math.floor(Math.random() * 5) + 1,
					},
				});
			});
		}, 1000);

		// Clean up after simulation
		setTimeout(() => {
			clearInterval(activityInterval);
			sessions.forEach(sessionId => {
				this.terminateSession(sessionId, 'simulation-complete');
			});
			console.log('Load simulation completed');
		}, duration);
	}

	// Generate load testing report
	public generateLoadTestReport(): string {
		const metrics = this.getConcurrentMetrics();
		const loadBalancing = this.getLoadBalancingMetrics();
		const capacity = this.getCapacityPlanningMetrics();

		const report = {
			summary: {
				currentActiveUsers: metrics.currentActiveUsers,
				peakConcurrentUsers: metrics.peakConcurrentUsers,
				capacityUtilization: metrics.capacityUtilization,
				averageResponseTime: metrics.averageResponseTime,
				errorRate: metrics.errorRate,
				throughput: metrics.throughput,
			},

			performance: {
				p95ResponseTime: metrics.p95ResponseTime,
				resourceUtilization: metrics.resourceUtilization,
				sessionMetrics: {
					averageSessionDuration: metrics.averageSessionDuration,
					sessionCreationRate: metrics.sessionCreationRate,
					sessionTerminationRate: metrics.sessionTerminationRate,
				},
			},

			loadBalancing: {
				cacheHitRate: loadBalancing.cacheHitRate,
				bandwidthUtilization: loadBalancing.bandwidthUtilization,
				serverLoad: loadBalancing.serverLoad,
				latencyDistribution: loadBalancing.latencyDistribution,
			},

			capacityPlanning: {
				currentCapacity: capacity.currentCapacity,
				bottlenecks: capacity.bottlenecks,
				scalingPlan: capacity.scalingPlan.slice(0, 3), // Top 3 recommendations
			},

			alerts: this.getAlerts().slice(0, 5), // Top 5 alerts

			recommendations: this.generateOptimizationRecommendations(),

			generatedAt: new Date().toISOString(),
		};

		return JSON.stringify(report, null, 2);
	}

	// Private methods

	private getDefaultConfig(): ConcurrentUsageConfig {
		return {
			monitoring: {
				updateInterval: 5000, // 5 seconds
				sessionTimeout: 30 * 60 * 1000, // 30 minutes
				maxSessionsToTrack: 1000,
				enableGeographicTracking: false,
				enableDeviceTracking: true,
				enableResourceMonitoring: true,
			},

			thresholds: {
				maxConcurrentUsers: 500,
				criticalUtilization: 0.9,
				warningUtilization: 0.75,
				maxResponseTime: 2000, // 2 seconds
				maxErrorRate: 0.05, // 5%
				minSessionDuration: 5000, // 5 seconds
				maxSessionDuration: 2 * 60 * 60 * 1000, // 2 hours
			},

			loadBalancing: {
				enableAutoScaling: false, // Client-side only
				scaleUpThreshold: 0.8,
				scaleDownThreshold: 0.3,
				targetUtilization: 0.6,
				maxServers: 10,
				minServers: 1,
			},

			optimization: {
				enableResourcePooling: true,
				enableLazyLoading: true,
				enableCompression: true,
				enableCaching: true,
				cacheSize: 50, // 50MB
				enableConnectionPooling: true,
				maxConnections: 100,
			},

			privacy: {
				anonymizeSessions: true,
				maxSessionDataAge: 7, // 7 days
				trackUserAgents: true,
				trackGeographicData: false,
				trackDeviceData: true,
			},
		};
	}

	private initializeMetrics(): ConcurrentUserMetrics {
		return {
			currentActiveUsers: 0,
			currentSessions: 0,
			peakConcurrentUsers: 0,
			peakConcurrentUsersTime: new Date(),
			maxConcurrentUsers: this.config.thresholds.maxConcurrentUsers,
			capacityUtilization: 0,
			resourceUtilization: {
				cpu: 0,
				memory: 0,
				bandwidth: 0,
				storage: 0,
			},
			averageResponseTime: 0,
			p95ResponseTime: 0,
			errorRate: 0,
			throughput: 0,
			averageSessionDuration: 0,
			sessionCreationRate: 0,
			sessionTerminationRate: 0,
			activeSessions: [],
			toolUsage: {},
			geographicDistribution: {},
			deviceDistribution: {
				desktop: 0,
				mobile: 0,
				tablet: 0,
				unknown: 0,
			},
			browserDistribution: {},
			metricsCollectedAt: new Date(),
			lastUpdated: new Date(),
		};
	}

	private initializeLoadBalancingMetrics(): LoadBalancingMetrics {
		return {
			serverLoad: [{
				serverId: 'client-instance',
				load: 0,
				activeUsers: 0,
				averageResponseTime: 0,
				status: 'healthy',
			}],
			cacheHitRate: 0,
			cdnUtilization: 0,
			edgeServerDistribution: {},
			memoryAllocation: {
				used: 0,
				available: this.config.optimization.cacheSize,
				fragmentation: 0,
			},
			cpuAllocation: {
				used: 0,
				available: 100,
				bottlenecks: [],
			},
			bandwidthUtilization: 0,
			latencyDistribution: {
				p50: 0,
				p75: 0,
				p90: 0,
				p95: 0,
				p99: 0,
			},
			recommendations: [],
		};
	}

	private initializeCapacityPlanning(): CapacityPlanningMetrics {
		return {
			currentCapacity: {
				maxConcurrentUsers: this.config.thresholds.maxConcurrentUsers,
				maxRequestsPerSecond: 1000,
				maxBandwidth: 100, // 100 Mbps
				maxMemory: this.config.optimization.cacheSize,
			},
			growthProjection: {
				userGrowthRate: 10, // 10% per month
				trafficGrowthRate: 15, // 15% per month
				resourceGrowthRate: 12, // 12% per month
				projectedCapacityNeeds: [],
			},
			scalingPlan: [],
			bottlenecks: [],
		};
	}

	private updateMetrics(): void {
		const now = new Date();
		const activeSessions = Array.from(this.sessions.values());

		// Basic session metrics
		this.metrics.currentSessions = activeSessions.length;
		this.metrics.currentActiveUsers = activeSessions.length; // Assuming 1:1 for client-side
		this.metrics.activeSessions = activeSessions;

		// Peak concurrent users
		if (this.metrics.currentActiveUsers > this.metrics.peakConcurrentUsers) {
			this.metrics.peakConcurrentUsers = this.metrics.currentActiveUsers;
			this.metrics.peakConcurrentUsersTime = now;
		}

		// Capacity utilization
		this.metrics.capacityUtilization = this.metrics.currentActiveUsers / this.metrics.maxConcurrentUsers;

		// Session metrics
		if (activeSessions.length > 0) {
			const totalDuration = activeSessions.reduce((sum, session) => sum + session.duration, 0);
			this.metrics.averageSessionDuration = totalDuration / activeSessions.length;
		}

		// Update resource utilization
		this.updateResourceUtilization();

		// Update performance metrics
		this.updatePerformanceMetrics();

		// Update tool usage
		this.updateToolUsage();

		// Update device and browser distribution
		this.updateDeviceDistribution();

		// Update timestamps
		this.metrics.lastUpdated = now;

		// Store in history (keep last 1000 entries)
		this.metricsHistory.push({
			timestamp: now,
			metrics: { ...this.metrics },
		});

		if (this.metricsHistory.length > 1000) {
			this.metricsHistory.shift();
		}
	}

	private updateResourceUtilization(): void {
		// Estimate resource usage based on active sessions
		const activeSessions = this.metrics.activeSessions;

		if (activeSessions.length === 0) {
			this.metrics.resourceUtilization = { cpu: 0, memory: 0, bandwidth: 0, storage: 0 };
			return;
		}

		// Calculate average resource usage per session
		const avgMemoryPerSession = activeSessions.reduce(
			(sum, session) => sum + session.resourceUsage.memoryEstimate, 0
		) / activeSessions.length;

		const avgProcessingPerSession = activeSessions.reduce(
			(sum, session) => sum + session.resourceUsage.processingTime, 0
		) / activeSessions.length;

		const avgNetworkPerSession = activeSessions.reduce(
			(sum, session) => sum + session.resourceUsage.networkRequests, 0
		) / activeSessions.length;

		// Convert to utilization percentages
		const totalMemoryUsage = avgMemoryPerSession * activeSessions.length;
		const maxMemory = this.config.optimization.cacheSize * 1024 * 1024; // Convert MB to bytes

		this.metrics.resourceUtilization = {
			cpu: Math.min(1, (avgProcessingPerSession * activeSessions.length) / 1000), // Normalize to 0-1
			memory: Math.min(1, totalMemoryUsage / maxMemory),
			bandwidth: Math.min(1, (avgNetworkPerSession * activeSessions.length) / 100), // Normalize to 0-1
			storage: Math.min(1, totalMemoryUsage / (maxMemory * 0.8)), // Assume 80% for storage
		};

		// Update load balancing metrics
		this.updateLoadBalancingMetrics();
	}

	private updateLoadBalancingMetrics(): void {
		const resourceUtil = this.metrics.resourceUtilization;

		// Update server load (client-side single instance)
		this.loadBalancingMetrics.serverLoad[0] = {
			serverId: 'client-instance',
			load: Math.max(resourceUtil.cpu, resourceUtil.memory),
			activeUsers: this.metrics.currentActiveUsers,
			averageResponseTime: this.metrics.averageResponseTime,
			status: this.metrics.capacityUtilization > 0.9 ? 'overloaded' :
					this.metrics.capacityUtilization > 0.75 ? 'degraded' : 'healthy',
		};

		// Update memory allocation
		this.loadBalancingMetrics.memoryAllocation = {
			used: resourceUtil.memory * this.config.optimization.cacheSize,
			available: this.config.optimization.cacheSize * (1 - resourceUtil.memory),
			fragmentation: 0.1, // Estimated fragmentation
		};

		// Update CPU allocation
		const cpuBottlenecks: string[] = [];
		if (resourceUtil.cpu > 0.8) cpuBottlenecks.push('High CPU usage');
		if (resourceUtil.memory > 0.8) cpuBottlenecks.push('High memory usage');
		if (this.metrics.averageResponseTime > 1000) cpuBottlenecks.push('Slow response times');

		this.loadBalancingMetrics.cpuAllocation = {
			used: resourceUtil.cpu * 100,
			available: 100 * (1 - resourceUtil.cpu),
			bottlenecks: cpuBottlenecks,
		};

		// Update bandwidth utilization
		this.loadBalancingMetrics.bandwidthUtilization = resourceUtil.bandwidth;
	}

	private updatePerformanceMetrics(): void {
		// Get performance metrics from performance observer
		const perfMetrics = performanceObserver.getMetrics();

		this.metrics.averageResponseTime = perfMetrics.pageLoadTime || 0;
		this.metrics.errorRate = perfMetrics.errorRate || 0;
		this.metrics.throughput = this.calculateThroughput();

		// Update response time history for P95 calculation
		if (this.metrics.averageResponseTime > 0) {
			this.responseTimeHistory.push(this.metrics.averageResponseTime);
			if (this.responseTimeHistory.length > 100) {
				this.responseTimeHistory.shift();
			}

			// Calculate P95
			const sorted = [...this.responseTimeHistory].sort((a, b) => a - b);
			this.metrics.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)];
		}

		// Update load balancing latency distribution
		if (this.responseTimeHistory.length > 0) {
			const sorted = [...this.responseTimeHistory].sort((a, b) => a - b);
			this.loadBalancingMetrics.latencyDistribution = {
				p50: sorted[Math.floor(sorted.length * 0.5)],
				p75: sorted[Math.floor(sorted.length * 0.75)],
				p90: sorted[Math.floor(sorted.length * 0.9)],
				p95: sorted[Math.floor(sorted.length * 0.95)],
				p99: sorted[Math.floor(sorted.length * 0.99)],
			};
		}
	}

	private updateToolUsage(): void {
		const toolUsage: Record<string, any> = {};

		this.metrics.activeSessions.forEach(session => {
			if (session.toolInUse) {
				if (!toolUsage[session.toolInUse]) {
					toolUsage[session.toolInUse] = {
						activeUsers: 0,
						averageProcessingTime: 0,
						errorRate: 0,
						resourceUsage: 0,
					};
				}

				toolUsage[session.toolInUse].activeUsers++;
				toolUsage[session.toolInUse].averageProcessingTime += session.resourceUsage.processingTime;
				toolUsage[session.toolInUse].resourceUsage += session.resourceUsage.memoryEstimate;
			}
		});

		// Calculate averages
		Object.keys(toolUsage).forEach(tool => {
			const toolData = toolUsage[tool];
			if (toolData.activeUsers > 0) {
				toolData.averageProcessingTime /= toolData.activeUsers;
				toolData.resourceUsage /= toolData.activeUsers;
			}
		});

		this.metrics.toolUsage = toolUsage;
	}

	private updateDeviceDistribution(): void {
		const distribution = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
		const browserDist: Record<string, number> = {};

		this.metrics.activeSessions.forEach(session => {
			if (session.deviceInfo) {
				const device = session.deviceInfo.device.toLowerCase();
				if (device.includes('mobile')) {
					distribution.mobile++;
				} else if (device.includes('tablet')) {
					distribution.tablet++;
				} else if (device.includes('desktop') || device.includes('laptop')) {
					distribution.desktop++;
				} else {
					distribution.unknown++;
				}

				const browser = session.deviceInfo.browser.toLowerCase();
				browserDist[browser] = (browserDist[browser] || 0) + 1;
			} else {
				distribution.unknown++;
			}
		});

		this.metrics.deviceDistribution = distribution;
		this.metrics.browserDistribution = browserDist;
	}

	private updateSessionHealth(session: ActiveSession): void {
		const now = Date.now();
		const sessionAge = now - session.startTime.getTime();
		const timeSinceLastActivity = now - session.lastActivity.getTime();

		// Check for unhealthy conditions
		if (timeSinceLastActivity > this.config.monitoring.sessionTimeout) {
			session.sessionHealth = 'unhealthy';
		} else if (sessionAge > this.config.thresholds.maxSessionDuration ||
				   session.resourceUsage.memoryEstimate > 100) {
			session.sessionHealth = 'degraded';
		} else {
			session.sessionHealth = 'healthy';
		}
	}

	private cleanupExpiredSessions(): void {
		const now = new Date();
		const expiredSessions: string[] = [];

		this.sessions.forEach((session, sessionId) => {
			const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();

			if (timeSinceLastActivity > this.config.monitoring.sessionTimeout) {
				expiredSessions.push(sessionId);
			}
		});

		expiredSessions.forEach(sessionId => {
			this.terminateSession(sessionId, 'session-expired');
		});

		if (expiredSessions.length > 0) {
			console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
		}
	}

	private checkThresholds(): void {
		const metrics = this.metrics;

		// Check concurrent user threshold
		if (metrics.capacityUtilization > this.config.thresholds.criticalUtilization) {
			this.createAlert({
				type: 'capacity',
				severity: 'critical',
				title: 'Critical Capacity Utilization',
				description: `System is at ${(metrics.capacityUtilization * 100).toFixed(1)}% capacity`,
				metrics: {
					current: metrics.currentActiveUsers,
					threshold: this.config.thresholds.maxConcurrentUsers,
					percentage: metrics.capacityUtilization,
				},
				affectedUsers: metrics.currentActiveUsers,
				impactedTools: Object.keys(metrics.toolUsage),
				recommendations: [
					'Scale up resources immediately',
					'Enable connection pooling',
					'Optimize caching strategies',
				],
			});
		} else if (metrics.capacityUtilization > this.config.thresholds.warningUtilization) {
			this.createAlert({
				type: 'capacity',
				severity: 'warning',
				title: 'High Capacity Utilization',
				description: `System is at ${(metrics.capacityUtilization * 100).toFixed(1)}% capacity`,
				metrics: {
					current: metrics.currentActiveUsers,
					threshold: this.config.thresholds.maxConcurrentUsers,
					percentage: metrics.capacityUtilization,
				},
				affectedUsers: metrics.currentActiveUsers,
				impactedTools: Object.keys(metrics.toolUsage),
				recommendations: [
					'Monitor system closely',
					'Prepare scaling resources',
					'Optimize tool performance',
				],
			});
		}

		// Check response time threshold
		if (metrics.averageResponseTime > this.config.thresholds.maxResponseTime) {
			this.createAlert({
				type: 'performance',
				severity: 'error',
				title: 'Slow Response Times',
				description: `Average response time is ${metrics.averageResponseTime}ms`,
				metrics: {
					current: metrics.averageResponseTime,
					threshold: this.config.thresholds.maxResponseTime,
					percentage: metrics.averageResponseTime / this.config.thresholds.maxResponseTime,
				},
				affectedUsers: metrics.currentActiveUsers,
				impactedTools: Object.keys(metrics.toolUsage),
				recommendations: [
					'Optimize tool algorithms',
					'Implement request debouncing',
					'Enable resource compression',
				],
			});
		}

		// Check error rate threshold
		if (metrics.errorRate > this.config.thresholds.maxErrorRate) {
			this.createAlert({
				type: 'performance',
				severity: 'error',
				title: 'High Error Rate',
				description: `Error rate is ${(metrics.errorRate * 100).toFixed(2)}%`,
				metrics: {
					current: metrics.errorRate,
					threshold: this.config.thresholds.maxErrorRate,
					percentage: metrics.errorRate / this.config.thresholds.maxErrorRate,
				},
				affectedUsers: metrics.currentActiveUsers,
				impactedTools: Object.keys(metrics.toolUsage),
				recommendations: [
					'Investigate error sources',
					'Implement better error handling',
					'Add circuit breakers for failing tools',
				],
			});
		}

		// Check resource utilization
		const resourceUtil = metrics.resourceUtilization;
		if (resourceUtil.cpu > 0.9 || resourceUtil.memory > 0.9) {
			this.createAlert({
				type: 'resource',
				severity: 'critical',
				title: 'Resource Exhaustion',
				description: `High resource usage: CPU ${(resourceUtil.cpu * 100).toFixed(1)}%, Memory ${(resourceUtil.memory * 100).toFixed(1)}%`,
				metrics: {
					current: Math.max(resourceUtil.cpu, resourceUtil.memory),
					threshold: 0.9,
					percentage: Math.max(resourceUtil.cpu, resourceUtil.memory) / 0.9,
				},
				affectedUsers: metrics.currentActiveUsers,
				impactedTools: Object.keys(metrics.toolUsage),
				recommendations: [
					'Implement resource pooling',
					'Optimize memory usage',
					'Enable lazy loading',
				],
			});
		}
	}

	private createAlert(alertData: Omit<ConcurrentUsageAlert, 'id' | 'timestamp' | 'resolved'>): void {
		const alert: ConcurrentUsageAlert = {
			id: this.generateAlertId(),
			...alertData,
			timestamp: new Date(),
			resolved: false,
		};

		// Check for similar existing alerts
		const existingAlert = this.alerts.find(a =>
			!a.resolved &&
			a.type === alert.type &&
			a.title === alert.title &&
			Date.now() - a.timestamp.getTime() < 60000 // Within last minute
		);

		if (!existingAlert) {
			this.alerts.push(alert);
			console.warn(`[CONCURRENT USAGE ALERT] ${alert.title}: ${alert.description}`);

			// Limit alerts array size
			if (this.alerts.length > 100) {
				this.alerts = this.alerts.slice(-100);
			}
		}
	}

	private calculateThroughput(): number {
		const activeSessions = this.metrics.activeSessions;
		const totalRequests = activeSessions.reduce((sum, session) => sum + session.requestCount, 0);
		const totalDuration = activeSessions.reduce((sum, session) => sum + session.duration, 0);

		if (totalDuration === 0) return 0;

		// Calculate requests per second
		return (totalRequests / totalDuration) * 1000;
	}

	private generateOptimizationRecommendations(): string[] {
		const recommendations: string[] = [];
		const metrics = this.metrics;
		const resourceUtil = metrics.resourceUtilization;

		// Performance recommendations
		if (metrics.averageResponseTime > 1000) {
			recommendations.push('Optimize tool processing algorithms to reduce response time');
		}

		if (metrics.errorRate > 0.02) {
			recommendations.push('Implement better error handling and validation');
		}

		// Resource recommendations
		if (resourceUtil.memory > 0.8) {
			recommendations.push('Implement memory pooling and cleanup for active sessions');
		}

		if (resourceUtil.cpu > 0.8) {
			recommendations.push('Optimize CPU-intensive operations and consider web workers');
		}

		// Capacity recommendations
		if (metrics.capacityUtilization > 0.7) {
			recommendations.push('Consider implementing session queuing or throttling');
		}

		// Tool-specific recommendations
		Object.entries(metrics.toolUsage).forEach(([tool, usage]) => {
			if (usage.averageProcessingTime > 5000) {
				recommendations.push(`Optimize ${tool} processing time (currently ${usage.averageProcessingTime.toFixed(0)}ms)`);
			}

			if (usage.errorRate > 0.05) {
				recommendations.push(`Fix high error rate in ${tool} tool (${(usage.errorRate * 100).toFixed(1)}%)`);
			}
		});

		return recommendations;
	}

	private initializeCapacityPlanning(): void {
		const capacity = this.capacityPlanning;
		const now = new Date();

		// Generate 12-month projection
		for (let i = 1; i <= 12; i++) {
			const futureDate = new Date(now.getTime() + i * 30 * 24 * 60 * 60 * 1000);
			const userGrowthFactor = Math.pow(1 + capacity.growthProjection.userGrowthRate / 100, i);
			const trafficGrowthFactor = Math.pow(1 + capacity.growthProjection.trafficGrowthRate / 100, i);
			const resourceGrowthFactor = Math.pow(1 + capacity.growthProjection.resourceGrowthRate / 100, i);

			capacity.growthProjection.projectedCapacityNeeds.push({
				date: futureDate,
				expectedUsers: Math.floor(capacity.currentCapacity.maxConcurrentUsers * userGrowthFactor),
				expectedRPS: Math.floor(capacity.currentCapacity.maxRequestsPerSecond * trafficGrowthFactor),
				expectedMemory: Math.floor(capacity.currentCapacity.maxMemory * resourceGrowthFactor),
				expectedBandwidth: Math.floor(capacity.currentCapacity.maxBandwidth * resourceGrowthFactor),
			});
		}

		// Generate scaling plan
		capacity.scalingPlan = [
			{
				trigger: '75% capacity utilization',
				action: 'Enable advanced caching and compression',
				timeline: 'Immediate',
				impact: 'Reduces resource usage by 15-20%',
				priority: 'high',
			},
			{
				trigger: '85% capacity utilization',
				action: 'Implement session throttling and queuing',
				timeline: 'Within 1 hour',
				impact: 'Maintains performance under load',
				priority: 'critical',
			},
			{
				trigger: '90% capacity utilization',
				action: 'Enable aggressive resource optimization',
				timeline: 'Within 30 minutes',
				impact: 'Extends capacity by 10-15%',
				priority: 'critical',
			},
		];

		// Identify potential bottlenecks
		capacity.bottlenecks = [
			{
				resource: 'memory',
				severity: 'medium',
				description: 'Session data accumulation may cause memory pressure',
				suggestedSolution: 'Implement session data cleanup and compression',
				timeToResolve: '2-4 hours',
			},
			{
				resource: 'cpu',
				severity: 'low',
				description: 'JSON processing tools may cause CPU spikes',
				suggestedSolution: 'Optimize parsing algorithms and use web workers',
				timeToResolve: '4-8 hours',
			},
		];
	}

	// Utility methods
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateAlertId(): string {
		return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Singleton instance
export const concurrentUsageMonitor = ConcurrentUsageMonitor.getInstance();

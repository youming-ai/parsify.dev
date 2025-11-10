/**
 * Performance Observer - Core performance monitoring system
 * Tracks task completion times, bundle sizes, and user experience metrics
 */

import type { PerformanceEntry, PerformanceObserverCallback } from 'node:perf_hooks';

export interface PerformanceMetrics {
	// Task completion metrics
	taskCompletionTime: number;
	taskSuccessRate: number;
	totalTasksCompleted: number;
	totalTasksAttempted: number;

	// Loading performance metrics
	pageLoadTime: number;
	firstContentfulPaint: number;
	largestContentfulPaint: number;
	cumulativeLayoutShift: number;
	firstInputDelay: number;

	// Bundle and resource metrics
	bundleSize: number;
	totalResourcesSize: number;
	resourceLoadTimes: number[];

	// User interaction metrics
	averageResponseTime: number;
	errorRate: number;
	userSatisfactionScore: number;

	// Timestamps
	timestamp: Date;
	sessionId: string;
}

export interface TaskPerformance {
	taskId: string;
	taskName: string;
	startTime: number;
	endTime: number;
	duration: number;
	success: boolean;
	errorMessage?: string;
	inputSize?: number;
	outputSize?: number;
	memoryUsage?: number;
}

export class PerformanceObserver {
	private static instance: PerformanceObserver;
	private metrics: PerformanceMetrics;
	private taskHistory: TaskPerformance[] = [];
	private observers: PerformanceObserver[] = [];
	private sessionId: string;

	private constructor() {
		this.sessionId = this.generateSessionId();
		this.metrics = this.initializeMetrics();
		this.initializeObservers();
	}

	public static getInstance(): PerformanceObserver {
		if (!PerformanceObserver.instance) {
			PerformanceObserver.instance = new PerformanceObserver();
		}
		return PerformanceObserver.instance;
	}

	// Initialize metrics with default values
	private initializeMetrics(): PerformanceMetrics {
		return {
			taskCompletionTime: 0,
			taskSuccessRate: 1,
			totalTasksCompleted: 0,
			totalTasksAttempted: 0,
			pageLoadTime: 0,
			firstContentfulPaint: 0,
			largestContentfulPaint: 0,
			cumulativeLayoutShift: 0,
			firstInputDelay: 0,
			bundleSize: 0,
			totalResourcesSize: 0,
			resourceLoadTimes: [],
			averageResponseTime: 0,
			errorRate: 0,
			userSatisfactionScore: 0,
			timestamp: new Date(),
			sessionId: this.sessionId,
		};
	}

	// Initialize browser performance observers
	private initializeObservers(): void {
		if (typeof window === 'undefined') return;

		try {
			// Observe navigation timing
			if ('performance' in window && 'getEntriesByType' in performance) {
				this.observeNavigationTiming();
				this.observeResourceTiming();
				this.observePaintTiming();
				this.observeLayoutShift();
				this.observeInputDelay();
			}

			// Observe Long Tasks (if supported)
			if ('PerformanceObserver' in window && 'longtask' in PerformanceObserver.supportedEntryTypes) {
				this.observeLongTasks();
			}
		} catch (error) {
			console.warn('Performance monitoring initialization failed:', error);
		}
	}

	// Observe navigation timing metrics
	private observeNavigationTiming(): void {
		const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
		if (navigationEntries.length > 0) {
			const nav = navigationEntries[0];
			this.metrics.pageLoadTime = nav.loadEventEnd - nav.loadEventStart;
			this.metrics.bundleSize = this.calculateBundleSize();
		}
	}

	// Observe resource loading
	private observeResourceTiming(): void {
		const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
		this.metrics.resourceLoadTimes = resourceEntries.map((entry) => entry.responseEnd - entry.requestStart);
		this.metrics.totalResourcesSize = this.calculateTotalResourceSize(resourceEntries);
	}

	// Observe paint timing
	private observePaintTiming(): void {
		const paintEntries = performance.getEntriesByType('paint');
		paintEntries.forEach((entry) => {
			if (entry.name === 'first-contentful-paint') {
				this.metrics.firstContentfulPaint = entry.startTime;
			}
		});

		// Observe Largest Contentful Paint
		if ('PerformanceObserver' in window && 'largest-contentful-paint' in PerformanceObserver.supportedEntryTypes) {
			const lcpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1];
				this.metrics.largestContentfulPaint = lastEntry.startTime;
			});
			lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
			this.observers.push(lcpObserver);
		}
	}

	// Observe Cumulative Layout Shift
	private observeLayoutShift(): void {
		if ('PerformanceObserver' in window && 'layout-shift' in PerformanceObserver.supportedEntryTypes) {
			let clsValue = 0;
			const clsObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (!(entry as any).hadRecentInput) {
						clsValue += (entry as any).value;
					}
				}
				this.metrics.cumulativeLayoutShift = clsValue;
			});
			clsObserver.observe({ entryTypes: ['layout-shift'] });
			this.observers.push(clsObserver);
		}
	}

	// Observe First Input Delay
	private observeInputDelay(): void {
		if ('PerformanceObserver' in window && 'first-input' in PerformanceObserver.supportedEntryTypes) {
			const fidObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				if (entries.length > 0) {
					this.metrics.firstInputDelay = entries[0].processingStart - entries[0].startTime;
				}
			});
			fidObserver.observe({ entryTypes: ['first-input'] });
			this.observers.push(fidObserver);
		}
	}

	// Observe Long Tasks
	private observeLongTasks(): void {
		const longTaskObserver = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				console.warn('Long task detected:', {
					duration: entry.duration,
					startTime: entry.startTime,
					name: entry.name,
				});
			}
		});
		longTaskObserver.observe({ entryTypes: ['longtask'] });
		this.observers.push(longTaskObserver);
	}

	// Calculate approximate bundle size from resources
	private calculateBundleSize(): number {
		const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
		return resources
			.filter((resource) => resource.name.includes('.js') || resource.name.includes('.css'))
			.reduce((total, resource) => total + (resource.transferSize || 0), 0);
	}

	// Calculate total resource size
	private calculateTotalResourceSize(resources: PerformanceResourceTiming[]): number {
		return resources.reduce((total, resource) => total + (resource.transferSize || 0), 0);
	}

	// Start tracking a task
	public startTask(taskId: string, taskName: string): string {
		const task: TaskPerformance = {
			taskId,
			taskName,
			startTime: performance.now(),
			endTime: 0,
			duration: 0,
			success: false,
		};

		this.taskHistory.push(task);
		this.metrics.totalTasksAttempted++;
		return taskId;
	}

	// Complete a task with success
	public completeTask(taskId: string, outputSize?: number): void {
		const task = this.taskHistory.find((t) => t.taskId === taskId);
		if (task) {
			task.endTime = performance.now();
			task.duration = task.endTime - task.startTime;
			task.success = true;
			task.outputSize = outputSize;

			// Capture memory usage if available
			if ('memory' in performance) {
				task.memoryUsage = (performance as any).memory.usedJSHeapSize;
			}

			this.updateTaskMetrics(task);
		}
	}

	// Fail a task with error
	public failTask(taskId: string, errorMessage: string): void {
		const task = this.taskHistory.find((t) => t.taskId === taskId);
		if (task) {
			task.endTime = performance.now();
			task.duration = task.endTime - task.startTime;
			task.success = false;
			task.errorMessage = errorMessage;

			// Capture memory usage if available
			if ('memory' in performance) {
				task.memoryUsage = (performance as any).memory.usedJSHeapSize;
			}

			this.updateTaskMetrics(task);
		}
	}

	// Enhanced method to track task completion metrics for SC-011 compliance
	public trackTaskCompletion(
		taskId: string,
		category: string,
		outcome: 'success' | 'failure' | 'abandonment',
		metadata?: {
			duration?: number;
			inputSize?: number;
			outputSize?: number;
			errorType?: string;
			errorMessage?: string;
			stepsCompleted?: number;
			totalSteps?: number;
			userSatisfaction?: number;
			processingTime?: number;
			uiResponseTime?: number;
			networkRequests?: number;
		},
	): void {
		const task = this.taskHistory.find((t) => t.taskId === taskId);
		if (!task) return;

		// Update task with enhanced metadata
		task.endTime = performance.now();
		task.duration = metadata?.duration || task.endTime - task.startTime;
		task.success = outcome === 'success';
		task.errorMessage = metadata?.errorMessage;
		task.outputSize = metadata?.outputSize;
		task.inputSize = metadata?.inputSize || task.inputSize;

		// Capture performance metrics
		if ('memory' in performance) {
			task.memoryUsage = (performance as any).memory.usedJSHeapSize;
		}

		// Add category-specific tracking
		const categoryKey = `${category}_tasks`;
		if (!(categoryKey in this.metrics)) {
			(this.metrics as any)[categoryKey] = {
				total: 0,
				completed: 0,
				failed: 0,
				averageTime: 0,
			};
		}

		const categoryMetrics = (this.metrics as any)[categoryKey];
		categoryMetrics.total++;

		if (outcome === 'success') {
			categoryMetrics.completed++;
		} else {
			categoryMetrics.failed++;
		}

		// Update average time for category
		const categoryTasks = this.taskHistory.filter((t) => t.taskName.toLowerCase().includes(category));
		if (categoryTasks.length > 0) {
			const totalTime = categoryTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
			categoryMetrics.averageTime = totalTime / categoryTasks.length;
		}

		this.updateTaskMetrics(task);
	}

	// Get task completion metrics by category
	public getTaskCompletionMetrics(category?: string): {
		totalTasks: number;
		completedTasks: number;
		failedTasks: number;
		completionRate: number;
		averageCompletionTime: number;
		mostCommonErrors: Array<{ error: string; count: number }>;
		performanceByComplexity: Record<string, { avgTime: number; successRate: number }>;
	} {
		const relevantTasks = category
			? this.taskHistory.filter((t) => t.taskName.toLowerCase().includes(category.toLowerCase()))
			: this.taskHistory;

		const totalTasks = relevantTasks.length;
		const completedTasks = relevantTasks.filter((t) => t.success).length;
		const failedTasks = totalTasks - completedTasks;
		const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

		const completionTimes = relevantTasks.filter((t) => t.success && t.duration).map((t) => t.duration!);
		const averageCompletionTime =
			completionTimes.length > 0 ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length : 0;

		// Most common errors
		const errorCounts = new Map<string, number>();
		relevantTasks.forEach((task) => {
			if (!task.success && task.errorMessage) {
				const errorType = task.errorMessage.split(':')[0] || 'Unknown';
				errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1);
			}
		});

		const mostCommonErrors = Array.from(errorCounts.entries())
			.map(([error, count]) => ({ error, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		// Performance by complexity (simple heuristic based on duration)
		const performanceByComplexity: Record<string, { avgTime: number; successRate: number }> = {
			simple: { avgTime: 0, successRate: 0 },
			medium: { avgTime: 0, successRate: 0 },
			complex: { avgTime: 0, successRate: 0 },
		};

		['simple', 'medium', 'complex'].forEach((complexity) => {
			const complexityTasks = relevantTasks.filter((t) => {
				const duration = t.duration || 0;
				if (complexity === 'simple') return duration <= 1000;
				if (complexity === 'medium') return duration > 1000 && duration <= 5000;
				return duration > 5000;
			});

			const times = complexityTasks.filter((t) => t.duration).map((t) => t.duration!);
			const avgTime = times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;

			const successRate =
				complexityTasks.length > 0 ? complexityTasks.filter((t) => t.success).length / complexityTasks.length : 0;

			performanceByComplexity[complexity] = { avgTime, successRate };
		});

		return {
			totalTasks,
			completedTasks,
			failedTasks,
			completionRate,
			averageCompletionTime,
			mostCommonErrors,
			performanceByComplexity,
		};
	}

	// Update metrics based on task completion
	private updateTaskMetrics(task: TaskPerformance): void {
		this.metrics.totalTasksCompleted++;

		// Update success rate
		this.metrics.taskSuccessRate = this.taskHistory.filter((t) => t.success).length / this.taskHistory.length;

		// Update average completion time for successful tasks
		const successfulTasks = this.taskHistory.filter((t) => t.success);
		if (successfulTasks.length > 0) {
			this.metrics.taskCompletionTime =
				successfulTasks.reduce((sum, t) => sum + t.duration, 0) / successfulTasks.length;
		}

		// Update error rate
		this.metrics.errorRate = this.taskHistory.filter((t) => !t.success).length / this.taskHistory.length;

		this.metrics.timestamp = new Date();
	}

	// Get current metrics
	public getMetrics(): PerformanceMetrics {
		return { ...this.metrics };
	}

	// Get task history
	public getTaskHistory(): TaskPerformance[] {
		return [...this.taskHistory];
	}

	// Get performance score (0-100)
	public getPerformanceScore(): number {
		let score = 100;

		// Deduct points for poor performance
		if (this.metrics.pageLoadTime > 3000) score -= 20;
		else if (this.metrics.pageLoadTime > 2000) score -= 10;

		if (this.metrics.firstContentfulPaint > 2000) score -= 15;
		else if (this.metrics.firstContentfulPaint > 1000) score -= 5;

		if (this.metrics.largestContentfulPaint > 4000) score -= 20;
		else if (this.metrics.largestContentfulPaint > 2500) score -= 10;

		if (this.metrics.cumulativeLayoutShift > 0.25) score -= 25;
		else if (this.metrics.cumulativeLayoutShift > 0.1) score -= 10;

		if (this.metrics.firstInputDelay > 300) score -= 15;
		else if (this.metrics.firstInputDelay > 100) score -= 5;

		if (this.metrics.taskSuccessRate < 0.9) score -= 20;
		else if (this.metrics.taskSuccessRate < 0.95) score -= 10;

		if (this.metrics.errorRate > 0.1) score -= 25;
		else if (this.metrics.errorRate > 0.05) score -= 10;

		return Math.max(0, score);
	}

	// Generate session ID
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Export metrics for analytics
	public exportMetrics(): string {
		return JSON.stringify(
			{
				metrics: this.metrics,
				taskHistory: this.taskHistory,
				performanceScore: this.getPerformanceScore(),
				exportedAt: new Date().toISOString(),
			},
			null,
			2,
		);
	}

	// Cleanup observers
	public cleanup(): void {
		this.observers.forEach((observer) => observer.disconnect());
		this.observers = [];
	}

	// Reset metrics (for testing)
	public reset(): void {
		this.metrics = this.initializeMetrics();
		this.taskHistory = [];
		this.sessionId = this.generateSessionId();
	}
}

// Singleton instance
export const performanceObserver = PerformanceObserver.getInstance();

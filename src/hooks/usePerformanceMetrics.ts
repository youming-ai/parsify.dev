/**
 * Performance Monitoring Hooks
 * React hooks for monitoring performance metrics and user experience
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { performanceObserver } from '@/monitoring/performance-observer';
import { userAnalytics } from '@/monitoring/user-analytics';

// Performance metrics interface
export interface PerformanceMetrics {
	taskCompletionTime: number;
	taskSuccessRate: number;
	totalTasksCompleted: number;
	totalTasksAttempted: number;
	pageLoadTime: number;
	firstContentfulPaint: number;
	largestContentfulPaint: number;
	cumulativeLayoutShift: number;
	firstInputDelay: number;
	bundleSize: number;
	averageResponseTime: number;
	errorRate: number;
	performanceScore: number;
}

// Task performance interface
export interface TaskPerformance {
	taskId: string;
	taskName: string;
	startTime: number;
	endTime?: number;
	duration?: number;
	success: boolean;
	errorMessage?: string;
	inputSize?: number;
	outputSize?: number;
	memoryUsage?: number;
}

// Hook for monitoring overall performance metrics
export function usePerformanceMetrics() {
	const [metrics, setMetrics] = useState<PerformanceMetrics>(() => performanceObserver.getMetrics());
	const [isMonitoring, setIsMonitoring] = useState(true);

	// Update metrics periodically
	useEffect(() => {
		if (!isMonitoring) return;

		const interval = setInterval(() => {
			const newMetrics = performanceObserver.getMetrics();
			setMetrics(newMetrics);
		}, 1000); // Update every second

		return () => clearInterval(interval);
	}, [isMonitoring]);

	// Performance score calculation
	const performanceScore = useMemo(() => {
		return performanceObserver.getPerformanceScore();
	}, [metrics]);

	// Performance recommendations
	const recommendations = useMemo(() => {
		const score = performanceScore;
		const recs: string[] = [];

		if (score < 50) {
			recs.push('Critical performance issues detected. Optimize bundle size and loading times.');
		} else if (score < 70) {
			recs.push('Performance needs improvement. Consider optimizing images and code splitting.');
		} else if (score < 85) {
			recs.push('Good performance with room for minor optimizations.');
		}

		if (metrics.pageLoadTime > 3000) {
			recs.push('Page load time exceeds 3 seconds. Consider lazy loading and code splitting.');
		}

		if (metrics.firstContentfulPaint > 2000) {
			recs.push('First Contentful Paint is slow. Optimize critical rendering path.');
		}

		if (metrics.largestContentfulPaint > 4000) {
			recs.push('Largest Contentful Paint is slow. Optimize images and main content.');
		}

		if (metrics.cumulativeLayoutShift > 0.25) {
			recs.push('High Cumulative Layout Shift detected. Ensure proper image dimensions and font loading.');
		}

		if (metrics.firstInputDelay > 300) {
			recs.push('First Input Delay is high. Reduce JavaScript execution time.');
		}

		if (metrics.errorRate > 0.1) {
			recs.push('High error rate detected. Review error handling and input validation.');
		}

		return recs;
	}, [performanceScore, metrics]);

	return {
		metrics,
		performanceScore,
		recommendations,
		isMonitoring,
		setIsMonitoring,
	};
}

// Hook for monitoring individual task performance
export function useTaskPerformance(taskName: string) {
	const [tasks, setTasks] = useState<TaskPerformance[]>([]);
	const currentTaskRef = useRef<string | null>(null);

	// Start a new task
	const startTask = useCallback(
		(taskId?: string) => {
			const id = taskId || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			currentTaskRef.current = id;

			const task: TaskPerformance = {
				taskId: id,
				taskName,
				startTime: performance.now(),
				success: false,
			};

			setTasks((prev) => [...prev, task]);

			// Start monitoring with performance observer
			performanceObserver.startTask(id, taskName);

			userAnalytics.startTaskUsage(taskName.replace(/\s+/g, '-').toLowerCase(), taskName);

			return id;
		},
		[taskName],
	);

	// Complete current task
	const completeTask = useCallback(
		(
			taskId?: string,
			options: {
				outputSize?: number;
				success?: boolean;
				errorMessage?: string;
			} = {},
		) => {
			const id = taskId || currentTaskRef.current;
			if (!id) return;

			const endTime = performance.now();

			setTasks((prev) =>
				prev.map((task) => {
					if (task.taskId === id) {
						return {
							...task,
							endTime,
							duration: endTime - task.startTime,
							success: options.success !== false, // Default to true
							errorMessage: options.errorMessage,
							outputSize: options.outputSize,
						};
					}
					return task;
				}),
			);

			// Complete monitoring with performance observer
			if (options.success !== false) {
				performanceObserver.completeTask(id, options.outputSize);
			} else {
				performanceObserver.failTask(id, options.errorMessage || 'Task failed');
			}

			// Complete analytics tracking
			userAnalytics.completeTaskUsage(
				taskName.replace(/\s+/g, '-').toLowerCase(),
				options.success !== false,
				[],
				options.errorMessage ? [options.errorMessage] : [],
				undefined,
				options.outputSize,
			);

			currentTaskRef.current = null;
		},
		[taskName],
	);

	// Fail current task
	const failTask = useCallback(
		(errorMessage: string, taskId?: string) => {
			completeTask(taskId, {
				success: false,
				errorMessage,
			});
		},
		[completeTask],
	);

	// Get task statistics
	const taskStats = useMemo(() => {
		if (tasks.length === 0) {
			return {
				totalTasks: 0,
				successfulTasks: 0,
				failedTasks: 0,
				averageDuration: 0,
				successRate: 0,
				fastestTask: null as TaskPerformance | null,
				slowestTask: null as TaskPerformance | null,
			};
		}

		const successfulTasks = tasks.filter((t) => t.success && t.duration);
		const failedTasks = tasks.filter((t) => !t.success);

		const durations = successfulTasks.map((t) => t.duration!).filter((d) => d !== undefined);
		const averageDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;

		const fastestTask = successfulTasks.reduce(
			(fastest, current) => {
				if (!current.duration) return fastest;
				if (!fastest || current.duration < fastest.duration!) return current;
				return fastest;
			},
			null as TaskPerformance | null,
		);

		const slowestTask = successfulTasks.reduce(
			(slowest, current) => {
				if (!current.duration) return slowest;
				if (!slowest || current.duration > slowest.duration!) return current;
				return current;
			},
			null as TaskPerformance | null,
		);

		return {
			totalTasks: tasks.length,
			successfulTasks: successfulTasks.length,
			failedTasks: failedTasks.length,
			averageDuration,
			successRate: (successfulTasks.length / tasks.length) * 100,
			fastestTask,
			slowestTask,
		};
	}, [tasks]);

	// Clear task history
	const clearTasks = useCallback(() => {
		setTasks([]);
		currentTaskRef.current = null;
	}, []);

	return {
		startTask,
		completeTask,
		failTask,
		tasks,
		taskStats,
		currentTaskId: currentTaskRef.current,
		clearTasks,
	};
}

// Hook for monitoring resource performance
export function useResourcePerformance() {
	const [resources, setResources] = useState<PerformanceResourceTiming[]>([]);
	const [analysis, setAnalysis] = useState<{
		totalSize: number;
		totalTime: number;
		largestResource: PerformanceResourceTiming | null;
		slowestResource: PerformanceResourceTiming | null;
		resourceTypes: Record<string, { count: number; size: number; time: number }>;
	}>({
		totalSize: 0,
		totalTime: 0,
		largestResource: null,
		slowestResource: null,
		resourceTypes: {},
	});

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const analyzeResources = () => {
			const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
			setResources(resourceEntries);

			const resourceTypes: Record<string, { count: number; size: number; time: number }> = {};
			let totalSize = 0;
			let totalTime = 0;
			let largestResource: PerformanceResourceTiming | null = null;
			let slowestResource: PerformanceResourceTiming | null = null;

			resourceEntries.forEach((resource) => {
				const type = getResourceType(resource.name);
				const size = resource.transferSize || 0;
				const time = resource.responseEnd - resource.requestStart;

				if (!resourceTypes[type]) {
					resourceTypes[type] = { count: 0, size: 0, time: 0 };
				}
				resourceTypes[type].count++;
				resourceTypes[type].size += size;
				resourceTypes[type].time += time;

				totalSize += size;
				totalTime += time;

				if (!largestResource || size > (largestResource.transferSize || 0)) {
					largestResource = resource;
				}

				if (!slowestResource || time > slowestResource.responseEnd - slowestResource.requestStart) {
					slowestResource = resource;
				}
			});

			setAnalysis({
				totalSize,
				totalTime,
				largestResource,
				slowestResource,
				resourceTypes,
			});
		};

		// Initial analysis
		analyzeResources();

		// Monitor new resources
		const observer = new PerformanceObserver((list) => {
			analyzeResources();
		});

		if ('PerformanceObserver' in window) {
			observer.observe({ entryTypes: ['resource'] });
		}

		return () => {
			if ('disconnect' in observer) {
				observer.disconnect();
			}
		};
	}, []);

	// Get resource type from URL
	const getResourceType = (url: string): string => {
		const extension = url.split('.').pop()?.toLowerCase();

		if (extension) {
			const typeMap: Record<string, string> = {
				js: 'JavaScript',
				css: 'CSS',
				png: 'Image',
				jpg: 'Image',
				jpeg: 'Image',
				gif: 'Image',
				svg: 'SVG',
				webp: 'Image',
				woff: 'Font',
				woff2: 'Font',
				ttf: 'Font',
				eot: 'Font',
				mp4: 'Video',
				webm: 'Video',
				mp3: 'Audio',
				wav: 'Audio',
			};

			if (typeMap[extension]) {
				return typeMap[extension];
			}
		}

		if (url.includes('/api/')) return 'API';
		if (url.includes('analytics')) return 'Analytics';
		if (url.includes('fonts')) return 'Font';

		return 'Other';
	};

	// Get performance recommendations for resources
	const recommendations = useMemo(() => {
		const recs: string[] = [];

		if (analysis.totalSize > 5 * 1024 * 1024) {
			// 5MB
			recs.push('Total resource size is large. Consider optimizing images and enabling compression.');
		}

		if (analysis.totalTime > 5000) {
			// 5 seconds
			recs.push('Resource loading time is high. Consider using a CDN and enabling caching.');
		}

		const jsResources = analysis.resourceTypes['JavaScript'];
		if (jsResources && jsResources.size > 1024 * 1024) {
			// 1MB
			recs.push('JavaScript bundle is large. Consider code splitting and tree shaking.');
		}

		const imageResources = analysis.resourceTypes['Image'];
		if (imageResources && imageResources.size > 2 * 1024 * 1024) {
			// 2MB
			recs.push('Images are large. Consider using modern formats like WebP and implementing lazy loading.');
		}

		if (
			analysis.slowestResource &&
			analysis.slowestResource.responseEnd - analysis.slowestResource.requestStart > 3000
		) {
			recs.push(
				`Slow resource detected: ${analysis.slowestResource.name}. Consider optimizing or preloading critical resources.`,
			);
		}

		return recs;
	}, [analysis]);

	return {
		resources,
		analysis,
		recommendations,
	};
}

// Hook for monitoring Core Web Vitals
export function useCoreWebVitals() {
	const [vitals, setVitals] = useState({
		lcp: { value: 0, rating: 'good' as 'good' | 'needs-improvement' | 'poor' },
		fid: { value: 0, rating: 'good' as 'good' | 'needs-improvement' | 'poor' },
		cls: { value: 0, rating: 'good' as 'good' | 'needs-improvement' | 'poor' },
		fcp: { value: 0, rating: 'good' as 'good' | 'needs-improvement' | 'poor' },
		ttfb: { value: 0, rating: 'good' as 'good' | 'needs-improvement' | 'poor' },
	});

	const getRating = (value: number, thresholds: { good: number; poor: number }) => {
		if (value <= thresholds.good) return 'good';
		if (value <= thresholds.poor) return 'needs-improvement';
		return 'poor';
	};

	useEffect(() => {
		if (typeof window === 'undefined') return;

		// Largest Contentful Paint
		const observeLCP = () => {
			if ('PerformanceObserver' in window && 'largest-contentful-paint' in PerformanceObserver.supportedEntryTypes) {
				const observer = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					const lastEntry = entries[entries.length - 1];
					const value = lastEntry.startTime;

					setVitals((prev) => ({
						...prev,
						lcp: {
							value,
							rating: getRating(value, { good: 2500, poor: 4000 }),
						},
					}));
				});
				observer.observe({ entryTypes: ['largest-contentful-paint'] });
				return observer;
			}
			return null;
		};

		// First Input Delay
		const observeFID = () => {
			if ('PerformanceObserver' in window && 'first-input' in PerformanceObserver.supportedEntryTypes) {
				const observer = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					const firstEntry = entries[0];
					const value = firstEntry.processingStart - firstEntry.startTime;

					setVitals((prev) => ({
						...prev,
						fid: {
							value,
							rating: getRating(value, { good: 100, poor: 300 }),
						},
					}));
				});
				observer.observe({ entryTypes: ['first-input'] });
				return observer;
			}
			return null;
		};

		// Cumulative Layout Shift
		const observeCLS = () => {
			if ('PerformanceObserver' in window && 'layout-shift' in PerformanceObserver.supportedEntryTypes) {
				let clsValue = 0;
				const observer = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						if (!(entry as any).hadRecentInput) {
							clsValue += (entry as any).value;
						}
					}

					setVitals((prev) => ({
						...prev,
						cls: {
							value: clsValue,
							rating: getRating(clsValue, { good: 0.1, poor: 0.25 }),
						},
					}));
				});
				observer.observe({ entryTypes: ['layout-shift'] });
				return observer;
			}
			return null;
		};

		// First Contentful Paint
		const observeFCP = () => {
			const paintEntries = performance.getEntriesByType('paint');
			const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
			if (fcpEntry) {
				setVitals((prev) => ({
					...prev,
					fcp: {
						value: fcpEntry.startTime,
						rating: getRating(fcpEntry.startTime, { good: 1800, poor: 3000 }),
					},
				}));
			}
		};

		// Time to First Byte
		const observeTTFB = () => {
			const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
			if (navigationEntries.length > 0) {
				const nav = navigationEntries[0];
				const value = nav.responseStart - nav.requestStart;

				setVitals((prev) => ({
					...prev,
					ttfb: {
						value,
						rating: getRating(value, { good: 800, poor: 1800 }),
					},
				}));
			}
		};

		const observers: (PerformanceObserver | null)[] = [];

		observers.push(observeLCP());
		observers.push(observeFID());
		observers.push(observeCLS());

		observeFCP();
		observeTTFB();

		return () => {
			observers.forEach((observer) => {
				if (observer && 'disconnect' in observer) {
					observer.disconnect();
				}
			});
		};
	}, []);

	// Overall Core Web Vitals score
	const overallScore = useMemo(() => {
		const ratings = Object.values(vitals).map((vital) => vital.rating);
		const goodCount = ratings.filter((rating) => rating === 'good').length;
		return Math.round((goodCount / ratings.length) * 100);
	}, [vitals]);

	return {
		vitals,
		overallScore,
	};
}

// Hook for monitoring bundle size
export function useBundleSize() {
	const [bundleInfo, setBundleInfo] = useState({
		totalSize: 0,
		jsSize: 0,
		cssSize: 0,
		imageSize: 0,
		fontSize: 0,
		otherSize: 0,
	});

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const analyzeBundleSize = () => {
			const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

			let totalSize = 0;
			let jsSize = 0;
			let cssSize = 0;
			let imageSize = 0;
			let fontSize = 0;
			let otherSize = 0;

			resources.forEach((resource) => {
				const size = resource.transferSize || 0;
				const url = resource.name.toLowerCase();

				totalSize += size;

				if (url.includes('.js')) {
					jsSize += size;
				} else if (url.includes('.css')) {
					cssSize += size;
				} else if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)/)) {
					imageSize += size;
				} else if (url.match(/\.(woff|woff2|ttf|eot)/)) {
					fontSize += size;
				} else {
					otherSize += size;
				}
			});

			setBundleInfo({
				totalSize,
				jsSize,
				cssSize,
				imageSize,
				fontSize,
				otherSize,
			});
		};

		// Initial analysis
		setTimeout(analyzeBundleSize, 2000); // Wait for resources to load

		// Monitor new resources
		const observer = new PerformanceObserver(analyzeBundleSize);
		if ('PerformanceObserver' in window) {
			observer.observe({ entryTypes: ['resource'] });
		}

		return () => {
			if ('disconnect' in observer) {
				observer.disconnect();
			}
		};
	}, []);

	// Bundle size recommendations
	const recommendations = useMemo(() => {
		const recs: string[] = [];
		const totalSizeMB = bundleInfo.totalSize / (1024 * 1024);
		const jsSizeMB = bundleInfo.jsSize / (1024 * 1024);

		if (totalSizeMB > 1) {
			recs.push(`Total bundle size is ${totalSizeMB.toFixed(2)}MB. Consider optimizing assets.`);
		}

		if (jsSizeMB > 0.5) {
			recs.push(`JavaScript bundle is ${jsSizeMB.toFixed(2)}MB. Consider code splitting and tree shaking.`);
		}

		if (bundleInfo.imageSize > 1024 * 1024) {
			recs.push('Images are large. Consider using modern formats and lazy loading.');
		}

		if (bundleInfo.fontSize > 500 * 1024) {
			recs.push('Font files are large. Consider font subsetting and modern font formats.');
		}

		return recs;
	}, [bundleInfo]);

	return {
		bundleInfo,
		recommendations,
		isWithinLimits: bundleInfo.totalSize < 500 * 1024, // 500KB limit
	};
}

export default {
	usePerformanceMetrics,
	useTaskPerformance,
	useResourcePerformance,
	useCoreWebVitals,
	useBundleSize,
};

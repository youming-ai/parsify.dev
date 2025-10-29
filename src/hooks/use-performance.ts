/**
 * 性能监控 Hook
 * 监控组件加载、渲染和用户交互性能
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
	componentLoadTime?: number;
	renderTime?: number;
	interactionTime?: number;
	memoryUsage?: number;
	isVisible?: boolean;
}

interface UsePerformanceOptions {
	trackRenderTime?: boolean;
	trackMemoryUsage?: boolean;
	trackVisibility?: boolean;
	componentName?: string;
}

export function usePerformance(options: UsePerformanceOptions = {}) {
	const {
		trackRenderTime = true,
		trackMemoryUsage = true,
		trackVisibility = true,
		componentName = 'Unknown',
	} = options;

	const [metrics, setMetrics] = useState<PerformanceMetrics>({});
	const startTimeRef = useRef<number>(Date.now());
	const renderStartTimeRef = useRef<number>(0);
	const visibilityObserverRef = useRef<IntersectionObserver | null>(null);

	// 记录组件加载时间
	useEffect(() => {
		const loadTime = Date.now() - startTimeRef.current;
		setMetrics((prev) => ({ ...prev, componentLoadTime: loadTime }));

		console.log('Component loaded', loadTime, {
			componentName,
			type: 'component_load',
		});
	}, [componentName]);

	// 记录渲染时间
	useEffect(() => {
		if (trackRenderTime) {
			renderStartTimeRef.current = performance.now();

			const rafId = requestAnimationFrame(() => {
				if (renderStartTimeRef.current) {
					const renderTime = performance.now() - renderStartTimeRef.current;
					setMetrics((prev) => ({ ...prev, renderTime }));

					console.log('Component rendered', renderTime, {
						componentName,
						type: 'component_render',
					});
				}
			});

			return () => cancelAnimationFrame(rafId);
		}
	}, [trackRenderTime, componentName]);

	// 监控内存使用
	useEffect(() => {
		if (trackMemoryUsage && 'memory' in performance) {
			const updateMemoryUsage = () => {
				const memory = (performance as any).memory;
				if (memory) {
					const memoryUsage = memory.usedJSHeapSize;
					setMetrics((prev) => ({ ...prev, memoryUsage }));
				}
			};

			// 初始记录
			updateMemoryUsage();

			// 定期记录内存使用
			const intervalId = setInterval(updateMemoryUsage, 5000);

			return () => clearInterval(intervalId);
		}
	}, [trackMemoryUsage]);

	// 监控可见性
	useEffect(() => {
		if (trackVisibility && typeof window !== 'undefined') {
			const element = document.querySelector(`[data-component="${componentName}"]`);

			if (element && 'IntersectionObserver' in window) {
				visibilityObserverRef.current = new IntersectionObserver(
					([entry]) => {
						setMetrics((prev) => ({
							...prev,
							isVisible: entry.isIntersecting,
						}));
					},
					{ threshold: 0.1 },
				);

				visibilityObserverRef.current.observe(element);
			}

			return () => {
				if (visibilityObserverRef.current) {
					visibilityObserverRef.current.disconnect();
				}
			};
		}
	}, [trackVisibility, componentName]);

	// 记录交互时间
	const trackInteraction = useCallback(
		(action: string) => {
			const interactionTime = performance.now();
			setMetrics((prev) => ({ ...prev, interactionTime }));

			console.log(`User interaction: ${action}`, 0, {
				componentName,
				type: 'user_interaction',
				action,
			});
		},
		[componentName],
	);

	// 获取性能报告
	const getPerformanceReport = useCallback(() => {
		return {
			componentName,
			metrics,
			timestamp: new Date().toISOString(),
			browserInfo: {
				userAgent: navigator.userAgent,
				language: navigator.language,
				platform: navigator.platform,
			},
		};
	}, [componentName, metrics]);

	return {
		metrics,
		trackInteraction,
		getPerformanceReport,
	};
}

// 页面级性能监控 Hook
export function usePagePerformance(pageName: string) {
	const [pageLoadTime, setPageLoadTime] = useState<number>();
	const [firstContentfulPaint, setFirstContentfulPaint] = useState<number>();

	useEffect(() => {
		// 记录页面加载时间
		if ('navigation' in performance) {
			const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
			const loadTime = navigationEntry.loadEventEnd - navigationEntry.loadEventStart;
			setPageLoadTime(loadTime);

			console.log('Page loaded', loadTime, {
				pageName,
				type: 'page_load',
				domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
			});
		}

		// 记录首次内容绘制时间
		if ('PerformanceObserver' in window) {
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.name === 'first-contentful-paint') {
						setFirstContentfulPaint(entry.startTime);

						console.log('First Contentful Paint', entry.startTime, {
							pageName,
							type: 'fcp',
						});
					}
				}
			});

			observer.observe({ entryTypes: ['paint'] });

			return () => observer.disconnect();
		}
	}, [pageName]);

	return {
		pageLoadTime,
		firstContentfulPaint,
	};
}

// 网络性能监控 Hook
export function useNetworkPerformance() {
	const [networkInfo, setNetworkInfo] = useState<{
		effectiveType?: string;
		downlink?: number;
		rtt?: number;
		saveData?: boolean;
	}>({});

	useEffect(() => {
		if ('connection' in navigator) {
			const connection = (navigator as any).connection;

			const updateNetworkInfo = () => {
				setNetworkInfo({
					effectiveType: connection.effectiveType,
					downlink: connection.downlink,
					rtt: connection.rtt,
					saveData: connection.saveData,
				});
			};

			updateNetworkInfo();

			connection.addEventListener('change', updateNetworkInfo);

			return () => {
				connection.removeEventListener('change', updateNetworkInfo);
			};
		}
	}, []);

	return networkInfo;
}

// 资源加载性能监控
export function useResourcePerformance() {
	const [resourceMetrics, setResourceMetrics] = useState<
		Array<{
			name: string;
			type: string;
			duration: number;
			size: number;
		}>
	>([]);

	useEffect(() => {
		if ('PerformanceObserver' in window) {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const newMetrics = entries.map((entry) => {
					const resourceEntry = entry as PerformanceResourceTiming;
					return {
						name: entry.name,
						type: resourceEntry.initiatorType || 'unknown',
						duration: entry.duration,
						size: resourceEntry.transferSize || 0,
					};
				});

				setResourceMetrics((prev) => [...prev, ...newMetrics]);
			});

			observer.observe({ entryTypes: ['resource'] });

			return () => observer.disconnect();
		}
	}, []);

	return resourceMetrics;
}

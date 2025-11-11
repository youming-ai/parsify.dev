/**
 * Keyboard Navigation Integration
 * Integrates keyboard navigation with existing monitoring and accessibility systems
 */

'use client';

import { shortcutManager } from './shortcut-system';
import { AccessibilityIntegration } from '@/monitoring/accessibility-integration';
import { AccessibilityAudit } from '@/monitoring/accessibility-audit';
import { announceToScreenReader } from './utils';

export interface NavigationMetrics {
	keyboardOnlyUsers: number;
	screenReaderUsers: number;
	shortcutUsage: Record<string, number>;
	focusManagementScore: number; // 0-100
	navigationEfficiency: number; // 0-100
	errorRate: number; // 0-1
	accessibilityComplaints: number;
}

export interface NavigationEvent {
	type: 'navigation' | 'shortcut' | 'focus' | 'error' | 'accessibility-issue';
	timestamp: Date;
	context: string;
	details: Record<string, any>;
	userAgent: string;
}

/**
 * Keyboard Navigation Integration Service
 */
export class KeyboardNavigationIntegration {
	private static instance: KeyboardNavigationIntegration;
	private events: NavigationEvent[] = [];
	private metrics: NavigationMetrics;
	private isEnabled = false;

	private constructor() {
		this.metrics = {
			keyboardOnlyUsers: 0,
			screenReaderUsers: 0,
			shortcutUsage: {},
			focusManagementScore: 85,
			navigationEfficiency: 75,
			errorRate: 0.05,
			accessibilityComplaints: 0,
		};
	}

	public static getInstance(): KeyboardNavigationIntegration {
		if (!KeyboardNavigationIntegration.instance) {
			KeyboardNavigationIntegration.instance = new KeyboardNavigationIntegration();
		}
		return KeyboardNavigationIntegration.instance;
	}

	/**
	 * Initialize keyboard navigation integration
	 */
	public initialize(): void {
		if (this.isEnabled) return;

		this.setupShortcutTracking();
		this.setupFocusManagementMonitoring();
		this.setupAccessibilityMonitoring();
		this.setupPerformanceMonitoring();

		this.isEnabled = true;
	}

	/**
	 * Setup shortcut usage tracking
	 */
	private setupShortcutTracking(): void {
		shortcutManager.addEventListener('shortcut:executed', (event) => {
			this.recordEvent({
				type: 'shortcut',
				timestamp: new Date(),
				context: 'shortcut-execution',
				details: {
					shortcutId: event.shortcutId,
					shortcut: event.shortcut.description,
				},
				userAgent: navigator.userAgent,
			});

			// Update metrics
			this.metrics.shortcutUsage[event.shortcutId] =
				(this.metrics.shortcutUsage[event.shortcutId] || 0) + 1;
		});
	}

	/**
	 * Setup focus management monitoring
	 */
	private setupFocusManagementMonitoring(): void {
		// Monitor focus events
		document.addEventListener('focusin', (event) => {
			const target = event.target as HTMLElement;
			const isInFocusTrap = target.closest('[data-focus-trap="true"]');
			const isInFocusGroup = target.closest('[data-focus-group]');
			const hasTabIndex = target.hasAttribute('tabindex');

			this.recordEvent({
				type: 'focus',
				timestamp: new Date(),
				context: 'focus-management',
				details: {
					element: target.tagName.toLowerCase(),
					hasTabIndex,
					isInFocusTrap: !!isInFocusTrap,
					isInFocusGroup: !!isInFocusGroup,
				},
				userAgent: navigator.userAgent,
			});
		}, true);

		// Monitor keyboard navigation patterns
		document.addEventListener('keydown', (event) => {
			const isNavigationKey = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key);

			if (isNavigationKey) {
				this.recordEvent({
					type: 'navigation',
					timestamp: new Date(),
					context: 'keyboard-navigation',
					details: {
						key: event.key,
						hasModifiers: event.ctrlKey || event.shiftKey || event.altKey || event.metaKey,
					},
					userAgent: navigator.userAgent,
				});
			}
		}, true);
	}

	/**
	 * Setup accessibility monitoring
	 */
	private setupAccessibilityMonitoring(): void {
		// Monitor screen reader usage through accessibility APIs
		if ('matchMedia' in window) {
			const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
			const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
			const prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)');

			const updateScreenReaderMetrics = () => {
				// Estimate screen reader usage through various signals
				const signals = [
					prefersReducedMotion.matches,
					prefersHighContrast.matches,
					navigator.userAgent.includes('NVDA') || navigator.userAgent.includes('JAWS') || navigator.userAgent.includes('VoiceOver'),
					// Add more signals as needed
				];

				const screenReaderLikelihood = signals.filter(Boolean).length / signals.length;
				this.metrics.screenReaderUsers = Math.round(screenReaderLikelihood * 100); // Percentage

				this.recordEvent({
					type: 'accessibility-issue',
					timestamp: new Date(),
					context: 'screen-reader-detection',
					details: {
						signals,
						likelihood: screenReaderLikelihood,
						prefersReducedMotion: prefersReducedMotion.matches,
						prefersHighContrast: prefersHighContrast.matches,
					},
					userAgent: navigator.userAgent,
				});
			};

			prefersReducedMotion.addEventListener('change', updateScreenReaderMetrics);
			prefersHighContrast.addEventListener('change', updateScreenReaderMetrics);
			updateScreenReaderMetrics(); // Initial check
		}

		// Monitor accessibility audit results
		const audit = AccessibilityAudit.getInstance();
		if (audit) {
			// Hook into audit system to track accessibility issues
			setInterval(() => {
				const auditResults = audit.runFullAudit();
				const focusIssues = auditResults.issues.filter(issue =>
					issue.rule.toLowerCase().includes('focus') ||
					issue.rule.toLowerCase().includes('keyboard') ||
					issue.rule.toLowerCase().includes('tab')
				);

				if (focusIssues.length > 0) {
					this.recordEvent({
						type: 'accessibility-issue',
						timestamp: new Date(),
						context: 'focus-management-audit',
						details: {
							issueCount: focusIssues.length,
							issues: focusIssues.map(issue => ({
								rule: issue.rule,
								impact: issue.impact,
								description: issue.description,
							})),
						},
						userAgent: navigator.userAgent,
					});
				}

				// Update focus management score based on audit results
				const maxScore = 100;
				const penaltyPerIssue = 10;
				this.metrics.focusManagementScore = Math.max(
					0,
					maxScore - (focusIssues.length * penaltyPerIssue)
				);
			}, 30000); // Check every 30 seconds
		}
	}

	/**
	 * Setup performance monitoring
	 */
	private setupPerformanceMonitoring(): void {
		// Monitor keyboard navigation performance
		let lastNavigationTime = Date.now();

		document.addEventListener('keydown', (event) => {
			const isNavigationKey = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);

			if (isNavigationKey) {
				const currentTime = Date.now();
				const timeSinceLastNavigation = currentTime - lastNavigationTime;
				lastNavigationTime = currentTime;

				// Track navigation efficiency (faster is better, but too fast might indicate issues)
				if (timeSinceLastNavigation < 100) {
					// Very fast navigation - might indicate keyboard trap or rapid tabbing
					this.metrics.navigationEfficiency = Math.max(0, this.metrics.navigationEfficiency - 1);
				} else if (timeSinceLastNavigation > 1000) {
					// Slow navigation - might indicate cognitive load or difficulty
					this.metrics.navigationEfficiency = Math.max(0, this.metrics.navigationEfficiency - 0.5);
				} else {
					// Good pace
					this.metrics.navigationEfficiency = Math.min(100, this.metrics.navigationEfficiency + 0.1);
				}
			}
		});
	}

	/**
	 * Record a navigation event
	 */
	private recordEvent(event: NavigationEvent): void {
		this.events.push(event);

		// Keep only last 1000 events to prevent memory issues
		if (this.events.length > 1000) {
			this.events = this.events.slice(-1000);
		}

		// Announce to screen reader for important events
		if (event.type === 'accessibility-issue') {
			announceToScreenReader(`Accessibility issue detected: ${event.context}`, 'assertive');
		}
	}

	/**
	 * Get current navigation metrics
	 */
	public getMetrics(): NavigationMetrics {
		return { ...this.metrics };
	}

	/**
	 * Get navigation events
	 */
	public getEvents(limit?: number): NavigationEvent[] {
		return limit ? this.events.slice(-limit) : [...this.events];
	}

	/**
	 * Get navigation analytics
	 */
	public getAnalytics(): {
		summary: {
			totalEvents: number;
			shortcutsUsed: number;
			avgNavigationEfficiency: number;
			focusScore: number;
		};
		topShortcuts: Array<{ id: string; count: number }>;
		commonIssues: Array<{ context: string; count: number }>;
		recommendations: string[];
	} {
		const totalEvents = this.events.length;
		const shortcutsUsed = Object.keys(this.metrics.shortcutUsage).length;
		const avgNavigationEfficiency = this.metrics.navigationEfficiency;
		const focusScore = this.metrics.focusManagementScore;

		// Top shortcuts
		const topShortcuts = Object.entries(this.metrics.shortcutUsage)
			.map(([id, count]) => ({ id, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		// Common issues
		const issueCounts: Record<string, number> = {};
		this.events
			.filter(event => event.type === 'accessibility-issue')
			.forEach(event => {
				issueCounts[event.context] = (issueCounts[event.context] || 0) + 1;
			});

		const commonIssues = Object.entries(issueCounts)
			.map(([context, count]) => ({ context, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		// Generate recommendations
		const recommendations: string[] = [];

		if (this.metrics.focusManagementScore < 80) {
			recommendations.push('Focus management needs improvement - check for keyboard traps and missing focus indicators');
		}

		if (this.metrics.navigationEfficiency < 70) {
			recommendations.push('Navigation efficiency is low - consider improving tab order and adding keyboard shortcuts');
		}

		if (shortcutsUsed < 10) {
			recommendations.push('Low shortcut usage - consider adding more keyboard shortcuts or improving discovery');
		}

		if (commonIssues.length > 0) {
			recommendations.push(`Address common accessibility issues: ${commonIssues.map(issue => issue.context).join(', ')}`);
		}

		return {
			summary: {
				totalEvents,
				shortcutsUsed,
				avgNavigationEfficiency,
				focusScore,
			},
			topShortcuts,
			commonIssues,
			recommendations,
		};
	}

	/**
	 * Integrate with monitoring systems
	 */
	public integrateWithMonitoring(): void {
		// Integrate with Accessibility Integration
		const accessibilityIntegration = AccessibilityIntegration.getInstance();
		if (accessibilityIntegration) {
			// Add navigation metrics to accessibility reports
			const originalPerformIntegration = accessibilityIntegration.performIntegration.bind(accessibilityIntegration);

			accessibilityIntegration.performIntegration = async () => {
				const report = await originalPerformIntegration();

				// Add navigation metrics to the report
				report.userAnalyticsIntegration.userBehaviorByAccessibility.push({
					userType: 'keyboard-only',
					sessionDuration: 10, // Average session for keyboard users
					pageViews: 8,
					taskCompletionRate: 0.88,
					errorRate: this.metrics.errorRate,
					featureUsage: {
						'keyboard-shortcuts': Object.keys(this.metrics.shortcutUsage).length,
						'focus-navigation': 1,
						'screen-reader': this.metrics.screenReaderUsers / 100,
					},
					navigationPatterns: ['tab-navigation', 'shortcuts'],
					commonBarriers: commonIssues.map(issue => issue.context),
					satisfactionScore: Math.min(5, this.metrics.focusManagementScore / 20),
				});

				return report;
			};
		}
	}

	/**
	 * Cleanup integration
	 */
	public cleanup(): void {
		this.isEnabled = false;
		this.events = [];
	}
}

// Export singleton instance
export const keyboardNavigationIntegration = KeyboardNavigationIntegration.getInstance();

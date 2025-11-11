/**
 * Accessibility Integration
 * Integrates new screen reader features with existing accessibility infrastructure
 */

import { ScreenReaderManager } from './screen-reader';
import { ScreenReaderTestSuite } from './screen-reader-testing';
import { accessibilityUtils } from './accessibility';

// Enhanced Accessibility Manager
export class EnhancedAccessibilityManager {
	private static instance: EnhancedAccessibilityManager;
	private screenReaderManager: ScreenReaderManager;
	private testSuite: ScreenReaderTestSuite;
	private isInitialized = false;
	private integrationConfig: AccessibilityIntegrationConfig;

	private constructor() {
		this.screenReaderManager = ScreenReaderManager.getInstance();
		this.testSuite = ScreenReaderTestSuite.getInstance();
		this.integrationConfig = this.getDefaultIntegrationConfig();
	}

	public static getInstance(): EnhancedAccessibilityManager {
		if (!EnhancedAccessibilityManager.instance) {
			EnhancedAccessibilityManager.instance = new EnhancedAccessibilityManager();
		}
		return EnhancedAccessibilityManager.instance;
	}

	// Initialize enhanced accessibility features
	public async initialize(config?: Partial<AccessibilityIntegrationConfig>): Promise<void> {
		if (this.isInitialized) {
			console.warn('Enhanced accessibility already initialized');
			return;
		}

		// Merge configuration
		this.integrationConfig = { ...this.integrationConfig, ...config };

		console.log('Initializing enhanced accessibility features...');

		try {
			// Initialize screen reader manager
			this.initializeScreenReaderManager();

			// Set up auto-testing if enabled
			if (this.integrationConfig.enableAutoTesting) {
				this.setupAutoTesting();
			}

			// Set up performance monitoring
			if (this.integrationConfig.enablePerformanceMonitoring) {
				this.setupPerformanceMonitoring();
			}

			// Set up user preference detection
			this.setupUserPreferenceDetection();

			// Set up integration with existing utils
			this.setupAccessibilityUtilsIntegration();

			// Set up keyboard navigation enhancements
			this.setupKeyboardNavigationEnhancements();

			// Set up live region management
			this.setupLiveRegionManagement();

			// Initialize ARIA enhancements
			this.initializeAriaEnhancements();

			this.isInitialized = true;
			console.log('Enhanced accessibility features initialized successfully');

		} catch (error) {
			console.error('Failed to initialize enhanced accessibility:', error);
			throw error;
		}
	}

	// Initialize screen reader manager integration
	private initializeScreenReaderManager(): void {
		// Set up enhanced announcements
		const originalAnnounce = this.screenReaderManager.announce.bind(this.screenReaderManager);

		this.screenReaderManager.announce = (message, options = {}) => {
			// Enhanced message processing
			const processedMessage = this.processAnnouncementMessage(message);

			// Add context if available
			const contextMessage = this.addContextToMessage(processedMessage);

			// Call original announce with enhanced message
			originalAnnounce(contextMessage, options);

			// Log announcement for debugging if enabled
			if (this.integrationConfig.debugMode) {
				console.log(`[Screen Reader] ${contextMessage}`);
			}
		};

		// Set up enhanced error handling
		const originalAnnounceError = this.screenReaderManager.announceError.bind(this.screenReaderManager);

		this.screenReaderManager.announceError = (error, context) => {
			// Enhanced error processing
			const enhancedError = this.processErrorMessage(error, context);
			originalAnnounceError(enhancedError.error, enhancedError.context);
		};
	}

	// Setup automatic testing
	private setupAutoTesting(): void {
		// Run tests on page load
		if (this.integrationConfig.runTestsOnLoad) {
			setTimeout(() => {
				this.runAccessibilityTest();
			}, 2000); // Wait for page to fully load
		}

		// Set up periodic testing
		if (this.integrationConfig.testIntervalMinutes && this.integrationConfig.testIntervalMinutes > 0) {
			setInterval(() => {
				this.runAccessibilityTest();
			}, this.integrationConfig.testIntervalMinutes * 60 * 1000);
		}

		// Set up change detection
		if (this.integrationConfig.enableChangeDetection) {
			this.setupChangeDetection();
		}
	}

	// Setup performance monitoring
	private setupPerformanceMonitoring(): void {
		// Monitor accessibility feature performance
		const observer = new PerformanceObserver((list) => {
			const entries = list.getEntries();

			entries.forEach((entry) => {
				if (entry.name.includes('accessibility') || entry.name.includes('screen-reader')) {
					this.trackAccessibilityPerformance(entry);
				}
			});
		});

		observer.observe({ entryTypes: ['measure', 'navigation'] });
	}

	// Setup user preference detection
	private setupUserPreferenceDetection(): void {
		// Enhanced preference detection
		const checkAccessibilityPreferences = () => {
			const preferences = {
				screenReader: this.screenReaderManager.isScreenReaderDetected(),
				reducedMotion: accessibilityUtils.prefersReducedMotion(),
				highContrast: accessibilityUtils.prefersHighContrast(),
				keyboardNavigation: accessibilityUtils.isKeyboardNavigation(),
				fontSize: this.detectFontSizePreference(),
				colorScheme: this.detectColorSchemePreference(),
			};

			// Update screen reader preferences
			this.screenReaderManager.updatePreferences({
				announcementsEnabled: preferences.screenReader || preferences.keyboardNavigation,
				verbosity: this.determineVerbosityLevel(preferences),
			} as any);

			// Apply preference-based enhancements
			this.applyPreferenceEnhancements(preferences);

			// Store preferences for analytics
			this.storeUserPreferences(preferences);
		};

		// Initial check
		checkAccessibilityPreferences();

		// Set up listeners for preference changes
		const mediaQueries = [
			window.matchMedia('(prefers-reduced-motion: reduce)'),
			window.matchMedia('(prefers-contrast: high)'),
			window.matchMedia('(prefers-color-scheme: dark)'),
		];

		mediaQueries.forEach((mq) => {
			if (mq.addEventListener) {
				mq.addEventListener('change', checkAccessibilityPreferences);
			} else {
				// Fallback for older browsers
				mq.addListener(checkAccessibilityPreferences);
			}
		});

		// Listen for font size changes
		const resizeObserver = new ResizeObserver(() => {
			checkAccessibilityPreferences();
		});

		resizeObserver.observe(document.documentElement);
	}

	// Setup accessibility utils integration
	private setupAccessibilityUtilsIntegration(): void {
		// Enhance existing accessibility utils with screen reader features

		// Enhanced focus management
		const originalSetFocus = accessibilityUtils.setFocus.bind(accessibilityUtils);

		accessibilityUtils.setFocus = (element, scrollIntoView = true) => {
			originalSetFocus(element, scrollIntoView);

			// Announce focus change for screen readers
			const label = this.getElementLabel(element);
			if (label) {
				this.screenReaderManager.announce(`Focused on ${label}`, { priority: 'polite' });
			}
		};

		// Enhanced trap focus
		const originalTrapFocus = accessibilityUtils.trapFocus.bind(accessibilityUtils);

		accessibilityUtils.trapFocus = (container) => {
			const cleanup = originalTrapFocus(container);

			// Announce focus trap activation
			this.screenReaderManager.announce('Focus trapped within container', { priority: 'polite' });

			return () => {
				cleanup();
				this.screenReaderManager.announce('Focus trap removed', { priority: 'polite' });
			};
		};
	}

	// Setup keyboard navigation enhancements
	private setupKeyboardNavigationEnhancements(): void {
		// Enhanced keyboard navigation
		const setupKeyboardEnhancements = () => {
			// Add keyboard shortcuts for screen readers
			document.addEventListener('keydown', (e) => {
				// Ctrl+Alt+A: Toggle accessibility mode
				if (e.ctrlKey && e.altKey && e.key === 'a') {
					e.preventDefault();
					this.toggleAccessibilityMode();
				}

				// Ctrl+Alt+S: Skip to main content
				if (e.ctrlKey && e.altKey && e.key === 's') {
					e.preventDefault();
					this.skipToMainContent();
				}

				// Ctrl+Alt+T: Run accessibility test
				if (e.ctrlKey && e.altKey && e.key === 't') {
					e.preventDefault();
					this.runAccessibilityTest();
				}

				// Ctrl+Alt+R: Read current page
				if (e.ctrlKey && e.altKey && e.key === 'r') {
					e.preventDefault();
					this.readCurrentPage();
				}
			});

			// Add landmark navigation
			this.setupLandmarkNavigation();
		};

		setupKeyboardEnhancements();
	}

	// Setup live region management
	private setupLiveRegionManagement(): void {
		// Create default live regions if they don't exist
		const ensureLiveRegions = () => {
			const regions = [
				{ id: 'screen-reader-polite', politeness: 'polite' as const },
				{ id: 'screen-reader-assertive', politeness: 'assertive' as const },
				{ id: 'screen-reader-status', politeness: 'polite' as const },
			];

			regions.forEach(region => {
				if (!document.getElementById(region.id)) {
					this.screenReaderManager.createCustomLiveRegion(region.id, region.politeness);
				}
			});
		};

		ensureLiveRegions();

		// Set up dynamic content monitoring
		this.setupDynamicContentMonitoring();
	}

	// Initialize ARIA enhancements
	private initializeAriaEnhancements(): void {
		// Enhanced ARIA attribute management
		const enhanceAriaAttributes = () => {
			// Add ARIA landmarks
			this.addAriaLandmarks();

			// Enhance form elements
			this.enhanceFormAria();

			// Add page structure ARIA
			this.addPageStructureAria();

			// Add navigation ARIA
			this.addNavigationAria();
		};

		// Run enhancements and set up observer for dynamic content
		enhanceAriaAttributes();

		const mutationObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
					// Re-run enhancements when new content is added
					setTimeout(enhanceAriaAttributes, 100);
				}
			});
		});

		mutationObserver.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	// Setup change detection for auto-testing
	private setupChangeDetection(): void {
		let lastTestTime = Date.now();
		const testCooldown = 5000; // 5 seconds between tests

		const observer = new MutationObserver(() => {
			const now = Date.now();
			if (now - lastTestTime > testCooldown) {
				lastTestTime = now;
				// Debounced test run
				setTimeout(() => {
					if (this.integrationConfig.enableChangeDetection) {
						this.runQuickAccessibilityTest();
					}
				}, 1000);
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['aria-*', 'role', 'tabindex'],
		});
	}

	// Run accessibility test
	public async runAccessibilityTest(): Promise<void> {
		try {
			console.log('Running accessibility test...');

			const result = await this.testSuite.runFullTestSuite();

			// Store result for analytics
			this.storeTestResult(result);

			// Announce results to screen readers
			this.announceTestResults(result);

			// Trigger alerts if critical issues found
			if (result.summary.criticalIssues > 0) {
				this.triggerCriticalIssuesAlert(result);
			}

			console.log(`Accessibility test completed with score: ${result.overallScore}/100`);
		} catch (error) {
			console.error('Accessibility test failed:', error);
			this.screenReaderManager.announceError('Accessibility test failed to complete');
		}
	}

	// Run quick accessibility test
	public async runQuickAccessibilityTest(): Promise<void> {
		// Simplified test for change detection
		try {
			const criticalIssues = await this.checkCriticalIssues();

			if (criticalIssues.length > 0) {
				this.screenReaderManager.announceError(
					`${criticalIssues.length} critical accessibility issue${criticalIssues.length !== 1 ? 's' : ''} detected`
				);
			}
		} catch (error) {
			console.error('Quick accessibility test failed:', error);
		}
	}

	// Check for critical issues
	private async checkCriticalIssues(): Promise<string[]> {
		const issues: string[] = [];

		// Check for missing alt text on images
		const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]');
		if (imagesWithoutAlt.length > 0) {
			issues.push(`${imagesWithoutAlt.length} images missing alt text`);
		}

		// Check for missing form labels
		const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
		if (inputsWithoutLabels.length > 0) {
			issues.push(`${inputsWithoutLabels.length} form inputs missing labels`);
		}

		// Check for improper heading structure
		const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
		let lastLevel = 0;
		for (const heading of headings) {
			const level = parseInt(heading.tagName.substring(1));
			if (level > lastLevel + 1) {
				issues.push('Improper heading hierarchy detected');
				break;
			}
			lastLevel = level;
		}

		return issues;
	}

	// Message processing utilities
	private processAnnouncementMessage(message: string): string {
		// Enhanced message processing
		let processed = message.trim();

		// Add context about current page/section
		const pageContext = this.getCurrentPageContext();
		if (pageContext && !processed.toLowerCase().includes(pageContext.toLowerCase())) {
			processed = `${pageContext}: ${processed}`;
		}

		// Expand abbreviations
		processed = this.expandAbbreviations(processed);

		// Add punctuation if needed
		if (!processed.match(/[.!?]$/)) {
			processed += '.';
		}

		return processed;
	}

	private processErrorMessage(error: string | Error, context?: string): { error: string; context: string } {
		const errorMessage = error instanceof Error ? error.message : error;
		const enhancedContext = context || this.getCurrentPageContext();

		return {
			error: `Error: ${errorMessage}`,
			context: enhancedContext,
		};
	}

	private addContextToMessage(message: string): string {
		const context = this.getCurrentContext();
		return context ? `${context} - ${message}` : message;
	}

	// Helper methods
	private getDefaultIntegrationConfig(): AccessibilityIntegrationConfig {
		return {
			enableAutoTesting: false,
			enablePerformanceMonitoring: true,
			enableChangeDetection: false,
			runTestsOnLoad: false,
			testIntervalMinutes: 60,
			debugMode: false,
		};
	}

	private getCurrentPageContext(): string {
		const title = document.title;
		const heading = document.querySelector('h1')?.textContent;
		return heading || title || 'Page';
	}

	private getCurrentContext(): string {
		const focusedElement = document.activeElement;
		if (focusedElement) {
			return this.getElementLabel(focusedElement);
		}
		return '';
	}

	private getElementLabel(element: Element): string {
		// Get accessible label for element
		if (element.id) {
			const label = document.querySelector(`label[for="${element.id}"]`);
			if (label) return label.textContent || '';
		}

		const ariaLabel = element.getAttribute('aria-label');
		if (ariaLabel) return ariaLabel;

		const ariaLabelledBy = element.getAttribute('aria-labelledby');
		if (ariaLabelledBy) {
			const ids = ariaLabelledBy.split(' ');
			const labels = ids.map(id => {
				const el = document.getElementById(id);
				return el?.textContent || '';
			}).filter(Boolean);
			return labels.join(' ');
		}

		return element.textContent || element.getAttribute('title') || element.tagName.toLowerCase();
	}

	private expandAbbreviations(text: string): string {
		const abbreviations: Record<string, string> = {
			JSON: 'J S O N',
			API: 'A P I',
			HTML: 'H T M L',
			CSS: 'C S S',
			URL: 'U R L',
			XML: 'X M L',
			CSV: 'C S V',
			UI: 'U I',
			UX: 'U X',
		};

		let expanded = text;
		Object.entries(abbreviations).forEach(([abbr, expansion]) => {
			const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
			expanded = expanded.replace(regex, expansion);
		});

		return expanded;
	}

	private detectFontSizePreference(): 'small' | 'normal' | 'large' {
		const fontSize = window.getComputedStyle(document.documentElement).fontSize;
		const size = parseFloat(fontSize);

		if (size < 14) return 'small';
		if (size > 18) return 'large';
		return 'normal';
	}

	private detectColorSchemePreference(): 'light' | 'dark' | 'high-contrast' {
		if (window.matchMedia('(prefers-contrast: high)').matches) {
			return 'high-contrast';
		}

		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}

		return 'light';
	}

	private determineVerbosityLevel(preferences: any): 'minimal' | 'normal' | 'verbose' {
		// Determine verbosity based on user preferences
		if (preferences.screenReader) return 'normal';
		if (preferences.keyboardNavigation) return 'verbose';
		return 'minimal';
	}

	private applyPreferenceEnhancements(preferences: any): void {
		// Apply accessibility enhancements based on user preferences
		document.body.classList.toggle('high-contrast', preferences.highContrast);
		document.body.classList.toggle('reduced-motion', preferences.reducedMotion);
		document.body.classList.toggle('keyboard-navigation', preferences.keyboardNavigation);
		document.body.classList.toggle('screen-reader-active', preferences.screenReader);
	}

	private storeUserPreferences(preferences: any): void {
		// Store preferences for analytics and personalization
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
		}
	}

	private trackAccessibilityPerformance(entry: PerformanceEntry): void {
		// Track performance of accessibility features
		if (this.integrationConfig.debugMode) {
			console.log(`[Accessibility Performance] ${entry.name}: ${entry.duration}ms`);
		}
	}

	private toggleAccessibilityMode(): void {
		const isActive = document.body.classList.contains('accessibility-mode');
		document.body.classList.toggle('accessibility-mode');

		const mode = isActive ? 'disabled' : 'enabled';
		this.screenReaderManager.announce(`Accessibility mode ${mode}`);
	}

	private skipToMainContent(): void {
		const mainContent = document.querySelector('main, [role="main"], #main');
		if (mainContent) {
			(mainContent as HTMLElement).focus();
			this.screenReaderManager.announce('Skipped to main content');
		}
	}

	private readCurrentPage(): void {
		const title = document.title;
		const mainContent = document.querySelector('main, [role="main"]');
		const text = mainContent?.textContent || '';

		this.screenReaderManager.announce(`Page: ${title}. ${text.substring(0, 200)}...`);
	}

	private setupLandmarkNavigation(): void {
		// Add keyboard shortcuts for landmark navigation
		const landmarks = {
			'main': 'main, [role="main"]',
			'navigation': 'nav, [role="navigation"]',
			'banner': 'header, [role="banner"]',
			'contentinfo': 'footer, [role="contentinfo"]',
			'search': '[role="search"]',
			'complementary': 'aside, [role="complementary"]',
		};

		Object.entries(landmarks).forEach(([name, selector]) => {
			const element = document.querySelector(selector);
			if (element) {
				element.setAttribute('data-landmark', name);
			}
		});
	}

	private addAriaLandmarks(): void {
		// Add missing ARIA landmarks
		if (!document.querySelector('main, [role="main"]')) {
			const main = document.querySelector('.main-content, .content, #content');
			if (main) {
				main.setAttribute('role', 'main');
			}
		}

		if (!document.querySelector('nav, [role="navigation"]')) {
			const nav = document.querySelector('.navigation, .nav, #nav');
			if (nav) {
				nav.setAttribute('role', 'navigation');
			}
		}
	}

	private enhanceFormAria(): void {
		// Enhance form elements with ARIA
		const forms = document.querySelectorAll('form');
		forms.forEach(form => {
			if (!form.hasAttribute('aria-label') && !form.hasAttribute('aria-labelledby')) {
				const title = form.querySelector('h1, h2, h3, legend');
				if (title) {
					const id = `form-label-${Date.now()}`;
					title.id = id;
					form.setAttribute('aria-labelledby', id);
				}
			}
		});
	}

	private addPageStructureAria(): void {
		// Add page structure ARIA
		if (!document.querySelector('[role="banner"]')) {
			const header = document.querySelector('header');
			if (header) {
				header.setAttribute('role', 'banner');
			}
		}

		if (!document.querySelector('[role="contentinfo"]')) {
			const footer = document.querySelector('footer');
			if (footer) {
				footer.setAttribute('role', 'contentinfo');
			}
		}
	}

	private addNavigationAria(): void {
		// Add navigation ARIA
		const menus = document.querySelectorAll('.menu, .navbar, [role="menubar"]');
		menus.forEach(menu => {
			if (!menu.hasAttribute('role')) {
				menu.setAttribute('role', 'navigation');
			}
		});
	}

	private setupDynamicContentMonitoring(): void {
		// Monitor dynamic content changes for announcements
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === Node.ELEMENT_NODE) {
							const element = node as Element;

							// Check for important dynamic content
							if (element.matches('[role="alert"], [role="status"], .alert, .notification, .message')) {
								const text = element.textContent;
								if (text) {
									this.screenReaderManager.announce(text, { priority: 'polite' });
								}
							}
						}
					});
				}
			});
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	private storeTestResult(result: any): void {
		// Store test results for analytics
		if (typeof localStorage !== 'undefined') {
			const existingResults = JSON.parse(localStorage.getItem('accessibility-test-results') || '[]');
			existingResults.push({
				timestamp: new Date().toISOString(),
				score: result.overallScore,
				issues: result.summary.totalIssues,
			});

			// Keep only last 10 results
			existingResults.splice(0, existingResults.length - 10);

			localStorage.setItem('accessibility-test-results', JSON.stringify(existingResults));
		}
	}

	private announceTestResults(result: any): void {
		const score = result.overallScore;
		const issues = result.summary.totalIssues;

		let message = `Accessibility test completed with score ${score} out of 100`;

		if (issues > 0) {
			message += `. ${issues} issue${issues !== 1 ? 's' : ''} found`;
		}

		if (result.complianceStatus.certified) {
			message += `. WCAG ${result.complianceStatus.level} compliant`;
		}

		this.screenReaderManager.announce(message);
	}

	private triggerCriticalIssuesAlert(result: any): void {
		const criticalIssues = result.summary.criticalIssues;
		if (criticalIssues > 0) {
			// Could trigger a more prominent alert or notification
			console.warn(`Critical accessibility issues detected: ${criticalIssues}`);
		}
	}

	// Public API methods
	public getIntegrationStatus(): AccessibilityIntegrationStatus {
		return {
			initialized: this.isInitialized,
			screenReaderDetected: this.screenReaderManager.isScreenReaderDetected(),
			configuration: this.integrationConfig,
			lastTestResult: this.getLastTestResult(),
		};
	}

	public updateConfiguration(config: Partial<AccessibilityIntegrationConfig>): void {
		this.integrationConfig = { ...this.integrationConfig, ...config };
	}

	private getLastTestResult(): any {
		if (typeof localStorage !== 'undefined') {
			const results = JSON.parse(localStorage.getItem('accessibility-test-results') || '[]');
			return results[results.length - 1] || null;
		}
		return null;
	}
}

// Type definitions
export interface AccessibilityIntegrationConfig {
	enableAutoTesting: boolean;
	enablePerformanceMonitoring: boolean;
	enableChangeDetection: boolean;
	runTestsOnLoad: boolean;
	testIntervalMinutes: number;
	debugMode: boolean;
}

export interface AccessibilityIntegrationStatus {
	initialized: boolean;
	screenReaderDetected: boolean;
	configuration: AccessibilityIntegrationConfig;
	lastTestResult: any;
}

export default EnhancedAccessibilityManager;

/**
 * Screen Reader Testing and Validation Tools
 * Comprehensive testing suite for screen reader compatibility and accessibility validation
 */

import { ScreenReaderManager } from './screen-reader';

// Screen Reader Test Suite
export class ScreenReaderTestSuite {
	private static instance: ScreenReaderTestSuite;
	private testResults: ScreenReaderTestResult[] = [];
	private testCategories: TestCategory[] = [];
	private validators: AccessibilityValidator[] = [];

	private constructor() {
		this.initializeTestCategories();
		this.initializeValidators();
	}

	public static getInstance(): ScreenReaderTestSuite {
		if (!ScreenReaderTestSuite.instance) {
			ScreenReaderTestSuite.instance = new ScreenReaderTestSuite();
		}
		return ScreenReaderTestSuite.instance;
	}

	// Initialize test categories
	private initializeTestCategories(): void {
		this.testCategories = [
			{
				id: 'aria-labels',
				name: 'ARIA Labels and Descriptions',
				description: 'Tests for proper ARIA labels, descriptions, and roles',
				weight: 0.2,
				tests: [
					{
						id: 'aria-labels-required',
						name: 'Required ARIA Labels',
						description: 'Check for missing required ARIA labels',
						severity: 'critical',
						testFn: this.testRequiredAriaLabels.bind(this),
					},
					{
						id: 'aria-labels-content',
						name: 'ARIA Label Content',
						description: 'Check for empty or descriptive ARIA labels',
						severity: 'serious',
						testFn: this.testAriaLabelContent.bind(this),
					},
					{
						id: 'aria-describedby',
						name: 'ARIA DescribedBy References',
						description: 'Check for valid aria-describedby references',
						severity: 'serious',
						testFn: this.testAriaDescribedBy.bind(this),
					},
				],
			},
			{
				id: 'focus-management',
				name: 'Focus Management',
				description: 'Tests for keyboard navigation and focus handling',
				weight: 0.25,
				tests: [
					{
						id: 'focus-trap',
						name: 'Focus Trapping',
						description: 'Check for proper focus trapping in modals and dialogs',
						severity: 'critical',
						testFn: this.testFocusTrapping.bind(this),
					},
					{
						id: 'focus-order',
						name: 'Focus Order',
						description: 'Check for logical focus order',
						severity: 'serious',
						testFn: this.testFocusOrder.bind(this),
					},
					{
						id: 'focus-indicators',
						name: 'Focus Indicators',
						description: 'Check for visible focus indicators',
						severity: 'moderate',
						testFn: this.testFocusIndicators.bind(this),
					},
				],
			},
			{
				id: 'live-regions',
				name: 'Live Regions',
				description: 'Tests for proper live region implementation',
				weight: 0.2,
				tests: [
					{
						id: 'live-region-attributes',
						name: 'Live Region Attributes',
						description: 'Check for correct aria-live attributes',
						severity: 'serious',
						testFn: this.testLiveRegionAttributes.bind(this),
					},
					{
						id: 'live-region-politeness',
						name: 'Live Region Politeness',
						description: 'Check for appropriate politeness levels',
						severity: 'moderate',
						testFn: this.testLiveRegionPoliteness.bind(this),
					},
				],
			},
			{
				id: 'semantic-markup',
				name: 'Semantic Markup',
				description: 'Tests for proper semantic HTML and landmark roles',
				weight: 0.15,
				tests: [
					{
						id: 'headings-hierarchy',
						name: 'Heading Hierarchy',
						description: 'Check for logical heading structure',
						severity: 'serious',
						testFn: this.testHeadingHierarchy.bind(this),
					},
					{
						id: 'landmarks',
						name: 'Landmark Roles',
						description: 'Check for proper landmark implementation',
						severity: 'moderate',
						testFn: this.testLandmarks.bind(this),
					},
				],
			},
			{
				id: 'form-accessibility',
				name: 'Form Accessibility',
				description: 'Tests for accessible form controls',
				weight: 0.2,
				tests: [
					{
						id: 'form-labels',
						name: 'Form Labels',
						description: 'Check for proper form labels',
						severity: 'critical',
						testFn: this.testFormLabels.bind(this),
					},
					{
						id: 'form-validation',
						name: 'Form Validation',
						description: 'Check for accessible form validation messages',
						severity: 'serious',
						testFn: this.testFormValidation.bind(this),
					},
				],
			},
		];
	}

	// Initialize validators
	private initializeValidators(): void {
		this.validators = [
			new AriaLabelValidator(),
			new FocusManagementValidator(),
			new LiveRegionValidator(),
			new SemanticMarkupValidator(),
			new FormAccessibilityValidator(),
		];
	}

	// Run full test suite
	public async runFullTestSuite(): Promise<ScreenReaderTestSuiteResult> {
		const startTime = performance.now();
		const results: ScreenReaderTestResult[] = [];

		console.log('Starting screen reader accessibility test suite...');

		for (const category of this.testCategories) {
			console.log(`Testing category: ${category.name}`);

			for (const test of category.tests) {
				try {
					const result = await this.runSingleTest(test, category);
					results.push(result);
				} catch (error) {
					console.error(`Test ${test.id} failed:`, error);
					results.push({
						testId: test.id,
						testName: test.name,
						category: category.id,
						status: 'error',
						score: 0,
						issues: [{
							type: 'test-error',
							severity: 'critical',
							element: 'test-framework',
							description: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
							impact: 'Testing could not be completed',
							recommendation: 'Check test configuration and try again',
							wcagLevel: 'N/A',
						}],
						metadata: {
							duration: 0,
							elementsTested: 0,
							timestamp: new Date(),
							testVersion: '1.0.0',
						},
					});
				}
			}
		}

		// Run additional validators
		for (const validator of this.validators) {
			try {
				const validationResult = await validator.validate();
				results.push(validationResult);
			} catch (error) {
				console.error(`Validator ${validator.name} failed:`, error);
			}
		}

		// Calculate overall score
		const overallScore = this.calculateOverallScore(results);

		// Generate summary
		const summary = this.generateTestSummary(results);

		// Calculate duration
		const duration = performance.now() - startTime;

		const suiteResult: ScreenReaderTestSuiteResult = {
			suiteId: this.generateSuiteId(),
			timestamp: new Date(),
			duration,
			overallScore,
			summary,
			results,
			categories: this.testCategories,
			recommendations: this.generateRecommendations(results),
			complianceStatus: this.assessComplianceStatus(overallScore),
		};

		// Store results
		this.testResults.push(...results);

		console.log(`Screen reader test suite completed in ${Math.round(duration)}ms with score ${overallScore}/100`);

		return suiteResult;
	}

	// Run a single test
	private async runSingleTest(test: ScreenReaderTest, category: TestCategory): Promise<ScreenReaderTestResult> {
		const startTime = performance.now();

		try {
			const issues = await test.testFn();
			const duration = performance.now() - startTime;
			const score = this.calculateTestScore(issues, test.severity);
			const elementsTested = this.countTestedElements();

			return {
				testId: test.id,
				testName: test.name,
				category: category.id,
				status: issues.length > 0 ? 'failed' : 'passed',
				score,
				issues,
				metadata: {
					duration,
					elementsTested,
					timestamp: new Date(),
					testVersion: '1.0.0',
					severity: test.severity,
				},
			};
		} catch (error) {
			const duration = performance.now() - startTime;

			return {
				testId: test.id,
				testName: test.name,
				category: category.id,
				status: 'error',
				score: 0,
				issues: [{
					type: 'test-execution-error',
					severity: 'critical',
					element: 'test-framework',
					description: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
					impact: 'Test could not be completed',
					recommendation: 'Review test implementation and try again',
					wcagLevel: 'N/A',
				}],
				metadata: {
					duration,
					elementsTested: 0,
					timestamp: new Date(),
					testVersion: '1.0.0',
					severity: test.severity,
				},
			};
		}
	}

	// Calculate overall score
	private calculateOverallScore(results: ScreenReaderTestResult[]): number {
		if (results.length === 0) return 0;

		// Weighted score based on test categories
		const categoryScores: Record<string, number[]> = {};

		results.forEach(result => {
			if (!categoryScores[result.category]) {
				categoryScores[result.category] = [];
			}
			categoryScores[result.category].push(result.score);
		});

		let totalWeightedScore = 0;
		let totalWeight = 0;

		this.testCategories.forEach(category => {
			const scores = categoryScores[category.id] || [];
			if (scores.length > 0) {
				const categoryAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length;
				totalWeightedScore += categoryAverage * category.weight;
				totalWeight += category.weight;
			}
		});

		return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
	}

	// Calculate individual test score
	private calculateTestScore(issues: AccessibilityIssue[], severity: ScreenReaderTest['severity']): number {
		if (issues.length === 0) return 100;

		const severityWeights = {
			critical: 4,
			serious: 3,
			moderate: 2,
			minor: 1,
		};

		const severityLimits = {
			critical: 0,
			serious: 20,
			moderate: 50,
			minor: 80,
		};

		const maxSeverity = Math.max(...issues.map(issue => severityWeights[issue.severity]));
		const severityType = Object.entries(severityWeights).find(([_, weight]) => weight === maxSeverity)?.[0] as keyof typeof severityLimits;

		return severityLimits[severityType];
	}

	// Generate test summary
	private generateTestSummary(results: ScreenReaderTestResult[]): TestSuiteSummary {
		const totalTests = results.length;
		const passedTests = results.filter(r => r.status === 'passed').length;
		const failedTests = results.filter(r => r.status === 'failed').length;
		const errorTests = results.filter(r => r.status === 'error').length;

		const allIssues = results.flatMap(r => r.issues);
		const criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
		const seriousIssues = allIssues.filter(i => i.severity === 'serious').length;
		const moderateIssues = allIssues.filter(i => i.severity === 'moderate').length;
		const minorIssues = allIssues.filter(i => i.severity === 'minor').length;

		return {
			totalTests,
			passedTests,
			failedTests,
			errorTests,
			passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
			totalIssues: allIssues.length,
			criticalIssues,
			seriousIssues,
			moderateIssues,
			minorIssues,
		};
	}

	// Generate recommendations
	private generateRecommendations(results: ScreenReaderTestResult[]): AccessibilityRecommendation[] {
		const recommendations: AccessibilityRecommendation[] = [];
		const allIssues = results.flatMap(r => r.issues);

		// Group issues by type
		const issuesByType = allIssues.reduce((acc, issue) => {
			if (!acc[issue.type]) {
				acc[issue.type] = [];
			}
			acc[issue.type].push(issue);
			return acc;
		}, {} as Record<string, AccessibilityIssue[]>);

		// Generate recommendations for each issue type
		Object.entries(issuesByType).forEach(([type, issues]) => {
			const criticalCount = issues.filter(i => i.severity === 'critical').length;
			const priority = criticalCount > 0 ? 'critical' : issues.some(i => i.severity === 'serious') ? 'high' : 'medium';

			recommendations.push({
				id: `rec-${type}`,
				title: this.getRecommendationTitle(type),
				description: this.getRecommendationDescription(type),
				priority,
				impact: this.estimateImpact(issues),
				effort: this.estimateEffort(issues),
				issues: issues.map(i => i.element),
				wcagLevel: this.getHighestWCAGLevel(issues),
			});
		});

		// Sort by priority and impact
		return recommendations.sort((a, b) => {
			const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
			const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
			const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

			if (aPriority !== bPriority) {
				return bPriority - aPriority;
			}

			return b.impact - a.impact;
		});
	}

	// Assess compliance status
	private assessComplianceStatus(score: number): ComplianceStatus {
		if (score >= 95) {
			return { level: 'AAA', certified: true, issuesRemaining: 0 };
		} else if (score >= 85) {
			return { level: 'AA', certified: true, issuesRemaining: 'minor' };
		} else if (score >= 70) {
			return { level: 'AA', certified: false, issuesRemaining: 'moderate' };
		} else if (score >= 50) {
			return { level: 'A', certified: false, issuesRemaining: 'significant' };
		} else {
			return { level: 'A', certified: false, issuesRemaining: 'extensive' };
		}
	}

	// Helper methods
	private generateSuiteId(): string {
		return `suite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private countTestedElements(): number {
		return document.querySelectorAll('*').length;
	}

	private getRecommendationTitle(type: string): string {
		const titles: Record<string, string> = {
			'missing-aria-label': 'Add Missing ARIA Labels',
			'invalid-focus-order': 'Fix Focus Order Issues',
			'no-live-region': 'Implement Live Regions',
			'invalid-heading-structure': 'Fix Heading Hierarchy',
			'missing-form-labels': 'Add Form Labels',
		};
		return titles[type] || 'Fix Accessibility Issues';
	}

	private getRecommendationDescription(type: string): string {
		const descriptions: Record<string, string> = {
			'missing-aria-label': 'Add descriptive ARIA labels to interactive elements that lack proper labeling',
			'invalid-focus-order': 'Ensure keyboard navigation follows a logical order that matches the visual layout',
			'no-live-region': 'Implement live regions for dynamic content updates to inform screen reader users',
			'invalid-heading-structure': 'Maintain a logical heading hierarchy without skipping levels',
			'missing-form-labels': 'Associate all form controls with proper labels using label elements or aria-label attributes',
		};
		return descriptions[type] || 'Address accessibility issues to improve screen reader compatibility';
	}

	private estimateImpact(issues: AccessibilityIssue[]): number {
		return issues.length * 10; // Simple estimation
	}

	private estimateEffort(issues: AccessibilityIssue[]): 'low' | 'medium' | 'high' {
		if (issues.length <= 3) return 'low';
		if (issues.length <= 10) return 'medium';
		return 'high';
	}

	private getHighestWCAGLevel(issues: AccessibilityIssue[]): 'A' | 'AA' | 'AAA' {
		if (issues.some(i => i.wcagLevel === 'AAA')) return 'AAA';
		if (issues.some(i => i.wcagLevel === 'AA')) return 'AA';
		return 'A';
	}

	// Individual test implementations
	private async testRequiredAriaLabels(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		const interactiveElements = document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]');

		interactiveElements.forEach((element) => {
			const hasAriaLabel = element.hasAttribute('aria-label');
			const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
			const hasTextContent = element.textContent?.trim();
			const hasTitle = element.hasAttribute('title');
			const isImageButton = element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'image';

			if (!hasAriaLabel && !hasAriaLabelledBy && !hasTextContent && !hasTitle && !isImageButton) {
				issues.push({
					type: 'missing-aria-label',
					severity: 'critical',
					element: this.getElementSelector(element),
					description: 'Interactive element lacks accessible label',
					impact: 'Screen reader users cannot understand the purpose of this element',
					recommendation: 'Add aria-label, aria-labelledby, or visible text content',
					wcagLevel: 'A',
				});
			}
		});

		return issues;
	}

	private async testAriaLabelContent(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		const elementsWithAriaLabel = document.querySelectorAll('[aria-label], [aria-labelledby]');

		elementsWithAriaLabel.forEach((element) => {
			const ariaLabel = element.getAttribute('aria-label');
			const ariaLabelledBy = element.getAttribute('aria-labelledby');

			if (ariaLabel && ariaLabel.trim().length === 0) {
				issues.push({
					type: 'empty-aria-label',
					severity: 'serious',
					element: this.getElementSelector(element),
					description: 'Element has empty aria-label attribute',
					impact: 'Screen readers announce empty label which is confusing',
					recommendation: 'Provide meaningful description in aria-label or use aria-labelledby',
					wcagLevel: 'A',
				});
			}

			if (ariaLabelledBy) {
				const referencedIds = ariaLabelledBy.split(' ').map(id => id.trim());
				referencedIds.forEach(id => {
					const referencedElement = document.getElementById(id);
					if (!referencedElement) {
						issues.push({
							type: 'invalid-aria-labelledby',
							severity: 'serious',
							element: this.getElementSelector(element),
							description: `aria-labelledby references non-existent element: ${id}`,
							impact: 'Screen readers cannot find the referenced label',
							recommendation: `Ensure element with id "${id}" exists or update aria-labelledby`,
							wcagLevel: 'A',
						});
					}
				});
			}
		});

		return issues;
	}

	private async testAriaDescribedBy(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		const elementsWithAriaDescribedBy = document.querySelectorAll('[aria-describedby]');

		elementsWithAriaDescribedBy.forEach((element) => {
			const ariaDescribedBy = element.getAttribute('aria-describedby');

			if (ariaDescribedBy) {
				const referencedIds = ariaDescribedBy.split(' ').map(id => id.trim());
				referencedIds.forEach(id => {
					const referencedElement = document.getElementById(id);
					if (!referencedElement) {
						issues.push({
							type: 'invalid-aria-describedby',
							severity: 'serious',
							element: this.getElementSelector(element),
							description: `aria-describedby references non-existent element: ${id}`,
							impact: 'Screen readers cannot find the referenced description',
							recommendation: `Ensure element with id "${id}" exists or update aria-describedby`,
							wcagLevel: 'A',
						});
					}
				});
			}
		});

		return issues;
	}

	private async testFocusTrapping(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		const modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');

		modals.forEach((modal) => {
			const focusableElements = modal.querySelectorAll(
				'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			);

			if (focusableElements.length === 0) {
				issues.push({
					type: 'no-focusable-elements-in-modal',
					severity: 'critical',
					element: this.getElementSelector(modal),
					description: 'Modal/dialog has no focusable elements',
					impact: 'Keyboard users cannot interact with modal content',
					recommendation: 'Add at least one focusable element or close mechanism',
					wcagLevel: 'A',
				});
			}
		});

		return issues;
	}

	private async testFocusOrder(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		const focusableElements = Array.from(document.querySelectorAll(
			'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		));

		// Check for positive tabindex values that disrupt natural order
		focusableElements.forEach((element) => {
			const tabindex = element.getAttribute('tabindex');
			if (tabindex && parseInt(tabindex) > 0) {
				issues.push({
					type: 'positive-tabindex',
					severity: 'moderate',
					element: this.getElementSelector(element),
					description: 'Element has positive tabindex which disrupts natural focus order',
					impact: 'Keyboard navigation may not follow logical page order',
					recommendation: 'Remove positive tabindex and rely on natural document order',
					wcagLevel: 'A',
				});
			}
		});

		return issues;
	}

	private async testFocusIndicators(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		// Check for focus styles
		const style = document.createElement('style');
		style.textContent = `
			.test-focus { outline: 2px solid red; }
		`;
		document.head.appendChild(style);

		const focusableElements = document.querySelectorAll('button, a, input, select, textarea');
		let hasFocusIndicator = false;

		// Check computed styles for focus indicators
		Array.from(focusableElements).forEach((element) => {
			const computedStyles = window.getComputedStyle(element, ':focus');
			const hasOutline = computedStyles.outline !== 'none' && computedStyles.outline !== '0px';
			const hasBoxShadow = computedStyles.boxShadow !== 'none';
			const hasBorderStyle = computedStyles.borderStyle !== 'none' && parseInt(computedStyles.borderWidth) > 0;

			if (hasOutline || hasBoxShadow || hasBorderStyle) {
				hasFocusIndicator = true;
			}
		});

		document.head.removeChild(style);

		if (!hasFocusIndicator) {
			issues.push({
				type: 'no-focus-indicator',
				severity: 'serious',
				element: 'document',
				description: 'No visible focus indicators found for interactive elements',
				impact: 'Keyboard users cannot see which element is currently focused',
				recommendation: 'Add visible focus styles using CSS :focus or :focus-visible',
				wcagLevel: 'AA',
			});
		}

		return issues;
	}

	private async testLiveRegionAttributes(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		const liveRegions = document.querySelectorAll('[aria-live]');

		liveRegions.forEach((region) => {
			const ariaLive = region.getAttribute('aria-live');

			if (ariaLive && !['polite', 'assertive', 'off'].includes(ariaLive)) {
				issues.push({
					type: 'invalid-aria-live',
					severity: 'moderate',
					element: this.getElementSelector(region),
					description: `Invalid aria-live value: ${ariaLive}`,
					impact: 'Screen readers may not correctly handle the live region',
					recommendation: 'Use valid aria-live value: polite, assertive, or off',
					wcagLevel: 'A',
				});
			}
		});

		return issues;
	}

	private async testLiveRegionPoliteness(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		const liveRegions = document.querySelectorAll('[aria-live]');

		// Check for potentially aggressive use of assertive live regions
		const assertiveRegions = Array.from(liveRegions).filter(
			region => region.getAttribute('aria-live') === 'assertive'
		);

		if (assertiveRegions.length > 3) {
			issues.push({
				type: 'too-many-assertive-regions',
				severity: 'moderate',
				element: 'document',
				description: 'Too many assertive live regions may interrupt users',
				impact: 'Screen reader users may experience frequent interruptions',
				recommendation: 'Limit assertive live regions and use polite where possible',
				wcagLevel: 'AA',
			});
		}

		return issues;
	}

	private async testHeadingHierarchy(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

		for (let i = 1; i < headings.length; i++) {
			const currentHeading = headings[i];
			const previousHeading = headings[i - 1];

			const currentLevel = parseInt(currentHeading.tagName.substring(1));
			const previousLevel = parseInt(previousHeading.tagName.substring(1));

			if (currentLevel > previousLevel + 1) {
				issues.push({
					type: 'skipped-heading-level',
					severity: 'moderate',
					element: this.getElementSelector(currentHeading),
					description: `Heading level skipped: H${previousLevel} to H${currentLevel}`,
					impact: 'Screen reader users may lose context in document structure',
					recommendation: 'Use proper heading hierarchy without skipping levels',
					wcagLevel: 'A',
				});
			}
		}

		return issues;
	}

	private async testLandmarks(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		// Check for multiple main landmarks
		const mainElements = document.querySelectorAll('main, [role="main"]');
		if (mainElements.length > 1) {
			issues.push({
				type: 'multiple-main-landmarks',
				severity: 'moderate',
				element: 'document',
				description: 'Multiple main landmarks found',
				impact: 'Screen readers may have difficulty identifying primary content',
				recommendation: 'Use only one main landmark per page',
				wcagLevel: 'A',
			});
		}

		// Check for missing main landmark in content-rich pages
		const hasContent = document.body.textContent?.trim().length || 0 > 200;
		if (hasContent && mainElements.length === 0) {
			issues.push({
				type: 'missing-main-landmark',
				severity: 'moderate',
				element: 'document',
				description: 'No main landmark found on content page',
				impact: 'Screen reader users cannot quickly navigate to main content',
				recommendation: 'Add main landmark or role="main" to primary content area',
				wcagLevel: 'A',
			});
		}

		return issues;
	}

	private async testFormLabels(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		const formControls = document.querySelectorAll('input, select, textarea');

		formControls.forEach((control) => {
			const type = control.getAttribute('type');
			const isHidden = type === 'hidden';
			const isSubmit = type === 'submit' || type === 'button';

			if (!isHidden && !isSubmit) {
				const hasLabel = document.querySelector(`label[for="${control.id}"]`);
				const hasAriaLabel = control.hasAttribute('aria-label');
				const hasAriaLabelledBy = control.hasAttribute('aria-labelledby');
				const hasTitle = control.hasAttribute('title');
				const hasPlaceholder = control.hasAttribute('placeholder');

				if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !hasPlaceholder) {
					issues.push({
						type: 'missing-form-label',
						severity: 'critical',
						element: this.getElementSelector(control),
						description: 'Form control lacks accessible label',
						impact: 'Screen reader users cannot understand the purpose of this form field',
						recommendation: 'Add label element, aria-label, or aria-labelledby attribute',
						wcagLevel: 'A',
					});
				}
			}
		});

		return issues;
	}

	private async testFormValidation(): Promise<AccessibilityIssue[]> {
		const issues: AccessibilityIssue[] = [];

		const requiredFields = document.querySelectorAll('[required], [aria-required="true"]');

		requiredFields.forEach((field) => {
			const hasAriaInvalid = field.hasAttribute('aria-invalid');
			const hasValidationMessage = field.hasAttribute('aria-describedby') ||
				field.hasAttribute('aria-errormessage');

			if (!hasAriaInvalid && !hasValidationMessage) {
				issues.push({
					type: 'missing-form-validation',
					severity: 'serious',
					element: this.getElementSelector(field),
					description: 'Required field lacks validation attributes',
					impact: 'Screen readers may not provide feedback on validation errors',
					recommendation: 'Add aria-invalid and aria-describedby or aria-errormessage attributes',
					wcagLevel: 'A',
				});
			}
		});

		return issues;
	}

	private getElementSelector(element: Element): string {
		if (element.id) return `#${element.id}`;
		if (element.className) return `.${element.className.split(' ').join('.')}`;
		return element.tagName.toLowerCase();
	}
}

// Accessibility Validator Interface
abstract class AccessibilityValidator {
	abstract name: string;
	abstract validate(): Promise<ScreenReaderTestResult>;
}

// Concrete Validators
class AriaLabelValidator extends AccessibilityValidator {
	name = 'ARIA Label Validator';

	async validate(): Promise<ScreenReaderTestResult> {
		const testSuite = ScreenReaderTestSuite.getInstance();
		const issues: AccessibilityIssue[] = [];

		// Similar to testRequiredAriaLabels and testAriaLabelContent
		const ariaLabelIssues = await testSuite.testRequiredAriaLabels();
		const ariaContentIssues = await testSuite.testAriaLabelContent();

		issues.push(...ariaLabelIssues, ...ariaContentIssues);

		return {
			testId: 'aria-label-validator',
			testName: this.name,
			category: 'aria-labels',
			status: issues.length > 0 ? 'failed' : 'passed',
			score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 10)),
			issues,
			metadata: {
				duration: 0,
				elementsTested: document.querySelectorAll('[aria-label], [aria-labelledby]').length,
				timestamp: new Date(),
				testVersion: '1.0.0',
				severity: 'serious',
			},
		};
	}
}

class FocusManagementValidator extends AccessibilityValidator {
	name = 'Focus Management Validator';

	async validate(): Promise<ScreenReaderTestResult> {
		const testSuite = ScreenReaderTestSuite.getInstance();
		const issues: AccessibilityIssue[] = [];

		const focusTrapIssues = await testSuite.testFocusTrapping();
		const focusOrderIssues = await testSuite.testFocusOrder();
		const focusIndicatorIssues = await testSuite.testFocusIndicators();

		issues.push(...focusTrapIssues, ...focusOrderIssues, ...focusIndicatorIssues);

		return {
			testId: 'focus-management-validator',
			testName: this.name,
			category: 'focus-management',
			status: issues.length > 0 ? 'failed' : 'passed',
			score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 8)),
			issues,
			metadata: {
				duration: 0,
				elementsTested: document.querySelectorAll('button, a, input, select, textarea').length,
				timestamp: new Date(),
				testVersion: '1.0.0',
				severity: 'serious',
			},
		};
	}
}

class LiveRegionValidator extends AccessibilityValidator {
	name = 'Live Region Validator';

	async validate(): Promise<ScreenReaderTestResult> {
		const testSuite = ScreenReaderTestSuite.getInstance();
		const issues: AccessibilityIssue[] = [];

		const liveRegionAttributeIssues = await testSuite.testLiveRegionAttributes();
		const liveRegionPolitenessIssues = await testSuite.testLiveRegionPoliteness();

		issues.push(...liveRegionAttributeIssues, ...liveRegionPolitenessIssues);

		return {
			testId: 'live-region-validator',
			testName: this.name,
			category: 'live-regions',
			status: issues.length > 0 ? 'failed' : 'passed',
			score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 5)),
			issues,
			metadata: {
				duration: 0,
				elementsTested: document.querySelectorAll('[aria-live]').length,
				timestamp: new Date(),
				testVersion: '1.0.0',
				severity: 'moderate',
			},
		};
	}
}

class SemanticMarkupValidator extends AccessibilityValidator {
	name = 'Semantic Markup Validator';

	async validate(): Promise<ScreenReaderTestResult> {
		const testSuite = ScreenReaderTestSuite.getInstance();
		const issues: AccessibilityIssue[] = [];

		const headingIssues = await testSuite.testHeadingHierarchy();
		const landmarkIssues = await testSuite.testLandmarks();

		issues.push(...headingIssues, ...landmarkIssues);

		return {
			testId: 'semantic-markup-validator',
			testName: this.name,
			category: 'semantic-markup',
			status: issues.length > 0 ? 'failed' : 'passed',
			score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 7)),
			issues,
			metadata: {
				duration: 0,
				elementsTested: document.querySelectorAll('h1, h2, h3, h4, h5, h6, main, nav, [role]').length,
				timestamp: new Date(),
				testVersion: '1.0.0',
				severity: 'moderate',
			},
		};
	}
}

class FormAccessibilityValidator extends AccessibilityValidator {
	name = 'Form Accessibility Validator';

	async validate(): Promise<ScreenReaderTestResult> {
		const testSuite = ScreenReaderTestSuite.getInstance();
		const issues: AccessibilityIssue[] = [];

		const formLabelIssues = await testSuite.testFormLabels();
		const formValidationIssues = await testSuite.testFormValidation();

		issues.push(...formLabelIssues, ...formValidationIssues);

		return {
			testId: 'form-accessibility-validator',
			testName: this.name,
			category: 'form-accessibility',
			status: issues.length > 0 ? 'failed' : 'passed',
			score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 15)),
			issues,
			metadata: {
				duration: 0,
				elementsTested: document.querySelectorAll('input, select, textarea, label').length,
				timestamp: new Date(),
				testVersion: '1.0.0',
				severity: 'critical',
			},
		};
	}
}

// Type definitions
export interface AccessibilityIssue {
	type: string;
	severity: 'critical' | 'serious' | 'moderate' | 'minor';
	element: string;
	description: string;
	impact: string;
	recommendation: string;
	wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface ScreenReaderTestResult {
	testId: string;
	testName: string;
	category: string;
	status: 'passed' | 'failed' | 'error';
	score: number;
	issues: AccessibilityIssue[];
	metadata: {
		duration: number;
		elementsTested: number;
		timestamp: Date;
		testVersion: string;
		severity?: 'critical' | 'serious' | 'moderate' | 'minor';
	};
}

export interface ScreenReaderTest {
	id: string;
	name: string;
	description: string;
	severity: 'critical' | 'serious' | 'moderate' | 'minor';
	testFn: () => Promise<AccessibilityIssue[]>;
}

export interface TestCategory {
	id: string;
	name: string;
	description: string;
	weight: number;
	tests: ScreenReaderTest[];
}

export interface TestSuiteSummary {
	totalTests: number;
	passedTests: number;
	failedTests: number;
	errorTests: number;
	passRate: number;
	totalIssues: number;
	criticalIssues: number;
	seriousIssues: number;
	moderateIssues: number;
	minorIssues: number;
}

export interface AccessibilityRecommendation {
	id: string;
	title: string;
	description: string;
	priority: 'critical' | 'high' | 'medium' | 'low';
	impact: number;
	effort: 'low' | 'medium' | 'high';
	issues: string[];
	wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface ComplianceStatus {
	level: 'A' | 'AA' | 'AAA';
	certified: boolean;
	issuesRemaining: 'none' | 'minor' | 'moderate' | 'significant' | 'extensive';
}

export interface ScreenReaderTestSuiteResult {
	suiteId: string;
	timestamp: Date;
	duration: number;
	overallScore: number;
	summary: TestSuiteSummary;
	results: ScreenReaderTestResult[];
	categories: TestCategory[];
	recommendations: AccessibilityRecommendation[];
	complianceStatus: ComplianceStatus;
}

export default ScreenReaderTestSuite;

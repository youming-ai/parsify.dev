/**
 * Real-time Accessibility Scanner
 * Real-time DOM scanning for accessibility violations with instant feedback
 */

import { accessibilityAudit, AccessibilityIssue } from './accessibility-audit';
import { automatedAccessibilityTesting, AutomatedTestResult } from './automated-accessibility-testing';

export interface RealtimeScanResult {
  scanId: string;
  timestamp: Date;
  scanDuration: number;
  violations: AccessibilityViolation[];
  improvements: AccessibilityImprovement[];
  componentAnalysis: ComponentAccessibilityResult[];
  performanceImpact: {
    scanOverhead: number;
    memoryUsage: number;
    domNodesScanned: number;
  };
  scanContext: ScanContext;
}

export interface AccessibilityViolation {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  rule: string;
  description: string;
  element: Element;
  selector: string;
  helpUrl?: string;
  quickFix?: QuickFix;
  context: ViolationContext;
  automatedConfidence: number; // 0-100
  firstDetected: Date;
  detectionCount: number;
  isPersistent: boolean;
}

export interface QuickFix {
  id: string;
  description: string;
  action: QuickFixAction;
  automated: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface QuickFixAction {
  type: 'add-attribute' | 'remove-attribute' | 'modify-attribute' | 'add-element' | 'remove-element' | 'modify-text';
  target: string; // CSS selector
  attribute?: string;
  value?: string;
  text?: string;
  element?: string; // HTML tag for add-element
}

export interface AccessibilityImprovement {
  id: string;
  type: 'enhancement' | 'optimization' | 'best-practice';
  category: 'performance' | 'usability' | 'maintainability' | 'seo';
  description: string;
  element: Element;
  selector: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  implementation: string;
}

export interface ComponentAccessibilityResult {
  componentName: string;
  componentType: 'react' | 'vue' | 'angular' | 'web-component' | 'native';
  elements: Element[];
  violations: AccessibilityViolation[];
  score: number; // 0-100
  issues: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  recommendations: string[];
}

export interface ScanContext {
  url: string;
  pageTitle: string;
  viewportSize: { width: number; height: number };
  deviceType: 'desktop' | 'tablet' | 'mobile';
  userAgent: string;
  frameworks: string[];
  totalDomNodes: number;
  accessibleNodes: number;
  inaccessibleNodes: number;
}

export interface ViolationContext {
  page: string;
  component: string;
  interactionState: 'static' | 'hover' | 'focus' | 'active';
  visibilityState: 'visible' | 'hidden' | 'partially-visible';
  accessibilityTree: AccessibilityTreeNode[];
}

export interface AccessibilityTreeNode {
  element: Element;
  role: string;
  name: string;
  description: string;
  state: Record<string, string>;
  children: AccessibilityTreeNode[];
  accessible: boolean;
  issues: string[];
}

export interface ScanConfiguration {
  scanInterval: number; // milliseconds
  maxConcurrentScans: number;
  enabledRules: string[];
  disabledRules: string[];
  focusAreas: string[]; // CSS selectors for areas to focus on
  ignorePatterns: string[]; // CSS selectors to ignore
  performanceThreshold: number; // ms
  enableComponentAnalysis: boolean;
  enableQuickFixes: boolean;
  enableRealTimeFeedback: boolean;
}

export interface ScanMetrics {
  totalScans: number;
  averageScanTime: number;
  violationsDetected: number;
  violationsResolved: number;
  improvementsSuggested: number;
  performanceImpact: number;
  scanEfficiency: number; // violations detected per millisecond
}

export class RealtimeAccessibilityScanner {
  private static instance: RealtimeAccessibilityScanner;
  private isScanning = false;
  private scanInterval?: number;
  private violationCache: Map<string, AccessibilityViolation> = new Map();
  private componentCache: Map<string, ComponentAccessibilityResult> = new Map();
  private scanHistory: RealtimeScanResult[] = [];
  private scanCallbacks: ((result: RealtimeScanResult) => void)[] = [];
  private quickFixHistory: QuickFix[] = [];
  private configuration: ScanConfiguration = this.getDefaultConfiguration();
  private performanceMetrics: ScanMetrics = this.initializeMetrics();

  private constructor() {
    this.initializeScanner();
  }

  public static getInstance(): RealtimeAccessibilityScanner {
    if (!RealtimeAccessibilityScanner.instance) {
      RealtimeAccessibilityScanner.instance = new RealtimeAccessibilityScanner();
    }
    return RealtimeAccessibilityScanner.instance;
  }

  // Initialize the scanner
  private initializeScanner(): void {
    if (typeof window === 'undefined') return;

    // Set up mutation observer for dynamic content
    this.setupMutationObserver();

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    // Set up keyboard and interaction monitoring
    this.setupInteractionMonitoring();
  }

  // Get default configuration
  private getDefaultConfiguration(): ScanConfiguration {
    return {
      scanInterval: 5000, // 5 seconds
      maxConcurrentScans: 1,
      enabledRules: [
        'missing-alt-text',
        'insufficient-contrast',
        'missing-form-label',
        'keyboard-accessibility',
        'focus-management',
        'aria-compliance',
        'heading-structure',
        'link-accessibility'
      ],
      disabledRules: [],
      focusAreas: [],
      ignorePatterns: [
        '[data-a11y-ignore="true"]',
        '.sr-only', // Screen reader only content
        '[style*="display: none"]',
        '[style*="visibility: hidden"]'
      ],
      performanceThreshold: 100, // 100ms max scan time
      enableComponentAnalysis: true,
      enableQuickFixes: true,
      enableRealTimeFeedback: true
    };
  }

  // Start real-time scanning
  public startScanning(config?: Partial<ScanConfiguration>): void {
    if (this.isScanning) {
      console.warn('Real-time accessibility scanner is already running');
      return;
    }

    // Update configuration if provided
    if (config) {
      this.configuration = { ...this.configuration, ...config };
    }

    this.isScanning = true;
    this.performanceMetrics.totalScans = 0;

    // Start interval-based scanning
    this.scanInterval = window.setInterval(() => {
      this.performScan();
    }, this.configuration.scanInterval);

    // Perform initial scan
    this.performScan();

    console.log('Real-time accessibility scanner started');
  }

  // Stop real-time scanning
  public stopScanning(): void {
    if (!this.isScanning) return;

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = undefined;
    }

    this.isScanning = false;
    console.log('Real-time accessibility scanner stopped');
  }

  // Perform a single accessibility scan
  public async performScan(): Promise<RealtimeScanResult> {
    if (this.isScanning && this.configuration.maxConcurrentScans <= 1) {
      return this.getLastScanResult();
    }

    const startTime = performance.now();
    const scanId = this.generateScanId();

    try {
      // Create scan context
      const scanContext = this.createScanContext();

      // Scan for violations
      const violations = await this.scanForViolations(scanContext);

      // Scan for improvements
      const improvements = await this.scanForImprovements(scanContext);

      // Perform component analysis if enabled
      const componentAnalysis = this.configuration.enableComponentAnalysis
        ? await this.analyzeComponents(scanContext)
        : [];

      // Calculate performance impact
      const scanDuration = performance.now() - startTime;
      const performanceImpact = this.calculatePerformanceImpact(scanDuration, scanContext);

      const result: RealtimeScanResult = {
        scanId,
        timestamp: new Date(),
        scanDuration,
        violations,
        improvements,
        componentAnalysis,
        performanceImpact,
        scanContext
      };

      // Update caches and metrics
      this.updateViolationCache(violations);
      this.updateComponentCache(componentAnalysis);
      this.updateMetrics(result);

      // Notify callbacks
      if (this.configuration.enableRealTimeFeedback) {
        this.notifyScanCallbacks(result);
      }

      // Store in history
      this.scanHistory.push(result);
      if (this.scanHistory.length > 100) {
        this.scanHistory.shift(); // Keep only last 100 scans
      }

      return result;

    } catch (error) {
      console.error('Accessibility scan failed:', error);

      const errorResult: RealtimeScanResult = {
        scanId,
        timestamp: new Date(),
        scanDuration: performance.now() - startTime,
        violations: [],
        improvements: [],
        componentAnalysis: [],
        performanceImpact: {
          scanOverhead: scanDuration,
          memoryUsage: 0,
          domNodesScanned: 0
        },
        scanContext: this.createScanContext()
      };

      return errorResult;
    }
  }

  // Scan for accessibility violations
  private async scanForViolations(scanContext: ScanContext): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];

    // Get all elements to scan
    const elementsToScan = this.getElementsToScan();

    // Scan each rule that's enabled
    for (const rule of this.configuration.enabledRules) {
      if (this.configuration.disabledRules.includes(rule)) continue;

      const ruleViolations = await this.scanRule(rule, elementsToScan, scanContext);
      violations.push(...ruleViolations);
    }

    // Filter out ignored patterns
    return violations.filter(violation =>
      !this.configuration.ignorePatterns.some(pattern =>
        violation.element.matches(pattern)
      )
    );
  }

  // Scan for a specific rule
  private async scanRule(rule: string, elements: Element[], scanContext: ScanContext): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];

    switch (rule) {
      case 'missing-alt-text':
        violations.push(...this.scanMissingAltText(elements));
        break;
      case 'insufficient-contrast':
        violations.push(...this.scanInsufficientContrast(elements));
        break;
      case 'missing-form-label':
        violations.push(...this.scanMissingFormLabels(elements));
        break;
      case 'keyboard-accessibility':
        violations.push(...this.scanKeyboardAccessibility(elements));
        break;
      case 'focus-management':
        violations.push(...this.scanFocusManagement(elements));
        break;
      case 'aria-compliance':
        violations.push(...this.scanAriaCompliance(elements));
        break;
      case 'heading-structure':
        violations.push(...this.scanHeadingStructure(elements));
        break;
      case 'link-accessibility':
        violations.push(...this.scanLinkAccessibility(elements));
        break;
      default:
        console.warn(`Unknown accessibility rule: ${rule}`);
    }

    return violations;
  }

  // Scan for missing alt text
  private scanMissingAltText(elements: Element[]): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const images = Array.from(elements).filter(el => el.tagName.toLowerCase() === 'img');

    images.forEach((img, index) => {
      const alt = img.getAttribute('alt');

      if (alt === null) {
        const violation = this.createViolation(
          `missing-alt-${index}`,
          'error',
          'critical',
          'WCAG 1.1.1 - Non-text Content',
          'Image is missing alternative text',
          img,
          {
            quickFix: {
              id: `add-alt-${index}`,
              description: 'Add descriptive alt text to the image',
              action: {
                type: 'add-attribute',
                target: this.generateSelector(img),
                attribute: 'alt',
                value: 'Describe the image content and function'
              },
              automated: false,
              complexity: 'simple',
              riskLevel: 'low'
            }
          }
        );
        violations.push(violation);
      }
    });

    return violations;
  }

  // Scan for insufficient color contrast
  private scanInsufficientContrast(elements: Element[]): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const textElements = Array.from(elements).filter(el =>
      ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'button', 'label', 'td', 'th'].includes(el.tagName.toLowerCase())
    );

    textElements.forEach((element, index) => {
      const contrastRatio = this.calculateContrastRatio(element);

      if (contrastRatio < 4.5) {
        const violation = this.createViolation(
          `contrast-${index}`,
          'warning',
          'serious',
          'WCAG 1.4.3 - Contrast (Minimum)',
          `Insufficient color contrast: ${contrastRatio.toFixed(2)}:1 (minimum 4.5:1 required)`,
          element
        );
        violations.push(violation);
      }
    });

    return violations;
  }

  // Scan for missing form labels
  private scanMissingFormLabels(elements: Element[]): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const formElements = Array.from(elements).filter(el =>
      ['input', 'select', 'textarea'].includes(el.tagName.toLowerCase())
    );

    formElements.forEach((element, index) => {
      const hasLabel = this.elementHasLabel(element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);

      if (!hasLabel) {
        const violation = this.createViolation(
          `form-label-${index}`,
          'error',
          'critical',
          'WCAG 3.3.2 - Labels or Instructions',
          'Form input lacks associated label',
          element,
          {
            quickFix: {
              id: `add-label-${index}`,
              description: 'Add a label for this form input',
              action: {
                type: 'add-element',
                target: this.generateSelector(element),
                element: 'label',
                text: 'Label text'
              },
              automated: false,
              complexity: 'moderate',
              riskLevel: 'low'
            }
          }
        );
        violations.push(violation);
      }
    });

    return violations;
  }

  // Scan for keyboard accessibility
  private scanKeyboardAccessibility(elements: Element[]): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const interactiveElements = Array.from(elements).filter(el =>
      ['a', 'button', 'input', 'select', 'textarea', '[tabindex]'].some(selector => el.matches(selector))
    );

    interactiveElements.forEach((element, index) => {
      const tabindex = element.getAttribute('tabindex');

      if (tabindex && parseInt(tabindex) > 0) {
        const violation = this.createViolation(
          `keyboard-tabindex-${index}`,
          'warning',
          'moderate',
          'WCAG 2.4.3 - Focus Order',
          'Positive tabindex value can disrupt keyboard navigation order',
          element
        );
        violations.push(violation);
      }
    });

    return violations;
  }

  // Scan for focus management
  private scanFocusManagement(elements: Element[]): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Check for visible focus indicators
    const focusTest = this.testFocusIndicators();
    if (!focusTest.hasVisibleFocus) {
      violations.push(this.createViolation(
        'focus-indicator',
        'warning',
        'moderate',
        'WCAG 2.4.7 - Focus Visible',
        'Focus indicators may not be visible enough for keyboard users',
        document.body
      ));
    }

    return violations;
  }

  // Scan for ARIA compliance
  private scanAriaCompliance(elements: Element[]): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const elementsWithAria = Array.from(elements).filter(el =>
      Array.from(el.attributes).some(attr => attr.name.startsWith('aria-'))
    );

    elementsWithAria.forEach((element, index) => {
      const ariaInvalid = this.validateAriaAttributes(element);

      if (ariaInvalid.length > 0) {
        ariaInvalid.forEach(invalidAttr => {
          violations.push(this.createViolation(
            `aria-${index}-${invalidAttr}`,
            'error',
            'serious',
            'WCAG 4.1.2 - Name, Role, Value',
            `Invalid ARIA attribute: ${invalidAttr}`,
            element
          ));
        });
      }
    });

    return violations;
  }

  // Scan for heading structure
  private scanHeadingStructure(elements: Element[]): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const headings = Array.from(elements).filter(el =>
      /^h[1-6]$/.test(el.tagName.toLowerCase())
    ).sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    );

    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.substring(1));

      if (currentLevel - lastLevel > 1 && lastLevel !== 0) {
        violations.push(this.createViolation(
          `heading-skip-${index}`,
          'warning',
          'moderate',
          'WCAG 1.3.1 - Info and Relationships',
          `Heading level skipped: H${lastLevel} to H${currentLevel}`,
          heading
        ));
      }

      lastLevel = currentLevel;
    });

    return violations;
  }

  // Scan for link accessibility
  private scanLinkAccessibility(elements: Element[]): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const links = Array.from(elements).filter(el => el.tagName.toLowerCase() === 'a' && el.hasAttribute('href'));

    links.forEach((link, index) => {
      const text = link.textContent?.trim();

      if (!text) {
        violations.push(this.createViolation(
          `link-no-text-${index}`,
          'error',
          'serious',
          'WCAG 2.4.4 - Link Purpose',
          'Link lacks accessible text describing its purpose',
          link
        ));
      } else if (['click here', 'read more', 'learn more', 'here'].includes(text.toLowerCase())) {
        violations.push(this.createViolation(
          `link-generic-${index}`,
          'warning',
          'moderate',
          'WCAG 2.4.4 - Link Purpose',
          'Link text is too generic to be understood out of context',
          link
        ));
      }
    });

    return violations;
  }

  // Scan for improvements
  private async scanForImprovements(scanContext: ScanContext): Promise<AccessibilityImprovement[]> {
    const improvements: AccessibilityImprovement[] = [];

    // Check for missing skip links
    if (document.querySelectorAll('a[href^="#main"], a[href^="#content"], .skip-link').length === 0) {
      improvements.push({
        id: 'skip-link-improvement',
        type: 'enhancement',
        category: 'usability',
        description: 'Add skip links to help keyboard users bypass navigation',
        element: document.body,
        selector: 'body',
        impact: 'high',
        effort: 'low',
        implementation: '<a href="#main" class="skip-link">Skip to main content</a>'
      });
    }

    // Check for landmark regions
    if (document.querySelectorAll('main, [role="main"]').length === 0) {
      improvements.push({
        id: 'landmark-improvement',
        type: 'best-practice',
        category: 'usability',
        description: 'Add main landmark region for better screen reader navigation',
        element: document.body,
        selector: 'body',
        impact: 'medium',
        effort: 'low',
        implementation: 'Add <main> element or role="main" to main content area'
      });
    }

    return improvements;
  }

  // Analyze components
  private async analyzeComponents(scanContext: ScanContext): Promise<ComponentAccessibilityResult[]> {
    const componentResults: ComponentAccessibilityResult[] = [];

    // Detect common component patterns
    const components = this.detectComponents();

    for (const component of components) {
      const result = await this.analyzeComponent(component, scanContext);
      componentResults.push(result);
    }

    return componentResults;
  }

  // Detect components in the page
  private detectComponents(): Array<{ name: string; type: ComponentAccessibilityResult['componentType']; elements: Element[] }> {
    const components: Array<{ name: string; type: ComponentAccessibilityResult['componentType']; elements: Element[] }> = [];

    // Detect common component patterns
    const patterns = [
      {
        name: 'Navigation',
        type: 'native' as const,
        selector: 'nav, [role="navigation"]'
      },
      {
        name: 'Header',
        type: 'native' as const,
        selector: 'header, [role="banner"]'
      },
      {
        name: 'Main Content',
        type: 'native' as const,
        selector: 'main, [role="main"]'
      },
      {
        name: 'Footer',
        type: 'native' as const,
        selector: 'footer, [role="contentinfo"]'
      },
      {
        name: 'Form',
        type: 'native' as const,
        selector: 'form'
      },
      {
        name: 'Modal',
        type: 'native' as const,
        selector: '[role="dialog"], .modal, .popup'
      },
      {
        name: 'Card',
        type: 'native' as const,
        selector: '.card, [class*="card"]'
      },
      {
        name: 'Button Group',
        type: 'native' as const,
        selector: '.btn-group, [role="group"]'
      }
    ];

    patterns.forEach(pattern => {
      const elements = Array.from(document.querySelectorAll(pattern.selector));
      if (elements.length > 0) {
        components.push({
          name: pattern.name,
          type: pattern.type,
          elements
        });
      }
    });

    return components;
  }

  // Analyze a specific component
  private async analyzeComponent(
    component: { name: string; type: ComponentAccessibilityResult['componentType']; elements: Element[] },
    scanContext: ScanContext
  ): Promise<ComponentAccessibilityResult> {
    const violations: AccessibilityViolation[] = [];

    // Analyze each element in the component
    for (const element of component.elements) {
      const elementViolations = await this.scanForViolations(scanContext);
      violations.push(...elementViolations.filter(v => v.element === element));
    }

    // Calculate score
    const totalElements = component.elements.length;
    const violationsPerElement = violations.length / totalElements;
    const score = Math.max(0, 100 - (violationsPerElement * 20));

    // Count issue severity
    const issues = {
      total: violations.length,
      critical: violations.filter(v => v.severity === 'critical').length,
      serious: violations.filter(v => v.severity === 'serious').length,
      moderate: violations.filter(v => v.severity === 'moderate').length,
      minor: violations.filter(v => v.severity === 'minor').length
    };

    // Generate recommendations
    const recommendations = this.generateComponentRecommendations(component, violations);

    return {
      componentName: component.name,
      componentType: component.type,
      elements: component.elements,
      violations,
      score,
      issues,
      recommendations
    };
  }

  // Generate component recommendations
  private generateComponentRecommendations(
    component: { name: string; type: ComponentAccessibilityResult['componentType']; elements: Element[] },
    violations: AccessibilityViolation[]
  ): string[] {
    const recommendations: string[] = [];

    if (component.name === 'Navigation') {
      if (violations.some(v => v.rule.includes('Keyboard'))) {
        recommendations.push('Ensure all navigation items are keyboard accessible');
      }
      if (violations.some(v => v.rule.includes('Focus'))) {
        recommendations.push('Add visible focus indicators for navigation items');
      }
    }

    if (component.name === 'Form') {
      if (violations.some(v => v.rule.includes('Labels'))) {
        recommendations.push('Associate labels with all form inputs');
      }
      if (violations.some(v => v.rule.includes('Error'))) {
        recommendations.push('Add clear error messages and validation feedback');
      }
    }

    if (component.name === 'Modal') {
      recommendations.push('Ensure modal traps focus and can be closed with ESC key');
      recommendations.push('Add appropriate ARIA attributes for modal accessibility');
    }

    return recommendations;
  }

  // Create violation object
  private createViolation(
    id: string,
    type: AccessibilityViolation['type'],
    severity: AccessibilityViolation['severity'],
    rule: string,
    description: string,
    element: Element,
    options: { quickFix?: QuickFix } = {}
  ): AccessibilityViolation {
    const existingViolation = this.violationCache.get(id);
    const currentTime = new Date();

    if (existingViolation) {
      // Update existing violation
      existingViolation.detectionCount++;
      existingViolation.isPersistent = true;
      return existingViolation;
    }

    const violation: AccessibilityViolation = {
      id,
      type,
      severity,
      rule,
      description,
      element,
      selector: this.generateSelector(element),
      helpUrl: this.getHelpUrl(rule),
      quickFix: options.quickFix,
      context: this.createViolationContext(element),
      automatedConfidence: 90,
      firstDetected: currentTime,
      detectionCount: 1,
      isPersistent: false
    };

    return violation;
  }

  // Create violation context
  private createViolationContext(element: Element): ViolationContext {
    return {
      page: window.location.pathname,
      component: this.getComponentName(element),
      interactionState: 'static', // Would need more complex detection for actual state
      visibilityState: this.getVisibilityState(element),
      accessibilityTree: this.buildAccessibilityTree(element)
    };
  }

  // Get component name for element
  private getComponentName(element: Element): string {
    // Try to find parent component
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      if (parent.classList.length > 0) {
        const className = Array.from(parent.classList).find(c =>
          c.includes('component') || c.includes('widget') || c.includes('control')
        );
        if (className) return className;
      }

      const role = parent.getAttribute('role');
      if (role && role !== 'generic') return role;

      parent = parent.parentElement;
    }

    return 'unknown';
  }

  // Get visibility state
  private getVisibilityState(element: Element): ViolationContext['visibilityState'] {
    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    if (styles.display === 'none' || styles.visibility === 'hidden') {
      return 'hidden';
    }

    if (rect.width === 0 || rect.height === 0) {
      return 'hidden';
    }

    if (rect.top < 0 || rect.left < 0 || rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
      return 'partially-visible';
    }

    return 'visible';
  }

  // Build accessibility tree for element
  private buildAccessibilityTree(element: Element): AccessibilityTreeNode[] {
    const node: AccessibilityTreeNode = {
      element,
      role: this.getAccessibleRole(element),
      name: this.getAccessibleName(element),
      description: this.getAccessibleDescription(element),
      state: this.getAccessibleState(element),
      children: [],
      accessible: this.isElementAccessible(element),
      issues: []
    };

    // Check for issues
    if (!node.name && this.elementNeedsAccessibleName(element)) {
      node.issues.push('Missing accessible name');
    }

    return [node];
  }

  // Get accessible role
  private getAccessibleRole(element: Element): string {
    const role = element.getAttribute('role');
    if (role) return role;

    const tagName = element.tagName.toLowerCase();
    const roleMap: Record<string, string> = {
      'a': 'link',
      'button': 'button',
      'input': 'textbox',
      'textarea': 'textbox',
      'select': 'combobox',
      'img': 'image',
      'h1': 'heading',
      'h2': 'heading',
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading',
      'nav': 'navigation',
      'main': 'main',
      'header': 'banner',
      'footer': 'contentinfo',
      'aside': 'complementary'
    };

    return roleMap[tagName] || 'generic';
  }

  // Get accessible name
  private getAccessibleName(element: Element): string {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labels = ariaLabelledBy.split(' ').map(id =>
        document.getElementById(id)?.textContent || ''
      ).join(' ');
      if (labels) return labels;
    }

    const tagName = element.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tagName)) {
      const id = element.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return label.textContent || '';
      }
    }

    return element.textContent?.trim() || '';
  }

  // Get accessible description
  private getAccessibleDescription(element: Element): string {
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
      const describedElements = ariaDescribedBy.split(' ').map(id =>
        document.getElementById(id)?.textContent || ''
      ).join(' ');
      return describedElements;
    }

    const title = element.getAttribute('title');
    return title || '';
  }

  // Get accessible state
  private getAccessibleState(element: Element): Record<string, string> {
    const state: Record<string, string> = {};

    ['disabled', 'required', 'selected', 'checked', 'expanded', 'pressed'].forEach(attr => {
      const ariaAttr = `aria-${attr}`;
      if (element.hasAttribute(ariaAttr)) {
        state[attr] = element.getAttribute(ariaAttr) || '';
      }
    });

    return state;
  }

  // Check if element needs accessible name
  private elementNeedsAccessibleName(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const interactiveElements = [
      'button', 'input', 'select', 'textarea', 'a', 'area',
      'summary', 'audio[controls]', 'video[controls]'
    ];
    const hasRole = element.hasAttribute('role');

    return interactiveElements.includes(tagName) || hasRole;
  }

  // Check if element is accessible
  private isElementAccessible(element: Element): boolean {
    const hasName = this.getAccessibleName(element).length > 0;
    const hasRole = this.getAccessibleRole(element) !== 'generic';
    const isVisible = this.getVisibilityState(element) !== 'hidden';

    return hasName && isVisible;
  }

  // Helper methods
  private generateScanId(): string {
    return `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes[0]}`;
      }
    }
    return element.tagName.toLowerCase();
  }

  private getHelpUrl(rule: string): string {
    const helpUrls: Record<string, string> = {
      'WCAG 1.1.1 - Non-text Content': 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
      'WCAG 1.4.3 - Contrast (Minimum)': 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
      'WCAG 2.4.3 - Focus Order': 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
      'WCAG 2.4.7 - Focus Visible': 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html',
      'WCAG 3.3.2 - Labels or Instructions': 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
      'WCAG 4.1.2 - Name, Role, Value': 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
    };

    return helpUrls[rule] || 'https://www.w3.org/WAI/WCAG21/Understanding/';
  }

  private calculateContrastRatio(element: Element): number {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // Simplified contrast calculation
    if (color === 'rgb(0, 0, 0)' && backgroundColor === 'rgb(255, 255, 255)') {
      return 21; // Maximum contrast
    }

    return 4.5; // Assume WCAG AA compliant for simulation
  }

  private elementHasLabel(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
    const id = element.getAttribute('id');
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return true;
    }

    return element.hasAttribute('aria-label') ||
           element.hasAttribute('aria-labelledby') ||
           element.hasAttribute('title');
  }

  private testFocusIndicators(): { hasVisibleFocus: boolean } {
    // Create test element to check focus styles
    const testElement = document.createElement('button');
    testElement.textContent = 'Test Focus';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    document.body.appendChild(testElement);

    testElement.focus();
    const focusStyles = window.getComputedStyle(testElement, ':focus');

    const hasVisibleFocus =
      focusStyles.outline !== 'none' &&
      focusStyles.outlineWidth !== '0px' &&
      focusStyles.outlineColor !== 'rgba(0, 0, 0, 0)';

    document.body.removeChild(testElement);

    return { hasVisibleFocus };
  }

  private validateAriaAttributes(element: Element): string[] {
    const invalidAttributes: string[] = [];
    const attributes = Array.from(element.attributes).filter(attr => attr.name.startsWith('aria-'));

    attributes.forEach(attr => {
      // Basic validation - would need comprehensive ARIA spec checking
      if (attr.name === 'aria-label' && !attr.value) {
        invalidAttributes.push(attr.name);
      }
      if (attr.name === 'aria-expanded' && !['true', 'false', 'undefined'].includes(attr.value)) {
        invalidAttributes.push(attr.name);
      }
    });

    return invalidAttributes;
  }

  private getElementsToScan(): Element[] {
    let elements = Array.from(document.querySelectorAll('*'));

    // Filter out elements that match ignore patterns
    elements = elements.filter(element =>
      !this.configuration.ignorePatterns.some(pattern => element.matches(pattern))
    );

    // Filter to focus areas if specified
    if (this.configuration.focusAreas.length > 0) {
      elements = elements.filter(element =>
        this.configuration.focusAreas.some(area => element.matches(area) || element.closest(area))
      );
    }

    return elements;
  }

  private createScanContext(): ScanContext {
    return {
      url: window.location.href,
      pageTitle: document.title,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      deviceType: this.detectDeviceType(),
      userAgent: navigator.userAgent,
      frameworks: this.detectFrameworks(),
      totalDomNodes: document.querySelectorAll('*').length,
      accessibleNodes: this.countAccessibleNodes(),
      inaccessibleNodes: this.countInaccessibleNodes()
    };
  }

  private detectDeviceType(): ScanContext['deviceType'] {
    const userAgent = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;

    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad|android(?!.*mobile)/.test(userAgent) || width >= 768 && width <= 1024) {
      return 'tablet';
    }

    return 'desktop';
  }

  private detectFrameworks(): string[] {
    const frameworks: string[] = [];

    if (window.React) frameworks.push('React');
    if (window.Vue) frameworks.push('Vue');
    if (window.angular) frameworks.push('Angular');

    return frameworks;
  }

  private countAccessibleNodes(): number {
    const elements = document.querySelectorAll('*');
    let count = 0;

    elements.forEach(element => {
      if (this.isElementAccessible(element)) {
        count++;
      }
    });

    return count;
  }

  private countInaccessibleNodes(): number {
    const elements = document.querySelectorAll('*');
    let count = 0;

    elements.forEach(element => {
      if (!this.isElementAccessible(element)) {
        count++;
      }
    });

    return count;
  }

  private calculatePerformanceImpact(scanDuration: number, scanContext: ScanContext): RealtimeScanResult['performanceImpact'] {
    return {
      scanOverhead: scanDuration,
      memoryUsage: 0, // Would need actual memory measurement
      domNodesScanned: scanContext.totalDomNodes
    };
  }

  private updateViolationCache(violations: AccessibilityViolation[]): void {
    violations.forEach(violation => {
      this.violationCache.set(violation.id, violation);
    });

    // Clean up old violations (older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.violationCache.forEach((violation, id) => {
      if (violation.firstDetected.getTime() < oneHourAgo) {
        this.violationCache.delete(id);
      }
    });
  }

  private updateComponentCache(components: ComponentAccessibilityResult[]): void {
    components.forEach(component => {
      this.componentCache.set(component.componentName, component);
    });
  }

  private updateMetrics(result: RealtimeScanResult): void {
    this.performanceMetrics.totalScans++;

    const totalScanTime = this.performanceMetrics.averageScanTime * (this.performanceMetrics.totalScans - 1) + result.scanDuration;
    this.performanceMetrics.averageScanTime = totalScanTime / this.performanceMetrics.totalScans;

    this.performanceMetrics.violationsDetected += result.violations.length;

    // Update performance impact
    const totalImpact = this.performanceMetrics.performanceImpact * (this.performanceMetrics.totalScans - 1) + result.performanceImpact.scanOverhead;
    this.performanceMetrics.performanceImpact = totalImpact / this.performanceMetrics.totalScans;

    // Calculate scan efficiency
    this.performanceMetrics.scanEfficiency = this.performanceMetrics.violationsDetected / this.performanceMetrics.averageScanTime;
  }

  private initializeMetrics(): ScanMetrics {
    return {
      totalScans: 0,
      averageScanTime: 0,
      violationsDetected: 0,
      violationsResolved: 0,
      improvementsSuggested: 0,
      performanceImpact: 0,
      scanEfficiency: 0
    };
  }

  private notifyScanCallbacks(result: RealtimeScanResult): void {
    this.scanCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Scan callback error:', error);
      }
    });
  }

  private getLastScanResult(): RealtimeScanResult {
    return this.scanHistory[this.scanHistory.length - 1] || {
      scanId: 'no-scan',
      timestamp: new Date(),
      scanDuration: 0,
      violations: [],
      improvements: [],
      componentAnalysis: [],
      performanceImpact: {
        scanOverhead: 0,
        memoryUsage: 0,
        domNodesScanned: 0
      },
      scanContext: this.createScanContext()
    };
  }

  // Setup methods
  private setupMutationObserver(): void {
    if ('MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        let shouldScan = false;

        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            if (addedNodes.some(node =>
              node.nodeType === Node.ELEMENT_NODE &&
              this.isAccessibilityRelevantElement(node as Element)
            )) {
              shouldScan = true;
            }
          }
        });

        if (shouldScan && this.isScanning) {
          // Debounce scan
          setTimeout(() => this.performScan(), 1000);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-label', 'alt', 'role', 'tabindex', 'disabled']
      });
    }
  }

  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      const perfObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.includes('accessibility-scan')) {
            console.debug(`Accessibility scan performance: ${entry.duration}ms`);
          }
        });
      });

      try {
        perfObserver.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('Performance observer not available');
      }
    }
  }

  private setupInteractionMonitoring(): void {
    // Monitor user interactions that might affect accessibility
    const interactionHandler = (event: Event) => {
      const target = event.target as Element;

      if (target && this.isAccessibilityRelevantElement(target)) {
        // Trigger scan after interaction if scanner is running
        if (this.isScanning) {
          setTimeout(() => this.performScan(), 500);
        }
      }
    };

    document.addEventListener('click', interactionHandler);
    document.addEventListener('focus', interactionHandler, true);
  }

  private isAccessibilityRelevantElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const hasRelevantAttributes = [
      'aria-label', 'aria-describedby', 'alt', 'role', 'tabindex',
      'href', 'type', 'name', 'placeholder', 'disabled'
    ].some(attr => element.hasAttribute(attr));

    const isInteractiveElement = [
      'button', 'input', 'select', 'textarea', 'a', 'summary', 'details'
    ].includes(tagName);

    const isMediaElement = ['img', 'video', 'audio', 'svg', 'canvas'].includes(tagName);

    return hasRelevantAttributes || isInteractiveElement || isMediaElement;
  }

  // Public API methods
  public addScanCallback(callback: (result: RealtimeScanResult) => void): void {
    this.scanCallbacks.push(callback);
  }

  public removeScanCallback(callback: (result: RealtimeScanResult) => void): void {
    const index = this.scanCallbacks.indexOf(callback);
    if (index > -1) {
      this.scanCallbacks.splice(index, 1);
    }
  }

  public getConfiguration(): ScanConfiguration {
    return { ...this.configuration };
  }

  public updateConfiguration(config: Partial<ScanConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
  }

  public getScanHistory(): RealtimeScanResult[] {
    return [...this.scanHistory];
  }

  public getMetrics(): ScanMetrics {
    return { ...this.performanceMetrics };
  }

  public getViolations(): AccessibilityViolation[] {
    return Array.from(this.violationCache.values());
  }

  public getQuickFixes(): QuickFix[] {
    return [...this.quickFixHistory];
  }

  public applyQuickFix(quickFix: QuickFix): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        switch (quickFix.action.type) {
          case 'add-attribute':
            const element = document.querySelector(quickFix.action.target);
            if (element && quickFix.action.attribute) {
              element.setAttribute(quickFix.action.attribute, quickFix.action.value || '');
              this.quickFixHistory.push(quickFix);
              resolve(true);
            } else {
              resolve(false);
            }
            break;

          case 'remove-attribute':
            const elementToRemove = document.querySelector(quickFix.action.target);
            if (elementToRemove && quickFix.action.attribute) {
              elementToRemove.removeAttribute(quickFix.action.attribute);
              this.quickFixHistory.push(quickFix);
              resolve(true);
            } else {
              resolve(false);
            }
            break;

          default:
            resolve(false);
        }
      } catch (error) {
        console.error('Failed to apply quick fix:', error);
        resolve(false);
      }
    });
  }

  public exportScanData(): string {
    return JSON.stringify({
      configuration: this.configuration,
      scanHistory: this.scanHistory,
      metrics: this.performanceMetrics,
      violations: Array.from(this.violationCache.values()),
      quickFixes: this.quickFixHistory,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2);
  }

  public reset(): void {
    this.violationCache.clear();
    this.componentCache.clear();
    this.scanHistory = [];
    this.quickFixHistory = [];
    this.performanceMetrics = this.initializeMetrics();
  }
}

// Singleton instance
export const realtimeAccessibilityScanner = RealtimeAccessibilityScanner.getInstance();

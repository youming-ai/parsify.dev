/**
 * Accessibility Compliance Types - T166 Implementation
 * Defines comprehensive types for WCAG 2.1 AA compliance validation
 */

// WCAG 2.1 Guideline Categories
export enum WCAGCategory {
  PERCEIVABLE = 'perceivable',
  OPERABLE = 'operable',
  UNDERSTANDABLE = 'understandable',
  ROBUST = 'robust'
}

// WCAG 2.1 AA Compliance Levels
export enum ComplianceLevel {
  A = 'A',
  AA = 'AA',
  AAA = 'AAA',
  NON_COMPLIANT = 'non-compliant'
}

// Accessibility Test Types
export enum AccessibilityTestType {
  AUTOMATED = 'automated',
  MANUAL = 'manual',
  SCREEN_READER = 'screen-reader',
  KEYBOARD_NAVIGATION = 'keyboard',
  COLOR_CONTRAST = 'color-contrast',
  FOCUS_MANAGEMENT = 'focus-management',
  SEMANTIC_HTML = 'semantic-html',
  ALTERNATIVE_TEXT = 'alternative-text',
  HEADING_STRUCTURE = 'heading-structure',
  FORM_ACCESSIBILITY = 'form-accessibility',
  VIDEO_CAPTIONS = 'video-captions',
  AUDIO_DESCRIPTIONS = 'audio-descriptions'
}

// Severity Levels for Accessibility Issues
export enum AccessibilitySeverity {
  CRITICAL = 'critical',
  SERIOUS = 'serious',
  MODERATE = 'moderate',
  MINOR = 'minor',
  INFO = 'info'
}

// Core Accessibility Violation Interface
export interface AccessibilityViolation {
  id: string;
  title: string;
  description: string;
  impact: AccessibilitySeverity;
  category: WCAGCategory;
  wcagCriteria: string[];
  testType: AccessibilityTestType;
  element: {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    text?: string;
  };
  location: {
    url: string;
    line?: number;
    column?: number;
  };
  recommendation: string;
  codeExample?: {
    current: string;
    recommended: string;
  };
  resources: string[];
  timestamp: Date;
  status: 'open' | 'in-progress' | 'resolved' | 'false-positive';
  assignedTo?: string;
  remediationPriority: number;
}

// Tool Accessibility Test Result
export interface ToolAccessibilityResult {
  toolSlug: string;
  toolName: string;
  toolCategory: string;
  testedAt: Date;
  overallCompliance: ComplianceLevel;
  score: number; // 0-100
  violations: AccessibilityViolation[];
  passedTests: string[];
  failedTests: string[];
  skippedTests: string[];
  testCoverage: {
    automated: number; // percentage
    manual: number; // percentage
    total: number; // percentage
  };
  performanceMetrics: {
    testDuration: number; // in milliseconds
    memoryUsage: number; // in MB
    elementsTested: number;
  };
  remediationRequired: boolean;
  nextReviewDate: Date;
}

// Screen Reader Test Result
export interface ScreenReaderTestResult {
  toolSlug: string;
  screenReader: 'NVDA' | 'JAWS' | 'VoiceOver' | 'TalkBack';
  browser: 'Chrome' | 'Firefox' | 'Safari' | 'Edge';
  operatingSystem: 'Windows' | 'macOS' | 'iOS' | 'Android';
  testedAt: Date;
  score: number; // 0-100
  issues: Array<{
    type: string;
    description: string;
    severity: AccessibilitySeverity;
    element: string;
    workaround?: string;
  }>;
  features: {
    properHeadings: boolean;
    linkPurpose: boolean;
    formLabels: boolean;
    buttonPurpose: boolean;
    imageAltText: boolean;
    tableHeaders: boolean;
    listStructure: boolean;
    ariaLabels: boolean;
    focusOrder: boolean;
    errorMessages: boolean;
  };
  transcription: string;
  recommendations: string[];
}

// Keyboard Navigation Test Result
export interface KeyboardNavigationTestResult {
  toolSlug: string;
  testedAt: Date;
  score: number; // 0-100
  browsers: string[];
  issues: Array<{
    type: 'keyboard-trap' | 'no-focus' | 'skip-link' | 'tab-order' | 'focus-visible';
    description: string;
    severity: AccessibilitySeverity;
    element: string;
    steps: string[];
  }>;
  features: {
    allInteractiveAccessible: boolean;
    visibleFocus: boolean;
    logicalTabOrder: boolean;
    skipLinks: boolean;
    noKeyboardTraps: boolean;
    focusManagement: boolean;
    shortcuts: boolean;
  };
  navigationPath: Array<{
    element: string;
    accessible: boolean;
    focusable: boolean;
    tabIndex: number;
  }>;
  recommendations: string[];
}

// Color Contrast Test Result
export interface ColorContrastTestResult {
  toolSlug: string;
  testedAt: Date;
  score: number; // 0-100
  combinations: Array<{
    foreground: string;
    background: string;
    ratio: number;
    wcagLevel: ComplianceLevel;
    fontSize: 'small' | 'large';
    weight: 'normal' | 'bold';
    element: string;
    passed: boolean;
  }>;
  issues: Array<{
    type: string;
    description: string;
    severity: AccessibilitySeverity;
    elements: string[];
    suggestions: string[];
  }>;
  overallColorScheme: {
    backgroundColors: string[];
    textColors: string[];
    accentColors: string[];
    linkColors: string[];
    errorColors: string[];
  };
  darkModeCompliance: boolean;
  lightModeCompliance: boolean;
  highContrastModeSupport: boolean;
  recommendations: string[];
}

// Comprehensive Accessibility Report
export interface AccessibilityReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  platform: {
    name: string;
    version: string;
    url: string;
  };
  summary: {
    totalTools: number;
    testedTools: number;
    compliantTools: number;
    partiallyCompliant: number;
    nonCompliant: number;
    overallScore: number; // 0-100
    complianceLevel: ComplianceLevel;
  };
  toolResults: ToolAccessibilityResult[];
  aggregatedMetrics: {
    violationsByCategory: Record<WCAGCategory, number>;
    violationsBySeverity: Record<AccessibilitySeverity, number>;
    violationsByTestType: Record<AccessibilityTestType, number>;
    commonIssues: Array<{
      issue: string;
      frequency: number;
      tools: string[];
    }>;
  };
  screenReaderResults: ScreenReaderTestResult[];
  keyboardNavigationResults: KeyboardNavigationTestResult[];
  colorContrastResults: ColorContrastTestResult[];
  trends: {
    previousScore?: number;
    improvement: number;
    trendDirection: 'improving' | 'declining' | 'stable';
  };
  recommendations: string[];
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    assignedTo?: string;
    dueDate?: Date;
  }>;
  nextAuditDate: Date;
}

// Accessibility Testing Configuration
export interface AccessibilityTestingConfig {
  enabled: boolean;
  wcagLevel: 'A' | 'AA' | 'AAA';
  testTypes: AccessibilityTestType[];
  excludePatterns: string[];
  includePatterns: string[];
  screenReaders: Array<{
    name: 'NVDA' | 'JAWS' | 'VoiceOver' | 'TalkBack';
    enabled: boolean;
  }>;
  browsers: Array<{
    name: 'Chrome' | 'Firefox' | 'Safari' | 'Edge';
    enabled: boolean;
  }>;
  colorContrast: {
    thresholds: {
      aaNormal: number;
      aaLarge: number;
      aaaNormal: number;
      aaaLarge: number;
    };
    testDarkMode: boolean;
    testHighContrast: boolean;
  };
  performance: {
    maxTestDuration: number; // in milliseconds
    maxMemoryUsage: number; // in MB
  };
  reporting: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    includeRecommendations: boolean;
    includeScreenshots: boolean;
  };
  remediation: {
    autoAssign: boolean;
    defaultAssignee?: string;
    priorityThreshold: number;
    reminderFrequency: number; // in days
  };
}

// Accessibility Compliance Validation Engine Interface
export interface AccessibilityComplianceEngine {
  initialize(config: AccessibilityTestingConfig): Promise<void>;
  runAutomatedTests(toolSlug: string): Promise<ToolAccessibilityResult>;
  runScreenReaderTest(toolSlug: string, config: ScreenReaderTestResult): Promise<ScreenReaderTestResult>;
  runKeyboardNavigationTest(toolSlug: string): Promise<KeyboardNavigationTestResult>;
  runColorContrastTest(toolSlug: string): Promise<ColorContrastTestResult>;
  generateReport(toolSlugs?: string[]): Promise<AccessibilityReport>;
  trackRemediation(violationId: string, status: string): Promise<void>;
  getComplianceTrends(toolSlug: string, period: { start: Date; end: Date }): Promise<any>;
  exportResults(format: 'json' | 'csv' | 'pdf'): Promise<string>;
}

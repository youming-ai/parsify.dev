/**
 * Error Handler Integration for Feedback System
 * Automatically creates bug reports from errors and integrates with existing error handling
 */

import { FeedbackSubmission, FeedbackType, ErrorContext } from '@/types/feedback';
import { useFeedbackStore } from '@/lib/feedback/feedback-store';

export interface ErrorHandlerConfig {
  enabled: boolean;
  autoCreateReports: boolean;
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  requireConfirmation: boolean;
  collectStackTrace: boolean;
  collectUserAgent: boolean;
  collectBrowserInfo: boolean;
  collectSessionData: boolean;
  maxReportsPerSession: number;
  cooldownPeriod: number; // minutes
  excludeErrors: string[];
  includeErrors: string[];
  customContext: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sessionId: string;
  userId?: string;
  tool?: string;
  action?: string;
  userAgent: string;
  url: string;
  stackTrace?: string;
  additionalData?: Record<string, any>;
  reportCreated: boolean;
  feedbackSubmissionId?: string;
}

export interface ErrorFeedbackData {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reproducibility: 'always' | 'sometimes' | 'rarely' | 'unable_to_reproduce';
  steps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: {
    os: string;
    browser: string;
    version: string;
    userAgent: string;
    screenResolution: string;
    language: string;
    timezone: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
  };
  browserInfo: {
    name: string;
    version: string;
    engine: string;
    plugins: string[];
    cookiesEnabled: boolean;
    javascriptEnabled: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
  };
  consoleErrors: string[];
  networkRequests: any[];
  stackTrace?: string;
  errorDetails: {
    message: string;
    name: string;
    line?: number;
    column?: number;
    source?: string;
  };
  userContext: {
    sessionId: string;
    journeyStage: string;
    toolsUsed: string[];
    timeInCurrentTool: number;
    recentActions: string[];
    customAttributes: Record<string, any>;
  };
}

export class FeedbackErrorHandler {
  private config: ErrorHandlerConfig;
  private errorReports: Map<string, ErrorReport> = new Map();
  private lastReportTime: number = 0;
  private sessionReportCount: number = 0;
  private globalErrorHandlerInstalled: boolean = false;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enabled: true,
      autoCreateReports: true,
      severityThreshold: 'medium',
      requireConfirmation: false,
      collectStackTrace: true,
      collectUserAgent: true,
      collectBrowserInfo: true,
      collectSessionData: true,
      maxReportsPerSession: 5,
      cooldownPeriod: 5, // 5 minutes
      excludeErrors: [],
      includeErrors: [],
      customContext: {},
      ...config,
    };

    if (typeof window !== 'undefined') {
      this.installGlobalErrorHandler();
    }
  }

  private installGlobalErrorHandler(): void {
    if (this.globalErrorHandlerInstalled) return;

    // Override console.error to capture errors
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Call original method
      originalConsoleError.apply(console, args);

      // Process error if handler is enabled
      if (this.config.enabled && args.length > 0) {
        const error = this.processConsoleError(args);
        if (error) {
          this.handleError(error, 'console');
        }
      }
    };

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.config.enabled) {
        const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
        this.handleError(error, 'promise', { reason: event.reason });
      }
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      if (this.config.enabled) {
        const error = new Error(event.message);
        (error as any).lineNumber = event.lineno;
        (error as any).columnNumber = event.colno;
        (error as any).filename = event.filename;
        this.handleError(error, 'window', { event });
      }
    });

    this.globalErrorHandlerInstalled = true;
  }

  private processConsoleError(args: any[]): Error | null {
    const firstArg = args[0];

    if (firstArg instanceof Error) {
      return firstArg;
    }

    if (typeof firstArg === 'string') {
      return new Error(firstArg);
    }

    if (firstArg && typeof firstArg === 'object') {
      const message = firstArg.message || firstArg.toString() || 'Unknown error';
      const error = new Error(message);

      // Copy additional properties
      Object.keys(firstArg).forEach(key => {
        if (key !== 'message') {
          (error as any)[key] = firstArg[key];
        }
      });

      return error;
    }

    return new Error(String(firstArg));
  }

  public handleError(
    error: Error,
    source: string = 'manual',
    additionalContext?: Record<string, any>
  ): ErrorReport | null {
    if (!this.config.enabled) {
      return null;
    }

    // Check if we should exclude this error
    if (this.config.excludeErrors.length > 0) {
      const shouldExclude = this.config.excludeErrors.some(pattern =>
        error.message.includes(pattern) || error.name.includes(pattern)
      );
      if (shouldExclude) return null;
    }

    // Check if we should only include specific errors
    if (this.config.includeErrors.length > 0) {
      const shouldInclude = this.config.includeErrors.some(pattern =>
        error.message.includes(pattern) || error.name.includes(pattern)
      );
      if (!shouldInclude) return null;
    }

    // Check cooldown period
    const now = Date.now();
    if (now - this.lastReportTime < this.config.cooldownPeriod * 60 * 1000) {
      return null;
    }

    // Check session limit
    if (this.sessionReportCount >= this.config.maxReportsPerSession) {
      return null;
    }

    // Determine severity
    const severity = this.determineErrorSeverity(error, source);

    // Check severity threshold
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    if (severityLevels[severity] < severityLevels[this.config.severityThreshold]) {
      return null;
    }

    // Create error report
    const errorReport = this.createErrorReport(error, source, severity, additionalContext);

    // Store report
    this.errorReports.set(errorReport.id, errorReport);
    this.lastReportTime = now;
    this.sessionReportCount++;

    // Auto-create feedback submission if enabled
    if (this.config.autoCreateReports) {
      this.createFeedbackSubmission(errorReport);
    }

    return errorReport;
  }

  private determineErrorSeverity(
    error: Error,
    source: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Check for critical keywords
    const criticalKeywords = [
      'fatal', 'critical', 'security', 'authentication', 'authorization',
      'permission denied', 'access denied', 'unauthorized', 'forbidden',
      'database connection', 'network', 'timeout', 'crash', 'exception'
    ];

    const highKeywords = [
      'error', 'failed', 'cannot', 'unable', 'not found', 'invalid',
      'missing', 'corrupted', 'broken', 'malformed', 'parse error'
    ];

    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Check for critical indicators
    if (criticalKeywords.some(keyword =>
      errorMessage.includes(keyword) || errorName.includes(keyword)
    )) {
      return 'critical';
    }

    // Check for high severity indicators
    if (highKeywords.some(keyword =>
      errorMessage.includes(keyword) || errorName.includes(keyword)
    )) {
      return 'high';
    }

    // Check source-based severity
    if (source === 'promise' || source === 'window') {
      return 'high';
    }

    // Default to medium
    return 'medium';
  }

  private createErrorReport(
    error: Error,
    source: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    additionalContext?: Record<string, any>
  ): ErrorReport {
    const sessionId = this.getSessionId();
    const timestamp = new Date();

    return {
      id: `error_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      error,
      severity,
      sessionId,
      context: this.createErrorContext(error, source, additionalContext),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: this.config.collectStackTrace ? error.stack : undefined,
      additionalData: additionalContext,
      reportCreated: false,
    };
  }

  private createErrorContext(
    error: Error,
    source: string,
    additionalContext?: Record<string, any>
  ): ErrorContext {
    return {
      system: 'parsify-feedback',
      component: 'error-handler',
      operation: source,
      sessionId: this.getSessionId(),
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData: {
        ...additionalContext,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        source,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private createFeedbackSubmission(errorReport: ErrorReport): void {
    try {
      const feedbackData = this.generateErrorFeedbackData(errorReport);

      // Create a bug report submission
      const submission: FeedbackSubmission = {
        id: `feedback_${errorReport.id}`,
        sessionId: errorReport.sessionId,
        timestamp: errorReport.timestamp,
        type: 'bug_report',
        source: 'error_handler',
        context: {
          page: window.location.pathname,
          userAgent: errorReport.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          sessionDuration: Date.now() - this.getSessionStartTime(),
          userJourneyStage: this.getCurrentJourneyStage(),
          tool: errorReport.tool,
          action: errorReport.action,
          errorContext: errorReport.context,
        },
        content: {
          bugReport: {
            title: this.generateErrorTitle(errorReport),
            description: this.generateErrorDescription(errorReport),
            severity: errorReport.severity,
            reproducibility: 'sometimes',
            steps: this.generateReproductionSteps(errorReport),
            expectedBehavior: 'The operation should complete successfully without errors',
            actualBehavior: errorReport.error.message,
            environment: feedbackData.environment,
            browserInfo: feedbackData.browserInfo,
            consoleErrors: feedbackData.consoleErrors,
            networkRequests: feedbackData.networkRequests,
            screenshots: [],
          },
        },
        metadata: {
          ipAddress: undefined, // Not collected for privacy
          location: undefined,
          deviceType: feedbackData.environment.deviceType,
          browser: feedbackData.browserInfo.name,
          os: feedbackData.environment.os,
          language: feedbackData.environment.language,
          timezone: feedbackData.environment.timezone,
          referrer: document.referrer,
          sessionId: errorReport.sessionId,
          journeyStage: this.getCurrentJourneyStage(),
          totalTimeOnPage: Date.now() - this.getSessionStartTime(),
          scrollDepth: 0,
          interactions: 0,
          formTime: 0,
          deviceOrientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
          connectionType: (navigator as any).connection?.effectiveType || 'unknown',
          batteryLevel: undefined,
        },
        status: 'new',
        priority: this.mapSeverityToPriority(errorReport.severity),
      };

      // Submit through feedback store
      const { submitQuickFeedback } = useFeedbackStore.getState();
      submitQuickFeedback({
        type: 'bug_report',
        title: submission.content.bugReport.title,
        message: submission.content.bugReport.description,
        source: 'error_handler',
        context: submission.context,
      }).then(() => {
        errorReport.reportCreated = true;
        errorReport.feedbackSubmissionId = submission.id;
      }).catch(error => {
        console.error('Failed to create error feedback submission:', error);
      });

    } catch (error) {
      console.error('Failed to create feedback data from error report:', error);
    }
  }

  private generateErrorFeedbackData(errorReport: ErrorReport): ErrorFeedbackData {
    return {
      title: this.generateErrorTitle(errorReport),
      description: this.generateErrorDescription(errorReport),
      severity: errorReport.severity,
      reproducibility: 'sometimes',
      steps: this.generateReproductionSteps(errorReport),
      expectedBehavior: 'The operation should complete successfully without errors',
      actualBehavior: errorReport.error.message,
      environment: this.getEnvironmentInfo(),
      browserInfo: this.getBrowserInfo(),
      consoleErrors: [],
      networkRequests: [],
      stackTrace: errorReport.stackTrace,
      errorDetails: {
        message: errorReport.error.message,
        name: errorReport.error.name,
        line: (errorReport.error as any).lineNumber,
        column: (errorReport.error as any).columnNumber,
        source: (errorReport.error as any).filename,
      },
      userContext: {
        sessionId: errorReport.sessionId,
        journeyStage: this.getCurrentJourneyStage(),
        toolsUsed: [],
        timeInCurrentTool: 0,
        recentActions: [],
        customAttributes: errorReport.additionalData || {},
      },
    };
  }

  private generateErrorTitle(errorReport: ErrorReport): string {
    const tool = errorReport.tool ? `[${errorReport.tool}] ` : '';
    const severity = errorReport.severity.toUpperCase();
    return `${tool}${severity} Error: ${errorReport.error.name}`;
  }

  private generateErrorDescription(errorReport: ErrorReport): string {
    const parts: string[] = [
      `**Error Message:** ${errorReport.error.message}`,
      `**Error Name:** ${errorReport.error.name}`,
      `**Severity:** ${errorReport.severity}`,
      `**URL:** ${errorReport.url}`,
      `**Timestamp:** ${errorReport.timestamp.toISOString()}`,
    ];

    if (errorReport.tool) {
      parts.push(`**Tool:** ${errorReport.tool}`);
    }

    if (errorReport.action) {
      parts.push(`**Action:** ${errorReport.action}`);
    }

    if (errorReport.stackTrace) {
      parts.push(`\n**Stack Trace:**\n\`\`\`\n${errorReport.stackTrace}\n\`\`\``);
    }

    if (errorReport.additionalData) {
      parts.push(`\n**Additional Context:**\n\`\`\`json\n${JSON.stringify(errorReport.additionalData, null, 2)}\n\`\`\``);
    }

    return parts.join('\n\n');
  }

  private generateReproductionSteps(errorReport: ErrorReport): string[] {
    const steps: string[] = [];

    if (errorReport.tool) {
      steps.push(`1. Navigate to the ${errorReport.tool} tool`);
    }

    if (errorReport.action) {
      steps.push(`2. Attempt to perform: ${errorReport.action}`);
    }

    steps.push('3. Error occurred');

    if (errorReport.url) {
      steps.push(`4. URL at time of error: ${errorReport.url}`);
    }

    return steps;
  }

  private mapSeverityToPriority(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    const mapping: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical',
    };
    return mapping[severity] || 'medium';
  }

  private getSessionId(): string {
    // Get session ID from feedback store or generate one
    const { sessionId } = useFeedbackStore.getState();
    return sessionId || this.generateSessionId();
  }

  private getSessionStartTime(): number {
    // Get session start time from feedback store
    const { sessionMetrics } = useFeedbackStore.getState();
    return sessionMetrics.sessionStartTime.getTime();
  }

  private getCurrentJourneyStage(): string {
    // Get current journey stage from feedback store
    const { currentJourneyStage } = useFeedbackStore.getState();
    return currentJourneyStage || 'unknown';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEnvironmentInfo(): ErrorFeedbackData['environment'] {
    const screen = screen;
    const nav = navigator;

    return {
      os: this.detectOS(),
      browser: this.detectBrowser(),
      version: nav.userAgent,
      userAgent: nav.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      language: nav.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      deviceType: this.detectDeviceType(),
    };
  }

  private getBrowserInfo(): ErrorFeedbackData['browserInfo'] {
    const nav = navigator;

    return {
      name: this.detectBrowser(),
      version: this.detectBrowserVersion(),
      engine: this.detectBrowserEngine(),
      plugins: Array.from(nav.plugins).map(p => p.name),
      cookiesEnabled: nav.cookieEnabled,
      javascriptEnabled: true,
      localStorage: this.checkLocalStorage(),
      sessionStorage: this.checkSessionStorage(),
    };
  }

  private detectOS(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('windows')) return 'Windows';
    if (userAgent.includes('mac')) return 'macOS';
    if (userAgent.includes('linux')) return 'Linux';
    if (userAgent.includes('android')) return 'Android';
    if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';

    return 'Unknown';
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari')) return 'Safari';
    if (userAgent.includes('edge')) return 'Edge';
    if (userAgent.includes('opera')) return 'Opera';

    return 'Unknown';
  }

  private detectBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const browser = this.detectBrowser();

    switch (browser) {
      case 'Chrome':
        return userAgent.match(/chrome\/(\d+)/)?.[1] || 'Unknown';
      case 'Firefox':
        return userAgent.match(/firefox\/(\d+)/)?.[1] || 'Unknown';
      case 'Safari':
        return userAgent.match(/version\/(\d+)/)?.[1] || 'Unknown';
      case 'Edge':
        return userAgent.match(/edge\/(\d+)/)?.[1] || 'Unknown';
      default:
        return 'Unknown';
    }
  }

  private detectBrowserEngine(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('webkit')) return 'WebKit';
    if (userAgent.includes('gecko')) return 'Gecko';
    if (userAgent.includes('trident')) return 'Trident';

    return 'Unknown';
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('mobile') || userAgent.includes('android')) {
      return 'mobile';
    }

    if (userAgent.includes('ipad') || userAgent.includes('tablet')) {
      return 'tablet';
    }

    return 'desktop';
  }

  private checkLocalStorage(): boolean {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  }

  private checkSessionStorage(): boolean {
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  }

  // Public methods
  public updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getErrorReports(): ErrorReport[] {
    return Array.from(this.errorReports.values());
  }

  public getErrorReport(id: string): ErrorReport | undefined {
    return this.errorReports.get(id);
  }

  public clearErrorReports(): void {
    this.errorReports.clear();
    this.sessionReportCount = 0;
  }

  public getSessionReportCount(): number {
    return this.sessionReportCount;
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public enable(): void {
    this.config.enabled = true;
  }

  public disable(): void {
    this.config.enabled = false;
  }

  // Manual error reporting
  public reportError(
    error: Error | string,
    context?: Record<string, any>
  ): ErrorReport | null {
    const errorObj = error instanceof Error ? error : new Error(error);
    return this.handleError(errorObj, 'manual', context);
  }

  public reportErrorWithConfirmation(
    error: Error | string,
    context?: Record<string, any>
  ): Promise<ErrorReport | null> {
    return new Promise((resolve) => {
      const errorObj = error instanceof Error ? error : new Error(error);

      if (!this.config.requireConfirmation) {
        resolve(this.handleError(errorObj, 'manual', context));
        return;
      }

      // Show confirmation dialog
      if (confirm(`An error occurred: ${errorObj.message}\n\nWould you like to report this issue?`)) {
        resolve(this.handleError(errorObj, 'manual', context));
      } else {
        resolve(null);
      }
    });
  }
}

// Export singleton instance
export const feedbackErrorHandler = new FeedbackErrorHandler();

// Export convenience functions
export const reportError = (error: Error | string, context?: Record<string, any>) =>
  feedbackErrorHandler.reportError(error, context);

export const reportErrorWithConfirmation = (error: Error | string, context?: Record<string, any>) =>
  feedbackErrorHandler.reportErrorWithConfirmation(error, context);

export default feedbackErrorHandler;

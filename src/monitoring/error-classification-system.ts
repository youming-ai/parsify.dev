/**
 * Error Classification System for SC-009 Compliance
 * Automatically classifies errors, determines recovery strategies, and tracks SC-009 compliance
 * Provides intelligent error categorization and recovery guidance
 */

import {
  ErrorType,
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
  RecoveryStrategy,
  ErrorEvent,
  RecoveryGuidance,
  GuidanceType,
  GuidanceStep,
  GuidanceExample,
  GuidanceResource
} from './error-recovery-types';

// ============================================================================
// Error Classification Rules
// ============================================================================

interface ErrorClassificationRule {
  patterns: RegExp[];
  keywords: string[];
  type: ErrorType;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryStrategy: RecoveryStrategy;
  requiresUserInput: boolean;
  canAutoRetry: boolean;
  guidance?: RecoveryGuidanceTemplate;
}

interface RecoveryGuidanceTemplate {
  type: GuidanceType;
  title: string;
  description: string;
  steps: GuidanceStepTemplate[];
  examples?: GuidanceExampleTemplate[];
  resources?: GuidanceResourceTemplate[];
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GuidanceStepTemplate {
  order: number;
  title: string;
  description: string;
  action?: string;
  expected?: string;
  interactive?: boolean;
  validation?: string;
}

interface GuidanceExampleTemplate {
  title: string;
  description: string;
  code?: string;
  before?: string;
  after?: string;
  explanation?: string;
}

interface GuidanceResourceTemplate {
  type: 'documentation' | 'video' | 'tutorial' | 'forum' | 'support';
  title: string;
  url: string;
  description?: string;
}

// ============================================================================
// Classification System Implementation
// ============================================================================

export class ErrorClassificationSystem {
  private static instance: ErrorClassificationSystem;
  private rules: ErrorClassificationRule[];
  private fallbackStrategy: RecoveryStrategy = 'escalation';
  private guidanceTemplates: Map<string, RecoveryGuidanceTemplate> = new Map();

  private constructor() {
    this.rules = this.initializeClassificationRules();
    this.initializeGuidanceTemplates();
  }

  public static getInstance(): ErrorClassificationSystem {
    if (!ErrorClassificationSystem.instance) {
      ErrorClassificationSystem.instance = new ErrorClassificationSystem();
    }
    return ErrorClassificationSystem.instance;
  }

  // Main classification method
  public classifyError(
    errorMessage: string,
    errorContext: ErrorContext,
    additionalData?: Record<string, any>
  ): {
    type: ErrorType;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoveryStrategy: RecoveryStrategy;
    requiresUserInput: boolean;
    canAutoRetry: boolean;
    confidence: number;
    sc009Compliant: boolean;
    guidance?: RecoveryGuidanceTemplate;
  } {
    const normalizedMessage = errorMessage.toLowerCase().trim();
    let bestMatch: ErrorClassificationRule | null = null;
    let bestScore = 0;

    // Find the best matching rule
    for (const rule of this.rules) {
      const score = this.calculateMatchScore(normalizedMessage, errorContext, rule, additionalData);
      if (score > bestScore && score > 0.3) { // Minimum confidence threshold
        bestScore = score;
        bestMatch = rule;
      }
    }

    // If no rule matches well, use context-based classification
    if (!bestMatch) {
      return this.contextBasedClassification(normalizedMessage, errorContext, additionalData);
    }

    // Determine SC-009 compliance based on the error type and recovery strategy
    const sc009Compliant = this.isSC009Compliant(bestMatch.type, bestMatch.recoveryStrategy);

    return {
      type: bestMatch.type,
      category: bestMatch.category,
      severity: bestMatch.severity,
      recoveryStrategy: bestMatch.recoveryStrategy,
      requiresUserInput: bestMatch.requiresUserInput,
      canAutoRetry: bestMatch.canAutoRetry,
      confidence: bestScore,
      sc009Compliant,
      guidance: bestMatch.guidance
    };
  }

  // Calculate match score for a rule
  private calculateMatchScore(
    message: string,
    context: ErrorContext,
    rule: ErrorClassificationRule,
    additionalData?: Record<string, any>
  ): number {
    let score = 0;
    let maxScore = 0;

    // Pattern matching (highest weight)
    for (const pattern of rule.patterns) {
      maxScore += 0.5;
      if (pattern.test(message)) {
        score += 0.5;
        break; // Only count pattern match once
      }
    }

    // Keyword matching
    let keywordMatches = 0;
    for (const keyword of rule.keywords) {
      maxScore += 0.3 / rule.keywords.length;
      if (message.includes(keyword.toLowerCase())) {
        keywordMatches++;
        score += 0.3 / rule.keywords.length;
      }
    }

    // Context matching
    if (this.contextMatchesCategory(context, rule.category)) {
      score += 0.2;
    }
    maxScore += 0.2;

    // Additional data matching
    if (additionalData) {
      const contextScore = this.additionalDataMatches(message, additionalData, rule);
      score += contextScore * 0.1;
      maxScore += 0.1;
    }

    return maxScore > 0 ? score / maxScore : 0;
  }

  // Context-based classification fallback
  private contextBasedClassification(
    message: string,
    context: ErrorContext,
    additionalData?: Record<string, any>
  ): {
    type: ErrorType;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoveryStrategy: RecoveryStrategy;
    requiresUserInput: boolean;
    canAutoRetry: boolean;
    confidence: number;
    sc009Compliant: boolean;
    guidance?: RecoveryGuidanceTemplate;
  } {
    let type: ErrorType = 'unknown_error';
    let category: ErrorCategory = 'system_resource';
    let severity: ErrorSeverity = 'medium';
    let strategy: RecoveryStrategy = this.fallbackStrategy;
    let requiresUserInput = true;
    let canAutoRetry = false;

    // Analyze message content for clues
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      type = 'network_timeout';
      category = 'network';
      severity = 'medium';
      strategy = 'network_retry';
      requiresUserInput = false;
      canAutoRetry = true;
    } else if (message.includes('file') && (message.includes('size') || message.includes('large'))) {
      type = 'file_size_limit_exceeded';
      category = 'file_processing';
      severity = 'medium';
      strategy = 'guided_correction';
      requiresUserInput = true;
      canAutoRetry = false;
    } else if (message.includes('format') || message.includes('parse') || message.includes('invalid')) {
      type = 'invalid_input_format';
      category = 'user_input';
      severity = 'medium';
      strategy = 'retry_with_corrected_input';
      requiresUserInput = true;
      canAutoRetry = false;
    } else if (message.includes('permission') || message.includes('access') || message.includes('unauthorized')) {
      type = 'permission_denied';
      category = 'security';
      severity = 'high';
      strategy = 'escalation';
      requiresUserInput = true;
      canAutoRetry = false;
    }

    // Check context for additional clues
    if (context.inputSize && context.inputSize > 0) {
      if (context.inputSize > 10 * 1024 * 1024) { // > 10MB
        type = 'file_size_limit_exceeded';
        category = 'file_processing';
        severity = 'medium';
        strategy = 'guided_correction';
        requiresUserInput = true;
        canAutoRetry = false;
      }
    }

    if (context.deviceType === 'mobile') {
      severity = this.adjustSeverityForDevice(severity, 'mobile');
    }

    const sc009Compliant = this.isSC009Compliant(type, strategy);

    return {
      type,
      category,
      severity,
      recoveryStrategy: strategy,
      requiresUserInput,
      canAutoRetry,
      confidence: 0.5, // Lower confidence for context-based classification
      sc009Compliant
    };
  }

  // Check if context matches category
  private contextMatchesCategory(context: ErrorContext, category: ErrorCategory): boolean {
    switch (category) {
      case 'network':
        return context.connectionType !== undefined ||
               context.url.includes('http') ||
               context.referrer?.includes('http');

      case 'file_processing':
        return context.fileName !== undefined ||
               context.fileSize !== undefined ||
               context.userAction?.includes('upload') ||
               context.userAction?.includes('download');

      case 'user_input':
        return context.formData !== undefined ||
               context.inputSize !== undefined ||
               context.userAction?.includes('input') ||
               context.userAction?.includes('submit');

      case 'system_resource':
        return context.deviceType !== undefined ||
               context.connectionType !== undefined;

      default:
        return false;
    }
  }

  // Additional data matching
  private additionalDataMatches(
    message: string,
    additionalData: Record<string, any>,
    rule: ErrorClassificationRule
  ): number {
    let score = 0;

    // Check for specific data patterns
    if (additionalData.fileSize && rule.category === 'file_processing') {
      score += 0.5;
    }

    if (additionalData.networkError && rule.category === 'network') {
      score += 0.5;
    }

    if (additionalData.validationError && rule.category === 'user_input') {
      score += 0.5;
    }

    return Math.min(score, 1.0);
  }

  // Adjust severity based on device type
  private adjustSeverityForDevice(severity: ErrorSeverity, deviceType: 'mobile' | 'tablet' | 'desktop'): ErrorSeverity {
    if (deviceType === 'mobile') {
      // Mobile users have less tolerance for errors, increase severity
      switch (severity) {
        case 'low': return 'medium';
        case 'medium': return 'high';
        case 'high': return 'critical';
        default: return severity;
      }
    }
    return severity;
  }

  // Check SC-009 compliance
  private isSC009Compliant(errorType: ErrorType, recoveryStrategy: RecoveryStrategy): boolean {
    // Define which error types and recovery strategies are SC-009 compliant
    const compliantStrategies: Set<RecoveryStrategy> = new Set([
      'retry_with_same_input',
      'retry_with_corrected_input',
      'fallback_processing',
      'alternative_method',
      'guided_correction',
      'automatic_fix',
      'workaround_suggested',
      'graceful_degradation',
      'format_conversion',
      'cache_refresh',
      'network_retry'
    ]);

    // Some error types are inherently more challenging for recovery
    const challengingTypes: Set<ErrorType> = new Set([
      'permission_denied',
      'resource_unavailable',
      'dependency_error',
      'unknown_error'
    ]);

    // Check if the strategy is compliant
    if (!compliantStrategies.has(recoveryStrategy)) {
      return false;
    }

    // Check if the error type is particularly challenging
    if (challengingTypes.has(errorType)) {
      // These types need excellent recovery strategies to be compliant
      return recoveryStrategy === 'alternative_method' ||
             recoveryStrategy === 'escalation' ||
             recoveryStrategy === 'workaround_suggested';
    }

    return true;
  }

  // Generate recovery guidance
  public generateRecoveryGuidance(
    errorType: ErrorType,
    recoveryStrategy: RecoveryStrategy,
    context: ErrorContext
  ): RecoveryGuidance | null {
    const templateKey = `${errorType}_${recoveryStrategy}`;
    const template = this.guidanceTemplates.get(templateKey);

    if (!template) {
      return this.generateGenericGuidance(errorType, recoveryStrategy, context);
    }

    return {
      id: this.generateGuidanceId(),
      type: template.type,
      title: template.title,
      description: template.description,
      steps: template.steps.map(step => ({
        ...step,
        // Personalize steps based on context
        description: this.personalizeStep(step.description, context)
      })),
      examples: template.examples?.map(example => ({
        ...example,
        // Personalize examples based on context
        description: this.personalizeExample(example.description, context)
      })),
      resources: template.resources?.map(resource => ({ ...resource })),
      estimatedTime: this.adjustEstimatedTime(template.estimatedTime, context),
      difficulty: template.difficulty
    };
  }

  // Generate generic guidance when no template is available
  private generateGenericGuidance(
    errorType: ErrorType,
    recoveryStrategy: RecoveryStrategy,
    context: ErrorContext
  ): RecoveryGuidance {
    return {
      id: this.generateGuidanceId(),
      type: 'step_by_step_instructions',
      title: `How to resolve ${this.formatErrorType(errorType)}`,
      description: `Follow these steps to recover from the error and complete your task.`,
      steps: [
        {
          order: 1,
          title: 'Review the error details',
          description: 'Carefully read the error message to understand what went wrong.',
          interactive: false
        },
        {
          order: 2,
          title: 'Try the suggested solution',
          description: `Attempt to ${this.formatRecoveryStrategy(recoveryStrategy)}.`,
          interactive: true,
          action: 'retry'
        },
        {
          order: 3,
          title: 'Verify the fix',
          description: 'Check if the issue has been resolved and your task can proceed.',
          interactive: false
        }
      ],
      estimatedTime: 30,
      difficulty: 'medium'
    };
  }

  // Helper methods
  private generateGuidanceId(): string {
    return `guidance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private personalizeStep(description: string, context: ErrorContext): string {
    // Simple personalization based on context
    if (context.deviceType === 'mobile') {
      description = description.replace(/click/g, 'tap');
    }

    if (context.fileName) {
      description = description.replace('your file', `"${context.fileName}"`);
    }

    return description;
  }

  private personalizeExample(description: string, context: ErrorContext): string {
    return this.personalizeStep(description, context);
  }

  private adjustEstimatedTime(baseTime: number, context: ErrorContext): number {
    // Adjust time based on device type and context
    if (context.deviceType === 'mobile') {
      return baseTime * 1.2; // Mobile users typically take longer
    }

    if (context.connectionType === 'slow-2g' || context.connectionType === '2g') {
      return baseTime * 1.5; // Slow connections require more time
    }

    return baseTime;
  }

  private formatErrorType(errorType: ErrorType): string {
    return errorType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private formatRecoveryStrategy(strategy: RecoveryStrategy): string {
    return strategy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Initialize classification rules
  private initializeClassificationRules(): ErrorClassificationRule[] {
    return [
      // Input validation errors
      {
        patterns: [/invalid.*input/i, /validation.*failed/i, /malformed/i],
        keywords: ['invalid', 'validation', 'malformed', 'incorrect', 'wrong'],
        type: 'invalid_input_format',
        category: 'user_input',
        severity: 'medium',
        recoveryStrategy: 'retry_with_corrected_input',
        requiresUserInput: true,
        canAutoRetry: false,
        guidance: {
          type: 'step_by_step_instructions',
          title: 'Fix Invalid Input Format',
          description: 'Your input doesn\'t match the required format. Here\'s how to fix it:',
          steps: [
            {
              order: 1,
              title: 'Check the required format',
              description: 'Review the input requirements and format specifications.',
              interactive: false
            },
            {
              order: 2,
              title: 'Correct your input',
              description: 'Update your input to match the required format.',
              interactive: true,
              action: 'correct_input'
            },
            {
              order: 3,
              title: 'Try again',
              description: 'Submit your corrected input.',
              interactive: true,
              action: 'retry'
            }
          ],
          examples: [
            {
              title: 'JSON Format Example',
              description: 'Ensure your JSON is properly formatted with matching brackets and quotes.',
              code: '{"key": "value", "number": 123}',
              explanation: 'Proper JSON with quotes around strings and comma-separated key-value pairs.'
            }
          ],
          estimatedTime: 45,
          difficulty: 'easy'
        }
      },

      // File size errors
      {
        patterns: [/file.*too.*large/i, /size.*limit/i, /exceeds.*limit/i],
        keywords: ['large', 'size', 'limit', 'exceeds', 'maximum', 'mb', 'gb'],
        type: 'file_size_limit_exceeded',
        category: 'file_processing',
        severity: 'medium',
        recoveryStrategy: 'guided_correction',
        requiresUserInput: true,
        canAutoRetry: false,
        guidance: {
          type: 'interactive_tutorial',
          title: 'Reduce File Size',
          description: 'Your file exceeds the size limit. Let\'s help you reduce it:',
          steps: [
            {
              order: 1,
              title: 'Check current file size',
              description: 'Your file is currently {fileSize}, but the limit is {limit}.',
              interactive: false
            },
            {
              order: 2,
              title: 'Choose reduction method',
              description: 'Select how you\'d like to reduce the file size.',
              interactive: true,
              action: 'choose_method'
            },
            {
              order: 3,
              title: 'Apply reduction',
              description: 'Apply the selected reduction method to your file.',
              interactive: true,
              action: 'apply_reduction'
            }
          ],
          estimatedTime: 120,
          difficulty: 'medium'
        }
      },

      // Network timeout errors
      {
        patterns: [/timeout/i, /network.*error/i, /connection.*lost/i],
        keywords: ['timeout', 'network', 'connection', 'lost', 'unreachable', 'slow'],
        type: 'network_timeout',
        category: 'network',
        severity: 'medium',
        recoveryStrategy: 'network_retry',
        requiresUserInput: false,
        canAutoRetry: true,
        guidance: {
          type: 'troubleshooting_guide',
          title: 'Fix Network Issues',
          description: 'Network connection problems detected. Here\'s how to resolve them:',
          steps: [
            {
              order: 1,
              title: 'Check your connection',
              description: 'Verify your internet connection is working properly.',
              interactive: false
            },
            {
              order: 2,
              title: 'Retry the operation',
              description: 'Try the operation again. We\'ll automatically retry up to 3 times.',
              interactive: true,
              action: 'retry'
            },
            {
              order: 3,
              title: 'Refresh if needed',
              description: 'If retries don\'t work, try refreshing the page.',
              interactive: true,
              action: 'refresh'
            }
          ],
          estimatedTime: 30,
          difficulty: 'easy'
        }
      },

      // Unsupported format errors
      {
        patterns: [/unsupported.*format/i, /format.*not.*supported/i, /cannot.*process/i],
        keywords: ['unsupported', 'format', 'not supported', 'cannot process'],
        type: 'unsupported_format',
        category: 'file_processing',
        severity: 'medium',
        recoveryStrategy: 'format_conversion',
        requiresUserInput: true,
        canAutoRetry: false,
        guidance: {
          type: 'interactive_tutorial',
          title: 'Convert File Format',
          description: 'This file format isn\'t supported. Let\'s convert it to a compatible format:',
          steps: [
            {
              order: 1,
              title: 'Select target format',
              description: 'Choose from the list of supported formats.',
              interactive: true,
              action: 'select_format'
            },
            {
              order: 2,
              title: 'Convert the file',
              description: 'We\'ll convert your file to the selected format.',
              interactive: true,
              action: 'convert'
            },
            {
              order: 3,
              title: 'Verify conversion',
              description: 'Check that the converted file maintains your data correctly.',
              interactive: true,
              action: 'verify'
            }
          ],
          estimatedTime: 90,
          difficulty: 'medium'
        }
      },

      // Processing failure errors
      {
        patterns: [/processing.*failed/i, /error.*processing/i, /failed.*to.*process/i],
        keywords: ['processing', 'failed', 'error', 'cannot process'],
        type: 'processing_failure',
        category: 'business_logic',
        severity: 'high',
        recoveryStrategy: 'fallback_processing',
        requiresUserInput: false,
        canAutoRetry: true,
        guidance: {
          type: 'troubleshooting_guide',
          title: 'Recover from Processing Failure',
          description: 'Processing encountered an error. We\'ll try alternative approaches:',
          steps: [
            {
              order: 1,
              title: 'Identify the issue',
              description: 'We\'re analyzing what caused the processing failure.',
              interactive: false
            },
            {
              order: 2,
              title: 'Try alternative method',
              description: 'Attempting a different processing approach.',
              interactive: true,
              action: 'try_alternative'
            },
            {
              order: 3,
              title: 'Verify results',
              description: 'Check if the alternative method produced the expected results.',
              interactive: true,
              action: 'verify'
            }
          ],
          estimatedTime: 60,
          difficulty: 'medium'
        }
      },

      // Permission errors
      {
        patterns: [/permission.*denied/i, /access.*denied/i, /unauthorized/i],
        keywords: ['permission', 'denied', 'access', 'unauthorized', 'forbidden'],
        type: 'permission_denied',
        category: 'security',
        severity: 'high',
        recoveryStrategy: 'escalation',
        requiresUserInput: true,
        canAutoRetry: false,
        guidance: {
          type: 'troubleshooting_guide',
          title: 'Resolve Permission Issues',
          description: 'You don\'t have the necessary permissions for this operation:',
          steps: [
            {
              order: 1,
              title: 'Check your account',
              description: 'Verify you\'re logged in with the correct account.',
              interactive: false
            },
            {
              order: 2,
              title: 'Request permissions',
              description: 'Contact your administrator to request the necessary permissions.',
              interactive: true,
              action: 'request_permissions'
            },
            {
              order: 3,
              title: 'Try alternative approach',
              description: 'Use a different method that doesn\'t require these permissions.',
              interactive: true,
              action: 'try_alternative'
            }
          ],
          estimatedTime: 300,
          difficulty: 'hard'
        }
      }
    ];
  }

  // Initialize guidance templates
  private initializeGuidanceTemplates(): void {
    // Add specific guidance templates for common error/strategy combinations
    const templates: Array<{ key: string; template: RecoveryGuidanceTemplate }> = [
      {
        key: 'invalid_input_format_retry_with_corrected_input',
        template: {
          type: 'interactive_tutorial',
          title: 'Fix Input Format Issues',
          description: 'Let\'s correct your input format step by step:',
          steps: [
            {
              order: 1,
              title: 'Identify the issue',
              description: 'Review the highlighted areas that need correction.',
              interactive: true,
              action: 'highlight_issues'
            },
            {
              order: 2,
              title: 'Make corrections',
              description: 'Update the input based on the format requirements.',
              interactive: true,
              action: 'correct_input'
            },
            {
              order: 3,
              title: 'Validate your changes',
              description: 'We\'ll check if your corrections meet the format requirements.',
              interactive: true,
              action: 'validate',
              validation: 'format_check'
            }
          ],
          estimatedTime: 30,
          difficulty: 'easy'
        }
      }
    ];

    templates.forEach(({ key, template }) => {
      this.guidanceTemplates.set(key, template);
    });
  }

  // Public API methods
  public getSupportedErrorTypes(): ErrorType[] {
    return Array.from(new Set(this.rules.map(rule => rule.type)));
  }

  public getSupportedRecoveryStrategies(): RecoveryStrategy[] {
    return Array.from(new Set(this.rules.map(rule => rule.recoveryStrategy)));
  }

  public getRuleForErrorType(errorType: ErrorType): ErrorClassificationRule | null {
    return this.rules.find(rule => rule.type === errorType) || null;
  }

  public addCustomRule(rule: ErrorClassificationRule): void {
    this.rules.push(rule);
  }

  public updateRule(index: number, rule: ErrorClassificationRule): void {
    if (index >= 0 && index < this.rules.length) {
      this.rules[index] = rule;
    }
  }

  public removeRule(index: number): void {
    if (index >= 0 && index < this.rules.length) {
      this.rules.splice(index, 1);
    }
  }

  public getRules(): ErrorClassificationRule[] {
    return [...this.rules];
  }

  public validateSC009Compliance(errorEvent: Partial<ErrorEvent>): {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!errorEvent.type || !errorEvent.recoveryStrategy) {
      issues.push('Missing error type or recovery strategy');
      return { compliant: false, issues, recommendations };
    }

    const isCompliant = this.isSC009Compliant(errorEvent.type, errorEvent.recoveryStrategy);

    if (!isCompliant) {
      issues.push(`Error type "${errorEvent.type}" with recovery strategy "${errorEvent.recoveryStrategy}" is not SC-009 compliant`);

      // Suggest alternative strategies
      const rule = this.getRuleForErrorType(errorEvent.type);
      if (rule) {
        recommendations.push(`Consider using "${rule.recoveryStrategy}" instead`);
        recommendations.push(`Ensure clear user guidance is provided`);
      } else {
        recommendations.push(`Add a specific classification rule for error type "${errorEvent.type}"`);
        recommendations.push(`Implement a user-friendly recovery strategy`);
      }
    }

    // Check recovery attempt time
    if (errorEvent.totalRecoveryTime && errorEvent.totalRecoveryTime > 120000) { // 2 minutes
      issues.push('Recovery time exceeds 2 minutes, below SC-009 standards');
      recommendations.push('Optimize recovery process to complete within 2 minutes');
    }

    // Check user satisfaction
    if (errorEvent.userSatisfied === false) {
      issues.push('User reported dissatisfaction with recovery process');
      recommendations.push('Improve user guidance and recovery experience');
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }
}

// Export singleton instance
export const errorClassificationSystem = ErrorClassificationSystem.getInstance();

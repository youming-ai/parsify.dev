/**
 * Feature Usage Analytics Module - Comprehensive Feature Adoption Tracking for SC-012 Compliance
 * Tracks feature adoption, usage patterns, and provides insights for product improvement
 */

import { userAnalytics } from './user-analytics';
import { navigationAnalysis } from './navigation-analysis';
import { performanceObserver } from './performance-observer';

export interface FeatureDefinition {
  id: string;
  name: string;
  category: 'basic' | 'advanced' | 'experimental' | 'accessibility' | 'performance';
  description: string;
  toolIds: string[];
  dependencies?: string[];
  successCriteria: {
    usage: number; // minimum usage count to consider adopted
    retention: number; // minimum retention rate
    satisfaction: number; // minimum satisfaction score
  };
  metadata?: {
    version: string;
    releaseDate: Date;
    complexity: 'low' | 'medium' | 'high';
    documentation?: string;
    tutorials?: string[];
  };
}

export interface FeatureUsage {
  featureId: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  interactions: number;
  context: string;
  metadata?: {
    inputSize?: number;
    outputSize?: number;
    processingTime?: number;
    errors?: string[];
    satisfactionRating?: number;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    browser?: string;
  };
}

export interface FeatureAdoptionMetrics {
  // Overall adoption
  totalFeatures: number;
  adoptedFeatures: number;
  adoptionRate: number;
  adoptionTrend: Array<{ date: Date; rate: number }>;

  // Category breakdown
  adoptionByCategory: Array<{
    category: string;
    totalFeatures: number;
    adoptedFeatures: number;
    adoptionRate: number;
    averageSatisfaction: number;
    averageUsageTime: number;
  }>;

  // Feature-specific metrics
  featureMetrics: Array<{
    featureId: string;
    featureName: string;
    category: string;
    totalUsers: number;
    activeUsers: number;
    adoptionRate: number;
    retentionRate: number;
    averageUsageTime: number;
    averageUsageFrequency: number;
    successRate: number;
    satisfactionScore: number;
    dropOffRate: number;
    errorRate: number;
    learningCurve: Array<{ day: number; competency: number }>;
  }>;

  // User segments
  adoptionByUserSegment: Array<{
    segment: string;
    totalUsers: number;
    averageFeaturesAdopted: number;
    mostUsedFeatures: string[];
    adoptionRate: number;
    satisfactionScore: number;
  }>;

  // Temporal patterns
  usagePatterns: {
    hourlyUsage: Array<{ hour: number; usage: number }>;
    dailyUsage: Array<{ day: string; usage: number }>;
    weeklyUsage: Array<{ week: number; usage: number }>;
    seasonalTrends: Array<{ month: string; usage: number }>;
  };

  // Correlation analysis
  featureCorrelations: Array<{
    feature1: string;
    feature2: string;
    correlation: number; // -1 to 1
    significance: number; // 0 to 1
  }>;

  // Performance impact
  performanceMetrics: Array<{
    featureId: string;
    averageLoadTime: number;
    errorRate: number;
    userSatisfactionImpact: number;
    systemResourceUsage: number;
  }>;
}

export interface FeatureInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedFeatures: string[];
  metrics: {
    currentValue: number;
    targetValue: number;
    changePercentage: number;
  };
  recommendations: string[];
  confidence: number; // 0-1
  timestamp: Date;
}

export interface FeatureFunnel {
  featureId: string;
  steps: Array<{
    name: string;
    description: string;
    users: number;
    conversionRate: number;
    dropOffReasons: Array<{ reason: string; count: number; percentage: number }>;
  }>;
  overallConversionRate: number;
  bottlenecks: Array<{
    step: number;
    issue: string;
    impact: number;
    recommendations: string[];
  }>;
}

export interface A/BTestResult {
  testId: string;
  featureId: string;
  hypothesis: string;
  variants: Array<{
    id: string;
    description: string;
    users: number;
    conversionRate: number;
    satisfaction: number;
    usageTime: number;
  }>;
  winner: string;
  confidence: number;
  statisticalSignificance: boolean;
  insights: string[];
  recommendations: string[];
  testDuration: number;
  startDate: Date;
  endDate: Date;
}

export class FeatureUsageAnalytics {
  private static instance: FeatureUsageAnalytics;
  private featureDefinitions: Map<string, FeatureDefinition> = new Map();
  private featureUsage: FeatureUsage[] = [];
  private userProfiles: Map<string, UserProfile> = new Map();
  private adoptionMetrics?: FeatureAdoptionMetrics;
  private insights: FeatureInsight[] = [];
  private abTests: Map<string, A/BTestResult> = new Map();
  private isTracking = false;

  private constructor() {
    this.initializeFeatureDefinitions();
    this.initializeTracking();
  }

  public static getInstance(): FeatureUsageAnalytics {
    if (!FeatureUsageAnalytics.instance) {
      FeatureUsageAnalytics.instance = new FeatureUsageAnalytics();
    }
    return FeatureUsageAnalytics.instance;
  }

  // Initialize feature definitions
  private initializeFeatureDefinitions(): void {
    // JSON Processing Features
    this.registerFeature({
      id: 'json_formatter',
      name: 'JSON Formatter',
      category: 'basic',
      description: 'Format and prettify JSON data with customizable indentation',
      toolIds: ['json-formatter'],
      successCriteria: { usage: 5, retention: 0.7, satisfaction: 4.0 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        complexity: 'low',
      },
    });

    this.registerFeature({
      id: 'json_validator',
      name: 'JSON Validator',
      category: 'basic',
      description: 'Validate JSON syntax and structure with detailed error reporting',
      toolIds: ['json-validator'],
      successCriteria: { usage: 5, retention: 0.7, satisfaction: 4.0 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        complexity: 'low',
      },
    });

    this.registerFeature({
      id: 'json_path_queries',
      name: 'JSONPath Queries',
      category: 'advanced',
      description: 'Extract data from JSON using JSONPath expressions',
      toolIds: ['json-path-queries'],
      dependencies: ['json_formatter'],
      successCriteria: { usage: 3, retention: 0.6, satisfaction: 3.5 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-02-01'),
        complexity: 'medium',
      },
    });

    this.registerFeature({
      id: 'json_schema_generator',
      name: 'JSON Schema Generator',
      category: 'advanced',
      description: 'Generate JSON schemas from sample JSON data',
      toolIds: ['json-schema-generator'],
      dependencies: ['json_validator'],
      successCriteria: { usage: 3, retention: 0.6, satisfaction: 3.5 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-02-15'),
        complexity: 'medium',
      },
    });

    // Code Processing Features
    this.registerFeature({
      id: 'code_executor',
      name: 'Code Executor',
      category: 'basic',
      description: 'Execute code in multiple programming languages',
      toolIds: ['code-executor'],
      successCriteria: { usage: 5, retention: 0.7, satisfaction: 4.0 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        complexity: 'medium',
      },
    });

    this.registerFeature({
      id: 'code_formatter',
      name: 'Code Formatter',
      category: 'basic',
      description: 'Format and beautify code in various programming languages',
      toolIds: ['code-formatter'],
      successCriteria: { usage: 5, retention: 0.7, satisfaction: 4.0 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-01-15'),
        complexity: 'low',
      },
    });

    this.registerFeature({
      id: 'regex_tester',
      name: 'Regex Tester',
      category: 'advanced',
      description: 'Test and debug regular expressions with real-time matching',
      toolIds: ['regex-tester'],
      successCriteria: { usage: 3, retention: 0.6, satisfaction: 3.5 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-03-01'),
        complexity: 'medium',
      },
    });

    // File Processing Features
    this.registerFeature({
      id: 'file_converter',
      name: 'File Converter',
      category: 'basic',
      description: 'Convert files between different formats',
      toolIds: ['file-converter'],
      successCriteria: { usage: 5, retention: 0.7, satisfaction: 4.0 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        complexity: 'low',
      },
    });

    this.registerFeature({
      id: 'csv_processor',
      name: 'CSV Processor',
      category: 'advanced',
      description: 'Process and manipulate CSV files with various operations',
      toolIds: ['csv-processor'],
      dependencies: ['file_converter'],
      successCriteria: { usage: 3, retention: 0.6, satisfaction: 3.5 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-02-01'),
        complexity: 'medium',
      },
    });

    // Data Processing Features
    this.registerFeature({
      id: 'hash_generator',
      name: 'Hash Generator',
      category: 'basic',
      description: 'Generate various hash types from text or files',
      toolIds: ['hash-generator'],
      successCriteria: { usage: 5, retention: 0.7, satisfaction: 4.0 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        complexity: 'low',
      },
    });

    this.registerFeature({
      id: 'base64_converter',
      name: 'Base64 Converter',
      category: 'basic',
      description: 'Encode and decode Base64 strings and files',
      toolIds: ['base64-converter'],
      successCriteria: { usage: 5, retention: 0.7, satisfaction: 4.0 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        complexity: 'low',
      },
    });

    // Accessibility Features
    this.registerFeature({
      id: 'high_contrast_mode',
      name: 'High Contrast Mode',
      category: 'accessibility',
      description: 'High contrast mode for better visibility',
      toolIds: [],
      successCriteria: { usage: 1, retention: 0.8, satisfaction: 4.0 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        complexity: 'low',
      },
    });

    this.registerFeature({
      id: 'keyboard_navigation',
      name: 'Keyboard Navigation',
      category: 'accessibility',
      description: 'Enhanced keyboard navigation support',
      toolIds: [],
      successCriteria: { usage: 1, retention: 0.8, satisfaction: 4.0 },
      metadata: {
        version: '1.0.0',
        releaseDate: new Date('2024-01-01'),
        complexity: 'medium',
      },
    });
  }

  // Initialize tracking
  private initializeTracking(): void {
    if (typeof window === 'undefined') return;

    // Track feature usage from user analytics
    this.trackFromUserAnalytics();

    // Track navigation patterns for feature discovery
    this.trackFromNavigationAnalysis();

    // Track performance metrics for features
    this.trackFromPerformanceObserver();

    this.isTracking = true;
  }

  // Register a new feature
  public registerFeature(feature: FeatureDefinition): void {
    this.featureDefinitions.set(feature.id, feature);
  }

  // Track feature usage
  public trackFeatureUsage(
    featureId: string,
    usage: Omit<FeatureUsage, 'featureId' | 'sessionId' | 'timestamp'>
  ): void {
    const sessionId = navigationAnalysis.getActiveSessionId() || this.generateSessionId();

    const featureUsage: FeatureUsage = {
      featureId,
      sessionId,
      timestamp: new Date(),
      ...usage,
    };

    this.featureUsage.push(featureUsage);

    // Update user profile
    this.updateUserProfile(featureUsage);

    // Track in other analytics systems
    userAnalytics.trackFeatureUsage(featureId, featureUsage.context);

    // Generate insights
    this.generateFeatureInsights(featureId);

    // Cleanup old data
    this.cleanupOldData();
  }

  // Track feature adoption when user discovers a feature
  public trackFeatureDiscovery(
    featureId: string,
    discoveryMethod: 'navigation' | 'search' | 'recommendation' | 'tutorial' | 'documentation'
  ): void {
    this.trackFeatureUsage(featureId, {
      duration: 0,
      success: true,
      interactions: 1,
      context: `discovery_${discoveryMethod}`,
      metadata: {
        discoveryMethod,
      },
    });
  }

  // Track feature completion/success
  public trackFeatureCompletion(
    featureId: string,
    completionData: {
      duration: number;
      success: boolean;
      interactions: number;
      satisfactionRating?: number;
      errors?: string[];
      inputSize?: number;
      outputSize?: number;
      processingTime?: number;
    }
  ): void {
    this.trackFeatureUsage(featureId, {
      duration: completionData.duration,
      success: completionData.success,
      interactions: completionData.interactions,
      context: 'completion',
      metadata: {
        satisfactionRating: completionData.satisfactionRating,
        errors: completionData.errors,
        inputSize: completionData.inputSize,
        outputSize: completionData.outputSize,
        processingTime: completionData.processingTime,
        deviceType: this.detectDeviceType(),
        browser: this.detectBrowser(),
      },
    });
  }

  // Track feature abandonment
  public trackFeatureAbandonment(
    featureId: string,
    abandonmentData: {
      duration: number;
      interactions: number;
      abandonmentReason: 'error' | 'confusion' | 'complexity' | 'timeout' | 'found_alternative';
      lastAction: string;
      progressPercentage: number;
    }
  ): void {
    this.trackFeatureUsage(featureId, {
      duration: abandonmentData.duration,
      success: false,
      interactions: abandonmentData.interactions,
      context: `abandonment_${abandonmentData.abandonmentReason}`,
      metadata: {
        abandonmentReason: abandonmentData.abandonmentReason,
        lastAction: abandonmentData.lastAction,
        progressPercentage: abandonmentData.progressPercentage,
        deviceType: this.detectDeviceType(),
        browser: this.detectBrowser(),
      },
    });
  }

  // Get comprehensive feature adoption metrics
  public getFeatureAdoptionMetrics(): FeatureAdoptionMetrics {
    if (!this.adoptionMetrics) {
      this.adoptionMetrics = this.calculateAdoptionMetrics();
    }
    return this.adoptionMetrics;
  }

  // Get feature-specific metrics
  public getFeatureMetrics(featureId: string): FeatureAdoptionMetrics['featureMetrics'][0] | undefined {
    const metrics = this.getFeatureAdoptionMetrics();
    return metrics.featureMetrics.find(f => f.featureId === featureId);
  }

  // Get feature funnel analysis
  public getFeatureFunnel(featureId: string): FeatureFunnel | undefined {
    const feature = this.featureDefinitions.get(featureId);
    if (!feature) return undefined;

    const featureUsage = this.featureUsage.filter(u => u.featureId === featureId);

    // Define funnel steps based on feature type
    const steps = this.defineFunnelSteps(featureId);

    const funnelSteps = steps.map(step => {
      const usersAtStep = featureUsage.filter(usage =>
        this.isUsageAtStep(usage, step.name)
      ).length;

      const previousStepUsers = step.order === 0 ? usersAtStep :
        steps[step.order - 1] ?
          featureUsage.filter(usage => this.isUsageAtStep(usage, steps[step.order - 1].name)).length :
          usersAtStep;

      const conversionRate = previousStepUsers > 0 ? usersAtStep / previousStepUsers : 1;

      const dropOffReasons = this.analyzeDropOffReasons(featureUsage, step.name);

      return {
        name: step.name,
        description: step.description,
        users: usersAtStep,
        conversionRate: conversionRate * 100,
        dropOffReasons,
      };
    });

    const overallConversionRate = funnelSteps.length > 0 ?
      funnelSteps[funnelSteps.length - 1].users / funnelSteps[0].users : 0;

    const bottlenecks = this.identifyFunnelBottlenecks(funnelSteps);

    return {
      featureId,
      steps: funnelSteps,
      overallConversionRate: overallConversionRate * 100,
      bottlenecks,
    };
  }

  // Get feature insights
  public getFeatureInsights(severity?: FeatureInsight['severity']): FeatureInsight[] {
    let filteredInsights = this.insights;

    if (severity) {
      filteredInsights = filteredInsights.filter(insight => insight.severity === severity);
    }

    return filteredInsights.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // Get feature correlations
  public getFeatureCorrelations(): FeatureAdoptionMetrics['featureCorrelations'] {
    const correlations: FeatureAdoptionMetrics['featureCorrelations'] = [];
    const featureIds = Array.from(this.featureDefinitions.keys());

    for (let i = 0; i < featureIds.length; i++) {
      for (let j = i + 1; j < featureIds.length; j++) {
        const correlation = this.calculateFeatureCorrelation(featureIds[i], featureIds[j]);
        if (correlation !== null) {
          correlations.push({
            feature1: featureIds[i],
            feature2: featureIds[j],
            correlation: correlation.correlation,
            significance: correlation.significance,
          });
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  // Create A/B test for feature
  public createABTest(
    featureId: string,
    hypothesis: string,
    variants: Array<{ id: string; description: string }>
  ): string {
    const testId = this.generateTestId();

    const test: A/BTestResult = {
      testId,
      featureId,
      hypothesis,
      variants: variants.map(variant => ({
        ...variant,
        users: 0,
        conversionRate: 0,
        satisfaction: 0,
        usageTime: 0,
      })),
      winner: '',
      confidence: 0,
      statisticalSignificance: false,
      insights: [],
      recommendations: [],
      testDuration: 0,
      startDate: new Date(),
      endDate: new Date(),
    };

    this.abTests.set(testId, test);
    return testId;
  }

  // Record A/B test data
  public recordABTestData(
    testId: string,
    variantId: string,
    success: boolean,
    satisfaction?: number,
    usageTime?: number
  ): void {
    const test = this.abTests.get(testId);
    if (!test) return;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return;

    variant.users++;

    if (success) {
      const successCount = variant.users * variant.conversionRate + 1;
      variant.conversionRate = successCount / variant.users;
    }

    if (satisfaction !== undefined) {
      const totalSatisfaction = variant.users * variant.satisfaction + satisfaction;
      variant.satisfaction = totalSatisfaction / variant.users;
    }

    if (usageTime !== undefined) {
      const totalTime = variant.users * variant.usageTime + usageTime;
      variant.usageTime = totalTime / variant.users;
    }

    // Check if test should be concluded
    this.checkTestConclusion(testId);
  }

  // Export feature usage data
  public exportFeatureData(): string {
    const metrics = this.getFeatureAdoptionMetrics();
    const insights = this.getFeatureInsights();
    const correlations = this.getFeatureCorrelations();

    return JSON.stringify({
      featureDefinitions: Array.from(this.featureDefinitions.values()),
      featureUsage: this.featureUsage,
      metrics,
      insights,
      correlations,
      exportDate: new Date().toISOString(),
    }, null, 2);
  }

  // Private helper methods

  private trackFromUserAnalytics(): void {
    // This would integrate with the user analytics system to automatically track feature usage
    // Implementation would depend on the specific integration points
  }

  private trackFromNavigationAnalysis(): void {
    // This would integrate with navigation analysis to track feature discovery patterns
    // Implementation would depend on the specific integration points
  }

  private trackFromPerformanceObserver(): void {
    // This would integrate with performance observer to track feature performance
    // Implementation would depend on the specific integration points
  }

  private updateUserProfile(usage: FeatureUsage): void {
    const userId = usage.userId || usage.sessionId;

    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, this.createUserProfile(userId));
    }

    const profile = this.userProfiles.get(userId)!;

    // Update feature usage
    if (!profile.usedFeatures.includes(usage.featureId)) {
      profile.usedFeatures.push(usage.featureId);
    }

    profile.totalFeatureUsage++;
    profile.lastActivity = usage.timestamp;

    // Update satisfaction if available
    if (usage.metadata?.satisfactionRating) {
      profile.satisfactionScores.push(usage.metadata.satisfactionRating);
    }

    // Update segment
    profile.segment = this.determineUserSegment(profile);
  }

  private createUserProfile(userId: string): UserProfile {
    return {
      id: userId,
      segment: 'new',
      usedFeatures: [],
      totalFeatureUsage: 0,
      satisfactionScores: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };
  }

  private determineUserSegment(profile: UserProfile): UserProfile['segment'] {
    const featureCount = profile.usedFeatures.length;

    if (featureCount === 0) return 'new';
    if (featureCount <= 3) return 'casual';
    if (featureCount <= 7) return 'regular';
    if (featureCount <= 12) return 'power';
    return 'expert';
  }

  private calculateAdoptionMetrics(): FeatureAdoptionMetrics {
    const allFeatures = Array.from(this.featureDefinitions.values());
    const categoryGroups = this.groupFeaturesByCategory(allFeatures);

    // Calculate overall adoption
    const totalUsers = this.userProfiles.size;
    const adoptedFeatures = allFeatures.filter(feature =>
      this.calculateFeatureAdoptionRate(feature.id) >= 0.3
    );

    // Category breakdown
    const adoptionByCategory = Object.entries(categoryGroups).map(([category, features]) => ({
      category,
      totalFeatures: features.length,
      adoptedFeatures: features.filter(f =>
        this.calculateFeatureAdoptionRate(f.id) >= 0.3
      ).length,
      adoptionRate: features.length > 0 ?
        features.filter(f => this.calculateFeatureAdoptionRate(f.id) >= 0.3).length / features.length : 0,
      averageSatisfaction: this.calculateCategoryAverageSatisfaction(features),
      averageUsageTime: this.calculateCategoryAverageUsageTime(features),
    }));

    // Feature-specific metrics
    const featureMetrics = allFeatures.map(feature => ({
      featureId: feature.id,
      featureName: feature.name,
      category: feature.category,
      totalUsers: totalUsers,
      activeUsers: this.calculateFeatureActiveUsers(feature.id),
      adoptionRate: this.calculateFeatureAdoptionRate(feature.id),
      retentionRate: this.calculateFeatureRetentionRate(feature.id),
      averageUsageTime: this.calculateFeatureAverageUsageTime(feature.id),
      averageUsageFrequency: this.calculateFeatureUsageFrequency(feature.id),
      successRate: this.calculateFeatureSuccessRate(feature.id),
      satisfactionScore: this.calculateFeatureSatisfactionScore(feature.id),
      dropOffRate: this.calculateFeatureDropOffRate(feature.id),
      errorRate: this.calculateFeatureErrorRate(feature.id),
      learningCurve: this.calculateFeatureLearningCurve(feature.id),
    }));

    // User segments
    const segments = this.groupUsersBySegment();
    const adoptionByUserSegment = Object.entries(segments).map(([segment, users]) => ({
      segment,
      totalUsers: users.length,
      averageFeaturesAdopted: users.reduce((sum, user) => sum + user.usedFeatures.length, 0) / users.length,
      mostUsedFeatures: this.getMostUsedFeaturesInSegment(users),
      adoptionRate: users.length > 0 ?
        users.filter(u => u.usedFeatures.length > 0).length / users.length : 0,
      satisfactionScore: this.calculateSegmentSatisfaction(users),
    }));

    return {
      totalFeatures: allFeatures.length,
      adoptedFeatures: adoptedFeatures.length,
      adoptionRate: allFeatures.length > 0 ? adoptedFeatures.length / allFeatures.length : 0,
      adoptionTrend: this.calculateAdoptionTrend(),
      adoptionByCategory,
      featureMetrics,
      adoptionByUserSegment,
      usagePatterns: this.calculateUsagePatterns(),
      featureCorrelations: this.getFeatureCorrelations(),
      performanceMetrics: this.calculatePerformanceMetrics(),
    };
  }

  private calculateFeatureAdoptionRate(featureId: string): number {
    const totalUsers = this.userProfiles.size;
    if (totalUsers === 0) return 0;

    const usersWithFeature = Array.from(this.userProfiles.values()).filter(
      profile => profile.usedFeatures.includes(featureId)
    ).length;

    return usersWithFeature / totalUsers;
  }

  private calculateFeatureActiveUsers(featureId: string): number {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.featureUsage.filter(usage =>
      usage.featureId === featureId && usage.timestamp >= thirtyDaysAgo
    ).length;
  }

  private calculateFeatureRetentionRate(featureId: string): number {
    const featureUsages = this.featureUsage.filter(u => u.featureId === featureId);
    if (featureUsages.length === 0) return 0;

    // Group by user/session
    const userSessions = new Map<string, number[]>();
    featureUsages.forEach(usage => {
      if (!userSessions.has(usage.sessionId)) {
        userSessions.set(usage.sessionId, []);
      }
      userSessions.get(usage.sessionId)!.push(usage.timestamp.getTime());
    });

    // Calculate retention as users with multiple uses
    const retainedUsers = Array.from(userSessions.values()).filter(times => times.length > 1).length;
    return retainedUsers / userSessions.size;
  }

  private calculateFeatureAverageUsageTime(featureId: string): number {
    const featureUsages = this.featureUsage.filter(u => u.featureId === featureId);
    if (featureUsages.length === 0) return 0;

    const totalTime = featureUsages.reduce((sum, usage) => sum + usage.duration, 0);
    return totalTime / featureUsages.length;
  }

  private calculateFeatureUsageFrequency(featureId: string): number {
    const featureUsages = this.featureUsage.filter(u => u.featureId === featureId);
    if (featureUsages.length === 0) return 0;

    // Group by user/session
    const userSessions = new Map<string, number>();
    featureUsages.forEach(usage => {
      userSessions.set(usage.sessionId, (userSessions.get(usage.sessionId) || 0) + 1);
    });

    const totalUsages = Array.from(userSessions.values()).reduce((sum, count) => sum + count, 0);
    return totalUsages / userSessions.size;
  }

  private calculateFeatureSuccessRate(featureId: string): number {
    const featureUsages = this.featureUsage.filter(u => u.featureId === featureId);
    if (featureUsages.length === 0) return 0;

    const successfulUsages = featureUsages.filter(u => u.success).length;
    return successfulUsages / featureUsages.length;
  }

  private calculateFeatureSatisfactionScore(featureId: string): number {
    const satisfactionRatings = this.featureUsage
      .filter(u => u.featureId === featureId && u.metadata?.satisfactionRating)
      .map(u => u.metadata!.satisfactionRating!);

    if (satisfactionRatings.length === 0) return 0;

    return satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length;
  }

  private calculateFeatureDropOffRate(featureId: string): number {
    const featureUsages = this.featureUsage.filter(u => u.featureId === featureId);
    if (featureUsages.length === 0) return 0;

    const abandonments = featureUsages.filter(u =>
      u.context.startsWith('abandonment_')
    ).length;

    return abandonments / featureUsages.length;
  }

  private calculateFeatureErrorRate(featureId: string): number {
    const featureUsages = this.featureUsage.filter(u => u.featureId === featureId);
    if (featureUsages.length === 0) return 0;

    const errorUsages = featureUsages.filter(u =>
      !u.success || (u.metadata?.errors && u.metadata.errors.length > 0)
    ).length;

    return errorUsages / featureUsages.length;
  }

  private calculateFeatureLearningCurve(featureId: string): Array<{ day: number; competency: number }> {
    const featureUsages = this.featureUsage.filter(u => u.featureId === featureId);
    if (featureUsages.length === 0) return [];

    // Group by user and calculate first usage to competency improvement
    const userFirstUsage = new Map<string, Date>();
    const learningData: Array<{ day: number; success: boolean; duration: number }> = [];

    featureUsages.forEach(usage => {
      const userId = usage.userId || usage.sessionId;

      if (!userFirstUsage.has(userId)) {
        userFirstUsage.set(userId, usage.timestamp);
      }

      const daysSinceFirstUsage = Math.floor(
        (usage.timestamp.getTime() - userFirstUsage.get(userId)!.getTime()) / (24 * 60 * 60 * 1000)
      );

      learningData.push({
        day: daysSinceFirstUsage,
        success: usage.success,
        duration: usage.duration,
      });
    });

    // Calculate competency by day
    const dayGroups = new Map<number, { successes: number; total: number; durations: number[] }>();

    learningData.forEach(data => {
      if (!dayGroups.has(data.day)) {
        dayGroups.set(data.day, { successes: 0, total: 0, durations: [] });
      }

      const group = dayGroups.get(data.day)!;
      group.total++;
      if (data.success) group.successes++;
      group.durations.push(data.duration);
    });

    return Array.from(dayGroups.entries())
      .map(([day, data]) => ({
        day,
        competency: data.total > 0 ?
          (data.successes / data.total) * 0.7 + // 70% weight to success rate
          (1 - Math.min(data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length / 30000, 1)) * 0.3 // 30% weight to speed
          : 0,
      }))
      .sort((a, b) => a.day - b.day)
      .slice(0, 30); // First 30 days
  }

  private groupFeaturesByCategory(features: FeatureDefinition[]): Record<string, FeatureDefinition[]> {
    const groups: Record<string, FeatureDefinition[]> = {};

    features.forEach(feature => {
      if (!groups[feature.category]) {
        groups[feature.category] = [];
      }
      groups[feature.category].push(feature);
    });

    return groups;
  }

  private calculateCategoryAverageSatisfaction(features: FeatureDefinition[]): number {
    const satisfactions = features.map(f => this.calculateFeatureSatisfactionScore(f.id));
    return satisfactions.length > 0 ?
      satisfactions.reduce((sum, s) => sum + s, 0) / satisfactions.length : 0;
  }

  private calculateCategoryAverageUsageTime(features: FeatureDefinition[]): number {
    const usageTimes = features.map(f => this.calculateFeatureAverageUsageTime(f.id));
    return usageTimes.length > 0 ?
      usageTimes.reduce((sum, t) => sum + t, 0) / usageTimes.length : 0;
  }

  private groupUsersBySegment(): Record<string, UserProfile[]> {
    const segments: Record<string, UserProfile[]> = {};

    Array.from(this.userProfiles.values()).forEach(profile => {
      if (!segments[profile.segment]) {
        segments[profile.segment] = [];
      }
      segments[profile.segment].push(profile);
    });

    return segments;
  }

  private getMostUsedFeaturesInSegment(users: UserProfile[]): string[] {
    const featureCounts = new Map<string, number>();

    users.forEach(user => {
      user.usedFeatures.forEach(feature => {
        featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
      });
    });

    return Array.from(featureCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([feature]) => feature);
  }

  private calculateSegmentSatisfaction(users: UserProfile[]): number {
    const satisfactions = users.flatMap(u => u.satisfactionScores);
    return satisfactions.length > 0 ?
      satisfactions.reduce((sum, s) => sum + s, 0) / satisfactions.length : 0;
  }

  private calculateUsagePatterns(): FeatureAdoptionMetrics['usagePatterns'] {
    // Implementation would analyze temporal patterns in feature usage
    return {
      hourlyUsage: Array.from({ length: 24 }, (_, hour) => ({ hour, usage: Math.random() * 100 })),
      dailyUsage: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
        day,
        usage: Math.random() * 100
      })),
      weeklyUsage: Array.from({ length: 52 }, (_, week) => ({ week, usage: Math.random() * 100 })),
      seasonalTrends: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => ({
        month,
        usage: Math.random() * 100,
      })),
    };
  }

  private calculatePerformanceMetrics(): FeatureAdoptionMetrics['performanceMetrics'] {
    return Array.from(this.featureDefinitions.keys()).map(featureId => ({
      featureId,
      averageLoadTime: Math.random() * 1000, // Would integrate with performance observer
      errorRate: this.calculateFeatureErrorRate(featureId),
      userSatisfactionImpact: this.calculateFeatureSatisfactionScore(featureId) / 5,
      systemResourceUsage: Math.random() * 100, // Would track actual resource usage
    }));
  }

  private calculateAdoptionTrend(): Array<{ date: Date; rate: number }> {
    // Implementation would calculate adoption over time
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      rate: 0.5 + Math.random() * 0.3,
    }));
  }

  private calculateFeatureCorrelation(feature1: string, feature2: string): { correlation: number; significance: number } | null {
    const users = Array.from(this.userProfiles.values());
    if (users.length < 10) return null; // Need sufficient sample size

    let feature1Count = 0;
    let feature2Count = 0;
    let bothCount = 0;

    users.forEach(user => {
      const hasFeature1 = user.usedFeatures.includes(feature1);
      const hasFeature2 = user.usedFeatures.includes(feature2);

      if (hasFeature1) feature1Count++;
      if (hasFeature2) feature2Count++;
      if (hasFeature1 && hasFeature2) bothCount++;
    });

    // Calculate correlation coefficient
    const n = users.length;
    const x = feature1Count / n;
    const y = feature2Count / n;
    const xy = bothCount / n;

    const correlation = (xy - x * y) / Math.sqrt(x * (1 - x) * y * (1 - y));

    if (isNaN(correlation)) return null;

    // Calculate significance (simplified)
    const significance = Math.min(1, Math.abs(correlation) * Math.sqrt(n / 10));

    return { correlation, significance };
  }

  private defineFunnelSteps(featureId: string): Array<{ name: string; description: string; order: number }> {
    const feature = this.featureDefinitions.get(featureId);
    if (!feature) return [];

    // Define funnel steps based on feature category
    if (feature.category === 'basic') {
      return [
        { name: 'discovery', description: 'User discovers the feature', order: 0 },
        { name: 'first_use', description: 'User tries the feature for the first time', order: 1 },
        { name: 'completion', description: 'User successfully completes the task', order: 2 },
        { name: 'reuse', description: 'User uses the feature again', order: 3 },
      ];
    } else if (feature.category === 'advanced') {
      return [
        { name: 'prerequisite_met', description: 'User has mastered prerequisite features', order: 0 },
        { name: 'discovery', description: 'User discovers the advanced feature', order: 1 },
        { name: 'learning', description: 'User learns how to use the feature', order: 2 },
        { name: 'first_success', description: 'User achieves first successful outcome', order: 3 },
        { name: 'mastery', description: 'User demonstrates mastery of the feature', order: 4 },
      ];
    }

    return [
      { name: 'discovery', description: 'User discovers the feature', order: 0 },
      { name: 'adoption', description: 'User adopts the feature', order: 1 },
      { name: 'mastery', description: 'User masters the feature', order: 2 },
    ];
  }

  private isUsageAtStep(usage: FeatureUsage, stepName: string): boolean {
    if (usage.context.includes(stepName)) return true;

    // Determine step based on usage patterns
    if (stepName === 'discovery') {
      return usage.context.includes('discovery_');
    }

    if (stepName === 'first_use') {
      const userUsages = this.featureUsage.filter(u =>
        u.featureId === usage.featureId && u.sessionId === usage.sessionId
      );
      return userUsages[0] === usage;
    }

    if (stepName === 'completion') {
      return usage.context === 'completion' && usage.success;
    }

    if (stepName === 'reuse') {
      const userUsages = this.featureUsage.filter(u =>
        u.featureId === usage.featureId && u.sessionId === usage.sessionId
      );
      return userUsages.indexOf(usage) > 0;
    }

    return false;
  }

  private analyzeDropOffReasons(
    featureUsage: FeatureUsage[],
    stepName: string
  ): Array<{ reason: string; count: number; percentage: number }> {
    const stepUsages = featureUsage.filter(usage => this.isUsageAtStep(usage, stepName));
    const abandonments = stepUsages.filter(usage => usage.context.startsWith('abandonment_'));

    const reasonCounts = new Map<string, number>();

    abandonments.forEach(usage => {
      const reason = usage.metadata?.abandonmentReason || 'unknown';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    const totalAbandonments = abandonments.length;

    return Array.from(reasonCounts.entries()).map(([reason, count]) => ({
      reason,
      count,
      percentage: totalAbandonments > 0 ? (count / totalAbandonments) * 100 : 0,
    }));
  }

  private identifyFunnelBottlenecks(
    steps: Array<{ name: string; conversionRate: number }>
  ): Array<{ step: number; issue: string; impact: number; recommendations: string[] }> {
    const bottlenecks = [];

    steps.forEach((step, index) => {
      if (step.conversionRate < 50) {
        bottlenecks.push({
          step: index,
          issue: `Low conversion rate at ${step.name}: ${step.conversionRate.toFixed(1)}%`,
          impact: 100 - step.conversionRate,
          recommendations: [
            'Improve user guidance and instructions',
            'Simplify the user interface',
            'Add better error handling',
            'Provide contextual help',
          ],
        });
      }
    });

    return bottlenecks;
  }

  private generateFeatureInsights(featureId: string): void {
    const metrics = this.getFeatureMetrics(featureId);
    if (!metrics) return;

    // Generate insights based on metrics
    if (metrics.adoptionRate < 0.3) {
      this.insights.push({
        id: this.generateInsightId(),
        type: 'risk',
        severity: 'high',
        title: `Low adoption rate for ${metrics.featureName}`,
        description: `Only ${(metrics.adoptionRate * 100).toFixed(1)}% of users have adopted this feature`,
        affectedFeatures: [featureId],
        metrics: {
          currentValue: metrics.adoptionRate,
          targetValue: 0.5,
          changePercentage: 0,
        },
        recommendations: [
          'Improve feature discoverability',
          'Enhance onboarding experience',
          'Add tutorials and documentation',
          'Consider UI improvements',
        ],
        confidence: 0.8,
        timestamp: new Date(),
      });
    }

    if (metrics.satisfactionScore < 3.0) {
      this.insights.push({
        id: this.generateInsightId(),
        type: 'risk',
        severity: 'medium',
        title: `Low satisfaction for ${metrics.featureName}`,
        description: `User satisfaction score is ${metrics.satisfactionScore.toFixed(1)}/5.0`,
        affectedFeatures: [featureId],
        metrics: {
          currentValue: metrics.satisfactionScore,
          targetValue: 4.0,
          changePercentage: 0,
        },
        recommendations: [
          'Investigate user pain points',
          'Improve feature reliability',
          'Enhance user experience',
          'Add requested features',
        ],
        confidence: 0.9,
        timestamp: new Date(),
      });
    }

    if (metrics.errorRate > 0.2) {
      this.insights.push({
        id: this.generateInsightId(),
        type: 'risk',
        severity: 'critical',
        title: `High error rate for ${metrics.featureName}`,
        description: `Error rate is ${(metrics.errorRate * 100).toFixed(1)}%`,
        affectedFeatures: [featureId],
        metrics: {
          currentValue: metrics.errorRate,
          targetValue: 0.05,
          changePercentage: 0,
        },
        recommendations: [
          'Fix critical bugs immediately',
          'Improve error handling',
          'Add better validation',
          'Enhance testing coverage',
        ],
        confidence: 0.95,
        timestamp: new Date(),
      });
    }

    // Keep insights manageable
    if (this.insights.length > 100) {
      this.insights = this.insights.slice(-50);
    }
  }

  private checkTestConclusion(testId: string): void {
    const test = this.abTests.get(testId);
    if (!test) return;

    const totalUsers = test.variants.reduce((sum, variant) => sum + variant.users, 0);

    // Minimum sample size and test duration
    if (totalUsers < 100) return;

    const testDuration = Date.now() - test.startDate.getTime();
    if (testDuration < 7 * 24 * 60 * 60 * 1000) return; // 7 days minimum

    // Perform statistical analysis
    const bestVariant = test.variants.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    );

    // Simple significance test (would use proper statistical test in production)
    const secondBest = test.variants
      .filter(v => v.id !== bestVariant.id)
      .sort((a, b) => b.conversionRate - a.conversionRate)[0];

    const difference = bestVariant.conversionRate - (secondBest?.conversionRate || 0);
    const confidence = Math.min(0.95, difference / bestVariant.conversionRate);

    if (confidence > 0.8) {
      test.winner = bestVariant.id;
      test.confidence = confidence;
      test.statisticalSignificance = true;
      test.endDate = new Date();
      test.testDuration = testDuration;

      // Generate insights and recommendations
      this.generateTestInsights(test);
    }
  }

  private generateTestInsights(test: A/BTestResult): void {
    const winner = test.variants.find(v => v.id === test.winner);
    if (!winner) return;

    test.insights.push(
      `Variant ${winner.description} outperformed others with ${winner.conversionRate.toFixed(1)}% conversion rate`,
      `User satisfaction was ${(winner.satisfaction * 100).toFixed(1)}% higher than other variants`
    );

    test.recommendations.push(
      `Implement ${winner.description} as the default experience`,
      `Consider testing further optimizations based on this successful variant`
    );
  }

  private cleanupOldData(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Clean up old feature usage data
    this.featureUsage = this.featureUsage.filter(usage => usage.timestamp >= thirtyDaysAgo);

    // Clean up old insights
    this.insights = this.insights.filter(insight => insight.timestamp >= thirtyDaysAgo);
  }

  private detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|phone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Integration method for navigation analysis
  private getActiveSessionId(): string | undefined {
    // This would integrate with navigation analysis to get current session ID
    return undefined;
  }
}

interface UserProfile {
  id: string;
  segment: 'new' | 'casual' | 'regular' | 'power' | 'expert';
  usedFeatures: string[];
  totalFeatureUsage: number;
  satisfactionScores: number[];
  createdAt: Date;
  lastActivity: Date;
}

// Singleton instance
export const featureUsageAnalytics = FeatureUsageAnalytics.getInstance();

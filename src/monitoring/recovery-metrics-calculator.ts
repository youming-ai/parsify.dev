/**
 * Recovery Metrics Calculator for SC-009 Compliance
 * Calculates comprehensive error recovery metrics and SC-009 compliance scores
 * Provides detailed analytics for error recovery performance and user satisfaction
 */

import {
  ErrorEvent,
  ErrorRecoveryMetrics,
  ErrorTypeMetrics,
  ErrorCategoryMetrics,
  ErrorSeverityMetrics,
  ToolErrorMetrics,
  RecoveryTimeDistribution,
  StrategySuccessMetrics,
  SatisfactionByErrorType,
  AbandonmentByErrorType,
  RecoveryStrategyRanking,
  HourlyErrorRecoveryMetrics,
  DailyErrorRecoveryMetrics,
  WeeklyErrorRecoveryMetrics,
  MonthlyTrendMetrics,
  SC009TargetProgress,
  ErrorRecoveryRecommendation,
  ErrorType,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  RecoveryOutcome,
  TrendDirection,
  RecommendationCategory,
  RecommendationPriority,
  RiskLevel,
  RecommendationStatus,
  DateRange
} from './error-recovery-types';

// ============================================================================
// Metrics Calculation Configuration
// ============================================================================

interface MetricsCalculationConfig {
  sc009: {
    targetRecoveryRate: number; // 98%
    maxRecoveryTime: number; // 2 minutes in milliseconds
    minUserSatisfaction: number; // 0.8 (80%)
    complianceWeighting: {
      recoveryRate: number; // 0.6
      recoveryTime: number; // 0.2
      userSatisfaction: number; // 0.2
    };
  };
  timeRanges: {
    hourly: number; // 1 hour
    daily: number; // 24 hours
    weekly: number; // 7 days
    monthly: number; // 30 days
  };
  thresholds: {
    lowErrorCount: number; // < 10 errors
    mediumErrorCount: number; // 10-50 errors
    highErrorCount: number; // > 50 errors
    fastRecovery: number; // < 30 seconds
    slowRecovery: number; // > 2 minutes
    highSatisfaction: number; // > 90%
    lowSatisfaction: number; // < 70%
  };
  recommendations: {
    minConfidence: number; // 0.7
    maxRecommendations: number; // 10
    priorityThresholds: {
      critical: number; // > 10% impact on SC-009
      high: number; // > 5% impact on SC-009
      medium: number; // > 2% impact on SC-009
    };
  };
}

// ============================================================================
// Recovery Metrics Calculator Implementation
// ============================================================================

export class RecoveryMetricsCalculator {
  private static instance: RecoveryMetricsCalculator;
  private config: MetricsCalculationConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): RecoveryMetricsCalculator {
    if (!RecoveryMetricsCalculator.instance) {
      RecoveryMetricsCalculator.instance = new RecoveryMetricsCalculator();
    }
    return RecoveryMetricsCalculator.instance;
  }

  // Main metrics calculation method
  public calculateMetrics(
    errorEvents: ErrorEvent[],
    timeRange: DateRange,
    previousPeriodEvents?: ErrorEvent[]
  ): ErrorRecoveryMetrics {
    if (errorEvents.length === 0) {
      return this.getEmptyMetrics(timeRange);
    }

    // Basic metrics
    const totalErrors = errorEvents.length;
    const overallRecoveryRate = this.calculateOverallRecoveryRate(errorEvents);
    const sc009Compliant = overallRecoveryRate >= this.config.sc009.targetRecoveryRate;
    const sc009Gap = Math.max(0, this.config.sc009.targetRecoveryRate - overallRecoveryRate);

    // Time-based metrics
    const recoveryTimes = errorEvents
      .map(e => e.totalRecoveryTime)
      .filter(time => time > 0);

    const averageRecoveryTime = recoveryTimes.length > 0
      ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
      : 0;

    const medianRecoveryTime = this.calculateMedian(recoveryTimes);

    // User satisfaction
    const userSatisfactionScore = this.calculateUserSatisfactionScore(errorEvents);
    const abandonmentRate = this.calculateAbandonmentRate(errorEvents);

    // Distribution metrics
    const errorsByType = this.calculateErrorsByType(errorEvents);
    const errorsByCategory = this.calculateErrorsByCategory(errorEvents);
    const errorsBySeverity = this.calculateErrorsBySeverity(errorEvents);
    const errorsByTool = this.calculateErrorsByTool(errorEvents);
    const recoveryTimeDistribution = this.calculateRecoveryTimeDistribution(errorEvents);
    const successRateByStrategy = this.calculateSuccessRateByStrategy(errorEvents);

    // User experience metrics
    const satisfactionByErrorType = this.calculateSatisfactionByErrorType(errorEvents);
    const abandonmentByErrorType = this.calculateAbandonmentByErrorType(errorEvents);

    // Pattern analysis
    const mostEffectiveStrategies = this.calculateMostEffectiveStrategies(errorEvents);
    const commonRecoveryPaths = this.calculateCommonRecoveryPaths(errorEvents);
    const retryPatterns = this.calculateRetryPatterns(errorEvents);

    // Guidance effectiveness
    const guidanceEffectivenessScore = this.calculateGuidanceEffectivenessScore(errorEvents);
    const guidanceUsageStats = this.calculateGuidanceUsageStats(errorEvents);
    const mostHelpfulGuidance = this.calculateMostHelpfulGuidance(errorEvents);

    // Time-based metrics
    const hourlyMetrics = this.calculateHourlyMetrics(errorEvents, timeRange);
    const dailyMetrics = this.calculateDailyMetrics(errorEvents, timeRange);
    const weeklyMetrics = this.calculateWeeklyMetrics(errorEvents, timeRange);
    const monthlyTrends = this.calculateMonthlyTrends(errorEvents, timeRange, previousPeriodEvents);

    // System health
    const systemHealthScore = this.calculateSystemHealthScore(errorEvents);
    const criticalErrorRate = this.calculateCriticalErrorRate(errorEvents);
    const cascadingFailureCount = this.calculateCascadingFailureCount(errorEvents);
    const resilienceScore = this.calculateResilienceScore(errorEvents);

    // SC-009 compliance
    const sc009TargetProgress = this.calculateSC009TargetProgress(errorEvents, overallRecoveryRate);

    // Recommendations
    const recommendations = this.generateRecommendations(errorEvents, overallRecoveryRate, sc009Gap);

    return {
      overallRecoveryRate,
      sc009Compliant,
      sc009Gap,
      totalErrors,
      errorsByType,
      errorsByCategory,
      errorsBySeverity,
      errorsByTool,
      averageRecoveryTime,
      medianRecoveryTime,
      recoveryTimeDistribution,
      successRateByStrategy,
      userSatisfactionScore,
      satisfactionByErrorType,
      abandonmentRate,
      abandonmentByErrorType,
      mostEffectiveStrategies,
      commonRecoveryPaths,
      retryPatterns,
      guidanceEffectivenessScore,
      guidanceUsageStats,
      mostHelpfulGuidance,
      hourlyMetrics,
      dailyMetrics,
      weeklyMetrics,
      monthlyTrends,
      systemHealthScore,
      criticalErrorRate,
      cascadingFailureCount,
      resilienceScore,
      sc009TargetProgress,
      recommendations,
      timestamp: new Date(),
      period: timeRange
    };
  }

  // Calculate overall recovery rate
  private calculateOverallRecoveryRate(errorEvents: ErrorEvent[]): number {
    const successfulRecoveries = errorEvents.filter(event =>
      event.finalOutcome.includes('success')
    ).length;

    return errorEvents.length > 0 ? successfulRecoveries / errorEvents.length : 0;
  }

  // Calculate median value
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  }

  // Calculate user satisfaction score
  private calculateUserSatisfactionScore(errorEvents: ErrorEvent[]): number {
    const satisfiedErrors = errorEvents.filter(event => event.userSatisfied).length;
    return errorEvents.length > 0 ? satisfiedErrors / errorEvents.length : 0;
  }

  // Calculate abandonment rate
  private calculateAbandonmentRate(errorEvents: ErrorEvent[]): number {
    const abandonedErrors = errorEvents.filter(event =>
      event.finalOutcome === 'user_gave_up' ||
      event.finalOutcome === 'user_abandoned_task'
    ).length;

    return errorEvents.length > 0 ? abandonedErrors / errorEvents.length : 0;
  }

  // Calculate errors by type
  private calculateErrorsByType(errorEvents: ErrorEvent[]): ErrorTypeMetrics[] {
    const typeGroups = this.groupBy(errorEvents, 'type');

    return Object.entries(typeGroups).map(([type, events]) => {
      const recoveryRate = this.calculateOverallRecoveryRate(events);
      const recoveryTimes = events.map(e => e.totalRecoveryTime).filter(t => t > 0);
      const averageRecoveryTime = recoveryTimes.length > 0
        ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
        : 0;

      const userSatisfaction = this.calculateUserSatisfactionScore(events);
      const mostEffectiveStrategy = this.findMostEffectiveStrategy(events);

      return {
        type: type as ErrorType,
        count: events.length,
        percentage: (events.length / errorEvents.length) * 100,
        recoveryRate,
        averageRecoveryTime,
        mostEffectiveStrategy,
        userSatisfaction,
        sc009Compliant: recoveryRate >= this.config.sc009.targetRecoveryRate
      };
    }).sort((a, b) => b.count - a.count);
  }

  // Calculate errors by category
  private calculateErrorsByCategory(errorEvents: ErrorEvent[]): ErrorCategoryMetrics[] {
    const categoryGroups = this.groupBy(errorEvents, 'category');

    return Object.entries(categoryGroups).map(([category, events]) => {
      const recoveryRate = this.calculateOverallRecoveryRate(events);
      const recoveryTimes = events.map(e => e.totalRecoveryTime).filter(t => t > 0);
      const averageRecoveryTime = recoveryTimes.length > 0
        ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
        : 0;

      const topErrors = this.getTopErrorTypes(events, 3);
      const trend = this.calculateTrend(category, events);

      return {
        category: category as ErrorCategory,
        count: events.length,
        percentage: (events.length / errorEvents.length) * 100,
        recoveryRate,
        averageRecoveryTime,
        topErrors,
        trend
      };
    }).sort((a, b) => b.count - a.count);
  }

  // Calculate errors by severity
  private calculateErrorsBySeverity(errorEvents: ErrorEvent[]): ErrorSeverityMetrics[] {
    const severityGroups = this.groupBy(errorEvents, 'severity');

    return Object.entries(severityGroups).map(([severity, events]) => {
      const recoveryRate = this.calculateOverallRecoveryRate(events);
      const recoveryTimes = events.map(e => e.totalRecoveryTime).filter(t => t > 0);
      const averageRecoveryTime = recoveryTimes.length > 0
        ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
        : 0;

      const impactOnUserExperience = this.calculateUserExperienceImpact(severity as ErrorSeverity);
      const priority = this.calculateRecommendationPriority(severity as ErrorSeverity);

      return {
        severity: severity as ErrorSeverity,
        count: events.length,
        percentage: (events.length / errorEvents.length) * 100,
        recoveryRate,
        averageRecoveryTime,
        impactOnUserExperience,
        priority
      };
    }).sort((a, b) => {
      const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // Calculate errors by tool
  private calculateErrorsByTool(errorEvents: ErrorEvent[]): ToolErrorMetrics[] {
    const toolGroups = this.groupBy(errorEvents.filter(e => e.toolId), 'toolId');

    return Object.entries(toolGroups).map(([toolId, events]) => {
      const recoveryRate = this.calculateOverallRecoveryRate(events);
      const recoveryTimes = events.map(e => e.totalRecoveryTime).filter(t => t > 0);
      const averageRecoveryTime = recoveryTimes.length > 0
        ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
        : 0;

      const userSatisfaction = this.calculateUserSatisfactionScore(events);
      const sc009Compliant = recoveryRate >= this.config.sc009.targetRecoveryRate;
      const commonErrors = this.calculateErrorsByType(events).slice(0, 3);
      const topStrategies = this.calculateMostEffectiveStrategies(events).slice(0, 3);

      return {
        toolId,
        toolName: this.getToolName(toolId), // Would integrate with tools-data.ts
        totalErrors: events.length,
        recoveryRate,
        averageRecoveryTime,
        userSatisfaction,
        sc009Compliant,
        commonErrors,
        topStrategies
      };
    }).sort((a, b) => b.totalErrors - a.totalErrors);
  }

  // Calculate recovery time distribution
  private calculateRecoveryTimeDistribution(errorEvents: ErrorEvent[]): RecoveryTimeDistribution[] {
    const ranges = [
      { range: '0-10s', min: 0, max: 10000 },
      { range: '10-30s', min: 10000, max: 30000 },
      { range: '30-60s', min: 30000, max: 60000 },
      { range: '1-2m', min: 60000, max: 120000 },
      { range: '2-5m', min: 120000, max: 300000 },
      { range: '5m+', min: 300000, max: Infinity }
    ];

    return ranges.map(({ range, min, max }) => {
      const eventsInRange = errorEvents.filter(e =>
        e.totalRecoveryTime >= min && e.totalRecoveryTime < max
      );

      const successRate = this.calculateOverallRecoveryRate(eventsInRange);
      const userSatisfaction = this.calculateUserSatisfactionScore(eventsInRange);

      return {
        range,
        count: eventsInRange.length,
        percentage: (eventsInRange.length / errorEvents.length) * 100,
        successRate,
        userSatisfaction
      };
    });
  }

  // Calculate success rate by strategy
  private calculateSuccessRateByStrategy(errorEvents: ErrorEvent[]): StrategySuccessMetrics[] {
    const strategyGroups = this.groupBy(
      errorEvents.flatMap(e => e.recoveryAttempts.map(a => ({ ...a, errorEvent: e }))),
      'strategy'
    );

    return Object.entries(strategyGroups).map(([strategy, attempts]) => {
      const successfulAttempts = attempts.filter(a => a.success).length;
      const successRate = attempts.length > 0 ? successfulAttempts / attempts.length : 0;
      const averageTime = attempts.length > 0
        ? attempts.reduce((sum, a) => sum + a.duration, 0) / attempts.length
        : 0;

      const userSatisfaction = this.calculateUserSatisfactionScore(
        attempts.map(a => a.errorEvent).filter(Boolean)
      );

      const effectivenessScore = this.calculateEffectivenessScore(successRate, averageTime, userSatisfaction);
      const applicableErrorTypes = this.getApplicableErrorTypes(attempts);

      return {
        strategy: strategy as RecoveryStrategy,
        usageCount: attempts.length,
        successRate,
        averageRecoveryTime: averageTime,
        userSatisfaction,
        effectivenessScore,
        applicableErrorTypes
      };
    }).sort((a, b) => b.effectivenessScore - a.effectivenessScore);
  }

  // Calculate satisfaction by error type
  private calculateSatisfactionByErrorType(errorEvents: ErrorEvent[]): SatisfactionByErrorType[] {
    const typeGroups = this.groupBy(errorEvents, 'type');

    return Object.entries(typeGroups).map(([type, events]) => {
      const ratings = events
        .filter(e => e.recoveryAttempts.some(a => a.userFeedback))
        .flatMap(e => e.recoveryAttempts.map(a => a.userFeedback?.rating).filter(Boolean))
        .filter(Boolean) as number[];

      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;

      const distribution = this.calculateRatingDistribution(ratings);
      const factors = this.calculateSatisfactionFactors(type as ErrorType, events);

      return {
        errorType: type as ErrorType,
        averageRating,
        totalRatings: ratings.length,
        distribution,
        factors
      };
    });
  }

  // Calculate abandonment by error type
  private calculateAbandonmentByErrorType(errorEvents: ErrorEvent[]): AbandonmentByErrorType[] {
    const typeGroups = this.groupBy(errorEvents, 'type');

    return Object.entries(typeGroups).map(([type, events]) => {
      const abandonments = events.filter(e =>
        e.finalOutcome === 'user_gave_up' ||
        e.finalOutcome === 'user_abandoned_task'
      );

      const abandonmentRate = events.length > 0 ? abandonments.length / events.length : 0;
      const averageTimeToAbandon = abandonments.length > 0
        ? abandonments.reduce((sum, e) => sum + e.totalRecoveryTime, 0) / abandonments.length
        : 0;

      const commonReasons = this.calculateAbandonmentReasons(abandonments);

      return {
        errorType: type as ErrorType,
        abandonments: abandonments.length,
        totalOccurrences: events.length,
        abandonmentRate,
        averageTimeToAbandon,
        commonReasons
      };
    }).sort((a, b) => b.abandonmentRate - a.abandonmentRate);
  }

  // Calculate most effective strategies
  private calculateMostEffectiveStrategies(errorEvents: ErrorEvent[]): RecoveryStrategyRanking[] {
    const strategyMetrics = this.calculateSuccessRateByStrategy(errorEvents);

    return strategyMetrics.slice(0, 10).map(metric => ({
      strategy: metric.strategy,
      effectivenessScore: metric.effectivenessScore,
      successRate: metric.successRate,
      usageCount: metric.usageCount,
      userSatisfaction: metric.userSatisfaction,
      averageTime: metric.averageRecoveryTime,
      applicableErrors: metric.applicableErrorTypes.length
    }));
  }

  // Calculate common recovery paths
  private calculateCommonRecoveryPaths(errorEvents: ErrorEvent[]): any[] {
    const paths = new Map<string, any>();

    errorEvents.forEach(event => {
      const pathKey = event.recoveryAttempts
        .map(a => a.strategy)
        .join(' -> ');

      if (!paths.has(pathKey)) {
        paths.set(pathKey, {
          id: `path_${paths.size + 1}`,
          path: event.recoveryAttempts.map(a => ({
            action: a.strategy,
            timestamp: a.timestamp,
            duration: a.duration,
            success: a.success
          })),
          successCount: 0,
          usageCount: 0,
          totalTime: 0,
          commonErrors: [],
          userSatisfaction: 0
        });
      }

      const path = paths.get(pathKey)!;
      path.usageCount++;
      path.totalTime += event.totalRecoveryTime;

      if (event.finalOutcome.includes('success')) {
        path.successCount++;
      }

      if (!path.commonErrors.includes(event.type)) {
        path.commonErrors.push(event.type);
      }
    });

    return Array.from(paths.values())
      .map(path => ({
        ...path,
        successRate: path.usageCount > 0 ? path.successCount / path.usageCount : 0,
        averageTime: path.usageCount > 0 ? path.totalTime / path.usageCount : 0,
        userSatisfaction: this.calculateUserSatisfactionScoreForPath(path)
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
  }

  // Calculate retry patterns
  private calculateRetryPatterns(errorEvents: ErrorEvent[]): any[] {
    const typeGroups = this.groupBy(errorEvents, 'type');

    return Object.entries(typeGroups).map(([type, events]) => {
      const retryCounts = events.map(e => e.recoveryAttempts.length);
      const averageRetries = retryCounts.reduce((sum, count) => sum + count, 0) / retryCounts.length;
      const maxRetries = Math.max(...retryCounts);

      const successByAttempt = this.calculateSuccessByAttempt(events);
      const commonFailurePoints = this.calculateCommonFailurePoints(events);
      const optimalRetryCount = this.calculateOptimalRetryCount(successByAttempt);

      return {
        errorType: type as ErrorType,
        averageRetries,
        maxRetries,
        successByAttempt,
        commonFailurePoints,
        optimalRetryCount
      };
    });
  }

  // Calculate guidance effectiveness score
  private calculateGuidanceEffectivenessScore(errorEvents: ErrorEvent[]): number {
    const eventsWithGuidance = errorEvents.filter(e =>
      e.recoveryAttempts.some(a => a.guidanceProvided)
    );

    if (eventsWithGuidance.length === 0) return 0.5; // Neutral score

    const satisfiedWithGuidance = eventsWithGuidance.filter(e =>
      e.userSatisfied && e.recoveryAttempts.some(a => a.userFollowedGuidance)
    ).length;

    return satisfiedWithGuidance / eventsWithGuidance.length;
  }

  // Calculate guidance usage stats
  private calculateGuidanceUsageStats(errorEvents: ErrorEvent[]): any[] {
    const guidanceGroups = new Map<string, any>();

    errorEvents.forEach(event => {
      event.recoveryAttempts.forEach(attempt => {
        if (attempt.guidanceProvided) {
          const key = attempt.guidanceProvided.type;

          if (!guidanceGroups.has(key)) {
            guidanceGroups.set(key, {
              guidanceType: key,
              usageCount: 0,
              effectivenessRate: 0,
              userSatisfaction: 0,
              averageTimeToSuccess: 0,
              completionRate: 0
            });
          }

          const stats = guidanceGroups.get(key)!;
          stats.usageCount++;

          if (attempt.success) {
            stats.effectivenessRate++;
          }

          if (attempt.userFollowedGuidance) {
            stats.completionRate++;
          }
        }
      });
    });

    return Array.from(guidanceGroups.values()).map(stats => ({
      ...stats,
      effectivenessRate: stats.usageCount > 0 ? stats.effectivenessRate / stats.usageCount : 0,
      completionRate: stats.usageCount > 0 ? stats.completionRate / stats.usageCount : 0
    }));
  }

  // Calculate most helpful guidance
  private calculateMostHelpfulGuidance(errorEvents: ErrorEvent[]): any[] {
    const feedbackGroups = new Map<string, any>();

    errorEvents.forEach(event => {
      event.recoveryAttempts.forEach(attempt => {
        if (attempt.guidanceProvided && attempt.userFeedback) {
          const key = attempt.guidanceProvided.id || attempt.guidanceProvided.title;

          if (!feedbackGroups.has(key)) {
            feedbackGroups.set(key, {
              guidanceId: key,
              title: attempt.guidanceProvided.title,
              type: attempt.guidanceProvided.type,
              effectivenessScore: 0,
              usageCount: 0,
              userRating: 0,
              successRate: 0
            });
          }

          const stats = feedbackGroups.get(key)!;
          stats.usageCount++;
          stats.userRating += attempt.userFeedback.rating || 0;

          if (attempt.success) {
            stats.successRate++;
          }

          if (attempt.userFeedback?.helpful) {
            stats.effectivenessScore++;
          }
        }
      });
    });

    return Array.from(feedbackGroups.values())
      .map(stats => ({
        ...stats,
        userRating: stats.usageCount > 0 ? stats.userRating / stats.usageCount : 0,
        successRate: stats.usageCount > 0 ? stats.successRate / stats.usageCount : 0,
        effectivenessScore: stats.usageCount > 0 ? stats.effectivenessScore / stats.usageCount : 0
      }))
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, 5);
  }

  // Calculate hourly metrics
  private calculateHourlyMetrics(errorEvents: ErrorEvent[], timeRange: DateRange): HourlyErrorRecoveryMetrics[] {
    const hourlyGroups = new Map<number, ErrorEvent[]>();

    // Initialize all hours in the range
    const startHour = new Date(timeRange.start).getHours();
    const endHour = new Date(timeRange.end).getHours();

    for (let i = 0; i < 24; i++) {
      hourlyGroups.set(i, []);
    }

    // Group events by hour
    errorEvents.forEach(event => {
      const hour = event.timestamp.getHours();
      if (!hourlyGroups.has(hour)) {
        hourlyGroups.set(hour, []);
      }
      hourlyGroups.get(hour)!.push(event);
    });

    return Array.from(hourlyGroups.entries()).map(([hour, events]) => ({
      hour,
      errorCount: events.length,
      recoveryRate: this.calculateOverallRecoveryRate(events),
      averageRecoveryTime: this.calculateAverageRecoveryTime(events),
      userSatisfaction: this.calculateUserSatisfactionScore(events),
      topErrorTypes: this.getTopErrorTypes(events, 3)
    }));
  }

  // Calculate daily metrics
  private calculateDailyMetrics(errorEvents: ErrorEvent[], timeRange: DateRange): DailyErrorRecoveryMetrics[] {
    const dailyGroups = this.groupBy(errorEvents, event =>
      event.timestamp.toISOString().split('T')[0]
    );

    const sortedDates = Object.keys(dailyGroups).sort();

    return sortedDates.map((date, index) => {
      const events = dailyGroups[date];
      const recoveryRate = this.calculateOverallRecoveryRate(events);
      const previousDayRecoveryRate = index > 0
        ? this.calculateOverallRecoveryRate(dailyGroups[sortedDates[index - 1]])
        : recoveryRate;

      return {
        date,
        errorCount: events.length,
        recoveryRate,
        averageRecoveryTime: this.calculateAverageRecoveryTime(events),
        userSatisfaction: this.calculateUserSatisfactionScore(events),
        sc009Compliant: recoveryRate >= this.config.sc009.targetRecoveryRate,
        improvementFromPreviousDay: recoveryRate - previousDayRecoveryRate
      };
    });
  }

  // Calculate weekly metrics
  private calculateWeeklyMetrics(errorEvents: ErrorEvent[], timeRange: DateRange): WeeklyErrorRecoveryMetrics[] {
    const weeklyGroups = this.groupBy(errorEvents, event => {
      const date = new Date(event.timestamp);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
    });

    const sortedWeeks = Object.keys(weeklyGroups).sort();

    return sortedWeeks.map((week, index) => {
      const events = weeklyGroups[week];
      const recoveryRate = this.calculateOverallRecoveryRate(events);
      const previousWeekRecoveryRate = index > 0
        ? this.calculateOverallRecoveryRate(weeklyGroups[sortedWeeks[index - 1]])
        : recoveryRate;

      const [year, weekNum] = week.split('-W');

      return {
        week: parseInt(weekNum),
        year: parseInt(year),
        errorCount: events.length,
        recoveryRate,
        averageRecoveryTime: this.calculateAverageRecoveryTime(events),
        userSatisfaction: this.calculateUserSatisfactionScore(events),
        sc009Compliant: recoveryRate >= this.config.sc009.targetRecoveryRate,
        weekOverWeekChange: recoveryRate - previousWeekRecoveryRate
      };
    });
  }

  // Calculate monthly trends
  private calculateMonthlyTrends(
    errorEvents: ErrorEvent[],
    timeRange: DateRange,
    previousPeriodEvents?: ErrorEvent[]
  ): MonthlyTrendMetrics[] {
    const monthlyGroups = this.groupBy(errorEvents, event =>
      `${event.timestamp.getFullYear()}-${String(event.timestamp.getMonth() + 1).padStart(2, '0')}`
    );

    const sortedMonths = Object.keys(monthlyGroups).sort();

    return sortedMonths.map(month => {
      const events = monthlyGroups[month];
      const recoveryRate = this.calculateOverallRecoveryRate(events);

      const [year, monthNum] = month.split('-');

      // Calculate month-over-month and year-over-year changes
      let monthOverMonthChange = 0;
      let yearOverYearChange = 0;

      const currentMonthIndex = sortedMonths.indexOf(month);
      if (currentMonthIndex > 0) {
        const previousMonth = sortedMonths[currentMonthIndex - 1];
        monthOverMonthChange = recoveryRate - this.calculateOverallRecoveryRate(monthlyGroups[previousMonth]);
      }

      // Year-over-year calculation would need previous year's data
      if (previousPeriodEvents) {
        const previousYearMonth = `${parseInt(year) - 1}-${monthNum}`;
        const previousYearEvents = this.groupBy(previousPeriodEvents, event =>
          `${event.timestamp.getFullYear()}-${String(event.timestamp.getMonth() + 1).padStart(2, '0')}`
        )[previousYearMonth];

        if (previousYearEvents) {
          yearOverYearChange = recoveryRate - this.calculateOverallRecoveryRate(previousYearEvents);
        }
      }

      return {
        month: new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' }),
        year: parseInt(year),
        errorCount: events.length,
        recoveryRate,
        averageRecoveryTime: this.calculateAverageRecoveryTime(events),
        userSatisfaction: this.calculateUserSatisfactionScore(events),
        sc009Compliant: recoveryRate >= this.config.sc009.targetRecoveryRate,
        monthOverMonthChange,
        yearOverYearChange,
        trendDirection: this.determineTrendDirection(monthOverMonthChange)
      };
    });
  }

  // Calculate system health score
  private calculateSystemHealthScore(errorEvents: ErrorEvent[]): number {
    const recoveryRate = this.calculateOverallRecoveryRate(errorEvents);
    const userSatisfaction = this.calculateUserSatisfactionScore(errorEvents);
    const criticalErrorRate = this.calculateCriticalErrorRate(errorEvents);

    // Weighted score: recovery rate (50%), satisfaction (30%), low critical errors (20%)
    const recoveryScore = recoveryRate * 0.5;
    const satisfactionScore = userSatisfaction * 0.3;
    const criticalErrorScore = (1 - criticalErrorRate) * 0.2;

    return Math.round((recoveryScore + satisfactionScore + criticalErrorScore) * 100);
  }

  // Calculate critical error rate
  private calculateCriticalErrorRate(errorEvents: ErrorEvent[]): number {
    const criticalErrors = errorEvents.filter(e => e.severity === 'critical').length;
    return errorEvents.length > 0 ? criticalErrors / errorEvents.length : 0;
  }

  // Calculate cascading failure count
  private calculateCascadingFailureCount(errorEvents: ErrorEvent[]): number {
    // Simplified implementation - count errors that occur within 1 minute of each other
    const sortedEvents = [...errorEvents].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let cascadingFailures = 0;

    for (let i = 1; i < sortedEvents.length; i++) {
      const timeDiff = sortedEvents[i].timestamp.getTime() - sortedEvents[i - 1].timestamp.getTime();
      if (timeDiff < 60000) { // Within 1 minute
        cascadingFailures++;
      }
    }

    return cascadingFailures;
  }

  // Calculate resilience score
  private calculateResilienceScore(errorEvents: ErrorEvent[]): number {
    const recoveryRate = this.calculateOverallRecoveryRate(errorEvents);
    const averageRecoveryTime = this.calculateAverageRecoveryTime(errorEvents);
    const cascadingFailures = this.calculateCascadingFailureCount(errorEvents);

    // Higher resilience with fast recovery and few cascading failures
    const timeScore = Math.max(0, 1 - (averageRecoveryTime / 120000)); // Normalize to 2 minutes
    const cascadeScore = Math.max(0, 1 - (cascadingFailures / Math.max(1, errorEvents.length)));

    return Math.round((recoveryRate * 0.6 + timeScore * 0.2 + cascadeScore * 0.2) * 100);
  }

  // Calculate SC-009 target progress
  private calculateSC009TargetProgress(errorEvents: ErrorEvent[], currentRecoveryRate: number): SC009TargetProgress {
    const targetRecoveryRate = this.config.sc009.targetRecoveryRate;
    const gap = Math.max(0, targetRecoveryRate - currentRecoveryRate);
    const onTrack = gap <= 0.02; // Within 2% of target

    // Simple projection calculation (could be more sophisticated)
    const recentTrend = this.calculateRecentTrend(errorEvents);
    const projectedAchievement = this.calculateProjectedAchievement(currentRecoveryRate, recentTrend);

    const requiredImprovement = gap;
    const confidenceLevel = this.calculateConfidenceLevel(errorEvents, recentTrend);

    const riskFactors = this.identifyRiskFactors(errorEvents, gap);
    const successFactors = this.identifySuccessFactors(errorEvents, currentRecoveryRate);

    return {
      targetRecoveryRate,
      currentRecoveryRate,
      gap,
      onTrack,
      projectedAchievement,
      requiredImprovement,
      confidenceLevel,
      riskFactors,
      successFactors
    };
  }

  // Generate recommendations
  private generateRecommendations(
    errorEvents: ErrorEvent[],
    overallRecoveryRate: number,
    sc009Gap: number
  ): ErrorRecoveryRecommendation[] {
    const recommendations: ErrorRecoveryRecommendation[] = [];

    // Analyze error patterns and generate specific recommendations
    const errorsByType = this.calculateErrorsByType(errorEvents);
    const strategyEffectiveness = this.calculateSuccessRateByStrategy(errorEvents);

    // Recommendations for specific error types
    errorsByType.forEach(errorType => {
      if (errorType.recoveryRate < this.config.sc009.targetRecoveryRate) {
        const recommendation = this.generateErrorTypeRecommendation(errorType, strategyEffectiveness);
        if (recommendation && recommendation.confidence >= this.config.recommendations.minConfidence) {
          recommendations.push(recommendation);
        }
      }
    });

    // Recommendations for slow recovery times
    const slowRecoveryTypes = errorsByType.filter(type =>
      type.averageRecoveryTime > this.config.thresholds.slowRecovery
    );

    slowRecoveryTypes.forEach(errorType => {
      const recommendation = this.generateRecoveryTimeRecommendation(errorType);
      if (recommendation && recommendation.confidence >= this.config.recommendations.minConfidence) {
        recommendations.push(recommendation);
      }
    });

    // Recommendations for low satisfaction
    const lowSatisfactionTypes = errorsByType.filter(type =>
      type.userSatisfaction < this.config.thresholds.lowSatisfaction
    );

    lowSatisfactionTypes.forEach(errorType => {
      const recommendation = this.generateSatisfactionRecommendation(errorType);
      if (recommendation && recommendation.confidence >= this.config.recommendations.minConfidence) {
        recommendations.push(recommendation);
      }
    });

    // Sort by priority and limit the number of recommendations
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, this.config.recommendations.maxRecommendations);
  }

  // Helper methods
  private groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private getEmptyMetrics(timeRange: DateRange): ErrorRecoveryMetrics {
    return {
      overallRecoveryRate: 0,
      sc009Compliant: false,
      sc009Gap: 1.0,
      totalErrors: 0,
      errorsByType: [],
      errorsByCategory: [],
      errorsBySeverity: [],
      errorsByTool: [],
      averageRecoveryTime: 0,
      medianRecoveryTime: 0,
      recoveryTimeDistribution: [],
      successRateByStrategy: [],
      userSatisfactionScore: 0,
      satisfactionByErrorType: [],
      abandonmentRate: 0,
      abandonmentByErrorType: [],
      mostEffectiveStrategies: [],
      commonRecoveryPaths: [],
      retryPatterns: [],
      guidanceEffectivenessScore: 0,
      guidanceUsageStats: [],
      mostHelpfulGuidance: [],
      hourlyMetrics: [],
      dailyMetrics: [],
      weeklyMetrics: [],
      monthlyTrends: [],
      systemHealthScore: 100,
      criticalErrorRate: 0,
      cascadingFailureCount: 0,
      resilienceScore: 100,
      sc009TargetProgress: this.getDefaultSC009TargetProgress(),
      recommendations: [],
      timestamp: new Date(),
      period: timeRange
    };
  }

  private getDefaultConfig(): MetricsCalculationConfig {
    return {
      sc009: {
        targetRecoveryRate: 0.98,
        maxRecoveryTime: 120000, // 2 minutes
        minUserSatisfaction: 0.8,
        complianceWeighting: {
          recoveryRate: 0.6,
          recoveryTime: 0.2,
          userSatisfaction: 0.2
        }
      },
      timeRanges: {
        hourly: 3600000, // 1 hour
        daily: 86400000, // 24 hours
        weekly: 604800000, // 7 days
        monthly: 2592000000 // 30 days
      },
      thresholds: {
        lowErrorCount: 10,
        mediumErrorCount: 50,
        fastRecovery: 30000, // 30 seconds
        slowRecovery: 120000, // 2 minutes
        highSatisfaction: 0.9,
        lowSatisfaction: 0.7
      },
      recommendations: {
        minConfidence: 0.7,
        maxRecommendations: 10,
        priorityThresholds: {
          critical: 0.1,
          high: 0.05,
          medium: 0.02
        }
      }
    };
  }

  private getDefaultSC009TargetProgress(): SC009TargetProgress {
    return {
      targetRecoveryRate: 0.98,
      currentRecoveryRate: 0,
      gap: 0.98,
      onTrack: false,
      projectedAchievement: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      requiredImprovement: 0.98,
      confidenceLevel: 0,
      riskFactors: [],
      successFactors: []
    };
  }

  // Additional helper methods would be implemented here...
  private getToolName(toolId: string): string {
    // Would integrate with tools-data.ts
    return toolId;
  }

  private calculateTrend(category: string, events: ErrorEvent[]): TrendDirection {
    // Simplified trend calculation
    return 'stable';
  }

  private getTopErrorTypes(events: ErrorEvent[], limit: number): ErrorType[] {
    return this.calculateErrorsByType(events)
      .slice(0, limit)
      .map(type => type.type);
  }

  private findMostEffectiveStrategy(events: ErrorEvent[]): RecoveryStrategy {
    const strategies = this.calculateMostEffectiveStrategies(events);
    return strategies.length > 0 ? strategies[0].strategy : 'retry_with_same_input';
  }

  private calculateUserExperienceImpact(severity: ErrorSeverity): number {
    const impactMap = {
      'critical': 1.0,
      'high': 0.8,
      'medium': 0.5,
      'low': 0.2
    };
    return impactMap[severity];
  }

  private calculateRecommendationPriority(severity: ErrorSeverity): RecommendationPriority {
    const priorityMap = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    return priorityMap[severity] as RecommendationPriority;
  }

  private calculateEffectivenessScore(successRate: number, averageTime: number, userSatisfaction: number): number {
    const timeScore = Math.max(0, 1 - (averageTime / 120000)); // Normalize to 2 minutes
    return (successRate * 0.5 + timeScore * 0.3 + userSatisfaction * 0.2);
  }

  private getApplicableErrorTypes(attempts: any[]): ErrorType[] {
    const errorTypes = attempts.map(a => a.errorEvent?.type).filter(Boolean);
    return Array.from(new Set(errorTypes)) as ErrorType[];
  }

  private calculateRatingDistribution(ratings: number[]): any[] {
    const distribution = Array.from({ length: 5 }, (_, i) => ({
      rating: i + 1,
      count: 0,
      percentage: 0
    }));

    ratings.forEach(rating => {
      if (rating >= 1 && rating <= 5) {
        distribution[rating - 1].count++;
      }
    });

    distribution.forEach(d => {
      d.percentage = ratings.length > 0 ? (d.count / ratings.length) * 100 : 0;
    });

    return distribution;
  }

  private calculateSatisfactionFactors(errorType: ErrorType, events: ErrorEvent[]): any[] {
    // Simplified implementation
    return [];
  }

  private calculateAbandonmentReasons(abandonments: ErrorEvent[]): any[] {
    // Simplified implementation
    return [];
  }

  private calculateUserSatisfactionScoreForPath(path: any): number {
    // Simplified implementation
    return 0.8;
  }

  private calculateSuccessByAttempt(events: ErrorEvent[]): any[] {
    // Simplified implementation
    return [];
  }

  private calculateCommonFailurePoints(events: ErrorEvent[]): any[] {
    // Simplified implementation
    return [];
  }

  private calculateOptimalRetryCount(successByAttempt: any[]): number {
    // Simplified implementation
    return 3;
  }

  private calculateAverageRecoveryTime(events: ErrorEvent[]): number {
    const times = events.map(e => e.totalRecoveryTime).filter(t => t > 0);
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }

  private determineTrendDirection(change: number): TrendDirection {
    if (Math.abs(change) < 0.01) return 'stable';
    return change > 0 ? 'improving' : 'declining';
  }

  private calculateRecentTrend(errorEvents: ErrorEvent[]): number {
    // Simplified trend calculation
    return 0;
  }

  private calculateProjectedAchievement(currentRate: number, trend: number): Date {
    // Simplified projection
    const daysToTarget = trend > 0 ? Math.ceil((0.98 - currentRate) / trend) : 365;
    return new Date(Date.now() + daysToTarget * 24 * 60 * 60 * 1000);
  }

  private calculateConfidenceLevel(errorEvents: ErrorEvent[], trend: number): number {
    // Simplified confidence calculation
    return errorEvents.length > 50 ? 0.8 : 0.5;
  }

  private identifyRiskFactors(errorEvents: ErrorEvent[], gap: number): any[] {
    // Simplified risk factor identification
    return [];
  }

  private identifySuccessFactors(errorEvents: ErrorEvent[], rate: number): any[] {
    // Simplified success factor identification
    return [];
  }

  private generateErrorTypeRecommendation(errorType: ErrorTypeMetrics, strategies: StrategySuccessMetrics[]): ErrorRecoveryRecommendation | null {
    // Generate specific recommendation for an error type
    return null; // Implementation would go here
  }

  private generateRecoveryTimeRecommendation(errorType: ErrorTypeMetrics): ErrorRecoveryRecommendation | null {
    // Generate recommendation for slow recovery times
    return null; // Implementation would go here
  }

  private generateSatisfactionRecommendation(errorType: ErrorTypeMetrics): ErrorRecoveryRecommendation | null {
    // Generate recommendation for low satisfaction
    return null; // Implementation would go here
  }

  // Public API methods
  public getConfig(): MetricsCalculationConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<MetricsCalculationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const recoveryMetricsCalculator = RecoveryMetricsCalculator.getInstance();

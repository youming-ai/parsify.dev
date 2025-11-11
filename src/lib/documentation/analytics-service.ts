import type {
  DocumentationAnalytics,
  DocumentationFeedback,
  UserContext,
  DocumentationSearchResult,
  PopularContent,
  UserJourney,
  JourneyStep,
  SearchAnalytics
} from '@/types/documentation';

/**
 * Documentation Analytics and Feedback Service
 * Tracks user interactions, feedback, and provides insights into documentation usage
 */
export class DocumentationAnalyticsService {
  private static instance: DocumentationAnalyticsService;
  private analytics: Map<string, DocumentationAnalytics> = new Map();
  private feedback: Map<string, DocumentationFeedback[]> = new Map();
  private userJourneys: Map<string, UserJourney> = new Map();
  private searchAnalytics: SearchAnalytics[] = [];

  private constructor() {
    this.initializeAnalytics();
  }

  static getInstance(): DocumentationAnalyticsService {
    if (!DocumentationAnalyticsService.instance) {
      DocumentationAnalyticsService.instance = new DocumentationAnalyticsService();
    }
    return DocumentationAnalyticsService.instance;
  }

  /**
   * Initialize analytics tracking
   */
  private initializeAnalytics() {
    // Load existing analytics from localStorage if available
    if (typeof window !== 'undefined') {
      const savedAnalytics = localStorage.getItem('documentation_analytics');
      if (savedAnalytics) {
        try {
          const data = JSON.parse(savedAnalytics);
          this.analytics = new Map(Object.entries(data.analytics || {}));
          this.searchAnalytics = data.searchAnalytics || [];
        } catch (error) {
          console.warn('Failed to load analytics from localStorage:', error);
        }
      }
    }
  }

  /**
   * Track documentation view
   */
  public trackView(contentId: string, contentType: string, userId?: string, sessionId?: string) {
    const key = `${contentType}:${contentId}`;

    if (!this.analytics.has(key)) {
      this.analytics.set(key, {
        viewCount: 0,
        uniqueViewers: new Set(),
        averageTimeSpent: 0,
        bounceRate: 0,
        searchQueries: [],
        feedbackScore: 0,
        popularContent: [],
        userJourneys: []
      } as any);
    }

    const analytics = this.analytics.get(key)!;
    analytics.viewCount++;

    if (userId) {
      (analytics.uniqueViewers as Set<string>).add(userId);
    }

    // Track in user journey
    if (sessionId) {
      this.trackJourneyStep(sessionId, {
        contentId,
        type: contentType,
        timestamp: new Date(),
        timeSpent: 0
      });
    }

    this.saveAnalytics();
  }

  /**
   * Track time spent on documentation
   */
  public trackTimeSpent(contentId: string, contentType: string, timeSpent: number, sessionId?: string) {
    const key = `${contentType}:${contentId}`;
    const analytics = this.analytics.get(key);

    if (analytics) {
      // Update average time spent
      const currentTotal = analytics.averageTimeSpent * analytics.viewCount;
      analytics.averageTimeSpent = (currentTotal + timeSpent) / (analytics.viewCount + 1);

      // Update user journey if session is tracked
      if (sessionId && this.userJourneys.has(sessionId)) {
        const journey = this.userJourneys.get(sessionId)!;
        const lastStep = journey.steps[journey.steps.length - 1];
        if (lastStep && lastStep.contentId === contentId) {
          lastStep.timeSpent = timeSpent;
          journey.duration += timeSpent;
        }
      }
    }

    this.saveAnalytics();
  }

  /**
   * Track search query and results
   */
  public trackSearch(query: string, results: DocumentationSearchResult[], selectedResult?: string, userId?: string) {
    const searchEntry: SearchAnalytics = {
      query,
      resultCount: results.length,
      clickThroughRate: 0,
      selectedResult,
      timestamp: new Date()
    };

    this.searchAnalytics.push(searchEntry);

    // Keep only last 1000 search analytics entries
    if (this.searchAnalytics.length > 1000) {
      this.searchAnalytics = this.searchAnalytics.slice(-1000);
    }

    // Update search analytics for relevant content
    for (const result of results) {
      const key = `${result.type}:${result.id}`;
      const analytics = this.analytics.get(key);
      if (analytics) {
        analytics.searchQueries!.push(searchEntry);
      }
    }

    this.saveAnalytics();
  }

  /**
   * Track user feedback
   */
  public trackFeedback(feedback: Omit<DocumentationFeedback, 'id' | 'timestamp'>): string {
    const feedbackId = this.generateId();
    const fullFeedback: DocumentationFeedback = {
      ...feedback,
      id: feedbackId,
      timestamp: new Date()
    };

    const contentKey = `${feedback.contentType}:${feedback.contentId}`;
    if (!this.feedback.has(contentKey)) {
      this.feedback.set(contentKey, []);
    }

    this.feedback.get(contentKey)!.push(fullFeedback);

    // Update analytics
    const key = `${feedback.contentType}:${feedback.contentId}`;
    const analytics = this.analytics.get(key);
    if (analytics) {
      // Calculate new feedback score
      const allFeedback = this.feedback.get(contentKey)!;
      const ratings = allFeedback.map(f => f.rating).filter(r => r > 0);
      analytics.feedbackScore = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    }

    this.saveAnalytics();
    return feedbackId;
  }

  /**
   * Track journey step
   */
  private trackJourneyStep(sessionId: string, step: JourneyStep) {
    if (!this.userJourneys.has(sessionId)) {
      this.userJourneys.set(sessionId, {
        sessionId,
        steps: [],
        duration: 0,
        goalAchieved: false,
        path: []
      });
    }

    const journey = this.userJourneys.get(sessionId)!;
    journey.steps.push(step);
    journey.path.push(step.contentId);

    // Keep only last 1000 journeys
    if (this.userJourneys.size > 1000) {
      const oldestKey = this.userJourneys.keys().next().value;
      this.userJourneys.delete(oldestKey);
    }
  }

  /**
   * Complete user journey
   */
  public completeJourney(sessionId: string, goalAchieved: boolean) {
    const journey = this.userJourneys.get(sessionId);
    if (journey) {
      journey.goalAchieved = goalAchieved;
      this.saveAnalytics();
    }
  }

  /**
   * Get analytics for specific content
   */
  public getContentAnalytics(contentId: string, contentType: string): DocumentationAnalytics | null {
    const key = `${contentType}:${contentId}`;
    return this.analytics.get(key) || null;
  }

  /**
   * Get feedback for specific content
   */
  public getContentFeedback(contentId: string, contentType: string): DocumentationFeedback[] {
    const contentKey = `${contentType}:${contentId}`;
    return this.feedback.get(contentKey) || [];
  }

  /**
   * Get popular content across all documentation
   */
  public getPopularContent(limit: number = 10): PopularContent[] {
    const content: PopularContent[] = [];

    for (const [key, analytics] of this.analytics) {
      const [type, id] = key.split(':');
      content.push({
        contentId: id,
        type,
        title: this.extractTitleFromId(id, type),
        viewCount: analytics.viewCount,
        averageRating: analytics.feedbackScore,
        trending: this.isTrending(id, type)
      });
    }

    return content
      .sort((a, b) => {
        // Sort by a combination of views and rating
        const scoreA = a.viewCount * (a.averageRating / 5);
        const scoreB = b.viewCount * (b.averageRating / 5);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get search analytics and insights
   */
  public getSearchAnalytics(): {
    totalSearches: number;
    averageResults: number;
    popularQueries: Array<{ query: string; count: number; clickRate: number }>;
    noResultQueries: string[];
  } {
    const totalSearches = this.searchAnalytics.length;
    const averageResults = this.searchAnalytics.length > 0
      ? this.searchAnalytics.reduce((sum, s) => sum + s.resultCount, 0) / this.searchAnalytics.length
      : 0;

    // Popular queries
    const queryCounts = new Map<string, { count: number; clicks: number }>();
    for (const search of this.searchAnalytics) {
      const existing = queryCounts.get(search.query) || { count: 0, clicks: 0 };
      queryCounts.set(search.query, {
        count: existing.count + 1,
        clicks: existing.clicks + (search.selectedResult ? 1 : 0)
      });
    }

    const popularQueries = Array.from(queryCounts.entries())
      .map(([query, data]) => ({
        query,
        count: data.count,
        clickRate: data.count > 0 ? data.clicks / data.count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Queries with no results
    const noResultQueries = this.searchAnalytics
      .filter(s => s.resultCount === 0)
      .map(s => s.query)
      .filter((query, index, arr) => arr.indexOf(query) === index)
      .slice(0, 10);

    return {
      totalSearches,
      averageResults,
      popularQueries,
      noResultQueries
    };
  }

  /**
   * Get user journey insights
   */
  public getJourneyInsights(): {
    totalJourneys: number;
    completionRate: number;
    averageDuration: number;
    commonPaths: Array<{ path: string[]; count: number }>;
    dropoutPoints: Array<{ contentId: string; type: string; dropouts: number }>;
  } {
    const journeys = Array.from(this.userJourneys.values());
    const totalJourneys = journeys.length;
    const completedJourneys = journeys.filter(j => j.goalAchieved).length;
    const completionRate = totalJourneys > 0 ? completedJourneys / totalJourneys : 0;

    const averageDuration = totalJourneys > 0
      ? journeys.reduce((sum, j) => sum + j.duration, 0) / totalJourneys
      : 0;

    // Common paths
    const pathCounts = new Map<string, number>();
    for (const journey of journeys) {
      const pathKey = journey.path.join(' → ');
      pathCounts.set(pathKey, (pathCounts.get(pathKey) || 0) + 1);
    }

    const commonPaths = Array.from(pathCounts.entries())
      .map(([path, count]) => ({
        path: path.split(' → '),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Dropout points (content where users often exit)
    const dropoutCounts = new Map<string, number>();
    for (const journey of journeys) {
      if (!journey.goalAchieved && journey.steps.length > 0) {
        const lastStep = journey.steps[journey.steps.length - 1];
        const key = `${lastStep.type}:${lastStep.contentId}`;
        dropoutCounts.set(key, (dropoutCounts.get(key) || 0) + 1);
      }
    }

    const dropoutPoints = Array.from(dropoutCounts.entries())
      .map(([key, dropouts]) => {
        const [type, contentId] = key.split(':');
        return { contentId, type, dropouts };
      })
      .sort((a, b) => b.dropouts - a.dropouts)
      .slice(0, 10);

    return {
      totalJourneys,
      completionRate,
      averageDuration,
      commonPaths,
      dropoutPoints
    };
  }

  /**
   * Generate comprehensive documentation report
   */
  public generateReport(): {
    summary: {
      totalViews: number;
      uniqueViewers: number;
      averageTimeSpent: number;
      totalFeedback: number;
      averageRating: number;
    };
    topContent: PopularContent[];
    searchInsights: any;
    journeyInsights: any;
    recommendations: string[];
  } {
    const allAnalytics = Array.from(this.analytics.values());
    const totalViews = allAnalytics.reduce((sum, a) => sum + a.viewCount, 0);
    const totalUniqueViewers = allAnalytics.reduce((sum, a) => sum + (a.uniqueViewers as Set<string>).size, 0);
    const averageTimeSpent = allAnalytics.length > 0
      ? allAnalytics.reduce((sum, a) => sum + a.averageTimeSpent, 0) / allAnalytics.length
      : 0;

    const totalFeedback = Array.from(this.feedback.values()).reduce((sum, f) => sum + f.length, 0);
    const ratings = Array.from(this.feedback.values()).flat().filter(f => f.rating > 0);
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, f) => sum + f.rating, 0) / ratings.length
      : 0;

    const searchInsights = this.getSearchAnalytics();
    const journeyInsights = this.getJourneyInsights();

    const recommendations = this.generateRecommendations(searchInsights, journeyInsights);

    return {
      summary: {
        totalViews,
        uniqueViewers: totalUniqueViewers,
        averageTimeSpent,
        totalFeedback,
        averageRating
      },
      topContent: this.getPopularContent(10),
      searchInsights,
      journeyInsights,
      recommendations
    };
  }

  /**
   * Generate recommendations based on analytics
   */
  private generateRecommendations(searchInsights: any, journeyInsights: any): string[] {
    const recommendations: string[] = [];

    // Search-based recommendations
    if (searchInsights.noResultQueries.length > 0) {
      recommendations.push(`Consider adding documentation for these popular search terms: ${searchInsights.noResultQueries.slice(0, 3).join(', ')}`);
    }

    if (searchInsights.averageResults > 50) {
      recommendations.push('Search results are too broad. Consider improving content tagging and categorization.');
    }

    // Journey-based recommendations
    if (journeyInsights.completionRate < 0.5) {
      recommendations.push('Low completion rate detected. Review content for clarity and add more examples.');
    }

    if (journeyInsights.dropoutPoints.length > 0) {
      const topDropout = journeyInsights.dropoutPoints[0];
      recommendations.push(`High dropout rate at ${topDropout.type}:${topDropout.contentId}. Consider improving this content.`);
    }

    if (journeyInsights.averageDuration < 30000) { // Less than 30 seconds
      recommendations.push('Users are spending very little time on documentation. Consider adding more engaging content and examples.');
    }

    return recommendations;
  }

  /**
   * Check if content is trending
   */
  private isTrending(contentId: string, contentType: string): boolean {
    const key = `${contentType}:${contentId}`;
    const analytics = this.analytics.get(key);

    if (!analytics || analytics.viewCount < 10) {
      return false;
    }

    // Simple trending calculation: recent views compared to average
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentViews = this.searchAnalytics.filter(s =>
      s.timestamp > oneWeekAgo && s.selectedResult === contentId
    ).length;

    return recentViews > analytics.viewCount * 0.3; // More than 30% of views are recent
  }

  /**
   * Extract human-readable title from content ID
   */
  private extractTitleFromId(contentId: string, contentType: string): string {
    return contentId
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Save analytics to localStorage
   */
  private saveAnalytics() {
    if (typeof window !== 'undefined') {
      const data = {
        analytics: Object.fromEntries(this.analytics),
        searchAnalytics: this.searchAnalytics.slice(-1000), // Keep only recent searches
        lastSaved: new Date().toISOString()
      };

      try {
        localStorage.setItem('documentation_analytics', JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save analytics to localStorage:', error);
      }
    }
  }

  /**
   * Export analytics data
   */
  public exportAnalytics(): {
    contentAnalytics: Record<string, any>;
    feedback: Record<string, any>;
    searchAnalytics: SearchAnalytics[];
    userJourneys: UserJourney[];
    report: any;
  } {
    return {
      contentAnalytics: Object.fromEntries(this.analytics),
      feedback: Object.fromEntries(this.feedback),
      searchAnalytics: this.searchAnalytics,
      userJourneys: Array.from(this.userJourneys.values()),
      report: this.generateReport()
    };
  }

  /**
   * Clear all analytics data
   */
  public clearAnalytics() {
    this.analytics.clear();
    this.feedback.clear();
    this.userJourneys.clear();
    this.searchAnalytics = [];

    if (typeof window !== 'undefined') {
      localStorage.removeItem('documentation_analytics');
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const documentationAnalytics = DocumentationAnalyticsService.getInstance();

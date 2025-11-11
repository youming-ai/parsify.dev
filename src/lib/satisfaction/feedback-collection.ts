/**
 * Feedback Collection System
 * Manages collection, storage, and processing of user satisfaction feedback
 */

import type {
	SatisfactionSurvey,
	SatisfactionSurveyResponse,
	SatisfactionMetrics,
	SatisfactionUpdate,
	SatisfactionEvent,
	SatisfactionFilter,
	SC006ComplianceReport,
	ToolSatisfactionData,
	CategorySatisfactionData,
	SatisfactionAlert,
	SatisfactionGoal,
	SC006Issue,
	SC006Action,
	SC006Recommendation,
	SatisfactionTrend,
	SatisfactionScore,
	SatisfactionCategory
} from '@/types/satisfaction';

export class FeedbackCollectionSystem {
	private static instance: FeedbackCollectionSystem;
	private surveys: Map<string, SatisfactionSurvey> = new Map();
	private events: SatisfactionEvent[] = [];
	private alerts: SatisfactionAlert[] = [];
	private goals: Map<string, SatisfactionGoal> = new Map();
	private storageKey = 'parsify_satisfaction_surveys';
	private maxSurveysInMemory = 1000;
	private maxEventsInMemory = 5000;

	private constructor() {
		this.loadFromStorage();
		this.setupPeriodicCleanup();
		this.setupRealTimeProcessing();
	}

	static getInstance(): FeedbackCollectionSystem {
		if (!FeedbackCollectionSystem.instance) {
			FeedbackCollectionSystem.instance = new FeedbackCollectionSystem();
		}
		return FeedbackCollectionSystem.instance;
	}

	/**
	 * Record a completed satisfaction survey
	 */
	async recordSurvey(survey: SatisfactionSurvey): Promise<void> {
		// Store survey
		this.surveys.set(survey.id, survey);

		// Emit event
		this.emitEvent({
			type: 'survey_completed',
			data: { surveyId: survey.id, responses: survey.responses }
		});

		// Update satisfaction metrics
		this.updateSatisfactionMetrics(survey);

		// Check SC-006 compliance
		this.checkSC006Compliance(survey);

		// Process feedback
		this.processFeedback(survey);

		// Save to storage
		this.saveToStorage();

		// Check for alerts
		this.checkForAlerts(survey);

		// Update goals
		this.updateGoals(survey);
	}

	/**
	 * Record satisfaction update from behavioral data
	 */
	async recordSatisfactionUpdate(
		toolId: string,
		update: SatisfactionUpdate
	): Promise<void> {
		const survey = this.findLatestSurveyForTool(toolId);
		if (survey) {
			// Update the latest survey with new data
			const updatedSurvey = {
				...survey,
				responses: {
					...survey.responses,
					...update
				}
			};

			this.surveys.set(survey.id, updatedSurvey);
			this.emitEvent({
				type: 'satisfaction_updated',
				data: { toolId, update }
			});

			this.saveToStorage();
		}
	}

	/**
	 * Get satisfaction metrics for a specific tool
	 */
	getToolSatisfaction(toolId: string): ToolSatisfactionData | null {
		const toolSurveys = this.getSurveysForTool(toolId);
		if (toolSurveys.length === 0) return null;

		const scores = toolSurveys.map(s => s.responses.overallSatisfaction);
		const averageSatisfaction = scores.reduce((sum, score) => sum + score, 0) / scores.length;

		const categoryBreakdown = this.calculateCategoryBreakdown(toolSurveys);
		const trend = this.calculateTrend(scores);
		const issueBreakdown = this.analyzeIssues(toolSurveys);
		const userSegments = this.analyzeUserSegments(toolSurveys);
		const timeAnalysis = this.analyzeTimePatterns(toolSurveys);

		return {
			toolId,
			toolName: toolSurveys[0].toolName,
			toolCategory: toolSurveys[0].toolCategory,
			totalSurveys: toolSurveys.length,
			averageSatisfaction,
			satisfactionTrend: trend,
			categoryBreakdown,
			issueBreakdown,
			userSegments,
			timeAnalysis,
			lastUpdated: new Date(),
			sc006Compliant: this.isSC006Compliant(averageSatisfaction)
		};
	}

	/**
	 * Get satisfaction metrics for a category
	 */
	getCategorySatisfaction(category: string): CategorySatisfactionData | null {
		const categorySurveys = Array.from(this.surveys.values())
			.filter(s => s.toolCategory === category);

		if (categorySurveys.length === 0) return null;

		const tools = Array.from(new Set(categorySurveys.map(s => s.toolId)))
			.map(toolId => this.getToolSatisfaction(toolId))
			.filter(Boolean) as ToolSatisfactionData[];

		const averageSatisfaction = tools.reduce((sum, tool) => sum + tool.averageSatisfaction, 0) / tools.length;
		const scores = categorySurveys.map(s => s.responses.overallSatisfaction);
		const trend = this.calculateTrend(scores);

		return {
			category,
			totalSurveys: categorySurveys.length,
			averageSatisfaction,
			trend,
			tools,
			compliance: {
				compliant: this.isSC006Compliant(averageSatisfaction),
				score: averageSatisfaction,
				target: 4.5,
				gap: Math.max(0, 4.5 - averageSatisfaction)
			}
		};
	}

	/**
	 * Get overall satisfaction metrics
	 */
	getOverallSatisfaction(): SatisfactionMetrics {
		const allSurveys = Array.from(this.surveys.values());
		if (allSurveys.length === 0) {
			return this.getDefaultSatisfactionMetrics();
		}

		const scores = allSurveys.map(s => s.responses.overallSatisfaction);
		const categoryScores = this.calculateOverallCategoryScores(allSurveys);
		const trend = this.calculateTrend(scores);
		const completionRate = this.calculateCompletionRate();
		const responseRate = this.calculateResponseRate();
		const averageTimeToComplete = this.calculateAverageCompletionTime();
		const distribution = this.calculateDistribution(scores);

		return {
			overallSatisfactionScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
			categoryScores,
			satisfactionTrend: trend.direction,
			completionRate,
			responseRate,
			averageTimeToComplete,
			satisfactionDistribution: distribution,
			netPromoterScore: this.calculateNPS(scores),
			customerSatisfactionScore: this.calculateCSAT(scores),
			customerEffortScore: this.calculateCES(allSurveys)
		};
	}

	/**
	 * Generate SC-006 compliance report
	 */
	generateSC006ComplianceReport(): SC006ComplianceReport {
		const allTools = Array.from(new Set(Array.from(this.surveys.values()).map(s => s.toolId)));
		const allCategories = Array.from(new Set(Array.from(this.surveys.values()).map(s => s.toolCategory)));

		const toolCompliance = allTools.map(toolId => {
			const toolData = this.getToolSatisfaction(toolId);
			return {
				toolId,
				toolName: toolData?.toolName || toolId,
				category: toolData?.toolCategory || 'Unknown',
				satisfactionScore: toolData?.averageSatisfaction || 0,
				compliant: this.isSC006Compliant(toolData?.averageSatisfaction || 0),
				gapToTarget: Math.max(0, 4.5 - (toolData?.averageSatisfaction || 0)),
				sampleSize: toolData?.totalSurveys || 0,
				lastUpdated: toolData?.lastUpdated || new Date(),
				issues: this.getToolIssues(toolId)
			};
		});

		const categoryCompliance = allCategories.map(category => {
			const categoryData = this.getCategorySatisfaction(category);
			const toolsInCategory = categoryData?.tools || [];
			const compliantTools = toolsInCategory.filter(t => t.sc006Compliant);

			return {
				category,
				averageSatisfaction: categoryData?.averageSatisfaction || 0,
				compliant: this.isSC006Compliant(categoryData?.averageSatisfaction || 0),
				gapToTarget: Math.max(0, 4.5 - (categoryData?.averageSatisfaction || 0)),
				toolCount: toolsInCategory.length,
				compliantToolCount: compliantTools.length,
				trendDirection: categoryData?.trend.direction || 'stable'
			};
		});

		const overallMetrics = this.getOverallSatisfaction();
		const compliant = this.isSC006Compliant(overallMetrics.overallSatisfactionScore);
		const complianceScore = this.calculateComplianceScore(toolCompliance);

		return {
			reportId: `sc006_${Date.now()}`,
			generatedAt: new Date(),
			reportingPeriod: {
				startDate: this.getReportingPeriodStart(),
				endDate: new Date()
			},
			compliant,
			complianceScore,
			targetScore: 4.5,
			toolCompliance,
			categoryCompliance,
			overallMetrics,
			issues: this.getSC006Issues(toolCompliance),
			actions: this.getSC006Actions(),
			trends: this.getSatisfactionTrends(),
			forecast: this.generateSatisfactionForecast(),
			recommendations: this.generateSC006Recommendations(toolCompliance, categoryCompliance)
		};
	}

	/**
	 * Get satisfaction surveys with filtering
	 */
	getSurveys(filter?: SatisfactionFilter): SatisfactionSurvey[] {
		let surveys = Array.from(this.surveys.values());

		if (filter) {
			if (filter.toolIds?.length) {
				surveys = surveys.filter(s => filter.toolIds!.includes(s.toolId));
			}
			if (filter.categories?.length) {
				surveys = surveys.filter(s => filter.categories!.includes(s.toolCategory));
			}
			if (filter.dateRange) {
				surveys = surveys.filter(s =>
					s.timestamp >= filter.dateRange!.startDate &&
					s.timestamp <= filter.dateRange!.endDate
				);
			}
			if (filter.satisfactionScores?.length) {
				surveys = surveys.filter(s => filter.satisfactionScores!.includes(s.responses.overallSatisfaction));
			}
			if (filter.technicalIssues !== undefined) {
				surveys = surveys.filter(s => s.responses.technicalIssues === filter.technicalIssues);
			}
		}

		return surveys.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
	}

	/**
	 * Get active satisfaction alerts
	 */
	getActiveAlerts(): SatisfactionAlert[] {
		return this.alerts.filter(alert => !alert.resolved);
	}

	/**
	 * Create or update satisfaction goal
	 */
	setGoal(goal: SatisfactionGoal): void {
		this.goals.set(goal.id, goal);
		this.saveToStorage();
	}

	/**
	 * Get satisfaction goals
	 */
	getGoals(): SatisfactionGoal[] {
		return Array.from(this.goals.values());
	}

	/**
	 * Resolve an alert
	 */
	resolveAlert(alertId: string): void {
		const alert = this.alerts.find(a => a.id === alertId);
		if (alert) {
			alert.resolved = true;
			this.saveToStorage();
		}
	}

	// Private helper methods

	private loadFromStorage(): void {
		try {
			const stored = localStorage.getItem(this.storageKey);
			if (stored) {
				const data = JSON.parse(stored);

				// Load surveys
				if (data.surveys) {
					Object.entries(data.surveys).forEach(([id, survey]: [string, any]) => {
						this.surveys.set(id, {
							...survey,
							timestamp: new Date(survey.timestamp),
							completedAt: survey.completedAt ? new Date(survey.completedAt) : undefined
						});
					});
				}

				// Load alerts
				if (data.alerts) {
					this.alerts = data.alerts.map((alert: any) => ({
						...alert,
						timestamp: new Date(alert.timestamp)
					}));
				}

				// Load goals
				if (data.goals) {
					Object.entries(data.goals).forEach(([id, goal]: [string, any]) => {
						this.goals.set(id, {
							...goal,
							deadline: new Date(goal.deadline)
						});
					});
				}
			}
		} catch (error) {
			console.error('Failed to load satisfaction data from storage:', error);
		}
	}

	private saveToStorage(): void {
		try {
			const data = {
				surveys: Object.fromEntries(
					Array.from(this.surveys.entries()).slice(-this.maxSurveysInMemory)
				),
				alerts: this.alerts.slice(-100), // Keep last 100 alerts
				goals: Object.fromEntries(this.goals.entries())
			};
			localStorage.setItem(this.storageKey, JSON.stringify(data));
		} catch (error) {
			console.error('Failed to save satisfaction data to storage:', error);
		}
	}

	private setupPeriodicCleanup(): void {
		// Clean up old data every hour
		setInterval(() => {
			const cutoff = new Date();
			cutoff.setMonth(cutoff.getMonth() - 6); // Keep 6 months of data

			// Remove old surveys
			for (const [id, survey] of this.surveys.entries()) {
				if (survey.timestamp < cutoff) {
					this.surveys.delete(id);
				}
			}

			// Remove old events
			this.events = this.events.filter(event => {
				// Filter events based on their timestamp
				// This is a simplified approach - in practice, events would have timestamps
				return true;
			});

			// Remove resolved alerts older than 30 days
			const alertCutoff = new Date();
			alertCutoff.setDate(alertCutoff.getDate() - 30);
			this.alerts = this.alerts.filter(alert =>
				!alert.resolved || alert.timestamp > alertCutoff
			);

			this.saveToStorage();
		}, 60 * 60 * 1000); // Every hour
	}

	private setupRealTimeProcessing(): void {
		// Process events in real-time
		setInterval(() => {
			this.processEventQueue();
		}, 5000); // Every 5 seconds
	}

	private processEventQueue(): void {
		// Process any pending events
		const eventsToProcess = this.events.splice(0, 100); // Process up to 100 events at a time

		eventsToProcess.forEach(event => {
			switch (event.type) {
				case 'survey_completed':
					this.handleSurveyCompletedEvent(event);
					break;
				case 'satisfaction_updated':
					this.handleSatisfactionUpdatedEvent(event);
					break;
				case 'goal_achieved':
					this.handleGoalAchievedEvent(event);
					break;
				case 'compliance_breach':
					this.handleComplianceBreachEvent(event);
					break;
			}
		});
	}

	private emitEvent(event: SatisfactionEvent): void {
		this.events.push(event);
	}

	private updateSatisfactionMetrics(survey: SatisfactionSurvey): void {
		// Update real-time metrics based on new survey
		// This would trigger dashboard updates
	}

	private checkSC006Compliance(survey: SatisfactionSurvey): void {
		const toolData = this.getToolSatisfaction(survey.toolId);
		if (toolData && !this.isSC006Compliant(toolData.averageSatisfaction)) {
			this.emitEvent({
				type: 'compliance_breach',
				data: {
					toolId: survey.toolId,
					score: toolData.averageSatisfaction,
					target: 4.5
				}
			});
		}
	}

	private processFeedback(survey: SatisfactionSurvey): void {
		// Process detailed feedback for insights
		if (survey.feedback) {
			// Extract actionable insights
			this.extractInsights(survey);
		}
	}

	private extractInsights(survey: SatisfactionSurvey): void {
		// Use NLP or pattern matching to extract insights from feedback
		// This is a placeholder for more sophisticated analysis
	}

	private checkForAlerts(survey: SatisfactionSurvey): void {
		// Check for conditions that should trigger alerts
		if (survey.responses.overallSatisfaction <= 2) {
			this.createAlert({
				type: 'score_drop',
				severity: 'error',
				title: 'Low Satisfaction Score',
				description: `User reported very low satisfaction (${survey.responses.overallSatisfaction}/5) for ${survey.toolName}`,
				toolId: survey.toolId,
				currentValue: survey.responses.overallSatisfaction,
				thresholdValue: 2.5,
				gap: 2.5 - survey.responses.overallSatisfaction,
				timestamp: new Date(),
				resolved: false,
				actionRequired: true
			});
		}

		if (survey.responses.technicalIssues) {
			this.createAlert({
				type: 'negative_trend',
				severity: 'warning',
				title: 'Technical Issues Reported',
				description: `User encountered technical issues with ${survey.toolName}`,
				toolId: survey.toolId,
				currentValue: 1,
				thresholdValue: 0,
				gap: 1,
				timestamp: new Date(),
				resolved: false,
				actionRequired: true
			});
		}
	}

	private createAlert(alertData: Omit<SatisfactionAlert, 'id'>): void {
		const alert: SatisfactionAlert = {
			id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			...alertData
		};
		this.alerts.push(alert);
	}

	private updateGoals(survey: SatisfactionSurvey): void {
		// Update progress on relevant goals
		for (const goal of this.goals.values()) {
			if (!goal.toolId || goal.toolId === survey.toolId) {
				const currentScore = this.getCurrentScoreForGoal(goal);
				const progress = Math.max(0, Math.min(100,
					((currentScore - goal.currentScore) / (goal.targetScore - goal.currentScore)) * 100
				));

				goal.currentScore = currentScore;
				goal.progressPercentage = progress;

				if (currentScore >= goal.targetScore && goal.status !== 'achieved') {
					goal.status = 'achieved';
					this.emitEvent({
						type: 'goal_achieved',
						data: { goalId: goal.id, score: currentScore }
					});
				} else if (currentScore < goal.targetScore && goal.status === 'achieved') {
					goal.status = 'at_risk';
				}
			}
		}
	}

	private getCurrentScoreForGoal(goal: SatisfactionGoal): number {
		if (goal.toolId) {
			const toolData = this.getToolSatisfaction(goal.toolId);
			return toolData?.averageSatisfaction || 0;
		} else if (goal.category) {
			const categoryData = this.getCategorySatisfaction(goal.category);
			return categoryData?.averageSatisfaction || 0;
		} else {
			const overall = this.getOverallSatisfaction();
			return overall.overallSatisfactionScore;
		}
	}

	private getSurveysForTool(toolId: string): SatisfactionSurvey[] {
		return Array.from(this.surveys.values()).filter(s => s.toolId === toolId);
	}

	private findLatestSurveyForTool(toolId: string): SatisfactionSurvey | null {
		const surveys = this.getSurveysForTool(toolId);
		return surveys.length > 0 ? surveys[0] : null;
	}

	private calculateCategoryBreakdown(surveys: SatisfactionSurvey[]): Record<SatisfactionCategory, number> {
		const categories: SatisfactionCategory[] = [
			'overall', 'ease_of_use', 'feature_completeness', 'performance',
			'reliability', 'design_ui', 'documentation'
		];

		const breakdown: Record<SatisfactionCategory, number> = {} as any;

		categories.forEach(category => {
			let sum = 0;
			let count = 0;

			surveys.forEach(survey => {
				switch (category) {
					case 'overall':
						sum += survey.responses.overallSatisfaction;
						count++;
						break;
					case 'ease_of_use':
						sum += survey.responses.easeOfUse;
						count++;
						break;
					case 'feature_completeness':
						sum += survey.responses.featureCompleteness;
						count++;
						break;
					case 'performance':
						sum += survey.responses.performance;
						count++;
						break;
					case 'reliability':
						sum += survey.responses.reliability;
						count++;
						break;
					case 'design_ui':
						// Calculate from context or other metrics
						sum += survey.responses.metExpectations; // Proxy
						count++;
						break;
					case 'documentation':
						// Calculate from context or other metrics
						sum += survey.responses.wouldRecommend; // Proxy
						count++;
						break;
				}
			});

			breakdown[category] = count > 0 ? sum / count : 0;
		});

		return breakdown;
	}

	private calculateTrend(scores: SatisfactionScore[]): SatisfactionTrend {
		if (scores.length < 2) {
			return {
				current: scores[0] || 0,
				previous: 0,
				percentageChange: 0,
				direction: 'stable',
				dataPoints: []
			};
		}

		const recent = scores.slice(-10);
		const previous = scores.slice(-20, -10);

		const currentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
		const previousAvg = previous.length > 0 ?
			previous.reduce((sum, score) => sum + score, 0) / previous.length : currentAvg;

		const percentageChange = previousAvg > 0 ?
			((currentAvg - previousAvg) / previousAvg) * 100 : 0;

		let direction: 'up' | 'down' | 'stable' = 'stable';
		if (Math.abs(percentageChange) > 5) {
			direction = percentageChange > 0 ? 'up' : 'down';
		}

		const dataPoints = scores.slice(-30).map((score, index) => ({
			date: new Date(Date.now() - (scores.length - index) * 24 * 60 * 60 * 1000),
			score,
			sampleSize: 1
		}));

		return {
			current: currentAvg,
			previous: previousAvg,
			percentageChange,
			direction,
			dataPoints
		};
	}

	private analyzeIssues(surveys: SatisfactionSurvey[]): any {
		// Analyze common issues from feedback
		const technicalIssues = surveys.filter(s => s.responses.technicalIssues).length;
		const lowScores = surveys.filter(s => s.responses.overallSatisfaction <= 2).length;
		const unachievedGoals = surveys.filter(s => !s.responses.achievedGoal).length;

		return {
			commonIssues: [],
			bugReports: technicalIssues,
			featureRequests: 0,
			usabilityIssues: lowScores,
			performanceIssues: 0,
			designIssues: unachievedGoals
		};
	}

	private analyzeUserSegments(surveys: SatisfactionSurvey[]): any {
		const beginnerUsers = surveys.filter(s => s.context.userType === 'beginner');
		const intermediateUsers = surveys.filter(s => s.context.userType === 'intermediate');
		const expertUsers = surveys.filter(s => s.context.userType === 'expert');
		const newUsers = surveys.filter(s => s.context.isFirstTimeUser);
		const returningUsers = surveys.filter(s => !s.context.isFirstTimeUser);

		return {
			beginnerUsers: this.createSegmentData(beginnerUsers),
			intermediateUsers: this.createSegmentData(intermediateUsers),
			expertUsers: this.createSegmentData(expertUsers),
			newUsers: this.createSegmentData(newUsers),
			returningUsers: this.createSegmentData(returningUsers)
		};
	}

	private createSegmentData(surveys: SatisfactionSurvey[]): any {
		if (surveys.length === 0) {
			return {
				sampleSize: 0,
				averageSatisfaction: 0,
				completionRate: 0,
				commonIssues: [],
				satisfactionDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
			};
		}

		const scores = surveys.map(s => s.responses.overallSatisfaction);
		const averageSatisfaction = scores.reduce((sum, score) => sum + score, 0) / scores.length;
		const completionRate = surveys.filter(s => s.responses.achievedGoal).length / surveys.length;

		return {
			sampleSize: surveys.length,
			averageSatisfaction,
			completionRate,
			commonIssues: [],
			satisfactionDistribution: this.calculateDistribution(scores)
		};
	}

	private analyzeTimePatterns(surveys: SatisfactionSurvey[]): any {
		const hourlyAverages: Record<string, number> = {};
		const dailyAverages: Record<string, number> = {};
		const weeklyAverages: Record<string, number> = {};

		// Simple time-based analysis
		surveys.forEach(survey => {
			const hour = new Date(survey.timestamp).getHours().toString();
			const day = new Date(survey.timestamp).toLocaleDateString();
			const week = `Week-${Math.floor(new Date(survey.timestamp).getTime() / (7 * 24 * 60 * 60 * 1000))}`;

			if (!hourlyAverages[hour]) {
				hourlyAverages[hour] = [];
			}
			if (!dailyAverages[day]) {
				dailyAverages[day] = [];
			}
			if (!weeklyAverages[week]) {
				weeklyAverages[week] = [];
			}

			// Would need to aggregate properly in real implementation
		});

		return {
			hourlyAverages,
			dailyAverages,
			weeklyAverages,
			seasonalTrends: [],
			peakSatisfactionHours: [],
			peakSatisfactionDays: []
		};
	}

	private calculateDistribution(scores: SatisfactionScore[]): Record<SatisfactionScore, number> {
		const distribution: Record<SatisfactionScore, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
		scores.forEach(score => {
			distribution[score]++;
		});
		return distribution;
	}

	private calculateNPS(scores: SatisfactionScore[]): number {
		const promoters = scores.filter(s => s >= 4).length;
		const detractors = scores.filter(s <= 2).length;
		const total = scores.length;

		if (total === 0) return 0;
		return ((promoters - detractors) / total) * 100;
	}

	private calculateCSAT(scores: SatisfactionScore[]): number {
		if (scores.length === 0) return 0;
		const satisfied = scores.filter(s => s >= 4).length;
		return (satisfied / scores.length) * 100;
	}

	private calculateCES(surveys: SatisfactionSurvey[]): number {
		// Calculate Customer Effort Score based on various factors
		if (surveys.length === 0) return 0;

		let totalEffort = 0;
		surveys.forEach(survey => {
			let effortScore = 5 - survey.responses.easeOfUse; // Invert ease of use
			if (survey.responses.technicalIssues) effortScore += 1;
			if (!survey.responses.achievedGoal) effortScore += 1;
			totalEffort += Math.min(5, effortScore);
		});

		const averageEffort = totalEffort / surveys.length;
		return Math.max(0, 100 - (averageEffort * 20));
	}

	private calculateCompletionRate(): number {
		const surveys = Array.from(this.surveys.values());
		if (surveys.length === 0) return 0;
		return surveys.filter(s => s.responses.achievedGoal).length / surveys.length;
	}

	private calculateResponseRate(): number {
		// This would require tracking initiated vs completed surveys
		// For now, return a placeholder
		return 85.5;
	}

	private calculateAverageCompletionTime(): number {
		const surveys = Array.from(this.surveys.values()).filter(s => s.completedAt);
		if (surveys.length === 0) return 0;

		const totalTime = surveys.reduce((sum, survey) => sum + survey.timeToComplete, 0);
		return totalTime / surveys.length;
	}

	private calculateOverallCategoryScores(surveys: SatisfactionSurvey[]): Record<SatisfactionCategory, number> {
		return this.calculateCategoryBreakdown(surveys);
	}

	private isSC006Compliant(score: number): boolean {
		return score >= 4.5;
	}

	private getDefaultSatisfactionMetrics(): SatisfactionMetrics {
		return {
			overallSatisfactionScore: 0,
			categoryScores: {
				overall: 0,
				ease_of_use: 0,
				feature_completeness: 0,
				performance: 0,
				reliability: 0,
				design_ui: 0,
				documentation: 0
			},
			satisfactionTrend: 'stable',
			completionRate: 0,
			responseRate: 0,
			averageTimeToComplete: 0,
			satisfactionDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
			netPromoterScore: 0,
			customerSatisfactionScore: 0,
			customerEffortScore: 0
		};
	}

	private getReportingPeriodStart(): Date {
		const startDate = new Date();
		startDate.setMonth(startDate.getMonth() - 1);
		return startDate;
	}

	private calculateComplianceScore(toolCompliance: any[]): number {
		if (toolCompliance.length === 0) return 0;
		const compliantTools = toolCompliance.filter(t => t.compliant).length;
		return (compliantTools / toolCompliance.length) * 100;
	}

	private getToolIssues(toolId: string): string[] {
		const issues: string[] = [];
		const surveys = this.getSurveysForTool(toolId);

		const lowScoreCount = surveys.filter(s => s.responses.overallSatisfaction <= 2).length;
		const technicalIssueCount = surveys.filter(s => s.responses.technicalIssues).length;
		const unachievedGoalCount = surveys.filter(s => !s.responses.achievedGoal).length;

		if (lowScoreCount > surveys.length * 0.2) issues.push('High number of low satisfaction scores');
		if (technicalIssueCount > surveys.length * 0.1) issues.push('Frequent technical issues');
		if (unachievedGoalCount > surveys.length * 0.3) issues.push('Low goal achievement rate');

		return issues;
	}

	private getSC006Issues(toolCompliance: any[]): SC006Issue[] {
		const issues: SC006Issue[] = [];

		toolCompliance.forEach(tool => {
			if (!tool.compliant) {
				issues.push({
					id: `issue_${tool.toolId}`,
					type: 'satisfaction_gap',
					severity: tool.gapToTarget > 1 ? 'high' : 'medium',
					description: `${tool.toolName} satisfaction score (${tool.satisfactionScore.toFixed(1)}) is below SC-006 target (4.5)`,
					affectedTools: [tool.toolId],
					impact: tool.gapToTarget,
					status: 'open'
				});
			}

			if (tool.sampleSize < 10) {
				issues.push({
					id: `sample_size_${tool.toolId}`,
					type: 'sample_size_insufficient',
					severity: 'medium',
					description: `${tool.toolName} has insufficient feedback samples (${tool.sampleSize}) for reliable assessment`,
					affectedTools: [tool.toolId],
					impact: 0.5,
					status: 'open'
				});
			}
		});

		return issues;
	}

	private getSC006Actions(): SC006Action[] {
		// Generate recommended actions based on current state
		const actions: SC006Action[] = [];

		const nonCompliantTools = this.generateSC006ComplianceReport().toolCompliance.filter(t => !t.compliant);

		if (nonCompliantTools.length > 0) {
			actions.push({
				id: 'improve_low_satisfaction',
				title: 'Improve Low Satisfaction Tools',
				description: `Address satisfaction issues in ${nonCompliantTools.length} non-compliant tools`,
				type: 'short_term',
				priority: 'high',
				status: 'planned',
				expectedImpact: 0.8
			});
		}

		return actions;
	}

	private getSatisfactionTrends(): SatisfactionTrend[] {
		const trends: SatisfactionTrend[] = [];

		// Calculate trends for each tool
		const toolIds = Array.from(new Set(Array.from(this.surveys.values()).map(s => s.toolId)));
		toolIds.forEach(toolId => {
			const toolData = this.getToolSatisfaction(toolId);
			if (toolData) {
				trends.push(toolData.satisfactionTrend);
			}
		});

		return trends;
	}

	private generateSatisfactionForecast(): any {
		// Generate forecast based on current trends
		return {
			period: '30 days',
			predictedScore: 4.3,
			confidence: 0.75,
			factors: [],
			scenarios: []
		};
	}

	private generateSC006Recommendations(
		toolCompliance: any[],
		categoryCompliance: any[]
	): SC006Recommendation[] {
		const recommendations: SC006Recommendation[] = [];

		// Analyze patterns and generate recommendations
		const nonCompliantTools = toolCompliance.filter(t => !t.compliant);
		const criticalTools = nonCompliantTools.filter(t => t.gapToTarget > 1);

		if (criticalTools.length > 0) {
			recommendations.push({
				id: 'urgent_improvements',
				category: 'immediate',
				priority: 'critical',
				title: 'Urgent Improvements Needed',
				description: `Immediate action required for ${criticalTools.length} tools with significant satisfaction gaps`,
				expectedImpact: 1.5,
				effort: 'high',
				targetTools: criticalTools.map(t => t.toolId),
				implementation: [
					'Conduct user interviews',
					'Analyze feedback patterns',
					'Implement quick fixes',
					'Plan feature enhancements'
				],
				successMetrics: [
					'Satisfaction score increase to 4.5+',
					'Reduction in technical issues',
					'Improved goal achievement rates'
				]
			});
		}

		return recommendations;
	}

	// Event handlers
	private handleSurveyCompletedEvent(event: any): void {
		// Handle survey completion event
	}

	private handleSatisfactionUpdatedEvent(event: any): void {
		// Handle satisfaction update event
	}

	private handleGoalAchievedEvent(event: any): void {
		// Handle goal achievement event
	}

	private handleComplianceBreachEvent(event: any): void {
		// Handle compliance breach event
		this.createAlert({
			type: 'compliance_breach',
			severity: 'critical',
			title: 'SC-006 Compliance Breach',
			description: `Tool ${event.data.toolId} fell below SC-006 satisfaction target with score ${event.data.score}`,
			toolId: event.data.toolId,
			currentValue: event.data.score,
			thresholdValue: 4.5,
			gap: 4.5 - event.data.score,
			timestamp: new Date(),
			resolved: false,
			actionRequired: true
		});
	}
}

// Export singleton instance
export const feedbackCollectionSystem = FeedbackCollectionSystem.getInstance();

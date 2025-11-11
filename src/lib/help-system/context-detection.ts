/**
 * Context Detection System for Help System
 * Detects user context and matches appropriate help content
 */

import type {
	HelpContext,
	HelpContextType,
	HelpContent,
	UserHelpProfile,
	ContextRequirement
} from '@/types/help-system';

export class ContextDetector {
	private static instance: ContextDetector;
	private activeContexts: Map<string, HelpContext> = new Map();
	private contextHistory: HelpContext[] = [];
	private maxHistorySize = 100;

	private constructor() {}

	static getInstance(): ContextDetector {
		if (!ContextDetector.instance) {
			ContextDetector.instance = new ContextDetector();
		}
		return ContextDetector.instance;
	}

	/**
	 * Detect current context based on page and user interaction
	 */
	detectContext(
		pagePath: string,
		userAction?: string,
		elementInfo?: ElementInfo,
		errorInfo?: ErrorInfo
	): HelpContext {
		const contextId = this.generateContextId(pagePath, userAction, elementInfo);

		// Check if context already exists
		const existingContext = this.activeContexts.get(contextId);
		if (existingContext) {
			this.updateContext(existingContext);
			return existingContext;
		}

		// Create new context
		const context = this.createContext(pagePath, userAction, elementInfo, errorInfo);

		// Store and return context
		this.activeContexts.set(contextId, context);
		this.addToHistory(context);

		return context;
	}

	/**
	 * Match help content to current context
	 */
	async matchHelpContent(
		context: HelpContext,
		profile: UserHelpProfile,
		availableHelp: HelpContent[]
	): Promise<HelpContent[]> {
		const matchingHelp: HelpContent[] = [];

		for (const help of availableHelp) {
			if (this.isContextMatch(help, context, profile)) {
				const priority = this.calculateHelpPriority(help, context, profile);
				matchingHelp.push({
					...help,
					metadata: {
						...help.metadata,
						priority,
					},
				});
			}
		}

		// Sort by priority and relevance
		return matchingHelp.sort((a, b) => {
			const priorityA = (a.metadata as any).priority || 0;
			const priorityB = (b.metadata as any).priority || 0;
			return priorityB - priorityA;
		});
	}

	/**
	 * Check if user meets requirements for help
	 */
	meetsRequirements(
		requirements: ContextRequirement[],
		profile: UserHelpProfile,
		context: HelpContext
	): boolean {
		return requirements.every(req => this.checkRequirement(req, profile, context));
	}

	/**
	 * Get contextual suggestions based on user behavior
	 */
	getContextualSuggestions(
		profile: UserHelpProfile,
		currentContext: HelpContext
	): string[] {
		const suggestions: string[] = [];

		// Based on expertise level
		if (profile.expertiseLevel === 'beginner') {
			suggestions.push('getting-started', 'basic-usage');
		}

		// Based on tool usage patterns
		const recentTools = Object.entries(profile.toolUsage)
			.filter(([_, stats]) => this.isRecentlyUsed(stats.lastUsed))
			.map(([toolId, _]) => toolId);

		if (recentTools.length > 0) {
			suggestions.push('advanced-features', 'related-tools');
		}

		// Based on error patterns
		if (this.hasRecentErrors(profile)) {
			suggestions.push('troubleshooting', 'common-errors');
		}

		// Based on time spent on current tool
		const currentToolStats = profile.toolUsage[currentContext.toolId || ''];
		if (currentToolStats && this.isLongSession(currentToolStats)) {
			suggestions.push('shortcuts', 'productivity-tips');
		}

		return suggestions;
	}

	/**
	 * Create context from page and interaction data
	 */
	private createContext(
		pagePath: string,
		userAction?: string,
		elementInfo?: ElementInfo,
		errorInfo?: ErrorInfo?
	): HelpContext {
		const contextType = this.determineContextType(pagePath, userAction, elementInfo, errorInfo);
		const toolId = this.extractToolId(pagePath);

		return {
			id: this.generateContextId(pagePath, userAction, elementInfo),
			type: contextType,
			toolId,
			componentId: elementInfo?.componentId,
			errorCode: errorInfo?.code,
			userAction,
			pageSection: this.extractPageSection(pagePath),
			elementSelector: elementInfo?.selector,
			triggerEvents: [userAction || 'page-load'],
			metadata: {
				pagePath,
				timestamp: Date.now(),
				elementInfo,
				errorInfo,
			},
			requires: this.generateContextRequirements(contextType, toolId),
		};
	}

	/**
	 * Determine context type from available information
	 */
	private determineContextType(
		pagePath: string,
		userAction?: string,
		elementInfo?: ElementInfo,
		errorInfo?: ErrorInfo?
	): HelpContextType {
		// Error state takes priority
		if (errorInfo) {
			return 'error-state';
		}

		// Check for specific actions
		if (userAction) {
			if (userAction.includes('error') || userAction.includes('validation')) {
				return 'validation-error';
			}
			if (userAction.includes('hover') && elementInfo) {
				return 'component-hover';
			}
			if (userAction.includes('shortcut') || userAction.includes('keyboard')) {
				return 'keyboard-shortcut';
			}
		}

		// Check page patterns
		if (pagePath.includes('/tools/')) {
			return 'tool-page';
		}

		// Check for first visit patterns
		const sessionCount = this.getSessionCount();
		if (sessionCount <= 3) {
			return 'first-visit';
		}

		// Default to general page context
		return 'feature-discovery';
	}

	/**
	 * Check if help matches current context
	 */
	private isContextMatch(
		help: HelpContent,
		context: HelpContext,
		profile: UserHelpProfile
	): boolean {
		// Check if help contexts include current context type
		if (!help.contexts.includes(context.type)) {
			return false;
		}

		// Check tool-specific help
		if (help.metadata.searchableText.includes('tool:') && context.toolId) {
			if (!help.metadata.searchableText.includes(`tool:${context.toolId}`)) {
				return false;
			}
		}

		// Check audience appropriateness
		if (!help.targetAudience.includes(profile.expertiseLevel)) {
			// Allow beginners to see intermediate help in some cases
			if (!(profile.expertiseLevel === 'beginner' &&
				  help.targetAudience.includes('intermediate'))) {
				return false;
			}
		}

		// Check if user has already dismissed this help recently
		const recentDismissal = this.getRecentDismissal(help.id, profile);
		if (recentDismissal && !this.shouldShowAgain(recentDismissal, help.priority)) {
			return false;
		}

		return true;
	}

	/**
	 * Calculate help priority based on context and user
	 */
	private calculateHelpPriority(
		help: HelpContent,
		context: HelpContext,
		profile: UserHelpProfile
	): number {
		let priority = 0;

		// Base priority from help content
		switch (help.priority) {
			case 'critical': priority += 100; break;
			case 'high': priority += 75; break;
			case 'medium': priority += 50; break;
			case 'low': priority += 25; break;
		}

		// Context-specific adjustments
		if (context.type === 'error-state') {
			priority += 80;
		}
		if (context.type === 'first-visit' && profile.sessionCount <= 3) {
			priority += 60;
		}
		if (context.toolId && help.metadata.searchableText.includes(`tool:${context.toolId}`)) {
			priority += 40;
		}

		// User expertise adjustments
		if (help.targetAudience.includes(profile.expertiseLevel)) {
			priority += 30;
		}

		// Recency and frequency adjustments
		if (this.isRecentlyViewed(help.id, profile)) {
			priority -= 20;
		}
		if (this.isFrequentlyViewed(help.id, profile)) {
			priority -= 15;
		}

		return Math.max(0, priority);
	}

	/**
	 * Check individual requirement
	 */
	private checkRequirement(
		requirement: ContextRequirement,
		profile: UserHelpProfile,
		context: HelpContext
	): boolean {
		switch (requirement.type) {
			case 'user-level':
				return this.checkUserLevel(requirement, profile);
			case 'time-spent':
				return this.checkTimeSpent(requirement, profile, context);
			case 'click-count':
				return this.checkClickCount(requirement, profile);
			case 'error-count':
				return this.checkErrorCount(requirement, profile);
			case 'feature-used':
				return this.checkFeatureUsed(requirement, profile);
			case 'never-used':
				return this.checkNeverUsed(requirement, profile);
			default:
				return true;
		}
	}

	/**
	 * Generate context requirements based on type
	 */
	private generateContextRequirements(
		contextType: HelpContextType,
		toolId?: string
	): ContextRequirement[] {
		const requirements: ContextRequirement[] = [];

		switch (contextType) {
			case 'first-visit':
				requirements.push({
					type: 'user-level',
					operator: 'equals',
					value: 'beginner',
				});
				break;

			case 'error-state':
				requirements.push({
					type: 'error-count',
					operator: 'greater-than',
					value: 0,
					threshold: 1,
				});
				break;

			case 'advanced-feature':
				requirements.push({
					type: 'user-level',
					operator: 'contains',
					value: ['intermediate', 'advanced', 'expert'],
				});
				break;
		}

		if (toolId) {
			requirements.push({
				type: 'feature-used',
				operator: 'equals',
				value: toolId,
				threshold: 1,
			});
		}

		return requirements;
	}

	// Helper methods
	private generateContextId(pagePath: string, userAction?: string, elementInfo?: ElementInfo): string {
		const parts = [pagePath, userAction || '', elementInfo?.selector || ''];
		return btoa(parts.join('|')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
	}

	private updateContext(context: HelpContext): void {
		context.metadata.lastUpdated = Date.now();
		context.triggerEvents.push(context.metadata.lastUpdated.toString());
	}

	private addToHistory(context: HelpContext): void {
		this.contextHistory.push(context);
		if (this.contextHistory.length > this.maxHistorySize) {
			this.contextHistory.shift();
		}
	}

	private extractToolId(pagePath: string): string | undefined {
		const match = pagePath.match(/\/tools\/([^\/]+)/);
		return match ? match[1] : undefined;
	}

	private extractPageSection(pagePath: string): string {
		const parts = pagePath.split('/').filter(Boolean);
		return parts[parts.length - 1] || 'home';
	}

	private isRecentlyUsed(lastUsed: Date): boolean {
		const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
		return lastUsed.getTime() > weekAgo;
	}

	private hasRecentErrors(profile: UserHelpProfile): boolean {
		const recentInteractions = profile.helpInteractions.filter(
			interaction => interaction.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
		);
		return recentInteractions.some(interaction =>
			interaction.contextId.includes('error')
		);
	}

	private isLongSession(toolStats: any): boolean {
		return toolStats && toolStats.totalTimeSpent > 5 * 60 * 1000; // 5 minutes
	}

	private getSessionCount(): number {
		// This would typically come from user profile or session management
		return 1;
	}

	private getRecentDismissal(helpId: string, profile: UserHelpProfile): Date | null {
		const dismissal = profile.helpInteractions.find(
			interaction => interaction.helpId === helpId &&
						  interaction.action === 'dismissed' &&
						  interaction.timestamp.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
		);
		return dismissal ? dismissal.timestamp : null;
	}

	private shouldShowAgain(lastDismissal: Date, priority: string): boolean {
		const daysSinceDismissal = (Date.now() - lastDismissal.getTime()) / (24 * 60 * 60 * 1000);

		switch (priority) {
			case 'critical': return daysSinceDismissal >= 1;
			case 'high': return daysSinceDismissal >= 3;
			case 'medium': return daysSinceDismissal >= 7;
			case 'low': return daysSinceDismissal >= 14;
			default: return daysSinceDismissal >= 7;
		}
	}

	private isRecentlyViewed(helpId: string, profile: UserHelpProfile): boolean {
		return profile.helpInteractions.some(
			interaction => interaction.helpId === helpId &&
						  interaction.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
		);
	}

	private isFrequentlyViewed(helpId: string, profile: UserHelpProfile): boolean {
		const viewCount = profile.helpInteractions.filter(
			interaction => interaction.helpId === helpId
		).length;
		return viewCount > 5;
	}

	private checkUserLevel(requirement: ContextRequirement, profile: UserHelpProfile): boolean {
		switch (requirement.operator) {
			case 'equals': return profile.expertiseLevel === requirement.value;
			case 'contains': return Array.isArray(requirement.value) &&
							  requirement.value.includes(profile.expertiseLevel);
			default: return false;
		}
	}

	private checkTimeSpent(
		requirement: ContextRequirement,
		profile: UserHelpProfile,
		context: HelpContext
	): boolean {
		const toolStats = profile.toolUsage[context.toolId || ''];
		if (!toolStats) return false;

		switch (requirement.operator) {
			case 'greater-than':
				return toolStats.totalTimeSpent > (requirement.threshold || 0);
			case 'less-than':
				return toolStats.totalTimeSpent < (requirement.threshold || Infinity);
			default: return false;
		}
	}

	private checkClickCount(requirement: ContextRequirement, profile: UserHelpProfile): boolean {
		// Implementation would track click events
		return true;
	}

	private checkErrorCount(requirement: ContextRequirement, profile: UserHelpProfile): boolean {
		const errorCount = profile.helpInteractions.filter(
			interaction => interaction.contextId.includes('error')
		).length;

		switch (requirement.operator) {
			case 'greater-than': return errorCount > (requirement.threshold || 0);
			case 'equals': return errorCount === requirement.value;
			default: return false;
		}
	}

	private checkFeatureUsed(requirement: ContextRequirement, profile: UserHelpProfile): boolean {
		const toolStats = profile.toolUsage[requirement.value as string];
		if (!toolStats) return false;

		switch (requirement.operator) {
			case 'equals': return toolStats.usageCount === (requirement.threshold || 1);
			case 'greater-than': return toolStats.usageCount > (requirement.threshold || 0);
			default: return false;
		}
	}

	private checkNeverUsed(requirement: ContextRequirement, profile: UserHelpProfile): boolean {
		const toolStats = profile.toolUsage[requirement.value as string];
		return !toolStats || toolStats.usageCount === 0;
	}
}

// Element information for context detection
export interface ElementInfo {
	selector: string;
	componentId?: string;
	text?: string;
	type: string;
	id?: string;
	class?: string;
}

// Error information for context detection
export interface ErrorInfo {
	code: string;
	message: string;
	stack?: string;
	type: string;
}

export default ContextDetector;

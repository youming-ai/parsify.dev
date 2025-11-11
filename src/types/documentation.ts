import type { Tool, ToolCategory, ToolExample } from './tools';

// Core documentation interfaces
export interface DocumentationSection {
	id: string;
	title: string;
	content: string; // Markdown content
	order: number;
	isRequired: boolean;
	subsections?: DocumentationSubsection[];
}

export interface DocumentationSubsection {
	id: string;
	title: string;
	content: string; // Markdown content
	order: number;
	codeExamples?: CodeExample[];
	tips?: DocumentationTip[];
}

export interface CodeExample {
	id: string;
	title: string;
	description: string;
	language: SupportedLanguage;
	code: string;
	output?: string;
	isInteractive: boolean;
	explanation?: string;
	difficulty: 'basic' | 'intermediate' | 'advanced';
}

export interface DocumentationTip {
	id: string;
	type: 'tip' | 'warning' | 'best-practice' | 'performance' | 'security';
	content: string;
	importance: 'low' | 'medium' | 'high';
	relatedTo?: string[];
}

// Tool documentation structure
export interface ToolDocumentation {
	toolId: string;
	toolName: string;
	toolCategory: ToolCategory;
	version: string;
	lastUpdated: Date;
	sections: DocumentationSection[];
	examples: ToolExample[];
	tutorials: TutorialReference[];
	bestPractices: BestPractice[];
	faq: FAQItem[];
	relatedTools: string[];
	tags: string[];
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	estimatedReadTime: number; // in minutes
	author?: string;
	reviewers?: string[];
}

export interface TutorialReference {
	id: string;
	title: string;
	description: string;
	duration: number; // in minutes
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	tags: string[];
	tools: string[];
	steps: TutorialStep[];
}

export interface TutorialStep {
	id: string;
	title: string;
	description: string;
	content: string;
	codeExample?: CodeExample;
	expectedOutcome: string;
	tips?: string[];
	prerequisites?: string[];
}

export interface BestPractice {
	id: string;
	title: string;
	description: string;
	rationale: string;
	example?: CodeExample;
	antiPattern?: string;
	category: 'performance' | 'security' | 'maintainability' | 'usability' | 'accessibility';
	applicableTo: string[]; // Tool IDs
}

export interface FAQItem {
	id: string;
	question: string;
	answer: string;
	category: string;
	tags: string[];
	relatedTools?: string[];
	helpfulCount: number;
	notHelpfulCount: number;
}

// Tutorial collection and workflows
export interface TutorialCollection {
	id: string;
	title: string;
	description: string;
	category: TutorialCategory;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	duration: number; // in minutes
	tutorials: TutorialReference[];
	prerequisites?: string[];
	outcomes: string[];
	popularity: number;
	rating: number;
	author?: string;
	lastUpdated: Date;
}

export type TutorialCategory =
	| 'getting-started'
	| 'json-processing'
	| 'code-execution'
	| 'file-processing'
	| 'network-utilities'
	| 'text-processing'
	| 'security-encryption'
	| 'advanced-workflows'
	| 'integration-patterns';

// Workflow documentation
export interface WorkflowDocumentation {
	id: string;
	name: string;
	description: string;
	category: WorkflowCategory;
	steps: WorkflowStep[];
	tools: string[];
	prerequisites: string[];
	estimatedTime: number;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	tags: string[];
	examples: WorkflowExample[];
	troubleshooting: TroubleshootingStep[];
}

export type WorkflowCategory =
	| 'data-transformation'
	| 'api-integration'
	| 'code-optimization'
	| 'file-processing'
	| 'security-validation'
	| 'text-analysis';

export interface WorkflowStep {
	id: string;
	title: string;
	description: string;
	toolId: string;
	toolConfig?: Record<string, any>;
	inputInstructions: string;
	expectedOutput: string;
	tips?: string[];
}

export interface WorkflowExample {
	id: string;
	title: string;
	description: string;
	inputData: any;
	stepByStepGuide: string[];
	finalResult: any;
	useCase: string;
}

export interface TroubleshootingStep {
	problem: string;
	symptoms: string[];
	causes: string[];
	solutions: SolutionStep[];
	prevention: string[];
}

export interface SolutionStep {
	description: string;
	actionable: boolean;
	toolId?: string;
	codeExample?: string;
}

// Documentation search and navigation
export interface DocumentationSearchResult {
	id: string;
	type: 'tool' | 'tutorial' | 'workflow' | 'example' | 'faq';
	title: string;
	description: string;
	content: string;
	relevanceScore: number;
	highlights: string[];
	breadcrumbs: string[];
	url: string;
	lastUpdated: Date;
}

export interface DocumentationNavigation {
	rootCategories: DocumentationCategory[];
	currentPath: string[];
	breadcrumbs: BreadcrumbItem[];
	relatedContent: RelatedContent[];
	filters: SearchFilter[];
}

export interface DocumentationCategory {
	id: string;
	name: string;
	description: string;
	icon: string;
	order: number;
	subcategories?: DocumentationSubcategory[];
	toolCount: number;
	tutorialCount: number;
}

export interface DocumentationSubcategory {
	id: string;
	name: string;
	description: string;
	parentId: string;
	tools: string[];
	tutorials: string[];
}

export interface RelatedContent {
	id: string;
	type: 'tool' | 'tutorial' | 'workflow' | 'example';
	title: string;
	description: string;
	relevanceScore: number;
	url: string;
}

// User interaction and feedback
export interface DocumentationFeedback {
	id: string;
	contentId: string;
	contentType: 'tool' | 'tutorial' | 'example' | 'faq';
	rating: number; // 1-5
	feedback: string;
	wasHelpful: boolean;
	suggestions: string;
	userContext: UserContext;
	timestamp: Date;
}

export interface UserContext {
	userId?: string;
	sessionId: string;
	toolId?: string;
	workflowId?: string;
	experienceLevel: 'beginner' | 'intermediate' | 'advanced';
	role?: string;
	previousInteractions: string[];
}

export interface DocumentationAnalytics {
	viewCount: number;
	uniqueViewers: number;
	averageTimeSpent: number; // in seconds
	bounceRate: number;
	searchQueries: SearchAnalytics[];
	feedbackScore: number;
	popularContent: PopularContent[];
	userJourneys: UserJourney[];
}

export interface SearchAnalytics {
	query: string;
	resultCount: number;
	clickThroughRate: number;
	selectedResult?: string;
	timestamp: Date;
}

export interface PopularContent {
	contentId: string;
	type: string;
	title: string;
	viewCount: number;
	averageRating: number;
	trending: boolean;
}

export interface UserJourney {
	sessionId: string;
	steps: JourneyStep[];
	duration: number;
	goalAchieved: boolean;
	path: string[];
}

export interface JourneyStep {
	contentId: string;
	type: string;
	timestamp: Date;
	timeSpent: number;
	searchQuery?: string;
}

// Content management and moderation
export interface DocumentationContent {
	id: string;
	type: ContentType;
	title: string;
	content: string;
	author: string;
	status: ContentStatus;
	version: number;
	createdAt: Date;
	lastUpdated: Date;
	reviewers: string[];
	tags: string[];
	metadata: ContentMetadata;
}

export type ContentType = 'tool-doc' | 'tutorial' | 'workflow' | 'example' | 'faq' | 'blog';

export type ContentStatus = 'draft' | 'review' | 'published' | 'archived' | 'deprecated';

export interface ContentMetadata {
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	estimatedReadTime: number;
	prerequisites: string[];
	relatedTools: string[];
	tags: string[];
	targetAudience: string[];
	searchKeywords: string[];
	lastReviewed?: Date;
	nextReviewDue?: Date;
}

// Language and syntax highlighting support
export type SupportedLanguage =
	| 'javascript'
	| 'typescript'
	| 'python'
	| 'java'
	| 'csharp'
	| 'cpp'
	| 'go'
	| 'rust'
	| 'php'
	| 'ruby'
	| 'sql'
	| 'html'
	| 'css'
	| 'json'
	| 'xml'
	| 'yaml'
	| 'markdown'
	| 'bash'
	| 'powershell'
	| 'dockerfile'
	| 'plaintext';

// Documentation configuration
export interface DocumentationConfig {
	siteName: string;
	logo: string;
	theme: DocumentationTheme;
	navigation: NavigationConfig;
	search: SearchConfig;
	feedback: FeedbackConfig;
	analytics: AnalyticsConfig;
	integrations: IntegrationConfig;
}

export interface DocumentationTheme {
	primaryColor: string;
	secondaryColor: string;
	fontFamily: string;
	codeTheme: 'light' | 'dark' | 'auto';
	customStyles?: string;
}

export interface NavigationConfig {
	showBreadcrumbs: boolean;
	showTableOfContents: boolean;
	maxDepth: number;
	collapseSections: boolean;
	showProgress: boolean;
}

export interface SearchConfig {
	enableFuzzySearch: boolean;
	minSearchLength: number;
	maxResults: number;
	highlightResults: boolean;
	includeContentInSearch: boolean;
}

export interface FeedbackConfig {
	enableRating: boolean;
	enableComments: boolean;
	requireAuth: boolean;
	moderationEnabled: boolean;
	notifyReviewers: boolean;
}

export interface AnalyticsConfig {
	provider: 'google' | 'plausible' | 'custom';
	trackingId?: string;
	trackViews: boolean;
	trackSearches: boolean;
	trackFeedback: boolean;
	anonymousData: boolean;
}

export interface IntegrationConfig {
	helpSystem: {
		enabled: boolean;
		contextualHelp: boolean;
		smartSuggestions: boolean;
	};
	tutorials: {
		enabled: boolean;
		interactiveMode: boolean;
		progressTracking: boolean;
	};
	api: {
		enabled: boolean;
		publicAccess: boolean;
		rateLimiting: boolean;
	};
}

// Type guards
export function isToolDocumentation(doc: any): doc is ToolDocumentation {
	return doc && typeof doc.toolId === 'string' && Array.isArray(doc.sections);
}

export function isTutorialCollection(doc: any): doc is TutorialCollection {
	return doc && typeof doc.id === 'string' && Array.isArray(doc.tutorials);
}

export function isWorkflowDocumentation(doc: any): doc is WorkflowDocumentation {
	return doc && typeof doc.id === 'string' && Array.isArray(doc.steps);
}

export function isValidLanguage(language: string): language is SupportedLanguage {
	return [
		'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp',
		'go', 'rust', 'php', 'ruby', 'sql', 'html', 'css', 'json',
		'xml', 'yaml', 'markdown', 'bash', 'powershell', 'dockerfile', 'plaintext'
	].includes(language);
}

export function isValidContentType(type: string): type is ContentType {
	return ['tool-doc', 'tutorial', 'workflow', 'example', 'faq', 'blog'].includes(type);
}

/**
 * Zustand Store for Workflow State Management
 * Centralized state for guided workflows and tutorials
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type {
	Workflow,
	WorkflowStep,
	WorkflowContext,
	WorkflowProgress,
	WorkflowState,
	WorkflowPreferences,
	WorkflowAnalytics,
	DeviceInfo
} from '@/types/workflows';

interface WorkflowStore extends WorkflowState {
	// Actions
	setActiveWorkflow: (workflow: Workflow | null) => void;
	setCurrentStep: (stepIndex: number) => void;
	updateContext: (updates: Partial<WorkflowContext>) => void;
	updateProgress: (updates: Partial<WorkflowProgress>) => void;

	// Navigation
	goToNextStep: () => void;
	goToPreviousStep: () => void;
	goToStep: (stepId: string) => void;
	skipStep: () => void;

	// UI controls
	setVisibility: (visible: boolean) => void;
	setMinimized: (minimized: boolean) => void;
	setPosition: (position: { x: number; y: number }) => void;
	setZoomLevel: (level: number) => void;

	// Tutorial mode
	setTutorialMode: (enabled: boolean) => void;
	setHighlightsEnabled: (enabled: boolean) => void;
	setTooltipsEnabled: (enabled: boolean) => void;

	// Workflow actions
	startWorkflow: (workflow: Workflow) => void;
	completeWorkflow: () => void;
	completeStep: (stepId: string) => void;
	resetWorkflow: () => void;
	pauseWorkflow: () => void;
	resumeWorkflow: () => void;

	// Analytics
	trackStepStart: (stepId: string) => void;
	trackStepComplete: (stepId: string, duration: number) => void;
	trackError: (stepId: string, error: string) => void;
	trackHintView: (hintId: string) => void;

	// Preferences
	updatePreferences: (updates: Partial<WorkflowPreferences>) => void;
	dismissWorkflow: (workflowId: string) => void;
	favoriteWorkflow: (workflowId: string) => void;

	// Data management
	exportProgress: () => string;
	importProgress: (data: string) => void;
	clearAllData: () => void;
}

const defaultPreferences: WorkflowPreferences = {
	enabled: true,
	autoStart: false,
	showProgress: true,
	showHints: true,
	allowSkipping: true,
	theme: 'auto',
	animations: true,
	sounds: false,
	position: 'bottom-right',
	dismissedWorkflows: [],
	completedWorkflows: [],
	favoriteWorkflows: [],
};

const createInitialContext = (toolId: string): WorkflowContext => ({
	toolId,
	stepId: '',
	stepIndex: 0,
	userData: {},
	sessionData: {},
	environment: process.env.NODE_ENV === 'development' ? 'development' : 'production',
	deviceInfo: getDeviceInfo(),
});

function getDeviceInfo(): DeviceInfo {
	if (typeof window === 'undefined') {
		return {
			type: 'desktop',
			browser: 'unknown',
			screenSize: { width: 1920, height: 1080 },
			permissions: [],
		};
	}

	const width = window.innerWidth;
	const height = window.innerHeight;

	let type: 'desktop' | 'tablet' | 'mobile';
	if (width < 768) {
		type = 'mobile';
	} else if (width < 1024) {
		type = 'tablet';
	} else {
		type = 'desktop';
	}

	const userAgent = navigator.userAgent;
	let browser = 'unknown';
	if (userAgent.includes('Chrome')) browser = 'chrome';
	else if (userAgent.includes('Firefox')) browser = 'firefox';
	else if (userAgent.includes('Safari')) browser = 'safari';
	else if (userAgent.includes('Edge')) browser = 'edge';

	return {
		type,
		browser,
		screenSize: { width, height },
		permissions: [],
	};
}

export const useWorkflowStore = create<WorkflowStore>()(
	subscribeWithSelector(
		persist(
			(set, get) => ({
				// Initial state
				activeWorkflow: null,
				currentStepIndex: 0,
				context: createInitialContext(''),
				progress: {
					completedSteps: [],
					currentStep: '',
					startTime: new Date(),
					lastActivity: new Date(),
					totalTime: 0,
					errors: [],
					hintsShown: [],
					skippedSteps: [],
				},

				// UI state
				isVisible: false,
				isMinimized: false,
				position: { x: 0, y: 0 },
				zoomLevel: 1,

				// History and navigation
				history: [],
				canGoBack: false,
				canGoForward: false,
				canSkip: true,

				// Tutorial state
				tutorialMode: false,
				highlightsEnabled: true,
				tooltipsEnabled: true,

				// Preferences
				preferences: defaultPreferences,

				// Actions
				setActiveWorkflow: (workflow) => {
					set((state) => {
						if (!workflow) {
							return {
								activeWorkflow: null,
								isVisible: false,
							};
						}

						const context = createInitialContext(workflow.toolId);
						const progress: WorkflowProgress = {
							completedSteps: [],
							currentStep: workflow.steps[0]?.id || '',
							startTime: new Date(),
							lastActivity: new Date(),
							totalTime: 0,
							errors: [],
							hintsShown: [],
							skippedSteps: [],
						};

						return {
							activeWorkflow: workflow,
							currentStepIndex: 0,
							context: { ...context, stepId: workflow.steps[0]?.id || '', stepIndex: 0 },
							progress,
							isVisible: true,
							isMinimized: false,
							history: [workflow.steps[0]?.id || ''],
							canGoBack: false,
							canGoForward: workflow.steps.length > 1,
						};
					});
				},

				setCurrentStep: (stepIndex) => {
					const { activeWorkflow } = get();
					if (!activeWorkflow || stepIndex < 0 || stepIndex >= activeWorkflow.steps.length) {
						return;
					}

					const step = activeWorkflow.steps[stepIndex];
					set((state) => ({
						currentStepIndex: stepIndex,
						context: { ...state.context, stepId: step.id, stepIndex },
						progress: {
							...state.progress,
							currentStep: step.id,
							lastActivity: new Date(),
						},
						history: [...state.history.slice(0, stepIndex + 1), step.id],
						canGoBack: stepIndex > 0,
						canGoForward: stepIndex < activeWorkflow.steps.length - 1,
					}));
				},

				updateContext: (updates) => {
					set((state) => ({
						context: { ...state.context, ...updates },
					}));
				},

				updateProgress: (updates) => {
					set((state) => ({
						progress: { ...state.progress, ...updates },
					}));
				},

				goToNextStep: () => {
					const { currentStepIndex, activeWorkflow } = get();
					if (activeWorkflow && currentStepIndex < activeWorkflow.steps.length - 1) {
						get().setCurrentStep(currentStepIndex + 1);
					}
				},

				goToPreviousStep: () => {
					const { currentStepIndex } = get();
					if (currentStepIndex > 0) {
						get().setCurrentStep(currentStepIndex - 1);
					}
				},

				goToStep: (stepId) => {
					const { activeWorkflow } = get();
					if (!activeWorkflow) return;

					const stepIndex = activeWorkflow.steps.findIndex(step => step.id === stepId);
					if (stepIndex !== -1) {
						get().setCurrentStep(stepIndex);
					}
				},

				skipStep: () => {
					const { currentStepIndex, progress } = get();
					const currentStep = get().activeWorkflow?.steps[currentStepIndex];

					if (currentStep && !currentStep.required) {
						set((state) => ({
							progress: {
								...state.progress,
								skippedSteps: [...state.progress.skippedSteps, currentStep.id],
							},
						}));
						get().goToNextStep();
					}
				},

				setVisibility: (visible) => set({ isVisible: visible }),
				setMinimized: (minimized) => set({ isMinimized: minimized }),
				setPosition: (position) => set({ position }),
				setZoomLevel: (zoomLevel) => set({ zoomLevel }),

				setTutorialMode: (enabled) => set({ tutorialMode: enabled }),
				setHighlightsEnabled: (enabled) => set({ highlightsEnabled: enabled }),
				setTooltipsEnabled: (enabled) => set({ tooltipsEnabled: enabled }),

				startWorkflow: (workflow) => {
					get().setActiveWorkflow(workflow);
					get().trackStepStart(workflow.steps[0]?.id || '');
				},

				completeWorkflow: () => {
					const { activeWorkflow, progress, preferences } = get();
					if (!activeWorkflow) return;

					const completedTime = new Date();
					const totalTime = Math.floor((completedTime.getTime() - progress.startTime.getTime()) / 1000);

					set((state) => ({
						progress: {
							...state.progress,
							completedSteps: activeWorkflow.steps.map(step => step.id),
							lastActivity: completedTime,
							totalTime,
						},
						preferences: {
							...state.preferences,
							completedWorkflows: [...state.preferences.completedWorkflows, activeWorkflow.id],
						},
					}));

					// Auto-hide completion
					setTimeout(() => {
						get().setVisibility(false);
					}, 3000);
				},

				completeStep: (stepId) => {
					const { progress, activeWorkflow, currentStepIndex } = get();

					if (!progress.completedSteps.includes(stepId)) {
						const newCompletedSteps = [...progress.completedSteps, stepId];

						set((state) => ({
							progress: {
								...state.progress,
								completedSteps: newCompletedSteps,
								lastActivity: new Date(),
							},
						}));

						// Auto-advance if not the last step
						if (activeWorkflow && currentStepIndex < activeWorkflow.steps.length - 1) {
							setTimeout(() => {
								get().goToNextStep();
							}, 500);
						} else if (activeWorkflow && currentStepIndex === activeWorkflow.steps.length - 1) {
							// Complete workflow
							get().completeWorkflow();
						}
					}
				},

				resetWorkflow: () => {
					const { activeWorkflow } = get();
					if (activeWorkflow) {
						get().setActiveWorkflow(activeWorkflow);
					}
				},

				pauseWorkflow: () => {
					set({ isVisible: false });
				},

				resumeWorkflow: () => {
					set({ isVisible: true });
				},

				trackStepStart: (stepId) => {
					const { context } = get();
					context.sessionData[`${stepId}_startTime`] = new Date().toISOString();
				},

				trackStepComplete: (stepId, duration) => {
					const { context } = get();
					context.sessionData[`${stepId}_duration`] = duration;
					context.sessionData[`${stepId}_completedAt`] = new Date().toISOString();
				},

				trackError: (stepId, error) => {
					set((state) => ({
						progress: {
							...state.progress,
							errors: [...state.progress.errors, {
								stepId,
								error,
								timestamp: new Date(),
								resolved: false,
							}],
						},
					}));
				},

				trackHintView: (hintId) => {
					const { progress } = get();
					if (!progress.hintsShown.includes(hintId)) {
						set((state) => ({
							progress: {
								...state.progress,
								hintsShown: [...state.progress.hintsShown, hintId],
							},
						}));
					}
				},

				updatePreferences: (updates) => {
					set((state) => ({
						preferences: { ...state.preferences, ...updates },
					}));
				},

				dismissWorkflow: (workflowId) => {
					set((state) => ({
						preferences: {
							...state.preferences,
							dismissedWorkflows: [...state.preferences.dismissedWorkflows, workflowId],
						},
					}));
				},

				favoriteWorkflow: (workflowId) => {
					set((state) => {
						const favorites = state.preferences.favoriteWorkflows;
						const isFavorited = favorites.includes(workflowId);

						return {
							preferences: {
								...state.preferences,
								favoriteWorkflows: isFavorited
									? favorites.filter(id => id !== workflowId)
									: [...favorites, workflowId],
							},
						};
					});
				},

				exportProgress: () => {
					const { progress, preferences } = get();
					return JSON.stringify({ progress, preferences });
				},

				importProgress: (data) => {
					try {
						const parsed = JSON.parse(data);
						set({
							progress: { ...get().progress, ...parsed.progress },
							preferences: { ...get().preferences, ...parsed.preferences },
						});
					} catch (error) {
						console.error('Failed to import progress:', error);
					}
				},

				clearAllData: () => {
					set({
						preferences: defaultPreferences,
					});
				},
			}),
			{
				name: 'workflow-storage',
				partialize: (state) => ({
					preferences: state.preferences,
				}),
			}
		)
	)
);

// Selectors for common use cases
export const useCurrentWorkflow = () => useWorkflowStore((state) => state.activeWorkflow);
export const useCurrentStep = () => {
	const workflow = useWorkflowStore((state) => state.activeWorkflow);
	const stepIndex = useWorkflowStore((state) => state.currentStepIndex);
	return workflow?.steps[stepIndex];
};
export const useWorkflowProgress = () => useWorkflowStore((state) => state.progress);
export const useWorkflowPreferences = () => useWorkflowStore((state) => state.preferences);
export const useWorkflowVisibility = () => useWorkflowStore((state) => state.isVisible);

/**
 * Monitoring Integration Example
 * Demonstrates how to integrate the enhanced SC-011 monitoring system
 * into tool components for comprehensive task completion tracking
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { enhancedMonitoring, startTask, completeTask, failTask, abandonTask } from '@/monitoring';
import { taskCompletionTracker } from '@/monitoring/task-completion-tracker';
import { userExperienceMonitor } from '@/monitoring/user-experience-monitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
	CheckCircle,
	XCircle,
	AlertTriangle,
	Loader2,
	TrendingUp,
	Users,
	Target,
	Activity,
	Brain,
	Shield
} from 'lucide-react';

interface MonitoringIntegrationProps {
	toolId: string;
	toolName: string;
	toolCategory: string;
	children: React.ReactNode;
}

interface TaskState {
	taskId?: string;
	eventId?: string;
	status: 'idle' | 'processing' | 'completed' | 'failed' | 'abandoned';
	progress: number;
	startTime?: Date;
	endTime?: Date;
	errorMessage?: string;
	metadata?: {
		inputSize?: number;
		outputSize?: number;
		stepsCompleted?: number;
		totalSteps?: number;
	};
}

export function MonitoringIntegrationExample({
	toolId,
	toolName,
	toolCategory,
	children
}: MonitoringIntegrationProps) {
	const [taskState, setTaskState] = useState<TaskState>({ status: 'idle', progress: 0 });
	const [showMonitoring, setShowMonitoring] = useState(false);
	const [satisfactionSurvey, setSatisfactionSurvey] = useState({
		show: false,
		overallSatisfaction: 4,
		easeOfUse: 4,
		achievedGoal: true,
		metExpectations: 4,
		wouldRecommend: 4,
		feedback: ''
	});
	const abortControllerRef = useRef<AbortController | null>(null);

	// Initialize monitoring system
	useEffect(() => {
		enhancedMonitoring.initialize().catch(console.error);
	}, []);

	// Start task monitoring
	const startTaskMonitoring = useCallback((metadata?: {
		inputSize?: number;
		totalSteps?: number;
	}) => {
		// Cancel any existing task
		if (taskState.eventId && taskState.status === 'processing') {
			abortControllerRef.current?.abort();
			abandonTask(taskState.eventId, 'new_task_started', 'User started a new task');
		}

		// Create new abort controller
		abortControllerRef.current = new AbortController();

		// Start monitoring
		const eventId = startTask(toolId, {
			userId: 'demo_user', // Would come from auth context
			...metadata
		});

		setTaskState({
			eventId,
			status: 'processing',
			progress: 0,
			startTime: new Date(),
			metadata
		});

		return eventId;
	}, [toolId, taskState.eventId, taskState.status]);

	// Update task progress
	const updateTaskProgress = useCallback((stepsCompleted: number, totalSteps: number) => {
		if (taskState.eventId) {
			const progress = (stepsCompleted / totalSteps) * 100;
			setTaskState(prev => ({
				...prev,
				progress,
				metadata: {
					...prev.metadata,
					stepsCompleted,
					totalSteps
				}
			}));

			// Update in monitoring system
			taskCompletionTracker.updateTaskProgress(taskState.eventId!, stepsCompleted, `step_${stepsCompleted}`);
		}
	}, [taskState.eventId]);

	// Complete task successfully
	const completeTaskMonitoring = useCallback((outputData?: {
		outputSize?: number;
		processingTime?: number;
	}) => {
		if (taskState.eventId) {
			const endTime = new Date();
			const processingTime = endTime.getTime() - (taskState.startTime?.getTime() || endTime.getTime());

			setTaskState(prev => ({
				...prev,
				status: 'completed',
				progress: 100,
				endTime,
				metadata: {
					...prev.metadata,
					...outputData,
					processingTime
				}
			}));

			// Complete in monitoring system
			completeTask(taskState.eventId, {
				...outputData,
				processingTime,
				userSatisfaction: 4 // Will be updated by survey
			});

			// Show satisfaction survey after completion
			setTimeout(() => {
				setSatisfactionSurvey(prev => ({ ...prev, show: true }));
			}, 1000);
		}
	}, [taskState.eventId, taskState.startTime]);

	// Fail task with error
	const failTaskMonitoring = useCallback((errorType: string, errorMessage: string, errorData?: any) => {
		if (taskState.eventId) {
			const endTime = new Date();

			setTaskState(prev => ({
				...prev,
				status: 'failed',
				endTime,
				errorMessage,
				metadata: {
					...prev.metadata,
					...errorData
				}
			}));

			// Fail in monitoring system
			failTask(taskState.eventId, errorType, errorMessage, errorData);

			// Track frustration
			const sessionData = userExperienceMonitor.getSessionAnalysis('demo_session'); // Would get actual session
			if (sessionData) {
				userExperienceMonitor.trackFrustrationIndicator(
					'demo_session', // Would get actual session ID
					'error_repetition',
					'high',
					{
						toolName,
						action: 'task_failure'
					}
				);
			}
		}
	}, [taskState.eventId, toolName]);

	// Abandon task
	const abandonTaskMonitoring = useCallback((dropOffPoint: string, reason: string) => {
		if (taskState.eventId) {
			const endTime = new Date();

			setTaskState(prev => ({
				...prev,
				status: 'abandoned',
				endTime,
				metadata: prev.metadata
			}));

			// Abandon in monitoring system
			abandonTask(taskState.eventId, dropOffPoint, reason);
		}
	}, [taskState.eventId]);

	// Submit satisfaction survey
	const submitSatisfactionSurvey = useCallback(() => {
		if (taskState.eventId) {
			userExperienceMonitor.recordSatisfactionSurvey({
				taskId: toolId,
				toolName,
				sessionId: 'demo_session', // Would get actual session
				timestamp: new Date(),
				responses: {
					overallSatisfaction: satisfactionSurvey.overallSatisfaction,
					easeOfUse: satisfactionSurvey.easeOfUse,
					achievedGoal: satisfactionSurvey.achievedGoal,
					metExpectations: satisfactionSurvey.metExpectations,
					wouldRecommend: satisfactionSurvey.wouldRecommend,
					technicalIssues: false,
					featuresUsed: [toolCategory],
					difficultyRating: 'medium' as const
				},
				feedback: satisfactionSurvey.feedback ? {
					whatWentWell: undefined,
					whatCouldBeBetter: satisfactionSurvey.feedback,
					suggestions: undefined,
					technicalIssues: undefined
				} : undefined,
				context: {
					taskComplexity: 'medium' as const,
					deviceType: 'desktop',
					browserType: 'chrome',
					timeOfDay: new Date().toLocaleTimeString(),
					sessionDuration: taskState.endTime ?
						taskState.endTime.getTime() - (taskState.startTime?.getTime() || 0) : 0
				}
			});

			// Update task completion with satisfaction score
			completeTask(taskState.eventId, {
				userSatisfaction: satisfactionSurvey.overallSatisfaction
			});

			// Hide survey
			setSatisfactionSurvey(prev => ({ ...prev, show: false }));
		}
	}, [taskState, satisfactionSurvey, toolId, toolName, toolCategory]);

	// Cancel current task
	const cancelTask = useCallback(() => {
		if (taskState.eventId && taskState.status === 'processing') {
			abortControllerRef.current?.abort();
			abandonTaskMonitoring('user_cancellation', 'User cancelled the task');
		}
	}, [taskState, abandonTaskMonitoring]);

	// Get current compliance status
	const complianceStatus = enhancedMonitoring.getComplianceStatus();
	const dashboardData = enhancedMonitoring.getDashboardData();

	return (
		<div className="space-y-4">
			{/* Task Status Indicator */}
			<Card className="border-l-4 border-l-blue-500">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							{taskState.status === 'idle' && <Target className="h-4 w-4 text-gray-500" />}
							{taskState.status === 'processing' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
							{taskState.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
							{taskState.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
							{taskState.status === 'abandoned' && <AlertTriangle className="h-4 w-4 text-orange-500" />}

							<span className="font-medium">
								{toolName} - {taskState.status.charAt(0).toUpperCase() + taskState.status.slice(1)}
							</span>

							{taskState.status === 'processing' && (
								<Badge variant="secondary">Task ID: {taskState.eventId?.slice(0, 8)}</Badge>
							)}
						</div>

						<div className="flex items-center space-x-2">
							{/* SC-011 Compliance Status */}
							<div className="flex items-center space-x-1">
								<Shield className={`h-4 w-4 ${
									complianceStatus.compliant ? 'text-green-500' : 'text-red-500'
								}`} />
								<span className="text-xs text-muted-foreground">
									{complianceStatus.complianceScore}/100
								</span>
							</div>

							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowMonitoring(!showMonitoring)}
							>
								<Activity className="h-4 w-4 mr-1" />
								Monitoring
							</Button>
						</div>
					</div>
				</CardHeader>

				{taskState.status === 'processing' && (
					<CardContent>
						<Progress value={taskState.progress} className="w-full" />
						{taskState.metadata?.stepsCompleted && taskState.metadata?.totalSteps && (
							<p className="text-xs text-muted-foreground mt-2">
								Step {taskState.metadata.stepsCompleted} of {taskState.metadata.totalSteps}
							</p>
						)}
					</CardContent>
				)}

				{taskState.status === 'failed' && taskState.errorMessage && (
					<CardContent>
						<Alert variant="destructive">
							<AlertTitle>Task Failed</AlertTitle>
							<AlertDescription>{taskState.errorMessage}</AlertDescription>
						</Alert>
					</CardContent>
				)}
			</Card>

			{/* Main Tool Content */}
			<div className="relative">
				{React.cloneElement(children as React.ReactElement, {
					onStartTask: startTaskMonitoring,
					onUpdateProgress: updateTaskProgress,
					onCompleteTask: completeTaskMonitoring,
					onFailTask: failTaskMonitoring,
					onCancelTask: cancelTask,
					taskStatus: taskState.status,
					abortSignal: abortControllerRef.current?.signal
				})}
			</div>

			{/* Satisfaction Survey */}
			{satisfactionSurvey.show && (
				<Card className="border-l-4 border-l-green-500">
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Users className="h-5 w-5" />
							<span>How was your experience?</span>
						</CardTitle>
						<CardDescription>
							Your feedback helps us improve {toolName}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label>Overall Satisfaction</Label>
								<div className="flex items-center space-x-2 mt-1">
									<Slider
										value={[satisfactionSurvey.overallSatisfaction]}
										onValueChange={(value) => setSatisfactionSurvey(prev => ({
											...prev,
											overallSatisfaction: value[0]
										}))}
										max={5}
										min={1}
										step={1}
										className="flex-1"
									/>
									<span className="text-sm w-8">{satisfactionSurvey.overallSatisfaction}</span>
								</div>
							</div>

							<div>
								<Label>Ease of Use</Label>
								<div className="flex items-center space-x-2 mt-1">
									<Slider
										value={[satisfactionSurvey.easeOfUse]}
										onValueChange={(value) => setSatisfactionSurvey(prev => ({
											...prev,
											easeOfUse: value[0]
										}))}
										max={5}
										min={1}
										step={1}
										className="flex-1"
									/>
									<span className="text-sm w-8">{satisfactionSurvey.easeOfUse}</span>
								</div>
							</div>

							<div>
								<Label>Met Expectations</Label>
								<div className="flex items-center space-x-2 mt-1">
									<Slider
										value={[satisfactionSurvey.metExpectations]}
										onValueChange={(value) => setSatisfactionSurvey(prev => ({
											...prev,
											metExpectations: value[0]
										}))}
										max={5}
										min={1}
										step={1}
										className="flex-1"
									/>
									<span className="text-sm w-8">{satisfactionSurvey.metExpectations}</span>
								</div>
							</div>

							<div>
								<Label>Would Recommend</Label>
								<div className="flex items-center space-x-2 mt-1">
									<Slider
										value={[satisfactionSurvey.wouldRecommend]}
										onValueChange={(value) => setSatisfactionSurvey(prev => ({
											...prev,
											wouldRecommend: value[0]
										}))}
										max={5}
										min={1}
										step={1}
										className="flex-1"
									/>
									<span className="text-sm w-8">{satisfactionSurvey.wouldRecommend}</span>
								</div>
							</div>
						</div>

						<div>
							<Label htmlFor="feedback">Additional Feedback (Optional)</Label>
							<Textarea
								id="feedback"
								placeholder="Tell us what could be improved..."
								value={satisfactionSurvey.feedback}
								onChange={(e) => setSatisfactionSurvey(prev => ({
									...prev,
									feedback: e.target.value
								}))}
								className="mt-1"
							/>
						</div>

						<div className="flex justify-end space-x-2">
							<Button
								variant="outline"
								onClick={() => setSatisfactionSurvey(prev => ({ ...prev, show: false }))}
							>
								Skip
							</Button>
							<Button onClick={submitSatisfactionSurvey}>
								Submit Feedback
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Enhanced Monitoring Dashboard */}
			{showMonitoring && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Brain className="h-5 w-5" />
							<span>Task Completion Monitoring</span>
						</CardTitle>
						<CardDescription>
							Real-time SC-011 compliance and performance monitoring
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="compliance" className="w-full">
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="compliance">Compliance</TabsTrigger>
								<TabsTrigger value="performance">Performance</TabsTrigger>
								<TabsTrigger value="experience">Experience</TabsTrigger>
								<TabsTrigger value="analytics">Analytics</TabsTrigger>
							</TabsList>

							<TabsContent value="compliance" className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{(dashboardData.taskCompletion.metrics.completionRate * 100).toFixed(1)}%
											</div>
											<p className="text-xs text-muted-foreground">
												Target: 90%
											</p>
											<div className={`mt-1 text-xs ${
												dashboardData.compliance.status.taskCompletionRate.currentValue >= 0.9
													? 'text-green-600'
													: 'text-red-600'
											}`}>
												{dashboardData.compliance.status.taskCompletionRate.currentValue >= 0.9 ? (
													<TrendingUp className="inline h-3 w-3 mr-1" />
												) : (
													<AlertTriangle className="inline h-3 w-3 mr-1" />
												)}
												{dashboardData.compliance.status.taskCompletionRate.compliant ? 'Compliant' : 'Non-Compliant'}
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Error Rate</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{(dashboardData.taskCompletion.metrics.failureRate * 100).toFixed(1)}%
											</div>
											<p className="text-xs text-muted-foreground">
												Target: <10%
											</p>
											<div className={`mt-1 text-xs ${
												dashboardData.compliance.status.errorRate.currentValue <= 0.1
													? 'text-green-600'
													: 'text-red-600'
											}`}>
												{dashboardData.compliance.status.errorRate.compliant ? '✓' : '⚠'}
												{dashboardData.compliance.status.errorRate.compliant ? 'Good' : 'High'}
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{dashboardData.userExperience.metrics.overallSatisfactionScore.toFixed(1)}/5.0
											</div>
											<p className="text-xs text-muted-foreground">
												Target: ≥3.5
											</p>
											<div className={`mt-1 text-xs ${
												dashboardData.userExperience.metrics.overallSatisfactionScore >= 3.5
													? 'text-green-600'
													: 'text-orange-600'
											}`}>
												{dashboardData.userExperience.metrics.overallSatisfactionScore >= 3.5 ? '😊' : '😐'}
												{dashboardData.userExperience.metrics.overallSatisfactionScore >= 3.5 ? 'Good' : 'Fair'}
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{dashboardData.compliance.status.complianceScore}/100
											</div>
											<p className="text-xs text-muted-foreground">
												SC-011 Standard
											</p>
											<div className={`mt-1 text-xs ${
												dashboardData.compliance.status.compliant
													? 'text-green-600'
													: 'text-red-600'
											}`}>
												{dashboardData.compliance.status.compliant ? '✓' : '⚠'}
												{dashboardData.compliance.status.compliant ? 'Compliant' : 'Attention'}
											</div>
										</CardContent>
									</Card>
								</div>

								{dashboardData.compliance.alerts.length > 0 && (
									<Alert>
										<AlertTriangle className="h-4 w-4" />
										<AlertTitle>Compliance Alerts</AlertTitle>
										<AlertDescription>
											{dashboardData.compliance.alerts.length} active compliance alert(s) require attention
										</AlertDescription>
									</Alert>
								)}
							</TabsContent>

							<TabsContent value="performance" className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{(dashboardData.taskCompletion.metrics.averageCompletionTime / 1000).toFixed(1)}s
											</div>
											<p className="text-xs text-muted-foreground">
												P95: {(dashboardData.taskCompletion.metrics.p95CompletionTime / 1000).toFixed(1)}s
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Processing Distribution</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-1">
												<div className="flex justify-between text-xs">
													<span>Fast</span>
													<span>{(dashboardData.taskCompletion.metrics.processingTimeDistribution.fast * 100).toFixed(1)}%</span>
												</div>
												<div className="flex justify-between text-xs">
													<span>Normal</span>
													<span>{(dashboardData.taskCompletion.metrics.processingTimeDistribution.normal * 100).toFixed(1)}%</span>
												</div>
												<div className="flex justify-between text-xs">
													<span>Slow</span>
													<span className="text-orange-600">
														{(dashboardData.taskCompletion.metrics.processingTimeDistribution.slow * 100).toFixed(1)}%
													</span>
												</div>
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Performance Score</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{dashboardData.performance.metrics.getPerformanceScore?.() || 0}/100
											</div>
											<p className="text-xs text-muted-foreground">
												Based on Core Web Vitals
											</p>
										</CardContent>
									</Card>
								</div>
							</TabsContent>

							<TabsContent value="experience" className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Retry Rate</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{(dashboardData.userExperience.metrics.retryRate * 100).toFixed(1)}%
											</div>
											<p className="text-xs text-muted-foreground">
												Users who retry tasks
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Abandonment Rate</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{(dashboardData.userExperience.metrics.abandonmentRate * 100).toFixed(1)}%
											</div>
											<p className="text-xs text-muted-foreground">
												Tasks not completed
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{(dashboardData.userExperience.metrics.errorRecoveryRate * 100).toFixed(1)}%
											</div>
											<p className="text-xs text-muted-foreground">
												Successful error recovery
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Feature Adoption</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{(dashboardData.userExperience.metrics.featureAdoptionRate * 100).toFixed(1)}%
											</div>
											<p className="text-xs text-muted-foreground">
												Features used by users
											</p>
										</CardContent>
									</Card>
								</div>

								{dashboardData.userExperience.metrics.commonAbandonmentPoints.length > 0 && (
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Common Drop-off Points</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-2">
												{dashboardData.userExperience.metrics.commonAbandonmentPoints.slice(0, 3).map((point, index) => (
													<div key={index} className="flex justify-between items-center">
														<span className="text-sm">{point.point}</span>
														<Badge variant="outline">{point.percentage.toFixed(1)}%</Badge>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}
							</TabsContent>

							<TabsContent value="analytics" className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{dashboardData.analytics.metrics.totalSessions}
											</div>
											<p className="text-xs text-muted-foreground">
												Last 24 hours
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Page Views</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{dashboardData.analytics.metrics.totalPageViews}
											</div>
											<p className="text-xs text-muted-foreground">
												Total interactions
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{(dashboardData.analytics.metrics.averageSessionDuration / 1000 / 60).toFixed(1)}m
											</div>
											<p className="text-xs text-muted-foreground">
												Minutes per session
											</p>
										</CardContent>
									</Card>
								</div>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">Most Used Tools</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											{dashboardData.analytics.metrics.mostUsedTools.slice(0, 5).map((tool, index) => (
												<div key={index} className="flex justify-between items-center">
													<span className="text-sm">{tool.toolId}</span>
													<div className="flex items-center space-x-2">
														<span className="text-xs text-muted-foreground">
															{tool.usage} uses
														</span>
														<span className="text-xs text-muted-foreground">
															{(tool.completionRate * 100).toFixed(1)}% success
														</span>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

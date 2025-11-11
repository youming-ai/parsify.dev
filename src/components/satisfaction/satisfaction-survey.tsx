/**
 * Satisfaction Survey Component
 * Implements comprehensive user satisfaction collection for SC-006 compliance
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	Star,
	ThumbsUp,
	ThumbsDown,
	MessageSquare,
	X,
	Send,
	ArrowRight,
	ArrowLeft,
	CheckCircle,
	AlertTriangle,
	Info,
	User,
	Zap,
	Shield,
	TrendingUp
} from 'lucide-react';
import type {
	SatisfactionSurvey,
	SatisfactionSurveyResponse,
	DetailedFeedback,
	SatisfactionContext,
	SatisfactionScore,
	TaskComplexity,
	UserType
} from '@/types/satisfaction';

interface SatisfactionSurveyProps {
	toolId: string;
	toolName: string;
	toolCategory: string;
	sessionId: string;
	userId?: string;
	taskId?: string;
	onSurveyCompleted?: (survey: SatisfactionSurvey) => void;
	onSurveySkipped?: (reason: string) => void;
	trigger: 'manual' | 'auto' | 'scheduled';
	showDelay?: number;
	compact?: boolean;
}

interface SurveyStep {
	id: string;
	title: string;
	description: string;
	component: React.ComponentType<any>;
	validation?: (data: any) => boolean;
	skip?: boolean;
}

interface StarRatingProps {
	value: SatisfactionScore;
	onChange: (value: SatisfactionScore) => void;
	label: string;
	description?: string;
	required?: boolean;
}

function StarRating({ value, onChange, label, description, required = false }: StarRatingProps) {
	const [hoverValue, setHoverValue] = useState<number>(0);

	const getStarColor = (rating: number) => {
		if (rating <= (hoverValue || value)) {
			return rating <= 2 ? 'text-red-400 fill-red-400' :
			       rating <= 3 ? 'text-yellow-400 fill-yellow-400' :
			       'text-green-400 fill-green-400';
		}
		return 'text-gray-300';
	};

	const getRatingLabel = (rating: number) => {
		switch (rating) {
			case 1: return 'Very Poor';
			case 2: return 'Poor';
			case 3: return 'Average';
			case 4: return 'Good';
			case 5: return 'Excellent';
			default: return '';
		}
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label className="text-sm font-medium">
					{label}
					{required && <span className="text-red-500 ml-1">*</span>}
				</Label>
				{value > 0 && (
					<span className="text-sm text-muted-foreground">
						{getRatingLabel(value)}
					</span>
				)}
			</div>

			{description && (
				<p className="text-xs text-muted-foreground mb-2">{description}</p>
			)}

			<div className="flex items-center space-x-2">
				<div className="flex space-x-1">
					{[1, 2, 3, 4, 5].map((rating) => (
						<TooltipProvider key={rating}>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className={`transition-colors ${getStarColor(rating)}`}
										onClick={() => onChange(rating as SatisfactionScore)}
										onMouseEnter={() => setHoverValue(rating)}
										onMouseLeave={() => setHoverValue(0)}
									>
										<Star className="h-6 w-6" fill="currentColor" />
									</button>
								</TooltipTrigger>
								<TooltipContent>
									<p>{getRatingLabel(rating)}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					))}
				</div>

				{value > 0 && (
					<Badge variant="outline" className="text-xs">
						{value}/5
					</Badge>
				)}
			</div>
		</div>
	);
}

function StepOverallSatisfaction({ data, onChange, validation }) {
	return (
		<div className="space-y-6">
			<div className="text-center space-y-2">
				<h3 className="text-lg font-semibold">How satisfied are you overall?</h3>
				<p className="text-sm text-muted-foreground">
					Your overall satisfaction with {data.toolName}
				</p>
			</div>

			<div className="flex justify-center">
				<StarRating
					value={data.responses.overallSatisfaction}
					onChange={(value) => onChange('overallSatisfaction', value)}
					label=""
					required
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<StarRating
					value={data.responses.easeOfUse}
					onChange={(value) => onChange('easeOfUse', value)}
					label="Ease of Use"
					description="How easy was it to use this tool?"
					required
				/>

				<StarRating
					value={data.responses.performance}
					onChange={(value) => onChange('performance', value)}
					label="Performance"
					description="How well did the tool perform?"
					required
				/>
			</div>
		</div>
	);
}

function StepFeatureFeedback({ data, onChange, validation }) {
	return (
		<div className="space-y-6">
			<div className="text-center space-y-2">
				<h3 className="text-lg font-semibold">Feature Assessment</h3>
				<p className="text-sm text-muted-foreground">
					Help us understand your experience with specific features
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<StarRating
					value={data.responses.featureCompleteness}
					onChange={(value) => onChange('featureCompleteness', value)}
					label="Feature Completeness"
					description="Did the tool have all the features you needed?"
				/>

				<StarRating
					value={data.responses.reliability}
					onChange={(value) => onChange('reliability', value)}
					label="Reliability"
					description="How reliable was the tool during your task?"
				/>
			</div>

			<div className="space-y-4">
				<Label>Which features did you use?</Label>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{data.availableFeatures?.map((feature: string) => (
						<div key={feature} className="flex items-center space-x-2">
							<Checkbox
								id={feature}
								checked={data.responses.featuresUsed.includes(feature)}
								onCheckedChange={(checked) => {
									const features = checked
										? [...data.responses.featuresUsed, feature]
										: data.responses.featuresUsed.filter(f => f !== feature);
									onChange('featuresUsed', features);
								}}
							/>
							<Label htmlFor={feature} className="text-sm">
								{feature}
							</Label>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function StepGoalAchievement({ data, onChange, validation }) {
	return (
		<div className="space-y-6">
			<div className="text-center space-y-2">
				<h3 className="text-lg font-semibold">Goal Achievement</h3>
				<p className="text-sm text-muted-foreground">
					Did you achieve what you set out to do?
				</p>
			</div>

			<div className="space-y-4">
				<RadioGroup
					value={data.responses.achievedGoal.toString()}
					onValueChange={(value) => onChange('achievedGoal', value === 'true')}
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="true" id="achieved" />
						<Label htmlFor="achieved">Yes, I achieved my goal</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="false" id="not-achieved" />
						<Label htmlFor="not-achieved">No, I couldn't achieve my goal</Label>
					</div>
				</RadioGroup>

				<StarRating
					value={data.responses.metExpectations}
					onChange={(value) => onChange('metExpectations', value)}
					label="Met Expectations"
					description="Did the tool meet your expectations?"
					required
				/>

				<StarRating
					value={data.responses.wouldRecommend}
					onChange={(value) => onChange('wouldRecommend', value)}
					label="Would Recommend"
					description="Would you recommend this tool to others?"
					required
				/>
			</div>

			<div className="space-y-3">
				<Label>Task Complexity</Label>
				<RadioGroup
					value={data.responses.difficultyRating}
					onValueChange={(value) => onChange('difficultyRating', value)}
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="simple" id="simple" />
						<Label htmlFor="simple">Simple task</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="medium" id="medium" />
						<Label htmlFor="medium">Moderately complex</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="complex" id="complex" />
						<Label htmlFor="complex">Very complex</Label>
					</div>
				</RadioGroup>
			</div>

			<div className="flex items-center space-x-2">
				<Checkbox
					id="technical-issues"
					checked={data.responses.technicalIssues}
					onCheckedChange={(checked) => onChange('technicalIssues', checked)}
				/>
				<Label htmlFor="technical-issues">
					I encountered technical issues
				</Label>
			</div>
		</div>
	);
}

function StepDetailedFeedback({ data, onChange, validation }) {
	return (
		<div className="space-y-6">
			<div className="text-center space-y-2">
				<h3 className="text-lg font-semibold">Additional Feedback</h3>
				<p className="text-sm text-muted-foreground">
					Share your thoughts to help us improve (optional)
				</p>
			</div>

			<div className="space-y-4">
				<div>
					<Label htmlFor="what-went-well">What went well?</Label>
					<Textarea
						id="what-went-well"
						placeholder="Tell us what you liked about the experience..."
						value={data.feedback?.whatWentWell || ''}
						onChange={(e) => onChange('whatWentWell', e.target.value)}
						className="min-h-[80px]"
					/>
				</div>

				<div>
					<Label htmlFor="what-could-be-better">What could be improved?</Label>
					<Textarea
						id="what-could-be-better"
						placeholder="What would make this tool better for you?"
						value={data.feedback?.whatCouldBeBetter || ''}
						onChange={(e) => onChange('whatCouldBeBetter', e.target.value)}
						className="min-h-[80px]"
					/>
				</div>

				{data.responses.technicalIssues && (
					<div>
						<Label htmlFor="technical-issues-detail">Technical Issues</Label>
						<Textarea
							id="technical-issues-detail"
							placeholder="Please describe the technical issues you encountered..."
							value={data.feedback?.technicalIssues || ''}
							onChange={(e) => onChange('technicalIssues', e.target.value)}
							className="min-h-[80px]"
						/>
					</div>
				)}

				<div>
					<Label htmlFor="suggestions">Suggestions</Label>
					<Textarea
						id="suggestions"
						placeholder="Any suggestions for new features or improvements?"
						value={data.feedback?.suggestions || ''}
						onChange={(e) => onChange('suggestions', e.target.value)}
						className="min-h-[80px]"
					/>
				</div>
			</div>
		</div>
	);
}

export function SatisfactionSurvey({
	toolId,
	toolName,
	toolCategory,
	sessionId,
	userId,
	taskId,
	onSurveyCompleted,
	onSurveySkipped,
	trigger = 'auto',
	showDelay = 1000,
	compact = false
}: SatisfactionSurveyProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [surveyData, setSurveyData] = useState<SatisfactionSurvey>({
		id: `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		toolId,
		toolName,
		toolCategory,
		sessionId,
		userId,
		timestamp: new Date(),
		taskId,
		responses: {
			overallSatisfaction: 4,
			easeOfUse: 4,
			featureCompleteness: 4,
			performance: 4,
			reliability: 4,
			achievedGoal: true,
			metExpectations: 4,
			wouldRecommend: 4,
			technicalIssues: false,
			featuresUsed: [],
			difficultyRating: 'medium'
		},
		context: {
			taskComplexity: 'medium',
			deviceType: 'desktop',
			browserType: navigator.userAgent.includes('Chrome') ? 'chrome' : 'other',
			timeOfDay: new Date().toLocaleTimeString(),
			sessionDuration: 0,
			previousUsageCount: 0,
			isFirstTimeUser: false,
			userType: 'intermediate',
			toolVersion: '1.0.0',
			interfaceLanguage: navigator.language || 'en'
		},
		timeToComplete: 0,
		surveyVersion: '1.0.0'
	});

	const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
	const startTimeRef = useRef<Date>(new Date());
	const timeoutRef = useRef<NodeJS.Timeout>();

	const steps: SurveyStep[] = [
		{
			id: 'overall',
			title: 'Overall Satisfaction',
			description: 'Rate your overall experience',
			component: StepOverallSatisfaction,
			validation: (data) => data.responses.overallSatisfaction > 0
		},
		{
			id: 'features',
			title: 'Feature Feedback',
			description: 'Tell us about specific features',
			component: StepFeatureFeedback,
			validation: (data) => true
		},
		{
			id: 'goals',
			title: 'Goal Achievement',
			description: 'Did you achieve your goals?',
			component: StepGoalAchievement,
			validation: (data) => data.responses.metExpectations > 0
		},
		{
			id: 'feedback',
			title: 'Additional Feedback',
			description: 'Share detailed feedback',
			component: StepDetailedFeedback,
			validation: (data) => true,
			skip: compact
		}
	].filter(step => !step.skip);

	// Load available features for the tool
	useEffect(() => {
		// In a real implementation, this would fetch the tool's features
		const features = [
			'Format & Validation',
			'Error Detection',
			'Custom Settings',
			'Export Options',
			'Real-time Preview',
			'Batch Processing'
		];
		setAvailableFeatures(features);
	}, [toolId]);

	// Auto-show survey based on trigger
	useEffect(() => {
		if (trigger === 'auto' && !isOpen) {
			timeoutRef.current = setTimeout(() => {
				setIsOpen(true);
			}, showDelay);
		}

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [trigger, showDelay, isOpen]);

	const updateSurveyData = useCallback((field: string, value: any) => {
		if (field.startsWith('feedback.')) {
			const feedbackField = field.replace('feedback.', '');
			setSurveyData(prev => ({
				...prev,
				feedback: {
					...prev.feedback,
					[feedbackField]: value
				}
			}));
		} else if (field.startsWith('context.')) {
			const contextField = field.replace('context.', '');
			setSurveyData(prev => ({
				...prev,
				context: {
					...prev.context,
					[contextField]: value
				}
			}));
		} else {
			setSurveyData(prev => ({
				...prev,
				responses: {
					...prev.responses,
					[field]: value
				}
			}));
		}
	}, []);

	const validateCurrentStep = useCallback(() => {
		const step = steps[currentStep];
		if (!step.validation) return true;
		return step.validation(surveyData);
	}, [currentStep, steps, surveyData]);

	const canProceed = useCallback(() => {
		return validateCurrentStep();
	}, [validateCurrentStep]);

	const goToNextStep = useCallback(() => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	}, [currentStep, steps.length]);

	const goToPreviousStep = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	}, [currentStep]);

	const submitSurvey = useCallback(() => {
		const completedSurvey: SatisfactionSurvey = {
			...surveyData,
			completedAt: new Date(),
			timeToComplete: new Date().getTime() - startTimeRef.current.getTime()
		};

		onSurveyCompleted?.(completedSurvey);
		setIsOpen(false);
	}, [surveyData, onSurveyCompleted]);

	const skipSurvey = useCallback((reason: string = 'user_skipped') => {
		onSurveySkipped?.(reason);
		setIsOpen(false);
	}, [onSurveySkipped]);

	const CurrentStepComponent = steps[currentStep]?.component;

	if (!isOpen && trigger === 'manual') {
		return (
			<Button
				onClick={() => setIsOpen(true)}
				variant="outline"
				size="sm"
				className="gap-2"
			>
				<MessageSquare className="h-4 w-4" />
				Share Feedback
			</Button>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<DialogTitle className="flex items-center gap-2">
								<Star className="h-5 w-5 text-yellow-400" />
								Help Us Improve
							</DialogTitle>
							<DialogDescription>
								Your feedback helps us make {toolName} better for everyone
							</DialogDescription>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => skipSurvey('user_closed')}
							className="h-8 w-8 p-0"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</DialogHeader>

				{/* Progress indicator */}
				<div className="space-y-2">
					<div className="flex justify-between text-sm text-muted-foreground">
						<span>Step {currentStep + 1} of {steps.length}</span>
						<span>{steps[currentStep]?.title}</span>
					</div>
					<Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
				</div>

				{/* Current step content */}
				<div className="py-6">
					{CurrentStepComponent && (
						<CurrentStepComponent
							data={{ ...surveyData, availableFeatures }}
							onChange={updateSurveyData}
							validation={validateCurrentStep}
						/>
					)}
				</div>

				{/* Navigation buttons */}
				<DialogFooter className="flex justify-between">
					<div className="flex gap-2">
						{currentStep > 0 && (
							<Button
								variant="outline"
								onClick={goToPreviousStep}
								className="gap-2"
							>
								<ArrowLeft className="h-4 w-4" />
								Previous
							</Button>
						)}
					</div>

					<div className="flex gap-2">
						<Button
							variant="ghost"
							onClick={() => skipSurvey('user_skipped')}
							className="gap-2"
						>
							Skip Survey
						</Button>

						{currentStep < steps.length - 1 ? (
							<Button
								onClick={goToNextStep}
								disabled={!canProceed()}
								className="gap-2"
							>
								Next
								<ArrowRight className="h-4 w-4" />
							</Button>
						) : (
							<Button
								onClick={submitSurvey}
								disabled={!canProceed()}
								className="gap-2"
							>
								<Send className="h-4 w-4" />
								Submit Feedback
							</Button>
						)}
					</div>
				</DialogFooter>

				{/* SC-006 compliance indicator */}
				<div className="mt-4 pt-4 border-t">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center gap-2">
							<Shield className="h-3 w-3" />
							<span>SC-006 Compliance</span>
						</div>
						<div className="flex items-center gap-1">
							<Info className="h-3 w-3" />
							<span>Your feedback helps us maintain 4.5+ satisfaction scores</span>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// Compact survey component for in-place feedback
export function CompactSatisfactionSurvey({
	toolId,
	toolName,
	onSurveyCompleted
}: {
	toolId: string;
	toolName: string;
	onSurveyCompleted?: (score: SatisfactionScore) => void;
}) {
	const [showRating, setShowRating] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const handleRating = useCallback((score: SatisfactionScore) => {
		onSurveyCompleted?.(score);
		setSubmitted(true);
		setTimeout(() => setShowRating(false), 2000);
	}, [onSurveyCompleted]);

	if (submitted) {
		return (
			<div className="flex items-center gap-2 text-green-600 text-sm">
				<CheckCircle className="h-4 w-4" />
				Thank you for your feedback!
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			{!showRating ? (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowRating(true)}
					className="text-xs text-muted-foreground hover:text-foreground gap-1"
				>
					How was your experience?
					<Star className="h-3 w-3" />
				</Button>
			) : (
				<div className="flex items-center gap-1">
					<span className="text-xs text-muted-foreground mr-2">Rate:</span>
					{[1, 2, 3, 4, 5].map((rating) => (
						<button
							key={rating}
							onClick={() => handleRating(rating as SatisfactionScore)}
							className={`transition-colors ${
								rating <= 2 ? 'text-red-400 hover:text-red-500' :
								rating <= 3 ? 'text-yellow-400 hover:text-yellow-500' :
								'text-green-400 hover:text-green-500'
							}`}
						>
							<Star className="h-4 w-4" fill="currentColor" />
						</button>
					))}
				</div>
			)}
		</div>
	);
}

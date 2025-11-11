'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
	ChevronLeft,
	ChevronRight,
	CheckCircle,
	Lock,
	Clock,
	BookOpen,
	Lightbulb,
	AlertTriangle,
	Play,
	ExternalLink
} from 'lucide-react';
import type { Tutorial, TutorialStep, CodeExample } from '@/types/tools';
import { cn } from '@/lib/utils';

interface TutorialViewerProps {
	tutorial: Tutorial;
	onStepComplete?: (stepId: string) => void;
	onToolLaunch?: (toolId: string, config?: any) => void;
	className?: string;
}

export function TutorialViewer({
	tutorial,
	onStepComplete,
	onToolLaunch,
	className
}: TutorialViewerProps) {
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

	const currentStep = tutorial.steps[currentStepIndex];
	const progress = (completedSteps.size / tutorial.steps.length) * 100;

	const handleStepComplete = () => {
		if (currentStep) {
			const newCompletedSteps = new Set(completedSteps);
			newCompletedSteps.add(currentStep.id);
			setCompletedSteps(newCompletedSteps);
			onStepComplete?.(currentStep.id);
		}
	};

	const handleNextStep = () => {
		if (currentStepIndex < tutorial.steps.length - 1) {
			setCurrentStepIndex(currentStepIndex + 1);
		}
	};

	const handlePreviousStep = () => {
		if (currentStepIndex > 0) {
			setCurrentStepIndex(currentStepIndex - 1);
		}
	};

	const handleToolLaunch = (toolId: string, config?: any) => {
		onToolLaunch?.(toolId, config);
	};

	const isStepCompleted = (stepId: string) => completedSteps.has(stepId);

	const renderCodeExample = (codeExample: CodeExample) => (
		<div key={codeExample.id} className="space-y-2">
			<div className="flex items-center justify-between">
				<Badge variant="outline" className="text-xs">
					{codeExample.language}
				</Badge>
				{codeExample.runnable && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleToolLaunch('code-executor', {
							language: codeExample.language,
							code: codeExample.code
						})}
						className="h-6 px-2"
					>
						<Play className="h-3 w-3" />
						Run
					</Button>
				)}
			</div>
			<div className="rounded-md bg-muted p-3">
				<pre className="text-sm overflow-x-auto">
					<code>{codeExample.code}</code>
				</pre>
			</div>
			{codeExample.explanation && (
				<p className="text-sm text-muted-foreground">{codeExample.explanation}</p>
			)}
			{codeExample.output && (
				<div className="rounded-md bg-green-50 p-3 dark:bg-green-950">
					<p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Output:</p>
					<pre className="text-sm text-green-700 dark:text-green-300">
						{codeExample.output}
					</pre>
				</div>
			)}
		</div>
	);

	const renderTutorialStep = (step: TutorialStep, index: number) => {
		const isCompleted = isStepCompleted(step.id);
		const isCurrent = index === currentStepIndex;

		return (
			<Card
				key={step.id}
				className={cn(
					"transition-all duration-200",
					isCurrent ? "ring-2 ring-primary" : "opacity-75",
					isCompleted && "border-green-200 dark:border-green-800"
				)}
			>
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-1 flex-1">
							<CardTitle className="text-lg flex items-center gap-2">
								<span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
									{index + 1}
								</span>
								{step.title}
								{isCompleted && (
									<CheckCircle className="h-4 w-4 text-green-600" />
								)}
								{!isCurrent && !isCompleted && index > currentStepIndex && (
									<Lock className="h-4 w-4 text-muted-foreground" />
								)}
							</CardTitle>
							<p className="text-sm text-muted-foreground">{step.description}</p>
						</div>
					</div>
				</CardHeader>

				{isCurrent && (
					<CardContent className="space-y-4">
						<div className="prose prose-sm max-w-none dark:prose-invert">
							{step.content}
						</div>

						{step.code && step.code.length > 0 && (
							<div className="space-y-3">
								<h4 className="font-medium text-sm">Code Examples</h4>
								{step.code.map(renderCodeExample)}
							</div>
						)}

						{step.toolId && (
							<Alert>
								<ExternalLink className="h-4 w-4" />
								<AlertDescription className="flex items-center justify-between">
									<span>This step uses the {step.toolId} tool.</span>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleToolLaunch(step.toolId, step.toolConfig)}
									>
										Open Tool
									</Button>
								</AlertDescription>
							</Alert>
						)}

						{step.tips && step.tips.length > 0 && (
							<div className="space-y-2">
								<h4 className="font-medium text-sm flex items-center gap-2">
									<Lightbulb className="h-4 w-4 text-yellow-600" />
									Tips
								</h4>
								<ul className="space-y-1">
									{step.tips.map((tip, tipIndex) => (
										<li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
											<span className="text-yellow-600">•</span>
											{tip}
										</li>
									))}
								</ul>
							</div>
						)}

						{step.warnings && step.warnings.length > 0 && (
							<div className="space-y-2">
								<h4 className="font-medium text-sm flex items-center gap-2">
									<AlertTriangle className="h-4 w-4 text-red-600" />
									Warnings
								</h4>
								<ul className="space-y-1">
									{step.warnings.map((warning, warningIndex) => (
										<li key={warningIndex} className="text-sm text-muted-foreground flex items-start gap-2">
											<span className="text-red-600">•</span>
											{warning}
										</li>
									))}
								</ul>
							</div>
						)}

						{step.expectedOutput && (
							<div className="space-y-2">
								<h4 className="font-medium text-sm">Expected Output</h4>
								<div className="rounded-md bg-green-50 p-3 dark:bg-green-950">
									<pre className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
										{step.expectedOutput}
									</pre>
								</div>
							</div>
						)}

						{step.completionCriteria && (
							<div className="space-y-2">
								<h4 className="font-medium text-sm">Completion Criteria</h4>
								<p className="text-sm text-muted-foreground">{step.completionCriteria}</p>
							</div>
						)}
					</CardContent>
				)}
			</Card>
		);
	};

	return (
		<div className={cn('space-y-6', className)}>
			{/* Tutorial Header */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-2">
							<CardTitle className="text-2xl">{tutorial.title}</CardTitle>
							<p className="text-muted-foreground">{tutorial.description}</p>
							<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
								<div className="flex items-center gap-1">
									<Badge variant={
										tutorial.difficulty === 'beginner' ? 'secondary' :
										tutorial.difficulty === 'intermediate' ? 'default' :
										'destructive'
									}>
										{tutorial.difficulty}
									</Badge>
								</div>
								<div className="flex items-center gap-1">
									<Clock className="h-4 w-4" />
									{tutorial.estimatedTime} minutes
								</div>
								<div className="flex items-center gap-1">
									<BookOpen className="h-4 w-4" />
									{tutorial.steps.length} steps
								</div>
							</div>
						</div>
					</div>

					{/* Progress Bar */}
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>Progress</span>
							<span>{completedSteps.size}/{tutorial.steps.length} completed</span>
						</div>
						<Progress value={progress} className="h-2" />
					</div>

					{/* Prerequisites */}
					{tutorial.prerequisites.length > 0 && (
						<div className="space-y-2">
							<h4 className="font-medium text-sm">Prerequisites</h4>
							<ul className="flex flex-wrap gap-2">
								{tutorial.prerequisites.map((prereq, index) => (
									<li key={index}>
										<Badge variant="outline" className="text-xs">
											{prereq}
										</Badge>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Tools Used */}
					{tutorial.tools.length > 0 && (
						<div className="space-y-2">
							<h4 className="font-medium text-sm">Tools You'll Use</h4>
							<div className="flex flex-wrap gap-2">
								{tutorial.tools.map((tool) => (
									<Button
										key={tool}
										variant="outline"
										size="sm"
										onClick={() => handleToolLaunch(tool)}
										className="h-8"
									>
										{tool}
									</Button>
								))}
							</div>
						</div>
					)}
				</CardHeader>
			</Card>

			{/* Tutorial Steps */}
			<div className="space-y-4">
				{tutorial.steps.map((step, index) => renderTutorialStep(step, index))}
			</div>

			{/* Navigation */}
			{currentStep && (
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<Button
								variant="outline"
								onClick={handlePreviousStep}
								disabled={currentStepIndex === 0}
							>
								<ChevronLeft className="h-4 w-4" />
								Previous
							</Button>

							<div className="flex items-center gap-2">
								{!isStepCompleted(currentStep.id) && (
									<Button onClick={handleStepComplete}>
										<CheckCircle className="h-4 w-4" />
										Mark Complete
									</Button>
								)}
								{isStepCompleted(currentStep.id) && currentStepIndex < tutorial.steps.length - 1 && (
									<Button onClick={handleNextStep}>
										Next Step
										<ChevronRight className="h-4 w-4" />
									</Button>
								)}
							</div>

							<Button
								variant="outline"
								onClick={handleNextStep}
								disabled={currentStepIndex === tutorial.steps.length - 1}
							>
								Next
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// Tutorial list component
interface TutorialListProps {
	tutorials: Tutorial[];
	onTutorialSelect?: (tutorial: Tutorial) => void;
	className?: string;
}

export function TutorialList({ tutorials, onTutorialSelect, className }: TutorialListProps) {
	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	return (
		<div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
			{tutorials.map(tutorial => (
				<Card
					key={tutorial.id}
					className="cursor-pointer hover:shadow-md transition-shadow"
					onClick={() => onTutorialSelect?.(tutorial)}
				>
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between gap-2">
							<CardTitle className="text-lg line-clamp-2">{tutorial.title}</CardTitle>
							<Badge className={cn('text-xs', getDifficultyColor(tutorial.difficulty))}>
								{tutorial.difficulty}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground line-clamp-2">
							{tutorial.description}
						</p>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<Clock className="h-4 w-4" />
								{tutorial.estimatedTime}m
							</div>
							<div className="flex items-center gap-1">
								<BookOpen className="h-4 w-4" />
								{tutorial.steps.length} steps
							</div>
						</div>
						<div className="flex flex-wrap gap-1">
							{tutorial.tags.slice(0, 3).map(tag => (
								<Badge key={tag} variant="outline" className="text-xs">
									{tag}
								</Badge>
							))}
							{tutorial.tags.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{tutorial.tags.length - 3} more
								</Badge>
							)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

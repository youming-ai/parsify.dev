'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Play,
	Clock,
	Zap,
	ArrowRight,
	CheckCircle,
	ExternalLink,
	Lightbulb,
	Info
} from 'lucide-react';
import type { WorkflowExample, WorkflowStep } from '@/types/tools';
import { cn } from '@/lib/utils';

interface WorkflowDisplayProps {
	workflow: WorkflowExample;
	onStepExecute?: (step: WorkflowStep) => void;
	onToolLaunch?: (toolId: string, config?: any) => void;
	className?: string;
}

export function WorkflowDisplay({
	workflow,
	onStepExecute,
	onToolLaunch,
	className
}: WorkflowDisplayProps) {
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
	const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

	const currentStep = workflow.steps[currentStepIndex] || workflow.tools[currentStepIndex];
	const progress = (completedSteps.size / workflow.steps.length) * 100;

	const handleStepExecute = (stepIndex: number) => {
		const step = workflow.steps[stepIndex] || workflow.tools[stepIndex];
		if (step) {
			onStepExecute?.(step as WorkflowStep);
			const newCompletedSteps = new Set(completedSteps);
			newCompletedSteps.add(stepIndex);
			setCompletedSteps(newCompletedSteps);
		}
	};

	const handleNextStep = () => {
		if (currentStepIndex < workflow.steps.length - 1) {
			setCurrentStepIndex(currentStepIndex + 1);
		}
	};

	const handlePreviousStep = () => {
		if (currentStepIndex > 0) {
			setCurrentStepIndex(currentStepIndex - 1);
		}
	};

	const toggleStepExpansion = (stepIndex: number) => {
		const newExpanded = new Set(expandedSteps);
		if (newExpanded.has(stepIndex)) {
			newExpanded.delete(stepIndex);
		} else {
			newExpanded.add(stepIndex);
		}
		setExpandedSteps(newExpanded);
	};

	const renderWorkflowStep = (step: WorkflowStep, index: number) => {
		const isCompleted = completedSteps.has(index);
		const isCurrent = index === currentStepIndex;
		const isExpanded = expandedSteps.has(index);

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
						<div className="space-y-2 flex-1">
							<div className="flex items-center gap-3">
								<div className={cn(
									"flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
									isCompleted ? "bg-green-600 text-white" :
									isCurrent ? "bg-primary text-primary-foreground" :
									"bg-muted text-muted-foreground"
								)}>
									{isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
								</div>
								<div className="flex-1">
									<h4 className="font-semibold">{step.title || step.toolName}</h4>
									<p className="text-sm text-muted-foreground">{step.description}</p>
								</div>
							</div>
							<div className="flex items-center gap-2 ml-11">
								<Badge variant="outline" className="text-xs">
									{step.toolId}
								</Badge>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => toggleStepExpansion(index)}
									className="h-6 px-2"
								>
									{isExpanded ? 'Show Less' : 'Show More'}
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>

				{(isExpanded || isCurrent) && (
					<CardContent className="pt-0 space-y-4">
						<Tabs defaultValue="input" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="input">Input</TabsTrigger>
								<TabsTrigger value="output">Output</TabsTrigger>
								<TabsTrigger value="config">Configuration</TabsTrigger>
							</TabsList>

							<TabsContent value="input" className="space-y-2">
								<h5 className="text-sm font-medium">Input Data</h5>
								<div className="rounded-md bg-muted p-3">
									<pre className="text-sm overflow-x-auto whitespace-pre-wrap">
										{typeof step.input === 'string'
											? step.input
											: JSON.stringify(step.input, null, 2)
										}
									</pre>
								</div>
							</TabsContent>

							<TabsContent value="output" className="space-y-2">
								<h5 className="text-sm font-medium">Expected Output</h5>
								<div className="rounded-md bg-green-50 p-3 dark:bg-green-950">
									<pre className="text-sm overflow-x-auto whitespace-pre-wrap text-green-800 dark:text-green-200">
										{typeof step.expectedOutput === 'string'
											? step.expectedOutput
											: JSON.stringify(step.expectedOutput, null, 2)
										}
									</pre>
								</div>
							</TabsContent>

							<TabsContent value="config" className="space-y-2">
								<h5 className="text-sm font-medium">Configuration</h5>
								{step.config && Object.keys(step.config).length > 0 ? (
									<div className="rounded-md bg-muted p-3">
										<pre className="text-sm overflow-x-auto">
											{JSON.stringify(step.config, null, 2)}
										</pre>
									</div>
								) : (
									<p className="text-sm text-muted-foreground">No special configuration required</p>
								)}
							</TabsContent>
						</Tabs>

						{step.notes && (
							<Alert>
								<Info className="h-4 w-4" />
								<AlertDescription>{step.notes}</AlertDescription>
							</Alert>
						)}

						{step.alternatives && step.alternatives.length > 0 && (
							<div className="space-y-2">
								<h5 className="text-sm font-medium flex items-center gap-2">
									<Lightbulb className="h-4 w-4 text-yellow-600" />
									Alternative Tools
								</h5>
								<div className="flex flex-wrap gap-2">
									{step.alternatives.map(alt => (
										<Button
											key={alt}
											variant="outline"
											size="sm"
											onClick={() => onToolLaunch?.(alt)}
										>
											{alt}
										</Button>
									))}
								</div>
							</div>
						)}

						<div className="flex gap-2 pt-2 border-t">
							<Button
								onClick={() => handleStepExecute(index)}
								disabled={isCompleted}
								className="flex-1"
							>
								{isCompleted ? (
									<>
										<CheckCircle className="h-4 w-4" />
										Completed
									</>
								) : (
									<>
										<Play className="h-4 w-4" />
										Execute Step
									</>
								)}
							</Button>
							<Button
								variant="outline"
								onClick={() => onToolLaunch?.(step.toolId, step.config)}
							>
								<ExternalLink className="h-4 w-4" />
								Open Tool
							</Button>
						</div>
					</CardContent>
				)}

				{index < workflow.steps.length - 1 && (
					<div className="flex justify-center py-2">
						<ArrowRight className="h-4 w-4 text-muted-foreground" />
					</div>
				)}
			</Card>
		);
	};

	return (
		<div className={cn('space-y-6', className)}>
			{/* Workflow Header */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-2">
							<CardTitle className="text-2xl">{workflow.title}</CardTitle>
							<p className="text-muted-foreground">{workflow.description}</p>
							<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
								<div className="flex items-center gap-1">
									<Badge variant={
										workflow.difficulty === 'beginner' ? 'secondary' :
										workflow.difficulty === 'intermediate' ? 'default' :
										'destructive'
									}>
										{workflow.difficulty}
									</Badge>
								</div>
								<div className="flex items-center gap-1">
									<Clock className="h-4 w-4" />
									{workflow.estimatedTime} minutes
								</div>
								<div className="flex items-center gap-1">
									<Zap className="h-4 w-4" />
									{workflow.steps.length} steps
								</div>
							</div>
						</div>
					</div>

					{/* Progress Bar */}
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>Progress</span>
							<span>{completedSteps.size}/{workflow.steps.length} completed</span>
						</div>
						<Progress value={progress} className="h-2" />
					</div>

					{/* Tags */}
					<div className="flex flex-wrap gap-2">
						{workflow.tags.map(tag => (
							<Badge key={tag} variant="outline" className="text-xs">
								{tag}
							</Badge>
						))}
					</div>
				</CardHeader>
			</Card>

			{/* Use Cases */}
			{workflow.useCases && workflow.useCases.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Use Cases</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{workflow.useCases.map((useCase, index) => (
								<li key={index} className="flex items-start gap-2 text-sm">
									<CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
									{useCase}
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}

			{/* Workflow Steps */}
			<div className="space-y-4">
				{workflow.steps.map((step, index) => renderWorkflowStep(step, index))}
			</div>

			{/* Workflow Navigation */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						<Button
							variant="outline"
							onClick={handlePreviousStep}
							disabled={currentStepIndex === 0}
						>
							Previous Step
						</Button>

						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">
								Step {currentStepIndex + 1} of {workflow.steps.length}
							</span>
						</div>

						<Button
							variant="outline"
							onClick={handleNextStep}
							disabled={currentStepIndex === workflow.steps.length - 1}
						>
							Next Step
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Workflow list component
interface WorkflowListProps {
	workflows: WorkflowExample[];
	onWorkflowSelect?: (workflow: WorkflowExample) => void;
	className?: string;
}

export function WorkflowList({ workflows, onWorkflowSelect, className }: WorkflowListProps) {
	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	return (
		<div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-2', className)}>
			{workflows.map(workflow => (
				<Card
					key={workflow.id}
					className="cursor-pointer hover:shadow-md transition-shadow"
					onClick={() => onWorkflowSelect?.(workflow)}
				>
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between gap-2">
							<CardTitle className="text-lg line-clamp-2">{workflow.title}</CardTitle>
							<Badge className={cn('text-xs', getDifficultyColor(workflow.difficulty))}>
								{workflow.difficulty}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground line-clamp-2">
							{workflow.description}
						</p>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<Clock className="h-4 w-4" />
								{workflow.estimatedTime}m
							</div>
							<div className="flex items-center gap-1">
								<Zap className="h-4 w-4" />
								{workflow.steps.length} tools
							</div>
						</div>
						<div className="flex flex-wrap gap-1">
							{workflow.tags.slice(0, 3).map(tag => (
								<Badge key={tag} variant="outline" className="text-xs">
									{tag}
								</Badge>
							))}
							{workflow.tags.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{workflow.tags.length - 3} more
								</Badge>
							)}
						</div>
						{workflow.useCases && workflow.useCases.length > 0 && (
							<div className="text-xs text-muted-foreground">
								Use cases: {workflow.useCases.slice(0, 2).join(', ')}
								{workflow.useCases.length > 2 && ` +${workflow.useCases.length - 2} more`}
							</div>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	);
}

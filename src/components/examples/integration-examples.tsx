'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
	ArrowRight,
	Play,
	CheckCircle,
	ExternalLink,
	Info,
	Code,
	Link,
	Workflow,
	Clock,
	Zap,
	BookOpen
} from 'lucide-react';
import type { IntegrationExample, IntegrationStep } from '@/types/tools';
import { cn } from '@/lib/utils';

interface IntegrationExamplesProps {
	integrations: IntegrationExample[];
	onStepExecute?: (step: IntegrationStep) => void;
	onToolLaunch?: (toolId: string, config?: any) => void;
	className?: string;
}

export function IntegrationExamples({
	integrations,
	onStepExecute,
	onToolLaunch,
	className
}: IntegrationExamplesProps) {
	const [selectedIntegration, setSelectedIntegration] = useState<IntegrationExample | null>(null);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
	const [isExecuting, setIsExecuting] = useState(false);

	const handleIntegrationSelect = (integration: IntegrationExample) => {
		setSelectedIntegration(integration);
		setCurrentStepIndex(0);
		setCompletedSteps(new Set());
	};

	const handleStepExecute = async (step: IntegrationStep) => {
		setIsExecuting(true);
		try {
			await onStepExecute?.(step);
			const newCompleted = new Set(completedSteps);
			newCompleted.add(step.id);
			setCompletedSteps(newCompleted);

			// Auto-advance to next step
			if (selectedIntegration && currentStepIndex < selectedIntegration.steps.length - 1) {
				setCurrentStepIndex(currentStepIndex + 1);
			}
		} finally {
			setIsExecuting(false);
		}
	};

	const handleToolLaunch = (toolId: string, config?: any) => {
		onToolLaunch?.(toolId, config);
	};

	const getComplexityColor = (complexity: string) => {
		switch (complexity) {
			case 'simple': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 'complex': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	const renderIntegrationList = () => (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{integrations.map(integration => (
				<Card
					key={integration.id}
					className="cursor-pointer hover:shadow-md transition-shadow"
					onClick={() => handleIntegrationSelect(integration)}
				>
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between gap-2">
							<CardTitle className="text-lg line-clamp-2">{integration.title}</CardTitle>
							<Badge className={cn('text-xs', getComplexityColor(integration.complexity))}>
								{integration.complexity}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground line-clamp-2">
							{integration.description}
						</p>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex flex-wrap gap-1">
							{integration.tools.slice(0, 3).map(tool => (
								<Badge key={tool} variant="outline" className="text-xs">
									{tool}
								</Badge>
							))}
							{integration.tools.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{integration.tools.length - 3} more
								</Badge>
							)}
						</div>
						<div className="flex flex-wrap gap-1">
							{integration.tags.slice(0, 2).map(tag => (
								<Badge key={tag} variant="secondary" className="text-xs">
									{tag}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);

	const renderIntegrationStep = (step: IntegrationStep, index: number) => {
		const isCompleted = completedSteps.has(step.id);
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
									<h4 className="font-semibold">Step {index + 1}</h4>
									<p className="text-sm text-muted-foreground">{step.description}</p>
								</div>
							</div>
							<div className="flex items-center gap-2 ml-11">
								<Badge variant="outline" className="text-xs">
									{step.toolId}
								</Badge>
							</div>
						</div>
					</div>
				</CardHeader>

				{(isCurrent || isCompleted) && (
					<CardContent className="pt-0 space-y-4">
						<Tabs defaultValue="input" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="input">Input</TabsTrigger>
								<TabsTrigger value="output">Output</TabsTrigger>
								<TabsTrigger value="details">Details</TabsTrigger>
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
										{typeof step.output === 'string'
											? step.output
											: JSON.stringify(step.output, null, 2)
										}
									</pre>
								</div>
							</TabsContent>

							<TabsContent value="details" className="space-y-3">
								<h5 className="text-sm font-medium">Explanation</h5>
								<p className="text-sm text-muted-foreground">{step.explanation}</p>
								{step.transitionToNext && (
									<Alert>
										<ArrowRight className="h-4 w-4" />
										<AlertDescription>
											<strong>Next Step:</strong> {step.transitionToNext}
										</AlertDescription>
									</Alert>
								)}
							</TabsContent>
						</Tabs>

						<div className="flex gap-2 pt-2 border-t">
							<Button
								onClick={() => handleStepExecute(step)}
								disabled={isCompleted || isExecuting}
								className="flex-1"
							>
								{isExecuting && isCurrent ? (
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
								) : isCompleted ? (
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
								onClick={() => handleToolLaunch(step.toolId)}
							>
								<ExternalLink className="h-4 w-4" />
								Open Tool
							</Button>
						</div>
					</CardContent>
				)}

				{index < (selectedIntegration?.steps.length || 0) - 1 && (
					<div className="flex justify-center py-2">
						<ArrowRight className="h-4 w-4 text-muted-foreground" />
					</div>
				)}
			</Card>
		);
	};

	const renderIntegrationDetail = () => {
		if (!selectedIntegration) return null;

		const progress = (completedSteps.size / selectedIntegration.steps.length) * 100;

		return (
			<div className="space-y-6">
				{/* Back button */}
				<Button
					variant="outline"
					onClick={() => setSelectedIntegration(null)}
					className="mb-4"
				>
					← Back to Integrations
				</Button>

				{/* Integration Header */}
				<Card>
					<CardHeader>
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-2">
								<CardTitle className="text-2xl flex items-center gap-2">
									<Workflow className="h-6 w-6" />
									{selectedIntegration.title}
								</CardTitle>
								<p className="text-muted-foreground">{selectedIntegration.description}</p>
							</div>
							<Badge className={cn('text-sm', getComplexityColor(selectedIntegration.complexity))}>
								{selectedIntegration.complexity}
							</Badge>
						</div>

						{/* Progress */}
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>Progress</span>
								<span>{completedSteps.size}/{selectedIntegration.steps.length} steps completed</span>
							</div>
							<Progress value={progress} className="h-2" />
						</div>

						{/* Scenario */}
						<Alert>
							<Info className="h-4 w-4" />
							<AlertDescription>
								<strong>Scenario:</strong> {selectedIntegration.scenario}
							</AlertDescription>
						</Alert>

						{/* Tools Used */}
						<div className="flex flex-wrap gap-2">
							<span className="text-sm font-medium">Tools used:</span>
							{selectedIntegration.tools.map(tool => (
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
					</CardHeader>
				</Card>

				{/* Benefits */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Benefits</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{selectedIntegration.benefits.map((benefit, index) => (
								<li key={index} className="flex items-start gap-2">
									<CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
									<span className="text-sm">{benefit}</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>

				{/* Integration Steps */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">Integration Steps</h3>
					{selectedIntegration.steps.map((step, index) => renderIntegrationStep(step, index))}
				</div>

				{/* Code Examples */}
				{selectedIntegration.codeExamples && selectedIntegration.codeExamples.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<Code className="h-5 w-5" />
								Code Examples
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{selectedIntegration.codeExamples.map(codeExample => (
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
								</div>
							))}
						</CardContent>
					</Card>
				)}
			</div>
		);
	};

	return (
		<div className={cn('space-y-6', className)}>
			{selectedIntegration ? (
				renderIntegrationDetail()
			) : (
				<>
					<div className="space-y-4">
						<h2 className="text-2xl font-bold flex items-center gap-2">
							<Link className="h-6 w-6" />
							Tool Integration Examples
						</h2>
						<p className="text-muted-foreground">
							Discover how to combine multiple tools for powerful workflows and integrations
						</p>
					</div>

					{integrations.length > 0 ? (
						renderIntegrationList()
					) : (
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<h3 className="text-lg font-semibold mb-2">No Integration Examples Yet</h3>
									<p className="text-muted-foreground mb-4">
										Integration examples showing how to combine tools will be available soon.
									</p>
								</div>
							</CardContent>
						</Card>
					)}
				</>
			)}
		</div>
	);
}

// Integration categories for organization
export const IntegrationCategories = {
	'data-processing': {
		name: 'Data Processing',
		description: 'Examples for processing and transforming data across multiple tools',
		icon: 'database',
		color: 'blue'
	},
	'api-integration': {
		name: 'API Integration',
		description: 'Workflows for testing and integrating with external APIs',
		icon: 'api',
		color: 'green'
	},
	'web-development': {
		name: 'Web Development',
		description: 'Examples for web development workflows and optimization',
		icon: 'code',
		color: 'purple'
	},
	'security-workflows': {
		name: 'Security Workflows',
		description: 'Security-focused integrations and audit workflows',
		icon: 'shield',
		color: 'red'
	},
	'file-automation': {
		name: 'File Automation',
		description: 'Automated file processing and conversion workflows',
		icon: 'folder',
		color: 'orange'
	}
};

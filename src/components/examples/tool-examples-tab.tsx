'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExampleDisplay, ExampleSection } from './example-display';
import { TutorialViewer } from './tutorial-viewer';
import { WorkflowDisplay } from './workflow-display';
import { getExamplesForTool, getTutorialsByCategory, getWorkflowsByCategory } from '@/data/examples-data';
import { Play, BookOpen, Zap, ExternalLink } from 'lucide-react';
import type { ToolExample, Tutorial, WorkflowExample, IntegrationExample } from '@/types/tools';
import type { Tool } from '@/types/tools';

interface ToolExamplesTabProps {
	tool: Tool;
	onExampleRun?: (example: ToolExample) => void;
	onToolLaunch?: (toolId: string, config?: any) => void;
	className?: string;
}

export function ToolExamplesTab({
	tool,
	onExampleRun,
	onToolLaunch,
	className
}: ToolExamplesTabProps) {
	const [examples, setExamples] = useState<ToolExample[]>([]);
	const [tutorials, setTutorials] = useState<Tutorial[]>([]);
	const [workflows, setWorkflows] = useState<WorkflowExample[]>([]);
	const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
	const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowExample | null>(null);

	useEffect(() => {
		// Load examples for this tool
		const toolExamples = getExamplesForTool(tool.id);
		setExamples(toolExamples);

		// Load relevant tutorials
		const relevantTutorials = getTutorialsByCategory('Getting Started')
			.filter(tutorial => tutorial.tools.includes(tool.id) ||
				tutorial.tags.some(tag => tool.tags.includes(tag)));
		setTutorials(relevantTutorials);

		// Load relevant workflows
		const relevantWorkflows = getWorkflowsByCategory('Data Processing')
			.filter(workflow => workflow.tools.some(step => step.toolId === tool.id));
		setWorkflows(relevantWorkflows);
	}, [tool]);

	const handleExampleRun = (example: ToolExample) => {
		onExampleRun?.(example);
	};

	const handleToolLaunch = (toolId: string, config?: any) => {
		onToolLaunch?.(toolId, config);
	};

	const basicExamples = examples.filter(ex => ex.category === 'basic');
	const intermediateExamples = examples.filter(ex => ex.category === 'intermediate');
	const advancedExamples = examples.filter(ex => ex.category === 'advanced');

	const handleTutorialSelect = (tutorial: Tutorial) => {
		setSelectedTutorial(tutorial);
	};

	const handleWorkflowSelect = (workflow: WorkflowExample) => {
		setSelectedWorkflow(workflow);
	};

	// If a tutorial is selected, show the tutorial viewer
	if (selectedTutorial) {
		return (
			<div className={className}>
				<div className="mb-4 flex items-center justify-between">
					<Button
						variant="outline"
						onClick={() => setSelectedTutorial(null)}
					>
						← Back to Examples
					</Button>
				</div>
				<TutorialViewer
					tutorial={selectedTutorial}
					onStepComplete={(stepId) => {
						console.log('Tutorial step completed:', stepId);
					}}
					onToolLaunch={handleToolLaunch}
				/>
			</div>
		);
	}

	// If a workflow is selected, show the workflow viewer
	if (selectedWorkflow) {
		return (
			<div className={className}>
				<div className="mb-4 flex items-center justify-between">
					<Button
						variant="outline"
						onClick={() => setSelectedWorkflow(null)}
					>
						← Back to Examples
					</Button>
				</div>
				<WorkflowDisplay
					workflow={selectedWorkflow}
					onStepExecute={(step) => {
						console.log('Workflow step executed:', step);
					}}
					onToolLaunch={handleToolLaunch}
				/>
			</div>
		);
	}

	return (
		<div className={className}>
			<Tabs defaultValue="examples" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="examples">
						<Play className="h-4 w-4 mr-2" />
						Examples
					</TabsTrigger>
					<TabsTrigger value="tutorials">
						<BookOpen className="h-4 w-4 mr-2" />
						Tutorials
					</TabsTrigger>
					<TabsTrigger value="workflows">
						<Zap className="h-4 w-4 mr-2" />
						Workflows
					</TabsTrigger>
				</TabsList>

				<TabsContent value="examples" className="space-y-6 mt-6">
					{basicExamples.length > 0 && (
						<ExampleSection
							title="Basic Examples"
							description="Get started with these simple examples"
							examples={basicExamples}
							onRunExample={handleExampleRun}
						/>
					)}

					{intermediateExamples.length > 0 && (
						<ExampleSection
							title="Intermediate Examples"
							description="More complex examples for advanced use cases"
							examples={intermediateExamples}
							onRunExample={handleExampleRun}
						/>
					)}

					{advancedExamples.length > 0 && (
						<ExampleSection
							title="Advanced Examples"
							description="Expert-level examples and techniques"
							examples={advancedExamples}
							onRunExample={handleExampleRun}
						/>
					)}

					{examples.length === 0 && (
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<h3 className="text-lg font-semibold mb-2">No Examples Yet</h3>
									<p className="text-muted-foreground mb-4">
										Examples for {tool.name} are being created.
									</p>
									<Button
										variant="outline"
										onClick={() => handleToolLaunch(tool.id)}
									>
										<ExternalLink className="h-4 w-4 mr-2" />
										Try the Tool
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="tutorials" className="space-y-6 mt-6">
					{tutorials.length > 0 ? (
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-semibold mb-2">Related Tutorials</h3>
								<p className="text-muted-foreground">
									Step-by-step tutorials that include {tool.name}
								</p>
							</div>
							{tutorials.map(tutorial => (
								<Card
									key={tutorial.id}
									className="cursor-pointer hover:shadow-md transition-shadow"
									onClick={() => handleTutorialSelect(tutorial)}
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-4">
											<div className="space-y-1">
												<CardTitle className="text-lg">{tutorial.title}</CardTitle>
												<p className="text-sm text-muted-foreground line-clamp-2">
													{tutorial.description}
												</p>
											</div>
											<Badge variant={
												tutorial.difficulty === 'beginner' ? 'secondary' :
												tutorial.difficulty === 'intermediate' ? 'default' :
												'destructive'
											}>
												{tutorial.difficulty}
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span>{tutorial.estimatedTime} minutes</span>
											<span>{tutorial.steps.length} steps</span>
											<Button variant="outline" size="sm">
												<BookOpen className="h-3 w-3 mr-1" />
												Start Tutorial
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<h3 className="text-lg font-semibold mb-2">No Related Tutorials</h3>
									<p className="text-muted-foreground mb-4">
										Check back soon for tutorials featuring {tool.name}.
									</p>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="workflows" className="space-y-6 mt-6">
					{workflows.length > 0 ? (
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-semibold mb-2">Related Workflows</h3>
								<p className="text-muted-foreground">
									Complex workflows that use {tool.name} as part of a multi-step process
								</p>
							</div>
							{workflows.map(workflow => (
								<Card
									key={workflow.id}
									className="cursor-pointer hover:shadow-md transition-shadow"
									onClick={() => handleWorkflowSelect(workflow)}
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-4">
											<div className="space-y-1">
												<CardTitle className="text-lg">{workflow.title}</CardTitle>
												<p className="text-sm text-muted-foreground line-clamp-2">
													{workflow.description}
												</p>
											</div>
											<Badge variant={
												workflow.difficulty === 'beginner' ? 'secondary' :
												workflow.difficulty === 'intermediate' ? 'default' :
												'destructive'
											}>
												{workflow.difficulty}
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span>{workflow.estimatedTime} minutes</span>
											<span>{workflow.tools.length} tools</span>
											<Button variant="outline" size="sm">
												<Zap className="h-3 w-3 mr-1" />
												Start Workflow
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<h3 className="text-lg font-semibold mb-2">No Related Workflows</h3>
									<p className="text-muted-foreground mb-4">
										Complex workflows featuring {tool.name} will be available soon.
									</p>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

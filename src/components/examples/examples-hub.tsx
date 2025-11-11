'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Search,
	Filter,
	Play,
	BookOpen,
	Zap,
	Code,
	Clock,
	Star,
	TrendingUp,
	Users,
	Grid3x3,
	List,
	ChevronRight
} from 'lucide-react';
import { ExampleDisplay } from './example-display';
import { TutorialViewer } from './tutorial-viewer';
import { WorkflowDisplay } from './workflow-display';
import { IntegrationExamples } from './integration-examples';
import {
	searchExamples,
	exampleCategories,
	getTutorialsByCategory,
	getWorkflowsByCategory
} from '@/data/examples-data';
import type { ToolExample, Tutorial, WorkflowExample, IntegrationExample, ExampleFilterState } from '@/types/tools';
import { cn } from '@/lib/utils';

interface ExamplesHubProps {
	onExampleRun?: (example: ToolExample) => void;
	onTutorialSelect?: (tutorial: Tutorial) => void;
	onWorkflowSelect?: (workflow: WorkflowExample) => void;
	onToolLaunch?: (toolId: string, config?: any) => void;
	className?: string;
}

export function ExamplesHub({
	onExampleRun,
	onTutorialSelect,
	onWorkflowSelect,
	onToolLaunch,
	className
}: ExamplesHubProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [activeTab, setActiveTab] = useState('all');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [selectedDifficulty, setSelectedDifficulty] = useState('all');
	const [selectedType, setSelectedType] = useState('all');
	const [interactiveOnly, setInteractiveOnly] = useState(false);
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [selectedExample, setSelectedExample] = useState<any>(null);
	const [showFilters, setShowFilters] = useState(false);

	// Mock data - in a real app, this would come from an API or state
	const [allExamples] = useState<ToolExample[]>([]);
	const [allTutorials] = useState<Tutorial[]>([]);
	const [allWorkflows] = useState<WorkflowExample[]>([]);
	const [allIntegrations] = useState<IntegrationExample[]>([]);

	// Filter and search logic
	const filteredContent = useMemo(() => {
		let results = {
			examples: [] as any[],
			tutorials: allTutorials,
			workflows: allWorkflows,
			integrations: allIntegrations
		};

		// Search across all content
		if (searchQuery.trim()) {
			const searchResults = searchExamples(searchQuery);
			results.examples = searchResults.filter(item => item.type === 'example');
			results.tutorials = searchResults.filter(item => item.type === 'tutorial');
			results.workflows = searchResults.filter(item => item.type === 'workflow');
			results.integrations = searchResults.filter(item => item.type === 'integration');
		} else {
			// Use all available content
			results.examples = allExamples;
		}

		// Apply filters
		if (interactiveOnly) {
			results.examples = results.examples.filter(ex => ex.interactive);
			results.tutorials = results.tutorials.filter(t => t.steps.some(s => s.toolId !== undefined));
		}

		if (selectedDifficulty !== 'all') {
			results.examples = results.examples.filter(ex => ex.category === selectedDifficulty);
			results.tutorials = results.tutorials.filter(t => t.difficulty === selectedDifficulty);
			results.workflows = results.workflows.filter(w => w.difficulty === selectedDifficulty);
		}

		if (selectedCategory !== 'all') {
			results.tutorials = results.tutorials.filter(t => t.category === selectedCategory);
			results.workflows = results.workflows.filter(w => w.category === selectedCategory);
		}

		return results;
	}, [searchQuery, selectedCategory, selectedDifficulty, selectedType, interactiveOnly, allExamples, allTutorials, allWorkflows, allIntegrations]);

	const handleExampleSelect = (example: ToolExample) => {
		setSelectedExample({ type: 'example', data: example });
	};

	const handleTutorialSelect = (tutorial: Tutorial) => {
		setSelectedExample({ type: 'tutorial', data: tutorial });
		onTutorialSelect?.(tutorial);
	};

	const handleWorkflowSelect = (workflow: WorkflowExample) => {
		setSelectedExample({ type: 'workflow', data: workflow });
		onWorkflowSelect?.(workflow);
	};

	const handleIntegrationSelect = (integration: IntegrationExample) => {
		setSelectedExample({ type: 'integration', data: integration });
	};

	const handleBackToHub = () => {
		setSelectedExample(null);
	};

	// Render selected content detail view
	if (selectedExample) {
		switch (selectedExample.type) {
			case 'example':
				return (
					<div className={className}>
						<div className="mb-4 flex items-center justify-between">
							<Button variant="outline" onClick={handleBackToHub}>
								← Back to Examples Hub
							</Button>
							<Button onClick={() => onExampleRun?.(selectedExample.data)}>
								<Play className="h-4 w-4 mr-2" />
								Run Example
							</Button>
						</div>
						<ExampleDisplay
							example={selectedExample.data}
							onRunExample={onExampleRun}
						/>
					</div>
				);

			case 'tutorial':
				return (
					<div className={className}>
						<div className="mb-4">
							<Button variant="outline" onClick={handleBackToHub}>
								← Back to Examples Hub
							</Button>
						</div>
						<TutorialViewer
							tutorial={selectedExample.data}
							onStepComplete={(stepId) => console.log('Step completed:', stepId)}
							onToolLaunch={onToolLaunch}
						/>
					</div>
				);

			case 'workflow':
				return (
					<div className={className}>
						<div className="mb-4">
							<Button variant="outline" onClick={handleBackToHub}>
								← Back to Examples Hub
							</Button>
						</div>
						<WorkflowDisplay
							workflow={selectedExample.data}
							onStepExecute={(step) => console.log('Step executed:', step)}
							onToolLaunch={onToolLaunch}
						/>
					</div>
				);

			case 'integration':
				return (
					<div className={className}>
						<div className="mb-4">
							<Button variant="outline" onClick={handleBackToHub}>
								← Back to Examples Hub
							</Button>
						</div>
						<IntegrationExamples
							integrations={[selectedExample.data]}
							onStepExecute={(step) => console.log('Integration step executed:', step)}
							onToolLaunch={onToolLaunch}
						/>
					</div>
				);

			default:
				return null;
		}
	}

	// Render content grid
	const renderContentGrid = () => {
		const getContentIcon = (type: string) => {
			switch (type) {
				case 'example': return <Play className="h-4 w-4" />;
				case 'tutorial': return <BookOpen className="h-4 w-4" />;
				case 'workflow': return <Zap className="h-4 w-4" />;
				case 'integration': return <Code className="h-4 w-4" />;
				default: return <Play className="h-4 w-4" />;
			}
		};

		const allContent = [
			...filteredContent.examples.map(ex => ({ ...ex, type: 'example' })),
			...filteredContent.tutorials.map(t => ({ ...t, type: 'tutorial' })),
			...filteredContent.workflows.map(w => ({ ...w, type: 'workflow' })),
			...filteredContent.integrations.map(i => ({ ...i, type: 'integration' }))
		];

		if (allContent.length === 0) {
			return (
				<Card>
					<CardContent className="pt-6">
						<div className="text-center py-8">
							<Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">No results found</h3>
							<p className="text-muted-foreground">
								Try adjusting your search terms or filters
							</p>
						</div>
					</CardContent>
				</Card>
			);
		}

		return (
			<div className={cn(
				viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'
			)}>
				{allContent.map((content) => {
					const isCard = viewMode === 'grid';
					const CardComponent = isCard ? Card : 'div';

					return (
						<CardComponent
							key={content.id}
							className={cn(
								isCard && "cursor-pointer hover:shadow-md transition-shadow",
								!isCard && "border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
							)}
							onClick={() => {
								switch (content.type) {
									case 'example':
										handleExampleSelect(content);
										break;
									case 'tutorial':
										handleTutorialSelect(content);
										break;
									case 'workflow':
										handleWorkflowSelect(content);
										break;
									case 'integration':
										handleIntegrationSelect(content);
										break;
								}
							}}
						>
							{isCard ? (
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between gap-2">
										<CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
											{getContentIcon(content.type)}
											{content.title}
										</CardTitle>
										<Badge variant="outline" className="text-xs">
											{content.type}
										</Badge>
									</div>
									<p className="text-sm text-muted-foreground line-clamp-2">
										{content.description}
									</p>
								</CardHeader>
							) : (
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										{getContentIcon(content.type)}
										<div>
											<h4 className="font-medium">{content.title}</h4>
											<p className="text-sm text-muted-foreground">{content.description}</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="text-xs">
											{content.type}
										</Badge>
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</div>
								</div>
							)}

							{isCard && (
								<CardContent className="space-y-3">
									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										{content.type === 'tutorial' && (
											<>
												<Clock className="h-4 w-4" />
												<span>{content.estimatedTime}m</span>
											</>
										)}
										{content.type === 'workflow' && (
											<>
												<Zap className="h-4 w-4" />
												<span>{content.tools?.length || 0} tools</span>
											</>
										)}
										{content.type === 'integration' && (
											<>
												<Code className="h-4 w-4" />
												<span>{content.tools?.length || 0} tools</span>
											</>
										)}
									</div>

									<div className="flex flex-wrap gap-1">
										{(content.tags || []).slice(0, 3).map(tag => (
											<Badge key={tag} variant="secondary" className="text-xs">
												{tag}
											</Badge>
										))}
									</div>

									{content.interactive && (
										<Badge variant="outline" className="text-xs">
											Interactive
										</Badge>
									)}
								</CardContent>
							)}
						</CardComponent>
					);
				})}
			</div>
		);
	};

	return (
		<div className={cn('space-y-6', className)}>
			{/* Header */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Examples & Tutorials</h1>
						<p className="text-muted-foreground">
							Learn how to use our developer tools with comprehensive examples and step-by-step tutorials
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant={viewMode === 'grid' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setViewMode('grid')}
						>
							<Grid3x3 className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === 'list' ? 'default' : 'outline'}
							size="sm"
							onClick={() => setViewMode('list')}
						>
							<List className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Search and Filters */}
				<Card>
					<CardContent className="pt-6">
						<div className="space-y-4">
							{/* Search Bar */}
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
								<Input
									placeholder="Search examples, tutorials, workflows..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>

							{/* Filter Controls */}
							<div className="flex flex-wrap items-center gap-4">
								<Button
									variant="outline"
									onClick={() => setShowFilters(!showFilters)}
									className="flex items-center gap-2"
								>
									<Filter className="h-4 w-4" />
									Filters
								</Button>

								{showFilters && (
									<>
								<Select value={selectedCategory} onValueChange={setSelectedCategory}>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Category" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Categories</SelectItem>
										{exampleCategories.map(category => (
											<SelectItem key={category.id} value={category.id}>
												{category.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
									<SelectTrigger className="w-[150px]">
										<SelectValue placeholder="Difficulty" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Levels</SelectItem>
										<SelectItem value="beginner">Beginner</SelectItem>
										<SelectItem value="intermediate">Intermediate</SelectItem>
										<SelectItem value="advanced">Advanced</SelectItem>
									</SelectContent>
								</Select>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="interactive-only"
										checked={interactiveOnly}
										onCheckedChange={(checked) => setInteractiveOnly(checked as boolean)}
									/>
									<label
										htmlFor="interactive-only"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Interactive only
									</label>
								</div>
									</>
								)}
							</div>

							{/* Active Filters Display */}
							{(selectedCategory !== 'all' || selectedDifficulty !== 'all' || interactiveOnly) && (
								<div className="flex flex-wrap gap-2">
									{selectedCategory !== 'all' && (
										<Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedCategory('all')}>
											Category: {selectedCategory} ×
										</Badge>
									)}
									{selectedDifficulty !== 'all' && (
										<Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedDifficulty('all')}>
											Difficulty: {selectedDifficulty} ×
										</Badge>
									)}
									{interactiveOnly && (
										<Badge variant="secondary" className="cursor-pointer" onClick={() => setInteractiveOnly(false)}>
											Interactive only ×
										</Badge>
									)}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Content Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="all">
						All Content
						<Badge variant="secondary" className="ml-2">
							{filteredContent.examples.length + filteredContent.tutorials.length +
							 filteredContent.workflows.length + filteredContent.integrations.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="examples">
						<Play className="h-4 w-4 mr-2" />
						Examples
						<Badge variant="secondary" className="ml-2">
							{filteredContent.examples.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="tutorials">
						<BookOpen className="h-4 w-4 mr-2" />
						Tutorials
						<Badge variant="secondary" className="ml-2">
							{filteredContent.tutorials.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="workflows">
						<Zap className="h-4 w-4 mr-2" />
						Workflows
						<Badge variant="secondary" className="ml-2">
							{filteredContent.workflows.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="integrations">
						<Code className="h-4 w-4 mr-2" />
						Integrations
						<Badge variant="secondary" className="ml-2">
							{filteredContent.integrations.length}
						</Badge>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="mt-6">
					{renderContentGrid()}
				</TabsContent>

				<TabsContent value="examples" className="mt-6">
					<div className="space-y-4">
						<h2 className="text-2xl font-semibold">Examples</h2>
						{renderContentGrid()}
					</div>
				</TabsContent>

				<TabsContent value="tutorials" className="mt-6">
					<div className="space-y-4">
						<h2 className="text-2xl font-semibold">Tutorials</h2>
						{renderContentGrid()}
					</div>
				</TabsContent>

				<TabsContent value="workflows" className="mt-6">
					<div className="space-y-4">
						<h2 className="text-2xl font-semibold">Workflows</h2>
						{renderContentGrid()}
					</div>
				</TabsContent>

				<TabsContent value="integrations" className="mt-6">
					<div className="space-y-4">
						<h2 className="text-2xl font-semibold">Integrations</h2>
						{renderContentGrid()}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

// Quick stats component for the hub
export function ExamplesHubStats() {
	return (
		<div className="grid gap-4 md:grid-cols-4">
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center">
						<Play className="h-8 w-8 text-blue-600" />
						<div className="ml-4">
							<p className="text-2xl font-bold">150+</p>
							<p className="text-sm text-muted-foreground">Examples</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center">
						<BookOpen className="h-8 w-8 text-green-600" />
						<div className="ml-4">
							<p className="text-2xl font-bold">25+</p>
							<p className="text-sm text-muted-foreground">Tutorials</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center">
						<Zap className="h-8 w-8 text-yellow-600" />
						<div className="ml-4">
							<p className="text-2xl font-bold">15+</p>
							<p className="text-sm text-muted-foreground">Workflows</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center">
						<Code className="h-8 w-8 text-purple-600" />
						<div className="ml-4">
							<p className="text-2xl font-bold">10+</p>
							<p className="text-sm text-muted-foreground">Integrations</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

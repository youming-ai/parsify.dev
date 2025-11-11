'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Lightbulb } from 'lucide-react';
import type { ReactNode, Tool, ToolExample } from '@/types/tools';
import { ToolExamplesTab } from '@/components/examples/tool-examples-tab';
import { getExamplesForTool } from '@/data/examples-data';

interface EnhancedToolLayoutProps {
	title: string;
	description: string;
	category: string;
	tool?: Tool;
	children: ReactNode;
	tabs?: Array<{
		value: string;
		label: string;
		content: ReactNode;
	}>;
	features?: string[];
	version?: string;
	showExamples?: boolean;
	onExampleRun?: (example: ToolExample) => void;
	onToolLaunch?: (toolId: string, config?: any) => void;
	className?: string;
}

export function EnhancedToolLayout({
	title,
	description,
	category,
	tool,
	children,
	tabs = [],
	features = [],
	version,
	showExamples = true,
	onExampleRun,
	onToolLaunch,
	className
}: EnhancedToolLayoutProps) {
	const [availableExamples, setAvailableExamples] = useState(0);

	// Check if examples are available for this tool
	useEffect(() => {
		if (tool && showExamples) {
			const examples = getExamplesForTool(tool.id);
			setAvailableExamples(examples.length);
		}
	}, [tool, showExamples]);

	// Create default tabs with examples if enabled
	const allTabs = [
		{
			value: 'tool',
			label: 'Tool',
			content: (
				<Card>
					<CardContent className="p-6">
						{children}
					</CardContent>
				</Card>
			)
		}
	];

	// Add examples tab if enabled and examples are available
	if (showExamples && tool && availableExamples > 0) {
		allTabs.push({
			value: 'examples',
			label: (
				<span className="flex items-center gap-2">
					<BookOpen className="h-4 w-4" />
					Examples
					<Badge variant="secondary" className="text-xs">
						{availableExamples}
					</Badge>
				</span>
			),
			content: (
				<ToolExamplesTab
					tool={tool}
					onExampleRun={onExampleRun}
					onToolLaunch={onToolLaunch}
				/>
			)
		});
	}

	// Add custom tabs
	allTabs.push(...tabs);

	// Add help/documentation tab
	allTabs.push({
		value: 'help',
		label: 'Help',
		content: (
			<Card>
				<CardContent className="p-6 space-y-6">
					<div>
						<h3 className="text-lg font-semibold mb-3">How to Use {title}</h3>
						<div className="space-y-3">
							<div className="flex gap-3">
								<div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
									1
								</div>
								<div>
									<h4 className="font-medium">Input Your Data</h4>
									<p className="text-sm text-muted-foreground">
										Paste or upload your data into the input area. The tool supports various formats.
									</p>
								</div>
							</div>
							<div className="flex gap-3">
								<div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
									2
								</div>
								<div>
									<h4 className="font-medium">Configure Options</h4>
									<p className="text-sm text-muted-foreground">
										Adjust settings and parameters according to your needs.
									</p>
								</div>
							</div>
							<div className="flex gap-3">
								<div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
									3
								</div>
								<div>
									<h4 className="font-medium">Process & Export</h4>
									<p className="text-sm text-muted-foreground">
										Click the process button and download or copy your results.
									</p>
								</div>
							</div>
						</div>
					</div>

					{features.length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Features</h3>
							<div className="grid gap-2 sm:grid-cols-2">
								{features.map((feature) => (
									<div key={feature} className="flex items-center gap-2">
										<Lightbulb className="h-4 w-4 text-yellow-600" />
										<span className="text-sm">{feature}</span>
									</div>
								))}
							</div>
						</div>
					)}

					<div>
						<h3 className="text-lg font-semibold mb-3">Tips & Best Practices</h3>
						<div className="space-y-2">
							<div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
								<p className="text-sm text-blue-800 dark:text-blue-200">
									<strong>Tip:</strong> Use the examples tab to see how this tool works with sample data.
								</p>
							</div>
							<div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
								<p className="text-sm text-green-800 dark:text-green-200">
									<strong>Best Practice:</strong> Always validate your data before processing to ensure accurate results.
								</p>
							</div>
						</div>
					</div>

					{tool && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Tool Information</h3>
							<div className="grid gap-3 sm:grid-cols-2">
								<div>
									<span className="text-sm font-medium">Category:</span>
									<span className="ml-2 text-sm text-muted-foreground">{tool.category}</span>
								</div>
								<div>
									<span className="text-sm font-medium">Difficulty:</span>
									<span className="ml-2 text-sm text-muted-foreground capitalize">{tool.difficulty}</span>
								</div>
								<div>
									<span className="text-sm font-medium">Processing:</span>
									<span className="ml-2 text-sm text-muted-foreground capitalize">{tool.processingType}</span>
								</div>
								<div>
									<span className="text-sm font-medium">Security:</span>
									<span className="ml-2 text-sm text-muted-foreground capitalize">{tool.security}</span>
								</div>
							</div>
							{tool.tags.length > 0 && (
								<div className="mt-3">
									<span className="text-sm font-medium">Tags:</span>
									<div className="mt-1 flex flex-wrap gap-1">
										{tool.tags.map(tag => (
											<Badge key={tag} variant="outline" className="text-xs">
												{tag}
											</Badge>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		)
	});

	const hasTabs = allTabs.length > 1;

	return (
		<div className="container mx-auto py-6">
			<div className="mb-6">
				<div className="mb-2 flex items-center gap-2">
					<Badge variant="secondary">{category}</Badge>
					{version && <Badge variant="outline">v{version}</Badge>}
					{tool?.isNew && (
						<Badge variant="default" className="bg-green-600 hover:bg-green-700">
							New
						</Badge>
					)}
					{tool?.isPopular && (
						<Badge variant="default" className="bg-orange-600 hover:bg-orange-700">
							Popular
						</Badge>
					)}
				</div>
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1">
						<h1 className="font-bold text-3xl tracking-tight">{title}</h1>
						<p className="mt-2 text-muted-foreground">{description}</p>
					</div>
					{tool && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onToolLaunch?.(tool.id)}
						>
							<ExternalLink className="h-4 w-4 mr-2" />
							Open Tool
						</Button>
					)}
				</div>

				{features.length > 0 && (
					<div className="mt-4 flex flex-wrap gap-2">
						{features.map((feature) => (
							<Badge key={feature} variant="outline" className="text-xs">
								{feature}
							</Badge>
						))}
					</div>
				)}
			</div>

			<div className="grid gap-6">
				{hasTabs ? (
					<Tabs defaultValue={allTabs[0].value} className="w-full">
						<TabsList className={cn(
							"grid w-full",
							allTabs.length === 2 ? "grid-cols-2" :
							allTabs.length === 3 ? "grid-cols-3" :
							allTabs.length === 4 ? "grid-cols-4" :
							"grid-cols-5"
						)}>
							{allTabs.map((tab) => (
								<TabsTrigger key={tab.value} value={tab.value}>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
						{allTabs.map((tab) => (
							<TabsContent key={tab.value} value={tab.value} className="mt-6">
								{tab.content}
							</TabsContent>
						))}
					</Tabs>
				) : (
					<Card>
						<CardContent className="p-6">{children}</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}

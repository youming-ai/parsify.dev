'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Play, CheckCircle, Info, Lightbulb, AlertTriangle } from 'lucide-react';
import type { ToolExample, CodeExample } from '@/types/tools';
import { cn } from '@/lib/utils';

interface ExampleDisplayProps {
	example: ToolExample;
	onRunExample?: (example: ToolExample) => void;
	className?: string;
}

export function ExampleDisplay({ example, onRunExample, className }: ExampleDisplayProps) {
	const [copiedSection, setCopiedSection] = useState<string | null>(null);
	const [isRunning, setIsRunning] = useState(false);

	const handleCopy = async (content: string, sectionId: string) => {
		try {
			await navigator.clipboard.writeText(content);
			setCopiedSection(sectionId);
			setTimeout(() => setCopiedSection(null), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	};

	const handleRunExample = async () => {
		if (onRunExample) {
			setIsRunning(true);
			try {
				await onRunExample(example);
			} finally {
				setIsRunning(false);
			}
		}
	};

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
						onClick={handleRunExample}
						disabled={isRunning}
						className="h-6 px-2"
					>
						{isRunning ? (
							<div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						) : (
							<Play className="h-3 w-3" />
						)}
						Run
					</Button>
				)}
			</div>
			<div className="relative rounded-md bg-muted p-3">
				<pre className="text-sm overflow-x-auto">
					<code>{codeExample.code}</code>
				</pre>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => handleCopy(codeExample.code, codeExample.id)}
					className="absolute top-2 right-2 h-6 w-6 p-0"
				>
					{copiedSection === codeExample.id ? (
						<CheckCircle className="h-3 w-3 text-green-600" />
					) : (
						<Copy className="h-3 w-3" />
					)}
				</Button>
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

	const renderSection = (title: string, content: React.ReactNode) => (
		<div className="space-y-2">
			<h4 className="font-medium text-sm">{title}</h4>
			{content}
		</div>
	);

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1">
						<CardTitle className="text-lg">{example.title}</CardTitle>
						<p className="text-sm text-muted-foreground">{example.description}</p>
					</div>
					<div className="flex flex-col gap-2">
						<Badge variant={
							example.category === 'basic' ? 'secondary' :
							example.category === 'intermediate' ? 'default' :
							'destructive'
						}>
							{example.category}
						</Badge>
						{example.interactive && (
							<Badge variant="outline" className="text-xs">
								Interactive
							</Badge>
						)}
						{example.liveExecution && (
							<Badge variant="outline" className="text-xs">
								Live Execution
							</Badge>
						)}
					</div>
				</div>
				<div className="flex flex-wrap gap-1">
					{example.tags.map(tag => (
						<Badge key={tag} variant="outline" className="text-xs">
							{tag}
						</Badge>
					))}
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				<Tabs defaultValue="input" className="w-full">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="input">Input</TabsTrigger>
						<TabsTrigger value="output">Expected Output</TabsTrigger>
						{example.codeExamples && example.codeExamples.length > 0 && (
							<TabsTrigger value="code">Code</TabsTrigger>
						)}
						<TabsTrigger value="details">Details</TabsTrigger>
					</TabsList>

					<TabsContent value="input" className="space-y-3">
						{renderSection('Input Data', (
							<div className="relative rounded-md bg-muted p-3">
								<pre className="text-sm overflow-x-auto whitespace-pre-wrap">
									{typeof example.input === 'string' ? example.input : JSON.stringify(example.input, null, 2)}
								</pre>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleCopy(
										typeof example.input === 'string' ? example.input : JSON.stringify(example.input, null, 2),
										'input'
									)}
									className="absolute top-2 right-2 h-6 w-6 p-0"
								>
									{copiedSection === 'input' ? (
										<CheckCircle className="h-3 w-3 text-green-600" />
									) : (
										<Copy className="h-3 w-3" />
									)}
								</Button>
							</div>
						))}
					</TabsContent>

					<TabsContent value="output" className="space-y-3">
						{renderSection('Expected Output', (
							<div className="relative rounded-md bg-green-50 p-3 dark:bg-green-950">
								<pre className="text-sm overflow-x-auto whitespace-pre-wrap text-green-800 dark:text-green-200">
									{typeof example.expectedOutput === 'string'
										? example.expectedOutput
										: JSON.stringify(example.expectedOutput, null, 2)
									}
								</pre>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleCopy(
										typeof example.expectedOutput === 'string'
											? example.expectedOutput
											: JSON.stringify(example.expectedOutput, null, 2),
										'output'
									)}
									className="absolute top-2 right-2 h-6 w-6 p-0"
								>
									{copiedSection === 'output' ? (
										<CheckCircle className="h-3 w-3 text-green-600" />
									) : (
										<Copy className="h-3 w-3" />
									)}
								</Button>
							</div>
						))}
					</TabsContent>

					{example.codeExamples && example.codeExamples.length > 0 && (
						<TabsContent value="code" className="space-y-4">
							{example.codeExamples.map(renderCodeExample)}
						</TabsContent>
					)}

					<TabsContent value="details" className="space-y-4">
						{example.steps && example.steps.length > 0 &&
							renderSection('Steps to Follow', (
								<ol className="space-y-2">
									{example.steps.map((step, index) => (
										<li key={index} className="flex gap-3 text-sm">
											<span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
												{index + 1}
											</span>
											<span>{step}</span>
										</li>
									))}
								</ol>
							))
						}

						{example.useCase &&
							renderSection('Use Case', (
								<p className="text-sm text-muted-foreground">{example.useCase}</p>
							))
						}

						{example.benefits && example.benefits.length > 0 &&
							renderSection('Benefits', (
								<ul className="space-y-1">
									{example.benefits.map((benefit, index) => (
										<li key={index} className="flex items-center gap-2 text-sm">
											<CheckCircle className="h-3 w-3 text-green-600" />
											{benefit}
										</li>
									))}
								</ul>
							))
						}
					</TabsContent>
				</Tabs>

				{(example.interactive || example.liveExecution) && (
					<div className="flex gap-2 pt-4 border-t">
						{example.interactive && (
							<Button onClick={handleRunExample} disabled={isRunning}>
								{isRunning ? (
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
								) : (
									<Play className="h-4 w-4" />
								)}
								{isRunning ? 'Running...' : 'Try It Live'}
							</Button>
						)}
						{example.liveExecution && (
							<Alert>
								<Info className="h-4 w-4" />
								<AlertDescription>
									This example can be executed directly in the tool.
								</AlertDescription>
							</Alert>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// Example section component for grouping multiple examples
interface ExampleSectionProps {
	title: string;
	description?: string;
	examples: ToolExample[];
	onRunExample?: (example: ToolExample) => void;
	className?: string;
}

export function ExampleSection({ title, description, examples, onRunExample, className }: ExampleSectionProps) {
	return (
		<div className={cn('space-y-4', className)}>
			<div>
				<h3 className="text-lg font-semibold">{title}</h3>
				{description && (
					<p className="text-sm text-muted-foreground mt-1">{description}</p>
				)}
			</div>
			<div className="grid gap-4">
				{examples.map(example => (
					<ExampleDisplay
						key={example.id}
						example={example}
						onRunExample={onRunExample}
					/>
				))}
			</div>
		</div>
	);
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Play,
	Square,
	RotateCcw,
	CheckCircle,
	XCircle,
	AlertTriangle,
	Copy,
	Info,
	Terminal,
	Code
} from 'lucide-react';
import type { ToolExample } from '@/types/tools';
import { cn } from '@/lib/utils';

interface ExecutionResult {
	success: boolean;
	output: any;
	error?: string;
	executionTime: number;
	metadata?: Record<string, any>;
}

interface InteractiveExampleRunnerProps {
	example: ToolExample;
	onExecute: (input: any, config?: any) => Promise<ExecutionResult>;
	onComplete?: (result: ExecutionResult) => void;
	autoExecute?: boolean;
	className?: string;
}

export function InteractiveExampleRunner({
	example,
	onExecute,
	onComplete,
	autoExecute = false,
	className
}: InteractiveExampleRunnerProps) {
	const [isExecuting, setIsExecuting] = useState(false);
	const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
	const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
	const [copiedSection, setCopiedSection] = useState<string | null>(null);
	const [progress, setProgress] = useState(0);
	const executionStartTime = useRef<number>(0);

	useEffect(() => {
		if (autoExecute && !executionResult) {
			handleExecute();
		}
	}, [autoExecute]);

	const handleExecute = async () => {
		setIsExecuting(true);
		setExecutionResult(null);
		setProgress(0);
		executionStartTime.current = Date.now();

		// Simulate progress updates
		const progressInterval = setInterval(() => {
			setProgress(prev => {
				if (prev >= 90) {
					clearInterval(progressInterval);
					return 90;
				}
				return prev + 10;
			});
		}, 200);

		try {
			const result = await onExecute(example.input, example);
			clearInterval(progressInterval);
			setProgress(100);

			const finalResult = {
				...result,
				executionTime: Date.now() - executionStartTime.current
			};

			setExecutionResult(finalResult);
			setExecutionHistory(prev => [...prev, finalResult]);
			onComplete?.(finalResult);
		} catch (error) {
			clearInterval(progressInterval);
			setProgress(100);

			const errorResult: ExecutionResult = {
				success: false,
				output: null,
				error: error instanceof Error ? error.message : 'Unknown error occurred',
				executionTime: Date.now() - executionStartTime.current
			};

			setExecutionResult(errorResult);
			setExecutionHistory(prev => [...prev, errorResult]);
			onComplete?.(errorResult);
		} finally {
			setIsExecuting(false);
		}
	};

	const handleReset = () => {
		setExecutionResult(null);
		setProgress(0);
	};

	const handleCopy = async (content: string, sectionId: string) => {
		try {
			await navigator.clipboard.writeText(content);
			setCopiedSection(sectionId);
			setTimeout(() => setCopiedSection(null), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	};

	const formatOutput = (output: any): string => {
		if (typeof output === 'string') {
			return output;
		}
		if (output === null || output === undefined) {
			return 'No output';
		}
		return JSON.stringify(output, null, 2);
	};

	const renderExecutionControls = () => (
		<div className="flex items-center gap-3">
			<Button
				onClick={handleExecute}
				disabled={isExecuting}
				className={cn(
					executionResult?.success ? "bg-green-600 hover:bg-green-700" :
					executionResult?.success === false ? "bg-red-600 hover:bg-red-700" :
					"bg-primary hover:bg-primary"
				)}
			>
				{isExecuting ? (
					<>
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
						Executing...
					</>
				) : executionResult?.success ? (
					<>
						<CheckCircle className="h-4 w-4" />
						Success
					</>
				) : executionResult?.success === false ? (
					<>
						<XCircle className="h-4 w-4" />
						Retry
					</>
				) : (
					<>
						<Play className="h-4 w-4" />
						Run Example
					</>
				)}
			</Button>

			{executionResult && (
				<Button variant="outline" onClick={handleReset}>
					<RotateCcw className="h-4 w-4" />
					Reset
				</Button>
			)}

			{isExecuting && (
				<div className="flex items-center gap-2 flex-1">
					<Progress value={progress} className="flex-1" />
					<span className="text-sm text-muted-foreground">{progress}%</span>
				</div>
			)}
		</div>
	);

	const renderResult = (result: ExecutionResult, index?: number) => {
		const resultId = index !== undefined ? `result-${index}` : 'current-result';

		return (
			<Card className={cn(
				"border-2",
				result.success ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"
			)}>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg flex items-center gap-2">
							{result.success ? (
								<CheckCircle className="h-5 w-5 text-green-600" />
							) : (
								<XCircle className="h-5 w-5 text-red-600" />
							)}
							{result.success ? 'Execution Successful' : 'Execution Failed'}
							{index !== undefined && (
								<span className="text-sm text-muted-foreground">
									(Execution #{index + 1})
								</span>
							)}
						</CardTitle>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span>{result.executionTime}ms</span>
							{index !== undefined && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleCopy(formatOutput(result.output), resultId)}
									className="h-6 w-6 p-0"
								>
									{copiedSection === resultId ? (
										<CheckCircle className="h-3 w-3 text-green-600" />
									) : (
										<Copy className="h-3 w-3" />
									)}
								</Button>
							)}
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					{result.error && (
						<Alert variant="destructive">
							<XCircle className="h-4 w-4" />
							<AlertDescription>
								<strong>Error:</strong> {result.error}
							</AlertDescription>
						</Alert>
					)}

					{result.success && result.output !== null && (
						<div className="space-y-2">
							<h4 className="font-medium text-sm flex items-center gap-2">
								<Terminal className="h-4 w-4" />
								Output
							</h4>
							<div className="relative">
								<pre className="rounded-md bg-muted p-3 text-sm overflow-x-auto whitespace-pre-wrap">
									{formatOutput(result.output)}
								</pre>
								{index === undefined && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleCopy(formatOutput(result.output), 'output')}
										className="absolute top-2 right-2 h-6 w-6 p-0"
									>
										{copiedSection === 'output' ? (
											<CheckCircle className="h-3 w-3 text-green-600" />
										) : (
											<Copy className="h-3 w-3" />
										)}
									</Button>
								)}
							</div>
						</div>
					)}

					{result.metadata && Object.keys(result.metadata).length > 0 && (
						<div className="space-y-2">
							<h4 className="font-medium text-sm flex items-center gap-2">
								<Info className="h-4 w-4" />
								Metadata
							</h4>
							<div className="rounded-md bg-muted p-3">
								<pre className="text-sm overflow-x-auto">
									{JSON.stringify(result.metadata, null, 2)}
								</pre>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		);
	};

	return (
		<div className={cn('space-y-6', className)}>
			{/* Example Information */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-1">
							<CardTitle className="flex items-center gap-2">
								<Code className="h-5 w-5" />
								{example.title}
							</CardTitle>
							<p className="text-sm text-muted-foreground">{example.description}</p>
						</div>
						<div className="flex items-center gap-2">
							{example.interactive && (
								<div className="flex items-center gap-1 text-sm text-green-600">
									<Terminal className="h-4 w-4" />
									Interactive
								</div>
							)}
							{example.liveExecution && (
								<div className="flex items-center gap-1 text-sm text-blue-600">
									<Play className="h-4 w-4" />
									Live Execution
								</div>
							)}
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Execution Controls */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-lg">Execution Controls</CardTitle>
				</CardHeader>
				<CardContent>
					{renderExecutionControls()}

					{example.steps && example.steps.length > 0 && (
						<Alert className="mt-4">
							<Info className="h-4 w-4" />
							<AlertDescription>
								<strong>Steps to follow:</strong>
								<ol className="mt-2 list-decimal list-inside space-y-1">
									{example.steps.map((step, index) => (
										<li key={index} className="text-sm">{step}</li>
									))}
								</ol>
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			{/* Current Result */}
			{executionResult && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">Result</h3>
					{renderResult(executionResult)}
				</div>
			)}

			{/* Execution History */}
			{executionHistory.length > 1 && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">
						Execution History ({executionHistory.length} runs)
					</h3>
					<Tabs defaultValue="latest" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="latest">Latest</TabsTrigger>
							<TabsTrigger value="history">History</TabsTrigger>
						</TabsList>
						<TabsContent value="latest">
							{renderResult(executionHistory[executionHistory.length - 1])}
						</TabsContent>
						<TabsContent value="history" className="space-y-4">
							{executionHistory.slice().reverse().map((result, index) => (
								<div key={index}>
									{renderResult(result, executionHistory.length - 1 - index)}
								</div>
							))}
						</TabsContent>
					</Tabs>
				</div>
			)}

			{/* Benefits and Use Case */}
			{(example.benefits || example.useCase) && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Additional Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{example.useCase && (
							<div className="space-y-2">
								<h4 className="font-medium text-sm">Use Case</h4>
								<p className="text-sm text-muted-foreground">{example.useCase}</p>
							</div>
						)}

						{example.benefits && example.benefits.length > 0 && (
							<div className="space-y-2">
								<h4 className="font-medium text-sm">Benefits</h4>
								<ul className="space-y-1">
									{example.benefits.map((benefit, index) => (
										<li key={index} className="flex items-center gap-2 text-sm">
											<CheckCircle className="h-3 w-3 text-green-600" />
											{benefit}
										</li>
									))}
								</ul>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// Hook for managing interactive examples
export function useInteractiveExample() {
	const [currentExample, setCurrentExample] = useState<ToolExample | null>(null);
	const [isRunning, setIsRunning] = useState(false);

	const runExample = async (example: ToolExample, executor: (input: any) => Promise<any>) => {
		setCurrentExample(example);
		setIsRunning(true);

		try {
			const result = await executor(example.input);
			return {
				success: true,
				output: result,
				executionTime: 0 // Will be calculated in the runner component
			};
		} catch (error) {
			return {
				success: false,
				output: null,
				error: error instanceof Error ? error.message : 'Unknown error',
				executionTime: 0
			};
		} finally {
			setIsRunning(false);
		}
	};

	const stopExecution = () => {
		setIsRunning(false);
		setCurrentExample(null);
	};

	return {
		currentExample,
		isRunning,
		runExample,
		stopExecution,
		setCurrentExample
	};
}

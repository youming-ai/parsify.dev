/**
 * Error Recovery Workflow Component
 * Provides guided steps to recover from errors
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
	AlertTriangle,
	CheckCircle,
	RefreshCw,
	Lightbulb,
	Terminal,
	FileJson,
	Code,
	Network,
	Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/lib/workflows/workflow-store';
import { workflowErrorHandler } from '@/lib/workflows/workflow-error-integration';
import type { ProcessingError, RecoveryStrategy } from '@/types/workflows';

interface ErrorRecoveryWorkflowProps {
	error: ProcessingError;
	workflowId: string;
	stepId: string;
	onRecoveryComplete?: (success: boolean) => void;
	onCancel?: () => void;
	className?: string;
}

export function ErrorRecoveryWorkflow({
	error,
	workflowId,
	stepId,
	onRecoveryComplete,
	onCancel,
	className,
}: ErrorRecoveryWorkflowProps) {
	const { context } = useWorkflowStore();
	const [recoveryStrategy, setRecoveryStrategy] = React.useState<RecoveryStrategy | null>(null);
	const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
	const [isRecovering, setIsRecovering] = React.useState(false);
	const [recoveryComplete, setRecoveryComplete] = React.useState(false);
	const [manualInput, setManualInput] = React.useState('');
	const [userFeedback, setUserFeedback] = React.useState('');

	// Initialize recovery strategy
	React.useEffect(() => {
		const handleRecovery = async () => {
			const result = await workflowErrorHandler.handleWorkflowError(
				error,
				workflowId,
				stepId,
				context
			);

			if (result.recoveryStrategy) {
				setRecoveryStrategy(result.recoveryStrategy);
			}
		};

		handleRecovery();
	}, [error, workflowId, stepId, context]);

	// Get error icon based on type
	const getErrorIcon = () => {
		switch (error.type) {
			case 'validation':
				return <FileJson className="h-6 w-6" />;
			case 'processing':
				return <Terminal className="h-6 w-6" />;
			case 'network':
				return <Network className="h-6 w-6" />;
			case 'security':
				return <Shield className="h-6 w-6" />;
			default:
				return <AlertTriangle className="h-6 w-6" />;
		}
	};

	// Get error color scheme
	const getErrorColor = () => {
		switch (error.type) {
			case 'validation':
				return 'text-orange-600 bg-orange-50 border-orange-200';
			case 'processing':
				return 'text-red-600 bg-red-50 border-red-200';
			case 'network':
				return 'text-blue-600 bg-blue-50 border-blue-200';
			case 'security':
				return 'text-purple-600 bg-purple-50 border-purple-200';
			default:
				return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	};

	// Execute recovery step
	const executeRecoveryStep = async (step: string) => {
		setIsRecovering(true);

		try {
			// Simulate recovery step execution
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Move to next step or complete
			if (recoveryStrategy && currentStepIndex < recoveryStrategy.steps.length - 1) {
				setCurrentStepIndex(currentStepIndex + 1);
			} else {
				// Recovery workflow complete
				setRecoveryComplete(true);
				setTimeout(() => {
					onRecoveryComplete?.(true);
				}, 2000);
			}
		} catch (error) {
			console.error('Recovery step failed:', error);
		} finally {
			setIsRecovering(false);
		}
	};

	// Try automatic recovery
	const tryAutoRecovery = async () => {
		setIsRecovering(true);

		try {
			// This would integrate with the actual auto-recovery logic
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Simulate success
			setRecoveryComplete(true);
			onRecoveryComplete?.(true);
		} catch (error) {
			console.error('Auto-recovery failed:', error);
		} finally {
			setIsRecovering(false);
		}
	};

	// Handle manual fix
	const handleManualFix = () => {
		// Apply manual input to fix the issue
		// This would integrate with the actual tool
		onRecoveryComplete?.(true);
	};

	if (!recoveryStrategy) {
		return (
			<Card className={cn("w-full max-w-2xl mx-auto", className)}>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<RefreshCw className="h-5 w-5 animate-spin" />
						<span>Finding Recovery Strategy...</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8">
						<p className="text-muted-foreground">
							Analyzing the error and preparing recovery steps...
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={cn("w-full max-w-2xl mx-auto", className)}>
			<CardHeader className={cn("border-b", getErrorColor())}>
				<CardTitle className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						{getErrorIcon()}
						<div>
							<h3 className="text-lg font-semibold">{recoveryStrategy.name}</h3>
							<p className="text-sm font-normal opacity-80 mt-1">
								{recoveryStrategy.description}
							</p>
						</div>
					</div>

					<div className="flex items-center space-x-2">
						<Badge variant="outline">
							{error.type}
						</Badge>
						{recoveryStrategy.automated && (
							<Badge variant="secondary">
								Automated
							</Badge>
						)}
					</div>
				</CardTitle>
			</CardHeader>

			<CardContent className="p-6">
				{!recoveryComplete ? (
					<div className="space-y-6">
						{/* Progress indicator */}
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>Recovery Progress</span>
								<span>{currentStepIndex + 1} of {recoveryStrategy.steps.length}</span>
							</div>
							<Progress
								value={((currentStepIndex + 1) / recoveryStrategy.steps.length) * 100}
								className="h-2"
							/>
						</div>

						{/* Current step */}
						<motion.div
							key={currentStepIndex}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="space-y-4"
						>
							<div className="flex items-center space-x-2">
								<div className={cn(
									"flex h-8 w-8 items-center justify-center rounded-full border-2",
									getErrorColor()
								)}>
									<span className="text-sm font-medium">
										{currentStepIndex + 1}
									</span>
								</div>
								<h4 className="text-lg font-medium">
									{recoveryStrategy.steps[currentStepIndex]}
								</h4>
							</div>

							{/* Error details */}
							<Alert>
								<AlertTriangle className="h-4 w-4" />
								<AlertDescription>
									<strong>Error:</strong> {error.message}
									{error.details && (
										<>
											<br />
											<strong>Details:</strong> {error.details}
										</>
									)}
								</AlertDescription>
							</Alert>

							{/* Suggestions */}
							{error.suggestions && error.suggestions.length > 0 && (
								<div className="space-y-2">
									<h5 className="text-sm font-medium flex items-center">
										<Lightbulb className="h-4 w-4 mr-2" />
										Suggestions
									</h5>
									<ul className="text-sm text-muted-foreground space-y-1 ml-6">
										{error.suggestions.map((suggestion, index) => (
											<li key={index} className="list-disc">
												{suggestion}
											</li>
										))}
									</ul>
								</div>
							)}
						</motion.div>

						{/* Recovery options */}
						<div className="space-y-3">
							{recoveryStrategy.automated && currentStepIndex === 0 && (
								<Button
									onClick={tryAutoRecovery}
									disabled={isRecovering}
									className="w-full"
								>
									{isRecovering ? (
										<>
											<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
											Recovering...
										</>
									) : (
										'Try Automatic Recovery'
									)}
								</Button>
							)}

							<Separator />

							<div className="flex space-x-3">
								<Button
									onClick={() => executeRecoveryStep(recoveryStrategy.steps[currentStepIndex])}
									disabled={isRecovering}
									variant="default"
									className="flex-1"
								>
									{isRecovering ? (
										<>
											<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
											Processing...
										</>
									) : (
										'Manual Fix'
									)}
								</Button>

								<Button
									onClick={onCancel}
									variant="outline"
									disabled={isRecovering}
								>
									Cancel
								</Button>
							</div>
						</div>

						{/* Manual input area */}
						{currentStepIndex === recoveryStrategy.steps.length - 1 && (
							<div className="space-y-2">
								<label className="text-sm font-medium">
									Corrected Input (if needed):
								</label>
								<Textarea
									value={manualInput}
									onChange={(e) => setManualInput(e.target.value)}
									placeholder="Enter corrected input to resolve the error..."
									className="min-h-[100px]"
								/>
								<Button
									onClick={handleManualFix}
									variant="outline"
									disabled={!manualInput.trim()}
									className="w-full"
								>
									Apply Fix
								</Button>
							</div>
						)}
					</div>
				) : (
					/* Recovery Complete */
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="text-center py-8 space-y-4"
					>
						<motion.div
							initial={{ rotate: 0 }}
							animate={{ rotate: 360 }}
							transition={{ duration: 0.6 }}
						>
							<CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
						</motion.div>

						<div>
							<h3 className="text-xl font-semibold text-green-600">
								Recovery Complete!
							</h3>
							<p className="text-muted-foreground mt-2">
								The error has been resolved. You can now continue with your workflow.
							</p>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								How was this recovery experience?
							</label>
							<Textarea
								value={userFeedback}
								onChange={(e) => setUserFeedback(e.target.value)}
								placeholder="Share your feedback to help us improve..."
								className="min-h-[80px]"
							/>
						</div>

						<Button onClick={() => onRecoveryComplete?.(true)} className="w-full">
							Continue with Workflow
						</Button>
					</motion.div>
				)}
			</CardContent>
		</Card>
	);
}

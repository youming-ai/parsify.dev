/**
 * Workflow Step Component
 * Renders individual workflow steps with interactive elements
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Lightbulb, Code, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/lib/workflows/workflow-store';
import type { WorkflowStep as StepType, WorkflowContext } from '@/types/workflows';

interface WorkflowStepProps {
	step: StepType;
	onComplete: () => void;
	onHint?: (hintId: string) => void;
	isPaused?: boolean;
	className?: string;
}

export function WorkflowStep({
	step,
	onComplete,
	onHint,
	isPaused = false,
	className,
}: WorkflowStepProps) {
	const {
		context,
		trackError,
		trackHintView,
		updateContext
	} = useWorkflowStore();

	const [stepData, setStepData] = React.useState<Record<string, any>>({});
	const [errors, setErrors] = React.useState<Record<string, string>>({});
	const [showHints, setShowHints] = React.useState(false);
	const [isValidating, setIsValidating] = React.useState(false);
	const [validated, setValidated] = React.useState(false);

	// Handle interactive element value changes
	const handleElementChange = (elementId: string, value: any) => {
		setStepData(prev => ({ ...prev, [elementId]: value }));

		// Clear errors for this element
		if (errors[elementId]) {
			setErrors(prev => {
				const newErrors = { ...prev };
				delete newErrors[elementId];
				return newErrors;
			});
		}

		// Update workflow context
		updateContext({
			userData: { ...context.userData, [elementId]: value },
		});
	};

	// Validate the step
	const validateStep = async () => {
		if (!step.validation) return true;

		setIsValidating(true);
		setErrors({});

		try {
			const validationContext = {
				...context,
				userData: { ...context.userData, ...stepData },
			};

			const result = await step.validation.validate(validationContext);

			if (typeof result === 'string') {
				// Validation failed with error message
				setErrors({ general: result });
				trackError(step.id, result);
				return false;
			} else if (!result) {
				// Validation failed
				setErrors({
					general: step.validation.errorMessage || 'Please complete the step correctly.'
				});
				trackError(step.id, step.validation.errorMessage || 'Validation failed');
				return false;
			}

			setValidated(true);
			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Validation error';
			setErrors({ general: errorMessage });
			trackError(step.id, errorMessage);
			return false;
		} finally {
			setIsValidating(false);
		}
	};

	// Handle step completion
	const handleComplete = async () => {
		const isValid = await validateStep();
		if (isValid) {
			onComplete();
		}
	};

	// Handle hint clicks
	const handleHintClick = (hintId: string) => {
		trackHintView(hintId);
		onHint?.(hintId);
	};

	// Render interactive elements
	const renderInteractiveElement = (element: any) => {
		switch (element.type) {
			case 'input':
			case 'textarea':
				return (
					<div key={element.id} className="space-y-2">
						<label className="text-sm font-medium">{element.label}</label>
						{element.type === 'textarea' ? (
							<Textarea
								value={stepData[element.id] || ''}
								onChange={(e) => handleElementChange(element.id, e.target.value)}
								placeholder={element.placeholder}
								className={cn(
									errors[element.id] && "border-destructive focus:ring-destructive"
								)}
							/>
						) : (
							<Input
								value={stepData[element.id] || ''}
								onChange={(e) => handleElementChange(element.id, e.target.value)}
								placeholder={element.placeholder}
								className={cn(
									errors[element.id] && "border-destructive focus:ring-destructive"
								)}
							/>
						)}
						{errors[element.id] && (
							<p className="text-xs text-destructive">{errors[element.id]}</p>
						)}
					</div>
				);

			case 'select':
				return (
					<div key={element.id} className="space-y-2">
						<label className="text-sm font-medium">{element.label}</label>
						<Select
							value={stepData[element.id] || ''}
							onValueChange={(value) => handleElementChange(element.id, value)}
						>
							<SelectTrigger className={cn(
								errors[element.id] && "border-destructive focus:ring-destructive"
							)}>
								<SelectValue placeholder={element.placeholder} />
							</SelectTrigger>
							<SelectContent>
								{element.options?.map((option: string) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors[element.id] && (
							<p className="text-xs text-destructive">{errors[element.id]}</p>
						)}
					</div>
				);

			case 'toggle':
			case 'switch':
				return (
					<div key={element.id} className="flex items-center space-x-2">
						<Switch
							checked={stepData[element.id] || false}
							onCheckedChange={(checked) => handleElementChange(element.id, checked)}
						/>
						<label className="text-sm font-medium">{element.label}</label>
					</div>
				);

			case 'button':
				return (
					<Button
						key={element.id}
						variant="default"
						onClick={() => {
							element.action?.();
							// Mark that the action was performed
							handleElementChange(element.id, true);
						}}
						disabled={element.enabled === false}
						className="w-full"
					>
						{element.label}
					</Button>
				);

			default:
				return null;
		}
	};

	// Render visual aids
	const renderVisualAid = (aid: any, index: number) => {
		switch (aid.type) {
			case 'image':
				return (
					<img
						key={index}
						src={aid.src}
						alt={aid.alt}
						className="rounded-lg border max-w-full h-auto"
					/>
				);
			case 'screenshot':
				return (
					<div key={index} className="relative">
						<img
							src={aid.src}
							alt={aid.alt}
							className="rounded-lg border max-w-full h-auto"
						/>
						{aid.caption && (
							<p className="text-xs text-muted-foreground mt-2 text-center">
								{aid.caption}
							</p>
						)}
					</div>
				);
			default:
				return null;
		}
	};

	// Render examples
	const renderExample = (example: any, index: number) => (
		<Card key={index} className="bg-muted/30">
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-medium">{example.title}</CardTitle>
				{example.description && (
											<p className="text-xs text-muted-foreground">{example.description}</p>
										)}
									</CardHeader>
									<CardContent className="pt-0">
										{example.code && (
											<div className="relative">
												<pre className="text-xs bg-background border rounded p-3 overflow-x-auto">
													<code>{example.code}</code>
												</pre>
												<Button
													size="sm"
													variant="ghost"
													className="absolute top-2 right-2 h-6 px-2 text-xs"
													onClick={() => {
														navigator.clipboard.writeText(example.code);
													}}
												>
													Copy
												</Button>
											</div>
										)}
										{example.output && (
											<div className="mt-2">
												<p className="text-xs font-medium text-muted-foreground mb-1">Output:</p>
												<pre className="text-xs bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded p-2">
													{typeof example.output === 'string'
														? example.output
														: JSON.stringify(example.output, null, 2)}
												</pre>
											</div>
										)}
										{example.explanation && (
											<p className="text-xs text-muted-foreground mt-2 italic">
												{example.explanation}
											</p>
										)}
									</CardContent>
								</Card>
							);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className={cn("space-y-6", className)}
		>
			{/* Step Header */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
											<h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
											<Badge variant={step.difficulty === 'beginner' ? 'secondary' :
														  step.difficulty === 'intermediate' ? 'default' : 'destructive'}>
												{step.difficulty}
											</Badge>
										</div>
										<p className="text-sm text-muted-foreground">{step.description}</p>
										{step.required && (
											<p className="text-xs text-orange-600 dark:text-orange-400">
												Required step
											</p>
										)}
									</div>

									{/* Step Content */}
									<div className="space-y-4">
										{step.content.type === 'instruction' && (
											<div className="prose prose-sm max-w-none dark:prose-invert">
												<p>{step.content.text}</p>
											</div>
										)}

										{step.content.type === 'interactive' && (
											<div className="space-y-4">
												<div className="prose prose-sm max-w-none dark:prose-invert">
													<p>{step.content.text}</p>
												</div>

												{step.content.code && (
													<div className="relative">
														<pre className="text-sm bg-background border rounded-lg p-4 overflow-x-auto">
															<code>{step.content.code}</code>
														</pre>
														<Button
															size="sm"
															variant="ghost"
															className="absolute top-2 right-2"
															onClick={() => navigator.clipboard.writeText(step.content.code!)}
														>
															<Code className="h-4 w-4" />
														</Button>
													</div>
												)}

												{/* Interactive Elements */}
												{step.content.interactiveElements && (
													<div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
														{step.content.interactiveElements.map(renderInteractiveElement)}
													</div>
												)}
											</div>
										)}

										{/* Examples */}
										{step.content.examples && step.content.examples.length > 0 && (
											<div className="space-y-3">
												<h4 className="text-sm font-medium">Examples</h4>
												{step.content.examples.map(renderExample)}
											</div>
										)}

										{/* Visual Aids */}
										{step.content.visualAids && step.content.visualAids.length > 0 && (
											<div className="space-y-4">
												{step.content.visualAids.map(renderVisualAid)}
											</div>
										)}
									</div>

									{/* Actions */}
									{step.actions && step.actions.length > 0 && (
										<div className="flex space-x-2">
											{step.actions.map((action) => (
												<Button
													key={action.id}
													variant={
														action.type === 'primary' ? 'default' :
														action.type === 'secondary' ? 'outline' : 'ghost'
													}
													size="sm"
													onClick={() => action.action()}
													disabled={action.enabled === false}
													className={action.visible === false ? 'hidden' : ''}
												>
													{action.label}
												</Button>
											))}
										</div>
									)}

									{/* Hints */}
									{step.hints && step.hints.length > 0 && (
										<div className="space-y-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setShowHints(!showHints)}
												className="text-xs"
											>
												<Lightbulb className="h-3 w-3 mr-1" />
												{showHints ? 'Hide' : 'Show'} Hints ({step.hints.length})
											</Button>

											{showHints && (
												<div className="space-y-2">
													{step.hints.map((hint, index) => (
														<Alert key={index}>
															{hint.type === 'tip' && <Lightbulb className="h-4 w-4" />}
															{hint.type === 'warning' && <AlertCircle className="h-4 w-4" />}
															<AlertDescription className="text-sm">
																<strong>{hint.title}:</strong> {hint.content}
															</AlertDescription>
														</Alert>
													))}
												</div>
											)}
										</div>
									)}

									{/* Validation Status */}
									{step.validation && (
										<div className="flex items-center space-x-2">
											{validated ? (
												<>
													<CheckCircle className="h-4 w-4 text-green-500" />
													<span className="text-sm text-green-600 dark:text-green-400">
														{step.validation.successMessage || 'Step completed successfully!'}
													</span>
												</>
											) : (
												<span className="text-sm text-muted-foreground">
													Complete this step to continue
												</span>
											)}
										</div>
									)}

									{/* Error Display */}
									{errors.general && (
										<Alert variant="destructive">
											<AlertCircle className="h-4 w-4" />
											<AlertDescription>{errors.general}</AlertDescription>
										</Alert>
									)}

									{/* Complete Button */}
									{step.validation && !validated && (
										<Button
											onClick={handleComplete}
											disabled={isValidating || isPaused}
											className="w-full"
										>
											{isValidating ? 'Validating...' : 'Complete Step'}
										</Button>
									)}
								</motion.div>
							);
						}

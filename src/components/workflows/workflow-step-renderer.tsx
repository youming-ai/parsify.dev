/**
 * Workflow Step Renderer
 * Renders different types of workflow step content
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Lightbulb, Code, Play, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { WorkflowStep, Workflow, InteractiveElement, WorkflowExample } from '@/types/workflows';
import { useWorkflowStore } from '@/lib/workflows/workflow-store';

interface WorkflowStepRendererProps {
	step: WorkflowStep;
	workflow: Workflow;
	stepIndex: number;
	className?: string;
}

export function WorkflowStepRenderer({
	step,
	workflow,
	stepIndex,
	className
}: WorkflowStepRendererProps) {
	const {
		updateContext,
		updateProgress,
		trackError,
		trackHintView,
		completeStep,
		context
	} = useWorkflowStore();

	const [interactiveValues, setInteractiveValues] = useState<Record<string, any>>({});
	const [validationState, setValidationState] = useState<{ isValid: boolean; message?: string }>({ isValid: false });
	const [showHints, setShowHints] = useState<string[]>([]);
	const [testResults, setTestResults] = useState<any>(null);

	// Handle interactive element value changes
	const handleInteractiveChange = (elementId: string, value: any) => {
		setInteractiveValues(prev => ({
			...prev,
			[elementId]: value,
		}));

		// Update context with user data
		updateContext({
			userData: {
				...context.userData,
				[elementId]: value,
			},
		});

		// Trigger validation if element has it
		const element = step.content.interactiveElements?.find(el => el.id === elementId);
		if (element?.validation) {
			const validationResult = element.validation(value);
			if (typeof validationResult === 'boolean') {
				setValidationState({ isValid: validationResult });
			} else {
				setValidationState({ isValid: false, message: validationResult });
			}
		}

		// Track that user interacted with this element
		updateContext({
			sessionData: {
				...context.sessionData,
				[`${elementId}_interacted`]: true,
			},
		});
	};

	// Handle step completion
	const handleStepComplete = () => {
		if (validationState.isValid) {
			completeStep(step.id);
			updateProgress({
				lastActivity: new Date(),
			});
		}
	};

	// Handle hint display
	const handleShowHint = (hintId: string) => {
		if (!showHints.includes(hintId)) {
			setShowHints(prev => [...prev, hintId]);
			trackHintView(hintId);
		}
	};

	// Handle step validation
	const validateStep = async () => {
		if (step.validation) {
			try {
				const isValid = await step.validation.validate(context);
				setValidationState({
					isValid,
					message: isValid ? step.validation?.successMessage : step.validation?.errorMessage
				});

				if (isValid) {
					completeStep(step.id);
				}
			} catch (error) {
				trackError(step.id, `Validation failed: ${error}`);
				setValidationState({
					isValid: false,
					message: 'Validation failed. Please try again.'
				});
			}
		}
	};

	// Render interactive elements
	const renderInteractiveElement = (element: InteractiveElement) => {
		const value = interactiveValues[element.id] || element.value || '';

		switch (element.type) {
			case 'input':
			case 'textarea':
				const Component = element.type === 'textarea' ? Textarea : Input;
				return (
					<div key={element.id} className="space-y-2">
						<label className="text-sm font-medium">{element.label}</label>
						<Component
							value={value}
							placeholder={element.placeholder}
							onChange={(e) => handleInteractiveChange(element.id, e.target.value)}
							className="w-full"
						/>
					</div>
				);

			case 'select':
				return (
					<div key={element.id} className="space-y-2">
						<label className="text-sm font-medium">{element.label}</label>
						<Select
							value={value}
							onValueChange={(newValue) => handleInteractiveChange(element.id, newValue)}
						>
							<SelectTrigger>
								<SelectValue placeholder={element.placeholder || 'Select an option'} />
							</SelectTrigger>
							<SelectContent>
								{element.options?.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				);

			case 'toggle':
				return (
					<div key={element.id} className="flex items-center justify-between">
						<label className="text-sm font-medium">{element.label}</label>
						<Switch
							checked={value}
							onCheckedChange={(checked) => handleInteractiveChange(element.id, checked)}
						/>
					</div>
				);

			case 'button':
				return (
					<Button
						key={element.id}
						variant="default"
						onClick={() => {
							element.action?.();
							handleInteractiveChange(element.id, true);
						}}
						disabled={!element.enabled}
						className={cn(
							'w-full sm:w-auto',
							element.type === 'primary' && 'bg-primary text-primary-foreground',
							element.type === 'secondary' && 'bg-secondary text-secondary-foreground',
							element.type === 'tertiary' && 'bg-muted text-muted-foreground'
						)}
					>
						{element.label}
					</Button>
				);

			default:
				return null;
		}
	};

	// Render code examples
	const renderCodeExample = (example: WorkflowExample, index: number) => (
		<Card key={index} className="mt-4">
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-medium">{example.title}</CardTitle>
				{example.description && (
					<p className="text-xs text-muted-foreground">{example.description}</p>
				)}
			</CardHeader>
			<CardContent className="pt-0">
				{example.code && (
					<div className="relative">
						<pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
							<code>{example.code}</code>
						</pre>
						<Button
							variant="outline"
							size="sm"
							className="absolute top-2 right-2 h-6 px-2 text-xs"
							onClick={() => {
								navigator.clipboard.writeText(example.code || '');
								updateContext({
									sessionData: {
										...context.sessionData,
										[`example_${index}_copied`]: true,
									},
								});
							}}
						>
							<Eye className="h-3 w-3 mr-1" />
							Copy
						</Button>
					</div>
				)}
				{example.explanation && (
					<div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
						<p className="text-xs text-blue-700 dark:text-blue-300">
							<Lightbulb className="h-3 w-3 inline mr-1" />
							{example.explanation}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);

	// Render hints
	const renderHint = (hint: any, index: number) => {
		const hintId = `hint-${index}`;
		const isVisible = showHints.includes(hintId);

		return (
			<div key={hintId} className="mt-4">
				{!isVisible && hint.trigger !== 'auto' && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleShowHint(hintId)}
						className="text-xs"
					>
						<Lightbulb className="h-3 w-3 mr-1" />
						Show Hint
					</Button>
				)}

				{isVisible && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
					>
						<Alert className={cn(
							hint.type === 'warning' && 'border-yellow-200 bg-yellow-50',
							hint.type === 'info' && 'border-blue-200 bg-blue-50',
							hint.type === 'error' && 'border-red-200 bg-red-50',
							hint.type === 'tip' && 'border-green-200 bg-green-50'
						)}>
							<Lightbulb className="h-4 w-4" />
							<AlertDescription>
								<strong>{hint.title}:</strong> {hint.content}
							</AlertDescription>
						</Alert>
					</motion.div>
				)}
			</div>
		);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{ duration: 0.3 }}
			className={cn('space-y-4', className)}
		>
			{/* Main content */}
			<div className="prose prose-sm max-w-none">
				{step.content.type === 'instruction' && (
					<div className="text-sm leading-relaxed">{step.content.text}</div>
				)}

				{step.content.type === 'code' && (
					<div>
						<div className="text-sm leading-relaxed mb-4">{step.content.text}</div>
						{step.content.code && (
							<pre className="bg-muted p-4 rounded-md overflow-x-auto">
								<code className="text-sm">{step.content.code}</code>
							</pre>
						)}
					</div>
				)}

				{step.content.type === 'interactive' && (
					<div>
						<div className="text-sm leading-relaxed mb-4">{step.content.text}</div>
						{step.content.interactiveElements && (
							<div className="space-y-4">
								{step.content.interactiveElements.map(renderInteractiveElement)}
							</div>
						)}
					</div>
				)}

				{step.content.type === 'demonstration' && (
					<div>
						<div className="text-sm leading-relaxed mb-4">{step.content.text}</div>
						{step.content.visualAids && (
							<div className="space-y-4">
								{step.content.visualAids.map((aid, index) => (
									<div key={index} className="text-center">
										{aid.type === 'image' && (
											<img
												src={aid.src}
												alt={aid.alt}
												className="max-w-full h-auto rounded-md border"
											/>
										)}
										{aid.caption && (
											<p className="text-xs text-muted-foreground mt-2">{aid.caption}</p>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Examples */}
			{step.content.examples && step.content.examples.length > 0 && (
				<div>
					<h4 className="text-sm font-medium mb-3">Examples</h4>
					{step.content.examples.map(renderCodeExample)}
				</div>
			)}

			{/* Hints */}
			{step.hints && step.hints.length > 0 && (
				<div>
					{step.hints.map(renderHint)}
				</div>
			)}

			{/* Validation state */}
			{validationState.message && (
				<Alert className={validationState.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
					{validationState.isValid ? (
						<CheckCircle2 className="h-4 w-4" />
					) : (
						<AlertCircle className="h-4 w-4" />
					)}
					<AlertDescription>{validationState.message}</AlertDescription>
				</Alert>
			)}

			{/* Action buttons for interactive steps */}
			{step.content.type === 'interactive' && (
				<div className="flex justify-end gap-2 mt-4 pt-4 border-t">
					{step.validation && (
						<Button
							onClick={validateStep}
							disabled={validationState.isValid}
							variant={validationState.isValid ? 'default' : 'outline'}
						>
							{validationState.isValid ? (
								<>
									<CheckCircle2 className="h-4 w-4 mr-2" />
									Step Completed
								</>
							) : (
								'Validate & Continue'
							)}
						</Button>
					)}
				</div>
			)}
		</motion.div>
	);
}

/**
 * Workflow Trigger Button Component
 * Button to start workflows for tools that have guided tutorials
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Play, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { workflowManager } from '@/lib/workflows/workflow-manager';
import { useWorkflowStore } from '@/lib/workflows/workflow-store';
import { cn } from '@/lib/utils';

interface WorkflowTriggerButtonProps {
	toolId: string;
	onClick?: () => void;
	variant?: 'default' | 'outline' | 'ghost' | 'secondary';
	size?: 'sm' | 'default' | 'lg';
	className?: string;
	position?: 'inline' | 'floating';
	showBadge?: boolean;
	tooltip?: string;
}

export function WorkflowTriggerButton({
	toolId,
	onClick,
	variant = 'outline',
	size = 'default',
	className,
	position = 'inline',
	showBadge = true,
	tooltip = 'Start guided workflow',
}: WorkflowTriggerButtonProps) {
	const [workflows, setWorkflows] = React.useState<any[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const { setActiveWorkflow } = useWorkflowStore();

	// Load workflows for this tool
	React.useEffect(() => {
		const toolWorkflows = workflowManager.getWorkflowsForTool(toolId);
		setWorkflows(toolWorkflows);
	}, [toolId]);

	const handleStartWorkflow = async () => {
		if (workflows.length === 0) return;

		setIsLoading(true);

		try {
			// Get the most appropriate workflow (recommended or first)
			const workflow = workflows.find(w => w.isRecommended) || workflows[0];

			if (workflow) {
				// Start the workflow
				setActiveWorkflow(workflow);
				onClick?.();
			}
		} catch (error) {
			console.error('Failed to start workflow:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Don't render if no workflows available
	if (workflows.length === 0) {
		return null;
	}

	const getButtonContent = () => {
		switch (size) {
			case 'sm':
				return (
					<>
						<Play className="h-3 w-3 mr-1" />
						{variant !== 'ghost' && 'Guide'}
					</>
				);
			case 'lg':
				return (
					<>
						<BookOpen className="h-5 w-5 mr-2" />
						Start Guided Tutorial
						{showBadge && (
							<Badge variant="secondary" className="ml-2">
								{workflows.length}
							</Badge>
						)}
					</>
				);
			default:
				return (
					<>
						<Play className="h-4 w-4 mr-2" />
						Guided Workflow
						{showBadge && (
							<Badge variant="secondary" className="ml-2">
								{workflows.length}
							</Badge>
						)}
					</>
				);
		}
	};

	const buttonClasses = cn(
		"relative overflow-hidden group",
		position === 'floating' && "fixed bottom-4 right-4 z-40 shadow-lg",
		className
	);

	const button = (
		<motion.div
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			className={position === 'floating' ? "relative" : "inline-block"}
		>
			<Button
				onClick={handleStartWorkflow}
				disabled={isLoading}
				variant={variant}
				size={size}
				className={buttonClasses}
			>
				{isLoading ? (
					<>
						<div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
						Loading...
					</>
				) : (
					getButtonContent()
				)}

				{/* Sparkle animation */}
				{variant !== 'ghost' && (
					<motion.div
						className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
						initial={{ x: '-100%' }}
						whileHover={{ x: '100%' }}
						transition={{ duration: 0.6 }}
					/>
				)}
			</Button>

			{/* Floating badge */}
			{position === 'floating' && (
				<motion.div
					className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"
					animate={{ scale: [1, 1.2, 1] }}
					transition={{ duration: 2, repeat: Infinity }}
				/>
			)}
		</motion.div>
	);

	// Wrap with tooltip if provided
	if (tooltip) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						{button}
					</TooltipTrigger>
					<TooltipContent>
						<p>{tooltip}</p>
						{workflows.length > 1 && (
							<p className="text-xs text-muted-foreground">
								{workflows.length} workflows available
							</p>
						)}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return button;
}

/**
 * Workflow Progress Bar Component
 * Visual progress indicator for workflows
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WorkflowProgressBarProps {
	current: number;
	total: number;
	percentage: number;
	showLabels?: boolean;
	showSteps?: boolean;
	className?: string;
}

export function WorkflowProgressBar({
	current,
	total,
	percentage,
	showLabels = true,
	showSteps = true,
	className,
}: WorkflowProgressBarProps) {
	const [animatedPercentage, setAnimatedPercentage] = React.useState(0);

	// Animate progress bar
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setAnimatedPercentage(percentage);
		}, 100);
		return () => clearTimeout(timer);
	}, [percentage]);

	// Generate step indicators
	const stepIndicators = Array.from({ length: total }, (_, i) => i + 1);

	return (
		<div className={cn("space-y-2 p-4", className)}>
			{showLabels && (
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Progress</span>
					<Badge variant="secondary">
						{current} of {total}
					</Badge>
				</div>
			)}

			{/* Main progress bar */}
			<div className="space-y-1">
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					<Progress
						value={animatedPercentage}
						className="h-2"
					/>
				</motion.div>

				{/* Percentage display */}
				<div className="text-right">
					<span className="text-xs text-muted-foreground">
						{Math.round(animatedPercentage)}%
					</span>
				</div>
			</div>

			{/* Step indicators */}
			{showSteps && total > 1 && (
				<div className="flex items-center justify-between space-x-1">
					{stepIndicators.map((step, index) => (
						<motion.div
							key={step}
							className="flex-1"
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{
								delay: index * 0.1,
								duration: 0.3
							}}
						>
							<div
								className={cn(
									"h-1 rounded-full transition-all duration-300",
									step <= current
										? "bg-primary"
										: "bg-muted"
								)}
							/>
						</motion.div>
					))}
				</div>
			)}

			{/* Step names/descriptions (optional) */}
			{showLabels && total <= 5 && (
				<div className="flex justify-between text-xs text-muted-foreground">
					{stepIndicators.map((step) => (
						<span
							key={step}
							className={cn(
								"font-medium",
								step === current && "text-primary",
								step < current && "text-green-600 dark:text-green-400"
							)}
						>
							{step === current ? 'Current' : `Step ${step}`}
						</span>
					))}
				</div>
			)}
		</div>
	);
}

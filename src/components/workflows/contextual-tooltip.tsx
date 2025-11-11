/**
 * Contextual Tooltip Component
 * Smart tooltips with contextual help and suggestions
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Lightbulb, AlertTriangle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { contextualHelp } from '@/lib/workflows/contextual-help';
import { useWorkflowStore } from '@/lib/workflows/workflow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WorkflowHint, WorkflowContext } from '@/types/workflows';

interface ContextualTooltipProps {
	children: React.ReactNode;
	contextKey: string;
	elementId?: string;
	elementContent?: string;
	trigger?: 'hover' | 'click' | 'focus' | 'manual';
	position?: 'top' | 'bottom' | 'left' | 'right';
	delay?: number;
	manual?: boolean;
	className?: string;
}

export function ContextualTooltip({
	children,
	contextKey,
	elementId,
	elementContent,
	trigger = 'hover',
	position = 'top',
	delay = 500,
	manual = false,
	className,
}: ContextualTooltipProps) {
	const [isVisible, setIsVisible] = React.useState(false);
	const [hint, setHint] = React.useState<WorkflowHint | null>(null);
	const [showDelay, setShowDelay] = React.useState(false);
	const { context, trackHintView } = useWorkflowStore();
	const timeoutRef = React.useRef<NodeJS.Timeout>();

	// Get contextual hint
	React.useEffect(() => {
		const contextualHint = contextualHelp.getSmartTooltip(
			elementId || contextKey,
			context,
			elementContent
		);
		setHint(contextualHint);
	}, [contextKey, elementId, elementContent, context]);

	// Handle visibility with delay
	const showTooltip = React.useCallback(() => {
		if (manual) return;

		if (delay > 0) {
			setShowDelay(true);
			timeoutRef.current = setTimeout(() => {
				setIsVisible(true);
				setShowDelay(false);
			}, delay);
		} else {
			setIsVisible(true);
		}
	}, [delay, manual]);

	const hideTooltip = React.useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		setShowDelay(false);
		setIsVisible(false);
	}, []);

	// Track hint views
	React.useEffect(() => {
		if (isVisible && hint) {
			trackHintView(`${contextKey}-${hint.title}`);
		}
	}, [isVisible, hint, contextKey, trackHintView]);

	// Cleanup timeout
	React.useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	// Event handlers based on trigger type
	const eventHandlers = React.useMemo(() => {
		if (manual) {
			return {};
		}

		switch (trigger) {
			case 'hover':
				return {
					onMouseEnter: showTooltip,
					onMouseLeave: hideTooltip,
				};
			case 'click':
				return {
					onClick: (e: React.MouseEvent) => {
						e.preventDefault();
						e.stopPropagation();
						setIsVisible(!isVisible);
					},
				};
			case 'focus':
				return {
					onFocus: showTooltip,
					onBlur: hideTooltip,
				};
			default:
				return {};
		}
	}, [trigger, showTooltip, hideTooltip, manual, isVisible]);

	if (!hint) {
		return <>{children}</>;
	}

	const getIcon = () => {
		switch (hint.type) {
			case 'tip':
				return <Lightbulb className="h-4 w-4" />;
			case 'warning':
				return <AlertTriangle className="h-4 w-4" />;
			case 'example':
				return <HelpCircle className="h-4 w-4" />;
			default:
				return <Info className="h-4 w-4" />;
		}
	};

	const getIconColor = () => {
		switch (hint.type) {
			case 'tip':
				return 'text-blue-500';
			case 'warning':
				return 'text-orange-500';
			case 'example':
				return 'text-purple-500';
			default:
				return 'text-gray-500';
		}
	};

	const getPositionClasses = () => {
		switch (position) {
			case 'top':
				return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
			case 'bottom':
				return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
			case 'left':
				return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
			case 'right':
				return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
			default:
				return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
		}
	};

	const getArrowClasses = () => {
		switch (position) {
			case 'top':
				return 'top-full left-1/2 transform -translate-x-1/2 -mt-1';
			case 'bottom':
				return 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1';
			case 'left':
				return 'right-full top-1/2 transform -translate-y-1/2 -mr-1';
			case 'right':
				return 'left-full top-1/2 transform -translate-y-1/2 -ml-1';
			default:
				return 'top-full left-1/2 transform -translate-x-1/2 -mt-1';
		}
	};

	return (
		<div className={cn("relative inline-block", className)}>
			{/* Trigger element */}
			<div {...eventHandlers}>
				{children}
			</div>

			{/* Loading indicator */}
			{showDelay && (
				<div className={cn("absolute z-50", getPositionClasses())}>
					<div className="bg-background border rounded-md px-2 py-1 text-xs text-muted-foreground">
						Loading...
					</div>
				</div>
			)}

			{/* Tooltip content */}
			<AnimatePresence>
				{isVisible && hint && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className={cn(
							"absolute z-50 w-80",
							getPositionClasses()
						)}
					>
						{/* Arrow */}
						<div className={cn("absolute w-0 h-0", getArrowClasses())}>
							<div className={cn(
								"border-4 border-transparent",
								position === 'top' && "border-t-background",
								position === 'bottom' && "border-b-background",
								position === 'left' && "border-l-background",
								position === 'right' && "border-r-background"
							)} />
						</div>

						<Card className="shadow-lg border-2 bg-background/95 backdrop-blur-sm">
							<CardContent className="p-4">
								{/* Header */}
								<div className="flex items-start space-x-3">
									<div className={cn("mt-0.5", getIconColor())}>
										{getIcon()}
									</div>

									<div className="flex-1 min-w-0">
										{/* Title */}
										<h4 className="text-sm font-semibold text-foreground leading-tight">
											{hint.title}
										</h4>

										{/* Content */}
										<p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">
											{hint.content}
										</p>

										{/* Badge */}
										<div className="mt-2">
											<Badge
												variant="outline"
												className={cn(
													"text-xs",
													hint.type === 'tip' && "border-blue-200 text-blue-600",
													hint.type === 'warning' && "border-orange-200 text-orange-600",
													hint.type === 'example' && "border-purple-200 text-purple-600"
												)}
											>
												{hint.type}
											</Badge>
										</div>
									</div>

									{/* Close button */}
									{trigger === 'click' && (
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												setIsVisible(false);
											}}
											className="h-6 w-6 p-0 -mr-1 -mt-1"
										>
											×
										</Button>
									)}
								</div>

								{/* Action buttons for certain hint types */}
								{hint.type === 'example' && (
									<div className="mt-3 pt-3 border-t">
										<Button
											variant="outline"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												navigator.clipboard.writeText(hint.content);
											}}
											className="text-xs"
										>
											Copy Example
										</Button>
									</div>
								)}
							</CardContent>
						</Card>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import type {
	HelpContent,
	HelpContext,
	UserHelpProfile,
	HelpDeliveryMethod
} from '@/types/help-system';

interface ContextAwareTooltipProps {
	children: React.ReactNode;
	content: HelpContent;
	context: HelpContext;
	userProfile: UserHelpProfile;
	onInteraction?: (action: string, duration: number) => void;
	delay?: number;
	maxWidth?: number;
	placement?: 'top' | 'bottom' | 'left' | 'right';
	ariaLabel?: string;
	className?: string;
}

/**
 * Enhanced tooltip component with context-aware help content
 * Supports progressive disclosure based on user expertise level
 */
export function ContextAwareTooltip({
	children,
	content,
	context,
	userProfile,
	onInteraction,
	delay = 500,
	maxWidth = 300,
	placement = 'top',
	ariaLabel,
	className,
}: ContextAwareTooltipProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const openStartTime = useRef<number>();
	const timeoutRef = useRef<NodeJS.Timeout>();

	// Determine if user should see this help content
	const shouldShowHelp = shouldShowHelpForUser(content, userProfile, context);

	// Get appropriate content based on user expertise
	const displayContent = getProgressiveContent(content, userProfile.expertiseLevel);

	const handleOpen = useCallback(() => {
		if (!shouldShowHelp) return;

		timeoutRef.current = setTimeout(() => {
			setIsOpen(true);
			openStartTime.current = Date.now();
			onInteraction?.('viewed', 0);
		}, delay);
	}, [shouldShowHelp, delay, onInteraction]);

	const handleClose = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		if (isOpen && openStartTime.current) {
			const duration = Date.now() - openStartTime.current;
			onInteraction?.('completed', duration);
		}

		setIsOpen(false);
		setIsExpanded(false);
	}, [isOpen, onInteraction]);

	const handleExpand = useCallback(() => {
		setIsExpanded(true);
	}, []);

	const handleCollapse = useCallback(() => {
		setIsExpanded(false);
	}, []);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	// Don't render if user shouldn't see this help
	if (!shouldShowHelp) {
		return <>{children}</>;
	}

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip open={isOpen} onOpenChange={setIsOpen}>
				<TooltipTrigger asChild>
					<div
						onMouseEnter={handleOpen}
						onMouseLeave={handleClose}
						onFocus={handleOpen}
						onBlur={handleClose}
						className={cn('inline-block', className)}
					>
						{children}
					</div>
				</TooltipTrigger>

				<TooltipPortal>
					<TooltipContent
						side={placement}
						align="center"
						sideOffset={8}
						className={cn(
							'z-50 overflow-hidden rounded-lg border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg',
							'max-w-xs animate-in fade-in-0 zoom-in-95',
							'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
							'transition-all duration-200 ease-out'
						)}
						style={{ maxWidth }}
					>
						<div className="space-y-2">
							{/* Header with title and controls */}
							<div className="flex items-start justify-between gap-2">
								<div className="flex items-center gap-2">
									<h4 className="font-semibold text-sm leading-tight">
										{displayContent.title}
									</h4>
									{content.priority === 'critical' && (
										<span className="inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
											Important
										</span>
									)}
								</div>

								{displayContent.content.length > 1 && (
									<button
										onClick={isExpanded ? handleCollapse : handleExpand}
										className="text-xs text-muted-foreground hover:text-foreground transition-colors"
										aria-label={isExpanded ? 'Show less' : 'Show more'}
									>
										{isExpanded ? 'Show less' : 'Show more'}
									</button>
								)}
							</div>

							{/* Progressive content display */}
							<div className="space-y-2">
								{displayContent.content
									.slice(0, isExpanded ? displayContent.content.length : 1)
									.map((paragraph, index) => (
										<p
											key={index}
											className={cn(
												'text-sm leading-relaxed',
												index === 0 ? 'text-foreground' : 'text-muted-foreground'
											)}
										>
											{paragraph}
										</p>
									))}
							</div>

							{/* Action buttons and metadata */}
							<div className="flex items-center justify-between pt-2 border-t border-border/50">
								<div className="flex items-center gap-2">
									{displayContent.categories.map((category) => (
										<span
											key={category}
											className="inline-flex items-center rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
										>
											{formatCategory(category)}
										</span>
									))}
								</div>

								<div className="flex items-center gap-1">
									{displayContent.metadata.links && displayContent.metadata.links.length > 0 && (
										<button
											onClick={() => window.open(displayContent.metadata.links![0].url, '_blank')}
											className="text-xs text-muted-foreground hover:text-primary transition-colors"
											aria-label="Learn more"
										>
											Learn more →
										</button>
									)}

									<button
										onClick={() => {
											onInteraction?.('dismissed', isOpen ? Date.now() - (openStartTime.current || Date.now()) : 0);
											handleClose();
										}}
										className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-2"
										aria-label="Dismiss"
									>
										Dismiss
									</button>
								</div>
							</div>

							{/* Read time indicator */}
							{displayContent.metadata.estimatedReadTime > 0 && (
								<div className="text-xs text-muted-foreground">
									{displayContent.metadata.estimatedReadTime} min read
								</div>
							)}
						</div>
					</TooltipContent>
				</TooltipPortal>
			</Tooltip>
		</TooltipProvider>
	);
}

/**
 * Determine if help content should be shown to user
 */
function shouldShowHelpForUser(
	content: HelpContent,
	profile: UserHelpProfile,
	context: HelpContext
): boolean {
	// Check if user has already dismissed this help
	if (profile.skippedHelp.has(content.id)) {
		return false;
	}

	// Check if user has recently viewed this help
	const recentView = profile.helpInteractions.find(
		interaction =>
			interaction.helpId === content.id &&
			interaction.action === 'viewed' &&
			Date.now() - interaction.timestamp.getTime() < 24 * 60 * 60 * 1000 // 24 hours
	);

	if (recentView && content.priority !== 'critical') {
		return false;
	}

	// Check audience match
	if (!content.targetAudience.includes(profile.expertiseLevel)) {
		// Allow beginners to see intermediate help for critical content
		if (!(profile.expertiseLevel === 'beginner' &&
			  content.targetAudience.includes('intermediate') &&
			  content.priority === 'high')) {
			return false;
		}
	}

	return true;
}

/**
 * Get progressive content based on user expertise level
 */
function getProgressiveContent(content: HelpContent, expertiseLevel: string): HelpContent {
	const baseContent = { ...content };

	// For beginners, simplify content
	if (expertiseLevel === 'beginner') {
		// Show only the first paragraph initially
		if (content.content.length > 1) {
			baseContent.content = [content.content[0]];
		}

		// Filter out advanced categories
		baseContent.categories = content.categories.filter(
			category => !['advanced-topics', 'best-practices'].includes(category)
		);
	}

	// For advanced users, show all content immediately
	if (expertiseLevel === 'advanced' || expertiseLevel === 'expert') {
		// Include all content and advanced links
		if (content.metadata.codeExamples) {
			baseContent.content.push(
				`## Code Examples\\n${content.metadata.codeExamples.join('\\n\\n')}`
			);
		}
	}

	return baseContent;
}

/**
 * Format category names for display
 */
function formatCategory(category: string): string {
	return category
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Simple tooltip provider wrapper
 */
const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Tooltip portal for proper z-index handling
 */
const TooltipPortal = TooltipPrimitive.Portal;

export default ContextAwareTooltip;

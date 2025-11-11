'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Spotlight, ArrowRight, SkipForward, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type {
	HelpContent,
	HelpContext,
	UserHelpProfile,
	HelpInteraction
} from '@/types/help-system';

interface HelpOverlayProps {
	isActive: boolean;
	content: HelpContent;
	targetSelector: string;
	context: HelpContext;
	userProfile: UserHelpProfile;
	onComplete: () => void;
	onSkip: () => void;
	onInteraction?: (interaction: Omit<HelpInteraction, 'id' | 'timestamp' | 'sessionId'>) => void;
	position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
	offset?: number;
	className?: string;
}

/**
 * Overlay component for spotlight-style help and guided tours
 * Highlights specific UI elements and provides contextual help
 */
export function HelpOverlay({
	isActive,
	content,
	targetSelector,
	context,
	userProfile,
	onComplete,
	onSkip,
	onInteraction,
	position = 'top',
	offset = 10,
	className,
}: HelpOverlayProps) {
	const [targetElement, setTargetElement] = useState<Element | null>(null);
	const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
	const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 0 });
	const [isAnimating, setIsAnimating] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const overlayRef = useRef<HTMLDivElement>(null);
	const startTime = useRef<number>(Date.now());

	// Find and highlight target element
	useEffect(() => {
		if (!isActive || !targetSelector) return;

		const element = document.querySelector(targetSelector);
		if (element) {
			setTargetElement(element);
			const rect = element.getBoundingClientRect();
			setHighlightRect(rect);
			calculateOverlayPosition(rect);
		}

		return () => {
			setTargetElement(null);
			setHighlightRect(null);
		};
	}, [isActive, targetSelector]);

	// Handle window resize
	useEffect(() => {
		if (!targetElement || !isActive) return;

		const handleResize = () => {
			const rect = targetElement.getBoundingClientRect();
			setHighlightRect(rect);
			calculateOverlayPosition(rect);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [targetElement, isActive]);

	// Handle scroll
	useEffect(() => {
		if (!targetElement || !isActive) return;

		const handleScroll = () => {
			const rect = targetElement.getBoundingClientRect();
			setHighlightRect(rect);
			calculateOverlayPosition(rect);
		};

		window.addEventListener('scroll', handleScroll, true);
		return () => window.removeEventListener('scroll', handleScroll, true);
	}, [targetElement, isActive]);

	// Calculate overlay position based on target element and preferred position
	const calculateOverlayPosition = (rect: DOMRect) => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const overlayWidth = Math.min(400, viewportWidth - 40);
		const overlayHeight = 200; // Estimated height

		let top = 0;
		let left = 0;

		switch (position) {
			case 'top':
				top = rect.top - overlayHeight - offset;
				left = rect.left + (rect.width - overlayWidth) / 2;
				break;

			case 'bottom':
				top = rect.bottom + offset;
				left = rect.left + (rect.width - overlayWidth) / 2;
				break;

			case 'left':
				top = rect.top + (rect.height - overlayHeight) / 2;
				left = rect.left - overlayWidth - offset;
				break;

			case 'right':
				top = rect.top + (rect.height - overlayHeight) / 2;
				left = rect.right + offset;
				break;

			case 'center':
				top = (viewportHeight - overlayHeight) / 2;
				left = (viewportWidth - overlayWidth) / 2;
				break;
		}

		// Ensure overlay stays within viewport bounds
		left = Math.max(10, Math.min(left, viewportWidth - overlayWidth - 10));
		top = Math.max(10, Math.min(top, viewportHeight - overlayHeight - 10));

		setOverlayPosition({ top, left, width: overlayWidth });
	};

	// Handle completion
	const handleComplete = () => {
		const duration = Date.now() - startTime.current;
		onInteraction?.({
			helpId: content.id,
			contextId: context.id,
			deliveryMethod: 'overlay',
			action: 'completed',
			duration,
		});
		onComplete();
	};

	// Handle skip
	const handleSkip = () => {
		const duration = Date.now() - startTime.current;
		onInteraction?.({
			helpId: content.id,
			contextId: context.id,
			deliveryMethod: 'overlay',
			action: 'dismissed',
			duration,
		});
		onSkip();
	};

	// Handle interaction with target element
	const handleTargetClick = () => {
		if (targetElement && targetElement instanceof HTMLElement) {
			targetElement.focus();
			targetElement.click();
		}
	};

	if (!isActive || !highlightRect) return null;

	return (
		<div className="fixed inset-0 z-50 pointer-events-none">
			{/* Backdrop */}
			<div
				className={cn(
					'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
					isActive ? 'opacity-100' : 'opacity-0'
				)}
			/>

			{/* Highlight area */}
			<div
				className={cn(
					'absolute border-2 border-primary rounded-lg shadow-2xl transition-all duration-300',
					'animate-pulse pointer-events-auto',
					isAnimating && 'ring-4 ring-primary/30'
				)}
				style={{
					top: highlightRect.top - 4,
					left: highlightRect.left - 4,
					width: highlightRect.width + 8,
					height: highlightRect.height + 8,
				}}
			>
				{/* Spotlight indicator */}
				<div className="absolute -top-8 -right-8 bg-primary text-primary-foreground rounded-full p-2">
					<Spotlight className="h-4 w-4" />
				</div>
			</div>

			{/* Help content overlay */}
			<div
				ref={overlayRef}
				className={cn(
					'absolute bg-background border rounded-lg shadow-2xl p-6 pointer-events-auto',
					'transition-all duration-300 transform',
					isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
					className
				)}
				style={{
					top: overlayPosition.top,
					left: overlayPosition.left,
					width: overlayPosition.width,
				}}
			>
				{/* Header */}
				<div className="flex items-start justify-between gap-4 mb-4">
					<div className="flex-1 space-y-2">
						<div className="flex items-center gap-2">
							<h3 className="text-lg font-semibold">{content.title}</h3>
							{content.priority === 'critical' && (
								<Badge variant="destructive" className="text-xs">
									Important
								</Badge>
							)}
						</div>

						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							{content.categories.map(category => (
								<Badge key={category} variant="secondary" className="text-xs">
									{formatCategory(category)}
								</Badge>
							))}
							{content.metadata.estimatedReadTime > 0 && (
								<span>{content.metadata.estimatedReadTime} min</span>
							)}
						</div>
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={handleSkip}
						className="h-8 w-8 p-0"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Content */}
				<div className="space-y-4 mb-6">
					<p className="text-sm leading-relaxed">
						{content.description}
					</p>

					{content.content.length > 0 && (
						<div className="space-y-2">
							{content.content
								.slice(0, 2) // Show first 2 paragraphs in overlay
								.map((paragraph, index) => (
									<p key={index} className="text-sm text-muted-foreground">
										{paragraph}
									</p>
								))}
						</div>
					)}

					{/* Interactive hint */}
					<div className="bg-accent/50 rounded-md p-3 text-sm">
						<div className="flex items-center gap-2 text-primary">
							<ArrowRight className="h-4 w-4" />
							<span className="font-medium">Try it yourself:</span>
						</div>
						<p className="text-xs mt-1 text-muted-foreground">
							Click on the highlighted element to continue
						</p>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-between gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={handleSkip}
					>
						<SkipForward className="h-4 w-4 mr-1" />
						Skip
					</Button>

					<div className="flex items-center gap-2">
						{content.metadata.links && content.metadata.links.length > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => window.open(content.metadata.links![0].url, '_blank')}
							>
								Learn more
							</Button>
						)}

						<Button
							size="sm"
							onClick={handleComplete}
							className="min-w-[80px]"
						>
							<Play className="h-4 w-4 mr-1" />
							Got it
						</Button>
					</div>
				</div>

				{/* Progress indicator (for multi-step tours) */}
				{currentStep > 0 && (
					<div className="mt-4 pt-4 border-t">
						<div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
							<span>Step {currentStep} of 3</span>
							<span>{Math.round((currentStep / 3) * 100)}% complete</span>
						</div>
						<Progress value={(currentStep / 3) * 100} className="h-1" />
					</div>
				)}
			</div>

			{/* Click handler for target element */}
			{targetElement && (
				<div
					className="absolute inset-0 pointer-events-auto"
					style={{
						top: highlightRect.top,
						left: highlightRect.left,
						width: highlightRect.width,
						height: highlightRect.height,
					}}
					onClick={handleTargetClick}
				/>
			)}
		</div>
	);
}

/**
 * Guided tour overlay for multi-step tutorials
 */
export function GuidedTourOverlay({
	isActive,
	steps,
	currentStepIndex,
	context,
	userProfile,
	onNext,
	onPrevious,
	onComplete,
	onSkip,
}: {
	isActive: boolean;
	steps: HelpContent[];
	currentStepIndex: number;
	context: HelpContext;
	userProfile: UserHelpProfile;
	onNext: () => void;
	onPrevious: () => void;
	onComplete: () => void;
	onSkip: () => void;
}) {
	const currentStep = steps[currentStepIndex];

	if (!isActive || !currentStep) return null;

	const hasNext = currentStepIndex < steps.length - 1;
	const hasPrevious = currentStepIndex > 0;

	return (
		<HelpOverlay
			isActive={isActive}
			content={currentStep}
			targetSelector={currentStep.metadata.searchableText.match(/selector:(.+)$/)?.[1] || ''}
			context={context}
			userProfile={userProfile}
			onComplete={hasNext ? onNext : onComplete}
			onSkip={onSkip}
			position="bottom"
			className="max-w-md"
		>
			{/* Navigation controls */}
			<div className="flex items-center justify-between mt-4 pt-4 border-t">
				<div className="flex items-center gap-2">
					{hasPrevious && (
						<Button variant="outline" size="sm" onClick={onPrevious}>
							Previous
						</Button>
					)}
				</div>

				<div className="text-xs text-muted-foreground">
					{currentStepIndex + 1} of {steps.length}
				</div>

				<div className="flex items-center gap-2">
					{hasNext ? (
						<Button size="sm" onClick={onNext}>
							Next
						</Button>
					) : (
						<Button size="sm" onClick={onComplete}>
							Complete Tour
						</Button>
					)}
				</div>
			</div>
		</HelpOverlay>
	);
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

export default HelpOverlay;

'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronLeft, ChevronRight, Bookmark, Share2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type {
	HelpContent,
	HelpContext,
	UserHelpProfile,
	HelpInteraction
} from '@/types/help-system';

interface HelpModalProps {
	content: HelpContent | HelpContent[];
	context: HelpContext;
	userProfile: UserHelpProfile;
	onClose: () => void;
	onInteraction?: (interaction: Omit<HelpInteraction, 'id' | 'timestamp' | 'sessionId'>) => void;
	onNavigate?: (direction: 'prev' | 'next') => void;
	hasPrevious?: boolean;
	hasNext?: boolean;
}

/**
 * Modal component for displaying detailed help content
 * Supports multiple content items, navigation, and user interactions
 */
export function HelpModal({
	content,
	context,
	userProfile,
	onClose,
	onInteraction,
	onNavigate,
	hasPrevious = false,
	hasNext = false,
}: HelpModalProps) {
	const [currentContentIndex, setCurrentContentIndex] = useState(0);
	const [isBookmarked, setIsBookmarked] = useState(false);
	const [showFeedback, setShowFeedback] = useState(false);
	const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
	const [feedbackText, setFeedbackText] = useState('');
	const modalRef = useRef<HTMLDivElement>(null);
	const startTime = useRef<number>(Date.now());

	const contentArray = Array.isArray(content) ? content : [content];
	const currentContent = contentArray[currentContentIndex];

	// Check if current content is bookmarked
	useEffect(() => {
		setIsBookmarked(userProfile.bookmarkedHelp.has(currentContent.id));
	}, [currentContent.id, userProfile.bookmarkedHelp]);

	// Track view duration on close
	const handleClose = () => {
		const duration = Date.now() - startTime.current;
		onInteraction?.({
			helpId: currentContent.id,
			contextId: context.id,
			deliveryMethod: 'modal',
			action: 'viewed',
			duration,
			rating: feedbackRating,
			feedback: feedbackText || undefined,
		});
		onClose();
	};

	// Handle content navigation
	const handlePrevious = () => {
		if (currentContentIndex > 0) {
			setCurrentContentIndex(currentContentIndex - 1);
			onNavigate?.('prev');
		}
	};

	const handleNext = () => {
		if (currentContentIndex < contentArray.length - 1) {
			setCurrentContentIndex(currentContentIndex + 1);
			onNavigate?.('next');
		}
	};

	// Handle bookmark toggle
	const handleBookmark = () => {
		setIsBookmarked(!isBookmarked);
		onInteraction?.({
			helpId: currentContent.id,
			contextId: context.id,
			deliveryMethod: 'modal',
			action: isBookmarked ? 'unbookmarked' : 'bookmarked',
			duration: Date.now() - startTime.current,
		});
	};

	// Handle share functionality
	const handleShare = async () => {
		const shareData = {
			title: currentContent.title,
			text: currentContent.description,
			url: window.location.href,
		};

		try {
			if (navigator.share) {
				await navigator.share(shareData);
			} else {
				await navigator.clipboard.writeText(window.location.href);
				// Show toast notification (implementation needed)
			}

			onInteraction?.({
				helpId: currentContent.id,
				contextId: context.id,
				deliveryMethod: 'modal',
				action: 'shared',
				duration: Date.now() - startTime.current,
			});
		} catch (error) {
			console.error('Error sharing:', error);
		}
	};

	// Handle feedback submission
	const handleFeedbackSubmit = () => {
		onInteraction?.({
			helpId: currentContent.id,
			contextId: context.id,
			deliveryMethod: 'modal',
			action: 'completed',
			duration: Date.now() - startTime.current,
			rating: feedbackRating || undefined,
			feedback: feedbackText || undefined,
		});
		setShowFeedback(false);
	};

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			switch (event.key) {
				case 'ArrowLeft':
					if (hasPrevious) handlePrevious();
					break;
				case 'ArrowRight':
					if (hasNext) handleNext();
					break;
				case 'Escape':
					handleClose();
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [hasPrevious, hasNext]);

	return (
		<Dialog.Root open onOpenChange={(open) => !open && handleClose()}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

				<Dialog.Content
					ref={modalRef}
					className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] md:w-full rounded-lg"
				>
					{/* Header */}
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1 space-y-2">
							<Dialog.Title className="text-xl font-semibold leading-tight">
								{currentContent.title}
							</Dialog.Title>

							<div className="flex items-center gap-2 flex-wrap">
								{currentContent.categories.map((category) => (
									<Badge key={category} variant="secondary" className="text-xs">
										{formatCategory(category)}
									</Badge>
								))}

								{currentContent.priority === 'critical' && (
									<Badge variant="destructive" className="text-xs">
										Critical
									</Badge>
								)}

								<span className="text-xs text-muted-foreground">
									{currentContent.metadata.estimatedReadTime} min read
								</span>
							</div>
						</div>

						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleBookmark}
								className="h-8 w-8 p-0"
								aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
							>
								<Bookmark
									className={cn(
										'h-4 w-4',
										isBookmarked && 'fill-current text-primary'
									)}
								/>
							</Button>

							<Button
								variant="ghost"
								size="sm"
								onClick={handleShare}
								className="h-8 w-8 p-0"
								aria-label="Share help content"
							>
								<Share2 className="h-4 w-4" />
							</Button>

							<Dialog.Close asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0"
									aria-label="Close help modal"
								>
									<X className="h-4 w-4" />
								</Button>
							</Dialog.Close>
						</div>
					</div>

					{/* Content */}
					<ScrollArea className="flex-1 max-h-[60vh]">
						<div className="space-y-4 pr-4">
							<p className="text-muted-foreground leading-relaxed">
								{currentContent.description}
							</p>

							{currentContent.content.map((paragraph, index) => (
								<div key={index} className="prose prose-sm max-w-none">
									{renderContentSection(paragraph, index)}
								</div>
							))}

							{/* Code examples */}
							{currentContent.metadata.codeExamples &&
							 currentContent.metadata.codeExamples.length > 0 && (
								<div className="space-y-3">
									<h4 className="text-sm font-medium">Code Examples</h4>
									{currentContent.metadata.codeExamples.map((example, index) => (
										<pre
											key={index}
											className="rounded-md bg-muted p-3 text-xs overflow-x-auto"
										>
											<code>{example}</code>
										</pre>
									))}
								</div>
							)}

							{/* Related links */}
							{currentContent.metadata.links &&
							 currentContent.metadata.links.length > 0 && (
								<div className="space-y-3">
									<h4 className="text-sm font-medium">Related Resources</h4>
									<div className="space-y-2">
										{currentContent.metadata.links.map((link, index) => (
											<a
												key={index}
												href={link.url}
												target={link.external ? '_blank' : '_self'}
												rel={link.external ? 'noopener noreferrer' : ''}
												className="flex items-center gap-2 text-sm text-primary hover:underline"
											>
												{link.title}
												{link.external && (
													<span className="text-xs text-muted-foreground">(external)</span>
												)}
											</a>
										))}
									</div>
								</div>
							)}

							{/* Related help */}
							{currentContent.relatedHelpIds.length > 0 && (
								<div className="space-y-3">
									<h4 className="text-sm font-medium">Related Help</h4>
									<div className="flex flex-wrap gap-2">
										{currentContent.relatedHelpIds.map((helpId, index) => (
											<Badge
												key={helpId}
												variant="outline"
												className="text-xs cursor-pointer hover:bg-accent"
											>
												{helpId}
											</Badge>
										))}
									</div>
								</div>
							)}
						</div>
					</ScrollArea>

					{/* Navigation and Feedback */}
					<div className="flex items-center justify-between pt-4 border-t">
						<div className="flex items-center gap-2">
							{contentArray.length > 1 && (
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={handlePrevious}
										disabled={currentContentIndex === 0}
									>
										<ChevronLeft className="h-4 w-4 mr-1" />
										Previous
									</Button>

									<span className="text-sm text-muted-foreground">
										{currentContentIndex + 1} of {contentArray.length}
									</span>

									<Button
										variant="outline"
										size="sm"
										onClick={handleNext}
										disabled={currentContentIndex === contentArray.length - 1}
									>
										Next
										<ChevronRight className="h-4 w-4 ml-1" />
									</Button>
								</div>
							)}
						</div>

						<div className="flex items-center gap-2">
							{!showFeedback ? (
								<>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowFeedback(true)}
										className="text-muted-foreground"
									>
										<ThumbsUp className="h-4 w-4 mr-1" />
										Helpful?
									</Button>
								</>
							) : (
								<div className="flex items-center gap-2">
									<Button
										variant={feedbackRating === 1 ? 'default' : 'ghost'}
										size="sm"
										onClick={() => setFeedbackRating(1)}
									>
										<ThumbsUp className="h-4 w-4 mr-1" />
										Yes
									</Button>

									<Button
										variant={feedbackRating === 0 ? 'default' : 'ghost'}
										size="sm"
										onClick={() => setFeedbackRating(0)}
									>
										<ThumbsDown className="h-4 w-4 mr-1" />
										No
									</Button>

									{feedbackRating !== null && (
										<Button
											variant="ghost"
											size="sm"
											onClick={handleFeedbackSubmit}
										>
											Submit
										</Button>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Feedback text area */}
					{showFeedback && feedbackRating === 0 && (
						<div className="space-y-2">
							<textarea
								value={feedbackText}
								onChange={(e) => setFeedbackText(e.target.value)}
								placeholder="How could we improve this help content?"
								className="w-full p-2 text-sm border rounded-md resize-none h-20"
								rows={3}
							/>
						</div>
					)}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

/**
 * Render content sections with support for markdown-like syntax
 */
function renderContentSection(content: string, index: number): React.ReactNode {
	// Simple markdown parsing (in production, use a proper markdown library)
	if (content.startsWith('## ')) {
		return (
			<h3 key={index} className="text-base font-semibold mt-4 mb-2">
				{content.slice(3)}
			</h3>
		);
	}

	if (content.startsWith('### ')) {
		return (
			<h4 key={index} className="text-sm font-medium mt-3 mb-1">
				{content.slice(4)}
			</h4>
		);
	}

	if (content.startsWith('- ') || content.startsWith('* ')) {
		const items = content.split('\\n').filter(line =>
			line.trim().startsWith('- ') || line.trim().startsWith('* ')
		);
		return (
			<ul key={index} className="list-disc list-inside space-y-1 my-2">
				{items.map((item, itemIndex) => (
					<li key={itemIndex} className="text-sm">
						{item.trim().slice(2)}
					</li>
				))}
			</ul>
		);
	}

	if (content.startsWith('1. ')) {
		const items = content.split('\\n').filter(line => /^\\d+\\.\\s/.test(line));
		return (
			<ol key={index} className="list-decimal list-inside space-y-1 my-2">
				{items.map((item, itemIndex) => (
					<li key={itemIndex} className="text-sm">
						{item.trim().slice(item.trim().indexOf('.') + 1)}
					</li>
				))}
			</ol>
		);
	}

	return (
		<p key={index} className="text-sm leading-relaxed my-2">
			{content}
		</p>
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

export default HelpModal;

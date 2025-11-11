/**
 * Accessible Button Component
 * Enhanced button with comprehensive keyboard navigation and accessibility features
 */

'use client';

import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { Button, ButtonProps } from './button';
import { FocusableItem } from './focusable-item';
import { useKeyboardAnnouncements } from '@/hooks/use-keyboard-navigation';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends Omit<ButtonProps, 'ref'> {
	shortcut?: {
		key: string;
		modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean };
		description?: string;
	};
	announcement?: {
		onClick?: string;
	 onFocus?: string;
		onHover?: string;
	};
	ariaDescribedBy?: string;
	ariaLabelledBy?: string;
	expanded?: boolean;
	pressed?: boolean;
	autoFocus?: boolean;
	showFocusRing?: boolean;
	onFocusVisibleChange?: (visible: boolean) => void;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
	(
		{
			children,
			shortcut,
			announcement,
			ariaDescribedBy,
			ariaLabelledBy,
			expanded,
			pressed,
			autoFocus = false,
			showFocusRing = true,
			onFocusVisibleChange,
			onClick,
			onFocus,
			onMouseEnter,
			className,
			...props
		},
		ref
	) => {
		const buttonRef = useRef<HTMLButtonElement>(null);
		const mergedRef = (ref || buttonRef) as React.RefObject<HTMLButtonElement>;
		const [focusVisible, setFocusVisible] = useState(false);
		const { announce } = useKeyboardAnnouncements();

		// Auto-focus if requested
		useEffect(() => {
			if (autoFocus && mergedRef.current) {
				mergedRef.current.focus();
			}
		}, [autoFocus, mergedRef]);

		// Announce interactions
		const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
			if (announcement?.onClick) {
				announce(announcement.onClick);
			}
			onClick?.(event);
		};

		const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
			if (announcement?.onFocus) {
				announce(announcement.onFocus);
			}
			onFocus?.(event);
		};

		const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
			if (announcement?.onHover) {
				announce(announcement.onHover, 'polite');
			}
			onMouseEnter?.(event);
		};

		// Focus visible detection
		const handleFocusVisibleChange = (visible: boolean) => {
			setFocusVisible(visible);
			onFocusVisibleChange?.(visible);
		};

		// Generate aria attributes
		const ariaAttributes: Record<string, any> = {};
		if (ariaDescribedBy) ariaAttributes['aria-describedby'] = ariaDescribedBy;
		if (ariaLabelledBy) ariaAttributes['aria-labelledby'] = ariaLabelledBy;
		if (expanded !== undefined) ariaAttributes['aria-expanded'] = expanded;
		if (pressed !== undefined) ariaAttributes['aria-pressed'] = pressed;

		return (
			<div className="relative inline-block">
				<FocusableItem
					ref={mergedRef}
					className={cn(
						// Enhanced focus styles
						showFocusRing && focusVisible && [
							'ring-2 ring-blue-500 ring-offset-2',
							'dark:ring-blue-400 dark:ring-offset-gray-900'
						],
						className
					)}
					onFocusVisibleChange={handleFocusVisibleChange}
					onClick={handleClick}
					onFocus={handleFocus}
					onMouseEnter={handleMouseEnter}
					{...ariaAttributes}
					{...props}
				>
					{children}
				</FocusableItem>

				{/* Keyboard shortcut hint */}
				{shortcut && (
					<div
						className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-md font-mono opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity"
						aria-hidden="true"
					>
						{shortcut.key}
					</div>
				)}
			</div>
		);
	}
);

AccessibleButton.displayName = 'AccessibleButton';

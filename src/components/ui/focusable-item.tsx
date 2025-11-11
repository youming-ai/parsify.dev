/**
 * Focusable Item Component
 * Enhanced focusable element with proper ARIA attributes and visual indicators
 */

'use client';

import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FocusableItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	selected?: boolean;
	disabled?: boolean;
	focusVisible?: boolean;
	onFocusVisibleChange?: (visible: boolean) => void;
	children: React.ReactNode;
	as?: keyof JSX.IntrinsicElements;
}

export const FocusableItem = forwardRef<HTMLButtonElement, FocusableItemProps>(
	(
		{
			selected,
			disabled,
			focusVisible: propFocusVisible,
			onFocusVisibleChange,
			className,
			children,
			as: Component = 'button',
			onFocus,
			onBlur,
			onKeyDown,
			onClick,
			...props
		},
		ref
	) => {
		const internalRef = useRef<HTMLButtonElement>(null);
	 const mergedRef = (ref || internalRef) as React.RefObject<HTMLButtonElement>;
		const [focusVisible, setFocusVisible] = useState(false);
		const [isPressed, setIsPressed] = useState(false);

		const actualFocusVisible = propFocusVisible !== undefined ? propFocusVisible : focusVisible;

		// Handle focus visibility detection
		useEffect(() => {
			const element = mergedRef.current;
			if (!element) return;

			const handleMouseDown = () => {
				setFocusVisible(false);
			};

			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.key === 'Tab') {
					setFocusVisible(true);
				}
			};

			const handleFocus = () => {
				// Only show focus ring if keyboard navigation is detected
				if (document.activeElement === element) {
					const wasKeyboardTriggered = event && event.type === 'keydown';
					setFocusVisible(wasKeyboardTriggered);
				}
			};

			const handleBlur = () => {
				setFocusVisible(false);
			};

			element.addEventListener('mousedown', handleMouseDown);
			element.addEventListener('keydown', handleKeyDown);
			element.addEventListener('focus', handleFocus);
			element.addEventListener('blur', handleBlur);

			return () => {
				element.removeEventListener('mousedown', handleMouseDown);
				element.removeEventListener('keydown', handleKeyDown);
				element.removeEventListener('focus', handleFocus);
				element.removeEventListener('blur', handleBlur);
			};
		}, [mergedRef]);

		// Notify parent of focus visibility changes
		useEffect(() => {
			onFocusVisibleChange?.(actualFocusVisible);
		}, [actualFocusVisible, onFocusVisibleChange]);

		const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
			// Handle space and enter for activation
			if ((event.key === ' ' || event.key === 'Enter') && !disabled) {
				event.preventDefault();
				onClick?.(event as any);
			}
			onKeyDown?.(event);
		};

		const handleMouseDown = () => {
			if (!disabled) {
				setIsPressed(true);
			}
		};

		const handleMouseUp = () => {
			setIsPressed(false);
		};

		const handleMouseLeave = () => {
			setIsPressed(false);
		};

		const commonProps = {
			ref: mergedRef,
			disabled,
			'data-selected': selected ? 'true' : undefined,
			'data-focus-visible': actualFocusVisible ? 'true' : undefined,
			'data-pressed': isPressed ? 'true' : undefined,
			'aria-selected': selected,
			'aria-disabled': disabled,
			className: cn(
				'relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
				'focus:outline-none',
				// Focus ring - only visible when keyboard navigation is detected
				actualFocusVisible && 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
				// Selected state
				selected && 'bg-blue-100 text-blue-900 border-blue-200',
				// Disabled state
				disabled && 'opacity-50 cursor-not-allowed',
				// Hover state
				!disabled && !selected && 'hover:bg-gray-100 hover:text-gray-900',
				// Active state
				isPressed && 'scale-95',
				className
			),
			onKeyDown: handleKeyDown,
			onMouseDown: handleMouseDown,
			onMouseUp: handleMouseUp,
			onMouseLeave: handleMouseLeave,
			onFocus,
			onBlur,
			onClick,
			...props,
		};

		if (Component === 'button') {
			return <button type="button" {...commonProps}>{children}</button>;
		}

		const Element = Component as any;
		return <Element role="button" tabIndex={disabled ? -1 : 0} {...commonProps}>{children}</Element>;
	}
);

FocusableItem.displayName = 'FocusableItem';

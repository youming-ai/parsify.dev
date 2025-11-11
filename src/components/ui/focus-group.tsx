/**
 * Focus Group Component
 * Manages keyboard navigation within a group of focusable elements
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFocusManagement } from '@/hooks/use-keyboard-navigation';
import type { KeyboardNavigationOptions } from '@/lib/keyboard-navigation/utils';

interface FocusGroupProps {
	children: React.ReactNode;
	orientation?: 'vertical' | 'horizontal' | 'both';
	loop?: boolean;
	wrap?: boolean;
	activateOnEnter?: boolean;
	activateOnSpace?: boolean;
	onFocusChange?: (index: number, element: HTMLElement) => void;
	onActivate?: (index: number, element: HTMLElement) => void;
	className?: string;
	as?: keyof JSX.IntrinsicElements;
}

export function FocusGroup({
	children,
	orientation = 'vertical',
	loop = true,
	wrap = true,
	activateOnEnter = true,
	activateOnSpace = true,
	onFocusChange,
	onActivate,
	className,
	as: Component = 'div',
	...props
}: FocusGroupProps & Omit<React.ComponentPropsWithoutRef<typeof Component>, keyof FocusGroupProps>) {
	const containerRef = useRef<HTMLElement>(null);
	const [ready, setReady] = useState(false);

	const navigationOptions: KeyboardNavigationOptions = {
		orientation,
		loop,
		wrap,
		activateOnEnter,
		activateOnSpace,
	};

	const { activeIndex, focusableElements } = useFocusManagement(containerRef, navigationOptions);

	// Notify on focus change
	useEffect(() => {
		if (ready && activeIndex >= 0 && activeIndex < focusableElements.length) {
			onFocusChange?.(activeIndex, focusableElements[activeIndex]);
		}
	}, [activeIndex, focusableElements, ready, onFocusChange]);

	// Handle activation
	useEffect(() => {
		if (!containerRef.current) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement;
			const index = focusableElements.indexOf(target);

			if (index !== -1 && (event.key === 'Enter' || event.key === ' ')) {
				onActivate?.(index, target);
			}
		};

		const container = containerRef.current;
		container.addEventListener('keydown', handleKeyDown);

		return () => {
			container.removeEventListener('keydown', handleKeyDown);
		};
	}, [focusableElements, onActivate]);

	// Mark as ready after mount
	useEffect(() => {
		setReady(true);
	}, []);

	return (
		<Component
			ref={containerRef}
			data-focus-group
			data-orientation={orientation}
			className={className}
			{...props}
		>
			{children}
		</Component>
	);
}

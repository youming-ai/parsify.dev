/**
 * Focus Trap Component
 * Traps focus within a container for modals, dialogs, and dropdowns
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '@/hooks/use-keyboard-navigation';

interface FocusTrapProps {
	children: React.ReactNode;
	enabled?: boolean;
	onFocusEnter?: () => void;
	onFocusExit?: () => void;
	className?: string;
	as?: keyof JSX.IntrinsicElements;
}

export function FocusTrap({
	children,
	enabled = true,
	onFocusEnter,
	onFocusExit,
	className,
	as: Component = 'div',
	...props
}: FocusTrapProps & Omit<React.ComponentPropsWithoutRef<typeof Component>, keyof FocusTrapProps>) {
	const containerRef = useRef<HTMLElement>(null);
	const { isTrapped } = useFocusTrap(containerRef, enabled);
	const [hasBeenTrapped, setHasBeenTrapped] = useState(false);

	useEffect(() => {
		if (isTrapped && !hasBeenTrapped) {
			setHasBeenTrapped(true);
			onFocusEnter?.();
		} else if (!isTrapped && hasBeenTrapped) {
			setHasBeenTrapped(false);
			onFocusExit?.();
		}
	}, [isTrapped, hasBeenTrapped, onFocusEnter, onFocusExit]);

	return (
		<Component
			ref={containerRef}
			data-focus-trap={enabled ? 'true' : 'false'}
			className={className}
			{...props}
		>
			{children}
		</Component>
	);
}

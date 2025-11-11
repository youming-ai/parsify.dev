/**
 * Keyboard Shortcuts Trigger Component
 * A floating button that opens the shortcuts help dialog
 */

'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Tooltip } from './tooltip';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-navigation';
import type { KeyboardShortcut } from '@/lib/keyboard-navigation/shortcut-system';

interface KeyboardShortcutsTriggerProps {
	position?: 'fixed' | 'relative';
	placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
	showTooltip?: boolean;
	tooltipText?: string;
	icon?: React.ReactNode;
	variant?: 'default' | 'outline' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	className?: string;
	categories?: KeyboardShortcut['category'][];
	title?: string;
}

export function KeyboardShortcutsTrigger({
	position = 'fixed',
	placement = 'bottom-right',
	showTooltip = true,
	tooltipText = "Keyboard shortcuts (?)",
	icon = (
		<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
	),
	variant = 'outline',
	size = 'sm',
	className,
	categories,
	title,
}: KeyboardShortcutsTriggerProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Register keyboard shortcut to open help
	const shortcuts: KeyboardShortcut[] = [
		{
			id: 'keyboard-shortcuts-help',
			key: '?',
			modifiers: { shift: true },
			description: 'Show keyboard shortcuts help',
			category: 'global',
			action: () => setIsOpen(true),
		},
	];

	useKeyboardShortcuts(shortcuts, {
		ignoreWhenFocusedIn: ['input', 'textarea'],
	});

	const getPositionClasses = () => {
		if (position === 'relative') {
			return '';
		}

		switch (placement) {
			case 'bottom-right':
				return 'fixed bottom-4 right-4';
			case 'bottom-left':
				return 'fixed bottom-4 left-4';
			case 'top-right':
				return 'fixed top-4 right-4';
			case 'top-left':
				return 'fixed top-4 left-4';
			default:
				return 'fixed bottom-4 right-4';
		}
	};

	const trigger = (
		<Button
			variant={variant}
			size={size}
			onClick={() => setIsOpen(true)}
			aria-label="Show keyboard shortcuts help"
			className={className}
		>
			{icon}
		</Button>
	);

	return (
		<>
			<div className={getPositionClasses()}>
				{showTooltip ? (
					<Tooltip content={tooltipText} side="top">
						{trigger}
					</Tooltip>
				) : (
					trigger
				)}
			</div>

			<KeyboardShortcutsHelp
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				title={title}
				categories={categories}
			/>
		</>
	);
}

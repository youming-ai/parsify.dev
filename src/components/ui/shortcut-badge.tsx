/**
 * Shortcut Badge Component
 * Displays keyboard shortcut information in a small badge format
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { type KeyboardShortcut } from '@/lib/keyboard-navigation/shortcut-system';
import { shortcutToString } from '@/lib/keyboard-navigation/utils';

interface ShortcutBadgeProps {
	shortcut: Pick<KeyboardShortcut, 'key' | 'modifiers'>;
	className?: string;
	variant?: 'default' | 'outline' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	showModifiers?: boolean;
	abbreviated?: boolean;
}

export function ShortcutBadge({
	shortcut,
	className,
	variant = 'default',
	size = 'md',
	showModifiers = true,
	abbreviated = false,
}: ShortcutBadgeProps) {
	const shortcutString = shortcutToString(shortcut);

	const variants = {
		default: 'bg-gray-100 text-gray-800 border-gray-200',
		outline: 'border border-gray-300 text-gray-700 bg-white',
		ghost: 'text-gray-600 hover:bg-gray-100',
	};

	const sizes = {
		sm: 'text-xs px-1.5 py-0.5 min-h-[1.25rem]',
		md: 'text-sm px-2 py-1 min-h-[1.5rem]',
		lg: 'text-base px-3 py-1.5 min-h-[2rem]',
	};

	const formatKey = (key: string): string => {
		if (abbreviated) {
			const abbreviations: Record<string, string> = {
				'Control': 'Ctrl',
				'Meta': '⌘',
				'Alt': '⌥',
				'Shift': '⇧',
				'ArrowUp': '↑',
				'ArrowDown': '↓',
				'ArrowLeft': '←',
				'ArrowRight': '→',
				'Enter': '↵',
				'Escape': 'Esc',
				' ': 'Space',
			};
			return abbreviations[key] || key;
		}
		return key;
	};

	const renderShortcut = () => {
		const parts = shortcutString.split(' + ');

		if (!showModifiers || parts.length === 1) {
			return <span>{formatKey(parts[0])}</span>;
		}

		return (
			<>
				{parts.map((part, index) => (
					<span key={index}>
						{index > 0 && <span className="mx-1 text-gray-400">+</span>}
						<span className="font-mono">{formatKey(part)}</span>
					</span>
				))}
			</>
		);
	};

	return (
		<span
			className={cn(
				'inline-flex items-center justify-center font-mono font-medium rounded border',
				variants[variant],
				sizes[size],
				className
			)}
			aria-label={`Keyboard shortcut: ${shortcutString}`}
		>
			{renderShortcut()}
		</span>
	);
}

/**
 * Shortcut Group Component
 * Displays multiple shortcuts in a group format
 */
interface ShortcutGroupProps {
	shortcuts: Array<Pick<KeyboardShortcut, 'key' | 'modifiers'>>;
	separator?: string;
	className?: string;
	size?: 'sm' | 'md' | 'lg';
}

export function ShortcutGroup({
	shortcuts,
	separator = 'or',
	className,
	size = 'md',
}: ShortcutGroupProps) {
	if (shortcuts.length === 0) {
		return null;
	}

	if (shortcuts.length === 1) {
		return (
			<ShortcutBadge
				shortcut={shortcuts[0]}
				className={className}
				size={size}
			/>
		);
	}

	return (
		<div className={cn('flex items-center gap-2', className)}>
			{shortcuts.map((shortcut, index) => (
				<React.Fragment key={index}>
					{index > 0 && (
						<span className="text-gray-500 text-sm">{separator}</span>
					)}
					<ShortcutBadge
						shortcut={shortcut}
						size={size}
						variant="outline"
					/>
				</React.Fragment>
			))}
		</div>
	);
}

/**
 * Shortcut Tooltip Component
 * Shows shortcut information in a tooltip
 */
interface ShortcutTooltipProps {
	shortcut: Pick<KeyboardShortcut, 'key' | 'modifiers' | 'description'>;
	children: React.ReactNode;
	className?: string;
	side?: 'top' | 'right' | 'bottom' | 'left';
}

export function ShortcutTooltip({
	shortcut,
	children,
	className,
	side = 'bottom',
}: ShortcutTooltipProps) {
	return (
		<div className={cn('relative group', className)}>
			{children}
			<div
				className={cn(
					'absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100',
					'transition-all duration-200 ease-in-out',
					'bg-gray-900 text-white text-sm rounded-md px-2 py-1 shadow-lg',
					'pointer-events-none whitespace-nowrap',
					{
						'bottom-full left-1/2 transform -translate-x-1/2 mb-2': side === 'top',
						'top-full left-1/2 transform -translate-x-1/2 mt-2': side === 'bottom',
						'right-full top-1/2 transform -translate-y-1/2 mr-2': side === 'left',
						'left-full top-1/2 transform -translate-y-1/2 ml-2': side === 'right',
					}
				)}
			>
				<div className="flex flex-col gap-1">
					<div className="font-medium">{shortcut.description}</div>
					<ShortcutBadge
						shortcut={shortcut}
						variant="ghost"
						size="sm"
						className="text-white bg-gray-800"
					/>
				</div>
				<div
					className={cn(
						'absolute w-2 h-2 bg-gray-900 transform rotate-45',
						{
							'top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2': side === 'top',
							'bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2': side === 'bottom',
							'right-full top-1/2 transform -translate-y-1/2 translate-x-1/2': side === 'left',
							'left-full top-1/2 transform -translate-y-1/2 -translate-x-1/2': side === 'right',
						}
					)}
				/>
			</div>
		</div>
	);
}

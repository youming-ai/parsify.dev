/**
 * Accessible Input Component
 * Enhanced input with comprehensive keyboard navigation and accessibility features
 */

'use client';

import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { Input, InputProps } from './input';
import { Label } from './label';
import { useKeyboardAnnouncements } from '@/hooks/use-keyboard-navigation';
import { cn } from '@/lib/utils';

interface AccessibleInputProps extends Omit<InputProps, 'ref'> {
	label?: string;
	error?: string;
	hint?: string;
	required?: boolean;
	disabled?: boolean;
	validationState?: 'valid' | 'invalid' | 'warning';
	autocomplete?: string;
	autoCorrect?: 'on' | 'off';
	autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
	spellCheck?: boolean;
	announcement?: {
		onChange?: string;
		onError?: string;
		onFocus?: string;
	};
	showCharacterCount?: boolean;
	maxLength?: number;
	onCharacterCountChange?: (count: number, remaining: number) => void;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
	(
		{
			id,
			label,
			error,
			hint,
			required = false,
			disabled = false,
			validationState,
			autocomplete,
			autoCorrect,
			autoCapitalize,
			spellCheck = false,
			announcement,
			showCharacterCount = false,
			maxLength,
			onCharacterCountChange,
			value,
			onChange,
			onFocus,
			onBlur,
			className,
			...props
		},
		ref
	) => {
		const inputRef = useRef<HTMLInputElement>(null);
		const mergedRef = (ref || inputRef) as React.RefObject<HTMLInputElement>;
		const [characterCount, setCharacterCount] = useState(0);
		const { announce } = useKeyboardAnnouncements();

		// Generate unique IDs
		const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
		const errorId = error ? `${inputId}-error` : undefined;
		const hintId = hint ? `${inputId}-hint` : undefined;
		const charCountId = showCharacterCount ? `${inputId}-charcount` : undefined;

		// Update character count
		useEffect(() => {
			const count = typeof value === 'string' ? value.length : 0;
			setCharacterCount(count);
			onCharacterCountChange?.(count, maxLength ? maxLength - count : 0);
		}, [value, maxLength, onCharacterCountChange]);

		// Handle changes with announcements
		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = event.target.value;
			const count = newValue.length;
			setCharacterCount(count);
			onCharacterCountChange?.(count, maxLength ? maxLength - count : 0);

			if (announcement?.onChange) {
				const message = announcement.onChange
					.replace('{count}', count.toString())
					.replace('{remaining}', maxLength ? (maxLength - count).toString() : 'unlimited');
				announce(message, 'polite');
			}

			onChange?.(event);
		};

		// Handle focus with announcements
		const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
			let message = '';

			if (announcement?.onFocus) {
				message = announcement.onFocus;
			} else if (label) {
				message = `Editing ${label}`;
				if (required) message += ', required field';
				if (maxLength) message += `, ${maxLength} characters maximum`;
				if (characterCount > 0) message += `, ${characterCount} characters entered`;
			}

			if (message) {
				announce(message, 'polite');
			}

			onFocus?.(event);
		};

		// Handle blur with validation announcements
		const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
			if (error && announcement?.onError) {
				announce(announcement.onError, 'assertive');
			}

			onBlur?.(event);
		};

		// Get validation state color
		const getValidationColor = () => {
			switch (validationState) {
				case 'valid':
					return 'border-green-500 focus:border-green-500';
				case 'invalid':
					return 'border-red-500 focus:border-red-500';
				case 'warning':
					return 'border-yellow-500 focus:border-yellow-500';
				default:
					return '';
			}
		};

		return (
			<div className="space-y-2">
				{label && (
					<Label
						htmlFor={inputId}
						className={cn(
							'text-sm font-medium',
							required && 'after:content-["*"] after:ml-1 after:text-red-500'
						)}
					>
						{label}
					</Label>
				)}

				<div className="relative">
					<Input
						ref={mergedRef}
						id={inputId}
						value={value}
						onChange={handleChange}
						onFocus={handleFocus}
						onBlur={handleBlur}
						disabled={disabled}
						required={required}
						maxLength={maxLength}
						autoComplete={autocomplete}
						autoCorrect={autoCorrect}
						autoCapitalize={autoCapitalize}
						spellCheck={spellCheck}
						className={cn(
							getValidationColor(),
							disabled && 'cursor-not-allowed opacity-50',
							className
						)}
						aria-invalid={validationState === 'invalid' ? 'true' : 'false'}
						aria-describedby={cn(
							errorId && errorId,
							hintId && hintId,
							charCountId && charCountId
						).trim() || undefined}
						aria-required={required}
						{...props}
					/>

					{/* Character count */}
					{showCharacterCount && (
						<div
							id={charCountId}
							className={cn(
								'absolute right-3 top-1/2 transform -translate-y-1/2 text-xs',
								maxLength && characterCount > maxLength * 0.9
									? 'text-red-500'
									: 'text-gray-500'
							)}
							aria-live="polite"
							aria-atomic="true"
						>
							{characterCount}
							{maxLength && `/${maxLength}`}
						</div>
					)}
				</div>

				{/* Hint text */}
				{hint && (
					<p
						id={hintId}
						className="text-sm text-gray-600 dark:text-gray-400"
					>
						{hint}
					</p>
				)}

				{/* Error message */}
				{error && (
					<p
						id={errorId}
						className="text-sm text-red-600 dark:text-red-400"
						role="alert"
						aria-live="assertive"
					>
						{error}
					</p>
				)}
			</div>
		);
	}
);

AccessibleInput.displayName = 'AccessibleInput';

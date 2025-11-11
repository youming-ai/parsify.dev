/**
 * Accessible Message Components
 * Screen reader-optimized error and success message components
 */

import React, { useEffect, useRef, useState } from 'react';
import { useScreenReader } from '@/lib/screen-reader';

// Accessible Alert Component
interface AccessibleAlertProps {
	type: 'error' | 'warning' | 'success' | 'info';
	title: string;
	message?: string;
	dismissible?: boolean;
	onDismiss?: () => void;
	autoDismiss?: boolean;
	autoDismissDelay?: number;
	className?: string;
	children?: React.ReactNode;
}

export function AccessibleAlert({
	type,
	title,
	message,
	dismissible = false,
	onDismiss,
	autoDismiss = false,
	autoDismissDelay = 5000,
	className = '',
	children,
}: AccessibleAlertProps) {
	const [isVisible, setIsVisible] = useState(true);
	const { announce, announceError, announceSuccess } = useScreenReader();
	const alertRef = useRef<HTMLDivElement>(null);
	const alertId = React.useId();

	useEffect(() => {
		if (autoDismiss && (type === 'success' || type === 'info')) {
			const timer = setTimeout(() => {
				handleDismiss();
			}, autoDismissDelay);
			return () => clearTimeout(timer);
		}
	}, [autoDismiss, autoDismissDelay, type]);

	useEffect(() => {
		if (isVisible) {
			let announcement = title;
			if (message) {
				announcement += `. ${message}`;
			}

			switch (type) {
				case 'error':
					announceError(announcement);
					break;
				case 'warning':
					announce(announcement, { priority: 'polite' });
					break;
				case 'success':
					announceSuccess(announcement);
					break;
				case 'info':
					announce(announcement, { priority: 'polite' });
					break;
			}

			// Focus the alert for keyboard users
			if (alertRef.current && (type === 'error' || type === 'warning')) {
				alertRef.current.focus();
			}
		}
	}, [isVisible, title, message, type, announce, announceError, announceSuccess]);

	const handleDismiss = () => {
		setIsVisible(false);
		onDismiss?.();
		announce('Alert dismissed', { priority: 'polite' });
	};

	if (!isVisible) return null;

	const alertConfig = {
		error: {
			role: 'alert',
			ariaLive: 'assertive',
			className: 'bg-red-50 border-red-200 text-red-900',
			icon: '⚠️',
			titleClass: 'text-red-800 font-semibold',
		},
		warning: {
			role: 'alert',
			ariaLive: 'assertive',
			className: 'bg-yellow-50 border-yellow-200 text-yellow-900',
			icon: '⚡',
			titleClass: 'text-yellow-800 font-semibold',
		},
		success: {
			role: 'status',
			ariaLive: 'polite',
			className: 'bg-green-50 border-green-200 text-green-900',
			icon: '✓',
			titleClass: 'text-green-800 font-semibold',
		},
		info: {
			role: 'status',
			ariaLive: 'polite',
			className: 'bg-blue-50 border-blue-200 text-blue-900',
			icon: 'ℹ️',
			titleClass: 'text-blue-800 font-semibold',
		},
	};

	const config = alertConfig[type];

	return (
		<div
			ref={alertRef}
			id={`alert-${alertId}`}
			role={config.role}
			aria-live={config.ariaLive}
			aria-atomic="true"
			tabIndex={type === 'error' || type === 'warning' ? 0 : -1}
			className={`border rounded-lg p-4 ${config.className} ${className}`}
		>
			<div className="flex items-start">
				<div className="flex-shrink-0" aria-hidden="true">
					{config.icon}
				</div>
				<div className="ml-3 flex-1">
					<h3 className={`text-lg ${config.titleClass}`}>
						{title}
					</h3>
					{message && (
						<p className="mt-1 text-sm opacity-90">
							{message}
						</p>
					)}
					{children && (
						<div className="mt-2 text-sm">
							{children}
						</div>
					)}
				</div>
				{dismissible && (
					<button
						onClick={handleDismiss}
						className="ml-auto flex-shrink-0 p-1 rounded-md hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2"
						aria-label="Dismiss alert"
					>
						<span className="sr-only">Dismiss</span>
						<span aria-hidden="true">×</span>
					</button>
				)}
			</div>
		</div>
	);
}

// Inline Field Error Component
interface InlineFieldErrorProps {
	fieldName: string;
	error: string;
	id?: string;
	className?: string;
}

export function InlineFieldError({ fieldName, error, id, className = '' }: InlineFieldErrorProps) {
	const errorId = id || `${fieldName}-error`;
	const { announceError } = useScreenReader();

	useEffect(() => {
		announceError(error, `${fieldName} field`);
	}, [error, fieldName, announceError]);

	return (
		<div
			id={errorId}
			role="alert"
			aria-live="assertive"
			className={`text-red-600 text-sm mt-1 font-medium ${className}`}
		>
			<span className="sr-only">Error: </span>
			{error}
		</div>
	);
}

// Inline Field Success Component
interface InlineFieldSuccessProps {
	fieldName: string;
	message: string;
	id?: string;
	className?: string;
}

export function InlineFieldSuccess({ fieldName, message, id, className = '' }: InlineFieldSuccessProps) {
	const successId = id || `${fieldName}-success`;
	const { announceSuccess } = useScreenReader();

	useEffect(() => {
		announceSuccess(message, `${fieldName} field`);
	}, [message, fieldName, announceSuccess]);

	return (
		<div
			id={successId}
			role="status"
			aria-live="polite"
			className={`text-green-600 text-sm mt-1 font-medium ${className}`}
		>
			<span className="sr-only">Success: </span>
			{message}
		</div>
	);
}

// Form Summary Component
interface FormSummaryProps {
	isValid: boolean;
	errors: Array<{ field: string; message: string }>;
	warnings?: Array<{ field: string; message: string }>;
	formName?: string;
	className?: string;
}

export function FormSummary({
	isValid,
	errors,
	warnings = [],
	formName = 'Form',
	className = '',
}: FormSummaryProps) {
	const summaryId = React.useId();
	const { announceError, announceSuccess } = useScreenReader();

	useEffect(() => {
		if (isValid) {
			announceSuccess(`${formName} is valid and ready to submit`);
		} else {
			const errorCount = errors.length;
			const warningCount = warnings.length;

			let message = `${formName} cannot be submitted due to ${errorCount} error${errorCount !== 1 ? 's' : ''}`;
			if (warningCount > 0) {
				message += ` and ${warningCount} warning${warningCount !== 1 ? 's' : ''}`;
			}

			announceError(message);
		}
	}, [isValid, errors, warnings, formName, announceError, announceSuccess]);

	if (isValid && warnings.length === 0) return null;

	return (
		<div
			id={`form-summary-${summaryId}`}
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
			className={`border rounded-lg p-4 mb-4 ${
				isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
			} ${className}`}
		>
			<h3 className={`font-semibold mb-2 ${
				isValid ? 'text-green-800' : 'text-red-800'
			}`}>
				{isValid ? 'Form Ready' : 'Form Issues'}
			</h3>

			{!isValid && errors.length > 0 && (
				<div>
					<p className="text-red-700 font-medium mb-2">
						{errors.length} error{errors.length !== 1 ? 's' : ''} need{errors.length === 1 ? 's' : ''} to be resolved:
					</p>
					<ul className="list-disc list-inside text-red-600 space-y-1">
						{errors.map((error, index) => (
							<li key={index}>
								<strong>{error.field}:</strong> {error.message}
							</li>
						))}
					</ul>
				</div>
			)}

			{warnings.length > 0 && (
				<div className="mt-3">
					<p className="text-yellow-700 font-medium mb-2">
						{warnings.length} warning{warnings.length !== 1 ? 's' : ''}:
					</p>
					<ul className="list-disc list-inside text-yellow-600 space-y-1">
						{warnings.map((warning, index) => (
							<li key={index}>
								<strong>{warning.field}:</strong> {warning.message}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

// Validation Message Component
interface ValidationMessageProps {
	type: 'error' | 'warning' | 'success';
	message: string;
	fieldName?: string;
	showIcon?: boolean;
	className?: string;
}

export function ValidationMessage({
	type,
	message,
	fieldName,
	showIcon = true,
	className = '',
}: ValidationMessageProps) {
	const messageId = React.useId();
	const { announceError, announceSuccess } = useScreenReader();

	useEffect(() => {
		const context = fieldName ? `${fieldName} field` : 'Validation';
		const fullMessage = fieldName ? `${fieldName}: ${message}` : message;

		switch (type) {
			case 'error':
				announceError(fullMessage, context);
				break;
			case 'warning':
				// Use regular announce for warnings
				break;
			case 'success':
				announceSuccess(fullMessage, context);
				break;
		}
	}, [message, fieldName, type, announceError, announceSuccess]);

	const config = {
		error: {
			role: 'alert' as const,
			ariaLive: 'assertive' as const,
			className: 'text-red-600',
			icon: '❌',
		},
		warning: {
			role: 'status' as const,
			ariaLive: 'polite' as const,
			className: 'text-yellow-600',
			icon: '⚠️',
		},
		success: {
			role: 'status' as const,
			ariaLive: 'polite' as const,
			className: 'text-green-600',
			icon: '✓',
		},
	};

	const messageConfig = config[type];

	return (
		<div
			id={`validation-${messageId}`}
			role={messageConfig.role}
			aria-live={messageConfig.ariaLive}
			className={`text-sm mt-1 flex items-center gap-1 ${messageConfig.className} ${className}`}
		>
			{showIcon && (
				<span aria-hidden="true" className="flex-shrink-0">
					{messageConfig.icon}
				</span>
			)}
			<span>
				{type === 'error' && <span className="sr-only">Error: </span>}
				{type === 'success' && <span className="sr-only">Success: </span>}
				{message}
			</span>
		</div>
	);
}

// Toast Notification Component
interface ToastNotificationProps {
	message: string;
	type?: 'success' | 'error' | 'warning' | 'info';
	duration?: number;
	onClose?: () => void;
	showProgress?: boolean;
	className?: string;
}

export function ToastNotification({
	message,
	type = 'info',
	duration = 3000,
	onClose,
	showProgress = true,
	className = '',
}: ToastNotificationProps) {
	const [isVisible, setIsVisible] = useState(true);
	const [progress, setProgress] = useState(0);
	const { announce } = useScreenReader();
	const toastId = React.useId();

	useEffect(() => {
		let message = '';
		switch (type) {
			case 'success':
				message = `Success: ${message}`;
				break;
			case 'error':
				message = `Error: ${message}`;
				break;
			case 'warning':
				message = `Warning: ${message}`;
				break;
			default:
				message = message;
		}

		announce(message, { priority: type === 'error' ? 'assertive' : 'polite' });
	}, [message, type, announce]);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) {
					clearInterval(interval);
					return 100;
				}
				return prev + (100 / (duration / 100));
			});
		}, 100);

		const timeout = setTimeout(() => {
			handleClose();
		}, duration);

		return () => {
			clearInterval(interval);
			clearTimeout(timeout);
		};
	}, [duration]);

	const handleClose = () => {
		setIsVisible(false);
		onClose?.();
	};

	if (!isVisible) return null;

	const typeConfig = {
		success: { bg: 'bg-green-500', icon: '✓' },
		error: { bg: 'bg-red-500', icon: '❌' },
		warning: { bg: 'bg-yellow-500', icon: '⚠️' },
		info: { bg: 'bg-blue-500', icon: 'ℹ️' },
	};

	const config = typeConfig[type];

	return (
		<div
			id={`toast-${toastId}`}
			role="alert"
			aria-live={type === 'error' ? 'assertive' : 'polite'}
			aria-atomic="true"
			className={`fixed bottom-4 right-4 ${config.bg} text-white rounded-lg shadow-lg p-4 max-w-sm z-50 ${className}`}
		>
			<div className="flex items-start gap-3">
				<span aria-hidden="true" className="text-xl">
					{config.icon}
				</span>
				<div className="flex-1">
					<p className="font-medium">{message}</p>
				</div>
				<button
					onClick={handleClose}
					className="flex-shrink-0 ml-2 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-current rounded"
					aria-label="Close notification"
				>
					<span aria-hidden="true">×</span>
				</button>
			</div>
			{showProgress && (
				<div className="mt-3 bg-white bg-opacity-20 rounded-full h-1">
					<div
						className="bg-white h-1 rounded-full transition-all duration-100 ease-linear"
						style={{ width: `${progress}%` }}
						aria-hidden="true"
					/>
				</div>
			)}
		</div>
	);
}

// Error Boundary Message Component
interface ErrorBoundaryMessageProps {
	error: Error;
	resetError: () => void;
	className?: string;
}

export function ErrorBoundaryMessage({ error, resetError, className = '' }: ErrorBoundaryMessageProps) {
	const errorId = React.useId();
	const { announceError } = useScreenReader();

	useEffect(() => {
		announceError(`An unexpected error occurred: ${error.message}`, 'application');
	}, [error.message, announceError]);

	return (
		<div
			id={`error-boundary-${errorId}`}
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
			className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-lg mx-auto mt-8"
		>
			<div
				role="img"
				aria-label="Error icon"
				className="text-red-500 text-4xl mb-4"
				aria-hidden="true"
			>
				⚠️
			</div>
			<h2 className="text-red-800 text-xl font-semibold mb-2">
				Something went wrong
			</h2>
			<p className="text-red-700 mb-4">
				An unexpected error occurred while processing your request.
			</p>
			{process.env.NODE_ENV === 'development' && (
				<details className="text-left mb-4 p-3 bg-red-100 rounded">
					<summary className="font-medium cursor-pointer">Error Details</summary>
					<pre className="mt-2 text-sm text-red-800 whitespace-pre-wrap">
						{error.stack}
					</pre>
				</details>
			)}
			<button
				onClick={resetError}
				className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
			>
				Try Again
			</button>
		</div>
	);
}

// Contextual Help Component
interface ContextualHelpProps {
	title: string;
	content: React.ReactNode;
	triggerText?: string;
	placement?: 'top' | 'bottom' | 'left' | 'right';
	className?: string;
}

export function ContextualHelp({
	title,
	content,
	triggerText = 'Help',
	placement = 'top',
	className = '',
}: ContextualHelpProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { announce } = useScreenReader();
	const helpId = React.useId();
	const triggerRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (isOpen) {
			announce(`Help opened: ${title}`, { priority: 'polite' });
		} else {
			announce('Help closed', { priority: 'polite' });
		}
	}, [isOpen, title, announce]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			setIsOpen(false);
			triggerRef.current?.focus();
		}
	};

	return (
		<div className={`relative inline-block ${className}`}>
			<button
				ref={triggerRef}
				onClick={() => setIsOpen(!isOpen)}
				onKeyDown={handleKeyDown}
				aria-expanded={isOpen}
				aria-controls={`help-content-${helpId}`}
				className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
			>
				{triggerText}
			</button>

			{isOpen && (
				<div
					id={`help-content-${helpId}`}
					role="tooltip"
					aria-labelledby={`help-title-${helpId}`}
					className="absolute z-10 w-64 p-4 bg-white border border-gray-200 rounded-lg shadow-lg"
				>
					<h3 id={`help-title-${helpId}`} className="font-semibold mb-2">
						{title}
					</h3>
					<div className="text-sm text-gray-700">
						{content}
					</div>
				</div>
			)}
		</div>
	);
}

export default {
	AccessibleAlert,
	InlineFieldError,
	InlineFieldSuccess,
	FormSummary,
	ValidationMessage,
	ToastNotification,
	ErrorBoundaryMessage,
	ContextualHelp,
};

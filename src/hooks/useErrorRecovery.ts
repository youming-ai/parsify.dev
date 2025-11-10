/**
 * Error Recovery Hook
 * React hook for error recovery and intelligent error handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { errorRecovery, ErrorInfo, RecoveryStrategy, ErrorRecoveryResult } from '@/lib/error-recovery';

export interface ErrorRecoveryState {
	error: ErrorInfo | null;
	strategy: RecoveryStrategy | null;
	isRecovering: boolean;
	recoveryResult: ErrorRecoveryResult | null;
	showRecoveryOptions: boolean;
	stepProgress: {
		current: number;
		total: number;
		currentStep?: string;
	};
}

export interface UseErrorRecoveryOptions {
	toolId: string;
	operation: string;
	autoRecovery?: boolean;
	maxRetries?: number;
	onError?: (error: ErrorInfo) => void;
	onRecovery?: (result: ErrorRecoveryResult) => void;
	onRetry?: () => void;
}

export function useErrorRecovery(options: UseErrorRecoveryOptions) {
	const {
		toolId,
		operation,
		autoRecovery = true,
		maxRetries = 3,
		onError,
		onRecovery,
		onRetry,
	} = options;

	const [state, setState] = useState<ErrorRecoveryState>({
		error: null,
		strategy: null,
		isRecovering: false,
		recoveryResult: null,
		showRecoveryOptions: false,
		stepProgress: {
			current: 0,
			total: 0,
		},
	});

	const retryCount = useRef(0);
	const abortController = useRef<AbortController | null>(null);

	// Handle error occurrence
	const handleError = useCallback((error: Error | string, context?: any) => {
		// Cancel any ongoing recovery
		if (abortController.current) {
			abortController.current.abort();
		}

		const errorInfo = errorRecovery.analyzeError(error,
			errorRecovery.createContext(toolId, operation, context)
		);

		setState(prev => ({
			...prev,
			error: errorInfo,
			strategy: errorRecovery.getRecoveryStrategy(errorInfo),
			showRecoveryOptions: true,
			recoveryResult: null,
			stepProgress: {
				current: 0,
				total: 0,
			},
		}));

		onError?.(errorInfo);

		// Auto-recovery if enabled and error is recoverable
		if (autoRecovery && errorInfo.recoverable && errorInfo.severity !== 'critical') {
			setTimeout(() => {
				attemptRecovery();
			}, 1000);
		}
	}, [toolId, operation, autoRecovery, onError]);

	// Attempt error recovery
	const attemptRecovery = useCallback(async () => {
		if (!state.error || state.isRecovering) return;

		const strategy = state.strategy;
		if (!strategy) return;

		setState(prev => ({
			...prev,
			isRecovering: true,
			stepProgress: {
				...prev.stepProgress,
				total: strategy.steps.length,
			},
		}));

		abortController.current = new AbortController();

		try {
			const result = await errorRecovery.executeRecovery(
				state.error,
				{ toolId, operation },
				(step, stepResult) => {
					setState(prev => ({
						...prev,
						stepProgress: {
							...prev.stepProgress,
							current: prev.stepProgress.current + 1,
							currentStep: step.title,
						},
					}));
				}
			);

			setState(prev => ({
				...prev,
				recoveryResult: result,
				isRecovering: false,
				showRecoveryOptions: !result.success,
			}));

			onRecovery?.(result);

			if (result.success) {
				retryCount.current = 0;
			}

		} catch (recoveryError) {
			setState(prev => ({
				...prev,
				isRecovering: false,
				recoveryResult: {
					success: false,
					appliedStrategy: strategy.id,
					stepsCompleted: [],
					remainingIssues: [state.error!],
					recommendations: ['Recovery failed'],
					nextActions: ['Try manual recovery'],
				},
			}));
		}
	}, [state.error, state.strategy, state.isRecovering, toolId, operation, onRecovery]);

	// Manual retry
	const retry = useCallback(() => {
		if (retryCount.current >= maxRetries) {
			setState(prev => ({
				...prev,
				showRecoveryOptions: true,
			}));
			return;
		}

		retryCount.current++;
		setState(prev => ({
			...prev,
			error: null,
			strategy: null,
			showRecoveryOptions: false,
			recoveryResult: null,
		}));

		onRetry?.();
	}, [maxRetries, onRetry]);

	// Reset error state
	const reset = useCallback(() => {
		setState({
			error: null,
			strategy: null,
			isRecovering: false,
			recoveryResult: null,
			showRecoveryOptions: false,
			stepProgress: {
				current: 0,
				total: 0,
			},
		});
		retryCount.current = 0;
		if (abortController.current) {
			abortController.current.abort();
			abortController.current = null;
		}
	}, []);

	// Cancel recovery
	const cancelRecovery = useCallback(() => {
		if (abortController.current) {
			abortController.current.abort();
			abortController.current = null;
		}

		setState(prev => ({
			...prev,
			isRecovering: false,
			showRecoveryOptions: true,
		}));
	}, []);

	// Get user-friendly error message
	const userError = state.error ? errorRecovery.getUserFriendlyMessage(state.error) : null;

	// Format error for display
	const formattedError = state.error ? errorRecovery.formatErrorForUser(state.error) : null;

	// Check if error is recoverable
	const isRecoverable = state.error?.recoverable || false;

	// Get recovery progress percentage
	const recoveryProgress = state.stepProgress.total > 0
		? (state.stepProgress.current / state.stepProgress.total) * 100
		: 0;

	// Error boundary wrapper
	const ErrorBoundary = useCallback(({ children }: { children: React.ReactNode }) => {
		return (
			<div>
				{children}
			</div>
		);
	}, []);

	// Wrap async functions with error handling
	const wrapAsync = useCallback(<T extends any[], R>(
		asyncFn: (...args: T) => Promise<R>
	) => {
		return async (...args: T): Promise<R> => {
			try {
				return await asyncFn(...args);
			} catch (error) {
				handleError(error as Error);
				throw error;
			}
		};
	}, [handleError]);

	// Wrap synchronous functions with error handling
	const wrapSync = useCallback(<T extends any[], R>(
		syncFn: (...args: T) => R
	) => {
		return (...args: T): R => {
			try {
				return syncFn(...args);
			} catch (error) {
				handleError(error as Error);
				throw error;
			}
		};
	}, [handleError]);

	// Safe async executor with retry logic
	const safeExecute = useCallback(async <T>(
		asyncFn: () => Promise<T>,
		options?: {
			retryOnError?: boolean;
			fallbackValue?: T;
			context?: any;
		}
	): Promise<T | undefined> => {
		const { retryOnError = true, fallbackValue, context } = options || {};

		try {
			return await asyncFn();
		} catch (error) {
			handleError(error as Error, context);

			if (retryOnError && isRecoverable && retryCount.current < maxRetries) {
				retry();
			}

			return fallbackValue;
		}
	}, [handleError, isRecoverable, maxRetries, retry]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (abortController.current) {
				abortController.current.abort();
			}
		};
	}, []);

	return {
		// State
		error: state.error,
		strategy: state.strategy,
		isRecovering: state.isRecovering,
		recoveryResult: state.recoveryResult,
		showRecoveryOptions: state.showRecoveryOptions,
		stepProgress: state.stepProgress,

		// User-friendly data
		userError,
		formattedError,
		isRecoverable,
		recoveryProgress,

		// Actions
		handleError,
		attemptRecovery,
		retry,
		reset,
		cancelRecovery,

		// Utilities
		ErrorBoundary,
		wrapAsync,
		wrapSync,
		safeExecute,

		// Computed states
		hasError: !!state.error,
		canRetry: retryCount.current < maxRetries,
		isAutoRecoveryEnabled: autoRecovery,
	};
}

// Hook for error boundary components
export function useErrorBoundary() {
	const [error, setError] = useState<Error | null>(null);
	const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

	const captureError = useCallback((error: Error, context?: string) => {
		const info = errorRecovery.analyzeError(error, context);
		setError(error);
		setErrorInfo(info);
	}, []);

	const reset = useCallback(() => {
		setError(null);
		setErrorInfo(null);
	}, []);

	return {
		error,
		errorInfo,
		captureError,
		reset,
		hasError: !!error,
	};
}

// Hook for handling async operations with loading and error states
export function useAsyncOperation<T, E = Error>() {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<E | null>(null);

	const execute = useCallback(async (asyncFn: () => Promise<T>, context?: string) => {
		setLoading(true);
		setError(null);

		try {
			const result = await asyncFn();
			setData(result);
			return result;
		} catch (err) {
			const error = err as E;
			setError(error);
			throw error;
		} finally {
			setLoading(false);
		}
	}, []);

	const reset = useCallback(() => {
		setData(null);
		setLoading(false);
		setError(null);
	}, []);

	return {
		data,
		loading,
		error,
		execute,
		reset,
		isLoading: loading,
		hasError: !!error,
		hasData: !!data,
	};
}

// Hook for handling form validation errors
export function useFormValidation<T extends Record<string, any>>() {
	const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
	const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

	const validateField = useCallback((field: keyof T, value: any, validator?: (value: any) => string | null) => {
		let error: string | null = null;

		if (validator) {
			error = validator(value);
		} else {
			// Default validation
			if (!value || (typeof value === 'string' && value.trim() === '')) {
				error = `${String(field)} is required`;
			}
		}

		setErrors(prev => ({ ...prev, [field]: error }));
		setTouched(prev => ({ ...prev, [field]: true }));

		return !error;
	}, []);

	const validateForm = useCallback((data: T, validators?: Partial<Record<keyof T, (value: any) => string | null>>) => {
		const newErrors: Partial<Record<keyof T, string>> = {};
		let isValid = true;

		Object.keys(data).forEach((field) => {
			const fieldKey = field as keyof T;
			const value = data[fieldKey];
			const validator = validators?.[fieldKey];

			let error: string | null = null;
			if (validator) {
				error = validator(value);
			} else if (!value || (typeof value === 'string' && value.trim() === '')) {
				error = `${field} is required`;
			}

			if (error) {
				newErrors[fieldKey] = error;
				isValid = false;
			}
		});

		setErrors(newErrors);
		setTouched(Object.keys(data).reduce((acc, field) => ({
			...acc,
			[field as keyof T]: true
		}), {}));

		return { isValid, errors: newErrors };
	}, []);

	const reset = useCallback(() => {
		setErrors({});
		setTouched({});
	}, []);

	return {
		errors,
		touched,
		validateField,
		validateForm,
		reset,
		isValid: Object.keys(errors).length === 0,
		hasErrors: Object.keys(errors).length > 0,
	};
}

export default {
	useErrorRecovery,
	useErrorBoundary,
	useAsyncOperation,
	useFormValidation,
};

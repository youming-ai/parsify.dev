/**
 * Accessible Form Components
 * Screen reader-optimized form components with comprehensive ARIA support
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAccessibleForm } from '@/lib/screen-reader';
import { FormValidationAnnouncer } from './live-region';
import { ValidationMessage, FormSummary } from './accessible-messages';

// Accessible Form Context
interface AccessibleFormContextType {
	formName: string;
	validationErrors: Record<string, string>;
	setValidationError: (field: string, error: string) => void;
	clearValidationError: (field: string) => void;
	submitAttempts: number;
	incrementSubmitAttempts: () => void;
}

const AccessibleFormContext = React.createContext<AccessibleFormContextType | null>(null);

// Hook to use form context
export function useAccessibleFormContext() {
	const context = React.useContext(AccessibleFormContext);
	if (!context) {
		throw new Error('useAccessibleFormContext must be used within an AccessibleForm');
	}
	return context;
}

// Main Accessible Form Component
interface AccessibleFormProps {
	title: string;
	description?: string;
	onSubmit: (data: Record<string, any>) => void | Promise<void>;
	onValidationError?: (errors: Record<string, string>) => void;
	children: React.ReactNode;
	className?: string;
	noValidate?: boolean;
	autoValidate?: boolean;
}

export function AccessibleForm({
	title,
	description,
	onSubmit,
	onValidationError,
	children,
	className = '',
	noValidate = true,
	autoValidate = false,
}: AccessibleFormProps) {
	const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
	const [submitAttempts, setSubmitAttempts] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);
	const formId = React.useId();

	const setValidationError = useCallback((field: string, error: string) => {
		setValidationErrors(prev => ({ ...prev, [field]: error }));
	}, []);

	const clearValidationError = useCallback((field: string) => {
		setValidationErrors(prev => {
			const newErrors = { ...prev };
			delete newErrors[field];
			return newErrors;
		});
	}, []);

	const incrementSubmitAttempts = useCallback(() => {
		setSubmitAttempts(prev => prev + 1);
	}, []);

	const contextValue: AccessibleFormContextType = {
		formName: title,
		validationErrors,
		setValidationError,
		clearValidationError,
		submitAttempts,
		incrementSubmitAttempts,
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!formRef.current) return;

		// Collect form data
		const formData = new FormData(formRef.current);
		const data: Record<string, any> = {};

		// Handle different input types
		formRef.current.querySelectorAll('input, select, textarea').forEach((element) => {
			const inputElement = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

			if (inputElement.name) {
				if (inputElement.type === 'checkbox') {
					data[inputElement.name] = (inputElement as HTMLInputElement).checked;
				} else if (inputElement.type === 'radio') {
					if ((inputElement as HTMLInputElement).checked) {
						data[inputElement.name] = inputElement.value;
					}
				} else if (inputElement.type === 'file') {
					data[inputElement.name] = (inputElement as HTMLInputElement).files;
				} else {
					data[inputElement.name] = inputElement.value;
				}
			}
		});

		// Validate form
		incrementSubmitAttempts();

		// Auto-validate if enabled
		if (autoValidate) {
			const errors: Record<string, string> = {};

			formRef.current.querySelectorAll('input, select, textarea').forEach((element) => {
				const inputElement = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

				if (inputElement.required && !inputElement.value.trim()) {
					errors[inputElement.name] = `${inputElement.name} is required`;
				}

				if (inputElement.type === 'email' && inputElement.value) {
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (!emailRegex.test(inputElement.value)) {
						errors[inputElement.name] = 'Please enter a valid email address';
					}
				}
			});

			if (Object.keys(errors).length > 0) {
				setValidationErrors(errors);
				onValidationError?.(errors);

				// Focus first error field
				const firstErrorField = formRef.current?.querySelector(`[name="${Object.keys(errors)[0]}"]`) as HTMLElement;
				firstErrorField?.focus();

				return;
			}
		}

		// Clear existing errors
		setValidationErrors({});

		// Submit form
		try {
			setIsSubmitting(true);
			await onSubmit(data);
		} catch (error) {
			console.error('Form submission error:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AccessibleFormContext.Provider value={contextValue}>
			<div className={`accessible-form ${className}`}>
				{/* Form Header */}
				<div className="mb-6">
					<h2 id={`form-title-${formId}`} className="text-xl font-semibold mb-2">
						{title}
					</h2>
					{description && (
						<p id={`form-description-${formId}`} className="text-gray-600">
							{description}
						</p>
					)}
				</div>

				{/* Validation Summary */}
				{submitAttempts > 0 && (
					<FormSummary
						formName={title}
						isValid={Object.keys(validationErrors).length === 0}
						errors={Object.entries(validationErrors).map(([field, message]) => ({ field, message }))}
					/>
				)}

				{/* Form */}
				<form
					ref={formRef}
					id={`form-${formId}`}
					onSubmit={handleSubmit}
					noValidate={noValidate}
					aria-labelledby={`form-title-${formId}`}
					aria-describedby={description ? `form-description-${formId}` : undefined}
				>
					{children}
				</form>

				{/* Validation Announcer */}
				<FormValidationAnnouncer
					isValid={Object.keys(validationErrors).length === 0}
					errors={Object.entries(validationErrors).map(([field, message]) => ({ field, message }))}
					submitAttempts={submitAttempts}
					formName={title}
				/>
			</div>
		</AccessibleFormContext.Provider>
	);
}

// Accessible Form Field Component
interface AccessibleFormFieldProps {
	name: string;
	label: string;
	required?: boolean;
	description?: string;
	errorMessage?: string;
	hint?: string;
	children: React.ReactNode;
	className?: string;
}

export function AccessibleFormField({
	name,
	label,
	required = false,
	description,
	errorMessage,
	hint,
	children,
	className = '',
}: AccessibleFormFieldProps) {
	const { validationErrors, clearValidationError } = useAccessibleFormContext();
	const fieldId = React.useId();
	const hasError = !!(errorMessage || validationErrors[name]);
	const errorId = hasError ? `${fieldId}-error` : undefined;
	const hintId = hint ? `${fieldId}-hint` : undefined;
	const descriptionId = description ? `${fieldId}-description` : undefined;

	const describedBy = [
		errorId,
		hintId,
		descriptionId,
	].filter(Boolean).join(' ');

	// Clear error when user starts typing
	const handleInputChange = () => {
		if (hasError) {
			clearValidationError(name);
		}
	};

	return (
		<div className={`form-field mb-6 ${className}`}>
			{/* Field Label */}
			<label
				htmlFor={fieldId}
				className="block text-sm font-medium text-gray-700 mb-1"
			>
				{label}
				{required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
			</label>

			{/* Field Description */}
			{description && (
				<div id={descriptionId} className="text-sm text-gray-600 mb-2">
					{description}
				</div>
			)}

			{/* Field Input */}
			<div className="relative">
				{React.cloneElement(children as React.ReactElement, {
					id: fieldId,
					name,
					'aria-required': required,
					'aria-invalid': hasError,
					'aria-describedby': describedBy || undefined,
					onChange: handleInputChange,
				})}
			</div>

			{/* Field Hint */}
			{hint && (
				<div id={hintId} className="text-sm text-gray-500 mt-1">
					{hint}
				</div>
			)}

			{/* Field Error */}
			{hasError && (
				<ValidationMessage
					type="error"
					message={errorMessage || validationErrors[name]}
					fieldName={label}
				/>
			)}
		</div>
	);
}

// Accessible Input Component
interface AccessibleInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'aria-required' | 'aria-invalid' | 'aria-describedby'> {
	name: string;
	type?: string;
	label?: string;
	error?: string;
	description?: string;
	hint?: string;
	autoValidate?: boolean;
	validator?: (value: string) => string | null;
	onValidationChange?: (isValid: boolean, error?: string) => void;
}

export function AccessibleInput({
	name,
	type = 'text',
	label,
	error,
	description,
	hint,
	autoValidate = false,
	validator,
	onValidationChange,
	className = '',
	...props
}: AccessibleInputProps) {
	const [validationError, setValidationError] = useState<string>('');
	const [isValid, setIsValid] = useState<boolean | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const inputId = React.useId();
	const { setValidationError: setFormError, clearValidationError } = useAccessibleFormContext();

	const validateInput = useCallback((value: string) => {
		if (!validator) return null;

		try {
			const error = validator(value);
			setValidationError(error || '');
			setIsValid(!error);
			onValidationChange?.(!error, error || undefined);
			return error;
		} catch (err) {
			const errorMessage = 'Validation failed';
			setValidationError(errorMessage);
			setIsValid(false);
			onValidationChange?.(false, errorMessage);
			return errorMessage;
		}
	}, [validator, onValidationChange]);

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		if (autoValidate && validator) {
			const error = validateInput(e.target.value);
			if (error) {
				setFormError(name, error);
			} else {
				clearValidationError(name);
			}
		}
		props.onBlur?.(e);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Clear validation error on change
		if (validationError) {
			setValidationError('');
			setIsValid(null);
			clearValidationError(name);
		}
		props.onChange?.(e);
	};

	const hasError = !!(error || validationError);
	const fieldError = error || validationError;

	return (
		<div className={`accessible-input ${className}`}>
			{label && (
				<label
					htmlFor={inputId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					{label}
					{props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
				</label>
			)}

			{description && (
				<div id={`${inputId}-description`} className="text-sm text-gray-600 mb-2">
					{description}
				</div>
			)}

			<input
				ref={inputRef}
				id={inputId}
				name={name}
				type={type}
				aria-invalid={hasError}
				aria-describedby={
					[
						description && `${inputId}-description`,
						hint && `${inputId}-hint`,
						hasError && `${inputId}-error`,
					]
						.filter(Boolean)
						.join(' ') || undefined
				}
				onBlur={handleBlur}
				onChange={handleChange}
				className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
					hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
				} ${className}`}
				{...props}
			/>

			{hint && (
				<div id={`${inputId}-hint`} className="text-sm text-gray-500 mt-1">
					{hint}
				</div>
			)}

			{hasError && (
				<div
					id={`${inputId}-error`}
					role="alert"
					aria-live="assertive"
					className="text-red-600 text-sm mt-1"
				>
					{fieldError}
				</div>
			)}

			{isValid !== null && !hasError && (
				<div
					role="status"
					aria-live="polite"
					className="text-green-600 text-sm mt-1"
				>
					Valid input
				</div>
			)}
		</div>
	);
}

// Accessible Select Component
interface AccessibleSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'aria-required' | 'aria-invalid' | 'aria-describedby'> {
	name: string;
	label?: string;
	options: Array<{ value: string; label: string; disabled?: boolean }>;
	error?: string;
	description?: string;
	hint?: string;
	placeholder?: string;
	className?: string;
}

export function AccessibleSelect({
	name,
	label,
	options,
	error,
	description,
	hint,
	placeholder,
	className = '',
	...props
}: AccessibleSelectProps) {
	const selectId = React.useId();
	const hasError = !!error;

	return (
		<div className={`accessible-select ${className}`}>
			{label && (
				<label
					htmlFor={selectId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					{label}
					{props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
				</label>
			)}

			{description && (
				<div id={`${selectId}-description`} className="text-sm text-gray-600 mb-2">
					{description}
				</div>
			)}

			<select
				id={selectId}
				name={name}
				aria-invalid={hasError}
				aria-describedby={
					[
						description && `${selectId}-description`,
						hint && `${selectId}-hint`,
						hasError && `${selectId}-error`,
					]
						.filter(Boolean)
						.join(' ') || undefined
				}
				className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
					hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
				} ${className}`}
				{...props}
			>
				{placeholder && (
					<option value="" disabled={!props.required}>
						{placeholder}
					</option>
				)}
				{options.map((option) => (
					<option
						key={option.value}
						value={option.value}
						disabled={option.disabled}
					>
						{option.label}
					</option>
				))}
			</select>

			{hint && (
				<div id={`${selectId}-hint`} className="text-sm text-gray-500 mt-1">
					{hint}
				</div>
			)}

			{hasError && (
				<div
					id={`${selectId}-error`}
					role="alert"
					aria-live="assertive"
					className="text-red-600 text-sm mt-1"
				>
					{error}
				</div>
			)}
		</div>
	);
}

// Accessible Textarea Component
interface AccessibleTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'aria-required' | 'aria-invalid' | 'aria-describedby'> {
	name: string;
	label?: string;
	error?: string;
	description?: string;
	hint?: string;
	maxLength?: number;
	showCharCount?: boolean;
	className?: string;
}

export function AccessibleTextarea({
	name,
	label,
	error,
	description,
	hint,
	maxLength,
	showCharCount = false,
	className = '',
	value,
	...props
}: AccessibleTextareaProps) {
	const textareaId = React.useId();
	const hasError = !!error;
	const currentLength = (value || '').length;

	return (
		<div className={`accessible-textarea ${className}`}>
			{label && (
				<label
					htmlFor={textareaId}
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					{label}
					{props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
				</label>
			)}

			{description && (
				<div id={`${textareaId}-description`} className="text-sm text-gray-600 mb-2">
					{description}
				</div>
			)}

			<textarea
				id={textareaId}
				name={name}
				aria-invalid={hasError}
				aria-describedby={
					[
						description && `${textareaId}-description`,
						hint && `${textareaId}-hint`,
						hasError && `${textareaId}-error`,
						showCharCount && maxLength && `${textareaId}-charcount`,
					]
						.filter(Boolean)
						.join(' ') || undefined
				}
				maxLength={maxLength}
				className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y ${
					hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
				} ${className}`}
				value={value}
				{...props}
			/>

			{hint && (
				<div id={`${textareaId}-hint`} className="text-sm text-gray-500 mt-1">
					{hint}
				</div>
			)}

			{showCharCount && maxLength && (
				<div
					id={`${textareaId}-charcount`}
					className="text-sm text-gray-500 mt-1"
					aria-live="polite"
				>
					{currentLength} / {maxLength} characters
				</div>
			)}

			{hasError && (
				<div
					id={`${textareaId}-error`}
					role="alert"
					aria-live="assertive"
					className="text-red-600 text-sm mt-1"
				>
					{error}
				</div>
			)}
		</div>
	);
}

// Accessible Checkbox Component
interface AccessibleCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'aria-required' | 'aria-invalid' | 'aria-describedby'> {
	name: string;
	label: string;
	error?: string;
	description?: string;
	hint?: string;
	required?: boolean;
	className?: string;
}

export function AccessibleCheckbox({
	name,
	label,
	error,
	description,
	hint,
	required = false,
	className = '',
	...props
}: AccessibleCheckboxProps) {
	const checkboxId = React.useId();
	const hasError = !!error;

	return (
		<div className={`accessible-checkbox ${className}`}>
			<div className="flex items-start">
				<input
					id={checkboxId}
					name={name}
					type="checkbox"
					aria-invalid={hasError}
					aria-required={required}
					aria-describedby={
						[
							description && `${checkboxId}-description`,
							hint && `${checkboxId}-hint`,
							hasError && `${checkboxId}-error`,
						]
							.filter(Boolean)
							.join(' ') || undefined
					}
					className={`mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
						hasError ? 'border-red-500' : ''
					} ${className}`}
					{...props}
				/>
				<div className="ml-3 flex-1">
					<label
						htmlFor={checkboxId}
						className="text-sm font-medium text-gray-700"
					>
						{label}
						{required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
					</label>

					{description && (
						<div id={`${checkboxId}-description`} className="text-sm text-gray-600 mt-1">
							{description}
						</div>
					)}

					{hint && (
						<div id={`${checkboxId}-hint`} className="text-sm text-gray-500 mt-1">
							{hint}
						</div>
					)}

					{hasError && (
						<div
							id={`${checkboxId}-error`}
							role="alert"
							aria-live="assertive"
							className="text-red-600 text-sm mt-1"
						>
							{error}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// Accessible Radio Group Component
interface AccessibleRadioGroupProps {
	name: string;
	label?: string;
	options: Array<{ value: string; label: string; description?: string }>;
	error?: string;
	description?: string;
	hint?: string;
	required?: boolean;
	className?: string;
	onChange?: (value: string) => void;
	value?: string;
}

export function AccessibleRadioGroup({
	name,
	label,
	options,
	error,
	description,
	hint,
	required = false,
	className = '',
	onChange,
	value,
}: AccessibleRadioGroupProps) {
	const radioGroupId = React.useId();
	const hasError = !!error;

	return (
		<div className={`accessible-radio-group ${className}`}>
			{label && (
				<fieldset>
					<legend className="text-sm font-medium text-gray-700 mb-2">
						{label}
						{required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
					</legend>
				</fieldset>
			)}

			{description && (
				<div id={`${radioGroupId}-description`} className="text-sm text-gray-600 mb-2">
					{description}
				</div>
			)}

			<div
				role="radiogroup"
				aria-required={required}
				aria-describedby={
					[
						description && `${radioGroupId}-description`,
						hint && `${radioGroupId}-hint`,
						hasError && `${radioGroupId}-error`,
					]
						.filter(Boolean)
						.join(' ') || undefined
				}
				aria-invalid={hasError}
			>
				{options.map((option, index) => {
					const optionId = `${radioGroupId}-${index}`;
					return (
						<div key={option.value} className="flex items-center mb-2">
							<input
								id={optionId}
								name={name}
								type="radio"
								value={option.value}
								checked={value === option.value}
								onChange={(e) => onChange?.(e.target.value)}
								className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
							/>
							<div className="ml-3">
								<label
									htmlFor={optionId}
									className="text-sm font-medium text-gray-700"
								>
									{option.label}
								</label>
								{option.description && (
									<div className="text-sm text-gray-600">
										{option.description}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{hint && (
				<div id={`${radioGroupId}-hint`} className="text-sm text-gray-500 mt-1">
					{hint}
				</div>
			)}

			{hasError && (
				<div
					id={`${radioGroupId}-error`}
					role="alert"
					aria-live="assertive"
					className="text-red-600 text-sm mt-1"
				>
					{error}
				</div>
			)}
		</div>
	);
}

export default {
	AccessibleForm,
	AccessibleFormField,
	AccessibleInput,
	AccessibleSelect,
	AccessibleTextarea,
	AccessibleCheckbox,
	AccessibleRadioGroup,
	useAccessibleFormContext,
};

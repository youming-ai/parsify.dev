/**
 * Live Region Components
 * Comprehensive live region management for dynamic content announcements
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLiveRegion, useScreenReader } from '@/lib/screen-reader';

// Base Live Region Component
interface LiveRegionProps {
	id: string;
	politeness?: 'polite' | 'assertive';
	atomic?: boolean;
	relevant?: 'additions' | 'removals' | 'text' | 'all';
	busy?: boolean;
	children?: React.ReactNode;
	className?: string;
}

export function LiveRegion({
	id,
	politeness = 'polite',
	atomic = true,
	relevant = 'additions text',
	busy = false,
	children,
	className = '',
}: LiveRegionProps) {
	const { announce } = useLiveRegion(id, politeness);
	const [isBusy, setIsBusy] = useState(busy);
	const lastAnnouncementRef = useRef<string>('');

	useEffect(() => {
		setIsBusy(busy);
	}, [busy]);

	const announceMessage = useCallback((message: string, clearPrevious = false) => {
		// Avoid duplicate announcements
		if (message === lastAnnouncementRef.current && !clearPrevious) {
			return;
		}

		lastAnnouncementRef.current = message;
		announce(message, clearPrevious);
	}, [announce]);

	return (
		<div
			id={id}
			className={`sr-live-region ${className}`}
			aria-live={politeness}
			aria-atomic={atomic}
			aria-relevant={relevant}
			aria-busy={isBusy}
			style={{
				position: 'absolute',
				left: '-10000px',
				width: '1px',
				height: '1px',
				overflow: 'hidden',
				clip: 'rect(0, 0, 0, 0)',
				whiteSpace: 'nowrap',
			}}
		>
			{children}
		</div>
	);
}

// Status Announcer Component
interface StatusAnnouncerProps {
	status: string;
	timeout?: number;
	clearPrevious?: boolean;
	className?: string;
}

export function StatusAnnouncer({ status, timeout = 2000, clearPrevious = false, className = '' }: StatusAnnouncerProps) {
	const [currentStatus, setCurrentStatus] = useState('');
	const statusId = React.useId();

	useEffect(() => {
		if (status !== currentStatus) {
			setCurrentStatus(status);
		}
	}, [status, currentStatus]);

	return (
		<LiveRegion
			id={`status-${statusId}`}
			politeness="polite"
			className={className}
		>
			{currentStatus && (
				<span aria-live="polite" aria-atomic="true">
					{currentStatus}
				</span>
			)}
		</LiveRegion>
	);
}

// Progress Announcer Component
interface ProgressAnnouncerProps {
	value: number;
	max: number;
	min?: number;
	label?: string;
	showPercentage?: boolean;
	busy?: boolean;
	className?: string;
}

export function ProgressAnnouncer({
	value,
	max,
	min = 0,
	label,
	showPercentage = true,
	busy,
	className = '',
}: ProgressAnnouncerProps) {
	const [lastValue, setLastValue] = useState(min);
	const progressId = React.useId();
	const { announceProgress } = useScreenReader();

	const percentage = Math.round(((value - min) / (max - min)) * 100);

	useEffect(() => {
		// Only announce significant progress changes (every 5% or completion)
		const percentageChange = Math.abs(percentage - Math.round(((lastValue - min) / (max - min)) * 100));

		if (percentageChange >= 5 || value === max || value === min) {
			const message = label || 'Progress';
			if (busy) {
				announceProgress(`${message}: Processing`, value, max);
			} else {
				announceProgress(`${message}: ${showPercentage ? `${percentage}%` : `${value} of ${max}`}`, value, max);
			}
			setLastValue(value);
		}
	}, [value, min, max, label, showPercentage, busy, lastValue, announceProgress]);

	return (
		<LiveRegion
			id={`progress-${progressId}`}
			politeness="polite"
			busy={busy}
			className={className}
		>
			{label && (
				<span role="status" aria-live="polite">
					{label}: {showPercentage ? `${percentage}% complete` : `${value} of ${max}`}
				</span>
			)}
		</LiveRegion>
	);
}

// List Announcer Component
interface ListAnnouncerProps {
	items: Array<{ id: string; content: string; selected?: boolean }>;
	label: string;
	announcementType?: 'addition' | 'removal' | 'selection' | 'reorder';
	className?: string;
}

export function ListAnnouncer({
	items,
	label,
	announcementType = 'addition',
	className = '',
}: ListAnnouncerProps) {
	const listId = React.useId();
	const { announce } = useScreenReader();
	const [lastItemCount, setLastItemCount] = useState(0);

	useEffect(() => {
		const itemCount = items.length;
		const selectedCount = items.filter(item => item.selected).length;

		let message = '';

		switch (announcementType) {
			case 'addition':
				if (itemCount > lastItemCount) {
					message = `${label}: ${itemCount - lastItemCount} item${itemCount - lastItemCount !== 1 ? 's' : ''} added. Total: ${itemCount}`;
				}
				break;
			case 'removal':
				if (itemCount < lastItemCount) {
					message = `${label}: ${lastItemCount - itemCount} item${lastItemCount - itemCount !== 1 ? 's' : ''} removed. Total: ${itemCount}`;
				}
				break;
			case 'selection':
				if (selectedCount > 0) {
					message = `${label}: ${selectedCount} item${selectedCount !== 1 ? 's' : ''} selected`;
				} else {
					message = `${label}: No items selected`;
				}
				break;
			case 'reorder':
				message = `${label}: List reordered. ${itemCount} item${itemCount !== 1 ? 's' : ''}`;
				break;
		}

		if (message) {
			announce(message, { priority: 'polite', clearPrevious: false });
		}

		setLastItemCount(itemCount);
	}, [items, label, announcementType, lastItemCount, announce]);

	return (
		<LiveRegion
			id={`list-${listId}`}
			politeness="polite"
			className={className}
		>
			<span role="status">
				{label}: {items.length} item{items.length !== 1 ? 's' : ''}
			</span>
		</LiveRegion>
	);
}

// Form Validation Announcer Component
interface FormValidationAnnouncerProps {
	isValid: boolean;
	errors: Array<{ field: string; message: string }>;
	submitAttempts?: number;
	formName?: string;
	className?: string;
}

export function FormValidationAnnouncer({
	isValid,
	errors,
	submitAttempts = 0,
	formName = 'Form',
	className = '',
}: FormValidationAnnouncerProps) {
	const formId = React.useId();
	const { announceError, announceSuccess } = useScreenReader();

	useEffect(() => {
		if (submitAttempts > 0) {
			if (isValid) {
				announceSuccess(`${formName} submitted successfully`);
			} else {
				const errorCount = errors.length;
				const message = `${formName} has ${errorCount} error${errorCount !== 1 ? 's' : ''}`;

				// Announce first few errors for better UX
				const errorDetails = errors.slice(0, 3).map(e => `${e.field}: ${e.message}`).join('; ');
				const fullMessage = errorDetails ? `${message}. ${errorDetails}` : message;

				announceError(fullMessage);
			}
		}
	}, [isValid, errors, submitAttempts, formName, announceError, announceSuccess]);

	return (
		<LiveRegion
			id={`form-validation-${formId}`}
			politeness="assertive"
			className={className}
		>
			{!isValid && errors.length > 0 && (
				<div role="alert" aria-live="assertive">
					{errors.map((error, index) => (
						<div key={index}>{error.field}: {error.message}</div>
					))}
				</div>
			)}
		</LiveRegion>
	);
}

// Navigation Announcer Component
interface NavigationAnnouncerProps {
	currentPage: string;
	pageDescription?: string;
	breadcrumbs?: Array<{ label: string; href: string }>;
	menuLevel?: number;
	className?: string;
}

export function NavigationAnnouncer({
	currentPage,
	pageDescription,
	breadcrumbs = [],
	menuLevel = 0,
	className = '',
}: NavigationAnnouncerProps) {
	const navId = React.useId();
	const { announcePageChange, announceNavigationChange } = useScreenReader();

	useEffect(() => {
		let message = currentPage;

		if (menuLevel > 0) {
			message = `Menu level ${menuLevel}: ${currentPage}`;
		}

		if (pageDescription) {
			message += `. ${pageDescription}`;
		}

		if (menuLevel === 0) {
			announcePageChange(currentPage, pageDescription);
		} else {
			announceNavigationChange('moved', message);
		}
	}, [currentPage, pageDescription, menuLevel, announcePageChange, announceNavigationChange]);

	return (
		<LiveRegion
			id={`navigation-${navId}`}
			politeness="polite"
			className={className}
		>
			<span role="navigation" aria-label="Current location">
				{breadcrumbs.length > 0 && (
					<nav aria-label="Breadcrumb">
						{breadcrumbs.map((crumb, index) => (
							<span key={index}>
								{index > 0 && ' > '}
								{crumb.label}
							</span>
						))}
					</nav>
				)}
				{currentPage}
			</span>
		</LiveRegion>
	);
}

// Dynamic Content Announcer Component
interface DynamicContentAnnouncerProps {
	content: string;
	contentType?: 'text' | 'list' | 'table' | 'form' | 'error' | 'success' | 'info';
	priority?: 'polite' | 'assertive';
	announceOnChange?: boolean;
	className?: string;
}

export function DynamicContentAnnouncer({
	content,
	contentType = 'text',
	priority = 'polite',
	announceOnChange = true,
	className = '',
}: DynamicContentAnnouncerProps) {
	const contentId = React.useId();
	const { announce, announceError, announceSuccess } = useScreenReader();
	const [lastContent, setLastContent] = useState('');

	useEffect(() => {
		if (content !== lastContent && announceOnChange) {
			let processedContent = content;

			// Add content type context
			switch (contentType) {
				case 'error':
					announceError(content);
					break;
				case 'success':
					announceSuccess(content);
					break;
				case 'list':
					processedContent = `List updated: ${content}`;
					announce(processedContent, { priority });
					break;
				case 'table':
					processedContent = `Table updated: ${content}`;
					announce(processedContent, { priority });
					break;
				case 'form':
					processedContent = `Form: ${content}`;
					announce(processedContent, { priority });
					break;
				case 'info':
					processedContent = `Information: ${content}`;
					announce(processedContent, { priority });
					break;
				default:
					announce(content, { priority });
			}

			setLastContent(content);
		}
	}, [content, contentType, priority, announceOnChange, lastContent, announce, announceError, announceSuccess]);

	return (
		<LiveRegion
			id={`dynamic-${contentId}`}
			politeness={priority}
			className={className}
		>
			<span role={contentType === 'error' ? 'alert' : 'status'}>
				{content}
			</span>
		</LiveRegion>
	);
}

// Table Announcer Component
interface TableAnnouncerProps {
	tableInfo: {
		title?: string;
		description?: string;
		rowCount: number;
		columnCount: number;
		sortColumn?: string;
		sortDirection?: 'asc' | 'desc';
	};
	onChange?: string;
	className?: string;
}

export function TableAnnouncer({
	tableInfo,
	onChange,
	className = '',
}: TableAnnouncerProps) {
	const tableId = React.useId();
	const { announce } = useScreenReader();
	const [lastTableInfo, setLastTableInfo] = useState(tableInfo);

	useEffect(() => {
		if (JSON.stringify(tableInfo) !== JSON.stringify(lastTableInfo)) {
			let message = `Table: ${tableInfo.title || 'Data table'}`;
			message += ` with ${tableInfo.rowCount} rows and ${tableInfo.columnCount} columns`;

			if (tableInfo.sortColumn) {
				const direction = tableInfo.sortDirection === 'asc' ? 'ascending' : 'descending';
				message += `. Sorted by ${tableInfo.sortColumn} in ${direction} order`;
			}

			if (tableInfo.description) {
				message += `. ${tableInfo.description}`;
			}

			if (onChange) {
				message += `. ${onChange}`;
			}

			announce(message, { priority: 'polite', clearPrevious: false });
			setLastTableInfo(tableInfo);
		}
	}, [tableInfo, onChange, lastTableInfo, announce]);

	return (
		<LiveRegion
			id={`table-${tableId}`}
			politeness="polite"
			className={className}
		>
			<span role="status" aria-live="polite">
				{tableInfo.title || 'Table'}: {tableInfo.rowCount} rows, {tableInfo.columnCount} columns
				{tableInfo.sortColumn && (
					`. Sorted by {tableInfo.sortColumn} ({tableInfo.sortDirection === 'asc' ? 'A to Z' : 'Z to A'})`
				)}
			</span>
		</LiveRegion>
	);
}

// Search Results Announcer Component
interface SearchResultsAnnouncerProps {
	query: string;
	resultCount: number;
	isLoading?: boolean;
	hasError?: boolean;
	errorMessage?: string;
	className?: string;
}

export function SearchResultsAnnouncer({
	query,
	resultCount,
	isLoading = false,
	hasError = false,
	errorMessage,
	className = '',
}: SearchResultsAnnouncerProps) {
	const searchId = React.useId();
	const { announce, announceError } = useScreenReader();

	useEffect(() => {
		let message = '';

		if (hasError) {
			message = `Search failed: ${errorMessage || 'An error occurred while searching'}`;
			announceError(message);
		} else if (isLoading) {
			message = `Searching for "${query}"...`;
			announce(message, { priority: 'polite' });
		} else {
			if (query) {
				if (resultCount === 0) {
					message = `No results found for "${query}"`;
				} else {
					message = `Found ${resultCount} result${resultCount !== 1 ? 's' : ''} for "${query}"`;
				}
			} else {
				if (resultCount === 0) {
					message = 'No results available';
				} else {
					message = `${resultCount} result${resultCount !== 1 ? 's' : ''} available`;
				}
			}
			announce(message, { priority: 'polite' });
		}
	}, [query, resultCount, isLoading, hasError, errorMessage, announce, announceError]);

	return (
		<LiveRegion
			id={`search-${searchId}`}
			politeness="polite"
			className={className}
		>
			<span role="status" aria-live="polite">
				{isLoading && 'Searching...'}
				{hasError && `Search error: ${errorMessage}`}
				{!isLoading && !hasError && (
					query
						? `${resultCount} result${resultCount !== 1 ? 's' : ''} for "${query}"`
						: `${resultCount} result${resultCount !== 1 ? 's' : ''} available`
				)}
			</span>
		</LiveRegion>
	);
}

// Modal Announcer Component
interface ModalAnnouncerProps {
	isOpen: boolean;
	title: string;
	description?: string;
	className?: string;
}

export function ModalAnnouncer({
	isOpen,
	title,
	description,
	className = '',
}: ModalAnnouncerProps) {
	const modalId = React.useId();
	const { announce } = useScreenReader();

	useEffect(() => {
		if (isOpen) {
			let message = `Dialog opened: ${title}`;
			if (description) {
				message += `. ${description}`;
			}
			message += '. Press Escape to close.';

			announce(message, { priority: 'assertive', clearPrevious: true });
		} else {
			announce('Dialog closed', { priority: 'polite' });
		}
	}, [isOpen, title, description, announce]);

	return (
		<LiveRegion
			id={`modal-${modalId}`}
			politeness="assertive"
			className={className}
		>
			{isOpen && (
				<div role="dialog" aria-modal="true" aria-labelledby={`${modalId}-title`} aria-describedby={`${modalId}-description`}>
					<h2 id={`${modalId}-title`}>{title}</h2>
					{description && <p id={`${modalId}-description`}>{description}</p>}
				</div>
			)}
		</LiveRegion>
	);
}

// Error Boundary Announcer Component
interface ErrorBoundaryAnnouncerProps {
	error?: Error;
	errorInfo?: React.ErrorInfo;
	className?: string;
}

export function ErrorBoundaryAnnouncer({
	error,
	errorInfo,
	className = '',
}: ErrorBoundaryAnnouncerProps) {
	const errorId = React.useId();
	const { announceError } = useScreenReader();

	useEffect(() => {
		if (error) {
			let message = 'An error occurred';

			if (error.name && error.name !== 'Error') {
				message = `${error.name}: ${error.message}`;
			} else if (error.message) {
				message = `Error: ${error.message}`;
			}

			announceError(message, 'application');
		}
	}, [error, announceError]);

	return (
		<LiveRegion
			id={`error-boundary-${errorId}`}
			politeness="assertive"
			className={className}
		>
			{error && (
				<div role="alert" aria-live="assertive">
					<h3>Error Occurred</h3>
					<p>{error.message}</p>
					{errorInfo && (
						<details>
							<summary>Error Details</summary>
							<pre>{errorInfo.componentStack}</pre>
						</details>
					)}
				</div>
			)}
		</LiveRegion>
	);
}

export default LiveRegion;

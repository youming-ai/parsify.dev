/**
 * Accessible Table Components
 * Screen reader-optimized table components with comprehensive ARIA support
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TableAnnouncer } from './live-region';
import { useScreenReader } from '@/lib/screen-reader';

// Accessible Table Props
interface AccessibleTableProps {
	title: string;
	description?: string;
	columns: Array<{
		key: string;
		label: string;
		sortable?: boolean;
		sortDirection?: 'asc' | 'desc' | null;
		onSort?: (columnKey: string) => void;
		width?: string;
		align?: 'left' | 'center' | 'right';
		description?: string;
	}>;
	data: Array<Record<string, any>>;
	rowKey?: string | ((row: Record<string, any>, index: number) => string);
	expandable?: boolean;
	onRowExpand?: (row: Record<string, any>) => void;
	expandableContent?: (row: Record<string, any>) => React.ReactNode;
	selectable?: boolean;
	onRowSelect?: (selectedRows: Record<string, any>[]) => void;
	pagination?: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage: number;
		onPageChange: (page: number) => void;
	};
	filterable?: boolean;
	onFilter?: (filters: Record<string, string>) => void;
	className?: string;
	compact?: boolean;
	bordered?: boolean;
	striped?: boolean;
}

export function AccessibleTable({
	title,
	description,
	columns,
	data,
	rowKey = 'id',
	expandable = false,
	onRowExpand,
	expandableContent,
	selectable = false,
	onRowSelect,
	pagination,
	filterable = false,
	onFilter,
	className = '',
	compact = false,
	bordered = true,
	striped = false,
}: AccessibleTableProps) {
	const [sortColumn, setSortColumn] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
	const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
	const [filters, setFilters] = useState<Record<string, string>>({});
	const tableRef = useRef<HTMLTableElement>(null);
	const { announce } = useScreenReader();
	const tableId = React.useId();

	// Get row ID
	const getRowId = useCallback((row: Record<string, any>, index: number) => {
		if (typeof rowKey === 'function') {
			return rowKey(row, index);
		}
		return row[rowKey] || index;
	}, [rowKey]);

	// Handle column sorting
	const handleSort = useCallback((columnKey: string) => {
		const column = columns.find(col => col.key === columnKey);
		if (!column?.sortable) return;

		const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
		setSortColumn(columnKey);
		setSortDirection(newDirection);

		column.onSort?.(columnKey);

		announce(`Sorted by ${column.label} in ${newDirection === 'asc' ? 'ascending' : 'descending'} order`);
	}, [columns, sortColumn, sortDirection, announce]);

	// Handle row selection
	const handleRowSelect = useCallback((rowId: string | number, checked: boolean) => {
		const newSelectedRows = new Set(selectedRows);
		if (checked) {
			newSelectedRows.add(rowId);
		} else {
			newSelectedRows.delete(rowId);
		}
		setSelectedRows(newSelectedRows);
		onRowSelect?.(data.filter(row => newSelectedRows.has(getRowId(row, data.indexOf(row)))));

		const action = checked ? 'selected' : 'deselected';
		announce(`Row ${action}. ${newSelectedRows.size} row${newSelectedRows.size !== 1 ? 's' : ''} selected`);
	}, [selectedRows, data, getRowId, onRowSelect, announce]);

	// Handle row expansion
	const handleRowExpand = useCallback((rowId: string | number, row: Record<string, any>) => {
		const newExpandedRows = new Set(expandedRows);
		const isExpanded = newExpandedRows.has(rowId);

		if (isExpanded) {
			newExpandedRows.delete(rowId);
		} else {
			newExpandedRows.add(rowId);
		}

		setExpandedRows(newExpandedRows);
		onRowExpand?.(row);

		const action = isExpanded ? 'collapsed' : 'expanded';
		announce(`Row ${action}`);
	}, [expandedRows, onRowExpand, announce]);

	// Handle filtering
	const handleFilter = useCallback((columnKey: string, value: string) => {
		const newFilters = { ...filters, [columnKey]: value };
		if (!value) {
			delete newFilters[columnKey];
		}
		setFilters(newFilters);
		onFilter?.(newFilters);

		if (value) {
			announce(`Filtered by ${columns.find(col => col.key === columnKey)?.label}: ${value}`);
		} else {
			announce(`Filter removed from ${columns.find(col => col.key === columnKey)?.label}`);
		}
	}, [filters, columns, onFilter, announce]);

	// Keyboard navigation
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		const target = e.target as HTMLElement;
		const row = target.closest('tr[role="row"]');
		if (!row) return;

		let targetRow: HTMLTableRowElement | null = null;

		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault();
				targetRow = row.previousElementSibling as HTMLTableRowElement;
				break;
			case 'ArrowDown':
				e.preventDefault();
				targetRow = row.nextElementSibling as HTMLTableRowElement;
				break;
			case 'Home':
				e.preventDefault();
				targetRow = row.parentElement?.firstElementChild as HTMLTableRowElement;
				break;
			case 'End':
				e.preventDefault();
				targetRow = row.parentElement?.lastElementChild as HTMLTableRowElement;
				break;
			case 'Enter':
			case ' ':
				if (expandable) {
					e.preventDefault();
					const rowId = row.getAttribute('data-row-id');
					if (rowId) {
						const index = parseInt(rowId);
						const rowData = data[index];
						if (rowData) {
							handleRowExpand(getRowId(rowData, index), rowData);
						}
					}
				}
				break;
		}

		if (targetRow) {
			const firstCell = targetRow.querySelector('td, th') as HTMLElement;
			firstCell?.focus();
		}
	}, [expandable, data, getRowId, handleRowExpand]);

	// Table info for announcer
	const tableInfo = {
		title,
		description,
		rowCount: data.length,
		columnCount: columns.length,
		sortColumn: sortColumn ? columns.find(col => col.key === sortColumn)?.label : undefined,
		sortDirection: sortDirection || undefined,
	};

	return (
		<div className={`accessible-table-container ${className}`}>
			<TableAnnouncer tableInfo={tableInfo} />

			{/* Table Caption */}
			<div className="mb-4">
				<h2 id={`table-title-${tableId}`} className="text-lg font-semibold">
					{title}
				</h2>
				{description && (
					<p id={`table-description-${tableId}`} className="text-sm text-gray-600">
						{description}
					</p>
				)}
			</div>

			{/* Filters */}
			{filterable && (
				<div className="mb-4 p-3 bg-gray-50 rounded border" role="region" aria-label="Table filters">
					<h3 className="text-sm font-medium mb-2">Filter Table</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
						{columns.filter(col => col.sortable).map(column => (
							<div key={column.key} className="flex flex-col">
								<label htmlFor={`filter-${column.key}-${tableId}`} className="text-xs font-medium text-gray-700">
									{column.label}
								</label>
								<input
									id={`filter-${column.key}-${tableId}`}
									type="text"
									value={filters[column.key] || ''}
									onChange={(e) => handleFilter(column.key, e.target.value)}
									className="mt-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder={`Filter ${column.label}...`}
								/>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Table Controls */}
			<div className="mb-4 flex flex-wrap gap-2">
				{selectable && selectedRows.size > 0 && (
					<div className="text-sm text-gray-600" role="status" aria-live="polite">
						{selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
					</div>
				)}
				{sortColumn && (
					<div className="text-sm text-gray-600" role="status" aria-live="polite">
						Sorted by {columns.find(col => col.key === sortColumn)?.label} ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
					</div>
				)}
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table
					ref={tableRef}
					id={`table-${tableId}`}
					role="table"
					aria-labelledby={`table-title-${tableId}`}
					aria-describedby={description ? `table-description-${tableId}` : undefined}
					aria-rowcount={pagination ? pagination.totalItems : data.length}
					className={`w-full ${bordered ? 'border border-gray-200' : ''} ${compact ? 'text-sm' : ''}`}
					onKeyDown={handleKeyDown}
				>
					<thead>
						<tr role="row">
							{selectable && (
								<th
									scope="col"
									role="columnheader"
									className="px-4 py-2 text-left font-medium text-gray-700 bg-gray-50 border-b"
								>
									<input
										type="checkbox"
										aria-label="Select all rows"
										checked={selectedRows.size === data.length && data.length > 0}
										indeterminate={selectedRows.size > 0 && selectedRows.size < data.length}
										onChange={(e) => {
											const rowIds = data.map(row => getRowId(row, data.indexOf(row)));
											if (e.target.checked) {
												setSelectedRows(new Set(rowIds));
												onRowSelect?.([...data]);
											} else {
												setSelectedRows(new Set());
												onRowSelect?.([]);
											}
											announce(e.target.checked ? 'All rows selected' : 'All rows deselected');
										}}
										className="rounded focus:ring-2 focus:ring-blue-500"
									/>
								</th>
							)}
							{columns.map(column => (
								<th
									key={column.key}
									scope="col"
									role="columnheader"
									aria-sort={
										column.sortable && sortColumn === column.key
											? sortDirection === 'asc' ? 'ascending' : 'descending'
											: undefined
									}
									className={`px-4 py-2 font-medium text-gray-700 bg-gray-50 border-b ${
										column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
									} ${column.width || ''}`}
								>
									{column.sortable ? (
										<button
											type="button"
											onClick={() => handleSort(column.key)}
											className="flex items-center gap-1 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5"
											aria-label={`Sort by ${column.label}${sortColumn === column.key ? ` (${sortDirection === 'asc' ? 'ascending' : 'descending'})` : ''}`}
										>
											<span>{column.label}</span>
											{sortColumn === column.key && (
												<span aria-hidden="true" className="text-xs">
													{sortDirection === 'asc' ? '↑' : '↓'}
												</span>
											)}
										</button>
									) : (
										<span>{column.label}</span>
									)}
									{column.description && (
										<span className="sr-only">{column.description}</span>
									)}
								</th>
							))}
							{expandable && (
								<th
									scope="col"
									role="columnheader"
									className="px-4 py-2 text-left font-medium text-gray-700 bg-gray-50 border-b"
								>
									<span className="sr-only">Expand/Collapse</span>
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{data.map((row, rowIndex) => {
							const rowId = getRowId(row, rowIndex);
							const isSelected = selectedRows.has(rowId);
							const isExpanded = expandedRows.has(rowId);

							return (
								<React.Fragment key={rowId}>
									<tr
										data-row-id={rowIndex}
										role="row"
										aria-selected={isSelected}
										aria-expanded={expandable ? isExpanded : undefined}
										className={`border-b hover:bg-gray-50 ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''} ${
											isSelected ? 'bg-blue-50' : ''
										}`}
									>
										{selectable && (
											<td
												role="gridcell"
												className="px-4 py-2 border-r"
											>
												<input
													type="checkbox"
													checked={isSelected}
													onChange={(e) => handleRowSelect(rowId, e.target.checked)}
													aria-label={`Select row ${rowIndex + 1}`}
													className="rounded focus:ring-2 focus:ring-blue-500"
												/>
											</td>
										)}
										{columns.map(column => {
											const value = row[column.key];
											const cellId = `cell-${tableId}-${rowIndex}-${column.key}`;

											return (
												<td
													key={column.key}
													id={cellId}
													role="gridcell"
													headers={`header-${column.key}`}
													className={`px-4 py-2 border-r ${
														column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
													}`}
												>
													{typeof value === 'boolean' ? (
														<span aria-label={value ? 'Yes' : 'No'}>
															{value ? 'Yes' : 'No'}
														</span>
													) : (
														value ?? ''
													)}
												</td>
											);
										})}
										{expandable && (
											<td
												role="gridcell"
												className="px-4 py-2"
											>
												{expandableContent && (
													<button
														type="button"
														onClick={() => handleRowExpand(rowId, row)}
														aria-label={`Expand row ${rowIndex + 1}`}
														aria-expanded={isExpanded}
														className="p-1 hover:bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
													>
														<span aria-hidden="true">
															{isExpanded ? '▼' : '▶'}
														</span>
														<span className="sr-only">
															{isExpanded ? 'Collapse' : 'Expand'}
														</span>
													</button>
												)}
											</td>
										)}
									</tr>
									{expandable && isExpanded && expandableContent && (
										<tr role="row">
											<td
												colSpan={columns.length + (selectable ? 1 : 0) + 1}
												role="gridcell"
												className="p-4 bg-gray-50 border-b"
											>
												<div className="pl-8">
													{expandableContent(row)}
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{pagination && (
				<div className="mt-4 flex items-center justify-between" role="navigation" aria-label="Table pagination">
					<div className="text-sm text-gray-600">
						Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
						{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
						{pagination.totalItems} entries
					</div>
					<div className="flex gap-1">
						<button
							onClick={() => pagination.onPageChange(1)}
							disabled={pagination.currentPage === 1}
							aria-label="Go to first page"
							className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							First
						</button>
						<button
							onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
							disabled={pagination.currentPage === 1}
							aria-label="Go to previous page"
							className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							Previous
						</button>
						<span className="px-3 py-1 text-sm">
							Page {pagination.currentPage} of {pagination.totalPages}
						</span>
						<button
							onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
							disabled={pagination.currentPage === pagination.totalPages}
							aria-label="Go to next page"
							className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							Next
						</button>
						<button
							onClick={() => pagination.onPageChange(pagination.totalPages)}
							disabled={pagination.currentPage === pagination.totalPages}
							aria-label="Go to last page"
							className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							Last
						</button>
					</div>
				</div>
			)}

			{/* Empty State */}
			{data.length === 0 && (
				<div className="text-center py-8 text-gray-500" role="status">
					No data available
				</div>
			)}
		</div>
	);
}

// Simple Data Table for basic use cases
interface SimpleDataTableProps {
	caption: string;
	headers: string[];
	rows: string[][];
	className?: string;
	striped?: boolean;
	bordered?: boolean;
	responsive?: boolean;
}

export function SimpleDataTable({
	caption,
	headers,
	rows,
	className = '',
	striped = false,
	bordered = true,
	responsive = true,
}: SimpleDataTableProps) {
	const tableId = React.useId();

	return (
		<div className={`${responsive ? 'overflow-x-auto' : ''} ${className}`}>
			<table
				id={`simple-table-${tableId}`}
				role="table"
				aria-label={caption}
				className={`w-full ${bordered ? 'border border-gray-200' : ''}`}
			>
				<caption className="sr-only">{caption}</caption>
				<thead>
					<tr role="row">
						{headers.map((header, index) => (
							<th
								key={index}
								scope="col"
								role="columnheader"
								className="px-4 py-2 text-left font-medium text-gray-700 bg-gray-50 border-b"
							>
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, rowIndex) => (
						<tr
							key={rowIndex}
							role="row"
							className={`${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''} border-b`}
						>
							{row.map((cell, cellIndex) => (
								<td
									key={cellIndex}
									role="gridcell"
									className="px-4 py-2 border-r"
								>
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default AccessibleTable;

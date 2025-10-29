import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type React from 'react';
import { useState } from 'react';
import {
	FILE_TYPE_ICONS,
	type FileTypeCategory,
	type FileUploadStatus,
	type UploadedFile,
} from './file-upload-types';

interface FileListManagerProps {
	/** List of uploaded files */
	files: UploadedFile[];
	/** Whether to show file details */
	showDetails?: boolean;
	/** Whether to show progress bars */
	showProgress?: boolean;
	/** Whether to show action buttons */
	showActions?: boolean;
	/** Maximum number of files to display */
	maxFiles?: number;
	/** Custom class name */
	className?: string;
	/** Event handlers */
	onFileRemove?: (fileId: string) => void;
	onFileDownload?: (file: UploadedFile) => void;
	onFilePreview?: (file: UploadedFile) => void;
	onFileRetry?: (fileId: string) => void;
	onFileCancel?: (fileId: string) => void;
}

export const FileListManager: React.FC<FileListManagerProps> = ({
	files,
	showDetails = true,
	showProgress = true,
	showActions = true,
	maxFiles,
	className,
	onFileRemove,
	onFileDownload,
	onFilePreview,
	onFileRetry,
	onFileCancel,
}) => {
	const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

	const displayedFiles = maxFiles ? files.slice(0, maxFiles) : files;
	const hasMoreFiles = maxFiles && files.length > maxFiles;

	const getFileIcon = (file: UploadedFile): string => {
		const extension = file.name.toLowerCase().split('.').pop();

		if (extension === 'json') return FILE_TYPE_ICONS.json;
		if (file.type.startsWith('text/')) return FILE_TYPE_ICONS.text;
		if (file.type.startsWith('image/')) return FILE_TYPE_ICONS.image;
		if (file.type.includes('document') || file.type.includes('pdf'))
			return FILE_TYPE_ICONS.document;
		if (file.type.includes('sheet') || file.type.includes('excel'))
			return FILE_TYPE_ICONS.spreadsheet;
		if (
			file.type.includes('zip') ||
			file.type.includes('rar') ||
			file.type.includes('compressed')
		)
			return FILE_TYPE_ICONS.archive;

		return FILE_TYPE_ICONS.default;
	};

	const _getFileCategory = (file: UploadedFile): FileTypeCategory => {
		if (file.type.includes('json')) return 'JSON';
		if (file.type.startsWith('text/')) return 'TEXT';
		if (file.type.startsWith('image/')) return 'IMAGE';
		if (file.type.includes('document') || file.type.includes('pdf'))
			return 'DOCUMENT';
		if (file.type.includes('sheet') || file.type.includes('excel'))
			return 'SPREADSHEET';
		if (
			file.type.includes('zip') ||
			file.type.includes('rar') ||
			file.type.includes('compressed')
		)
			return 'ARCHIVE';

		return 'TEXT'; // default
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const formatDate = (timestamp: number): string => {
		return new Date(timestamp).toLocaleString();
	};

	const getStatusColor = (status: FileUploadStatus): string => {
		switch (status) {
			case 'pending':
				return 'text-yellow-600 bg-yellow-50';
			case 'uploading':
				return 'text-blue-600 bg-blue-50';
			case 'success':
				return 'text-green-600 bg-green-50';
			case 'error':
				return 'text-red-600 bg-red-50';
			case 'cancelled':
				return 'text-gray-600 bg-gray-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	};

	const getStatusIcon = (status: FileUploadStatus): React.ReactNode => {
		switch (status) {
			case 'pending':
				return (
					<svg
						className="h-4 w-4 animate-pulse"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-label="Loading icon"
					>
						<title>Loading</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				);
			case 'uploading':
				return (
					<svg
						className="h-4 w-4 animate-spin"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-label="Uploading icon"
					>
						<title>Uploading</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				);
			case 'success':
				return (
					<svg
						className="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				);
			case 'error':
				return (
					<svg
						className="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				);
			case 'cancelled':
				return (
					<svg
						className="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				);
			default:
				return null;
		}
	};

	const toggleExpanded = (fileId: string) => {
		const newExpanded = new Set(expandedFiles);
		if (newExpanded.has(fileId)) {
			newExpanded.delete(fileId);
		} else {
			newExpanded.add(fileId);
		}
		setExpandedFiles(newExpanded);
	};

	if (files.length === 0) {
		return (
			<div className={cn('py-8 text-center text-gray-500', className)}>
				<svg
					className="mx-auto mb-4 h-12 w-12 text-gray-300"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
					/>
				</svg>
				<p className="text-sm">No files uploaded yet</p>
			</div>
		);
	}

	return (
		<div className={cn('space-y-4', className)}>
			{displayedFiles.map((file) => (
				<Card key={file.id} className="overflow-hidden">
					<CardContent className="p-0">
						<div className="p-4">
							<div className="flex items-start justify-between">
								<div className="flex min-w-0 flex-1 items-center space-x-3">
									<div className="flex-shrink-0 text-2xl">
										{getFileIcon(file)}
									</div>

									<div className="min-w-0 flex-1">
										<h3 className="truncate font-medium text-gray-900 text-sm">
											{file.name}
										</h3>
										<div className="mt-1 flex items-center space-x-2">
											<span className="text-gray-500 text-xs">
												{formatFileSize(file.size)}
											</span>
											<span className="text-gray-300">•</span>
											<Badge
												variant="secondary"
												className={cn('text-xs', getStatusColor(file.status))}
											>
												<span className="flex items-center space-x-1">
													{getStatusIcon(file.status)}
													<span>{file.status}</span>
												</span>
											</Badge>
										</div>
									</div>
								</div>

								{showActions && (
									<div className="flex flex-shrink-0 items-center space-x-2">
										{file.status === 'success' && (
											<>
												{onFilePreview && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => onFilePreview(file)}
														className="h-auto p-1"
													>
														<svg
															className="h-4 w-4"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
															/>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
															/>
														</svg>
													</Button>
												)}
												{onFileDownload && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => onFileDownload(file)}
														className="h-auto p-1"
													>
														<svg
															className="h-4 w-4"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
															/>
														</svg>
													</Button>
												)}
											</>
										)}

										{file.status === 'error' && onFileRetry && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => onFileRetry(file.id)}
												className="h-auto p-1 text-blue-600 hover:text-blue-700"
											>
												<svg
													className="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
													/>
												</svg>
											</Button>
										)}

										{file.status === 'uploading' && onFileCancel && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => onFileCancel(file.id)}
												className="h-auto p-1 text-red-600 hover:text-red-700"
											>
												<svg
													className="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</Button>
										)}

										{(file.status === 'success' ||
											file.status === 'error' ||
											file.status === 'cancelled') &&
											onFileRemove && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onFileRemove(file.id)}
													className="h-auto p-1 text-red-600 hover:text-red-700"
												>
													<svg
														className="h-4 w-4"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</Button>
											)}
									</div>
								)}
							</div>

							{showProgress && file.status === 'uploading' && (
								<div className="mt-3">
									<div className="mb-1 flex items-center justify-between">
										<span className="text-gray-500 text-xs">Uploading...</span>
										<span className="text-gray-500 text-xs">
											{file.progress.toFixed(1)}%
										</span>
									</div>
									<div className="h-2 w-full rounded-full bg-gray-200">
										<div
											className="h-2 rounded-full bg-blue-500 transition-all duration-300"
											style={{ width: `${file.progress}%` }}
										/>
									</div>
								</div>
							)}

							{file.error && (
								<Alert className="mt-3">
									<AlertDescription className="text-sm">
										{file.error}
									</AlertDescription>
								</Alert>
							)}

							{showDetails && (
								<div className="mt-3">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => toggleExpanded(file.id)}
										className="h-auto p-0 text-gray-500 text-xs hover:text-gray-700"
									>
										{expandedFiles.has(file.id)
											? 'Hide details'
											: 'Show details'}
									</Button>

									{expandedFiles.has(file.id) && (
										<div className="mt-2 space-y-1 rounded-lg bg-gray-50 p-3 text-gray-600 text-xs">
											<div>
												<strong>Type:</strong> {file.type}
											</div>
											<div>
												<strong>Size:</strong> {formatFileSize(file.size)}
											</div>
											<div>
												<strong>Modified:</strong>{' '}
												{formatDate(file.lastModified)}
											</div>
											<div>
												<strong>Status:</strong> {file.status}
											</div>
											{file.url && (
												<div>
													<strong>URL:</strong>
													<a
														href={file.url}
														target="_blank"
														rel="noopener noreferrer"
														className="ml-1 text-blue-600 hover:underline"
													>
														{file.url}
													</a>
												</div>
											)}
										</div>
									)}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			))}

			{hasMoreFiles && (
				<div className="text-center">
					<p className="text-gray-500 text-sm">
						... and {files.length - maxFiles} more files
					</p>
				</div>
			)}
		</div>
	);
};

export default FileListManager;

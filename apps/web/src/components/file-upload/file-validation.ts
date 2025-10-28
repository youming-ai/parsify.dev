import {
	COMMON_MIME_TYPES,
	type FileUploadOptions,
	type FileValidationError,
} from './file-upload-types';

/**
 * Validates a single file against the provided options
 */
export function validateFile(
	file: File,
	options: FileUploadOptions = {}
): FileValidationError | null {
	const { maxSize, accept, validator } = options;

	// Check file size
	if (maxSize && file.size > maxSize) {
		return {
			code: 'size',
			message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`,
			file,
		};
	}

	// Check file type
	if (accept && accept.length > 0) {
		const isAccepted = accept.some((type) => {
			if (type.startsWith('.')) {
				// Extension match
				return file.name.toLowerCase().endsWith(type.toLowerCase());
			}
			if (type.includes('/*')) {
				// MIME type wildcard match (e.g., 'image/*')
				const category = type.split('/')[0];
				return file.type.startsWith(`${category}/`);
			}
			// Exact MIME type match
			return file.type === type;
		});

		if (!isAccepted) {
			return {
				code: 'type',
				message: `File type "${file.type || 'unknown'}" is not accepted. Accepted types: ${accept.join(', ')}`,
				file,
			};
		}
	}

	// Custom validation
	if (validator) {
		const customError = validator(file);
		if (customError) {
			return {
				code: 'custom',
				message: customError,
				file,
			};
		}
	}

	return null;
}

/**
 * Validates multiple files against the provided options
 */
export function validateFiles(
	files: File[],
	options: FileUploadOptions = {}
): {
	validFiles: File[];
	errors: FileValidationError[];
} {
	const { multiple = true } = options;
	const validFiles: File[] = [];
	const errors: FileValidationError[] = [];

	// Check file count limit
	if (!multiple && files.length > 1) {
		errors.push({
			code: 'count',
			message: `Only one file is allowed, but ${files.length} files were selected`,
		});
		return { validFiles: [], errors };
	}

	// Validate each file
	for (const file of files) {
		const error = validateFile(file, options);
		if (error) {
			errors.push(error);
		} else {
			validFiles.push(file);
		}
	}

	return { validFiles, errors };
}

/**
 * Checks if a file type is supported for preview
 */
export function isPreviewable(file: File): boolean {
	const previewableMimeTypes = [
		...COMMON_MIME_TYPES.JSON,
		...COMMON_MIME_TYPES.TEXT,
		...COMMON_MIME_TYPES.IMAGE,
	];

	return previewableMimeTypes.some((type) => {
		if (type.includes('/*')) {
			const category = type.split('/')[0];
			return file.type.startsWith(`${category}/`);
		}
		return file.type === type;
	});
}

/**
 * Gets the file category based on MIME type
 */
export function getFileCategory(file: File): keyof typeof COMMON_MIME_TYPES {
	for (const [category, mimeTypes] of Object.entries(COMMON_MIME_TYPES)) {
		if (
			mimeTypes.some((type) => {
				if (type.includes('/*')) {
					const mimeCategory = type.split('/')[0];
					return file.type.startsWith(`${mimeCategory}/`);
				}
				return file.type === type;
			})
		) {
			return category as keyof typeof COMMON_MIME_TYPES;
		}
	}

	return 'TEXT'; // default category
}

/**
 * Gets a human-readable file type description
 */
export function getFileTypeDescription(file: File): string {
	const category = getFileCategory(file);

	const categoryDescriptions: Record<keyof typeof COMMON_MIME_TYPES, string> = {
		JSON: 'JSON file',
		TEXT: 'Text file',
		IMAGE: 'Image file',
		DOCUMENT: 'Document',
		SPREADSHEET: 'Spreadsheet',
		ARCHIVE: 'Archive file',
	};

	return categoryDescriptions[category] || 'File';
}

/**
 * Checks if a file is an image
 */
export function isImageFile(file: File): boolean {
	return file.type.startsWith('image/');
}

/**
 * Checks if a file is a text file
 */
export function isTextFile(file: File): boolean {
	return [...COMMON_MIME_TYPES.JSON, ...COMMON_MIME_TYPES.TEXT].some((type) => {
		if (type.includes('/*')) {
			const category = type.split('/')[0];
			return file.type.startsWith(`${category}/`);
		}
		return file.type === type;
	});
}

/**
 * Checks if a file is a JSON file
 */
export function isJsonFile(file: File): boolean {
	return (
		COMMON_MIME_TYPES.JSON.some((type) => {
			if (type.includes('/*')) {
				const category = type.split('/')[0];
				return file.type.startsWith(`${category}/`);
			}
			return file.type === type;
		}) || file.name.toLowerCase().endsWith('.json')
	);
}

/**
 * Validates JSON content
 */
export function validateJsonContent(content: string): {
	isValid: boolean;
	error?: string;
} {
	try {
		JSON.parse(content);
		return { isValid: true };
	} catch (error) {
		return {
			isValid: false,
			error: error instanceof Error ? error.message : 'Invalid JSON format',
		};
	}
}

/**
 * Sanitizes a filename for safe storage and download
 */
export function sanitizeFilename(filename: string): string {
	// Remove or replace invalid characters
	return filename
		.replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
		.replace(/\s+/g, '_') // Replace spaces with underscores
		.replace(/_{2,}/g, '_') // Replace multiple underscores with single one
		.replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
		.toLowerCase(); // Convert to lowercase
}

/**
 * Generates a unique filename to avoid conflicts
 */
export function generateUniqueFilename(
	originalName: string,
	existingFiles: string[] = []
): string {
	const name =
		originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
	const extension = originalName.substring(originalName.lastIndexOf('.')) || '';

	let counter = 1;
	let newName = originalName;

	while (existingFiles.includes(newName)) {
		newName = `${name}_${counter}${extension}`;
		counter++;
	}

	return newName;
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
	const lastDotIndex = filename.lastIndexOf('.');
	return lastDotIndex !== -1
		? filename.substring(lastDotIndex + 1).toLowerCase()
		: '';
}

/**
 * Checks if file extension matches the MIME type
 */
export function validateMimeType(file: File): boolean {
	const extension = getFileExtension(file.name);
	const expectedTypes: Record<string, string[]> = {
		json: ['application/json', 'text/json'],
		txt: ['text/plain'],
		csv: ['text/csv'],
		html: ['text/html'],
		css: ['text/css'],
		js: ['text/javascript', 'application/javascript'],
		xml: ['text/xml', 'application/xml'],
		pdf: ['application/pdf'],
		jpg: ['image/jpeg'],
		jpeg: ['image/jpeg'],
		png: ['image/png'],
		gif: ['image/gif'],
		webp: ['image/webp'],
		svg: ['image/svg+xml'],
		zip: ['application/zip', 'application/x-zip-compressed'],
		rar: ['application/x-rar-compressed'],
		'7z': ['application/x-7z-compressed'],
	};

	const expectedMimeTypes = expectedTypes[extension];
	if (!expectedMimeTypes) {
		// Unknown extension, assume it's valid
		return true;
	}

	return expectedMimeTypes.includes(file.type);
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Converts file size to bytes
 */
export function fileSizeToBytes(size: string): number {
	const units: Record<string, number> = {
		b: 1,
		byte: 1,
		bytes: 1,
		kb: 1024,
		k: 1024,
		mb: 1024 * 1024,
		m: 1024 * 1024,
		gb: 1024 * 1024 * 1024,
		g: 1024 * 1024 * 1024,
		tb: 1024 * 1024 * 1024 * 1024,
		t: 1024 * 1024 * 1024 * 1024,
	};

	const match = size.toLowerCase().match(/^([\d.]+)\s*([a-z]+)?$/);
	if (!match) return 0;

	const value = Number.parseFloat(match[1]);
	const unit = match[2] || 'bytes';

	return Math.round(value * (units[unit] || 1));
}

/**
 * Creates a file validator function
 */
export function createFileValidator(options: FileUploadOptions) {
	return (file: File) => validateFile(file, options);
}

/**
 * Checks if files can be uploaded based on options
 */
export function canUploadFiles(
	files: File[],
	options: FileUploadOptions = {}
): {
	canUpload: boolean;
	errors: FileValidationError[];
} {
	const { validFiles, errors } = validateFiles(files, options);

	return {
		canUpload: validFiles.length > 0 && errors.length === 0,
		errors,
	};
}

/**
 * Gets common file type groups for convenience
 */
export const FILE_TYPE_GROUPS = {
	IMAGES: ['image/*'],
	DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
	SPREADSHEETS: ['.xls', '.xlsx', '.csv'],
	ARCHIVES: ['.zip', '.rar', '.7z', '.tar', '.gz'],
	CODE: [
		'.js',
		'.ts',
		'.jsx',
		'.tsx',
		'.html',
		'.css',
		'.json',
		'.xml',
		'.py',
		'.java',
		'.cpp',
		'.c',
	],
	MEDIA: ['image/*', 'video/*', 'audio/*'],
	TEXT: ['.txt', '.md', '.csv', '.json', '.xml', '.yaml', '.yml'],
} as const;

/**
 * Default file validators for common use cases
 */
export const DEFAULT_VALIDATORS = {
	IMAGES: {
		accept: FILE_TYPE_GROUPS.IMAGES,
		maxSize: 10 * 1024 * 1024, // 10MB
	},
	DOCUMENTS: {
		accept: FILE_TYPE_GROUPS.DOCUMENTS,
		maxSize: 50 * 1024 * 1024, // 50MB
	},
	CODE: {
		accept: FILE_TYPE_GROUPS.CODE,
		maxSize: 5 * 1024 * 1024, // 5MB
	},
	JSON: {
		accept: ['.json', 'application/json'],
		maxSize: 10 * 1024 * 1024, // 10MB
		validator: (file: File) => {
			if (!isJsonFile(file)) {
				return 'File must be a valid JSON file';
			}
			return null;
		},
	},
} as const;

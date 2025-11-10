'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface MaterialSymbolsProps {
	icon: string;
	className?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	filled?: boolean;
	weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
	grade?: -25 | 0 | 200 | 500;
	opticalSize?: 20 | 24 | 40 | 48;
}

const MaterialSymbols = React.forwardRef<HTMLOutputElement, MaterialSymbolsProps>(
	({ icon, className, size = 'md', filled = false, weight = 400, grade = 0, opticalSize = 24, ...props }, ref) => {
		const sizeClasses = {
			sm: 'text-sm',
			md: 'text-base',
			lg: 'text-lg',
			xl: 'text-xl',
		};

		const sizePixels = {
			sm: 16,
			md: 20,
			lg: 24,
			xl: 28,
		};

		return (
			<span
				ref={ref}
				className={cn(
					'material-symbols-rounded',
					filled ? 'fill' : '',
					sizeClasses[size],
					'inline-block align-middle',
					className,
				)}
				style={{
					fontVariationSettings: `
            'FILL' ${filled ? 1 : 0},
            'wght' ${weight},
            'GRAD' ${grade},
            'opsz' ${opticalSize}
          `,
					fontSize: `${sizePixels[size]}px`,
				}}
				{...props}
			>
				{icon}
			</span>
		);
	},
);
MaterialSymbols.displayName = 'MaterialSymbols';

export { MaterialSymbols };

// Predefined icon constants for commonly used DevKit icons
export const ICONS = {
	// JSON Tools
	JSON: 'data_object',
	VALIDATE: 'check_circle',
	FORMAT: 'code',
	CONVERT: 'swap_horiz',
	QUERY: 'search',
	EDITOR: 'edit',
	SORT: 'sort',
	JWT: 'key',
	SCHEMA: 'schema',
	MINIFY: 'compress',

	// Code Tools
	CODE: 'code',
	EXECUTOR: 'play_arrow',
	FORMATTER: 'format_align_left',
	MINIFIER: 'compress',
	OBFUSCATOR: 'visibility_off',
	COMPARATOR: 'compare',
	REGEX: 'find_replace',

	// File Tools
	FILE: 'description',
	UPLOAD: 'upload_file',
	DOWNLOAD: 'download',
	IMAGE: 'image',
	QR: 'qr_code_2',
	OCR: 'document_scanner',
	COMPRESS: 'compress',

	// Network Tools
	HTTP: 'public',
	NETWORK: 'wifi',
	IP: 'location_on',
	META: 'metadata',
	PING: 'network_ping',
	SSL: 'security',

	// Text Tools
	TEXT: 'text_fields',
	ENCODE: 'lock',
	FORMAT: 'format_align_left',
	COMPARE: 'compare',
	GENERATOR: 'auto_fix_high',

	// Security Tools
	SECURITY: 'shield',
	HASH: 'fingerprint',
	PASSWORD: 'password',
	ENCRYPT: 'enhanced_encryption',
	KEY: 'vpn_key',

	// General UI
	SEARCH: 'search',
	FILTER: 'filter_list',
	SETTINGS: 'settings',
	COPY: 'content_copy',
	PASTE: 'content_paste',
	CLEAR: 'clear',
	REFRESH: 'refresh',
	DOWNLOAD: 'download',
	UPLOAD: 'upload',
	STAR: 'star',
	FAVORITE: 'favorite',
	BOOKMARK: 'bookmark',
	HISTORY: 'history',
	HELP: 'help',
	INFO: 'info',
	WARNING: 'warning',
	ERROR: 'error',
	SUCCESS: 'check_circle',
	CLOSE: 'close',
	MENU: 'menu',
	MORE: 'more_vert',
	EXPAND: 'expand_more',
	COLLAPSE: 'expand_less',
	ARROW_RIGHT: 'arrow_forward',
	ARROW_LEFT: 'arrow_back',
	ARROW_UP: 'arrow_upward',
	ARROW_DOWN: 'arrow_downward',

	// Tool Categories
	CATEGORY_JSON: 'data_object',
	CATEGORY_CODE: 'code',
	CATEGORY_FILE: 'description',
	CATEGORY_NETWORK: 'wifi',
	CATEGORY_TEXT: 'text_fields',
	CATEGORY_SECURITY: 'shield',
} as const;

// Helper component for specific icon categories
export interface IconProps extends Omit<MaterialSymbolsProps, 'icon'> {
	name: keyof typeof ICONS;
}

export const Icon = React.forwardRef<HTMLOutputElement, IconProps>(({ name, ...props }, ref) => {
	return <MaterialSymbols icon={ICONS[name]} ref={ref} {...props} />;
});
Icon.displayName = 'Icon';

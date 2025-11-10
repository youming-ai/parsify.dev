'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MaterialSymbols, ICONS, Icon } from '@/components/ui/material-symbols';
import { Badge } from '@/components/ui/badge';

interface IconDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
	name: keyof typeof ICONS;
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
	variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'destructive' | 'success' | 'warning';
	showLabel?: boolean;
	label?: string;
	badge?: string | number;
	clickable?: boolean;
	onClick?: () => void;
	animated?: boolean;
	filled?: boolean;
}

const IconDisplay = React.forwardRef<HTMLDivElement, IconDisplayProps>(
	(
		{
			className,
			name,
			size = 'md',
			variant = 'default',
			showLabel = false,
			label,
			badge,
			clickable = false,
			onClick,
			animated = false,
			filled = false,
			...props
		},
		ref,
	) => {
		const sizeClasses = {
			xs: 'h-3 w-3',
			sm: 'h-4 w-4',
			md: 'h-5 w-5',
			lg: 'h-6 w-6',
			xl: 'h-8 w-8',
			'2xl': 'h-10 w-10',
		};

		const labelSizeClasses = {
			xs: 'text-xs',
			sm: 'text-xs',
			md: 'text-sm',
			lg: 'text-sm',
			xl: 'text-base',
			'2xl': 'text-lg',
		};

		const variantClasses = {
			default: 'text-gray-600 dark:text-gray-400',
			primary: 'text-primary',
			secondary: 'text-secondary-foreground',
			accent: 'text-accent-foreground',
			destructive: 'text-destructive',
			success: 'text-green-600 dark:text-green-400',
			warning: 'text-yellow-600 dark:text-yellow-400',
		};

		const iconWrapperClasses = cn('flex items-center justify-center rounded-lg transition-all duration-200', {
			'hover:bg-gray-100 dark:hover:bg-gray-800': clickable && variant === 'default',
			'hover:bg-primary/10': clickable && variant === 'primary',
			'hover:scale-110 cursor-pointer': clickable,
			'animate-pulse': animated,
			'p-1': size === 'lg' || size === 'xl' || size === '2xl',
			'p-0.5': size === 'md' || size === 'sm',
		});

		return (
			<div ref={ref} className={cn('flex items-center gap-2 relative', className)} {...props}>
				<div className={iconWrapperClasses} onClick={onClick}>
					<Icon name={name} size={size} className={cn(variantClasses[variant], sizeClasses[size])} filled={filled} />

					{/* Badge */}
					{badge !== undefined && (
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
						>
							{typeof badge === 'number' && badge > 99 ? '99+' : badge}
						</Badge>
					)}
				</div>

				{showLabel && (
					<span className={cn('font-medium', labelSizeClasses[size])}>
						{label || name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')}
					</span>
				)}
			</div>
		);
	},
);
IconDisplay.displayName = 'IconDisplay';

export { IconDisplay };

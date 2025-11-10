import { cn } from '@/lib/utils';
import * as React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'modern' | 'glass' | 'gradient' | 'elevated';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant = 'default', ...props }, ref) => {
	const variantClasses: Record<string, string> = {
		default: 'rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm',
		modern:
			'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform-gpu hover:scale-[1.02] overflow-hidden',
		glass:
			'backdrop-blur-md bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-xl',
		gradient:
			'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300',
		elevated:
			'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-modern hover:shadow-glow transition-all duration-300',
	};

	return <div ref={ref} className={cn(variantClasses[variant], 'relative', className)} {...props} />;
});
Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'modern' | 'compact' | 'elevated';
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
	({ className, variant = 'default', ...props }, ref) => {
		const variantClasses: Record<string, string> = {
			default: 'flex flex-col space-y-1.5 p-6',
			modern:
				'p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900/50',
			compact: 'flex flex-col space-y-1.5 p-4',
			elevated:
				'p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50',
		};

		return <div ref={ref} className={cn(variantClasses[variant], className)} {...props} />;
	},
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h3 ref={ref} className={cn('font-semibold text-2xl leading-none tracking-tight', className)} {...props} />
	),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => <p ref={ref} className={cn('text-gray-600 text-sm', className)} {...props} />,
);
CardDescription.displayName = 'CardDescription';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'modern' | 'compact' | 'elevated';
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
	({ className, variant = 'default', ...props }, ref) => {
		const variantClasses: Record<string, string> = {
			default: 'p-6 pt-0',
			modern: 'p-6',
			compact: 'p-4 pt-0',
			elevated: 'p-6 pt-0',
		};

		return <div ref={ref} className={cn(variantClasses[variant], className)} {...props} />;
	},
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
	),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

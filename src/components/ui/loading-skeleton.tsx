/**
 * Loading Skeleton Components
 * Optimized loading states with minimal bundle impact
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
	className?: string;
	children?: React.ReactNode;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
	return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

// Tool-specific skeleton layouts
export function ToolPageSkeleton() {
	return (
		<div className="container mx-auto px-4 py-8 space-y-6">
			{/* Header skeleton */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-96" />
			</div>

			{/* Main content skeleton */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Input section */}
				<div className="space-y-4">
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-96 w-full rounded-lg" />
					<div className="flex gap-2">
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 w-24" />
					</div>
				</div>

				{/* Output section */}
				<div className="space-y-4">
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-96 w-full rounded-lg" />
					<div className="flex gap-2">
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 w-24" />
					</div>
				</div>
			</div>

			{/* Options skeleton */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-32" />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-10 w-full" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function JsonFormatterSkeleton() {
	return (
		<div className="container mx-auto px-4 py-8 space-y-6">
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-4 w-80" />
			</div>

			{/* JSON Editor sections */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Input */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Skeleton className="h-5 w-20" />
						<Skeleton className="h-8 w-16" />
					</div>
					<Skeleton className="h-96 w-full rounded-lg" />
					<div className="flex gap-2">
						<Skeleton className="h-9 w-20" />
						<Skeleton className="h-9 w-24" />
						<Skeleton className="h-9 w-16" />
					</div>
				</div>

				{/* Output */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Skeleton className="h-5 w-20" />
						<Skeleton className="h-8 w-16" />
					</div>
					<Skeleton className="h-96 w-full rounded-lg" />
					<div className="flex gap-2">
						<Skeleton className="h-9 w-20" />
						<Skeleton className="h-9 w-24" />
					</div>
				</div>
			</div>

			{/* Formatting options */}
			<div className="rounded-lg border p-4 space-y-4">
				<Skeleton className="h-6 w-32" />
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<div className="flex items-center space-x-2">
						<Skeleton className="h-4 w-4 rounded" />
						<Skeleton className="h-4 w-24" />
					</div>
					<div className="flex items-center space-x-2">
						<Skeleton className="h-4 w-4 rounded" />
						<Skeleton className="h-4 w-20" />
					</div>
					<div className="flex items-center space-x-2">
						<Skeleton className="h-4 w-4 rounded" />
						<Skeleton className="h-4 w-28" />
					</div>
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-10 w-32" />
				</div>
			</div>
		</div>
	);
}

export function CodeExecutorSkeleton() {
	return (
		<div className="container mx-auto px-4 py-8 space-y-6">
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-36" />
				<Skeleton className="h-4 w-96" />
			</div>

			{/* Language selector */}
			<div className="flex items-center gap-4">
				<Skeleton className="h-5 w-20" />
				<Skeleton className="h-10 w-32" />
			</div>

			{/* Code editor */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-24" />
					<div className="flex gap-2">
						<Skeleton className="h-8 w-20" />
						<Skeleton className="h-8 w-16" />
					</div>
				</div>
				<Skeleton className="h-96 w-full rounded-lg" />
			</div>

			{/* Output console */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-8 w-16" />
				</div>
				<Skeleton className="h-48 w-full rounded-lg bg-gray-900" />
			</div>
		</div>
	);
}

export function ToolsListSkeleton() {
	return (
		<div className="container mx-auto px-4 py-8 space-y-8">
			{/* Header */}
			<div className="space-y-4">
				<Skeleton className="h-12 w-64" />
				<Skeleton className="h-6 w-96" />
			</div>

			{/* Search and filters */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Skeleton className="h-10 w-80" />
				<div className="flex gap-2">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-24" />
				</div>
			</div>

			{/* Tool categories */}
			<div className="space-y-8">
				{Array.from({ length: 3 }).map((_, categoryIndex) => (
					<div key={categoryIndex} className="space-y-4">
						<Skeleton className="h-6 w-32" />
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{Array.from({ length: 3 }).map((_, toolIndex) => (
								<div key={toolIndex} className="rounded-lg border p-4 space-y-3">
									<div className="flex items-center gap-3">
										<Skeleton className="h-8 w-8 rounded" />
										<Skeleton className="h-5 w-32" />
									</div>
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-3/4" />
									<div className="flex items-center justify-between">
										<div className="flex gap-1">
											<Skeleton className="h-4 w-12" />
											<Skeleton className="h-4 w-16" />
										</div>
										<Skeleton className="h-8 w-20" />
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// Loading spinner component for inline use
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
	};

	return (
		<div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', sizeClasses[size])}>
			<span className="sr-only">Loading...</span>
		</div>
	);
}

// Full page loading overlay
export function FullPageLoading({ message = 'Loading...' }: { message?: string }) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<div className="flex flex-col items-center gap-4">
				<LoadingSpinner size="lg" />
				<p className="text-muted-foreground text-sm">{message}</p>
			</div>
		</div>
	);
}

export default Skeleton;

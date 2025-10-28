'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from './auth-context';
import { LogoutButton } from './logout-button';
import { UserAvatar } from './user-avatar';

interface AuthStatusIndicatorProps {
	variant?: 'badge' | 'text' | 'avatar' | 'dropdown' | 'full';
	showEmail?: boolean;
	showLogout?: boolean;
	className?: string;
	position?: 'header' | 'sidebar' | 'inline';
}

export function AuthStatusIndicator({
	variant = 'badge',
	showEmail = false,
	showLogout = true,
	className,
	position = 'header',
}: AuthStatusIndicatorProps) {
	const { user, isAuthenticated, isLoading, error } = useAuth();

	if (isLoading) {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				<div className="h-4 w-4 animate-spin rounded-full border-blue-600 border-b-2"></div>
				{variant === 'text' && (
					<span className="text-gray-500 text-sm">Loading...</span>
				)}
			</div>
		);
	}

	if (error) {
		return (
			<Badge variant="destructive" className={className}>
				Authentication Error
			</Badge>
		);
	}

	if (!isAuthenticated) {
		// User is not authenticated
		switch (variant) {
			case 'badge':
				return (
					<Badge variant="outline" className={className}>
						Not signed in
					</Badge>
				);

			case 'text':
				return (
					<span className={`text-gray-500 text-sm ${className}`}>
						Not signed in
					</span>
				);

			case 'avatar':
				return null;

			case 'dropdown':
			case 'full':
				return (
					<div className={`flex items-center gap-2 ${className}`}>
						<span className="text-gray-500 text-sm">Not signed in</span>
						<Button size="sm" variant="outline">
							Sign in
						</Button>
					</div>
				);

			default:
				return null;
		}
	}

	// User is authenticated
	if (!user) return null;

	switch (variant) {
		case 'badge':
			return (
				<Badge variant="default" className={className}>
					{user.name}
				</Badge>
			);

		case 'text':
			return (
				<div className={className}>
					<span className="font-medium text-gray-900 text-sm">{user.name}</span>
					{showEmail && (
						<span className="ml-2 text-gray-500 text-sm">{user.email}</span>
					)}
				</div>
			);

		case 'avatar':
			return (
				<div className={`flex items-center gap-2 ${className}`}>
					<UserAvatar user={user} size="sm" />
					{showEmail && (
						<span className="max-w-32 truncate text-gray-500 text-sm">
							{user.email}
						</span>
					)}
				</div>
			);

		case 'dropdown':
			return (
				<div className={`relative ${className}`}>
					<div className="flex items-center gap-2">
						<UserAvatar user={user} size="sm" />
						<span className="font-medium text-gray-900 text-sm">
							{user.name}
						</span>
					</div>
					{/* Note: In a real implementation, you'd want to add dropdown logic here */}
				</div>
			);

		case 'full':
			return (
				<div className={`flex items-center gap-3 ${className}`}>
					<UserAvatar user={user} size="sm" />
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium text-gray-900 text-sm">
							{user.name}
						</p>
						{showEmail && (
							<p className="truncate text-gray-500 text-xs">{user.email}</p>
						)}
					</div>
					{showLogout && <LogoutButton size="sm" variant="ghost" />}
				</div>
			);

		default:
			return null;
	}
}

/**
 * Compact auth status indicator for headers
 */
export function HeaderAuthStatus({ className }: { className?: string }) {
	return (
		<AuthStatusIndicator
			variant="dropdown"
			className={className}
			position="header"
		/>
	);
}

/**
 * Full auth status indicator for sidebars
 */
export function SidebarAuthStatus({ className }: { className?: string }) {
	return (
		<AuthStatusIndicator
			variant="full"
			showEmail={true}
			showLogout={true}
			className={className}
			position="sidebar"
		/>
	);
}

/**
 * Simple badge for showing auth status
 */
export function AuthStatusBadge({ className }: { className?: string }) {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<Badge variant="outline" className={className}>
				Loading...
			</Badge>
		);
	}

	return (
		<Badge
			variant={isAuthenticated ? 'default' : 'secondary'}
			className={className}
		>
			{isAuthenticated ? 'Signed in' : 'Signed out'}
		</Badge>
	);
}

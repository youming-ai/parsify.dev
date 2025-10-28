'use client';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type React from 'react';
import { useState } from 'react';
import { useAuth } from './auth-context';

interface LogoutButtonProps {
	variant?:
		| 'default'
		| 'destructive'
		| 'outline'
		| 'secondary'
		| 'ghost'
		| 'link';
	size?: 'default' | 'sm' | 'lg' | 'icon';
	className?: string;
	children?: React.ReactNode;
	confirmText?: string;
	showConfirmDialog?: boolean;
	onLogoutSuccess?: () => void;
	onLogoutError?: (error: Error) => void;
}

export function LogoutButton({
	variant = 'outline',
	size = 'default',
	className,
	children = 'Sign out',
	confirmText = 'Are you sure you want to sign out?',
	showConfirmDialog = false,
	onLogoutSuccess,
	onLogoutError,
}: LogoutButtonProps) {
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { logout } = useAuth();

	const handleLogout = async () => {
		if (showConfirmDialog && !showConfirm) {
			setShowConfirm(true);
			return;
		}

		try {
			setIsLoggingOut(true);
			setError(null);

			await logout();

			onLogoutSuccess?.();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Logout failed';
			setError(errorMessage);
			onLogoutError?.(err instanceof Error ? err : new Error(errorMessage));
		} finally {
			setIsLoggingOut(false);
			setShowConfirm(false);
		}
	};

	const handleCancel = () => {
		setShowConfirm(false);
		setError(null);
	};

	if (showConfirm) {
		return (
			<div className="space-y-3">
				<Alert variant="default">{confirmText}</Alert>

				{error && <Alert variant="destructive">{error}</Alert>}

				<div className="flex gap-2">
					<Button
						variant="destructive"
						onClick={handleLogout}
						disabled={isLoggingOut}
						className="flex-1"
					>
						{isLoggingOut ? 'Signing out...' : 'Yes, sign out'}
					</Button>
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={isLoggingOut}
						className="flex-1"
					>
						Cancel
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<Button
				variant={variant}
				size={size}
				onClick={handleLogout}
				disabled={isLoggingOut}
				className={className}
			>
				{isLoggingOut ? (
					<>
						<svg
							className="-ml-1 mr-2 h-4 w-4 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							></circle>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Signing out...
					</>
				) : (
					children
				)}
			</Button>

			{error && (
				<Alert variant="destructive" className="text-sm">
					{error}
				</Alert>
			)}
		</div>
	);
}

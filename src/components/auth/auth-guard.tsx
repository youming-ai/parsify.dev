'use client';

import React, { type ReactNode, useEffect } from 'react';
import { useAuth } from './auth-context';
import { LoginForm } from './login-form';

interface AuthGuardProps {
	children: ReactNode;
	fallback?: ReactNode;
	redirectTo?: string;
	requireAuth?: boolean;
	requireGuest?: boolean;
	loadingComponent?: ReactNode;
}

interface ProtectedRouteProps {
	children: ReactNode;
	redirectTo?: string;
	fallback?: ReactNode;
}

interface GuestOnlyRouteProps {
	children: ReactNode;
	redirectTo?: string;
}

/**
 * Authentication Guard Component
 *
 * This component protects routes based on authentication status.
 * - When requireAuth=true: Only authenticated users can access
 * - When requireGuest=true: Only non-authenticated users can access
 * - When both are false: Component renders regardless of auth status
 */
export function AuthGuard({
	children,
	fallback,
	redirectTo,
	requireAuth = false,
	requireGuest = false,
	loadingComponent,
}: AuthGuardProps) {
	const { user, isLoading, isAuthenticated } = useAuth();

	useEffect(() => {
		// Handle redirects after loading is complete
		if (!isLoading) {
			if (requireAuth && !isAuthenticated) {
				// Redirect to login page if authentication is required but user is not authenticated
				const loginUrl =
					redirectTo ||
					`/login${window.location.pathname !== '/' ? `?redirect=${encodeURIComponent(window.location.pathname)}` : ''}`;
				window.location.href = loginUrl;
			} else if (requireGuest && isAuthenticated) {
				// Redirect authenticated users away from guest-only pages
				window.location.href = redirectTo || '/dashboard';
			}
		}
	}, [isLoading, isAuthenticated, requireAuth, requireGuest, redirectTo]);

	// Show loading state while checking authentication
	if (isLoading) {
		return (
			loadingComponent || (
				<div className="flex min-h-screen items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
				</div>
			)
		);
	}

	// Handle authenticated users on guest-only routes
	if (requireGuest && isAuthenticated) {
		return fallback || null;
	}

	// Handle unauthenticated users on protected routes
	if (requireAuth && !isAuthenticated) {
		return (
			fallback || (
				<div className="flex min-h-screen items-center justify-center bg-gray-50">
					<div className="w-full max-w-md space-y-8 p-8">
						<div className="text-center">
							<h2 className="mt-6 font-extrabold text-3xl text-gray-900">Authentication Required</h2>
							<p className="mt-2 text-gray-600 text-sm">Please sign in to access this page</p>
						</div>
						<LoginForm />
					</div>
				</div>
			)
		);
	}

	// Allow access if conditions are met
	return <>{children}</>;
}

/**
 * Protected Route Component
 *
 * A simpler version of AuthGuard that only allows authenticated users
 */
export function ProtectedRoute({ children, redirectTo, fallback }: ProtectedRouteProps) {
	return (
		<AuthGuard requireAuth={true} redirectTo={redirectTo} fallback={fallback}>
			{children}
		</AuthGuard>
	);
}

/**
 * Guest Only Route Component
 *
 * Only allows non-authenticated users (e.g., login, signup pages)
 */
export function GuestOnlyRoute({ children, redirectTo }: GuestOnlyRouteProps) {
	return (
		<AuthGuard requireGuest={true} redirectTo={redirectTo}>
			{children}
		</AuthGuard>
	);
}

/**
 * Higher-Order Component for protecting components
 *
 * Usage:
 * ```tsx
 * const ProtectedComponent = withAuth(MyComponent, { redirectTo: '/login' });
 * ```
 */
export function withAuth<P extends object>(
	Component: React.ComponentType<P>,
	options: {
		redirectTo?: string;
		fallback?: ReactNode;
		loadingComponent?: ReactNode;
	} = {},
) {
	return function AuthenticatedComponent(props: P) {
		return (
			<AuthGuard
				requireAuth={true}
				redirectTo={options.redirectTo}
				fallback={options.fallback}
				loadingComponent={options.loadingComponent}
			>
				<Component {...props} />
			</AuthGuard>
		);
	};
}

/**
 * Hook for checking if current route is accessible
 */
export function useRouteAuth(requireAuth = false, requireGuest = false) {
	const { isAuthenticated, isLoading, user } = useAuth();

	const canAccess = React.useMemo(() => {
		if (isLoading) return false;

		if (requireAuth && !isAuthenticated) return false;
		if (requireGuest && isAuthenticated) return false;

		return true;
	}, [isLoading, isAuthenticated, requireAuth, requireGuest]);

	return {
		canAccess,
		isLoading,
		isAuthenticated,
		user,
	};
}

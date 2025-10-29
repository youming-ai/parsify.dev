// Types and interfaces

// Core authentication components
export { AuthProvider, useAuth } from './auth-context';
// Route protection components
export {
	AuthGuard,
	GuestOnlyRoute,
	ProtectedRoute,
	useRouteAuth,
	withAuth,
} from './auth-guard';
export {
	AuthStatusBadge,
	AuthStatusIndicator,
	HeaderAuthStatus,
	SidebarAuthStatus,
} from './auth-status-indicator';
export type {
	AuthError,
	AuthResponse,
	AuthState,
	LoginCredentials,
	OAuthProvider,
	RegisterCredentials,
	User,
} from './auth-types';
// UI Components
export { LoginForm } from './login-form';
export { LogoutButton } from './logout-button';
export { UserAvatar } from './user-avatar';
export { UserProfile } from './user-profile';

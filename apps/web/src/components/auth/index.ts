// Types and interfaces
export type {
  User,
  AuthState,
  AuthError,
  OAuthProvider,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from './auth-types';

// Core authentication components
export { AuthProvider, useAuth } from './auth-context';

// UI Components
export { LoginForm } from './login-form';
export { UserAvatar } from './user-avatar';
export { UserProfile } from './user-profile';
export { LogoutButton } from './logout-button';
export { AuthStatusIndicator, HeaderAuthStatus, SidebarAuthStatus, AuthStatusBadge } from './auth-status-indicator';

// Route protection components
export { AuthGuard, ProtectedRoute, GuestOnlyRoute, withAuth, useRouteAuth } from './auth-guard';

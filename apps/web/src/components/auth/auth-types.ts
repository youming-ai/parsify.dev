export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'github' | 'email';
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface OAuthProvider {
  id: 'google' | 'github';
  name: string;
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

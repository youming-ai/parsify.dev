'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User, AuthError } from './auth-types';

interface AuthContextType extends AuthState {
  login: (provider: 'google' | 'github' | 'email', credentials?: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } };

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload.error,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        dispatch({ type: 'AUTH_START' });

        // Check for stored token
        const token = localStorage.getItem('auth_token');
        if (!token) {
          dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
          return;
        }

        // Verify token with API
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const user = await response.json();
          dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('auth_token');
          dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
        }
      } catch (error) {
        dispatch({ type: 'AUTH_FAILURE', payload: { error: 'Failed to check authentication status' } });
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (provider: 'google' | 'github' | 'email', credentials?: any) => {
    try {
      dispatch({ type: 'AUTH_START' });

      let response;

      if (provider === 'email' && credentials) {
        // Email/password login
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });
      } else {
        // OAuth login
        response = await fetch(`/api/auth/oauth/${provider}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const { user, token } = await response.json();

      // Store token
      localStorage.setItem('auth_token', token);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      dispatch({ type: 'AUTH_FAILURE', payload: { error: errorMessage } });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const { user, token: newToken } = await response.json();
      localStorage.setItem('auth_token', newToken);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
    } catch (error) {
      localStorage.removeItem('auth_token');
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

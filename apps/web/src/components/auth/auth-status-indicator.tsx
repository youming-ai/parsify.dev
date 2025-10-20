'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './user-avatar';
import { UserProfile } from './user-profile';
import { LogoutButton } from './logout-button';
import { useAuth } from './auth-context';

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
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        {variant === 'text' && <span className="text-sm text-gray-500">Loading...</span>}
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
          <span className={`text-sm text-gray-500 ${className}`}>
            Not signed in
          </span>
        );

      case 'avatar':
        return null;

      case 'dropdown':
      case 'full':
        return (
          <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-sm text-gray-500">Not signed in</span>
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
          <span className="text-sm font-medium text-gray-900">{user.name}</span>
          {showEmail && (
            <span className="text-sm text-gray-500 ml-2">{user.email}</span>
          )}
        </div>
      );

    case 'avatar':
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <UserAvatar user={user} size="sm" />
          {showEmail && (
            <span className="text-sm text-gray-500 truncate max-w-32">
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
            <span className="text-sm font-medium text-gray-900">{user.name}</span>
          </div>
          {/* Note: In a real implementation, you'd want to add dropdown logic here */}
        </div>
      );

    case 'full':
      return (
        <div className={`flex items-center gap-3 ${className}`}>
          <UserAvatar user={user} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            {showEmail && (
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            )}
          </div>
          {showLogout && (
            <LogoutButton size="sm" variant="ghost" />
          )}
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
      variant={isAuthenticated ? "default" : "secondary"}
      className={className}
    >
      {isAuthenticated ? 'Signed in' : 'Signed out'}
    </Badge>
  );
}

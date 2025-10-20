'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from './user-avatar';
import { useAuth } from './auth-context';

interface UserProfileProps {
  variant?: 'card' | 'dropdown' | 'sidebar';
  showEmail?: boolean;
  showProvider?: boolean;
  className?: string;
}

export function UserProfile({
  variant = 'card',
  showEmail = true,
  showProvider = true,
  className,
}: UserProfileProps) {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'bg-blue-100 text-blue-800';
      case 'github':
        return 'bg-gray-100 text-gray-800';
      case 'email':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className={className}>
        <div className="flex items-center gap-3 p-3">
          <UserAvatar user={user} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            {showEmail && (
              <p className="text-sm text-gray-500 truncate">
                {user.email}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700"
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={className}>
        <div className="flex flex-col items-center gap-3 p-4">
          <UserAvatar user={user} size="xl" />
          <div className="text-center">
            <h3 className="font-medium text-gray-900">{user.name}</h3>
            {showEmail && (
              <p className="text-sm text-gray-500">{user.email}</p>
            )}
            {showProvider && (
              <Badge className={getProviderBadgeColor(user.provider)} size="sm">
                {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full"
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <UserAvatar user={user} size="xl" />
        </div>
        <CardTitle className="text-xl">{user.name}</CardTitle>
        {showEmail && (
          <CardDescription>{user.email}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {showProvider && (
          <div className="flex justify-center">
            <Badge className={getProviderBadgeColor(user.provider)}>
              Signed in with {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
            </Badge>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">User ID</span>
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {user.id}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Provider</span>
            <span className="font-medium">
              {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
            </span>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full"
        >
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { User } from './auth-types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-12 w-12 text-lg',
};

const statusSizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];

  // Simple hash function to consistently get the same color for the same name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function UserAvatar({
  user,
  size = 'md',
  className,
  showStatus = false,
  status = 'offline',
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size];
  const statusSizeClass = statusSizeClasses[size];
  const statusColorClass = statusColors[status];

  if (user.avatar) {
    return (
      <div className="relative inline-block">
        <img
          src={user.avatar}
          alt={user.name}
          className={cn(
            sizeClass,
            'rounded-full object-cover',
            className
          )}
        />
        {showStatus && (
          <span
            className={cn(
              'absolute -bottom-0 -right-0 rounded-full border-2 border-white',
              statusSizeClass,
              statusColorClass
            )}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          sizeClass,
          'rounded-full flex items-center justify-center text-white font-medium',
          getAvatarColor(user.name),
          className
        )}
      >
        {getInitials(user.name)}
      </div>
      {showStatus && (
        <span
          className={cn(
            'absolute -bottom-0 -right-0 rounded-full border-2 border-white',
            statusSizeClass,
            statusColorClass
          )}
        />
      )}
    </div>
  );
}

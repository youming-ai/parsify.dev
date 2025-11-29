'use client';

/**
 * ToolWrapper Component
 * Provides consistent UI and behavior across all tools
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  Download,
  HelpCircle,
  RefreshCw,
  Settings,
  Upload,
  Zap,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

// Types
export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  icon?: React.ReactNode;
  tags: string[];
  hasSettings?: boolean;
  hasHelp?: boolean;
  canExport?: boolean;
  canImport?: boolean;
  canCopy?: boolean;
  canReset?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export interface ToolWrapperProps {
  config: ToolConfig;
  children: React.ReactNode;
  isLoading?: boolean;
  loadingProgress?: number;
  error?: string | null;
  onExport?: () => void;
  onImport?: (data: any) => void;
  onCopy?: () => void;
  onReset?: () => void;
  onSettingsToggle?: () => void;
  onHelpToggle?: () => void;
  className?: string;
  performance?: {
    loadTime: number;
    memoryUsage: number;
    renderTime: number;
  };
  status?: 'idle' | 'loading' | 'ready' | 'processing' | 'error' | 'success';
  actions?: React.ReactNode[];
  notifications?: {
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: number;
  }[];
  onNotificationDismiss?: (timestamp: number) => void;
}

export const ToolWrapper: React.FC<ToolWrapperProps> = ({
  config,
  children,
  isLoading = false,
  loadingProgress = 0,
  error = null,
  onExport,
  onImport,
  onCopy,
  onReset,
  onSettingsToggle,
  onHelpToggle,
  className = '',
  performance,
  status = 'idle',
  actions = [],
  notifications = [],
  onNotificationDismiss,
}) => {
  const [_isSettingsOpen, _setIsSettingsOpen] = useState(false);
  const [_isHelpOpen, _setIsHelpOpen] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file import
  const handleFileImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && onImport) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            onImport(data);
          } catch (error) {
            console.error('Failed to parse imported file:', error);
          }
        };
        reader.readAsText(file);
      }
    },
    [onImport]
  );

  // Get status color and icon
  const getStatusInfo = useCallback(() => {
    switch (status) {
      case 'loading':
        return { color: 'text-blue-600', icon: Clock, text: 'Loading...' };
      case 'ready':
        return { color: 'text-green-600', icon: CheckCircle, text: 'Ready' };
      case 'processing':
        return {
          color: 'text-yellow-600',
          icon: RefreshCw,
          text: 'Processing...',
        };
      case 'error':
        return { color: 'text-red-600', icon: AlertTriangle, text: 'Error' };
      case 'success':
        return { color: 'text-green-600', icon: CheckCircle, text: 'Success' };
      default:
        return { color: 'text-gray-600', icon: Clock, text: 'Idle' };
    }
  }, [status]);

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={`mx-auto w-full ${className}`}>
      {/* Tool Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {config.icon && <div className="text-2xl">{config.icon}</div>}
            <div>
              <CardTitle className="flex items-center gap-2">
                {config.name}
                <Badge variant="secondary" className={statusInfo.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusInfo.text}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">{config.description}</CardDescription>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{config.category}</Badge>
                <Badge variant="outline">v{config.version}</Badge>
                {config.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Tool Actions */}
          <div className="flex items-center gap-2">
            {/* Standard Actions */}
            {config.canExport && onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
            )}

            {config.canImport && (
              <>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-1 h-4 w-4" />
                  Import
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </>
            )}

            {config.canCopy && onCopy && (
              <Button variant="outline" size="sm" onClick={onCopy}>
                <Copy className="mr-1 h-4 w-4" />
                Copy
              </Button>
            )}

            {config.canReset && onReset && (
              <Button variant="outline" size="sm" onClick={onReset}>
                <RefreshCw className="mr-1 h-4 w-4" />
                Reset
              </Button>
            )}

            {/* Additional Actions */}
            {actions.map((action, index) => (
              <React.Fragment key={index}>{action}</React.Fragment>
            ))}

            {/* Settings and Help */}
            <div className="flex items-center gap-1">
              {config.hasSettings && onSettingsToggle && (
                <Button variant="ghost" size="sm" onClick={onSettingsToggle}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              {config.hasHelp && onHelpToggle && (
                <Button variant="ghost" size="sm" onClick={onHelpToggle}>
                  <HelpCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2 px-6 pb-3">
          {notifications.map((notification) => (
            <Alert
              key={notification.timestamp}
              variant={
                notification.type === 'error'
                  ? 'destructive'
                  : notification.type === 'warning'
                    ? 'destructive'
                    : notification.type === 'success'
                      ? 'default'
                      : 'default'
              }
            >
              <AlertDescription className="flex items-center justify-between">
                {notification.message}
                {onNotificationDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNotificationDismiss(notification.timestamp)}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading tool...</span>
            {loadingProgress > 0 && (
              <Progress value={loadingProgress} className="max-w-xs flex-1" />
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="px-6 pb-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Performance Info */}
      {performance && (
        <div className="px-6 pb-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPerformance(!showPerformance)}
              className="h-6 px-2 text-xs"
            >
              <Zap className="mr-1 h-3 w-3" />
              Performance
            </Button>
            {showPerformance && (
              <div className="flex items-center gap-4">
                <span>Load: {performance.loadTime}ms</span>
                <span>Render: {performance.renderTime}ms</span>
                <span>Memory: {(performance.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
              </div>
            )}
          </div>
        </div>
      )}

      <Separator />

      {/* Tool Content */}
      <CardContent className="p-6">
        <ScrollArea className="max-h-[70vh]">
          {isLoading && config.loadingComponent
            ? config.loadingComponent
            : error && config.errorComponent
              ? config.errorComponent
              : children}
        </ScrollArea>
      </CardContent>

      {/* Footer with additional info */}
      <div className="border-t bg-muted/30 px-6 py-3">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <div>
            Tool ID: {config.id} | Version: {config.version}
          </div>
          {performance && <div>Last updated: {new Date().toLocaleTimeString()}</div>}
        </div>
      </div>
    </Card>
  );
};

export default ToolWrapper;

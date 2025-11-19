/**
 * ToolWrapper Component
 * Provides consistent UI and behavior across all tools
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  HelpCircle,
  Download,
  Upload,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react";

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
  status?: "idle" | "loading" | "ready" | "processing" | "error" | "success";
  actions?: React.ReactNode[];
  notifications?: {
    type: "info" | "warning" | "error" | "success";
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
  className = "",
  performance,
  status = "idle",
  actions = [],
  notifications = [],
  onNotificationDismiss,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
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
            console.error("Failed to parse imported file:", error);
          }
        };
        reader.readAsText(file);
      }
    },
    [onImport],
  );

  // Get status color and icon
  const getStatusInfo = useCallback(() => {
    switch (status) {
      case "loading":
        return { color: "text-blue-600", icon: Clock, text: "Loading..." };
      case "ready":
        return { color: "text-green-600", icon: CheckCircle, text: "Ready" };
      case "processing":
        return {
          color: "text-yellow-600",
          icon: RefreshCw,
          text: "Processing...",
        };
      case "error":
        return { color: "text-red-600", icon: AlertTriangle, text: "Error" };
      case "success":
        return { color: "text-green-600", icon: CheckCircle, text: "Success" };
      default:
        return { color: "text-gray-600", icon: Clock, text: "Idle" };
    }
  }, [status]);

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={`w-full max-w-6xl mx-auto ${className}`}>
      {/* Tool Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {config.icon && <div className="text-2xl">{config.icon}</div>}
            <div>
              <CardTitle className="flex items-center gap-2">
                {config.name}
                <Badge variant="secondary" className={statusInfo.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo.text}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {config.description}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2">
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
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            )}

            {config.canImport && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
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
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            )}

            {config.canReset && onReset && (
              <Button variant="outline" size="sm" onClick={onReset}>
                <RefreshCw className="w-4 h-4 mr-1" />
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
                  <Settings className="w-4 h-4" />
                </Button>
              )}
              {config.hasHelp && onHelpToggle && (
                <Button variant="ghost" size="sm" onClick={onHelpToggle}>
                  <HelpCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="px-6 pb-3 space-y-2">
          {notifications.map((notification) => (
            <Alert
              key={notification.timestamp}
              variant={
                notification.type === "error"
                  ? "destructive"
                  : notification.type === "warning"
                    ? "destructive"
                    : notification.type === "success"
                      ? "default"
                      : "default"
              }
            >
              <AlertDescription className="flex items-center justify-between">
                {notification.message}
                {onNotificationDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onNotificationDismiss(notification.timestamp)
                    }
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
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading tool...</span>
            {loadingProgress > 0 && (
              <Progress value={loadingProgress} className="flex-1 max-w-xs" />
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPerformance(!showPerformance)}
              className="h-6 px-2 text-xs"
            >
              <Zap className="w-3 h-3 mr-1" />
              Performance
            </Button>
            {showPerformance && (
              <div className="flex items-center gap-4">
                <span>Load: {performance.loadTime}ms</span>
                <span>Render: {performance.renderTime}ms</span>
                <span>
                  Memory: {(performance.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </span>
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
      <div className="px-6 py-3 bg-muted/30 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Tool ID: {config.id} | Version: {config.version}
          </div>
          {performance && (
            <div>Last updated: {new Date().toLocaleTimeString()}</div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ToolWrapper;

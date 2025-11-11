/**
 * Alert Panel Component
 * Display and manage performance and compliance alerts
 * Interactive alert management with filtering and actions
 */

"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Bell,
  BellOff,
  Archive,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import { ComplianceAlert } from "@/monitoring/types";

interface AlertPanelProps {
  alerts: ComplianceAlert[];
  onDismiss: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onAcknowledge?: (alertId: string) => void;
}

export function AlertPanel({
  alerts,
  onDismiss,
  onResolve,
  onAcknowledge,
}: AlertPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<
    "all" | "critical" | "high" | "medium" | "low"
  >("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showResolved, setShowResolved] = useState(false);

  // Get unique alert types
  const alertTypes = useMemo(() => {
    const types = [...new Set(alerts.map((alert) => alert.type))];
    return types;
  }, [alerts]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Search filter
      if (
        searchTerm &&
        !alert.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !alert.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Severity filter
      if (severityFilter !== "all" && alert.severity !== severityFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && alert.type !== typeFilter) {
        return false;
      }

      // Resolved filter
      if (!showResolved && alert.resolved) {
        return false;
      }

      return true;
    });
  }, [alerts, searchTerm, severityFilter, typeFilter, showResolved]);

  // Get alert statistics
  const alertStats = useMemo(() => {
    const stats = {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical" && !a.resolved)
        .length,
      high: alerts.filter((a) => a.severity === "high" && !a.resolved).length,
      medium: alerts.filter((a) => a.severity === "medium" && !a.resolved)
        .length,
      low: alerts.filter((a) => a.severity === "low" && !a.resolved).length,
      resolved: alerts.filter((a) => a.resolved).length,
    };
    return stats;
  }, [alerts]);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4" />;
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <Info className="h-4 w-4" />;
      case "low":
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  // Handle bulk actions
  const handleDismissAll = () => {
    filteredAlerts.forEach((alert) => {
      if (!alert.resolved) {
        onDismiss(alert.id);
      }
    });
  };

  const handleAcknowledgeAll = () => {
    filteredAlerts.forEach((alert) => {
      if (!alert.acknowledged && !alert.resolved && onAcknowledge) {
        onAcknowledge(alert.id);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              System Alerts
            </CardTitle>
            <CardDescription>
              Performance and compliance monitoring alerts
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {alertStats.critical > 0 && (
              <Badge variant="destructive">
                {alertStats.critical} critical
              </Badge>
            )}
            {alertStats.high > 0 && (
              <Badge variant="secondary">{alertStats.high} high</Badge>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="px-3 py-2 text-sm border rounded-md bg-background"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border rounded-md bg-background"
            >
              <option value="all">All Types</option>
              {alertTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? (
                <Archive className="h-4 w-4 mr-2" />
              ) : (
                <Filter className="h-4 w-4 mr-2" />
              )}
              {showResolved ? "Hide Resolved" : "Show Resolved"}
            </Button>
          </div>
        </div>

        {/* Alert Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{alertStats.total}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {alertStats.critical}
            </div>
            <p className="text-sm text-muted-foreground">Critical</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {alertStats.high}
            </div>
            <p className="text-sm text-muted-foreground">High</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {alertStats.medium}
            </div>
            <p className="text-sm text-muted-foreground">Medium</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {alertStats.low}
            </div>
            <p className="text-sm text-muted-foreground">Low</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {alertStats.resolved}
            </div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            {filteredAlerts.length} alert
            {filteredAlerts.length !== 1 ? "s" : ""} found
          </div>
          <div className="flex items-center space-x-2">
            {filteredAlerts.some((a) => !a.acknowledged && !a.resolved) &&
              onAcknowledge && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcknowledgeAll}
                >
                  Acknowledge All
                </Button>
              )}
            {filteredAlerts.some((a) => !a.resolved) && (
              <Button variant="outline" size="sm" onClick={handleDismissAll}>
                Dismiss All
              </Button>
            )}
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Alerts List */}
        <ScrollArea className="h-96">
          {filteredAlerts.length > 0 ? (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Alert
                  key={alert.id}
                  className={alert.resolved ? "opacity-60" : ""}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(alert.severity)}
                        <Badge
                          variant="outline"
                          className={getSeverityColor(alert.severity)}
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {alert.acknowledged && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {alert.resolved && (
                          <Archive className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <AlertTitle className="text-sm">
                          {alert.title}
                        </AlertTitle>
                        <AlertDescription className="text-sm mt-1">
                          {alert.description}
                        </AlertDescription>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(alert.timestamp)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {alert.complianceArea}
                          </span>
                          {alert.deviation && (
                            <span className="text-xs text-red-600">
                              {alert.deviation.toFixed(1)}% from target
                            </span>
                          )}
                        </div>
                        {alert.recommendations &&
                          alert.recommendations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Recommendations:
                              </p>
                              <ul className="text-xs text-muted-foreground list-disc list-inside">
                                {alert.recommendations
                                  .slice(0, 2)
                                  .map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                  ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!alert.acknowledged &&
                        !alert.resolved &&
                        onAcknowledge && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAcknowledge(alert.id)}
                            title="Acknowledge alert"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      {!alert.resolved && onResolve && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResolve(alert.id)}
                          title="Mark as resolved"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDismiss(alert.id)}
                        title="Dismiss alert"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No alerts found</h3>
              <p className="text-sm">
                {searchTerm || severityFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "All systems are operating normally."}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

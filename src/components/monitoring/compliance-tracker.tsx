/**
 * SC-011 Compliance Tracker Component
 * Real-time tracking and visualization of SC-011 compliance metrics
 * Displays task completion rates, error analysis, and compliance status
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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Users,
  Activity,
  RefreshCw,
  Download,
  Info,
  BarChart3,
  AlertCircle,
  Zap,
} from "lucide-react";

import { SC011ComplianceStatus, ComplianceAlert } from "@/monitoring/types";
import { ComplianceChart } from "./compliance-chart";
import { ComplianceActionPlan } from "./compliance-action-plan";

interface ComplianceTrackerProps {
  complianceStatus: SC011ComplianceStatus;
  alerts: ComplianceAlert[];
  onUpdate: () => void;
}

export function ComplianceTracker({
  complianceStatus,
  alerts,
  onUpdate,
}: ComplianceTrackerProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "24h" | "7d" | "30d"
  >("24h");
  const [showDetails, setShowDetails] = useState(false);

  // Calculate compliance metrics
  const complianceMetrics = useMemo(() => {
    const metrics = {
      taskCompletion: {
        current: complianceStatus.taskCompletionRate.currentValue * 100,
        target: complianceStatus.taskCompletionRate.targetValue * 100,
        trend: complianceStatus.taskCompletionRate.trend,
        status: complianceStatus.taskCompletionRate.compliant
          ? "compliant"
          : "non-compliant",
      },
      errorRate: {
        current: complianceStatus.errorRate.currentValue * 100,
        target: complianceStatus.errorRate.targetValue * 100,
        trend: complianceStatus.errorRate.trend,
        status: complianceStatus.errorRate.compliant
          ? "compliant"
          : "non-compliant",
      },
      userSatisfaction: {
        current: complianceStatus.userSatisfaction.currentValue,
        target: complianceStatus.userSatisfaction.targetValue,
        trend: complianceStatus.userSatisfaction.trend,
        status: complianceStatus.userSatisfaction.compliant
          ? "compliant"
          : "non-compliant",
      },
      performance: {
        current: complianceStatus.performanceStandards.averageResponseTime,
        target: complianceStatus.performanceStandards.targetResponseTime,
        status: complianceStatus.performanceStandards.compliant
          ? "compliant"
          : "non-compliant",
      },
    };

    return metrics;
  }, [complianceStatus]);

  // Get critical alerts
  const criticalAlerts = useMemo(() => {
    return alerts.filter(
      (alert) => alert.severity === "critical" && !alert.resolved,
    );
  }, [alerts]);

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Get compliance status icon
  const getComplianceIcon = (compliant: boolean) => {
    return compliant ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  // Get trend icon
  const getTrendIcon = (trend: number) => {
    if (trend > 2) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < -2) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  // Render compliance metric card
  const renderComplianceMetric = (
    title: string,
    metric: any,
    unit: string = "",
    showTarget: boolean = true,
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {getComplianceIcon(metric.status === "compliant")}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {metric.current.toFixed(unit === "%" ? 1 : 0)}
          {unit}
        </div>
        {showTarget && (
          <p className="text-xs text-muted-foreground">
            Target: {metric.target.toFixed(unit === "%" ? 1 : 0)}
            {unit}
          </p>
        )}
        <div className="flex items-center space-x-2 mt-2">
          <Progress
            value={
              unit === "%"
                ? metric.current
                : Math.max(0, 100 - (metric.current / metric.target) * 100)
            }
            className="flex-1"
          />
          {getTrendIcon(metric.trend)}
        </div>
        <div className="flex items-center justify-between mt-2">
          <Badge
            variant={metric.status === "compliant" ? "default" : "destructive"}
          >
            {metric.status === "compliant" ? "Compliant" : "Non-Compliant"}
          </Badge>
          {metric.trend !== 0 && (
            <span
              className={`text-xs ${metric.trend > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {metric.trend > 0 ? "+" : ""}
              {metric.trend.toFixed(1)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Compliance Overview Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              SC-011 Compliance Status
            </CardTitle>
            <CardDescription>
              Task completion monitoring and compliance tracking
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`px-3 py-1 rounded-full border ${getRiskLevelColor(complianceStatus.riskLevel)}`}
            >
              <span className="font-medium">
                {complianceStatus.riskLevel.toUpperCase()} RISK
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={onUpdate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Overall Compliance Score */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {complianceStatus.complianceScore}/100
              </div>
              <div className="flex items-center justify-center mb-2">
                {complianceStatus.compliant ? (
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 mr-2" />
                )}
                <Badge
                  variant={
                    complianceStatus.compliant ? "default" : "destructive"
                  }
                >
                  {complianceStatus.compliant ? "COMPLIANT" : "NON-COMPLIANT"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Assessed: {complianceStatus.lastAssessment.toLocaleString()}
              </p>
            </div>

            {/* Compliance Trend */}
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {complianceStatus.trend === "improving" ? (
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto" />
                ) : complianceStatus.trend === "declining" ? (
                  <TrendingDown className="h-8 w-8 text-red-600 mx-auto" />
                ) : (
                  <Activity className="h-8 w-8 text-blue-600 mx-auto" />
                )}
              </div>
              <p className="text-sm font-medium capitalize">
                {complianceStatus.trend}
              </p>
              <p className="text-xs text-muted-foreground">Trend</p>
            </div>

            {/* Target Completion Rate */}
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {(complianceStatus.targetCompletionRate * 100).toFixed(0)}%
              </div>
              <p className="text-sm font-medium">Target Rate</p>
              <p className="text-xs text-muted-foreground">
                SC-011 Requirement
              </p>
            </div>

            {/* Current Achievement */}
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {(complianceStatus.actualCompletionRate * 100).toFixed(1)}%
              </div>
              <p className="text-sm font-medium">Current Rate</p>
              <p className="text-xs text-muted-foreground">
                {complianceStatus.actualCompletionRate >=
                complianceStatus.targetCompletionRate
                  ? "Meets Target"
                  : "Below Target"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">
            Critical Compliance Issues
          </AlertTitle>
          <AlertDescription className="text-red-700">
            {criticalAlerts.length} critical alert(s) require immediate
            attention to maintain SC-011 compliance.
          </AlertDescription>
        </Alert>
      )}

      {/* Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderComplianceMetric(
          "Task Completion Rate",
          complianceMetrics.taskCompletion,
          "%",
        )}
        {renderComplianceMetric("Error Rate", complianceMetrics.errorRate, "%")}
        {renderComplianceMetric(
          "User Satisfaction",
          complianceMetrics.userSatisfaction,
          "/5.0",
        )}
        {renderComplianceMetric(
          "Avg Response Time",
          complianceMetrics.performance,
          "ms",
        )}
      </div>

      {/* Detailed Compliance Analysis */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="actions">Action Plan</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Compliance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Assessment Period</p>
                    <p className="text-lg">
                      {complianceStatus.assessmentPeriod}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Risk Level</p>
                    <Badge
                      className={getRiskLevelColor(complianceStatus.riskLevel)}
                    >
                      {complianceStatus.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Compliance Status</p>
                    <Badge
                      variant={
                        complianceStatus.compliant ? "default" : "destructive"
                      }
                    >
                      {complianceStatus.compliant
                        ? "COMPLIANT"
                        : "NON-COMPLIANT"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Assessment</p>
                    <p className="text-sm">
                      {complianceStatus.lastAssessment.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">
                    SC-011 Requirements Status:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Task Completion Rate ≥90%</span>
                      {getComplianceIcon(
                        complianceStatus.taskCompletionRate.compliant,
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Rate ≤10%</span>
                      {getComplianceIcon(complianceStatus.errorRate.compliant)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        User Satisfaction ≥3.5/5.0
                      </span>
                      {getComplianceIcon(
                        complianceStatus.userSatisfaction.compliant,
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time ≤5000ms</span>
                      {getComplianceIcon(
                        complianceStatus.performanceStandards.compliant,
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.slice(0, 10).map((alert) => (
                        <div key={alert.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <Badge
                              variant={
                                alert.severity === "critical"
                                  ? "destructive"
                                  : alert.severity === "high"
                                    ? "destructive"
                                    : alert.severity === "medium"
                                      ? "secondary"
                                      : "outline"
                              }
                            >
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {alert.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No compliance alerts</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <ComplianceChart
            complianceStatus={complianceStatus}
            timeRange={selectedTimeRange}
          />
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <ComplianceActionPlan
            complianceStatus={complianceStatus}
            alerts={alerts}
          />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Compliance Analysis</CardTitle>
              <CardDescription>
                Comprehensive breakdown of SC-011 compliance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  {/* Task Completion Details */}
                  <div>
                    <h4 className="font-medium mb-2">
                      Task Completion Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Current Rate:</span>{" "}
                        {(
                          complianceStatus.taskCompletionRate.currentValue * 100
                        ).toFixed(1)}
                        %
                      </div>
                      <div>
                        <span className="font-medium">Target Rate:</span>{" "}
                        {(
                          complianceStatus.taskCompletionRate.targetValue * 100
                        ).toFixed(0)}
                        %
                      </div>
                      <div>
                        <span className="font-medium">Trend:</span>{" "}
                        {complianceStatus.taskCompletionRate.trend.toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {complianceStatus.taskCompletionRate.compliant
                          ? "Compliant"
                          : "Non-Compliant"}
                      </div>
                    </div>
                  </div>

                  {/* Error Rate Details */}
                  <div>
                    <h4 className="font-medium mb-2">Error Rate Analysis</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Current Rate:</span>{" "}
                        {(
                          complianceStatus.errorRate.currentValue * 100
                        ).toFixed(1)}
                        %
                      </div>
                      <div>
                        <span className="font-medium">Maximum Rate:</span>{" "}
                        {(complianceStatus.errorRate.targetValue * 100).toFixed(
                          0,
                        )}
                        %
                      </div>
                      <div>
                        <span className="font-medium">Trend:</span>{" "}
                        {complianceStatus.errorRate.trend.toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {complianceStatus.errorRate.compliant
                          ? "Compliant"
                          : "Non-Compliant"}
                      </div>
                    </div>
                  </div>

                  {/* User Satisfaction Details */}
                  <div>
                    <h4 className="font-medium mb-2">
                      User Satisfaction Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Current Score:</span>{" "}
                        {complianceStatus.userSatisfaction.currentValue.toFixed(
                          1,
                        )}
                        /5.0
                      </div>
                      <div>
                        <span className="font-medium">Minimum Score:</span>{" "}
                        {complianceStatus.userSatisfaction.targetValue.toFixed(
                          1,
                        )}
                        /5.0
                      </div>
                      <div>
                        <span className="font-medium">Trend:</span>{" "}
                        {complianceStatus.userSatisfaction.trend.toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {complianceStatus.userSatisfaction.compliant
                          ? "Compliant"
                          : "Non-Compliant"}
                      </div>
                    </div>
                  </div>

                  {/* Performance Standards Details */}
                  <div>
                    <h4 className="font-medium mb-2">
                      Performance Standards Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Avg Response Time:</span>{" "}
                        {complianceStatus.performanceStandards.averageResponseTime.toFixed(
                          0,
                        )}
                        ms
                      </div>
                      <div>
                        <span className="font-medium">Target Time:</span>{" "}
                        {complianceStatus.performanceStandards.targetResponseTime.toFixed(
                          0,
                        )}
                        ms
                      </div>
                      <div>
                        <span className="font-medium">
                          Slow Task Percentage:
                        </span>{" "}
                        {(
                          complianceStatus.performanceStandards
                            .slowTaskPercentage * 100
                        ).toFixed(1)}
                        %
                      </div>
                      <div>
                        <span className="font-medium">Maximum Slow Tasks:</span>{" "}
                        {(
                          complianceStatus.performanceStandards
                            .targetSlowTaskPercentage * 100
                        ).toFixed(0)}
                        %
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {complianceStatus.performanceStandards.compliant
                          ? "Compliant"
                          : "Non-Compliant"}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

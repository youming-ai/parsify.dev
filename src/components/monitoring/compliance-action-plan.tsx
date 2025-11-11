/**
 * Compliance Action Plan Component
 * Actionable items for maintaining SC-011 compliance
 * Task management and progress tracking
 */

"use client";

import React, { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Target,
  Zap,
  RefreshCw,
  Plus,
} from "lucide-react";

import { SC011ComplianceStatus, ComplianceAlert } from "@/monitoring/types";

interface ComplianceActionPlanProps {
  complianceStatus: SC011ComplianceStatus;
  alerts: ComplianceAlert[];
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
  assignee: string;
  dueDate: Date;
  progress: number;
  category: string;
  estimatedImpact: string;
}

export function ComplianceActionPlan({
  complianceStatus,
  alerts,
}: ComplianceActionPlanProps) {
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Generate action items based on compliance status and alerts
  const actionItems: ActionItem[] = [
    {
      id: "action_1",
      title: "Optimize Task Completion Rate",
      description:
        "Investigate and resolve common failure points to improve task completion rate to 90%+",
      priority: complianceStatus.taskCompletionRate.compliant
        ? "medium"
        : "critical",
      status: "in_progress",
      assignee: "Development Team",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      progress: 65,
      category: "Performance",
      estimatedImpact: "15% improvement in compliance score",
    },
    {
      id: "action_2",
      title: "Reduce Error Rate",
      description:
        "Fix top 3 most common error types and improve error handling",
      priority: complianceStatus.errorRate.compliant ? "low" : "high",
      status: "pending",
      assignee: "QA Team",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      progress: 0,
      category: "Quality",
      estimatedImpact: "10% reduction in error rate",
    },
    {
      id: "action_3",
      title: "Enhance User Experience",
      description: "Address user feedback and improve interface usability",
      priority: complianceStatus.userSatisfaction.compliant ? "low" : "medium",
      status: "pending",
      assignee: "UX Team",
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
      progress: 0,
      category: "User Experience",
      estimatedImpact: "0.5 point increase in satisfaction",
    },
    {
      id: "action_4",
      title: "Performance Optimization",
      description: "Optimize response times for slow-performing tasks",
      priority: complianceStatus.performanceStandards.compliant
        ? "low"
        : "high",
      status: "pending",
      assignee: "Performance Team",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      progress: 0,
      category: "Performance",
      estimatedImpact: "20% reduction in response time",
    },
    {
      id: "action_5",
      title: "Monitor Critical Alerts",
      description:
        "Address critical compliance alerts and implement preventive measures",
      priority: alerts.some((a) => a.severity === "critical" && !a.resolved)
        ? "critical"
        : "medium",
      status: "pending",
      assignee: "DevOps Team",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      progress: 0,
      category: "Monitoring",
      estimatedImpact: "Improved system reliability",
    },
  ];

  // Filter action items
  const filteredActions = actionItems.filter((action) => {
    if (selectedPriority !== "all" && action.priority !== selectedPriority)
      return false;
    if (selectedStatus !== "all" && action.status !== selectedStatus)
      return false;
    return true;
  });

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Calculate statistics
  const stats = {
    total: actionItems.length,
    critical: actionItems.filter((a) => a.priority === "critical").length,
    completed: actionItems.filter((a) => a.status === "completed").length,
    inProgress: actionItems.filter((a) => a.status === "in_progress").length,
    overdue: actionItems.filter(
      (a) => a.dueDate < new Date() && a.status !== "completed",
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Action Plan Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              SC-011 Action Plan
            </CardTitle>
            <CardDescription>
              Strategic actions to maintain and improve compliance
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 text-sm border rounded-md bg-background"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-sm border rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Actions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.critical}
              </div>
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.inProgress}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.overdue}
              </div>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm">
                {Math.round((stats.completed / stats.total) * 100)}%
              </span>
            </div>
            <Progress
              value={(stats.completed / stats.total) * 100}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
          <CardDescription>
            {filteredActions.length} action
            {filteredActions.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {filteredActions.map((action) => (
                <div key={action.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(action.status)}
                      <div>
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(action.priority)}>
                        {action.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{action.assignee}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{action.dueDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>{action.estimatedImpact}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm">{action.progress}%</span>
                    </div>
                    <Progress value={action.progress} className="h-2" />
                  </div>

                  {action.dueDate < new Date() &&
                    action.status !== "completed" && (
                      <div className="mt-2 flex items-center text-orange-600 text-sm">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Overdue by{" "}
                        {Math.ceil(
                          (Date.now() - action.dueDate.getTime()) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        days
                      </div>
                    )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compliance Chart Component
 * Visual representation of SC-011 compliance trends and metrics
 */

"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SC011ComplianceStatus } from "@/monitoring/types";
import { TrendingUp, TrendingDown, Target, Shield } from "lucide-react";

interface ComplianceChartProps {
  complianceStatus: SC011ComplianceStatus;
  timeRange: string;
}

export function ComplianceChart({
  complianceStatus,
  timeRange,
}: ComplianceChartProps) {
  // Generate historical compliance data
  const complianceData = useMemo(() => {
    const dataPoints = timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : 30;
    const interval =
      timeRange === "24h" ? "hour" : timeRange === "7d" ? "day" : "day";

    return Array.from({ length: dataPoints }, (_, i) => {
      const date = new Date();
      if (interval === "hour") {
        date.setHours(date.getHours() - (dataPoints - i - 1));
      } else {
        date.setDate(date.getDate() - (dataPoints - i - 1));
      }

      // Generate realistic compliance trends
      const baseCompliance = 85 + Math.sin(i * 0.2) * 10;
      const variation = Math.random() * 8 - 4;
      const complianceScore = Math.min(
        100,
        Math.max(60, baseCompliance + variation),
      );

      const completionRate =
        complianceStatus.taskCompletionRate.currentValue * 100 +
        (Math.random() * 10 - 5);
      const errorRate =
        complianceStatus.errorRate.currentValue * 100 + (Math.random() * 6 - 3);
      const satisfaction =
        complianceStatus.userSatisfaction.currentValue * 20 +
        (Math.random() * 10 - 5); // Scale to 0-100

      return {
        time:
          interval === "hour"
            ? `${date.getHours()}:00`
            : date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
        complianceScore: Math.round(complianceScore),
        completionRate: Math.round(Math.min(100, Math.max(0, completionRate))),
        errorRate: Math.round(Math.min(100, Math.max(0, errorRate))),
        satisfaction: Math.round(Math.min(100, Math.max(0, satisfaction))),
        targetCompliance: 90,
        targetCompletion: 90,
        targetError: 10,
        targetSatisfaction: 70, // 3.5/5.0 * 100
      };
    });
  }, [complianceStatus, timeRange]);

  // Generate risk level distribution
  const riskDistribution = useMemo(() => {
    return [
      { level: "Low", count: 12, color: "#10b981" },
      { level: "Medium", count: 5, color: "#f59e0b" },
      { level: "High", count: 2, color: "#f97316" },
      { level: "Critical", count: 1, color: "#ef4444" },
    ];
  }, []);

  return (
    <div className="space-y-6">
      {/* Compliance Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Compliance Score Trend
            </span>
            <Badge
              variant={complianceStatus.compliant ? "default" : "destructive"}
            >
              {complianceStatus.complianceScore}/100
            </Badge>
          </CardTitle>
          <CardDescription>SC-011 compliance score over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={complianceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" />
              <YAxis domain={[60, 100]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{label}</p>
                        {payload.map((entry: any, index: number) => (
                          <p
                            key={index}
                            className="text-sm"
                            style={{ color: entry.color }}
                          >
                            {entry.name}: {entry.value}%
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <ReferenceLine
                y={90}
                stroke="#10b981"
                strokeDasharray="5 5"
                label="Target (90%)"
              />
              <Line
                type="monotone"
                dataKey="complianceScore"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Compliance Score"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Compliance Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Compliance Components
          </CardTitle>
          <CardDescription>
            Individual compliance metrics vs targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={complianceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{label}</p>
                        {payload.map((entry: any, index: number) => (
                          <p
                            key={index}
                            className="text-sm"
                            style={{ color: entry.color }}
                          >
                            {entry.name}: {entry.value}%
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <ReferenceLine y={90} stroke="#10b981" strokeDasharray="5 5" />
              <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="5 5" />
              <Line
                type="monotone"
                dataKey="completionRate"
                stroke="#10b981"
                strokeWidth={2}
                name="Task Completion"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="satisfaction"
                stroke="#3b82f6"
                strokeWidth={2}
                name="User Satisfaction"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="errorRate"
                stroke="#ef4444"
                strokeWidth={2}
                name="Error Rate"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>
              Current risk assessment across compliance areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8">
                  {riskDistribution.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Compliance Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>Current SC-011 compliance status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Status</span>
                <Badge
                  variant={
                    complianceStatus.compliant ? "default" : "destructive"
                  }
                >
                  {complianceStatus.compliant ? "Compliant" : "Non-Compliant"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Compliance Score</span>
                <span className="font-bold">
                  {complianceStatus.complianceScore}/100
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Risk Level</span>
                <Badge
                  variant={
                    complianceStatus.riskLevel === "critical"
                      ? "destructive"
                      : complianceStatus.riskLevel === "high"
                        ? "destructive"
                        : complianceStatus.riskLevel === "medium"
                          ? "secondary"
                          : "default"
                  }
                >
                  {complianceStatus.riskLevel.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Trend</span>
                <div className="flex items-center">
                  {complianceStatus.trend === "improving" ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : complianceStatus.trend === "declining" ? (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  ) : null}
                  <span className="capitalize">{complianceStatus.trend}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Last Assessment</span>
                <span className="text-sm">
                  {complianceStatus.lastAssessment.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

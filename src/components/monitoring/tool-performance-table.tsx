/**
 * Tool Performance Table Component
 * Displays detailed performance metrics for each tool
 * Sortable, filterable table with performance indicators
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { PerformanceMetrics } from "@/monitoring/types";

interface ToolPerformanceTableProps {
  metrics: PerformanceMetrics;
}

interface ToolPerformanceData {
  name: string;
  category: string;
  usage: number;
  completionRate: number;
  avgResponseTime: number;
  errorRate: number;
  satisfaction: number;
  status: "excellent" | "good" | "warning" | "critical";
  trend: "up" | "down" | "stable";
}

export function ToolPerformanceTable({ metrics }: ToolPerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] =
    useState<keyof ToolPerformanceData>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Generate tool performance data
  const toolData: ToolPerformanceData[] = useMemo(() => {
    const tools = [
      { name: "JSON Formatter", category: "JSON", baseUsage: 45 },
      { name: "JSON Validator", category: "JSON", baseUsage: 38 },
      { name: "Code Formatter", category: "Code", baseUsage: 32 },
      { name: "Code Executor", category: "Code", baseUsage: 28 },
      { name: "File Converter", category: "File", baseUsage: 25 },
      { name: "Image Compressor", category: "File", baseUsage: 22 },
      { name: "Text Processor", category: "Text", baseUsage: 20 },
      { name: "URL Encoder", category: "Utilities", baseUsage: 18 },
      { name: "Hash Generator", category: "Security", baseUsage: 15 },
      { name: "Base64 Converter", category: "Utilities", baseUsage: 14 },
      { name: "JWT Decoder", category: "Security", baseUsage: 12 },
      { name: "Regex Tester", category: "Code", baseUsage: 11 },
    ];

    return tools.map((tool) => {
      const usageVariation = Math.random() * 20 - 10;
      const usage = Math.max(5, tool.baseUsage + usageVariation);

      const completionRate = Math.min(
        100,
        Math.max(60, metrics.taskSuccessRate * 100 + Math.random() * 20 - 10),
      );
      const avgResponseTime =
        metrics.averageResponseTime + Math.random() * 1000 - 500;
      const errorRate = (1 - completionRate / 100) * 100;
      const satisfaction =
        metrics.userSatisfactionScore + Math.random() * 1 - 0.5;

      let status: "excellent" | "good" | "warning" | "critical";
      if (completionRate >= 95 && avgResponseTime <= 2000 && errorRate <= 5)
        status = "excellent";
      else if (
        completionRate >= 85 &&
        avgResponseTime <= 5000 &&
        errorRate <= 15
      )
        status = "good";
      else if (
        completionRate >= 70 &&
        avgResponseTime <= 10000 &&
        errorRate <= 30
      )
        status = "warning";
      else status = "critical";

      const trendValue = Math.random();
      let trend: "up" | "down" | "stable";
      if (trendValue > 0.6) trend = "up";
      else if (trendValue < 0.4) trend = "down";
      else trend = "stable";

      return {
        name: tool.name,
        category: tool.category,
        usage,
        completionRate,
        avgResponseTime,
        errorRate,
        satisfaction,
        status,
        trend,
      };
    });
  }, [metrics]);

  // Get unique categories
  const categories = useMemo(() => {
    return ["all", ...new Set(toolData.map((tool) => tool.category))];
  }, [toolData]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = toolData.filter((tool) => {
      if (
        searchTerm &&
        !tool.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !tool.category.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (categoryFilter !== "all" && tool.category !== categoryFilter) {
        return false;
      }
      return true;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [toolData, searchTerm, categoryFilter, sortColumn, sortDirection]);

  // Handle sorting
  const handleSort = (column: keyof ToolPerformanceData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (column: keyof ToolPerformanceData) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-50 border-green-200";
      case "good":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "stable":
        return <Activity className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tool Performance</CardTitle>
            <CardDescription>
              Detailed performance metrics for each tool
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border rounded-md bg-background"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Tool Name</span>
                    {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    {getSortIcon("category")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("usage")}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Usage</span>
                    {getSortIcon("usage")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("completionRate")}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Completion Rate</span>
                    {getSortIcon("completionRate")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("avgResponseTime")}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Avg Response</span>
                    {getSortIcon("avgResponseTime")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("errorRate")}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Error Rate</span>
                    {getSortIcon("errorRate")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("satisfaction")}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Satisfaction</span>
                    {getSortIcon("satisfaction")}
                  </div>
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((tool, index) => (
                <TableRow
                  key={tool.name}
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                >
                  <TableCell className="font-medium">{tool.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tool.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span>{tool.usage.toFixed(0)}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${tool.usage}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span>{tool.completionRate.toFixed(1)}%</span>
                      {tool.completionRate >= 90 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : tool.completionRate >= 70 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span>{tool.avgResponseTime.toFixed(0)}ms</span>
                      {tool.avgResponseTime <= 2000 ? (
                        <Clock className="h-4 w-4 text-green-600" />
                      ) : tool.avgResponseTime <= 5000 ? (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        tool.errorRate <= 5
                          ? "text-green-600"
                          : tool.errorRate <= 15
                            ? "text-yellow-600"
                            : "text-red-600"
                      }
                    >
                      {tool.errorRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span>{tool.satisfaction.toFixed(1)}/5.0</span>
                      {tool.satisfaction >= 4.0 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : tool.satisfaction >= 3.0 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getStatusColor(tool.status)}>
                      {tool.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {getTrendIcon(tool.trend)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tools found matching your criteria</p>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredAndSortedData.length} of {toolData.length} tools
        </div>
      </CardContent>
    </Card>
  );
}

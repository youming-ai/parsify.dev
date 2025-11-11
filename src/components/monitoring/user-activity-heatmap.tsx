/**
 * User Activity Heatmap Component
 * Visual representation of user activity patterns
 * Heat map showing peak usage times and interaction patterns
 */

"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, Clock, TrendingUp } from "lucide-react";

interface UserActivityHeatmapProps {
  className?: string;
}

interface HeatmapData {
  hour: number;
  day: number;
  activity: number;
  date: string;
}

export function UserActivityHeatmap({ className }: UserActivityHeatmapProps) {
  // Generate heatmap data for the last 7 days
  const heatmapData = useMemo(() => {
    const data: HeatmapData[] = [];
    const now = new Date();

    for (let day = 6; day >= 0; day--) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);

      for (let hour = 0; hour < 24; hour++) {
        // Simulate realistic activity patterns
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let baseActivity = 0;

        // Business hours (9-17) have higher activity
        if (hour >= 9 && hour <= 17) {
          baseActivity = isWeekend ? 30 : 70;
        }
        // Evening hours (18-22) moderate activity
        else if (hour >= 18 && hour <= 22) {
          baseActivity = isWeekend ? 50 : 40;
        }
        // Late night (23-6) low activity
        else {
          baseActivity = isWeekend ? 20 : 10;
        }

        // Add some randomness and specific peaks
        const peakHour = hour === 12 || hour === 15 ? 20 : 0;
        const lunchPeak = hour === 12 ? 15 : 0;
        const eveningPeak = hour === 20 ? 25 : 0;

        const activity = Math.min(
          100,
          Math.max(
            0,
            baseActivity +
              peakHour +
              lunchPeak +
              eveningPeak +
              Math.random() * 30 -
              15,
          ),
        );

        data.push({
          hour,
          day: 6 - day,
          activity: Math.round(activity),
          date: date.toLocaleDateString("en-US", { weekday: "short" }),
        });
      }
    }

    return data;
  }, []);

  // Get color based on activity level
  const getActivityColor = (activity: number) => {
    if (activity === 0) return "bg-gray-100";
    if (activity < 20) return "bg-blue-200";
    if (activity < 40) return "bg-blue-300";
    if (activity < 60) return "bg-blue-400";
    if (activity < 80) return "bg-blue-500";
    return "bg-blue-600";
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalActivity = heatmapData.reduce((sum, d) => sum + d.activity, 0);
    const avgActivity = totalActivity / heatmapData.length;
    const maxActivity = Math.max(...heatmapData.map((d) => d.activity));
    const peakHour = heatmapData.reduce((max, d) =>
      d.activity > max.activity ? d : max,
    );

    // Find most active day
    const dayActivity = Array.from({ length: 7 }, (_, i) =>
      heatmapData
        .filter((d) => d.day === i)
        .reduce((sum, d) => sum + d.activity, 0),
    );
    const mostActiveDayIndex = dayActivity.indexOf(Math.max(...dayActivity));
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return {
      totalActivity,
      avgActivity: Math.round(avgActivity),
      maxActivity,
      peakHour: peakHour.hour,
      mostActiveDay: days[mostActiveDayIndex],
      totalSessions: Math.round(totalActivity / 10), // Simulate session count
    };
  }, [heatmapData]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          User Activity Heatmap
        </CardTitle>
        <CardDescription>
          Activity patterns over the last 7 days by hour
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-sm text-muted-foreground">Total Sessions</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.avgActivity}%</div>
            <p className="text-sm text-muted-foreground">Avg Activity</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.maxActivity}%</div>
            <p className="text-sm text-muted-foreground">Peak Activity</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.peakHour}:00</div>
            <p className="text-sm text-muted-foreground">Peak Hour</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.mostActiveDay}</div>
            <p className="text-sm text-muted-foreground">Most Active Day</p>
          </div>
        </div>

        {/* Heatmap */}
        <div className="space-y-4">
          {/* Hours labels */}
          <div className="flex items-center">
            <div className="w-16 text-sm text-muted-foreground">Time</div>
            <div className="flex-1 grid grid-cols-24 gap-1">
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className="text-xs text-center text-muted-foreground"
                >
                  {i}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap grid */}
          {Array.from({ length: 7 }, (_, dayIndex) => {
            const dayData = heatmapData.filter((d) => d.day === dayIndex);
            const firstDayData = dayData[0];

            return (
              <div key={dayIndex} className="flex items-center">
                <div className="w-16 text-sm text-muted-foreground pr-2">
                  {firstDayData.date}
                </div>
                <div className="flex-1 grid grid-cols-24 gap-1">
                  {dayData.map((data) => (
                    <div
                      key={`${data.day}-${data.hour}`}
                      className={`aspect-square rounded-sm ${getActivityColor(data.activity)} hover:ring-2 hover:ring-blue-300 cursor-pointer transition-all`}
                      title={`${firstDayData.date} ${data.hour}:00 - ${data.activity}% activity`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Activity Level:
            </span>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-100 rounded-sm" />
                <span className="text-xs">0%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-200 rounded-sm" />
                <span className="text-xs">20%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-300 rounded-sm" />
                <span className="text-xs">40%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-400 rounded-sm" />
                <span className="text-xs">60%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                <span className="text-xs">80%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                <span className="text-xs">100%</span>
              </div>
            </div>
          </div>

          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Last 7 days
          </Badge>
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Activity Insights</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>
                  • Peak usage occurs during business hours (9AM-5PM) on
                  weekdays
                </li>
                <li>• Weekend activity shows evening patterns (6PM-10PM)</li>
                <li>
                  • Highest activity recorded on {stats.mostActiveDay} at{" "}
                  {stats.peakHour}:00
                </li>
                <li>
                  • Consider server scaling during peak hours for optimal
                  performance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

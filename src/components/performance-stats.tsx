/**
 * Performance Stats Component
 *
 * Displays Web Vitals and performance metrics in development mode.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerformanceMonitoring } from '@/hooks/use-performance-monitoring';
import { ChartLine, Cpu, Gauge, Timer } from '@phosphor-icons/react';

export function PerformanceStats() {
  const { vitals, hasVitals } = usePerformanceMonitoring();

  if (!hasVitals) {
    return null;
  }

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'good':
        return 'bg-green-500 text-white';
      case 'needs-improvement':
        return 'bg-yellow-500 text-white';
      case 'poor':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRatingLabel = (rating?: string) => {
    switch (rating) {
      case 'good':
        return 'Good';
      case 'needs-improvement':
        return 'Needs Improvement';
      case 'poor':
        return 'Poor';
      default:
        return 'N/A';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ChartLine className="h-4 w-4" />
            Performance Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {/* LCP */}
          {vitals.lcp && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-3 w-3 text-muted-foreground" />
                <span>LCP</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{vitals.lcp.value.toFixed(0)}ms</span>
                <Badge className={getRatingColor(vitals.lcp.rating)} variant="secondary">
                  {getRatingLabel(vitals.lcp.rating)}
                </Badge>
              </div>
            </div>
          )}

          {/* FCP */}
          {vitals.fcp && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-3 w-3 text-muted-foreground" />
                <span>FCP</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{vitals.fcp.value.toFixed(0)}ms</span>
                <Badge className={getRatingColor(vitals.fcp.rating)} variant="secondary">
                  {getRatingLabel(vitals.fcp.rating)}
                </Badge>
              </div>
            </div>
          )}

          {/* CLS */}
          {vitals.cls && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-3 w-3 text-muted-foreground" />
                <span>CLS</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{vitals.cls.value.toFixed(3)}</span>
                <Badge className={getRatingColor(vitals.cls.rating)} variant="secondary">
                  {getRatingLabel(vitals.cls.rating)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

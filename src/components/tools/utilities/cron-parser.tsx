'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, WarningCircle } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

type CronParseResult =
  | { success: true; description: string; nextRuns: string[] }
  | { success: false; error: string };

export const parseCronExpression = (cron: string): CronParseResult => {
  try {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      return { success: false, error: 'Invalid cron expression: must have 5 parts' };
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    let desc = 'At ';

    // Time
    if (minute === '*' && hour === '*') {
      desc += 'every minute';
    } else if (minute === '0' && hour === '*') {
      desc += '0:00';
    } else if (hour === '*') {
      desc += `minute ${minute} past every hour`;
    } else if (minute === '0') {
      desc += `${hour}:00`;
    } else {
      desc += `${hour}:${minute}`;
    }

    // Date
    if (dayOfMonth !== '*') {
      desc += ` on day-of-month ${dayOfMonth}`;
    }

    if (month !== '*') {
      desc += ` in month ${month}`;
    }

    if (dayOfWeek !== '*') {
      desc += ` on day-of-week ${dayOfWeek}`;
    }

    // Calculate next runs (simulated for now)
    const now = new Date();
    const runs = [];
    for (let i = 1; i <= 5; i++) {
      const next = new Date(now.getTime() + i * 60000 * (parts[0] === '*' ? 1 : 60));
      runs.push(next.toLocaleString());
    }

    return { success: true, description: desc, nextRuns: runs };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Invalid cron expression',
    };
  }
};

export function CronParser() {
  const [expression, setExpression] = useState('* * * * *');
  const [description, setDescription] = useState('');
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const result = parseCronExpression(expression);
    if (result.success) {
      setDescription(result.description);
      setNextRuns(result.nextRuns);
      setError('');
    } else {
      setError(result.error);
      setDescription('');
      setNextRuns([]);
    }
  }, [expression]);

  const presets = [
    { name: 'Every minute', value: '* * * * *' },
    { name: 'Every hour', value: '0 * * * *' },
    { name: 'Every day at midnight', value: '0 0 * * *' },
    { name: 'Every Sunday', value: '0 0 * * 0' },
    { name: 'Every 1st of month', value: '0 0 1 * *' },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cron Expression Parser</CardTitle>
          <CardDescription>Parse and understand cron schedule expressions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Badge
                  key={preset.name}
                  variant="secondary"
                  className="cursor-pointer hover:bg-muted dark:hover:bg-muted"
                  onClick={() => setExpression(preset.value)}
                >
                  {preset.name}
                </Badge>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Cron Expression</Label>
              <div className="relative">
                <Input
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  className="pl-10 font-mono text-lg"
                  placeholder="* * * * *"
                />
                <Clock className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-500 dark:bg-red-900/20">
                <WarningCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-600 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{description}</span>
              </div>
            )}

            <div className="grid grid-cols-5 gap-2 text-center text-slate-500 text-sm">
              <div className="rounded bg-muted p-2 dark:bg-card">minute</div>
              <div className="rounded bg-muted p-2 dark:bg-card">hour</div>
              <div className="rounded bg-muted p-2 dark:bg-card">day (month)</div>
              <div className="rounded bg-muted p-2 dark:bg-card">month</div>
              <div className="rounded bg-muted p-2 dark:bg-card">day (week)</div>
            </div>
          </div>

          {!error && nextRuns.length > 0 && (
            <div className="space-y-2">
              <Label>Next Scheduled Runs</Label>
              <div className="space-y-2 rounded-lg bg-muted p-4 dark:bg-card">
                {nextRuns.map((run, index) => (
                  <div key={index} className="font-mono text-slate-600 text-sm dark:text-slate-300">
                    {run}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CronParser;

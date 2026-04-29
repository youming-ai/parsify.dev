'use client';

import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateRateLimits } from '@/lib/llm/rate-limit-calculator';
import { useMemo, useState } from 'react';

export function RateLimitCalculator() {
  const [tpm, setTpm] = useState(10000);
  const [rpm, setRpm] = useState(1000);
  const [tpd, setTpd] = useState(1000000);
  const [maxConcurrency, setMaxConcurrency] = useState(50);
  const [averageInputTokens, setAverageInputTokens] = useState(1000);
  const [averageOutputTokens, setAverageOutputTokens] = useState(1000);
  const [desiredRps, setDesiredRps] = useState(10);

  const result = useMemo(
    () =>
      calculateRateLimits({
        tpm,
        rpm,
        tpd,
        maxConcurrency,
        averageInputTokens,
        averageOutputTokens,
        desiredRps,
      }),
    [tpm, rpm, tpd, maxConcurrency, averageInputTokens, averageOutputTokens, desiredRps]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Calculator</CardTitle>
          <CardDescription>
            Estimate LLM API throughput from TPM, RPM, TPD, concurrency, and request size.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Tokens per minute (TPM)</Label>
            <Input
              type="number"
              value={tpm}
              onChange={(event) => setTpm(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Requests per minute (RPM)</Label>
            <Input
              type="number"
              value={rpm}
              onChange={(event) => setRpm(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Tokens per day (TPD)</Label>
            <Input
              type="number"
              value={tpd}
              onChange={(event) => setTpd(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Max concurrency</Label>
            <Input
              type="number"
              value={maxConcurrency}
              onChange={(event) => setMaxConcurrency(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Average input tokens</Label>
            <Input
              type="number"
              value={averageInputTokens}
              onChange={(event) => setAverageInputTokens(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Average output tokens</Label>
            <Input
              type="number"
              value={averageOutputTokens}
              onChange={(event) => setAverageOutputTokens(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Desired requests per second</Label>
            <Input
              type="number"
              value={desiredRps}
              onChange={(event) => setDesiredRps(Number(event.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Max RPM (tokens)" value={result.maxRpmByTokens} />
        <MetricCard label="Max RPM (requests)" value={result.maxRpmByRequests} />
        <MetricCard label="Max sustained QPS" value={result.maxSustainedRps.toFixed(2)} />
        <MetricCard label="Daily request capacity" value={result.dailyRequestCapacity} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Bottleneck:</span>
            <Badge variant="destructive">{result.bottleneck}</Badge>
          </div>
          <p className="text-sm">{result.recommendation}</p>
        </CardContent>
      </Card>

      <RelatedTools toolId="rate-limit-calculator" />
    </div>
  );
}

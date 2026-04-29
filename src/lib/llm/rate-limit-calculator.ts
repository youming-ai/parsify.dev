export interface RateLimitInput {
  tpm: number;
  rpm: number;
  tpd: number;
  maxConcurrency: number;
  averageInputTokens: number;
  averageOutputTokens: number;
  desiredRps: number;
}

export interface RateLimitResult {
  maxRpmByTokens: number;
  maxRpmByRequests: number;
  maxSustainedRps: number;
  dailyRequestCapacity: number;
  bottleneck: string;
  recommendation: string;
}

export function calculateRateLimits(input: RateLimitInput): RateLimitResult {
  const tpm = Math.max(0, input.tpm);
  const rpm = Math.max(0, input.rpm);
  const tpd = Math.max(0, input.tpd);
  const totalTokensPerRequest = Math.max(1, input.averageInputTokens + input.averageOutputTokens);

  const maxRpmByTokens = Math.floor(tpm / totalTokensPerRequest);
  const maxRpmByRequests = rpm;
  const maxSustainedRps = Math.min(maxRpmByTokens, maxRpmByRequests, input.maxConcurrency) / 60;
  const dailyRequestCapacity = Math.floor(tpd / totalTokensPerRequest);

  const limits: Array<{ name: string; value: number }> = [
    { name: 'TPM', value: maxRpmByTokens },
    { name: 'RPM', value: rpm },
    { name: 'TPD', value: Math.floor(tpd / (totalTokensPerRequest * 144)) },
  ];
  const bottleneck = limits.reduce((prev, curr) => (curr.value < prev.value ? curr : prev));

  return {
    maxRpmByTokens,
    maxRpmByRequests,
    maxSustainedRps,
    dailyRequestCapacity,
    bottleneck: bottleneck.name,
    recommendation:
      maxSustainedRps >= input.desiredRps
        ? 'Current limits support your desired throughput.'
        : `Reduce average tokens per request or upgrade your ${bottleneck.name} limit.`,
  };
}

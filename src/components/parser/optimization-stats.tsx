import type { ParseResponse } from '~/schemas/parse';

type Props = {
  data: ParseResponse;
};

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function OptimizationStats({ data }: Props) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="text-sm font-semibold">Cleaned content</h2>
      <div className="grid grid-cols-2 gap-4">
        <Stat label="Size" value={fmtBytes(data.mdBytes)} />
        <Stat label="Tokens (est.)" value={data.mdTokens.toLocaleString()} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}

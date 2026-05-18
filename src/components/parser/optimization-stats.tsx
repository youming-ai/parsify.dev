import type { ModelId } from '~/lib/parser/models';
import { priceFor } from '~/lib/parser/token-estimate';
import type { ParseResponse } from '~/schemas/parse';

type Props = {
  data: ParseResponse;
  model: ModelId;
};

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function OptimizationStats({ data, model }: Props) {
  const tokensSaved = data.htmlTokens - data.mdTokens;
  const inputCostHtml = priceFor(model, data.htmlTokens, 0);
  const inputCostMd = priceFor(model, data.mdTokens, 0);
  const dollarSaved =
    inputCostHtml !== null && inputCostMd !== null ? inputCostHtml - inputCostMd : null;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="text-sm font-semibold">Optimization stats (estimated)</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat
          label="Raw HTML"
          value={`${fmtBytes(data.htmlBytes)} · ${data.htmlTokens.toLocaleString()} tok`}
        />
        <Stat
          label="Cleaned MD"
          value={`${fmtBytes(data.mdBytes)} · ${data.mdTokens.toLocaleString()} tok`}
        />
        <Stat
          label="Savings"
          value={`${(data.savingsRatio * 100).toFixed(1)}% · −${tokensSaved.toLocaleString()} tok`}
        />
        {dollarSaved !== null && (
          <Stat label={`Cost saved (${model})`} value={`$${dollarSaved.toFixed(4)}`} />
        )}
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

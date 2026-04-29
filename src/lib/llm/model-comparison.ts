export interface ComparisonFilters {
  provider?: string;
  capability?: string;
  minContextWindow?: number;
  maxInputPrice?: number;
}

export type ComparisonSortKey = 'name' | 'contextWindow' | 'inputPrice' | 'outputPrice';

export interface ComparisonModel {
  id: string;
  provider: string;
  displayName: string;
  contextWindow: number;
  pricing: { input: number; output: number };
  capabilities: string[];
}

export function filterModelsForComparison(
  models: ComparisonModel[],
  filters: ComparisonFilters
): ComparisonModel[] {
  return models.filter((model) => {
    if (filters.provider && model.provider !== filters.provider) return false;
    if (filters.capability && !model.capabilities.includes(filters.capability)) return false;
    if (filters.minContextWindow !== undefined && model.contextWindow < filters.minContextWindow)
      return false;
    if (filters.maxInputPrice !== undefined && model.pricing.input > filters.maxInputPrice)
      return false;
    return true;
  });
}

export function sortModelsForComparison(
  models: ComparisonModel[],
  sortKey: ComparisonSortKey
): ComparisonModel[] {
  const sorted = [...models];
  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'name':
        return a.displayName.localeCompare(b.displayName);
      case 'contextWindow':
        return b.contextWindow - a.contextWindow;
      case 'inputPrice':
        return a.pricing.input - b.pricing.input;
      case 'outputPrice':
        return a.pricing.output - b.pricing.output;
      default:
        return 0;
    }
  });
  return sorted;
}

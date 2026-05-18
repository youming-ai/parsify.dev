export const MODEL_IDS = ['glm-5.1', 'glm-4-plus', 'glm-4-air', 'glm-4-flash'] as const;

export type ModelId = (typeof MODEL_IDS)[number];

export const DEFAULT_MODEL: ModelId = 'glm-5.1';

type Price = { inputPerMTok: number; outputPerMTok: number } | null;

export const MODEL_PRICING: Record<ModelId, Price> = {
  'glm-5.1': null,
  'glm-4-plus': null,
  'glm-4-air': null,
  'glm-4-flash': null,
};

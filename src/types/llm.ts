export type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'meta'
  | 'deepseek'
  | 'qwen'
  | 'mistral'
  | 'cohere';

export type LLMCapability =
  | 'text'
  | 'vision'
  | 'tool_use'
  | 'prompt_cache'
  | 'batch'
  | 'thinking'
  | 'json_mode'
  | 'embeddings';

export type LLMTokenizer =
  | 'o200k'
  | 'cl100k'
  | 'claude'
  | 'sentencepiece'
  | 'llama'
  | 'qwen'
  | 'mistral';

export interface LLMPricing {
  input: number;
  output: number;
  cacheWrite?: number;
  cacheRead?: number;
  batchInput?: number;
  batchOutput?: number;
}

export interface LLMModel {
  id: string;
  provider: LLMProvider;
  displayName: string;
  contextWindow: number;
  maxOutput: number;
  pricing: LLMPricing;
  capabilities: LLMCapability[];
  tokenizer: LLMTokenizer;
  knowledgeCutoff: string;
}

export interface LLMRegistry {
  version: string;
  lastUpdated: string;
  models: LLMModel[];
}

export interface LiveModel {
  id: string;
  provider: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  inputPrice: number;
  outputPrice: number;
  cacheReadPrice?: number;
  cacheWritePrice?: number;
  modalities: string[];
  supportedParams: string[];
  capabilities: string[];
}

export interface LiveRegistryResult {
  models: LiveModel[];
  providers: string[];
  fetchedAt: string;
}

export const KNOWN_PROVIDERS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  meta: 'Meta',
  deepseek: 'DeepSeek',
  qwen: 'Qwen',
  mistral: 'Mistral',
  cohere: 'Cohere',
  moonshot: 'Moonshot',
};

function extractProvider(id: string): string {
  const cleaned = id.replace(/^\/+/, '');
  const slash = cleaned.indexOf('/');
  if (slash === -1) return 'custom';
  return cleaned.slice(0, slash);
}

function extractSlug(id: string, provider: string): string {
  const cleaned = id.replace(/^\/+/, '');
  const prefix = `${provider}/`;
  return cleaned.startsWith(prefix) ? cleaned.slice(prefix.length) : cleaned;
}

function providerToKey(provider: string): string {
  const lower = provider.toLowerCase();
  if (lower.includes('openai') || lower.includes('chatgpt') || lower.includes('gpt'))
    return 'openai';
  if (lower.includes('anthropic') || lower.includes('claude')) return 'anthropic';
  if (lower.includes('google') || lower.includes('gemini')) return 'google';
  if (lower.includes('meta') || lower.includes('llama')) return 'meta';
  if (lower.includes('deepseek')) return 'deepseek';
  if (lower.includes('qwen') || lower.includes('alibaba')) return 'qwen';
  if (lower.includes('mistral')) return 'mistral';
  if (lower.includes('cohere')) return 'cohere';
  if (lower.includes('moonshot')) return 'moonshot';
  return lower;
}

function normalizePrice(p: number | null | undefined): number {
  if (p === null || p === undefined || Number.isNaN(p)) return 0;
  return Math.round(p * 1_000_000 * 100) / 100;
}

function deriveCapabilities(
  supportedParams: string[],
  modalities: string[],
  name: string
): string[] {
  const caps: string[] = [];
  const hasSupport = (p: string) => supportedParams.some((s) => s.toLowerCase().includes(p));
  const lowerName = name.toLowerCase();

  if (modalities.includes('image')) caps.push('vision');
  if (hasSupport('tool')) caps.push('tool_use');
  if (hasSupport('json')) caps.push('json_mode');
  if (hasSupport('batch')) caps.push('batch');
  if (lowerName.includes('thinking') || lowerName.includes('reason')) caps.push('thinking');
  if (modalities.includes('text')) caps.push('text');

  return caps;
}

export async function fetchLiveRegistry(): Promise<LiveRegistryResult> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    method: 'GET',
  });
  if (!res.ok) {
    throw new Error(`OpenRouter API error: ${res.status}`);
  }
  const json = (await res.json()) as {
    data: Array<{
      id: string;
      name: string;
      context_length?: number;
      top_provider?: {
        context_length?: number;
        max_completion_tokens?: number;
      };
      pricing?: {
        prompt?: number;
        completion?: number;
        input_cache_read?: number;
        input_cache_write?: number;
      };
      architecture?: {
        modality?: string;
        input_modalities?: string[];
        output_modalities?: string[];
      };
      supported_parameters?: string[];
    }>;
  };

  const models: LiveModel[] = [];
  const providerSet = new Set<string>();

  for (const m of json.data) {
    const rawProvider = extractProvider(m.id);
    const providerKey = providerToKey(rawProvider);
    const slug = extractSlug(m.id, rawProvider);

    providerSet.add(providerKey);

    const modalities = m.architecture?.input_modalities ?? [
      ...(m.architecture?.modality?.includes('image') ? ['text', 'image'] : ['text']),
    ];

    models.push({
      id: slug,
      provider: providerKey,
      name: m.name ?? slug,
      contextWindow: m.top_provider?.context_length ?? m.context_length ?? 0,
      maxOutput: m.top_provider?.max_completion_tokens ?? 0,
      inputPrice: normalizePrice(m.pricing?.prompt),
      outputPrice: normalizePrice(m.pricing?.completion),
      cacheReadPrice: m.pricing?.input_cache_read
        ? normalizePrice(m.pricing.input_cache_read)
        : undefined,
      cacheWritePrice: m.pricing?.input_cache_write
        ? normalizePrice(m.pricing.input_cache_write)
        : undefined,
      modalities,
      supportedParams: m.supported_parameters ?? [],
      capabilities: deriveCapabilities(m.supported_parameters ?? [], modalities, m.name ?? ''),
    });
  }

  return {
    models,
    providers: Array.from(providerSet).sort(),
    fetchedAt: new Date().toISOString(),
  };
}

export function loadCachedRegistry(): LiveRegistryResult | null {
  try {
    const raw = localStorage.getItem('parsify_live_registry');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiveRegistryResult;
    const age = Date.now() - new Date(parsed.fetchedAt).getTime();
    if (age > 24 * 60 * 60 * 1000) return null; // 24h TTL
    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedRegistry(result: LiveRegistryResult): void {
  try {
    localStorage.setItem('parsify_live_registry', JSON.stringify(result));
  } catch {
    // localStorage full — ignore
  }
}

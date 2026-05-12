export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  features: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'stable' | 'beta' | 'experimental';
  href: string;
  isNew?: boolean;
  isPopular?: boolean;
  processingType?: 'client-side' | 'server-side' | 'hybrid';
  security?: 'local-only' | 'secure-sandbox' | 'network-required';
}

export interface ToolCategoryData {
  id: string;
  name: string;
  description?: string;
}

export const AI_TOOLS_CATEGORY = 'AI & LLM Tools';

export const toolsData: Tool[] = [
  {
    id: 'cost-calculator',
    name: 'LLM Cost Calculator',
    description: 'Estimate monthly LLM API costs locally across providers.',
    category: AI_TOOLS_CATEGORY,
    icon: 'CurrencyDollar',
    features: ['Multi-provider pricing', 'Monthly estimates', 'Batch costing', 'CSV export'],
    tags: ['cost-calculator', 'llm-pricing', 'api-cost', 'openai-cost'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/ai/cost-calculator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'cache-calculator',
    name: 'Prompt Cache Calculator',
    description:
      'Calculate whether prompt caching saves money based on static tokens, dynamic tokens, usage, and hit rate.',
    category: AI_TOOLS_CATEGORY,
    icon: 'FloppyDisk',
    features: ['Cache savings', 'Break-even analysis', 'Multi-provider', 'Cost comparison'],
    tags: ['prompt-cache', 'cache-calculator', 'anthropic-cache', 'cost-savings'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/ai/cache-calculator',
    processingType: 'client-side',
    security: 'local-only',
  },
];

export const toolCategories: ToolCategoryData[] = [
  {
    id: 'ai',
    name: AI_TOOLS_CATEGORY,
    description: 'Privacy-first browser tools for AI agent and LLM application developers.',
  },
];

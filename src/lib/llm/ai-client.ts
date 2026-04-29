import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';

export type AiProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'mistral';

interface AiClientOptions {
  modelId: string;
  apiKey: string;
  provider: AiProvider;
}

export function createLanguageModel(options: AiClientOptions) {
  switch (options.provider) {
    case 'openai': {
      const provider = createOpenAI({ apiKey: options.apiKey });
      return provider.chat(options.modelId);
    }
    case 'anthropic': {
      const provider = createAnthropic({ apiKey: options.apiKey });
      return provider.chat(options.modelId);
    }
    case 'google': {
      const provider = createGoogleGenerativeAI({ apiKey: options.apiKey });
      return provider.chat(options.modelId);
    }
    case 'deepseek': {
      const provider = createDeepSeek({ apiKey: options.apiKey });
      return provider.chat(options.modelId);
    }
    case 'mistral': {
      const provider = createMistral({ apiKey: options.apiKey });
      return provider.chat(options.modelId);
    }
    default: {
      throw new Error(`Unsupported provider: ${options.provider}`);
    }
  }
}

export { streamText } from 'ai';

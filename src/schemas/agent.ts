import { z } from 'zod';
import { MODEL_IDS } from '~/lib/parser/models';

const MAX_MARKDOWN_BYTES = 1024 * 1024;
const DEFAULT_PROMPT = '请用一段话总结这个网页的核心内容';

export const agentRequestSchema = z.object({
  markdown: z
    .string()
    .min(1, 'markdown must not be empty')
    .max(MAX_MARKDOWN_BYTES, 'markdown exceeds 1 MB limit'),
  apiKey: z.string().min(1, 'apiKey is required'),
  prompt: z.string().min(1).default(DEFAULT_PROMPT),
  model: z.enum(MODEL_IDS).default('glm-5.1'),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;

export type AgentError = {
  error: 'INVALID_BODY' | 'AGENT_FAILED' | 'RATE_LIMITED';
  message: string;
};

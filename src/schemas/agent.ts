import { z } from 'zod';

const MAX_MARKDOWN_BYTES = 1024 * 1024;
const DEFAULT_PROMPT = '请对这个网页进行全面的SEO分析，并生成SEO.md文档。';

export const agentRequestSchema = z.object({
  markdown: z
    .string()
    .min(1, 'markdown must not be empty')
    .max(MAX_MARKDOWN_BYTES, 'markdown exceeds 1 MB limit'),
  prompt: z.string().min(1).default(DEFAULT_PROMPT),
  outputFormat: z.enum(['text', 'json']).default('json'),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;

export type AgentError = {
  error: 'INVALID_BODY' | 'AGENT_FAILED' | 'RATE_LIMITED' | 'CONFIG_ERROR';
  message: string;
};

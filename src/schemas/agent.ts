import { z } from 'zod';

const MAX_MARKDOWN_BYTES = 1024 * 1024;

export const agentRequestSchema = z.object({
  markdown: z
    .string()
    .min(1, 'markdown must not be empty')
    .max(MAX_MARKDOWN_BYTES, 'markdown exceeds 1 MB limit'),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;

export type AgentError = {
  error: 'INVALID_BODY' | 'AGENT_FAILED' | 'RATE_LIMITED' | 'CONFIG_ERROR';
  message: string;
};

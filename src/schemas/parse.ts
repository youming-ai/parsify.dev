import { z } from 'zod';

export const parseRequestSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith('http://') || u.startsWith('https://'), {
      message: 'URL must use http or https',
    }),
});

export type ParseRequest = z.infer<typeof parseRequestSchema>;

export type ParseResponse = {
  url: string;
  markdown: string;
  htmlBytes: number;
  mdBytes: number;
  htmlTokens: number;
  mdTokens: number;
  savingsRatio: number;
  fetchedAt: string;
};

export type ParseErrorCode = 'INVALID_URL' | 'FETCH_FAILED' | 'TIMEOUT' | 'TOO_LARGE';

export type ParseError = {
  error: ParseErrorCode;
  message: string;
};

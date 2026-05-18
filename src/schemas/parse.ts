import { z } from 'zod';

export const parseRequestSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith('http://') || u.startsWith('https://'), {
      message: 'URL must use http or https',
    })
    .refine(
      (u) => {
        try {
          const { hostname } = new URL(u);
          if (/^(127\.|0\.0\.0\.0|localhost$)/i.test(hostname)) return false;
          if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/i.test(hostname)) return false;
          if (/^169\.254\./i.test(hostname)) return false;
          if (hostname === '[::1]' || hostname === '::1') return false;
          return true;
        } catch {
          return false;
        }
      },
      { message: 'URL must point to a public host' }
    ),
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

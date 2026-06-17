import { z } from 'zod/v4';

const boxPointSchema = z.array(z.number()).length(2);

const boxSchema = z.object({
  points: z.array(boxPointSchema).min(3).max(4),
  text: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const enhanceRequestSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(100 * 1024),
  boxes: z.array(boxSchema).min(1),
  prompt: z.string().max(500).optional(),
});

export type EnhanceRequest = z.infer<typeof enhanceRequestSchema>;

export interface EnhanceError {
  code: 'INVALID_REQUEST' | 'CONFIG_ERROR' | 'UPSTREAM_ERROR';
  message: string;
}

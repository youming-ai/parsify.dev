import { z } from 'zod/v4';

// Hard ceiling on a single OCR box's text and on the number of boxes, so a
// malicious or runaway request cannot force the Worker to Zod-walk an unbounded
// array or hold megabytes of box text. A 50-page scan rarely exceeds a few
// thousand boxes; 20000 is generous headroom.
export const MAX_BOXES = 20_000;
const MAX_BOX_TEXT = 4_000;
// Pixel coordinates for any realistic rendered page stay well under this.
const MAX_COORD = 100_000;

const boxPointSchema = z.array(z.number().finite().min(-MAX_COORD).max(MAX_COORD)).length(2);

const boxSchema = z.object({
  points: z.array(boxPointSchema).min(3).max(4),
  text: z.string().min(1).max(MAX_BOX_TEXT),
  confidence: z.number().min(0).max(1),
});

export const enhanceRequestSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(100 * 1024),
  boxes: z.array(boxSchema).min(1).max(MAX_BOXES),
  prompt: z.string().max(500).optional(),
});

export type EnhanceRequest = z.infer<typeof enhanceRequestSchema>;

export interface EnhanceError {
  code: 'INVALID_REQUEST' | 'CONFIG_ERROR' | 'UPSTREAM_ERROR' | 'PAYLOAD_TOO_LARGE';
  message: string;
}

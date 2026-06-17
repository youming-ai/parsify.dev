import { describe, expect, it } from 'bun:test';
import { type EnhanceRequest, enhanceRequestSchema } from '~/schemas/enhance';

describe('enhanceRequestSchema', () => {
  const validRequest: EnhanceRequest = {
    text: 'Hello world',
    boxes: [
      {
        points: [
          [0, 0],
          [100, 0],
          [100, 30],
          [0, 30],
        ],
        text: 'Hello',
        confidence: 0.95,
      },
      {
        points: [
          [0, 40],
          [100, 40],
          [100, 70],
          [0, 70],
        ],
        text: 'world',
        confidence: 0.88,
      },
    ],
  };

  it('accepts valid minimal request', () => {
    const result = enhanceRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('accepts request with optional prompt', () => {
    const result = enhanceRequestSchema.safeParse({
      ...validRequest,
      prompt: 'Fix spelling errors',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty text', () => {
    const result = enhanceRequestSchema.safeParse({ ...validRequest, text: '' });
    expect(result.success).toBe(false);
  });

  it('rejects text over 100KB', () => {
    const result = enhanceRequestSchema.safeParse({
      ...validRequest,
      text: 'a'.repeat(100 * 1024 + 1),
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty boxes array', () => {
    const result = enhanceRequestSchema.safeParse({ ...validRequest, boxes: [] });
    expect(result.success).toBe(false);
  });

  it('rejects box with confidence outside 0-1', () => {
    const result = enhanceRequestSchema.safeParse({
      ...validRequest,
      boxes: [{ ...validRequest.boxes[0], confidence: 1.5 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects prompt over 500 chars', () => {
    const result = enhanceRequestSchema.safeParse({
      ...validRequest,
      prompt: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty prompt string', () => {
    const result = enhanceRequestSchema.safeParse({
      ...validRequest,
      prompt: '',
    });
    expect(result.success).toBe(true);
  });
});

import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { enhance } from '~/server/routers/enhance';

function createApp() {
  const app = new Hono();
  app.route('/enhance', enhance);
  return app;
}

const validBody = {
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
  ],
};

describe('POST /enhance', () => {
  it('returns 400 for missing text', async () => {
    const app = createApp();
    const res = await app.request('/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boxes: validBody.boxes }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 for empty boxes', async () => {
    const app = createApp();
    const res = await app.request('/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, boxes: [] }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for text over 100KB', async () => {
    const app = createApp();
    const res = await app.request('/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, text: 'a'.repeat(100 * 1024 + 1) }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 500 when LLM_API_KEY is missing', async () => {
    const app = createApp();
    const res = await app.request('/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    // Without env.LLM_API_KEY, should return 500
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe('CONFIG_ERROR');
  });
});

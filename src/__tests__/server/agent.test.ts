import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { agent } from '~/server/routers/agent';

const originalFetch = globalThis.fetch;

/**
 * Build a fake SSE stream that DeepSeek would return.
 * Each chunk is a `data: {...}\n\n` line.
 */
function makeSseStream(chunks: string[], wrapInCodeFence = false) {
  const encoder = new TextEncoder();
  let idx = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (idx < chunks.length) {
        controller.enqueue(encoder.encode(chunks[idx]!));
        idx++;
      } else {
        controller.close();
      }
    },
  });

  const fullContent = chunks
    .map((c) => {
      const trimmed = c.trim();
      if (!trimmed.startsWith('data:')) return '';
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return '';
      try {
        return JSON.parse(data)?.choices?.[0]?.delta?.content ?? '';
      } catch {
        return '';
      }
    })
    .join('');

  const responseBody = wrapInCodeFence ? `\`\`\`json\n${fullContent}\n\`\`\`` : fullContent;

  return { stream, responseBody };
}

function makeSseChunks(content: string): string[] {
  const chunks: string[] = [];
  // Split content into small pieces to simulate streaming
  for (let i = 0; i < content.length; i += 10) {
    const slice = content.slice(i, i + 10);
    const sseData = JSON.stringify({
      choices: [{ delta: { content: slice } }],
    });
    chunks.push(`data: ${sseData}\n\n`);
  }
  chunks.push('data: [DONE]\n\n');
  return chunks;
}

function makeUpstreamResponse(content: string) {
  const sseChunks = makeSseChunks(content);
  const { stream } = makeSseStream(sseChunks);
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
}

let fetchMock: ReturnType<typeof mock>;

beforeEach(() => {
  fetchMock = mock(async () =>
    makeUpstreamResponse(
      '{"seoMd":{"frontmatter":{"domain":"example.com","generatedAt":"2024-01-01","industry":"Tech","targetAudience":"Devs","seoScore":85},"overview":{"siteDescription":"Test","primaryKeywords":["test"],"competitors":[]},"technicalSeo":{"score":80},"contentSeo":{"score":85},"metaTags":{"score":90},"linkStructure":{"score":75},"recommendations":[],"optimizedContent":{"title":"Test","description":"Desc","markdown":"# Test"}},"robotsTxt":"# robots","llmTxt":"# llm"}'
    )
  );
  globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('POST /api/agent', () => {
  test('returns JSON SEO analysis when outputFormat is json', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test\n\ncontent', outputFormat: 'json' }),
    });
    const res = await agent.fetch(req, { DEEPSEEK_API_KEY: 'test-key' });
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type');
    expect(contentType).toContain('application/json');
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['seoMd']).toBeDefined();
    expect(body['robotsTxt']).toBe('# robots');
    expect(body['llmTxt']).toBe('# llm');
  });

  test('forwards to DeepSeek API with correct model and key', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test\n\ncontent' }),
    });
    await agent.fetch(req, { DEEPSEEK_API_KEY: 'sk-test-123' });
    const callArgs = fetchMock.mock.calls[0];
    const url = String(callArgs?.[0]);
    expect(url).toBe('https://api.deepseek.com/chat/completions');
    const opts = callArgs?.[1] as { headers: Record<string, string>; body: string };
    expect(opts.headers['authorization']).toBe('Bearer sk-test-123');
    const body = JSON.parse(opts.body);
    expect(body.model).toBe('deepseek-v4-flash');
    expect(body.stream).toBe(true);
  });

  test('returns 500 when DEEPSEEK_API_KEY is missing', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test\n\ncontent' }),
    });
    const res = await agent.fetch(req);
    expect(res.status).toBe(500);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['error']).toBe('CONFIG_ERROR');
  });

  test('rejects empty body with 400', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });
    const res = await agent.fetch(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['error']).toBe('INVALID_BODY');
  });

  test('rejects empty markdown with 400', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ markdown: '' }),
    });
    const res = await agent.fetch(req);
    expect(res.status).toBe(400);
  });

  test('returns 502 when upstream fetch fails', async () => {
    fetchMock = mock(async () => {
      throw new Error('network error');
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test\n\ncontent' }),
    });
    const res = await agent.fetch(req, { DEEPSEEK_API_KEY: 'test-key' });
    expect(res.status).toBe(502);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['error']).toBe('AGENT_FAILED');
  });

  test('returns 502 when upstream returns non-2xx', async () => {
    fetchMock = mock(async () => new Response('Internal error', { status: 500 }));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test\n\ncontent' }),
    });
    const res = await agent.fetch(req, { DEEPSEEK_API_KEY: 'test-key' });
    expect(res.status).toBe(502);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['error']).toBe('AGENT_FAILED');
  });

  test('uses custom prompt when provided', async () => {
    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test\n\ncontent', prompt: 'Custom SEO prompt' }),
    });
    await agent.fetch(req, { DEEPSEEK_API_KEY: 'test-key' });
    const opts = fetchMock.mock.calls[0]?.[1] as { body: string };
    const body = JSON.parse(opts.body);
    const userMessage = body.messages.find((m: { role: string }) => m.role === 'user');
    expect(userMessage.content).toContain('Custom SEO prompt');
  });

  test('falls back to text when JSON parsing fails', async () => {
    fetchMock = mock(async () => makeUpstreamResponse('This is not valid JSON at all'));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test\n\ncontent', outputFormat: 'json' }),
    });
    const res = await agent.fetch(req, { DEEPSEEK_API_KEY: 'test-key' });
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type');
    expect(contentType).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('This is not valid JSON');
  });

  test('strips code fences from LLM JSON output', async () => {
    const jsonContent =
      '{"seoMd":{"frontmatter":{"domain":"test.com","generatedAt":"2024-01-01","industry":"Tech","targetAudience":"Devs","seoScore":80},"overview":{"siteDescription":"Test","primaryKeywords":["test"],"competitors":[]},"technicalSeo":{"score":80},"contentSeo":{"score":80},"metaTags":{"score":80},"linkStructure":{"score":80},"recommendations":[],"optimizedContent":{"title":"Test","description":"Desc","markdown":"# Test"}},"robotsTxt":"# robots","llmTxt":"# llm"}';
    const sseChunks = makeSseChunks(jsonContent);
    // Simulate LLM wrapping in code fence: we send the content as-is via SSE
    // The stripCodeFences function handles the accumulated content
    fetchMock = mock(async () => {
      const encoder = new TextEncoder();
      let idx = 0;
      // Prepend code fence opening to first chunk content
      const modifiedChunks = sseChunks.map((c, i) => {
        if (i === 0 && c.startsWith('data:')) {
          const parsed = JSON.parse(c.slice(5).trim().split('\n')[0]!);
          parsed.choices[0].delta.content = `\`\`\`json\n${parsed.choices[0].delta.content ?? ''}`;
          return `data: ${JSON.stringify(parsed)}\n\n`;
        }
        return c;
      });
      // Append code fence closing to last content chunk
      const lastContentIdx = modifiedChunks.findLastIndex((c) => c.includes('"delta"'));
      if (lastContentIdx >= 0) {
        const c = modifiedChunks[lastContentIdx]!;
        const parsed = JSON.parse(c.slice(5).trim().split('\n')[0]!);
        parsed.choices[0].delta.content = `${parsed.choices[0].delta.content ?? ''}\n\`\`\``;
        modifiedChunks[lastContentIdx] = `data: ${JSON.stringify(parsed)}\n\n`;
      }

      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (idx < modifiedChunks.length) {
            controller.enqueue(encoder.encode(modifiedChunks[idx]!));
            idx++;
          } else {
            controller.close();
          }
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test\n\ncontent', outputFormat: 'json' }),
    });
    const res = await agent.fetch(req, { DEEPSEEK_API_KEY: 'test-key' });
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type');
    expect(contentType).toContain('application/json');
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['robotsTxt']).toBe('# robots');
  });

  test('streams text when outputFormat is text', async () => {
    fetchMock = mock(async () => makeUpstreamResponse('This is a text summary.'));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ markdown: '# Test\n\ncontent', outputFormat: 'text' }),
    });
    const res = await agent.fetch(req, { DEEPSEEK_API_KEY: 'test-key' });
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type');
    expect(contentType).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('This is a text summary.');
  });
});

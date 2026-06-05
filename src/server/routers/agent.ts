import { Hono } from 'hono';
import { logger } from '~/lib/logger';
import { type AgentError, agentRequestSchema } from '~/schemas/agent';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-v4-flash';

const DEFAULT_SEO_PROMPT = `请对这个网页进行全面的SEO分析，并生成SEO.md文档。

## 输出格式要求

请严格按照以下JSON格式输出：

{
  "seoMd": {
    "frontmatter": {
      "domain": "example.com",
      "generatedAt": "2024-01-01T00:00:00Z",
      "industry": "行业分类",
      "targetAudience": "目标受众",
      "seoScore": 85
    },
    "overview": {
      "siteDescription": "网站描述",
      "primaryKeywords": ["关键词1", "关键词2"],
      "competitors": ["竞争对手1", "竞争对手2"]
    },
    "technicalSeo": {
      "pageSpeed": "页面速度分析",
      "mobileFriendly": "移动端友好性",
      "structuredData": "结构化数据分析",
      "score": 80
    },
    "contentSeo": {
      "titleStructure": "标题结构分析",
      "keywordDensity": "关键词密度分析",
      "contentQuality": "内容质量评估",
      "score": 85
    },
    "metaTags": {
      "title": "标题分析",
      "description": "描述分析",
      "openGraph": "Open Graph分析",
      "twitterCards": "Twitter Cards分析",
      "score": 90
    },
    "linkStructure": {
      "internalLinks": "内部链接分析",
      "externalLinks": "外部链接分析",
      "anchorText": "锚文本分析",
      "score": 75
    },
    "recommendations": [
      {
        "priority": "high",
        "category": "技术SEO",
        "title": "建议标题",
        "description": "建议描述",
        "implementation": "具体实施步骤"
      }
    ],
    "optimizedContent": {
      "title": "优化后的标题",
      "description": "优化后的描述",
      "markdown": "优化后的完整Markdown内容"
    }
  },
  "robotsTxt": "# 基于网站内容智能生成的robots.txt",
  "llmTxt": "# 基于网站内容智能生成的llm.txt"
}

请用中文回复，确保JSON格式正确。`;

export const agent = new Hono();

agent.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json<AgentError>({ error: 'INVALID_BODY', message: 'Body is not JSON' }, 400);
  }

  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json<AgentError>(
      { error: 'INVALID_BODY', message: parsed.error.issues[0]?.message ?? 'Invalid body' },
      400
    );
  }

  const apiKey = (c.env as Record<string, string | undefined>)?.['DEEPSEEK_API_KEY'];
  if (!apiKey) {
    logger.error('DEEPSEEK_API_KEY not configured');
    return c.json<AgentError>(
      { error: 'CONFIG_ERROR', message: 'Server missing DEEPSEEK_API_KEY' },
      500
    );
  }

  const { markdown, prompt, outputFormat } = parsed.data;
  const finalPrompt = prompt || DEFAULT_SEO_PROMPT;

  let upstream: Response;
  try {
    upstream = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        stream: true,
        messages: [
          {
            role: 'system',
            content:
              outputFormat === 'json'
                ? 'You are an expert SEO analyst. Analyze web content and provide comprehensive SEO analysis with actionable recommendations. Always respond with valid JSON format as requested.'
                : 'You are an expert SEO analyst. Analyze web content and provide comprehensive SEO analysis with actionable recommendations.',
          },
          {
            role: 'user',
            content: `${finalPrompt}\n\n--- \u7f51\u9875 markdown \u5185\u5bb9\u5982\u4e0b ---\n\n${markdown}`,
          },
        ],
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`deepseek fetch failed: ${message}`);
    return c.json<AgentError>({ error: 'AGENT_FAILED', message }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    logger.warn(`deepseek upstream error: ${upstream.status} ${errText.slice(0, 500)}`);
    return c.json<AgentError>(
      { error: 'AGENT_FAILED', message: `Upstream ${upstream.status}` },
      502
    );
  }

  const upstreamBody = upstream.body;

  // For JSON format, we need to collect the entire response and parse it
  if (outputFormat === 'json') {
    let fullContent = '';
    const reader = upstreamBody.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            break;
          }
          try {
            const json = JSON.parse(data);
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              fullContent += delta;
            }
          } catch (err) {
            logger.warn(`sse parse failed: ${(err as Error).message}`);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`stream interrupted: ${message}`);
      return c.json<AgentError>({ error: 'AGENT_FAILED', message }, 502);
    }

    // Try to parse the full content as JSON
    try {
      const seoAnalysis = JSON.parse(fullContent);
      return c.json(seoAnalysis);
    } catch (parseErr) {
      logger.warn(`Failed to parse SEO analysis as JSON: ${(parseErr as Error).message}`);
      // Return as plain text if JSON parsing fails
      return new Response(fullContent, {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-cache',
        },
      });
    }
  }

  // For text format, stream the response as before
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamBody.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta.length > 0) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch (err) {
              logger.warn(`sse parse failed: ${(err as Error).message}`);
            }
          }
        }
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn(`stream interrupted: ${message}`);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-cache',
    },
  });
});

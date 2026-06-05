import { createFileRoute } from '@tanstack/react-router';
import { useDocumentHead } from '~/components/seo/head';

export const Route = createFileRoute('/docs')({
  component: DocsPage,
});

function DocsPage() {
  useDocumentHead({
    title: 'API 文档 — Parsify',
    description: 'Parsify SEO Analyzer API 使用文档',
    path: '/docs',
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">API 文档</h1>
        <p className="text-lg text-muted-foreground">
          使用 Parsify API 将任意网页转换为干净的 Markdown 并生成 SEO 分析报告
        </p>
      </div>

      {/* 解析 URL */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">POST /api/parse</h2>
        <p>将 URL 转换为干净的 Markdown 格式</p>

        <div className="space-y-2">
          <h3 className="font-medium">请求参数</h3>
          <div className="rounded-lg border p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">参数</th>
                  <th className="pb-2 text-left font-medium">类型</th>
                  <th className="pb-2 text-left font-medium">必填</th>
                  <th className="pb-2 text-left font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 font-mono">url</td>
                  <td className="py-2">string</td>
                  <td className="py-2">是</td>
                  <td className="py-2">要解析的网页 URL</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">请求示例</h3>
          <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
            {`curl -X POST https://parsify.dev/api/parse \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/article"}'`}
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">响应示例</h3>
          <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
            {`{
  "url": "https://example.com/article",
  "markdown": "# Article Title\\n\\nClean content...",
  "mdBytes": 12345,
  "mdTokens": 3200,
  "fetchedAt": "2024-01-01T00:00:00.000Z"
}`}
          </pre>
        </div>
      </section>

      {/* SEO 分析 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">POST /api/agent</h2>
        <p>使用 AI 对网页内容进行全面的 SEO 分析</p>

        <div className="space-y-2">
          <h3 className="font-medium">请求参数</h3>
          <div className="rounded-lg border p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">参数</th>
                  <th className="pb-2 text-left font-medium">类型</th>
                  <th className="pb-2 text-left font-medium">必填</th>
                  <th className="pb-2 text-left font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 font-mono">markdown</td>
                  <td className="py-2">string</td>
                  <td className="py-2">是</td>
                  <td className="py-2">要分析的 Markdown 内容（最大 1MB）</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono">prompt</td>
                  <td className="py-2">string</td>
                  <td className="py-2">否</td>
                  <td className="py-2">自定义提示词（默认：SEO 分析提示）</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono">outputFormat</td>
                  <td className="py-2">'json' | 'text'</td>
                  <td className="py-2">否</td>
                  <td className="py-2">输出格式（默认：'json'）</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">请求示例（JSON 格式）</h3>
          <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
            {`curl -X POST https://parsify.dev/api/agent \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "# Article Title\\n\\nContent...",
    "outputFormat": "json"
  }'`}
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">响应示例（JSON 格式）</h3>
          <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
            {`{
  "seoMd": {
    "frontmatter": {
      "domain": "example.com",
      "generatedAt": "2024-01-01T00:00:00Z",
      "seoScore": 85
    },
    "overview": { ... },
    "technicalSeo": { "score": 80 },
    "contentSeo": { "score": 85 },
    "metaTags": { "score": 90 },
    "linkStructure": { "score": 75 },
    "recommendations": [ ... ],
    "optimizedContent": { ... }
  },
  "robotsTxt": "# Generated robots.txt",
  "llmTxt": "# Generated llm.txt"
}`}
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">请求示例（文本格式）</h3>
          <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
            {`curl -X POST https://parsify.dev/api/agent \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "# Article Title\\n\\nContent...",
    "outputFormat": "text"
  }'`}
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">响应（文本格式）</h3>
          <p className="text-sm">返回纯文本流，内容为 AI 生成的 SEO 分析</p>
        </div>
      </section>

      {/* 限流 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">限流策略</h2>
        <div className="rounded-lg border p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-medium">端点</th>
                <th className="pb-2 text-left font-medium">限流</th>
                <th className="pb-2 text-left font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 font-mono">/api/parse</td>
                <td className="py-2">20 请求 / 15 分钟</td>
                <td className="py-2">基于 IP 地址</td>
              </tr>
              <tr>
                <td className="py-2 font-mono">/api/agent</td>
                <td className="py-2">20 请求 / 15 分钟</td>
                <td className="py-2">基于 IP 地址</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 错误码 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">错误码</h2>
        <div className="rounded-lg border p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-medium">HTTP</th>
                <th className="pb-2 text-left font-medium">错误码</th>
                <th className="pb-2 text-left font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">400</td>
                <td className="py-2 font-mono">INVALID_URL / INVALID_BODY</td>
                <td className="py-2">请求参数无效或包含私有地址</td>
              </tr>
              <tr>
                <td className="py-2">413</td>
                <td className="py-2 font-mono">TOO_LARGE</td>
                <td className="py-2">解析内容超过 5MB 限制</td>
              </tr>
              <tr>
                <td className="py-2">429</td>
                <td className="py-2 font-mono">RATE_LIMITED</td>
                <td className="py-2">请求过于频繁（20 请求 / 15 分钟）</td>
              </tr>
              <tr>
                <td className="py-2">500</td>
                <td className="py-2 font-mono">CONFIG_ERROR</td>
                <td className="py-2">服务端配置缺失（如 DEEPSEEK_API_KEY）</td>
              </tr>
              <tr>
                <td className="py-2">502</td>
                <td className="py-2 font-mono">FETCH_FAILED / AGENT_FAILED</td>
                <td className="py-2">上游服务请求失败</td>
              </tr>
              <tr>
                <td className="py-2">504</td>
                <td className="py-2 font-mono">TIMEOUT</td>
                <td className="py-2">上游服务响应超时</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

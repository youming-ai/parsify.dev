import { createFileRoute } from '@tanstack/react-router';
import { useDocumentHead } from '~/components/seo/head';

export const Route = createFileRoute('/docs')({
  component: DocsPage,
});

function DocsPage() {
  useDocumentHead({
    title: 'API 文档 — Parsify',
    description: 'Parsify API 使用文档',
    path: '/docs',
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">API 文档</h1>
        <p className="text-lg text-muted-foreground">
          使用 Parsify API 将任意网页转换为干净的 Markdown 并生成 AI 摘要
        </p>
      </div>

      {/* 认证 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">认证</h2>
        <p>所有 API 请求都需要在 Header 中携带 API Key：</p>
        <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
          {`Authorization: Bearer YOUR_API_KEY`}
        </pre>
        <p className="text-sm text-muted-foreground">
          API Key 认证是可选的，SEO 分析功能无需认证即可使用
        </p>
      </section>

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
  -H "Authorization: Bearer pk_xxxxxxxxxxxx" \\
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

      {/* 生成摘要 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">POST /api/agent</h2>
        <p>使用 AI 生成 Markdown 内容的摘要</p>

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
                  <td className="py-2">要摘要的 Markdown 内容（最大 1MB）</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono">prompt</td>
                  <td className="py-2">string</td>
                  <td className="py-2">否</td>
                  <td className="py-2">自定义提示词（默认：请用一段话总结这个网页的核心内容）</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">请求示例</h3>
          <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
            {`curl -X POST https://parsify.dev/api/agent \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer pk_xxxxxxxxxxxx" \\
  -d '{
    "markdown": "# Article Title\\n\\nContent...",
    "prompt": "请用一段话总结这个网页的核心内容"
  }'`}
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">响应</h3>
          <p className="text-sm">返回纯文本流，内容为 AI 生成的摘要</p>
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
                <td className="py-2 font-mono">INVALID_URL</td>
                <td className="py-2">URL 格式无效或包含私有地址</td>
              </tr>
              <tr>
                <td className="py-2">401</td>
                <td className="py-2 font-mono">INVALID_API_KEY</td>
                <td className="py-2">API Key 无效</td>
              </tr>
              <tr>
                <td className="py-2">413</td>
                <td className="py-2 font-mono">TOO_LARGE</td>
                <td className="py-2">解析内容超过 5MB 限制</td>
              </tr>
              <tr>
                <td className="py-2">429</td>
                <td className="py-2 font-mono">RATE_LIMITED</td>
                <td className="py-2">请求过于频繁</td>
              </tr>
              <tr>
                <td className="py-2">502</td>
                <td className="py-2 font-mono">FETCH_FAILED</td>
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

# Parsify SEO Analyzer 功能总结

## 🎯 功能概览

Parsify 是一个 AI 驱动的 SEO 分析工具。输入 URL → Jina Reader 抓取内容 → DeepSeek 生成全面的 SEO 分析报告。

**输出**: SEO.md + robots.txt + llm.txt

## 📡 API 端点

### POST /api/parse
将 URL 转换为干净的 Markdown 格式。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `url` | string | 是 | 要解析的网页 URL |

**响应**: `{ url, markdown, mdBytes, mdTokens, fetchedAt }`

### POST /api/agent
使用 AI 对网页内容进行全面的 SEO 分析。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `markdown` | string | 是 | 要分析的 Markdown 内容（≤1MB） |
| `prompt` | string | 否 | 自定义提示词（默认：SEO 分析提示） |
| `outputFormat` | `'json' \| 'text'` | 否 | 输出格式（默认：`'json'`） |

**响应（JSON 格式）**:
```json
{
  "seoMd": {
    "frontmatter": { "domain": "...", "seoScore": 85 },
    "overview": { "siteDescription": "...", "primaryKeywords": [...] },
    "technicalSeo": { "score": 80 },
    "contentSeo": { "score": 85 },
    "metaTags": { "score": 90 },
    "linkStructure": { "score": 75 },
    "recommendations": [...],
    "optimizedContent": { "title": "...", "description": "...", "markdown": "..." }
  },
  "robotsTxt": "# Generated robots.txt",
  "llmTxt": "# Generated llm.txt"
}
```

### GET /api/llm.txt
LLM 友好的 API 文档。

### GET /api/robots.txt
搜索引擎爬虫指令。

### GET /api/sitemap.xml
XML 站点地图。

## 🔒 速率限制

| 端点 | 限流 | 说明 |
|------|------|------|
| `/api/parse` | 20 请求 / 15 分钟 | 基于 IP 地址 |
| `/api/agent` | 20 请求 / 15 分钟 | 基于 IP 地址 |

## 🎨 组件

| 组件 | 文件 | 说明 |
|------|------|------|
| `SeoAnalysisOutput` | `src/components/parser/seo-analysis-output.tsx` | SEO 分析结果展示（标签页切换） |
| `SeoScore` | `src/components/parser/seo-score.tsx` | 圆形评分可视化 |
| `SeoScoreGrid` | `src/components/parser/seo-score.tsx` | 评分网格 |
| `SeoScoreBar` | `src/components/parser/seo-score.tsx` | 水平评分条 |
| `CopyButton` | `src/components/ui/copy-button.tsx` | 共享复制按钮 |

## 📊 使用示例

### 解析 URL
```bash
curl -X POST https://parsify.dev/api/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

### SEO 分析（JSON 格式）
```bash
curl -X POST https://parsify.dev/api/agent \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Article...", "outputFormat": "json"}'
```

### SEO 分析（文本格式）
```bash
curl -X POST https://parsify.dev/api/agent \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Article...", "outputFormat": "text"}'
```

## 🔧 技术细节

### 环境变量
| 变量 | 必需 | 说明 |
|------|------|------|
| `PUBLIC_ORIGIN` | 是 | 站点 origin（CORS、sitemap、llm.txt） |
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API 密钥 |
| `JINA_API_KEY` | 否 | Jina Reader API 密钥（无则使用匿名层级） |
| `LOG_LEVEL` | 否 | 日志级别（默认 `info`） |

### SSRF 防护
`parseRequestSchema` 拒绝以下地址：
- 127.x.x.x / localhost
- 10.x.x.x
- 172.16-31.x.x
- 192.168.x.x
- 169.254.x.x
- ::1

### 日志脱敏
Logger 自动脱敏以下模式：
- `apiKey` / `api_key` 值
- `authorization` 值
- `cookie` 值
- `Bearer` token

## 📁 文件结构

```
src/
├── components/parser/
│   ├── seo-analysis-output.tsx    # SEO 分析结果展示
│   ├── seo-score.tsx              # 评分可视化组件
│   ├── url-agent-form.tsx         # URL 输入表单
│   ├── markdown-output.tsx        # Markdown 输出
│   ├── agent-output.tsx           # Agent 文本输出（兼容）
│   └── optimization-stats.tsx     # 优化统计
├── schemas/
│   ├── parse.ts                   # Parse schema + SSRF 防护
│   ├── agent.ts                   # Agent schema
│   └── seo.ts                     # SEO 分析响应类型 + 辅助函数
├── server/
│   ├── hono.ts                    # Hono 应用（CORS、速率限制、路由）
│   └── routers/
│       ├── parse.ts               # Jina Reader 代理
│       └── agent.ts               # DeepSeek SEO 分析
└── lib/
    ├── logger.ts                  # 带脱敏的日志工具
    ├── seo-config.ts              # SEO 配置常量
    └── parser/
        ├── token-estimate.ts      # Token 估算
        ├── use-parse.ts           # Parse hook
        └── use-agent.ts           # Agent hook
```

## 🚀 后续优化建议

1. **SEO 分析维度扩展** — 在 SEO schema 中添加新的分析维度
2. **评分算法优化** — 调整 calculateOverallScore 函数
3. **UI 组件扩展** — 添加新的可视化组件
4. **导出格式扩展** — 支持 PDF、JSON 等格式导出
5. **批量分析** — 支持多 URL 批量分析

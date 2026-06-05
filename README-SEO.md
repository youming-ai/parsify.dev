# SEO Analyzer

一个基于AI的SEO分析工具，输入URL后生成SEO.md文档、robots.txt和llm.txt。

## 功能特性

- **SEO.md生成**: 生成全面的SEO分析文档，包含技术SEO、内容SEO、Meta标签、链接结构等分析
- **robots.txt生成**: 基于网站内容智能生成robots.txt文件
- **llm.txt生成**: 为AI爬虫优化的llm.txt文件
- **SEO评分**: 提供整体和分维度的SEO评分
- **优化建议**: 给出具体可执行的SEO优化建议

## 快速开始

1. 输入任意URL
2. 等待AI分析完成
3. 查看SEO分析结果
4. 下载或复制生成的文件

## 输出文件

### SEO.md
SEO分析文档，包含：
- 网站概述和目标受众分析
- 技术SEO分析（页面速度、移动端友好性、结构化数据）
- 内容SEO分析（标题结构、关键词密度、内容质量）
- Meta标签分析（标题、描述、Open Graph、Twitter Cards）
- 链接结构分析（内部链接、外部链接、锚文本）
- SEO优化建议（高/中/低优先级）
- 优化后的Markdown内容

### robots.txt
智能生成的爬虫规则文件，包含：
- 允许和禁止的爬虫路径
- 针对不同爬虫的规则
- Sitemap位置

### llm.txt
为AI爬虫优化的访问指南，包含：
- 网站关键信息
- AI爬虫访问建议
- 内容结构说明

## API使用

### 分析URL
```bash
curl -X POST http://localhost:5173/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "网页内容...",
    "outputFormat": "json"
  }'
```

### 响应格式
```json
{
  "seoMd": {
    "frontmatter": {
      "domain": "example.com",
      "generatedAt": "2024-01-01T00:00:00Z",
      "industry": "Technology",
      "targetAudience": "Developers",
      "seoScore": 85
    },
    "overview": { ... },
    "technicalSeo": { ... },
    "contentSeo": { ... },
    "metaTags": { ... },
    "linkStructure": { ... },
    "recommendations": [ ... ],
    "optimizedContent": { ... }
  },
  "robotsTxt": "User-agent: *\nAllow: /",
  "llmTxt": "# LLM.txt\n\n网站信息..."
}
```

## 技术栈

- **前端**: TanStack Router + React 19 + Tailwind CSS v4
- **后端**: Hono API + Jina Reader + DeepSeek AI
- **AI模型**: DeepSeek v4 Flash
- **验证**: Zod 4

## 开发

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 运行测试
bun test

# 代码检查
bun run lint

# 类型检查
bun run typecheck
```

## 环境变量

```env
# 必需
DEEPSEEK_API_KEY=your_deepseek_api_key

# 可选
JINA_API_KEY=your_jina_api_key
PUBLIC_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

## 许可证

MIT License
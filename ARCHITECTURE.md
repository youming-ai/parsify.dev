# SEO Analyzer 项目架构

## 项目概述
基于AI的SEO分析工具，输入URL后生成SEO.md文档、robots.txt和llm.txt。

## 技术栈
- **前端**: TanStack Router (SPA) + React 19 + Tailwind CSS v4
- **后端**: Hono API + Jina Reader + DeepSeek AI
- **AI模型**: DeepSeek v4 Flash
- **验证**: Zod 4
- **构建**: Vite 7
- **包管理**: Bun

## 目录结构

```
parsify-dev/
├── src/
│   ├── __tests__/                    # 测试文件
│   │   ├── lib/
│   │   │   └── parser/
│   │   │       └── token-estimate.test.ts
│   │   ├── schemas/
│   │   │   ├── agent.test.ts         # Agent schema测试
│   │   │   ├── parse.test.ts         # Parse schema测试
│   │   │   └── seo.test.ts           # SEO schema测试
│   │   └── server/
│   │       └── parse.test.ts         # Parse路由测试
│   │
│   ├── components/                   # React组件
│   │   ├── layout/
│   │   │   ├── app-shell.tsx         # 应用外壳
│   │   │   ├── footer.tsx            # 页脚
│   │   │   ├── header.tsx            # 页头
│   │   │   └── theme-toggle.tsx      # 主题切换
│   │   ├── link.tsx                  # 链接组件
│   │   ├── parser/
│   │   │   ├── agent-output.tsx      # AI输出组件
│   │   │   ├── markdown-output.tsx   # Markdown输出
│   │   │   ├── optimization-stats.tsx # 优化统计
│   │   │   ├── seo-analysis-output.tsx # SEO分析输出
│   │   │   ├── seo-score.tsx         # SEO评分组件
│   │   │   └── url-agent-form.tsx    # URL输入表单
│   │   ├── seo/
│   │   │   └── head.tsx              # SEO头部
│   │   ├── theme-provider.tsx        # 主题提供者
│   │   └── ui/
│   │       ├── button.tsx            # 按钮组件
│   │       ├── copy-button.tsx       # 复制按钮（共享组件）
│   │       └── input.tsx             # 输入组件
│   │
│   ├── lib/                          # 工具库
│   │   ├── logger.ts                 # 日志工具（带脱敏）
│   │   ├── parser/
│   │   │   ├── token-estimate.ts     # Token估算
│   │   │   ├── use-agent.ts          # Agent hook
│   │   │   └── use-parse.ts          # Parse hook
│   │   ├── seo-config.ts             # SEO配置常量
│   │   └── utils.ts                  # 工具函数
│   │
│   ├── routes/                       # 路由文件
│   │   ├── __root.tsx                # 根路由
│   │   ├── 404.tsx                   # 404页面
│   │   ├── api/
│   │   │   └── $.ts                  # API catch-all路由
│   │   ├── docs.tsx                  # API文档页面
│   │   └── index.tsx                 # 首页
│   │
│   ├── schemas/                      # Zod schemas
│   │   ├── agent.ts                  # Agent schema
│   │   ├── parse.ts                  # Parse schema
│   │   └── seo.ts                    # SEO schema
│   │
│   ├── server/                       # 服务器端
│   │   ├── hono.ts                   # Hono应用配置（含速率限制）
│   │   └── routers/
│   │       ├── agent.ts              # Agent路由（DeepSeek SEO分析）
│   │       └── parse.ts              # Parse路由（Jina Reader代理）
│   │
│   ├── client.tsx                    # 客户端入口
│   ├── router.tsx                    # 路由配置
│   ├── routeTree.gen.ts              # 路由树（自动生成）
│   └── styles/
│       └── app.css                   # Tailwind v4 主题定义
│
├── public/                           # 静态资源
├── .github/                          # GitHub配置
├── .husky/                           # Git hooks
├── AGENTS.md                         # 项目文档
├── ARCHITECTURE.md                   # 架构文档
├── package.json                      # 项目配置
├── tsconfig.json                     # TypeScript配置
├── app.config.ts                     # Vite/TanStack配置
├── biome.json                        # Biome配置
└── bun.lock                          # Bun锁文件
```

## 核心模块说明

### 1. SEO分析流程
```
用户输入URL
    ↓
Jina Reader抓取网页内容（/api/parse）
    ↓
DeepSeek进行SEO分析（/api/agent）
    ↓
生成SEO.md + robots.txt + llm.txt
    ↓
结构化展示分析结果
```

### 2. 组件

#### SeoAnalysisOutput (`src/components/parser/seo-analysis-output.tsx`)
- 主要SEO分析展示组件
- 支持标签页切换（SEO.md、robots.txt、llm.txt）
- 复制和下载功能

#### SeoScore (`src/components/parser/seo-score.tsx`)
- `SeoScore`: 圆形评分可视化
- `SeoScoreGrid`: 评分网格展示
- `SeoScoreBar`: 水平评分条

#### CopyButton (`src/components/ui/copy-button.tsx`)
- 共享的复制到剪贴板按钮组件

### 3. Schemas

#### SEO Schema (`src/schemas/seo.ts`)
- `SeoAnalysisResponse`: SEO分析响应结构
- `SeoMdDocument`: SEO.md文档结构
- `SeoFrontmatter`: YAML frontmatter结构
- `SeoRecommendation`: SEO建议结构

### 4. API

#### POST /api/parse
```typescript
// 请求
{ url: string }

// 响应
{ url: string, markdown: string, mdBytes: number, mdTokens: number, fetchedAt: string }
```

#### POST /api/agent
```typescript
// 请求
{
  markdown: string;           // 必需：网页内容（≤1MB）
  prompt?: string;            // 可选：自定义prompt（默认：SEO分析提示）
  outputFormat?: 'json' | 'text'; // 默认：'json'
}

// 响应（JSON格式）
{
  seoMd: SeoMdDocument;       // SEO分析文档
  robotsTxt: string;          // 生成的robots.txt
  llmTxt: string;             // 生成的llm.txt
}
```

## 数据流

```
URL输入 → useParse.run(url) → POST /api/parse → Jina Reader
    → 返回 { url, markdown, mdBytes, mdTokens, fetchedAt }
    → useAgent.run({ markdown, prompt, outputFormat: 'json' })
    → POST /api/agent → DeepSeek SEO分析
    → 返回 SeoAnalysisResponse
    → SeoAnalysisOutput组件渲染
    → 用户查看/下载SEO.md、robots.txt、llm.txt
```

## 环境变量

```env
# 必需
PUBLIC_ORIGIN=https://parsify.dev
DEEPSEEK_API_KEY=your_deepseek_api_key

# 可选
JINA_API_KEY=your_jina_api_key
LOG_LEVEL=info
```

## 测试覆盖

- `src/__tests__/schemas/seo.test.ts` - SEO schema测试
- `src/__tests__/schemas/agent.test.ts` - Agent schema测试
- `src/__tests__/schemas/parse.test.ts` - Parse schema测试
- `src/__tests__/server/parse.test.ts` - Parse路由测试
- `src/__tests__/lib/parser/token-estimate.test.ts` - Token估算测试

## 开发命令

```bash
bun run dev                # 启动开发服务器
bun run build              # 构建生产版本
bun run start              # 启动生产服务器
bun run typecheck          # TypeScript类型检查
bun test                   # 运行测试
bun run lint               # 代码检查
bun run lint:fix           # 自动修复lint问题
bun run format             # 代码格式化
```

## 部署

### Docker部署
```bash
docker build -t parsify .
docker run -p 5173:5173 \
  -e PUBLIC_ORIGIN=https://parsify.dev \
  -e DEEPSEEK_API_KEY=your_key \
  -e JINA_API_KEY=your_key \
  parsify
```

### Dokploy部署
1. 推送代码到main分支
2. Dokploy自动构建和部署
3. 配置环境变量

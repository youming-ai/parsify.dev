# SEO Analyzer 项目架构

> 本文档描述 `parsify-dev` 的实际架构。如与 `CLAUDE.md` 不一致，以本文档与源码为准（`CLAUDE.md` 部分内容已过时）。

## 项目概述

基于 AI 的 SEO 分析工具：输入一个 URL → 由 `r.jina.ai`（Jina Reader）抓取并转换为干净的 Markdown → 由 DeepSeek `deepseek-v4-flash` 模型分析，生成结构化的 **SEO.md**、**robots.txt** 与 **llm.txt**。

整体是一个 **客户端渲染（SPA）** 的 TanStack Router 应用，配合一个挂载在 `/api/*` 下的 **Hono** API 层。生产环境部署在 **Cloudflare Workers/Pages**。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | TanStack Router（文件式路由）+ React 19 + Tailwind CSS v4 |
| 渲染模式 | 客户端 SPA（非 SSR） |
| API | Hono v4（挂载于 `/api`） |
| AI 模型 | DeepSeek `deepseek-v4-flash`（OpenAI 兼容 SSE） |
| 内容抓取 | Jina Reader（`https://r.jina.ai`） |
| 验证 | Zod 4 |
| 构建工具 | Vite 7 |
| 包管理 / 运行时 | Bun |
| 部署 | Cloudflare Workers/Pages（`wrangler` + `worker.ts`） |
| 代码风格 / Lint | Biome |
| Git hooks | lefthook |

## 目录结构

```
parsify-dev/
├── src/
│   ├── __tests__/                    # 测试（Bun test，node 环境，无 DOM）
│   │   ├── lib/parser/
│   │   │   └── token-estimate.test.ts
│   │   ├── schemas/
│   │   │   ├── agent.test.ts         # Agent schema 测试
│   │   │   ├── parse.test.ts         # Parse schema（含 SSRF 守卫）测试
│   │   │   └── seo.test.ts           # SEO schema 测试
│   │   └── server/
│   │       └── parse.test.ts         # Parse 路由处理器测试（mock fetch）
│   │
│   ├── components/                   # React 组件
│   │   ├── layout/
│   │   │   ├── app-shell.tsx         # 应用外壳（header + 内容 + footer）
│   │   │   ├── footer.tsx            # 页脚
│   │   │   ├── header.tsx            # 页头
│   │   │   └── theme-toggle.tsx      # 主题切换
│   │   ├── parser/
│   │   │   ├── agent-output.tsx      # 纯文本 AI 输出（text 模式回退）
│   │   │   ├── markdown-output.tsx   # 原始 Markdown 展示
│   │   │   ├── optimization-stats.tsx # 字节数 / token 估算统计
│   │   │   ├── seo-analysis-output.tsx # SEO 分析主展示（SEO.md / robots.txt / llm.txt 标签页）
│   │   │   ├── seo-score.tsx         # 评分可视化（SeoScore / SeoScoreGrid / SeoScoreBar）
│   │   │   └── url-agent-form.tsx    # URL 输入表单
│   │   ├── seo/
│   │   │   └── head.tsx              # useDocumentHead（动态 <head> / SEO meta）
│   │   ├── ui/                       # shadcn/ui 风格基础组件 —— 优先复用
│   │   │   ├── button.tsx
│   │   │   └── input.tsx
│   │   ├── link.tsx                  # 链接组件
│   │   └── theme-provider.tsx        # 主题上下文
│   │
│   ├── lib/                          # 工具库
│   │   ├── parser/
│   │   │   ├── token-estimate.ts     # Token 估算
│   │   │   ├── use-agent.ts          # Agent hook（调用 /api/agent，json/text 双模式）
│   │   │   └── use-parse.ts          # Parse hook（调用 /api/parse）
│   │   ├── icon-map.ts               # 图标映射
│   │   ├── logger.ts                 # 自定义 console 日志封装（非 pino）
│   │   ├── seo-config.ts             # SEO 默认标题/描述等配置
│   │   └── utils.ts                  # cn() 等工具函数
│   │
│   ├── routes/                       # TanStack Router 文件式路由
│   │   ├── __root.tsx                # 根布局（AppShell + Outlet）
│   │   ├── 404.tsx                   # 404 页面
│   │   ├── api/
│   │   │   └── $.ts                  # catch-all：把所有 HTTP 方法转发给 Hono app.fetch()
│   │   ├── docs.tsx                  # API 文档页面
│   │   └── index.tsx                 # 首页（Hero + URL 表单 + 结果 + 特性卡片）
│   │
│   ├── schemas/                      # Zod schemas + 类型
│   │   ├── agent.ts                  # agentRequestSchema（markdown + prompt + outputFormat）
│   │   ├── parse.ts                  # parseRequestSchema（含 SSRF 守卫）
│   │   └── seo.ts                    # SEO 分析响应类型 + 评分/优先级辅助函数
│   │
│   ├── server/                       # 服务端（Hono）
│   │   ├── hono.ts                   # Hono app：CORS、secureHeaders、日志、静态 SEO 端点、路由挂载
│   │   └── routers/
│   │       ├── agent.ts              # POST /api/agent（DeepSeek SSE 代理）
│   │       └── parse.ts              # POST /api/parse（Jina Reader 代理）
│   │
│   ├── client.tsx                    # 客户端入口（hydration）
│   ├── router.tsx                    # TanStack Router 配置 + 路由树
│   ├── routeTree.gen.ts             # 自动生成（构建时再生成，勿手改）
│   ├── styles/app.css                # Tailwind v4 入口
│   ├── vite-env.d.ts                 # Vite 类型定义
│   └── worker.ts                     # Cloudflare Worker 入口（生产环境）
│
├── public/                           # 静态资源
├── docs/                             # 额外文档
├── index.html                        # SPA HTML 入口
├── Dockerfile                        # ⚠️ 旧的 Docker 部署（已失效，见“部署”一节）
├── docker-compose.yml                # ⚠️ 配合上述 Dockerfile
├── wrangler.toml                     # Cloudflare Workers 配置（生产部署）
├── vite.config.ts                    # Vite 配置（TanStackRouter + react + tailwind）
├── biome.json                        # Biome 配置
├── tsconfig.json                     # TypeScript 配置（strict 系列，见下）
├── lefthook.yml                      # Git pre-commit hook
├── AGENTS.md                         # 安全规则 / 代码风格 / 环境变量（权威）
├── ARCHITECTURE.md                   # 本文档
├── CLAUDE.md                         # AI 协作指南（部分内容已过时）
├── README.md / README-SEO.md        # 项目说明
├── package.json
└── bun.lock
```

> 注意：旧版本文档中提及的 `auth/`、`dashboard.tsx`、`login.tsx`、`schemas/auth.ts`、`server/routers/auth.ts`、`lib/auth/` **均不存在**——本项目当前没有任何认证模块。

## 渲染与请求架构

本项目用 **同一个 Hono `app`** 通过两个入口对外提供 API，分别服务于开发与生产：

1. **开发环境（`bun run dev`，Vite）**
   `src/routes/api/$.ts` 是 TanStack Router 的 catch-all 服务端路由，把 `GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS` 全部转发给 `app.fetch(request)`。

2. **生产环境（Cloudflare Workers）**
   `src/worker.ts` 是 Worker 入口（见 `wrangler.toml` 的 `main = "src/worker.ts"`）。它把 `/api/*` 请求交给 `app.fetch(request, env)`，其余路径由 Cloudflare 从 `dist/`（`[assets] directory = "dist"`）提供静态资源。

```
浏览器 (SPA)
   │  fetch('/api/...')
   ▼
开发：routes/api/$.ts  ──┐
                          ├──► Hono app（src/server/hono.ts）──► parse / agent / 静态 SEO 端点
生产：worker.ts (/api) ───┘
```

> 关键差异：路由处理器通过 **`c.env`**（Cloudflare 绑定）读取密钥与配置，**不是** `process.env`。例如 `c.env.DEEPSEEK_API_KEY`、`c.env.JINA_API_KEY`、`c.env.PUBLIC_ORIGIN`。仅 `src/lib/logger.ts` 在初始化时读取 `process.env['LOG_LEVEL']`（带 try/catch 回退）。

## API 端点

所有端点挂载在 `/api` 前缀下（`hono.ts` 中 `.basePath('/api')`）。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查，返回 `{ ok: true }` |
| GET | `/api/llm.txt` | 动态生成站点 llm.txt（面向 AI 爬虫） |
| GET | `/api/robots.txt` | 动态生成 robots.txt |
| GET | `/api/sitemap.xml` | 动态生成 sitemap |
| POST | `/api/parse` | Jina Reader 代理：URL → 干净 Markdown |
| POST | `/api/agent` | DeepSeek 代理：Markdown → SEO 分析 |

中间件（`hono.ts`）：`secureHeaders()` → `cors()`（`origin` 取自 `c.env.PUBLIC_ORIGIN`，默认 `http://localhost:3000`，`credentials: false`）→ 自定义耗时日志中间件 → `onError` 统一兜底为 500。

> ⚠️ 当前 **没有** 速率限制中间件。`CLAUDE.md` 中描述的 `hono-rate-limiter`（20 req / 15 min）已不在代码中；`/api/llm.txt` 文案里写的 rate limit 仅为静态展示文本。

### POST /api/parse

请求由 `parseRequestSchema`（`src/schemas/parse.ts`）校验，包含 **SSRF 守卫**（拒绝 loopback / 私有网段 / link-local / IPv6 `::1` 等）。

```typescript
// 请求
{ url: string }   // 必须 http/https，且指向公网主机

// 响应
{
  url: string;
  markdown: string;
  mdBytes: number;     // UTF-8 字节数
  mdTokens: number;    // token 估算
  fetchedAt: string;   // ISO 时间戳
}
```

限制：上游超时 30s（返回 504 `TIMEOUT`）；Markdown 超过 5 MB 返回 413 `TOO_LARGE`。若配置了 `JINA_API_KEY` 则附带 `Authorization: Bearer`，否则走匿名层。

### POST /api/agent

请求由 `agentRequestSchema`（`src/schemas/agent.ts`）校验。

```typescript
// 请求
{
  markdown: string;                  // 必需，最大 1 MB
  prompt?: string;                   // 可选，默认 "请对这个网页进行全面的SEO分析…"
  outputFormat?: 'json' | 'text';    // 默认 'json'
}
```

行为：直连 `https://api.deepseek.com/chat/completions`（OpenAI 兼容、`stream: true`）。
- **`json` 模式（默认）**：服务端读完整个 SSE 流并拼接，尝试 `JSON.parse`：
  - 成功 → 返回 `application/json`（`SeoAnalysisResponse` 结构）；
  - 失败 → 退回 `text/plain` 返回原始内容。
- **`text` 模式**：把 SSE 帧解析后以纯文本逐块流式返回。

```typescript
// json 模式响应（SeoAnalysisResponse）
{
  seoMd: SeoMdDocument;   // frontmatter / overview / technicalSeo / contentSeo / metaTags / linkStructure / recommendations / optimizedContent
  robotsTxt: string;
  llmTxt: string;
}
```

错误码（`AgentError`）：`INVALID_BODY`(400) / `CONFIG_ERROR`(500，缺少 `DEEPSEEK_API_KEY`) / `AGENT_FAILED`(502)。

## 核心数据流

```
URL 输入（URLAgentForm）
    │
    ▼  useParse().run(url)
POST /api/parse  ──►  Jina Reader
    │
    ▼  { url, markdown, mdBytes, mdTokens, fetchedAt }
    │  （parse 成功后由 index.tsx 的 effect 自动触发）
    ▼  useAgent().run({ markdown, prompt, outputFormat: 'json' })
POST /api/agent  ──►  DeepSeek（deepseek-v4-flash）
    │
    ▼  SeoAnalysisResponse（json）或纯文本（回退）
    │
    ▼  渲染：
       · OptimizationStats（字节/token 统计）
       · SeoAnalysisOutput（有 seoData 时）/ AgentOutput（纯文本回退）
       · MarkdownOutput（原始 Markdown）
```

首页（`index.tsx`）支持通过查询参数 `?q=<url>` 自动发起分析（`useSearch` + 一次性 `autoFired` 守卫）。

## Schemas（`src/schemas/`）

- **`parse.ts`** — `parseRequestSchema`（含 SSRF 守卫）、`ParseResponse`、`ParseError`。修改时务必同步更新 `src/__tests__/schemas/parse.test.ts`。
- **`agent.ts`** — `agentRequestSchema`（`markdown` / `prompt` / `outputFormat`）、`AgentRequest`、`AgentError`。
- **`seo.ts`** — SEO 分析的 TypeScript 类型（`SeoMdDocument`、`SeoFrontmatter`、`SeoRecommendation`、`SeoAnalysisResponse` 等）与辅助函数：`isValidSeoResponse`、`calculateOverallScore`、`getScoreColorClass`、`getPriorityLabel` 等。

## 关键组件（`src/components/parser/`）

- **`SeoAnalysisOutput`** — SEO 分析主展示，含 SEO.md / robots.txt / llm.txt 标签页切换、复制与下载。
- **`SeoScore`** — 评分可视化：`SeoScore`（圆形）、`SeoScoreGrid`（网格）、`SeoScoreBar`（水平条）。
- **`OptimizationStats`** — 展示抓取字节数与 token 估算。
- **`AgentOutput`** — `text` 模式或 JSON 解析失败时的纯文本回退展示。
- **`MarkdownOutput`** — 原始 Markdown 展示。
- **`URLAgentForm`** — URL 输入表单。

## 环境变量

生产环境通过 **Cloudflare Worker 绑定** 注入（运行时由 `c.env` 读取）；本地开发可用 `.env`（参考 `.env.example`）。

```env
# 必需
DEEPSEEK_API_KEY=your_deepseek_api_key   # 缺失时 /api/agent 返回 500 CONFIG_ERROR

# 可选
JINA_API_KEY=your_jina_api_key           # 缺失时 Jina Reader 走匿名层
PUBLIC_ORIGIN=http://localhost:3000      # CORS origin 与静态 SEO 端点中的站点地址
LOG_LEVEL=info                           # 由 logger 在初始化时读取
```

> 密钥仅存在于服务端：永不发往浏览器、不记录日志、不落盘/落库。SSRF 守卫位于 `parseRequestSchema`。详见 `AGENTS.md`（安全规则的权威来源）。

## 日志

`src/lib/logger.ts` 导出一个 **自定义的 console 封装** 单例 `logger`（支持 `trace/debug/info/warn/error` 级别过滤）——**并非** pino，也没有 `c.var.logger` 注入。Hono 端代码直接 `import { logger }` 使用。

## 测试

Bun test runner，`node` 环境（无 DOM）。仅覆盖纯逻辑与路由处理器；UI 组件不做单元测试。

```bash
bun test                                      # 全部测试
bun test src/__tests__/schemas/seo.test.ts    # 单个文件
```

测试文件：
- `src/__tests__/schemas/parse.test.ts` — Parse schema / SSRF 守卫
- `src/__tests__/schemas/agent.test.ts` — Agent schema
- `src/__tests__/schemas/seo.test.ts` — SEO schema / 辅助函数
- `src/__tests__/server/parse.test.ts` — Parse 路由（mock `globalThis.fetch`）
- `src/__tests__/lib/parser/token-estimate.test.ts` — Token 估算

## TypeScript 严格性（易踩坑）

`tsconfig.json` 同时开启 `strict`、`noUncheckedIndexedAccess`、`noPropertyAccessFromIndexSignature`。最后一项会导致 `process.env.NODE_ENV` 报 ts(4111)——必须写成 `process.env['NODE_ENV']`，其它索引签名属性同理。路径别名 `~/*` 解析到 `src/*`。

## 开发命令

| 用途 | 命令 |
|---|---|
| 开发服务器（Vite） | `bun run dev` |
| 构建 | `bun run build`（= `vite build` → `dist/`） |
| 本地预览构建产物 | `bun run preview` |
| 部署到 Cloudflare | `bun run deploy`（= `npx cf pages deploy dist/ --project-name parsify`） |
| 类型检查 | `bun run typecheck`（`tsc --noEmit`） |
| Lint / 自动修复 | `bun run lint` / `bun run lint:fix`（Biome on `./src`） |
| 格式化 | `bun run format` |
| 测试 | `bun test` |
| 清理 | `bun run clean` |

> 提示：`package.json` 中 **没有** `start` 脚本；`bun run build` 会重新生成 `src/routeTree.gen.ts`。pre-commit（lefthook）对暂存的 `.{ts,tsx,js,jsx,json,jsonc,css,md}` 运行 Biome `check --write`。

## 部署

### Cloudflare Workers/Pages（当前方式）

1. `bun run build` 产出 `dist/`。
2. `bun run deploy` 通过 `cf pages deploy` 上传；Worker 入口为 `src/worker.ts`（见 `wrangler.toml`）。
3. 在 Cloudflare 项目中配置环境变量绑定：`DEEPSEEK_API_KEY`（必需）、`JINA_API_KEY`、`PUBLIC_ORIGIN`、`LOG_LEVEL`。
4. 静态资源由 `[assets] directory = "dist"` 提供，`/api/*` 由 Worker 内的 Hono app 处理。

### ⚠️ Docker（已失效）

仓库中仍保留 `Dockerfile` 与 `docker-compose.yml`，但其 `CMD ["bun", "run", "start"]` 依赖一个 **已被移除的 `start` 脚本**，因此当前 **无法直接运行**。如需 Docker 部署，需要先补回 `start` 脚本与对应的运行时服务器（这是历史遗留产物）。

## 扩展点

1. **SEO 分析维度扩展** — 在 `src/schemas/seo.ts` 中新增分析维度，并同步 `agent.ts` 的输出格式 prompt。
2. **评分算法优化** — 调整 `calculateOverallScore` 等辅助函数。
3. **UI 组件扩展** — 复用 `src/components/ui/` 基础组件，新增可视化组件。
4. **导出格式扩展** — 在 `SeoAnalysisOutput` 中支持更多导出格式（PDF、JSON 等）。
5. **速率限制 / 鉴权** — 若需对外开放 API，可重新引入速率限制中间件与鉴权层（当前均无）。
6. **批量分析** — 支持多 URL 批量分析。

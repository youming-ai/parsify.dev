# parsify.dev AI Agent 开发者工具 开发计划

> 版本:v1.0  
> 日期:2026-04-28  
> 范围:方向一(把现有工具站模型平移到 AI agent 开发者市场)

---

## 1. 总体策略

### 1.1 定位

把 parsify.dev 从「通用 Web 开发者工具集合」延伸为「AI agent / LLM 应用开发者工具集合」,沿用现有站点最核心的三个特征:

1. **一个工具一个独立页面**:每页吃一个高价值长尾关键词,SEO 友好。
2. **浏览器端处理**:不离开设备的隐私叙事,在 AI 时代价值反而更高(prompt / 数据敏感)。
3. **零账号、零安装**:打开即用,不试图把用户留在站内做产品化漏斗。

### 1.2 核心原则

- **能纯前端就纯前端**:tokenizer、schema 校验、cron 解析、文本切分这类逻辑都可以在浏览器完成。
- **需要调用 LLM API 时一律 BYOK**:用户自带 API key,不经过我方服务器,只走浏览器直连。这一条同时解决「成本」「隐私」「合规」三个问题。
- **维护一份「事实表」**:模型规格、价格、限流、能力支持矩阵集中在一个 JSON,所有工具读取同一份数据。这是后期最值钱的护城河。
- **每个工具都有侧栏或底部「相关工具」推荐**:做好内部导流。

### 1.3 商业模式假设

短期 SEO 引流 → 中期 BYOK 高级功能 → 长期可考虑 Pro 订阅(模型对比表实时更新、无限制历史记录、团队共享 prompt 库等)。本文档不展开商业化设计,只在每个工具上注明「免费/Pro」适配性。

---

## 2. 技术栈与基础设施

### 2.1 推荐技术栈

沿用现有站(Next.js + 静态导出 + 客户端 Hydration)即可,新增依赖:

| 用途 | 推荐库 |
|---|---|
| GPT 系 tokenizer | `tiktoken` (WASM 版) |
| Claude tokenizer | `@anthropic-ai/tokenizer` |
| Gemini tokenizer | SentencePiece + Gemma 词表 |
| Llama / DeepSeek / Qwen | `@huggingface/transformers` 的 tokenizer 模块 |
| JSON Schema 校验 | `ajv` + `ajv-formats` |
| TypeScript → JSON Schema | `ts-json-schema-generator`(浏览器端用 `typescript` + 自写 walker) |
| Diff 算法 | `diff-match-patch` 或 `jsdiff`(已在用) |
| 代码高亮 | Shiki(已在用) |
| 图表 | Recharts 或 ECharts |

### 2.2 共享数据层

新建 `/data/llm-registry.json`,作为所有工具的事实来源:

```jsonc
{
  "models": [
    {
      "id": "claude-opus-4-7",
      "provider": "anthropic",
      "displayName": "Claude Opus 4.7",
      "contextWindow": 200000,
      "maxOutput": 32000,
      "pricing": { "input": 15, "output": 75, "cacheWrite": 18.75, "cacheRead": 1.5 },
      "capabilities": ["tool_use", "vision", "prompt_cache", "batch", "thinking"],
      "tokenizer": "claude",
      "knowledgeCutoff": "2026-01"
    }
  ]
}
```

**这份文件必须有人定期维护**(每月一次 + 大版本发布跟进),它是工具站长期价值的核心。

### 2.3 共享 UI 组件

提取为 `@parsify/llm-ui` 内部包:

- `<ModelSelector />`:多家模型筛选器(provider / 能力 / 价格区间)
- `<TokenCounter />`:实时 token 统计带宽
- `<APIKeyInput />`:BYOK 输入框,localStorage 加密存储,带「立即清除」按钮
- `<CodeExportTabs />`:把当前工具状态导出为 curl / Python / TS / fetch 代码

---

## 3. 工具详细设计(共 18 个)

按类目展开。每个工具包含:概述、目标用户、核心功能、技术方案、SEO 关键词、差异化、工作量(人日,1 人全职)、Phase 归属。

### 3.1 Token 与成本类(5 个)

#### T1. 多模型 Token 计数器 ⭐ Phase 1

**概述**:粘贴一段文本,并排显示主流模型的 token 数与差异。

**目标用户**:任何在调 LLM API 的人,尤其是要在多家模型间切换的开发者。

**核心功能**
- 支持模型:GPT-4o / GPT-4.1 / o-series、Claude(Sonnet/Opus 全系)、Gemini 2.5、Llama 3/4、DeepSeek、Qwen、Mistral
- 实时计数,带颜色编码的 diff(哪些 token 在 GPT 是 1 个但在 Claude 是 3 个)
- 高亮 token 边界(hover 显示具体 byte / 字符)
- 支持「按 role 计数」(system / user / assistant 分开统计)
- 支持中文、日文、emoji、代码、特殊字符的对比展示
- 导出 JSON 报告

**技术方案**:纯前端。所有 tokenizer 走 WASM。Claude tokenizer 包仅 ~200KB,GPT 的 cl100k/o200k 词表加载用 lazy import。

**SEO 关键词**:`token counter`, `claude token counter`, `llm tokenizer compare`, `gpt token counter online`, `count tokens online free`

**差异化**:tiktokenizer.vercel.app 只支持 OpenAI,Anthropic 官方只支持 Claude,**没人做横向对比**。这就是空白。

**工作量**:6 人日(主要时间在收齐 tokenizer 和 UI 细节)。

---

#### T2. LLM 月度成本估算器 ⭐ Phase 1

**概述**:输入预期用量,输出多家模型月成本对比。

**核心功能**
- 输入:月调用量、平均输入 token、平均输出 token、是否启用 prompt cache(及 cache 命中率假设)、是否走 batch API
- 输出:按模型排序的月成本表 + 柱状图
- 支持「混合模型策略」:配置 70% 流量走 Haiku、30% 走 Opus 这种组合
- URL 可分享(query string 编码所有参数)
- 一键导出 PDF / 截图,方便给老板/CFO 看

**技术方案**:纯前端,读取 `llm-registry.json`。

**SEO 关键词**:`llm cost calculator`, `claude api pricing calculator`, `gpt-4 cost calculator`, `openai vs anthropic price`

**差异化**:大部分对比页面是博客文章+静态表格,没法交互。可分享 URL 意味着这个页面能在 Twitter / 公司 Slack 自传播。

**工作量**:5 人日。

---

#### T3. Context Window 占用可视化 Phase 2

**概述**:粘贴对话历史 / RAG context,可视化 token 占用,提示如何裁切。

**核心功能**
- 输入:完整 messages 数组(JSON)或 markdown 格式对话
- 可视化:横向堆叠条,每段消息按 token 数占比显示,hover 看详情
- 显示:距离选定模型 context 上限的剩余空间、超限风险预警
- 推荐:自动建议「裁掉哪几条最早消息能省 X token」
- 支持识别并标注 system prompt / tool definitions / few-shot / 用户消息 / 历史回复

**技术方案**:纯前端,复用 T1 的 tokenizer。

**SEO 关键词**:`context window calculator`, `llm context length visualizer`, `claude context window`

**差异化**:agent 长会话调试刚需,目前没看到好的工具。

**工作量**:6 人日。

---

#### T4. Prompt Caching 收益计算器 Phase 2

**概述**:判断「这个 prompt 启用 cache 划不划算」。

**核心功能**
- 输入:静态部分 token 数 + 动态部分 token 数 + 月调用次数 + cache 命中率假设(默认 80%)
- 输出:启用前 vs 启用后的月成本对比、几次调用回本(cache write 比正常 input 贵 25%)
- 支持 Anthropic prompt caching 和 OpenAI 的 prompt caching 两套定价模型
- 内置「该不该开 cache」的决策树:静态 prompt > 1024 token 且复用 > 5 次推荐开启

**技术方案**:纯前端。

**SEO 关键词**:`prompt cache calculator`, `anthropic prompt caching cost`, `openai cached input pricing`

**差异化**:这个机制大部分开发者算不清值不值,文档也不直观。

**工作量**:3 人日。

---

#### T5. Rate Limit / 并发计算器 Phase 3

**概述**:输入限额,输出最大并发与限流时间。

**核心功能**
- 输入:TPM(每分钟 token) / RPM(每分钟请求) / TPD(每日 token) / 并发数限制 + 平均请求大小
- 输出:理论最大 QPS、何时会触发限流、推荐的退避策略
- 显示主流家(OpenAI Tier 1-5、Anthropic、Gemini)的默认限额表
- 支持「我的应用每秒 N 次调用,需要升级到哪个 Tier」反查

**技术方案**:纯前端。

**SEO 关键词**:`openai rate limit calculator`, `tpm rpm calculator`, `llm api throttle`

**工作量**:3 人日。

---

### 3.2 Prompt 工具类(5 个)

#### P1. Prompt Diff 比较器 Phase 1

**概述**:专为 prompt 优化的 diff viewer。

**核心功能**
- 复用现有 `/development/diff-viewer` 的核心,但增加 prompt 特化:
  - 识别并独立高亮 `{{variable}}` / `{var}` / `<placeholder>` 占位符
  - 按 role 分块对比(system / user / assistant 各一栏)
  - 显示 token 数差值,提示「v2 比 v1 多用了 X token」
  - 检测语义结构变化(指令数量、示例数量、约束数量)
- 支持双向收藏与版本对比历史(localStorage)

**技术方案**:纯前端,复用 `jsdiff` + 新增 prompt 解析器。

**SEO 关键词**:`prompt diff`, `compare prompts`, `prompt version compare`

**差异化**:目前 prompt 版本管理是开发者痛点,大家用 Git diff 凑合,但 Git diff 不理解 token 和 role。

**工作量**:4 人日(已有 diff viewer 底子)。

---

#### P2. Prompt 格式跨家转换器 ⭐ Phase 1

**概述**:一处定义、多家可用。

**核心功能**
- 输入格式:Anthropic XML 风格 / OpenAI messages 数组 / Gemini contents / ChatML / LangChain prompt template
- 输出:四家可直接调用的完整 payload
- 自动处理:
  - system message 在不同家的位置(Anthropic 是顶层 `system` 字段,OpenAI 是数组第一条)
  - tool calls 格式转换(见 S2)
  - 多模态消息的差异(image_url vs base64 vs file_data)
- 一键生成 curl / Python / TS / Go 代码

**技术方案**:纯前端,核心是写一个 Provider-agnostic 的 IR(中间表示),然后各家有 serialize/parse 函数。

**SEO 关键词**:`convert openai to claude`, `claude to gpt prompt format`, `chatml converter`, `llm prompt format converter`

**差异化**:多模型用户必备,目前只有零散的代码库,没人做成在线工具。

**工作量**:8 人日。

---

#### P3. System Prompt Linter Phase 2

**概述**:静态分析 system prompt 的常见反模式。

**核心功能**
- 检测规则(初始 30 条,持续积累):
  - 冗余否定 (`Don't do X. Don't do Y. Don't do Z.` → 建议合并)
  - 互相矛盾的规则(简单的关键词冲突检测)
  - 缺少输出格式说明
  - 超过推荐长度(分模型给出阈值)
  - 过度大写 / 过度 `MUST` / `NEVER`(研究显示效果递减)
  - few-shot 数量过少(< 2 条)或过多(> 8 条)
  - 包含可能被误识别为指令的用户输入占位符
- 每条规则带「为什么」「怎么改」「参考链接」
- 评分(0-100)+ 维度雷达图
- 规则可以做成 MDX 内容页,本身吃 SEO

**技术方案**:纯前端 + 规则配置文件。

**SEO 关键词**:`prompt linter`, `system prompt analyzer`, `prompt best practices checker`

**差异化**:**这是最有内容护城河的工具**,每条规则都能引申出一篇博客文章。

**工作量**:10 人日(规则积累是持续工作)。

---

#### P4. Few-shot 示例构建器 Phase 3

**概述**:表单化生成结构化 few-shot prompt。

**核心功能**
- 输入:任务描述 + 若干 input/output 对(动态增减)
- 输出风格:XML(`<example><input>...</input><output>...</output></example>`)、JSON、Markdown(`### Example 1`)、纯文本
- 一键导入 JSONL / CSV(便于把已有数据集转成 few-shot)
- 显示总 token 数、推荐示例数

**技术方案**:纯前端。

**SEO 关键词**:`few shot prompt generator`, `xml prompt builder`

**工作量**:3 人日。

---

#### P5. Prompt 变量提取与填充 Phase 3

**概述**:模板化 prompt 的批量测试器。

**核心功能**
- 自动扫出 `{{var}}` / `{var}` / `${var}` 占位符
- 生成表单填值,实时预览最终 prompt
- 支持上传 CSV 批量填充(每行一个变量组合,生成 N 个 prompt)
- 导出生成的 prompt 列表为 JSONL(可直接走 batch API)

**技术方案**:纯前端。

**SEO 关键词**:`prompt template tester`, `prompt variable filler`

**工作量**:3 人日。

---

### 3.3 Schema 与 Tool Calling(4 个)

#### S1. JSON Schema 生成器(LLM 适配版) Phase 2

**概述**:从 JSON / TypeScript 生成 LLM 友好的 JSON Schema。

**核心功能**
- 输入:JSON 实例 / TypeScript interface / Zod schema 字符串
- 输出:JSON Schema(支持 `$defs`、`additionalProperties: false` 等关键约束)
- 「兼容性徽章」:每个 schema 标注「OpenAI strict mode ✅ / Anthropic ✅ / Gemini ⚠ 不支持 oneOf」
- 一键裁切到指定家的支持子集
- 字段级注释提示(`description` 字段对工具调用准确率影响大,提示用户填写)

**技术方案**:纯前端。

**SEO 关键词**:`json schema generator`, `tool calling schema`, `openai strict schema`

**差异化**:既有的 JSON Schema 生成器没考虑 LLM tool calling 的子集限制,这是关键差异点。

**工作量**:6 人日。

---

#### S2. Tool Schema 跨家转换器 ⭐ Phase 1

**概述**:OpenAI function ↔ Anthropic tool ↔ Gemini function ↔ MCP tool。

**核心功能**
- 一处粘贴定义,四种格式实时输出
- 处理细节差异:
  - OpenAI 包了一层 `{ type: "function", function: { ... } }`
  - Anthropic 是扁平的 `{ name, description, input_schema }`
  - Gemini 用 `parameters` 而非 `input_schema`,且是 OpenAPI 子集
  - MCP 多了 `annotations` 字段
- 校验所有家都能接受(高亮不兼容字段)
- 导出可直接复制粘贴到 SDK

**技术方案**:纯前端。

**SEO 关键词**:`function calling converter`, `openai tool to anthropic`, `mcp tool schema`

**差异化**:agent 开发刚需,目前完全空白。

**工作量**:5 人日。

---

#### S3. Tool Schema 可视化构建器 Phase 3

**概述**:点选式表单生成 tool schema。

**核心功能**
- 类似你们的 secret generator 那种交互:左边表单(参数名 / 类型 / required / enum / description),右边实时 JSON Schema
- 支持嵌套对象、数组、union type
- 内置常用 tool 模板(search、calendar、email、file ops)

**技术方案**:纯前端。

**SEO 关键词**:`tool schema builder`, `function calling builder`

**工作量**:5 人日。

---

#### S4. Structured Output 校验器 Phase 2

**概述**:校验 LLM 输出是否符合给定 schema。

**核心功能**
- 输入:JSON Schema + LLM 实际输出
- 输出:通过 / 失败 + 失败字段定位 + 修复建议
- 支持 markdown 代码块自动剥离
- 批量模式:粘贴 JSONL 一次校验多条

**技术方案**:纯前端,用 `ajv`。

**SEO 关键词**:`json schema validator`, `structured output validator`, `llm output checker`

**差异化**:现有 JSON Schema validator 不针对 LLM 输出场景,缺少代码块剥离、字段定位等贴心功能。

**工作量**:3 人日。

---

### 3.4 Embeddings、RAG 与数据处理(4 个)

#### R1. Token-aware 文本切分器 ⭐ Phase 1

**概述**:RAG 调试必备,可视化文本切分结果。

**核心功能**
- 输入:粘贴长文 / 上传 .txt .md .pdf
- 配置:chunk size、overlap、切分策略(recursive character / markdown-aware / semantic / token-based)
- 输出:可视化每个 chunk 的边界(不同颜色)、token 数、首尾字符预览
- 显示总 chunk 数、平均/最大/最小 chunk size 分布
- 导出 JSONL(每行一个 chunk,带 `chunk_id` / `token_count` / `start_offset` / `end_offset`)
- 实时调参,看切分结果如何变化

**技术方案**:纯前端。复用 LangChain 的切分逻辑(MIT 协议可移植)。PDF 用 `pdf.js` 解析。

**SEO 关键词**:`text chunker`, `rag chunking tool`, `langchain text splitter online`

**差异化**:**RAG 工程师每天都需要调这个,目前没有好用的可视化工具**。这一项是潜在的明星工具。

**工作量**:7 人日。

---

#### R2. JSONL 查看器/编辑器 Phase 2

**概述**:fine-tuning 数据集和 batch 输出的浏览器端编辑器。

**核心功能**
- 流式加载大文件(>100MB)
- 表格视图 + JSON 视图切换
- 单条编辑,自动保留 JSONL 格式
- 支持过滤、搜索、列选择
- 一键校验各家 fine-tuning 格式(OpenAI / Anthropic / Gemini)

**技术方案**:纯前端。用 `papaparse` 类似的流式解析。

**SEO 关键词**:`jsonl viewer`, `jsonl editor online`, `fine tuning data viewer`

**差异化**:JSONL 工具普遍很糙或者要装本地软件。

**工作量**:6 人日。

---

#### R3. Fine-tuning 数据集校验器 Phase 3

**概述**:上传 JSONL,检查格式与质量。

**核心功能**
- 各家格式校验(messages 字段结构、role 序列合法性、tool call 格式)
- 统计:总样本数、token 分布、异常长样本警告
- 估算训练成本(用 T2 的成本数据)
- 重复样本检测(简单 hash 去重)
- 导出清洗后版本

**技术方案**:纯前端 + Web Worker。

**SEO 关键词**:`fine tuning data validator`, `openai fine tune format check`

**工作量**:4 人日。

---

#### R4. Embedding 相似度可视化 Phase 3

**概述**:输入若干文本,看它们在 embedding 空间的关系。

**核心功能**
- 粘贴 N 段文本(每行一段)+ 选 embedding 模型
- 调用模型 API(BYOK)拿 embedding
- 输出:相似度矩阵热力图 + 2D 散点图(UMAP / t-SNE 降维)
- 支持多家模型对比(同样的文本在 OpenAI text-embedding-3 vs Cohere vs Voyage 看起来差多少)

**技术方案**:BYOK,API 直连(浏览器 → OpenAI/Cohere/Voyage),UMAP 走 `umap-js`。

**SEO 关键词**:`embedding visualizer`, `compare embedding models`, `text similarity tool`

**工作量**:6 人日。

---

### 3.5 模型与 API 调试(4 个)

#### A1. SSE 流式响应解析器 ⭐ Phase 1

**概述**:粘贴 raw streaming response,解析每个 event。

**核心功能**
- 支持各家 streaming 格式:OpenAI SSE / Anthropic SSE / Gemini SSE
- 展开每个 event:
  - 文本 delta 累积预览
  - tool_use 增量重组
  - thinking blocks 展开
  - usage / stop_reason / 错误事件高亮
- 时间轴视图:每个 event 距离开始的毫秒数(如果原始数据有时间戳)
- 「重放」功能:按原速逐 event 播放,模拟用户看到的实际效果

**技术方案**:纯前端。

**SEO 关键词**:`sse parser`, `llm stream parser`, `anthropic sse decoder`, `openai stream debug`

**差异化**:agent 调试日志里 raw SSE 一抓一大把,大家都在用 jq 或自写脚本凑合。

**工作量**:5 人日。

---

#### A2. 模型规格对比表 Phase 2

**概述**:可筛选、可排序的主流 LLM 大全。

**核心功能**
- 维度:context window / 输入价 / 输出价 / 训练截止 / 多模态 / tool use / prompt cache / batch / fine-tuning / reasoning / 限流
- 支持多维筛选(「context > 100k 且支持 vision 且 < $5/M token」)
- 收藏夹(localStorage)
- 「类似模型」推荐(Opus 4.7 旁边推荐其他高端推理模型)
- 每个模型详情页本身吃 SEO(`claude-opus-4-7-vs-gpt-4-1` 这种页面)

**技术方案**:纯前端,直接用 `llm-registry.json`。详情页可以做静态生成。

**SEO 关键词**:`claude vs gpt`, `llm comparison`, `best llm 2026`, 各种长尾对比词

**差异化**:既有对比都是博客静态文章,无交互,数据过期严重。**实时维护的事实表本身就是护城河。**

**工作量**:6 人日(初版)+ 持续维护。

---

#### A3. LLM API Request 构建器 Phase 3

**概述**:面向 LLM 的 Postman。

**核心功能**
- 选 provider / model / messages / tools / sampling 参数
- 实时生成 curl / Python / TypeScript / Go / fetch 代码
- BYOK 直接发起请求(走浏览器,不经服务器)
- 保存 request 模板到 localStorage
- 导入/导出 OpenAPI 类似的格式,方便分享

**技术方案**:纯前端 + BYOK。

**SEO 关键词**:`llm api playground`, `claude api tester`, `openai api request builder`

**差异化**:Postman 通用度高但对 LLM 不友好(没 token 计数、没流式可视化)。

**工作量**:8 人日。

---

#### A4. Provider Status 聚合页 Phase 3(可选)

**概述**:各家 LLM API 的实时状态。

**核心功能**
- 抓取 OpenAI / Anthropic / Gemini / Azure OpenAI 等的 status page,聚合显示
- 历史 incident 时间轴
- 「我现在该不该 fallback」的明确建议

**技术方案**:需要少量后端定时抓取(或用 GitHub Actions 写入静态 JSON)。

**SEO 关键词**:`openai status`, `claude api down`, `llm provider status`

**工作量**:4 人日 + 持续维护。

> 注意:这是方向一里**唯一需要后端/定时任务**的工具,可酌情排到最后或 skip。

---

## 4. 分阶段开发计划

### Phase 1(0-8 周):奠基与流量入口

目标:5 个高流量、纯前端、零后端工具上线,SEO 收录开始,品牌「parsify for AI agent」立住。

| 周 | 工具 | 说明 |
|---|---|---|
| W1-W2 | 基础设施 | 搭建 `llm-registry.json`、共享 UI 组件、新建 `/llm/*` 路由结构 |
| W3-W4 | T1 多模型 Token 计数器 | 抓主关键词 |
| W4-W5 | T2 月成本估算器 | 易传播 |
| W5-W6 | S2 Tool Schema 转换器 | agent 开发刚需 |
| W6-W7 | R1 文本切分器 | 潜在明星工具 |
| W7-W8 | A1 SSE 解析器 | 调试黏性强 |

合计约 30 人日,1 人 8 周可完成。Buffer 留 20%。

### Phase 2(9-16 周):深化与黏性

目标:补齐 prompt / context / schema 维度,形成完整闭环,开始内部导流。

- T3 Context Window 可视化
- T4 Prompt Cache 计算器
- P1 Prompt Diff 比较器
- P3 System Prompt Linter(开始内容沉淀)
- S1 JSON Schema 生成器
- S4 Structured Output 校验器
- R2 JSONL 查看器
- A2 模型规格对比表(开始数据维护节奏)

合计约 38 人日。

### Phase 3(17-24 周):长尾与商业化前置

目标:覆盖剩余长尾,准备 Pro 功能埋点。

- T5 Rate Limit 计算器
- P2 Prompt 格式转换器(放到这里是因为工作量大,可拆细做)
- P4 Few-shot 构建器
- P5 变量填充器
- S3 Tool Schema 可视化构建器
- R3 Fine-tuning 数据校验器
- R4 Embedding 可视化
- A3 API Request 构建器
- A4 Status 聚合(可选)

合计约 38 人日。

### 总览

- **18 个工具**(若含 A4)
- **总工作量约 110 人日**
- **6 个月** 1 人全职 / **3 个月** 2 人 / **2 个月** 3 人

---

## 5. 跨工具协同与导流

### 5.1 推荐路径设计

每个工具页面底部「Related Tools」按以下规则推荐:

- **T1 Token 计数器** → T2 成本估算 / T3 Context 可视化 / R1 切分器
- **R1 切分器** → T1 计数器 / T3 Context 可视化 / R2 JSONL 查看器
- **S2 Tool Schema 转换器** → S1 Schema 生成器 / S4 输出校验 / P2 Prompt 格式转换
- **P3 System Prompt Linter** → P1 Diff / T1 计数器
- **A1 SSE 解析器** → A2 模型对比 / A3 API 构建器

### 5.2 共享数据格式

约定一个通用 IR(Intermediate Representation),让多个工具间能复制粘贴流转:

```jsonc
// parsify-prompt-format v1
{
  "version": "1.0",
  "model": "claude-opus-4-7",
  "system": "...",
  "messages": [...],
  "tools": [...],
  "metadata": { "source": "p2", "timestamp": "..." }
}
```

T1 可以接受这个格式直接计 token,P1 可以 diff 两个这样的对象,A3 可以转成 API call。

### 5.3 站内搜索

新增 `/llm/search`,支持跨工具的关键词搜索(「我要做 X」→ 推荐用哪几个工具组合)。

---

## 6. 商业化路径(粗略)

不在本文档展开,但每个工具设计时已留好钩子:

- **免费功能**:基础计算 / 校验 / 转换 / 可视化(全部 18 个工具的核心场景)
- **Pro 候选功能**:历史记录 > 30 天、批量处理 > 100 条、多人共享 prompt 库、`llm-registry` 提前一周看到下个月价格变化、API 端点(给开发者集成进 CI)

---

## 7. 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|---|---|---|---|
| 大厂(Vercel / LangSmith / Helicone)做免费版抢流量 | 中 | 高 | 靠「全在浏览器跑」「无账号」「跨家中立」三点维持差异 |
| `llm-registry.json` 维护跟不上 | 高 | 高 | 自动化:写脚本定期对比官方文档 / pricing 页面;接受社区 PR |
| BYOK 用户对前端调用 API 有顾虑 | 中 | 中 | 显著标注「不经过我方服务器」「key 仅存在浏览器」「点此立即清除」;开源核心代码 |
| Tokenizer WASM 体积影响首屏 | 中 | 低 | lazy load + 按需加载特定家 tokenizer |
| AI agent 这个名词热度退潮 | 低 | 中 | 工具本身解决的是「LLM 应用开发」实际问题,不依赖热词 |
| SEO 关键词竞争加剧 | 中 | 中 | 内容护城河:每个工具配深度文档 / 博客;`llm-registry` 数据本身吃 SEO |

---

## 8. 下一步行动清单

- [ ] 确认是否采纳本计划,或哪些工具优先级要调整
- [ ] 决定开发节奏(全职 / 副业 / 多人)
- [ ] 搭建 `llm-registry.json` 第一版(2 人日内可完成,这是所有工具的前提)
- [ ] 申请域名子路径或独立域名(`parsify.dev/llm/*` vs `llm.parsify.dev` vs 新域名)
- [ ] 启动 Phase 1 W1-W2 基础设施工作

---

> 文档维护:每月对照工具上线进度更新本文档;`llm-registry.json` 单独维护更高频。

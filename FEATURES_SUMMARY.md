# Parsify 功能扩展总结

## 🎯 新增功能概览

### 1. LLM & SEO 优化文件

| 端点 | 说明 | 用途 |
|------|------|------|
| `GET /api/llm.txt` | LLM 友好的 API 文档 | 让 AI 爬虫了解 Parsify API |
| `GET /api/robots.txt` | 搜索引擎爬虫指令 | 控制爬虫访问权限 |
| `GET /api/sitemap.xml` | XML 站点地图 | 帮助搜索引擎索引 |

**robots.txt 配置说明：**
- ✅ 允许：GPTBot, ChatGPT-User, Claude-Web, Anthropic-ai, Google-Extended 访问 `/llm.txt`
- ❌ 禁止：Bytespider, CCBot（恶意爬虫）
- ⏱️ 爬虫延迟：1 秒

### 2. SSO & API Key 认证系统

#### API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 注册并获取 API Key |
| `/api/auth/login` | POST | 使用邮箱 + API Key 登录 |
| `/api/auth/verify` | POST | 验证 API Key 有效性 |
| `/api/auth/me` | GET | 获取用户信息（需要 Bearer token） |

#### 认证流程

```
1. 注册
   用户输入邮箱 + 名称 → 服务器生成 pk_xxxxx API Key
   
2. 登录
   用户输入邮箱 + API Key → 服务器返回 JWT token
   
3. API 调用
   请求头添加 Authorization: Bearer pk_xxxxx
   
4. 使用统计
   服务器自动记录 parse/agent 调用次数
```

#### 前端页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 登录/注册 | `/login` | 用户认证入口 |
| 控制面板 | `/dashboard` | 查看 API Key、使用统计 |
| API 文档 | `/docs` | 完整的 API 使用文档 |

### 3. 前端集成

#### Header 导航更新
- 已登录：显示用户名 + 控制面板链接
- 未登录：显示登录按钮

#### 首页更新
- 添加「获取 API Key」按钮
- 添加「API 文档」按钮

## 📁 文件变更清单

### 新增文件

```
src/
├── components/
│   └── auth/
│       └── login-form.tsx          # 登录表单组件
├── lib/
│   └── auth/
│       └── use-auth.ts             # 认证 Hook
├── routes/
│   ├── login.tsx                   # 登录页面
│   ├── dashboard.tsx               # 控制面板页面
│   └── docs.tsx                    # API 文档页面
├── schemas/
│   └── auth.ts                     # 认证 Schema + Token 工具
└── server/
    └── routers/
        └── auth.ts                 # 认证 API 路由
```

### 修改文件

```
src/
├── routes/
│   └── index.tsx                   # 添加登录/文档入口
├── components/
│   └── layout/
│       └── header.tsx              # 添加用户菜单
├── server/
│   └── hono.ts                     # 添加 llm.txt/robots.txt/sitemap.xml 路由
└── schemas/
    ├── parse.ts                    # 添加 INVALID_API_KEY 错误码
    └── agent.ts                    # 添加 INVALID_API_KEY 错误码
```

## 🔧 技术实现细节

### API Key 格式
```
pk_[48位随机字符]
示例: pk_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop
```

### JWT Token 结构
```json
{
  "header": { "alg": "HS256", "typ": "JWT" },
  "payload": {
    "sub": "API Key",
    "email": "user@example.com",
    "iat": 1717000000,
    "exp": 1717604800
  }
}
```

### 使用统计
```typescript
{
  parseCount: number,    // /api/parse 调用次数
  agentCount: number,    // /api/agent 调用次数
  lastUsed: string       // ISO 时间戳
}
```

## 🚀 使用示例

### 注册获取 API Key
```bash
curl -X POST https://parsify.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "Test User"}'
```

### 使用 API Key 解析 URL
```bash
curl -X POST https://parsify.dev/api/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_xxxxxxxxxxxx" \
  -d '{"url": "https://example.com/article"}'
```

### 生成摘要
```bash
curl -X POST https://parsify.dev/api/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_xxxxxxxxxxxx" \
  -d '{"markdown": "# Article...", "prompt": "请总结"}'
```

## 📊 当前状态

- ✅ 类型检查通过
- ✅ 所有测试通过 (22 tests)
- ✅ 构建成功
- ✅ 开发服务器可运行

## 🔜 后续优化建议

1. **持久化存储**：将 API Key 和使用统计存储到数据库（如 PostgreSQL/Redis）
2. **更完善的 JWT**：使用 `jose` 或 `jsonwebtoken` 库实现标准 JWT
3. **OAuth 集成**：支持 GitHub/Google 第三方登录
4. **API Key 管理**：支持撤销、重新生成 API Key
5. **使用配额**：为不同用户设置不同的调用限制
6. **Webhook 通知**：接近配额限制时发送通知

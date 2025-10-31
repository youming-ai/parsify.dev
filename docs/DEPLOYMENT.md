# 🚀 Parsify.dev 部署指南

完整的 Cloudflare Pages 部署指南，包含本地开发、预览和生产环境部署。

## 📋 目录

- [环境要求](#环境要求)
- [本地开发](#本地开发)
- [部署到 Cloudflare Pages](#部署到-cloudflare-pages)
- [环境变量配置](#环境变量配置)
- [自定义域名](#自定义域名)
- [故障排除](#故障排除)

---

## 环境要求

### 必需软件

- **Node.js**: >= 20.x
- **pnpm**: >= 9.x
- **Git**: 最新版本
- **Wrangler CLI**: >= 4.x

### 安装工具

```bash
# 安装 pnpm
npm install -g pnpm

# 安装 Wrangler CLI
pnpm install -g wrangler

# 验证安装
node --version  # v20.x.x
pnpm --version  # 9.x.x
wrangler --version  # 4.x.x
```

---

## 本地开发

### 1. 克隆项目

```bash
git clone https://github.com/your-username/parsify-dev.git
cd parsify-dev
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
NEXT_PUBLIC_ENVIRONMENT=development

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true

# Microsoft Clarity
NEXT_PUBLIC_MICROSOFT_CLARITY_ID=your_clarity_id
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 5. 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test --watch

# 覆盖率报告
pnpm test:coverage
```

### 6. 代码检查与格式化

```bash
# 运行 Biome 检查
pnpm lint

# 自动格式化代码
pnpm format
```

---

## 部署到 Cloudflare Pages

### 方式一：通过 Git 自动部署（推荐）

#### 1. 创建 Cloudflare Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **Pages** → **Create a project**
3. 连接你的 Git 仓库 (GitHub/GitLab)
4. 选择 `parsify-dev` 仓库

#### 2. 配置构建设置

```yaml
Framework preset: None (Custom)
Build command: pnpm run build
Build output directory: .open-next
Root directory: /
Node version: 20
```

> ⚠️ **注意**
> 选择 Next.js 预设会自动启用旧版 `@cloudflare/next-on-pages` 构建流程，生成 `.vercel/output` 而不是 `.open-next`，从而导致 Wrangler 查找不到构建目录。请选择 `None (Custom)` 并使用上面的自定义命令。

#### 3. 配置环境变量

在 Cloudflare Pages 项目设置中添加：

**生产环境变量：**
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.parsify.dev
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_MICROSOFT_CLARITY_ID=your_clarity_id
```

**预览环境变量：**
```bash
NEXT_PUBLIC_API_BASE_URL=https://api-staging.parsify.dev
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

#### 4. 部署

提交代码到 `main` 分支即可自动触发部署：

```bash
git add .
git commit -m "feat: deploy to Cloudflare Pages"
git push origin main
```

#### 5. 监控部署

在 Cloudflare Dashboard 的 **Pages** → **Your Project** → **Deployments** 查看部署状态。

---

### 方式二：通过 CLI 手动部署

#### 1. 登录 Wrangler

```bash
wrangler login
```

#### 2. 构建项目

```bash
pnpm run build
```

#### 3. 预览部署（可选）

```bash
pnpm run preview
```

这会在本地启动一个模拟 Cloudflare Workers 的环境。

#### 4. 部署到生产环境

```bash
# 首次部署
pnpm run deploy

# 或使用 wrangler 直接部署
wrangler pages deploy .open-next --project-name=parsify-dev
```

#### 5. 部署到预览环境

```bash
wrangler pages deploy .open-next --project-name=parsify-dev --env=preview
```

---

## 环境变量配置

### 本地开发 (`.env.local`)

```bash
# API URLs
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
NEXT_PUBLIC_API_BASE_URL_DEV=http://localhost:8787
NEXT_PUBLIC_API_BASE_URL_PROD=https://api.parsify.dev
NEXT_PUBLIC_API_BASE_URL_STAGING=https://api-staging.parsify.dev

# Environment
NEXT_PUBLIC_ENVIRONMENT=development

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true

# Third-party services
NEXT_PUBLIC_MICROSOFT_CLARITY_ID=tx90x0sxzq
```

### Cloudflare Pages 环境变量

在 Cloudflare Dashboard 设置：

**路径**: Pages → Your Project → Settings → Environment variables

| 变量名 | 生产环境 | 预览环境 |
|--------|----------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.parsify.dev` | `https://api-staging.parsify.dev` |
| `NEXT_PUBLIC_ENVIRONMENT` | `production` | `staging` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `true` | `true` |
| `NEXT_PUBLIC_MICROSOFT_CLARITY_ID` | `your_clarity_id` | `your_clarity_id` |

---

## 自定义域名

### 1. 添加自定义域名

1. 进入 Cloudflare Pages 项目
2. 选择 **Custom domains** → **Set up a custom domain**
3. 输入域名：`parsify.dev` 或 `www.parsify.dev`
4. 点击 **Continue**

### 2. 配置 DNS

如果域名在 Cloudflare 上：

自动配置 DNS 记录 ✅

如果域名在其他服务商：

添加以下 CNAME 记录：

```
Type: CNAME
Name: www (或 @)
Target: parsify-dev.pages.dev
Proxy: Yes (橙色云)
```

### 3. 配置 SSL/TLS

1. 进入 **SSL/TLS** → **Overview**
2. 选择加密模式：**Full (strict)** 推荐
3. 启用 **Always Use HTTPS**
4. 启用 **Automatic HTTPS Rewrites**

### 4. 更新 wrangler.toml

```toml
[env.production]
name = "parsify-dev"
routes = [
  { pattern = "parsify.dev", custom_domain = true },
  { pattern = "www.parsify.dev", custom_domain = true }
]
```

---

## 性能优化

### 1. 启用 Cloudflare 优化

在 Cloudflare Dashboard:

- **Speed** → **Optimization**
  - ✅ Auto Minify (JS, CSS, HTML)
  - ✅ Brotli
  - ✅ Early Hints
  - ✅ HTTP/2
  - ✅ HTTP/3 (QUIC)

### 2. 配置缓存规则

创建 `public/_headers`:

```
/*
  Cache-Control: public, max-age=3600, s-maxage=86400
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### 3. 配置 Next.js 优化

在 `next.config.js` 中已配置：

```javascript
{
  output: 'standalone',
  compress: true,
  images: { unoptimized: true },
  reactCompiler: true,
  experimental: {
    optimizeCss: true
  }
}
```

---

## 部署说明

该项目使用 Cloudflare Pages 的 Git 集成功能进行自动部署。当您推送代码到 GitHub 仓库时，Cloudflare 会自动构建和部署您的网站。

### 自动部署流程

1. **代码推送** → Git 仓库
2. **自动构建** → Cloudflare Pages
3. **部署发布** → 生产环境

无需手动 CI/CD 配置，所有构建和部署流程由 Cloudflare 自动处理。

---

## 监控与日志

### 1. Cloudflare Analytics

查看访问数据：

1. 进入 Cloudflare Dashboard
2. 选择域名
3. **Analytics & Logs** → **Web Analytics**

### 2. Real-time Logs

启用实时日志（Enterprise 功能）：

```bash
wrangler pages deployment tail
```

### 3. Microsoft Clarity

查看用户行为：

访问 [https://clarity.microsoft.com/](https://clarity.microsoft.com/)

---

## 回滚部署

### 通过 Dashboard

1. 进入 **Pages** → **Your Project** → **Deployments**
2. 找到之前的成功部署
3. 点击 **Rollback to this deployment**

### 通过 CLI

```bash
# 查看部署历史
wrangler pages deployment list

# 回滚到指定部署
wrangler pages deployment rollback <DEPLOYMENT_ID>
```

---

## 故障排除

### 问题 1: 构建失败

**错误**: `Error: Build failed`

**解决方案**:
```bash
# 清理缓存
pnpm clean
rm -rf .next .open-next node_modules

# 重新安装
pnpm install

# 重新构建
pnpm run build
```

### 问题 2: 环境变量未生效

**解决方案**:
1. 确认变量名以 `NEXT_PUBLIC_` 开头
2. 在 Cloudflare Pages 设置中配置
3. 重新部署触发构建

### 问题 3: 路由 404 错误

**解决方案**:

在 `public/_redirects` 添加：

```
/*    /index.html   200
```

### 问题 4: 静态资源加载失败

**解决方案**:

检查 `next.config.js`:

```javascript
{
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://parsify.dev' 
    : undefined
}
```

### 问题 5: TypeScript 类型错误

**解决方案**:
```bash
# 重新生成类型
pnpm run build

# 检查类型
pnpm tsc --noEmit
```

---

## 安全检查清单

部署前确认：

- [ ] 环境变量已正确配置
- [ ] API 密钥未硬编码在代码中
- [ ] HTTPS 强制启用
- [ ] CSP (Content Security Policy) 已配置
- [ ] 敏感路由已保护
- [ ] 依赖项已更新到最新版本
- [ ] 安全 headers 已配置

---

## 性能检查清单

部署后验证：

- [ ] Lighthouse 得分 > 90
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.8s
- [ ] 图片已优化
- [ ] JavaScript bundle < 200KB
- [ ] CSS 已压缩

---

## 有用的命令

```bash
# 本地开发
pnpm dev

# 构建
pnpm build

# 预览构建
pnpm preview

# 部署到生产
pnpm deploy

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 格式化代码
pnpm format

# 清理缓存
pnpm clean
```

---

## 相关资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [OpenNext Cloudflare 文档](https://opennext.js.org/cloudflare)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

---

## 获取帮助

- **问题反馈**: [GitHub Issues](https://github.com/your-username/parsify-dev/issues)
- **社区讨论**: [GitHub Discussions](https://github.com/your-username/parsify-dev/discussions)
- **Cloudflare 支持**: [Cloudflare Community](https://community.cloudflare.com/)

---

**部署愉快！🚀**

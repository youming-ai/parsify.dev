# 部署指南

## 概述

本项目完全使用 Cloudflare Pages Functions 进行统一部署，已移除 GitHub Actions，实现完全的 Git 集成自动部署。

## 项目结构

- **前端 + API**: 统一部署到 Cloudflare Pages
  - 前端: Next.js 静态文件
  - API: Cloudflare Pages Functions
  - 统一构建: 生成包含两者的 `dist/` 目录

## 自动部署设置

### Cloudflare Pages Git 集成

项目已完全配置为使用 Cloudflare Pages Git 集成，每次推送到 `main` 分支都会自动部署。

#### 当前配置

- **项目**: parsify-dev (已连接 Git ✅)
- **生产分支**: main
- **构建命令**: `./scripts/build-unified.sh`
- **构建输出目录**: `dist/`
- **Node.js 版本**: 20
- **包管理器**: pnpm

#### 环境变量

项目已配置以下环境变量：

```
ENVIRONMENT: production
API_VERSION: v1
NEXT_PUBLIC_MICROSOFT_CLARITY_ID: tx90x0sxzq
ENABLE_METRICS: true
LOG_LEVEL: info
```

#### 部署流程

1. 代码推送到 GitHub `main` 分支
2. Cloudflare Pages 自动触发构建
3. 执行统一构建脚本：
   - 构建前端静态文件
   - 复制 API Functions
   - 生成统一的 `dist/` 目录
4. 自动部署到 Cloudflare Pages
5. 前端和 API 在同一个域名下可用

## 手动部署

### API 部署

```bash
# 部署 API 到 Cloudflare Workers
./scripts/deploy-api.sh
```

或手动执行：

```bash
cd apps/api
pnpm exec wrangler deploy
```

### 前端部署

```bash
# 部署前端到 Cloudflare Pages
./scripts/deploy-web.sh
```

或手动执行：

```bash
cd apps/web
pnpm install
pnpm run build
pnpm exec wrangler pages deploy out --project-name parsify-web
```

## 本地开发

### 前端

```bash
cd apps/web
pnpm install
pnpm run dev
```

### API

```bash
cd apps/api
pnpm install
pnpm run dev
```

## 部署 URL

- **统一部署**: https://parsify-dev.pages.dev (主要域名)
- **自定义域名**: https://parsify.dev
- **最新部署**: https://443ea2c2.parsify-dev.pages.dev

## 监控和日志

### Cloudflare Pages

1. 进入 Cloudflare Dashboard
2. 选择 Pages 项目
3. 查看 "Builds" 和 "Analytics"

### Cloudflare Workers

1. 进入 Cloudflare Dashboard
2. 选择 Workers & Pages
3. 查看 "Logs" 和 "Analytics"

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 package.json 中的构建命令
   - 确认所有依赖都已安装
   - 查看 Cloudflare 构建日志

2. **API 部署失败**
   - 检查 wrangler.toml 配置
   - 确认 CLOUDFLARE_API_TOKEN 权限正确
   - 查看 GitHub Actions 日志

3. **域名问题**
   - 确认 DNS 设置正确
   - 检查 Cloudflare SSL 证书状态

### 回滚

如果部署出现问题，可以通过以下方式回滚：

**Pages**:
1. 进入 Cloudflare Dashboard → Pages
2. 选择项目
3. 在 "Builds" 中找到上一个成功的部署
4. 点击 "Rollback"

**Workers**:
```bash
cd apps/api
# 查看部署历史
pnpm exec wrangler deployments list
# 回滚到特定版本
pnpm exec wrangler rollback [deployment-id]
```

## 性能优化

### 前端优化

- 使用 Next.js 静态生成 (SSG)
- 图片优化和懒加载
- CDN 缓存配置
- 代码分割和压缩

### API 优化

- Worker 冷启动优化
- 响应缓存
- 数据库连接池
- 错误处理和重试机制

## 安全配置

### CORS 设置

API 已配置适当的 CORS 头部，支持前端域名。

### 环境变量

所有敏感信息都存储在环境变量中，不会暴露给客户端。

### 安全头部

前端已配置安全头部文件 (`_headers`)。
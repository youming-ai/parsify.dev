# Cloudflare Pages 部署指南

## 概述

Parsify.dev 使用 `@opennextjs/cloudflare` 部署到 Cloudflare Pages。

**优势:**
- 无限免费带宽
- 100k+ Workers 调用/天
- 全球 300+ 节点
- 企业级 DDoS 保护

## 环境变量

本地开发时，复制 `.env.example` 到 `.env.local`：

```bash
cp .env.example .env.local
```

生产环境使用 wrangler secrets：

```bash
bunx wrangler secret put <SECRET_NAME>
```

## 本地开发

```bash
bun install
bun run dev
```

## 部署

### 快速部署（推荐）

```bash
bun run deploy:cf
```

### 分步部署

#### 1. 登录 Cloudflare

```bash
bunx wrangler login
```

#### 2. 构建

```bash
bun run build
```

#### 3. 部署

```bash
bun run deploy
```

## GitHub 集成

在 Cloudflare Dashboard 配置：

| 设置 | 值 |
|------|-----|
| 构建命令 | `bun run build` |
| 部署命令 | `npx wrangler deploy` |
| Node.js 版本 | `20` |

## 配置文件

| 文件 | 说明 |
|------|-----|
| `wrangler.toml` | Cloudflare Workers 配置 |
| `open-next.config.ts` | OpenNext 适配器配置 |
| `.env.example` | 环境变量模板 |

## Analytics

在 Cloudflare Dashboard 启用 Web Analytics：
1. Analytics & Logs → Web Analytics
2. 添加站点
3. 自动注入分析脚本

## 故障排查

### 构建失败

```bash
# 清理并重新构建
bun run clean
bun install
bun run build
```

### 部署超时

检查 `wrangler.toml` 中的 CPU 限制配置。

### 环境变量问题

确保敏感数据使用 `wrangler secret` 而非 `[vars]` 配置。

## 相关链接

- [OpenNext Cloudflare 文档](https://opennext.js.org/cloudflare)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Wrangler 配置参考](https://developers.cloudflare.com/workers/wrangler/configuration/)


# Cloudflare Pages 部署指南

## 概述

Parsify.dev 使用 `@opennextjs/cloudflare` 部署到 Cloudflare Pages。

**优势:**
- 无限免费带宽
- 100k+ Workers 调用/天
- 全球 300+ 节点
- 企业级 DDoS 保护

## 本地开发

```bash
bun install
bun run dev
```

## 部署

### 1. 登录 Cloudflare

```bash
bunx wrangler login
```

### 2. 构建

```bash
bun run build:cf
```

### 3. 部署

```bash
bun run deploy:cf
```

## GitHub 集成

在 Cloudflare Dashboard 配置：

| 设置 | 值 |
|------|-----|
| 构建命令 | `bun run build:cf` |
| 输出目录 | `.open-next` |
| Node.js 版本 | `20` |

## 配置文件

| 文件 | 说明 |
|------|-----|
| `wrangler.toml` | Cloudflare Workers 配置 |
| `open-next.config.ts` | OpenNext 适配器配置 |

## Analytics

在 Cloudflare Dashboard 启用 Web Analytics：
1. Analytics & Logs → Web Analytics
2. 添加站点
3. 自动注入分析脚本

## 相关链接

- [OpenNext Cloudflare 文档](https://opennext.js.org/cloudflare)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)

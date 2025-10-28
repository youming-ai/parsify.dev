#!/bin/bash

# 开发服务器启动脚本
# 统一架构：前端 + API 一起开发

set -e

echo "🚀 启动统一开发服务器..."

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 确保依赖已安装..."
pnpm install

# 构建前端到 out 目录
echo "🏗️ 构建前端..."
cd apps/web
pnpm build
cd ../..

# 启动 Cloudflare Pages 开发服务器
echo "🌐 启动 Cloudflare Pages 开发服务器..."
echo "前端将在 http://localhost:8788 运行"
echo "API 路由将在 http://localhost:8788/api/* 运行"
echo ""
echo "按 Ctrl+C 停止服务器"

# 使用 wrangler pages dev
npx wrangler pages dev dist --compatibility-date=2024-09-23 --port 8788

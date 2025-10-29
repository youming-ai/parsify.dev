#!/bin/bash

# 统一构建脚本 - 前端 + API Functions
# 生成 Cloudflare Pages 需要的 dist 目录

set -e

echo "🚀 开始统一构建..."

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 清理旧的构建目录
echo "🧹 清理旧的构建目录..."
rm -rf dist

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建前端
echo "🏗️ 构建前端..."
cd apps/web
pnpm run build
cd ../..

# 创建 dist 目录
echo "📁 创建 dist 目录..."
mkdir -p dist

# 复制前端静态文件
echo "📋 复制前端文件..."
cp -r apps/web/out/* dist/

# API is now deployed as separate Workers service
echo "🔧 API deployed separately to Cloudflare Workers..."

# 复制配置文件
echo "⚙️ 复制配置文件..."
cp apps/web/_headers dist/ 2>/dev/null || true
cp apps/web/_redirects dist/ 2>/dev/null || true

# 创建 API 路由重定向
echo "🔄 创建 API 路由..."
cat >> dist/_redirects << EOF

# API routes
/api/* /api/:splat 200
EOF

echo "✅ 前端构建完成！"
echo "📊 构建统计："
echo "  - 前端文件: $(find dist -name "*.html" -o -name "*.js" -o -name "*.css" | wc -l)"
echo "  - 总大小: $(du -sh dist | cut -f1)"
echo ""
echo "🌐 部署命令:"
echo "  - 前端: npx wrangler pages deploy dist --project-name parsify-dev"
echo "  - API: cd apps/api && pnpm deploy:production"

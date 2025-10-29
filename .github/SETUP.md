# GitHub Actions 部署配置指南

本指南说明如何配置 GitHub Actions 以自动部署 parsify-dev 项目到 Cloudflare Pages。

## 📋 必需的 GitHub Secrets

在 GitHub 仓库中设置以下 secrets：

### 1. Cloudflare API Token
```
CLOUDFLARE_API_TOKEN
```

**获取方式：**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "My Profile" → "API Tokens"
3. 点击 "Create Token"
4. 使用 "Custom token" 模板，配置以下权限：
   - **Zone**: `Zone:Read`
   - **Account**: `Cloudflare Pages:Edit`
   - **Account Resources**: `Include All accounts`
   - **Zone Resources**: `Include All zones`

### 2. Cloudflare Account ID
```
CLOUDFLARE_ACCOUNT_ID
```

**获取方式：**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在右侧边栏的 "Account details" 中找到 "Account ID"
3. 复制该 ID

## 🔧 配置步骤

### 1. 添加 GitHub Secrets

1. 进入 GitHub 仓库
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 添加上述两个 secrets

### 2. 验证配置

配置完成后，你可以：

1. **手动触发部署**：
   - 进入 `Actions` 标签页
   - 选择 "Deploy to Cloudflare Pages" 或 "Deploy Preview to Cloudflare Pages"
   - 点击 "Run workflow"

2. **自动部署**：
   - 推送到 `main` 分支会自动触发生产环境部署
   - 创建或更新 PR 会自动触发预览环境部署

## 🚀 工作流说明

### 生产部署 (`.github/workflows/deploy.yml`)
- **触发条件**：推送到 `main` 分支
- **部署目标**：Cloudflare Pages 生产环境
- **项目名称**：`parsify-dev`

### 预览部署 (`.github/workflows/deploy-preview.yml`)
- **触发条件**：创建或更新 Pull Request
- **部署目标**：Cloudflare Pages 预览环境
- **功能**：自动在 PR 中添加预览链接

## 🔍 监控和调试

### 查看部署状态
1. GitHub Actions 会显示部署状态
2. 成功部署后会在 Actions 运行摘要中显示详细信息
3. 预览部署会在 PR 中添加评论

### 常见问题

**1. API Token 权限不足**
```
Error: Unable to access Cloudflare Pages API
```
**解决方案**：确保 API Token 包含 `Cloudflare Pages:Edit` 权限

**2. Account ID 错误**
```
Error: Account ID not found
```
**解决方案**：检查 Cloudflare Dashboard 中的 Account ID 是否正确

**3. 构建失败**
检查构建日志中的错误信息，通常是：
- 依赖安装问题
- TypeScript 编译错误
- 资源文件问题

## 📝 工作流特性

- ✅ 自动缓存依赖，提高构建速度
- ✅ 支持手动触发部署
- ✅ PR 预览环境自动创建
- ✅ 详细的部署状态报告
- ✅ 自动在 PR 中添加预览链接
- ✅ 使用最新的 GitHub Actions

## 🛠️ 自定义配置

如需自定义，可以编辑以下文件：
- `.github/workflows/deploy.yml` - 生产环境配置
- `.github/workflows/deploy-preview.yml` - 预览环境配置

可自定义的选项：
- Node.js 版本
- pnpm 版本
- Cloudflare 项目名称
- 部署目录
- 构建命令

---

**配置完成后，每次推送代码都会自动部署！** 🎉
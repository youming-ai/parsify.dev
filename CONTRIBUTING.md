# Contributing to Parsify.dev

感谢你考虑为 Parsify.dev 做出贡献！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 Bug 报告
- 💡 功能建议
- 📝 文档改进
- 🔧 代码贡献
- 🎨 UI/UX 改进

## 📋 目录

- [行为准则](#行为准则)
- [开始之前](#开始之前)
- [开发流程](#开发流程)
- [提交规范](#提交规范)
- [代码风格](#代码风格)
- [测试](#测试)
- [Pull Request 流程](#pull-request-流程)

## 行为准则

本项目遵循 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。参与本项目即表示你同意遵守其条款。

## 开始之前

### 环境要求

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0
- **Git**: 最新版本

### Fork 和 Clone

1. Fork 本仓库到你的 GitHub 账号
2. Clone 你的 fork:

```bash
git clone https://github.com/YOUR_USERNAME/parsify-dev.git
cd parsify-dev
```

3. 添加上游仓库:

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/parsify-dev.git
```

4. 安装依赖:

```bash
pnpm install
```

## 开发流程

### 1. 创建分支

从 `main` 分支创建你的功能分支：

```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

分支命名规范：
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `refactor/` - 代码重构
- `test/` - 测试相关
- `chore/` - 构建/工具配置

### 2. 开发

启动开发服务器：

```bash
pnpm dev
```

项目会在 http://localhost:3000 启动。

### 3. 编写代码

请遵循以下准则：

- 使用 TypeScript 编写类型安全的代码
- 遵循项目的代码风格（Biome 会自动格式化）
- 为新功能添加测试
- 更新相关文档

### 4. 测试

运行测试确保没有破坏现有功能：

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test src/__tests__/your-test.test.ts

# 检查测试覆盖率
pnpm test:coverage
```

### 5. 代码检查

提交前运行代码检查：

```bash
# Lint 检查
pnpm lint

# 类型检查
pnpm tsc --noEmit

# 构建检查
pnpm build
```

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是 bug 修复）
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `perf`: 性能优化
- `ci`: CI/CD 相关

### 示例

```bash
# 新功能
git commit -m "feat(json): add JSON path query support"

# Bug 修复
git commit -m "fix(formatter): handle empty input correctly"

# 文档
git commit -m "docs: update deployment guide"

# 重构
git commit -m "refactor(analytics): simplify event tracking logic"
```

### 提交消息详细说明

```
feat(json): add JSON path query support

Add JSONPath query functionality to allow users to extract
specific data from JSON objects using path expressions.

- Implement queryJSONPath utility function
- Add UI components for path input
- Include example queries
- Add tests for path query logic

Closes #123
```

## 代码风格

### TypeScript

- 使用 `interface` 定义对象类型
- 使用 `type` 定义联合类型或原始类型
- 避免使用 `any`，优先使用 `unknown`
- 为函数参数和返回值添加类型注解

```typescript
// ✅ Good
interface User {
	id: string;
	name: string;
	email: string;
}

function getUser(id: string): Promise<User> {
	// ...
}

// ❌ Bad
function getUser(id): any {
	// ...
}
```

### React 组件

- 使用函数组件和 Hooks
- Props 使用 interface 定义
- 使用 `React.FC` 或显式返回类型

```typescript
// ✅ Good
interface ButtonProps {
	label: string;
	onClick: () => void;
	variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
	return (
		<button onClick={onClick} className={variant}>
			{label}
		</button>
	);
}
```

### 文件命名

- 组件文件: `kebab-case.tsx` (例如: `json-formatter.tsx`)
- 工具文件: `kebab-case.ts` (例如: `json-utils.ts`)
- 类型文件: `kebab-case.ts` (例如: `json-types.ts`)
- 测试文件: `*.test.ts` 或 `*.test.tsx`

### 导入顺序

```typescript
// 1. React 和 Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. 第三方库
import { format } from 'date-fns';

// 3. 内部模块
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 4. 类型导入
import type { User } from '@/types/user';

// 5. 样式和资源
import './styles.css';
```

## 测试

### 编写测试

为新功能添加测试：

```typescript
import { describe, expect, it } from 'vitest';
import { formatJSON } from '@/lib/utils';

describe('formatJSON', () => {
	it('should format valid JSON', () => {
		const input = '{"name":"John","age":30}';
		const result = formatJSON(input, 2);
		
		expect(result).toContain('"name": "John"');
		expect(result).toContain('"age": 30');
	});

	it('should handle invalid JSON gracefully', () => {
		const input = 'invalid json';
		const result = formatJSON(input);
		
		expect(result).toBe(input);
	});
});
```

### 测试覆盖率

我们目标是保持测试覆盖率 > 80%：

- 新功能必须包含测试
- Bug 修复应包含回归测试
- 工具函数需要全面的单元测试

## Pull Request 流程

### 1. 更新你的分支

提交 PR 前，确保你的分支是最新的：

```bash
git checkout main
git pull upstream main
git checkout your-feature-branch
git rebase main
```

### 2. 推送到你的 Fork

```bash
git push origin your-feature-branch
```

### 3. 创建 Pull Request

1. 访问 GitHub 仓库
2. 点击 "New Pull Request"
3. 选择你的分支
4. 填写 PR 模板

### 4. PR 描述

好的 PR 描述应包含：

```markdown
## 描述
简要说明这个 PR 做了什么

## 动机和上下文
为什么需要这个改动？解决了什么问题？

## 改动类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档更新
- [ ] 其他

## 测试
- [ ] 已添加单元测试
- [ ] 已添加集成测试
- [ ] 手动测试通过

## 截图（如适用）
添加相关截图

## Checklist
- [ ] 代码遵循项目风格指南
- [ ] 已进行自我代码审查
- [ ] 代码注释清晰
- [ ] 文档已更新
- [ ] 所有测试通过
- [ ] 无 lint 错误
```

### 5. 代码审查

- 响应审查意见
- 进行必要的修改
- 保持耐心和专业

### 6. 合并

PR 通过审查后，维护者会合并你的代码。

## 报告 Bug

### Bug 报告模板

使用 GitHub Issues 报告 bug，请包含：

1. **问题描述**: 清晰简洁的描述
2. **复现步骤**: 详细的复现步骤
3. **期望行为**: 你期望发生什么
4. **实际行为**: 实际发生了什么
5. **环境信息**:
   - OS: [e.g. macOS 14.0]
   - Browser: [e.g. Chrome 120]
   - Node.js: [e.g. 20.10.0]
6. **截图**: 如果适用
7. **额外信息**: 其他相关信息

## 功能建议

### 功能请求模板

1. **功能描述**: 清晰描述你想要的功能
2. **使用场景**: 为什么需要这个功能？
3. **可能的实现**: 你认为如何实现？
4. **替代方案**: 考虑过其他方案吗？
5. **额外信息**: 其他相关信息

## 文档贡献

文档改进同样重要！

- 修正拼写错误
- 改进说明清晰度
- 添加示例代码
- 翻译文档

## 问题和讨论

- **Bug 报告**: 使用 [GitHub Issues](https://github.com/your-repo/issues)
- **功能讨论**: 使用 [GitHub Discussions](https://github.com/your-repo/discussions)
- **安全问题**: 发送邮件到 security@parsify.dev

## 许可证

通过贡献代码，你同意你的贡献将使用与项目相同的 MIT 许可证。

## 致谢

感谢所有为 Parsify.dev 做出贡献的开发者！

---

**祝你贡献愉快！** 🎉

如有任何问题，请随时在 Issues 或 Discussions 中提问。

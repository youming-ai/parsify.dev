# Analytics 使用文档

Parsify.dev 集成了双重分析系统：**Cloudflare Analytics** 和 **Microsoft Clarity**，提供全面的用户行为追踪和性能监控。

## 📊 分析系统概览

### Cloudflare Analytics
- **类型**: 服务器端分析
- **优势**: 
  - 隐私友好（不使用 Cookie）
  - 符合 GDPR 要求
  - 低延迟数据收集
  - 与 Cloudflare Pages 深度集成

### Microsoft Clarity
- **类型**: 客户端分析
- **优势**:
  - 会话回放
  - 热力图分析
  - 用户行为可视化
  - 免费且无流量限制

## 🚀 快速开始

### 1. 基础配置

在 `.env.local` 中配置：

```bash
# Microsoft Clarity
NEXT_PUBLIC_MICROSOFT_CLARITY_ID=tx90x0sxzq

# 功能开关
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
```

### 2. 初始化 Analytics

在根布局中已自动初始化：

```tsx
// src/app/layout.tsx
import { MicrosoftClarityProvider } from '@/components/analytics/microsoft-clarity-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MicrosoftClarityProvider />
        {children}
      </body>
    </html>
  );
}
```

## 🎯 使用 Analytics Hooks

### useAnalytics

基础 Analytics hook，提供所有核心功能。

```tsx
'use client';

import { useAnalytics } from '@/lib/analytics/hooks';

export function MyComponent() {
  const { 
    client, 
    isInitialized,
    trackPageView,
    trackToolUsage,
    trackPerformance,
    trackInteraction,
    trackError
  } = useAnalytics();

  // 追踪页面访问
  const handleNavigate = () => {
    trackPageView('/tools/json-formatter', 'JSON Formatter');
  };

  // 追踪工具使用
  const handleToolUse = () => {
    trackToolUsage({
      toolId: 'json-formatter',
      toolName: 'JSON Formatter',
      action: 'format',
      processingTime: 123,
      inputSize: 1024,
      outputSize: 2048
    });
  };

  // 追踪性能
  const handlePerformance = () => {
    trackPerformance({
      fcp: 1200,
      lcp: 2500,
      fid: 100,
      cls: 0.05,
      ttfb: 400
    });
  };

  // 追踪用户交互
  const handleClick = () => {
    trackInteraction({
      interactionType: 'click',
      elementId: 'format-button',
      metadata: { tool: 'json' }
    });
  };

  // 追踪错误
  const handleError = (error: Error) => {
    trackError(error, {
      component: 'JsonFormatter',
      action: 'format'
    });
  };

  return (
    <div>
      <button onClick={handleNavigate}>Navigate</button>
      <button onClick={handleToolUse}>Use Tool</button>
    </div>
  );
}
```

### usePageViewTracking

自动追踪页面访问。

```tsx
import { usePageViewTracking } from '@/lib/analytics/hooks';

export function MyPage() {
  usePageViewTracking({
    path: '/tools/json-formatter',
    title: 'JSON Formatter Tool'
  });

  return <div>Page Content</div>;
}
```

### useToolUsageTracking

追踪工具使用情况。

```tsx
import { useToolUsageTracking } from '@/lib/analytics/hooks';

export function JsonFormatterTool() {
  const { trackUsage } = useToolUsageTracking({
    toolId: 'json-formatter',
    toolName: 'JSON Formatter'
  });

  const handleFormat = async (json: string) => {
    const startTime = performance.now();
    
    try {
      const formatted = formatJSON(json);
      const duration = performance.now() - startTime;
      
      // 追踪成功使用
      trackUsage({
        action: 'format',
        processingTime: duration,
        inputSize: json.length,
        outputSize: formatted.length
      });
      
      return formatted;
    } catch (error) {
      // 追踪错误
      trackUsage({
        action: 'error',
        error: error.message
      });
      throw error;
    }
  };

  return <div>Tool UI</div>;
}
```

### usePerformanceTracking

追踪性能指标。

```tsx
import { usePerformanceTracking } from '@/lib/analytics/hooks';

export function MyApp() {
  usePerformanceTracking({
    enableCoreWebVitals: true,
    enableResourceTiming: true,
    sampleRate: 1.0 // 100% 采样
  });

  return <div>App Content</div>;
}
```

### useInteractionTracking

追踪用户交互。

```tsx
import { useInteractionTracking } from '@/lib/analytics/hooks';

export function InteractiveComponent() {
  const { trackClick, trackScroll, trackFocus } = useInteractionTracking();

  return (
    <div>
      <button onClick={(e) => trackClick(e.currentTarget.id)}>
        Click Me
      </button>
      
      <div 
        onScroll={() => trackScroll('content-area')}
        onFocus={() => trackFocus('input-field')}
      >
        Interactive Content
      </div>
    </div>
  );
}
```

### useAnalyticsConsent

管理用户隐私同意。

```tsx
import { useAnalyticsConsent } from '@/lib/analytics/hooks';

export function ConsentBanner() {
  const {
    consent,
    hasConsent,
    grantConsent,
    revokeConsent,
    updateConsent
  } = useAnalyticsConsent();

  if (hasConsent()) {
    return null;
  }

  return (
    <div className="consent-banner">
      <p>我们使用分析工具来改善用户体验</p>
      <button onClick={() => grantConsent('full')}>
        接受全部
      </button>
      <button onClick={() => grantConsent('minimal')}>
        仅必要
      </button>
      <button onClick={revokeConsent}>
        拒绝
      </button>
    </div>
  );
}
```

## 🔄 双重分析 (Cloudflare + Clarity)

### useDualAnalytics

同时使用两个分析系统。

```tsx
import { useDualAnalytics } from '@/lib/analytics/hooks';

export function MyComponent() {
  const {
    trackPageView,
    trackToolUsage,
    trackError,
    trackUserInteraction
  } = useDualAnalytics();

  const handleAction = () => {
    // 同时发送到 Cloudflare 和 Clarity
    trackToolUsage({
      toolId: 'json-formatter',
      toolName: 'JSON Formatter',
      action: 'format'
    });
  };

  return <button onClick={handleAction}>Format</button>;
}
```

## 📝 事件类型

### 页面访问事件

```typescript
interface PageViewEvent {
  id: string;
  name: 'page_view';
  timestamp: number;
  url: string;
  title: string;
  path: string;
  referrer?: string;
  timeOnPage?: number;
}
```

### 工具使用事件

```typescript
interface ToolUsageEvent {
  id: string;
  name: 'tool_usage';
  timestamp: number;
  toolId: string;
  toolName: string;
  action: 'execute' | 'format' | 'validate' | 'convert' | 'error';
  processingTime?: number;
  inputSize?: number;
  outputSize?: number;
  error?: string;
}
```

### 性能事件

```typescript
interface PerformanceEvent {
  id: string;
  name: 'performance';
  timestamp: number;
  fcp?: number;  // First Contentful Paint
  lcp?: number;  // Largest Contentful Paint
  fid?: number;  // First Input Delay
  cls?: number;  // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}
```

### 用户交互事件

```typescript
interface UserInteractionEvent {
  id: string;
  name: 'user_interaction';
  timestamp: number;
  interactionType: 'click' | 'scroll' | 'focus' | 'blur' | 'submit';
  elementId?: string;
  metadata?: Record<string, any>;
}
```

## 🎨 自定义事件

### 创建自定义事件

```tsx
import { useAnalytics } from '@/lib/analytics/hooks';

export function CustomEventComponent() {
  const { client } = useAnalytics();

  const trackCustomEvent = (eventName: string, data: any) => {
    client?.trackEvent({
      id: generateEventId(),
      name: eventName,
      timestamp: Date.now(),
      data: data
    });
  };

  const handleAction = () => {
    trackCustomEvent('custom_action', {
      feature: 'new-feature',
      value: 123,
      metadata: { foo: 'bar' }
    });
  };

  return <button onClick={handleAction}>Trigger Event</button>;
}
```

## 📊 数据查询

### Cloudflare Analytics Dashboard

访问 Cloudflare Dashboard:
1. 登录 Cloudflare
2. 选择你的域名
3. 进入 Analytics & Logs
4. 查看 Web Analytics

### Microsoft Clarity Dashboard

访问 Clarity Dashboard:
1. 前往 [https://clarity.microsoft.com/](https://clarity.microsoft.com/)
2. 登录并选择项目
3. 查看会话回放和热力图

## 🔒 隐私与合规

### GDPR 合规

```tsx
import { useAnalyticsConsent } from '@/lib/analytics/hooks';

export function PrivacyCompliantAnalytics() {
  const { consent, grantConsent } = useAnalyticsConsent();

  // 仅在用户同意后追踪
  useEffect(() => {
    if (consent?.analytics) {
      // 启用分析
      initializeAnalytics();
    }
  }, [consent]);

  return (
    <ConsentBanner onAccept={() => grantConsent('full')} />
  );
}
```

### 数据保留策略

- **Cloudflare Analytics**: 90 天
- **Microsoft Clarity**: 用户可配置（默认 30 天）

### 匿名化

```typescript
// Analytics 客户端自动匿名化 IP 地址
const config = {
  privacy: {
    anonymizeIP: true,
    respectDNT: true, // 尊重 Do Not Track
    maskSensitiveData: true
  }
};
```

## 🐛 调试

### 启用调试模式

```tsx
const { client } = useAnalytics({
  debug: true // 在控制台输出所有事件
});
```

### 查看事件队列

```typescript
import { getAnalyticsClient } from '@/lib/analytics/client';

const client = getAnalyticsClient();
console.log('Event queue:', client?.getEventQueue());
console.log('Session info:', client?.getSession());
```

## 📚 最佳实践

1. **事件命名**: 使用清晰、一致的命名规范
2. **采样率**: 高流量网站可降低采样率
3. **批量发送**: 使用批量发送减少请求
4. **错误处理**: 捕获并追踪所有错误
5. **性能**: 使用 `requestIdleCallback` 延迟非关键追踪

## 🔧 高级配置

### 自定义 Analytics 客户端

```typescript
import { createAnalyticsClient } from '@/lib/analytics/client';

const client = createAnalyticsClient({
  enabled: true,
  debug: false,
  batchSize: 10,
  batchInterval: 5000,
  sampleRate: 1.0,
  enablePerformanceMonitoring: true,
  enableInteractionTracking: true,
  privacy: {
    anonymizeIP: true,
    respectDNT: true
  }
});
```

## 📖 相关文档

- [Cloudflare Analytics Docs](https://developers.cloudflare.com/analytics/)
- [Microsoft Clarity Docs](https://docs.microsoft.com/en-us/clarity/)
- [Web Vitals](https://web.dev/vitals/)

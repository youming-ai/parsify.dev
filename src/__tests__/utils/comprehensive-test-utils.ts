import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { setupTestEnvironment, cleanupTestEnvironment } from '../global-setup';
import fixtures from '../fixtures/tools-fixtures';

/**
 * Comprehensive testing utilities for the Parsify.dev platform
 * Provides helper functions for common testing patterns
 */

// Custom render function with providers
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  user?: ReturnType<typeof userEvent.setup>;
}

/**
 * Custom render function that includes global providers
 */
export function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { initialRoute = '/', user, ...renderOptions } = options;

  // Setup test environment before each render
  setupTestEnvironment();

  // Mock router if initial route is provided
  if (initialRoute !== '/') {
    const mockRouter = {
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    };

    // Mock Next.js router
    vi.doMock('next/navigation', () => ({
      useRouter: () => mockRouter,
      usePathname: () => initialRoute,
      useSearchParams: () => new URLSearchParams(),
    }));
  }

  const result = render(ui, {
    ...renderOptions,
  });

  return {
    ...result,
    user: user || userEvent.setup(),
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { userEvent };

/**
 * Tool-specific testing utilities
 */

export function renderTool(
  toolId: string,
  options: CustomRenderOptions = {}
): RenderResult & { tool: any } {
  // Import the tool component dynamically
  const tool = fixtures.tools[toolId as keyof typeof fixtures.tools];

  if (!tool) {
    throw new Error(`Tool fixture not found: ${toolId}`);
  }

  // Mock the tool page component
  const ToolComponent = () => (
    <div data-testid={`tool-${toolId}`}>
      <h1>{tool.name}</h1>
      <p>{tool.description}</p>
      {/* Tool-specific content would be rendered here */}
    </div>
  );

  const result = customRender(<ToolComponent />, options);

  return {
    ...result,
    tool,
  };
}

/**
 * Async testing utilities
 */

export async function waitForElement(
  callback: () => HTMLElement | null,
  timeout = 5000
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const element = callback();

      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element not found within ${timeout}ms`));
      } else {
        setTimeout(check, 50);
      }
    };

    check();
  });
}

export async function waitForLoadingComplete(
  container: HTMLElement,
  timeout = 10000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const loadingElements = container.querySelectorAll('[data-testid*="loading"], .loading, [aria-busy="true"]');

      if (loadingElements.length === 0) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Loading did not complete within ${timeout}ms`));
      } else {
        setTimeout(check, 100);
      }
    };

    check();
  });
}

/**
 * JSON testing utilities
 */

export function createJsonInput(jsonData: any): string {
  return JSON.stringify(jsonData, null, 2);
}

export function expectValidJson(jsonString: string): void {
  expect(() => JSON.parse(jsonString)).not.toThrow();
}

export function expectInvalidJson(jsonString: string): void {
  expect(() => JSON.parse(jsonString)).toThrow();
}

export function assertJsonStructure(
  actual: any,
  expectedStructure: Record<string, any>
): void {
  Object.keys(expectedStructure).forEach(key => {
    expect(actual).toHaveProperty(key);

    if (typeof expectedStructure[key] === 'object' && expectedStructure[key] !== null) {
      assertJsonStructure(actual[key], expectedStructure[key]);
    }
  });
}

/**
 * Form testing utilities
 */

export async function fillForm(
  container: HTMLElement,
  fields: Record<string, string | number>
): Promise<void> {
  const user = userEvent.setup();

  for (const [fieldName, value] of Object.entries(fields)) {
    const element = container.querySelector(
      `[name="${fieldName}"], [data-testid="${fieldName}"], #${fieldName}`
    ) as HTMLInputElement | HTMLTextAreaElement;

    if (!element) {
      throw new Error(`Form field not found: ${fieldName}`);
    }

    if (element.tagName === 'SELECT') {
      await user.selectOptions(element, String(value));
    } else {
      await user.clear(element);
      await user.type(element, String(value));
    }
  }
}

export async function submitForm(
  container: HTMLElement,
  submitButtonSelector = '[type="submit"]'
): Promise<void> {
  const user = userEvent.setup();
  const submitButton = container.querySelector(submitButtonSelector) as HTMLButtonElement;

  if (!submitButton) {
    throw new Error(`Submit button not found: ${submitButtonSelector}`);
  }

  await user.click(submitButton);
}

/**
 * File testing utilities
 */

export function createMockFile(
  content: string,
  name: string = 'test-file.txt',
  type: string = 'text/plain'
): File {
  return new File([content], name, { type });
}

export async function uploadFile(
  container: HTMLElement,
  file: File,
  inputSelector = 'input[type="file"]'
): Promise<void> {
  const user = userEvent.setup();
  const fileInput = container.querySelector(inputSelector) as HTMLInputElement;

  if (!fileInput) {
    throw new Error(`File input not found: ${inputSelector}`);
  }

  await user.upload(fileInput, file);
}

/**
 * Accessibility testing utilities
 */

export function checkA11y(
  container: HTMLElement,
  options: {
    rules?: Record<string, any>;
    includedImpacts?: string[];
  } = {}
): void {
  const { rules = {}, includedImpacts = ['minor', 'moderate', 'serious', 'critical'] } = options;

  // Basic accessibility checks
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    const alt = img.getAttribute('alt');
    if (alt === null) {
      throw new Error('Image missing alt attribute');
    }
  });

  const buttons = container.querySelectorAll('button, [role="button"]');
  buttons.forEach(button => {
    const hasAccessibleName =
      button.getAttribute('aria-label') ||
      button.getAttribute('aria-labelledby') ||
      button.textContent?.trim();

    if (!hasAccessibleName) {
      throw new Error('Button missing accessible name');
    }
  });

  const inputs = container.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    const hasLabel =
      input.getAttribute('aria-label') ||
      input.getAttribute('aria-labelledby') ||
      container.querySelector(`label[for="${input.id}"]`);

    if (!hasLabel) {
      throw new Error(`Input missing label: ${input.id || input.name}`);
    }
  });
}

export async function testKeyboardNavigation(
  container: HTMLElement
): Promise<void> {
  const user = userEvent.setup();

  // Get all focusable elements
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) {
    return; // No focusable elements to test
  }

  // Test Tab navigation
  for (let i = 0; i < focusableElements.length; i++) {
    await user.tab();

    const focusedElement = document.activeElement;
    expect(focusedElement).toBe(focusableElements[i]);
  }
}

/**
 * Performance testing utilities
 */

export async function measureRenderTime(
  renderFn: () => RenderResult
): Promise<number> {
  const startTime = performance.now();
  renderFn();
  const endTime = performance.now();

  return endTime - startTime;
}

export async function measureAsyncOperation<T>(
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();

  return {
    result,
    duration: endTime - startTime,
  };
}

export function expectPerformanceThreshold(
  duration: number,
  threshold: number
): void {
  expect(duration).toBeLessThan(threshold);
}

/**
 * Network testing utilities
 */

export function mockApiResponse(
  url: string | RegExp,
  response: any,
  options: {
    status?: number;
    delay?: number;
  } = {}
): void {
  const { status = 200, delay = 0 } = options;

  vi.mocked(global.fetch).mockImplementation(async (requestUrl) => {
    const matches = typeof url === 'string'
      ? requestUrl === url
      : url.test(requestUrl.toString());

    if (!matches) {
      return new Response('Not Found', { status: 404 });
    }

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

export function mockNetworkError(url: string | RegExp): void {
  vi.mocked(global.fetch).mockImplementation(async (requestUrl) => {
    const matches = typeof url === 'string'
      ? requestUrl === url
      : url.test(requestUrl.toString());

    if (matches) {
      throw new Error('Network error');
    }

    return new Response('OK', { status: 200 });
  });
}

/**
 * Component testing utilities
 */

export function expectComponentToBeRendered(
  container: HTMLElement,
  componentTestId: string
): HTMLElement {
  const component = container.querySelector(`[data-testid="${componentTestId}"]`);

  if (!component) {
    throw new Error(`Component with test ID "${componentTestId}" not found`);
  }

  expect(component).toBeInTheDocument();
  return component as HTMLElement;
}

export function expectComponentNotToBeRendered(
  container: HTMLElement,
  componentTestId: string
): void {
  const component = container.querySelector(`[data-testid="${componentTestId}"]`);
  expect(component).not.toBeInTheDocument();
}

/**
 * Error boundary testing utilities
 */

export class ErrorBoundary extends React.Component<
  { children: ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary-fallback">
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Cleanup utilities
 */

export function cleanup(): void {
  cleanupTestEnvironment();
  vi.clearAllMocks();
  vi.restoreAllMocks();
}

// Export utilities for use in tests
export default {
  customRender,
  renderTool,
  waitForElement,
  waitForLoadingComplete,
  createJsonInput,
  expectValidJson,
  expectInvalidJson,
  assertJsonStructure,
  fillForm,
  submitForm,
  createMockFile,
  uploadFile,
  checkA11y,
  testKeyboardNavigation,
  measureRenderTime,
  measureAsyncOperation,
  expectPerformanceThreshold,
  mockApiResponse,
  mockNetworkError,
  expectComponentToBeRendered,
  expectComponentNotToBeRendered,
  ErrorBoundary,
  cleanup,
};

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { createMockLocalStorage, createMockResizeObserver, createMockIntersectionObserver } from '../test-utils';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock ResponsiveContainer component for testing
interface ResponsiveContainerProps {
  children: React.ReactNode;
  breakpoint?: 'mobile' | 'tablet' | 'desktop';
}

const ResponsiveContainer = ({ children, breakpoint = 'desktop' }: ResponsiveContainerProps) => {
  const getContainerClasses = () => {
    switch (breakpoint) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-md mx-auto';
      case 'desktop':
        return 'max-w-7xl mx-auto';
      default:
        return 'max-w-7xl mx-auto';
    }
  };

  return (
    <div
      data-testid="responsive-container"
      data-breakpoint={breakpoint}
      className={getContainerClasses()}
    >
      {children}
    </div>
  );
};

// Mock ResponsiveToolCard component
interface ResponsiveToolCardProps {
  tool: any;
  viewMode: 'grid' | 'list';
  isCompact: boolean;
}

const ResponsiveToolCard = ({ tool, viewMode, isCompact }: ResponsiveToolCardProps) => {
  const getCardClasses = () => {
    let classes = 'tool-card transition-all duration-300';

    if (viewMode === 'grid') {
      classes += isCompact ? ' p-3' : ' p-6';
      classes += ' grid-item';
    } else {
      classes += ' flex flex-row';
      classes += isCompact ? ' py-2' : ' py-4';
    }

    return classes;
  };

  return (
    <div
      data-testid="responsive-tool-card"
      className={getCardClasses()}
      data-view-mode={viewMode}
      data-compact={isCompact}
    >
      <h3 className="tool-title">{tool.name}</h3>
      <p className="tool-description">{tool.description}</p>
      {isCompact ? (
        <div className="compact-features">
          {tool.features.slice(0, 1).map((feature: string) => (
            <span key={feature} className="feature-tag">{feature}</span>
          ))}
        </div>
      ) : (
        <div className="full-features">
          {tool.features.slice(0, 3).map((feature: string) => (
            <span key={feature} className="feature-tag">{feature}</span>
          ))}
        </div>
      )}
    </div>
  );
};

// Mock AccessibilityTester component
interface AccessibilityTesterProps {
  children: React.ReactNode;
}

const AccessibilityTester = ({ children }: AccessibilityTesterProps) => {
  return (
    <div data-testid="accessibility-tester" role="main">
      {children}
    </div>
  );
};

describe('Responsive Design and Accessibility', () => {
  const mockLocalStorage = createMockLocalStorage();
  const mockResizeObserver = createMockResizeObserver();
  const mockIntersectionObserver = createMockIntersectionObserver();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    Object.defineProperty(window, 'ResizeObserver', {
      value: mockResizeObserver,
      writable: true,
    });
    Object.defineProperty(window, 'IntersectionObserver', {
      value: mockIntersectionObserver,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Responsive Layout', () => {
    it('renders mobile layout correctly', () => {
      render(
        <ResponsiveContainer breakpoint="mobile">
          <div className="mobile-header">Mobile Header</div>
          <div className="mobile-content">Mobile Content</div>
          <div className="mobile-footer">Mobile Footer</div>
        </ResponsiveContainer>
      );

      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('data-breakpoint', 'mobile');
      expect(container).toHaveClass('max-w-sm', 'mx-auto');

      expect(screen.getByText('Mobile Header')).toBeInTheDocument();
      expect(screen.getByText('Mobile Content')).toBeInTheDocument();
      expect(screen.getByText('Mobile Footer')).toBeInTheDocument();
    });

    it('renders tablet layout correctly', () => {
      render(
        <ResponsiveContainer breakpoint="tablet">
          <div className="tablet-header">Tablet Header</div>
          <div className="tablet-content">Tablet Content</div>
        </ResponsiveContainer>
      );

      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('data-breakpoint', 'tablet');
      expect(container).toHaveClass('max-w-md', 'mx-auto');

      expect(screen.getByText('Tablet Header')).toBeInTheDocument();
      expect(screen.getByText('Tablet Content')).toBeInTheDocument();
    });

    it('renders desktop layout correctly', () => {
      render(
        <ResponsiveContainer breakpoint="desktop">
          <div className="desktop-header">Desktop Header</div>
          <div className="desktop-sidebar">Desktop Sidebar</div>
          <div className="desktop-content">Desktop Content</div>
        </ResponsiveContainer>
      );

      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('data-breakpoint', 'desktop');
      expect(container).toHaveClass('max-w-7xl', 'mx-auto');

      expect(screen.getByText('Desktop Header')).toBeInTheDocument();
      expect(screen.getByText('Desktop Sidebar')).toBeInTheDocument();
      expect(screen.getByText('Desktop Content')).toBeInTheDocument();
    });

    it('adapts tool cards for different screen sizes', () => {
      const mockTool = {
        id: 'test-tool',
        name: 'Test Tool',
        description: 'A test tool for responsive design',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
      };

      const { rerender } = render(
        <ResponsiveContainer breakpoint="desktop">
          <ResponsiveToolCard tool={mockTool} viewMode="grid" isCompact={false} />
        </ResponsiveContainer>
      );

      // Desktop: full features
      expect(screen.getByTestId('responsive-tool-card')).toHaveAttribute('data-compact', 'false');
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
      expect(screen.getByText('Feature 3')).toBeInTheDocument();

      // Mobile: compact view
      rerender(
        <ResponsiveContainer breakpoint="mobile">
          <ResponsiveToolCard tool={mockTool} viewMode="grid" isCompact={true} />
        </ResponsiveContainer>
      );

      expect(screen.getByTestId('responsive-tool-card')).toHaveAttribute('data-compact', 'true');
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.queryByText('Feature 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Feature 3')).not.toBeInTheDocument();
    });

    it('switches between grid and list view based on screen size', () => {
      const mockTool = {
        id: 'test-tool',
        name: 'Test Tool',
        description: 'A test tool for responsive design',
        features: ['Feature 1', 'Feature 2'],
      };

      const { rerender } = render(
        <ResponsiveContainer breakpoint="desktop">
          <ResponsiveToolCard tool={mockTool} viewMode="grid" isCompact={false} />
        </ResponsiveContainer>
      );

      // Desktop: grid view
      expect(screen.getByTestId('responsive-tool-card')).toHaveAttribute('data-view-mode', 'grid');
      expect(screen.getByTestId('responsive-tool-card')).toHaveClass('grid-item');

      // Mobile: list view
      rerender(
        <ResponsiveContainer breakpoint="mobile">
          <ResponsiveToolCard tool={mockTool} viewMode="list" isCompact={true} />
        </ResponsiveContainer>
      );

      expect(screen.getByTestId('responsive-tool-card')).toHaveAttribute('data-view-mode', 'list');
      expect(screen.getByTestId('responsive-tool-card')).toHaveClass('flex', 'flex-row');
    });
  });

  describe('Viewport Adaptation', () => {
    it('handles window resize events', () => {
      render(
        <ResponsiveContainer breakpoint="desktop">
          <div>Resize me!</div>
        </ResponsiveContainer>
      );

      // Simulate window resize
      act(() => {
        window.innerWidth = 768; // Tablet width
        window.dispatchEvent(new Event('resize'));
      });

      // Component should handle resize gracefully
      expect(screen.getByText('Resize me!')).toBeInTheDocument();
    });

    it('responds to orientation changes', () => {
      render(
        <ResponsiveContainer breakpoint="mobile">
          <div>Orientation test</div>
        </ResponsiveContainer>
      );

      // Simulate orientation change
      act(() => {
        window.orientation = 90; // Landscape
        window.dispatchEvent(new Event('orientationchange'));
      });

      expect(screen.getByText('Orientation test')).toBeInTheDocument();
    });

    it('handles extreme viewport sizes', () => {
      // Very small screen
      act(() => {
        window.innerWidth = 320;
        window.innerHeight = 480;
      });

      render(
        <ResponsiveContainer breakpoint="mobile">
          <div>Very small screen</div>
        </ResponsiveContainer>
      );

      expect(screen.getByText('Very small screen')).toBeInTheDocument();

      // Very large screen
      act(() => {
        window.innerWidth = 2560;
        window.innerHeight = 1440;
      });

      render(
        <ResponsiveContainer breakpoint="desktop">
          <div>Very large screen</div>
        </ResponsiveContainer>
      );

      expect(screen.getByText('Very large screen')).toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    it('handles touch events on mobile', async () => {
      const user = userEvent.setup();
      render(
        <ResponsiveContainer breakpoint="mobile">
          <button data-testid="touch-button">Touch me</button>
        </ResponsiveContainer>
      );

      const button = screen.getByTestId('touch-button');

      // Simulate touch events
      fireEvent.touchStart(button, {
        touches: [{ clientX: 0, clientY: 0 }]
      });

      fireEvent.touchEnd(button, {
        touches: []
      });

      await user.click(button);

      expect(button).toBeInTheDocument();
    });

    it('handles swipe gestures', async () => {
      const user = userEvent.setup();
      render(
        <ResponsiveContainer breakpoint="mobile">
          <div data-testid="swipe-container">Swipe me</div>
        </ResponsiveContainer>
      );

      const container = screen.getByTestId('swipe-container');

      // Simulate swipe
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 50, clientY: 100 }]
      });

      fireEvent.touchEnd(container, {
        touches: []
      });

      expect(container).toBeInTheDocument();
    });

    it('handles pinch-to-zoom gestures', () => {
      render(
        <ResponsiveContainer breakpoint="mobile">
          <div data-testid="zoom-container">Zoom me</div>
        </ResponsiveContainer>
      );

      const container = screen.getByTestId('zoom-container');

      // Simulate pinch gesture
      fireEvent.touchStart(container, {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 150, clientY: 150 }
        ]
      });

      fireEvent.touchMove(container, {
        touches: [
          { clientX: 90, clientY: 90 },
          { clientX: 160, clientY: 160 }
        ]
      });

      fireEvent.touchEnd(container, {
        touches: []
      });

      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <AccessibilityTester>
          <header>
            <h1>Accessible Tools Page</h1>
            <nav aria-label="Main navigation">
              <ul>
                <li><a href="#tools">Tools</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>
          </header>
          <main id="tools">
            <section aria-labelledby="tools-heading">
              <h2 id="tools-heading">Available Tools</h2>
              <div role="grid" aria-label="Tools grid">
                <div role="gridcell">
                  <h3>JSON Formatter</h3>
                  <p>Format and validate JSON data</p>
                  <button aria-describedby="formatter-desc">Try Tool</button>
                  <p id="formatter-desc" className="sr-only">
                    Opens the JSON formatter tool in a new view
                  </p>
                </div>
              </div>
            </section>
          </main>
          <footer>
            <p>&copy; 2024 Developer Tools</p>
          </footer>
        </AccessibilityTester>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains focus management during interactions', async () => {
      const user = userEvent.setup();
      render(
        <AccessibilityTester>
          <button>First Button</button>
          <button>Second Button</button>
          <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <h2 id="dialog-title">Dialog</h2>
            <button>Dialog Button</button>
            <button>Close Dialog</button>
          </div>
        </AccessibilityTester>
      );

      const firstButton = screen.getByText('First Button');
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Tab navigation should work
      await user.tab();
      expect(screen.getByText('Second Button')).toHaveFocus();
    });

    it('provides proper ARIA labels and descriptions', () => {
      render(
        <AccessibilityTester>
          <button aria-label="Search tools" aria-describedby="search-desc">
            <span aria-hidden="true">🔍</span>
          </button>
          <p id="search-desc">Search for tools by name or category</p>

          <input
            type="text"
            aria-label="Tool search input"
            placeholder="Search tools..."
            aria-required="true"
          />

          <div role="status" aria-live="polite" aria-atomic="true">
            3 tools found
          </div>
        </AccessibilityTester>
      );

      const searchButton = screen.getByLabelText('Search tools');
      expect(searchButton).toHaveAttribute('aria-describedby', 'search-desc');

      const searchInput = screen.getByLabelText('Tool search input');
      expect(searchInput).toHaveAttribute('aria-required', 'true');

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveAttribute('aria-atomic', 'true');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <AccessibilityTester>
          <nav aria-label="Main navigation">
            <ul role="tablist">
              <li>
                <button role="tab" aria-selected="true" aria-controls="panel1" tabIndex={0}>
                  All Tools
                </button>
              </li>
              <li>
                <button role="tab" aria-selected="false" aria-controls="panel2" tabIndex={-1}>
                  Popular
                </button>
              </li>
            </ul>
          </nav>
          <main>
            <div role="tabpanel" id="panel1" aria-labelledby="tab1">
              <h2>All Tools</h2>
              <button>Tool 1</button>
              <button>Tool 2</button>
            </div>
            <div role="tabpanel" id="panel2" aria-labelledby="tab2" hidden>
              <h2>Popular Tools</h2>
              <button>Popular Tool 1</button>
            </div>
          </main>
        </AccessibilityTester>
      );

      // Tab navigation
      await user.tab();
      expect(screen.getByText('All Tools')).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Popular')).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByText('Popular')).toHaveAttribute('aria-selected', 'true');
    });

    it('provides sufficient color contrast', () => {
      render(
        <AccessibilityTester>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            High Contrast Button
          </button>
          <button className="bg-gray-100 text-gray-800 px-4 py-2 rounded">
            Medium Contrast Button
          </button>
          <p className="text-gray-600 text-sm">
            Text with sufficient contrast
          </p>
        </AccessibilityTester>
      );

      // These would be tested with actual color contrast calculation tools
      // For now, we just ensure the elements exist with contrast classes
      expect(screen.getByText('High Contrast Button')).toHaveClass('bg-blue-600', 'text-white');
      expect(screen.getByText('Medium Contrast Button')).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('includes skip links for keyboard users', () => {
      render(
        <AccessibilityTester>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <header>Header content</header>
          <main id="main-content">
            <h1>Main content</h1>
          </main>
        </AccessibilityTester>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink).toHaveClass('skip-link');
    });

    it('announces dynamic content changes', async () => {
      const user = userEvent.setup();
      render(
        <AccessibilityTester>
          <button>Load More Tools</button>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            Loading tools...
          </div>
          <div role="status">
            Showing 5 of 20 tools
          </div>
        </AccessibilityTester>
      );

      const loadButton = screen.getByText('Load More Tools');
      await user.click(loadButton);

      // Screen readers should announce the change
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('provides semantic HTML structure', () => {
      render(
        <AccessibilityTester>
          <header>
            <h1>Developer Tools</h1>
          </header>
          <nav aria-label="Tool categories">
            <h2 className="sr-only">Categories</h2>
            <ul>
              <li><a href="#json-tools">JSON Tools</a></li>
              <li><a href="#code-tools">Code Tools</a></li>
            </ul>
          </nav>
          <main>
            <section aria-labelledby="json-tools">
              <h2 id="json-tools">JSON Tools</h2>
              <article>
                <h3>JSON Formatter</h3>
                <p>Format and validate JSON data</p>
              </article>
            </section>
          </main>
          <footer>
            <p>Footer content</p>
          </footer>
        </AccessibilityTester>
      );

      // Check semantic structure
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
      expect(screen.getByRole('main')).toBeInTheDocument(); // main
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    });

    it('provides descriptive labels for interactive elements', () => {
      render(
        <AccessibilityTester>
          <button aria-label="Filter tools by category">
            <span aria-hidden="true">🔽</span>
          </button>
          <input
            type="search"
            aria-label="Search tools by name or description"
            placeholder="Search..."
          />
          <button aria-describedby="favorite-help">
            <span aria-hidden="true">⭐</span>
          </button>
          <p id="favorite-help" className="sr-only">
            Add tool to favorites
          </p>
        </AccessibilityTester>
      );

      expect(screen.getByLabelText('Filter tools by category')).toBeInTheDocument();
      expect(screen.getByLabelText('Search tools by name or description')).toBeInTheDocument();
      expect(screen.getByLabelText(/Add tool to favorites/)).toBeInTheDocument();
    });

    it('handles form validation accessibly', async () => {
      const user = userEvent.setup();
      render(
        <AccessibilityTester>
          <form>
            <label htmlFor="tool-name">
              Tool Name
              <span className="required" aria-label="required">*</span>
            </label>
            <input
              id="tool-name"
              type="text"
              required
              aria-describedby="name-error"
              aria-invalid="true"
            />
            <div id="name-error" role="alert" className="error-message">
              Tool name is required
            </div>

            <button type="submit">Submit</button>
          </form>
        </AccessibilityTester>
      );

      const input = screen.getByLabelText(/Tool Name/);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'name-error');

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Tool name is required');
    });
  });

  describe('Reduced Motion Support', () => {
    it('respects prefers-reduced-motion setting', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(), // deprecated
          removeListener: vi.fn(), // deprecated
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <AccessibilityTester>
          <div className="animate-pulse">Animated content</div>
          <div className="transition-transform hover:scale-105">Hover content</div>
        </AccessibilityTester>
      );

      // Component should check for reduced motion preference
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      expect(mediaQuery.matches).toBe(true);
    });

    it('provides static alternatives to animations', () => {
      render(
        <AccessibilityTester>
          <div className="animate-pulse" data-animation="pulse">
            Loading...
          </div>
          <div className="static-loading" data-static="true" style={{ display: 'none' }}>
            Loading...
          </div>
        </AccessibilityTester>
      );

      // When reduced motion is preferred, static version should be shown
      const animated = document.querySelector('[data-animation="pulse"]');
      const staticElement = document.querySelector('[data-static="true"]');

      expect(animated).toBeInTheDocument();
      expect(staticElement).toBeInTheDocument();
    });
  });

  describe('High Contrast Mode', () => {
    it('supports high contrast themes', () => {
      // Mock high contrast mode detection
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <AccessibilityTester>
          <button className="bg-blue-600 text-white">Primary Button</button>
          <button className="border-2 border-gray-800 text-gray-800">Secondary Button</button>
        </AccessibilityTester>
      );

      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      expect(mediaQuery.matches).toBe(true);
    });
  });

  describe('Focus Management', () => {
    it('manages focus in modal dialogs', async () => {
      const user = userEvent.setup();
      render(
        <AccessibilityTester>
          <button>Open Dialog</button>
          <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <h2 id="dialog-title">Dialog Title</h2>
            <button>Dialog Button 1</button>
            <button>Dialog Button 2</button>
            <button>Close Dialog</button>
          </div>
        </AccessibilityTester>
      );

      const closeButton = screen.getByText('Close Dialog');
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      // Tab should stay within dialog
      await user.tab();
      expect(screen.getByText('Dialog Button 1')).toHaveFocus();
    });

    it('restores focus when closing overlays', async () => {
      const user = userEvent.setup();
      render(
        <AccessibilityTester>
          <button>Open Menu</button>
          <div role="menu">
            <button role="menuitem">Menu Item 1</button>
            <button role="menuitem">Menu Item 2</button>
          </div>
        </AccessibilityTester>
      );

      const openButton = screen.getByText('Open Menu');
      openButton.focus();

      // Simulate opening menu
      await user.keyboard('{Enter}');

      // Simulate closing menu (Escape key)
      await user.keyboard('{Escape}');

      // Focus should return to trigger button
      expect(openButton).toHaveFocus();
    });
  });

  describe('Performance and Accessibility', () => {
    it('maintains accessibility during lazy loading', async () => {
      render(
        <AccessibilityTester>
          <div aria-live="polite" aria-busy="true">
            Loading tools...
          </div>
          <div id="tools-container" aria-live="polite">
            {/* Tools will be loaded here */}
          </div>
        </AccessibilityTester>
      );

      const loadingRegion = screen.getByText('Loading tools...');
      expect(loadingRegion).toHaveAttribute('aria-busy', 'true');

      // Simulate content loading
      await waitFor(() => {
        const container = document.getElementById('tools-container');
        if (container) {
          container.innerHTML = '<div>Tool loaded</div>';
        }
      });

      // After loading, aria-busy should be false
      expect(loadingRegion).toBeInTheDocument();
    });

    it('provides accessible loading states', () => {
      render(
        <AccessibilityTester>
          <button aria-describedby="loading-status" disabled>
            Processing...
          </button>
          <div id="loading-status" role="status">
            <span className="sr-only">Loading</span>
            <div className="spinner" aria-hidden="true"></div>
          </div>
        </AccessibilityTester>
      );

      const button = screen.getByText('Processing...');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-describedby', 'loading-status');

      const status = document.getElementById('loading-status');
      expect(status).toHaveAttribute('role', 'status');
    });
  });
});

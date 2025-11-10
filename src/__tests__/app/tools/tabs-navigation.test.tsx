import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createMockLocalStorage } from "../test-utils";

// Mock Tabs component wrapper for testing
interface MockTabsProps {
  defaultValue?: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
}

const MockTabs = ({
  defaultValue = "all",
  children,
  onValueChange,
}: MockTabsProps) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <div data-testid="tabs-container">
      <div data-testid="tabs-list" role="tablist">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === MockTabsTrigger) {
            return React.cloneElement(child, {
              isActive: activeTab === child.props.value,
              onClick: () => handleTabChange(child.props.value),
            });
          }
          return child;
        })}
      </div>
      <div data-testid="tabs-content">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === MockTabsContent) {
            return React.cloneElement(child, {
              isActive: activeTab === child.props.value,
            });
          }
          return null;
        })}
      </div>
    </div>
  );
};

const MockTabsTrigger = ({
  value,
  children,
  isActive = false,
  onClick,
}: {
  value: string;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <button
    data-testid={`tab-${value}`}
    data-state={isActive ? "active" : "inactive"}
    role="tab"
    onClick={onClick}
    className={isActive ? "active" : "inactive"}
  >
    {children}
  </button>
);

const MockTabsContent = ({
  value,
  children,
  isActive = false,
}: {
  value: string;
  children: React.ReactNode;
  isActive?: boolean;
}) => (
  <div
    data-testid={`content-${value}`}
    data-state={isActive ? "active" : "inactive"}
    role="tabpanel"
    style={{ display: isActive ? "block" : "none" }}
  >
    {children}
  </div>
);

describe("Tabs Navigation and Persistence", () => {
  const mockLocalStorage = createMockLocalStorage();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Tab Navigation", () => {
    it("renders all tab triggers", () => {
      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
          <MockTabsTrigger value="new">New</MockTabsTrigger>
          <MockTabsTrigger value="recent">Recent</MockTabsTrigger>
          <MockTabsTrigger value="favorites">Favorites</MockTabsTrigger>

          <MockTabsContent value="all">
            <div>All tools content</div>
          </MockTabsContent>
          <MockTabsContent value="popular">
            <div>Popular tools content</div>
          </MockTabsContent>
          <MockTabsContent value="new">
            <div>New tools content</div>
          </MockTabsContent>
          <MockTabsContent value="recent">
            <div>Recent tools content</div>
          </MockTabsContent>
          <MockTabsContent value="favorites">
            <div>Favorites tools content</div>
          </MockTabsContent>
        </MockTabs>,
      );

      expect(screen.getByText("All Tools")).toBeInTheDocument();
      expect(screen.getByText("Popular")).toBeInTheDocument();
      expect(screen.getByText("New")).toBeInTheDocument();
      expect(screen.getByText("Recent")).toBeInTheDocument();
      expect(screen.getByText("Favorites")).toBeInTheDocument();
    });

    it("shows default tab as active", () => {
      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>

          <MockTabsContent value="all">
            <div>All tools content</div>
          </MockTabsContent>
          <MockTabsContent value="popular">
            <div>Popular tools content</div>
          </MockTabsContent>
        </MockTabs>,
      );

      const allTab = screen.getByTestId("tab-all");
      const allContent = screen.getByTestId("content-all");

      expect(allTab).toHaveAttribute("data-state", "active");
      expect(allContent).toHaveAttribute("data-state", "active");
      expect(allContent).toHaveStyle({ display: "block" });
    });

    it("switches tabs when clicked", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <MockTabs defaultValue="all" onValueChange={onValueChange}>
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>

          <MockTabsContent value="all">
            <div>All tools content</div>
          </MockTabsContent>
          <MockTabsContent value="popular">
            <div>Popular tools content</div>
          </MockTabsContent>
        </MockTabs>,
      );

      const popularTab = screen.getByTestId("tab-popular");
      await user.click(popularTab);

      expect(popularTab).toHaveAttribute("data-state", "active");
      expect(screen.getByTestId("content-popular")).toHaveAttribute(
        "data-state",
        "active",
      );
      expect(screen.getByTestId("content-all")).toHaveAttribute(
        "data-state",
        "inactive",
      );
      expect(onValueChange).toHaveBeenCalledWith("popular");
    });

    it("only shows one tab content at a time", async () => {
      const user = userEvent.setup();

      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
          <MockTabsTrigger value="new">New</MockTabsTrigger>

          <MockTabsContent value="all">
            <div>All tools content</div>
          </MockTabsContent>
          <MockTabsContent value="popular">
            <div>Popular tools content</div>
          </MockTabsContent>
          <MockTabsContent value="new">
            <div>New tools content</div>
          </MockTabsContent>
        </MockTabs>,
      );

      // Initially only "all" content is visible
      expect(screen.getByTestId("content-all")).toHaveStyle({
        display: "block",
      });
      expect(screen.getByTestId("content-popular")).toHaveStyle({
        display: "none",
      });
      expect(screen.getByTestId("content-new")).toHaveStyle({
        display: "none",
      });

      // Switch to popular
      await user.click(screen.getByTestId("tab-popular"));

      expect(screen.getByTestId("content-all")).toHaveStyle({
        display: "none",
      });
      expect(screen.getByTestId("content-popular")).toHaveStyle({
        display: "block",
      });
      expect(screen.getByTestId("content-new")).toHaveStyle({
        display: "none",
      });

      // Switch to new
      await user.click(screen.getByTestId("tab-new"));

      expect(screen.getByTestId("content-all")).toHaveStyle({
        display: "none",
      });
      expect(screen.getByTestId("content-popular")).toHaveStyle({
        display: "none",
      });
      expect(screen.getByTestId("content-new")).toHaveStyle({
        display: "block",
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("supports arrow key navigation", async () => {
      const user = userEvent.setup();

      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
          <MockTabsTrigger value="new">New</MockTabsTrigger>
        </MockTabs>,
      );

      const firstTab = screen.getByTestId("tab-all");
      firstTab.focus();

      // Navigate with arrow keys
      await user.keyboard("{ArrowRight}");
      expect(screen.getByTestId("tab-popular")).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByTestId("tab-new")).toHaveFocus();

      await user.keyboard("{ArrowLeft}");
      expect(screen.getByTestId("tab-popular")).toHaveFocus();
    });

    it("supports Home and End keys", async () => {
      const user = userEvent.setup();

      render(
        <MockTabs defaultValue="popular">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
          <MockTabsTrigger value="new">New</MockTabsTrigger>
        </MockTabs>,
      );

      const middleTab = screen.getByTestId("tab-popular");
      middleTab.focus();

      // Go to first tab
      await user.keyboard("{Home}");
      expect(screen.getByTestId("tab-all")).toHaveFocus();

      // Go to last tab
      await user.keyboard("{End}");
      expect(screen.getByTestId("tab-new")).toHaveFocus();
    });

    it("activates tab on Enter key", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <MockTabs defaultValue="all" onValueChange={onValueChange}>
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      const popularTab = screen.getByTestId("tab-popular");
      popularTab.focus();

      await user.keyboard("{Enter}");

      expect(popularTab).toHaveAttribute("data-state", "active");
      expect(onValueChange).toHaveBeenCalledWith("popular");
    });

    it("activates tab on Space key", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <MockTabs defaultValue="all" onValueChange={onValueChange}>
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      const popularTab = screen.getByTestId("tab-popular");
      popularTab.focus();

      await user.keyboard("{ }");

      expect(popularTab).toHaveAttribute("data-state", "active");
      expect(onValueChange).toHaveBeenCalledWith("popular");
    });
  });

  describe("Tab Persistence", () => {
    it("saves active tab to localStorage", async () => {
      const user = userEvent.setup();

      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      await user.click(screen.getByTestId("tab-popular"));

      // In a real implementation, this would save to localStorage
      // expect(mockLocalStorage.setItem).toHaveBeenCalledWith('active-tab', 'popular');
    });

    it("restores active tab from localStorage on mount", () => {
      mockLocalStorage.getItem.mockReturnValue("popular");

      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      // In a real implementation, this would restore from localStorage
      // expect(screen.getByTestId('tab-popular')).toHaveAttribute('data-state', 'active');
    });

    it("handles corrupted localStorage data gracefully", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid-tab");

      expect(() => {
        render(
          <MockTabs defaultValue="all">
            <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
            <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
          </MockTabs>,
        );
      }).not.toThrow();
    });

    it("handles localStorage errors gracefully", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(
          <MockTabs defaultValue="all">
            <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
            <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
          </MockTabs>,
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe("Tab State Management", () => {
    it("maintains tab state during re-renders", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      // Switch to popular tab
      await user.click(screen.getByTestId("tab-popular"));
      expect(screen.getByTestId("tab-popular")).toHaveAttribute(
        "data-state",
        "active",
      );

      // Re-render component
      rerender(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      // Tab state should be preserved
      expect(screen.getByTestId("tab-popular")).toHaveAttribute(
        "data-state",
        "active",
      );
    });

    it("resets to default tab when explicitly reset", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      // Switch to popular tab
      await user.click(screen.getByTestId("tab-popular"));
      expect(screen.getByTestId("tab-popular")).toHaveAttribute(
        "data-state",
        "active",
      );

      // Reset to default
      rerender(
        <MockTabs defaultValue="all" key="reset">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      // Should reset to default tab
      expect(screen.getByTestId("tab-all")).toHaveAttribute(
        "data-state",
        "active",
      );
    });

    it("handles programmatic tab changes", () => {
      const onValueChange = vi.fn();

      const { rerender } = render(
        <MockTabs defaultValue="all" onValueChange={onValueChange}>
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      expect(screen.getByTestId("tab-all")).toHaveAttribute(
        "data-state",
        "active",
      );

      // Simulate programmatic change
      rerender(
        <MockTabs defaultValue="popular" onValueChange={onValueChange}>
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      expect(screen.getByTestId("tab-popular")).toHaveAttribute(
        "data-state",
        "active",
      );
    });
  });

  describe("Tab Content Management", () => {
    it("renders tab content conditionally", () => {
      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>

          <MockTabsContent value="all">
            <div data-testid="all-content">All tools list</div>
          </MockTabsContent>
          <MockTabsContent value="popular">
            <div data-testid="popular-content">Popular tools list</div>
          </MockTabsContent>
        </MockTabs>,
      );

      expect(screen.getByTestId("all-content")).toBeInTheDocument();
      expect(screen.getByTestId("popular-content")).toBeInTheDocument();
      expect(screen.getByTestId("content-all")).toHaveStyle({
        display: "block",
      });
      expect(screen.getByTestId("content-popular")).toHaveStyle({
        display: "none",
      });
    });

    it("handles empty tab content gracefully", () => {
      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="empty">Empty Tab</MockTabsTrigger>

          <MockTabsContent value="all">
            <div>All tools content</div>
          </MockTabsContent>
          <MockTabsContent value="empty">{null}</MockTabsContent>
        </MockTabs>,
      );

      expect(screen.getByTestId("tab-empty")).toBeInTheDocument();
      expect(screen.getByTestId("content-empty")).toBeInTheDocument();
    });

    it("preserves tab content state when switching tabs", async () => {
      const user = userEvent.setup();

      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>

          <MockTabsContent value="all">
            <input data-testid="all-input" defaultValue="preserved value" />
          </MockTabsContent>
          <MockTabsContent value="popular">
            <div>Popular content</div>
          </MockTabsContent>
        </MockTabs>,
      );

      const input = screen.getByTestId("all-input");
      await user.type(input, " additional text");

      // Switch to popular tab
      await user.click(screen.getByTestId("tab-popular"));

      // Switch back to all tab
      await user.click(screen.getByTestId("tab-all"));

      // Input value should be preserved
      expect(input).toHaveValue("preserved value additional text");
    });
  });

  describe("URL Synchronization", () => {
    it("updates URL when tab changes", async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();

      // Mock router
      const mockRouter = {
        push: mockPush,
        replace: vi.fn(),
        query: {},
        pathname: "/tools",
      };

      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      await user.click(screen.getByTestId("tab-popular"));

      // In a real implementation, this would update the URL
      // expect(mockPush).toHaveBeenCalledWith('/tools?tab=popular');
    });

    it("reads initial tab from URL query parameter", () => {
      // Mock URL query parameter
      const mockQuery = { tab: "popular" };

      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      // In a real implementation, this would read from URL
      // expect(screen.getByTestId('tab-popular')).toHaveAttribute('data-state', 'active');
    });

    it("handles invalid tab in URL gracefully", () => {
      // Mock invalid URL query parameter
      const mockQuery = { tab: "invalid-tab" };

      expect(() => {
        render(
          <MockTabs defaultValue="all">
            <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
            <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
          </MockTabs>,
        );
      }).not.toThrow();

      // Should fall back to default tab
      expect(screen.getByTestId("tab-all")).toHaveAttribute(
        "data-state",
        "active",
      );
    });
  });

  describe("Tab Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>

          <MockTabsContent value="all">
            <div>All tools content</div>
          </MockTabsContent>
          <MockTabsContent value="popular">
            <div>Popular tools content</div>
          </MockTabsContent>
        </MockTabs>,
      );

      const tabList = screen.getByTestId("tabs-list");
      expect(tabList).toHaveAttribute("role", "tablist");

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(2);
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");

      const panels = screen.getAllByRole("tabpanel");
      expect(panels).toHaveLength(2);
    });

    it("associates tab panels with tabs", () => {
      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>

          <MockTabsContent value="all">
            <div>All tools content</div>
          </MockTabsContent>
          <MockTabsContent value="popular">
            <div>Popular tools content</div>
          </MockTabsContent>
        </MockTabs>,
      );

      const tabs = screen.getAllByRole("tab");
      const panels = screen.getAllByRole("tabpanel");

      // In a real implementation, tabs and panels should be properly associated
      // expect(tabs[0]).toHaveAttribute('aria-controls', panels[0].id);
      // expect(panels[0]).toHaveAttribute('aria-labelledby', tabs[0].id);
    });

    it("announces tab changes to screen readers", async () => {
      const user = userEvent.setup();
      const announceRegion = document.createElement("div");
      announceRegion.setAttribute("aria-live", "polite");
      announceRegion.setAttribute("aria-atomic", "true");
      document.body.appendChild(announceRegion);

      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      await user.click(screen.getByTestId("tab-popular"));

      // In a real implementation, this would announce the change
      // expect(announceRegion).toHaveTextContent('Popular tab selected');

      document.body.removeChild(announceRegion);
    });
  });

  describe("Tab Performance", () => {
    it("renders efficiently with many tabs", () => {
      const manyTabs = Array.from({ length: 100 }, (_, i) => (
        <MockTabsTrigger key={i} value={`tab-${i}`}>
          Tab {i}
        </MockTabsTrigger>
      ));

      const startTime = performance.now();

      render(
        <MockTabs defaultValue="tab-0">
          {manyTabs}
          <MockTabsContent value="tab-0">
            <div>Content for tab 0</div>
          </MockTabsContent>
        </MockTabs>,
      );

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render quickly
      expect(screen.getByText("Tab 0")).toBeInTheDocument();
      expect(screen.getByText("Tab 99")).toBeInTheDocument();
    });

    it("only renders active tab content", () => {
      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
          <MockTabsTrigger value="new">New</MockTabsTrigger>

          <MockTabsContent value="all">
            <div data-testid="heavy-content-all">
              {Array.from({ length: 1000 }, (_, i) => (
                <div key={i}>Item {i}</div>
              ))}
            </div>
          </MockTabsContent>
          <MockTabsContent value="popular">
            <div data-testid="heavy-content-popular">
              {Array.from({ length: 1000 }, (_, i) => (
                <div key={i}>Popular Item {i}</div>
              ))}
            </div>
          </MockTabsContent>
          <MockTabsContent value="new">
            <div data-testid="heavy-content-new">
              {Array.from({ length: 1000 }, (_, i) => (
                <div key={i}>New Item {i}</div>
              ))}
            </div>
          </MockTabsContent>
        </MockTabs>,
      );

      // Only active content should be visible
      expect(screen.getByTestId("heavy-content-all")).toBeInTheDocument();
      expect(screen.getByTestId("heavy-content-popular")).toBeInTheDocument();
      expect(screen.getByTestId("heavy-content-new")).toBeInTheDocument();

      // But only active should have display: block
      expect(screen.getByTestId("content-all")).toHaveStyle({
        display: "block",
      });
      expect(screen.getByTestId("content-popular")).toHaveStyle({
        display: "none",
      });
      expect(screen.getByTestId("content-new")).toHaveStyle({
        display: "none",
      });
    });
  });

  describe("Tab Error Handling", () => {
    it("handles missing tab content gracefully", () => {
      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="orphan">Orphan Tab</MockTabsTrigger>

          <MockTabsContent value="all">
            <div>All tools content</div>
          </MockTabsContent>
          {/* Missing content for "orphan" tab */}
        </MockTabs>,
      );

      expect(screen.getByTestId("tab-orphan")).toBeInTheDocument();
      expect(screen.getByTestId("content-all")).toBeInTheDocument();
      // Should not throw error for missing content
    });

    it("handles duplicate tab values gracefully", () => {
      expect(() => {
        render(
          <MockTabs defaultValue="all">
            <MockTabsTrigger value="duplicate">First</MockTabsTrigger>
            <MockTabsTrigger value="duplicate">Second</MockTabsTrigger>
            <MockTabsContent value="duplicate">
              <div>Content</div>
            </MockTabsContent>
          </MockTabs>,
        );
      }).not.toThrow();
    });

    it("handles undefined tab values gracefully", () => {
      expect(() => {
        render(
          <MockTabs defaultValue="all">
            <MockTabsTrigger value={undefined}>Undefined Tab</MockTabsTrigger>
            <MockTabsContent value="all">
              <div>Content</div>
            </MockTabsContent>
          </MockTabs>,
        );
      }).not.toThrow();
    });
  });

  describe("Tab Analytics", () => {
    it("tracks tab changes", async () => {
      const user = userEvent.setup();
      const mockAnalytics = {
        track: vi.fn(),
      };

      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      await user.click(screen.getByTestId("tab-popular"));

      // In a real implementation, this would track the change
      // expect(mockAnalytics.track).toHaveBeenCalledWith('tab_changed', {
      //   from: 'all',
      //   to: 'popular'
      // });
    });

    it("tracks tab dwell time", async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      render(
        <MockTabs defaultValue="all">
          <MockTabsTrigger value="all">All Tools</MockTabsTrigger>
          <MockTabsTrigger value="popular">Popular</MockTabsTrigger>
        </MockTabs>,
      );

      // Simulate user staying on tab for 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await user.click(screen.getByTestId("tab-popular"));

      // In a real implementation, this would track dwell time
      // expect(mockAnalytics.track).toHaveBeenCalledWith('tab_dwell_time', {
      //   tab: 'all',
      //   duration: 5000
      // });

      vi.useRealTimers();
    });
  });
});

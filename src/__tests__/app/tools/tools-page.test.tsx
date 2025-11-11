import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToolsPage from "@/app/tools/page";
import {
  mockTools,
  mockSearchQueries,
  mockSearchStates,
} from "../../utils/test-data";
import { customRender, testPatterns } from "../../utils/test-utils";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/tools",
}));

// Mock tools data
vi.mock("@/data/tools-data", () => ({
  toolsData: mockTools,
}));

// Mock category utils
vi.mock("@/lib/category-utils", () => ({
  getAllCategories: () => [
    {
      id: "json-processing",
      name: "JSON Processing",
      slug: "json",
      icon: "FileJson",
      description: "JSON processing tools",
      color: "blue",
      featured: true,
      toolCount: 2,
    },
    {
      id: "code-execution",
      name: "Code Execution",
      slug: "code",
      icon: "Terminal",
      description: "Code execution tools",
      color: "green",
      featured: false,
      toolCount: 1,
    },
  ],
  getFeaturedCategories: () => [
    {
      id: "json-processing",
      name: "JSON Processing",
      slug: "json",
      icon: "FileJson",
      description: "JSON processing tools",
      color: "blue",
      featured: true,
      toolCount: 2,
    },
  ],
  getToolsByCategory: (category: string) => {
    return mockTools.filter((tool) => tool.category === category);
  },
  generateBreadcrumb: () => [
    { label: "Home", href: "/" },
    { label: "Tools", href: "/tools" },
  ],
  sortTools: (tools: any[], sortBy: string) => {
    return [...tools].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "popularity":
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        case "newest":
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        default:
          return 0;
      }
    });
  },
}));

describe("ToolsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });

    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Page Rendering", () => {
    it("should render the main page structure", () => {
      customRender(<ToolsPage />);

      expect(screen.getByText("Parsify.dev")).toBeInTheDocument();
      expect(
        screen.getByText("Professional Developer Tools"),
      ).toBeInTheDocument();
      expect(screen.getByText("Developer Tools")).toBeInTheDocument();
    });

    it("should render hero section", () => {
      customRender(<ToolsPage />);

      expect(
        screen.getByText("Professional Developer Tools"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Comprehensive suite of browser-based developer tools/,
        ),
      ).toBeInTheDocument();
    });

    it("should render stats badges", () => {
      customRender(<ToolsPage />);

      expect(
        screen.getByText(`${mockTools.length}+ Tools`),
      ).toBeInTheDocument();
      expect(screen.getByText("100% Client-side")).toBeInTheDocument();
      expect(screen.getByText("No Data Tracking")).toBeInTheDocument();
    });

    it("should render search component", () => {
      customRender(<ToolsPage />);

      expect(
        screen.getByPlaceholderText("Search tools..."),
      ).toBeInTheDocument();
    });

    it("should render featured categories section", () => {
      customRender(<ToolsPage />);

      expect(screen.getByText("Featured Categories")).toBeInTheDocument();
      expect(screen.getByText("JSON Processing")).toBeInTheDocument();
    });

    it("should render all categories section", () => {
      customRender(<ToolsPage />);

      expect(screen.getByText("All Categories")).toBeInTheDocument();
      expect(screen.getByText("Code Execution")).toBeInTheDocument();
    });

    it("should render footer", () => {
      customRender(<ToolsPage />);

      expect(
        screen.getByText("© 2024 Parsify.dev. All rights reserved."),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Professional developer tools that respect your privacy.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Header Components", () => {
    it("should render logo and site name", () => {
      customRender(<ToolsPage />);

      expect(screen.getByText("Parsify.dev")).toBeInTheDocument();
      expect(screen.getByText("Developer Tools")).toBeInTheDocument();
    });

    it("should render mobile controls", () => {
      customRender(<ToolsPage />);

      // Mobile sort button
      expect(screen.getByLabelText("Sort options")).toBeInTheDocument();
      // Filter toggle
      expect(screen.getByLabelText("Toggle filters")).toBeInTheDocument();
      // Dark mode toggle
      expect(screen.getByLabelText("Toggle dark mode")).toBeInTheDocument();
    });

    it("should render breadcrumb navigation", () => {
      customRender(<ToolsPage />);

      // Breadcrumb should be visible on desktop (hidden on mobile)
      const breadcrumb = document.querySelector(".hidden.sm\\:block");
      expect(breadcrumb).toBeInTheDocument();
    });

    it("should render desktop sort options", () => {
      customRender(<ToolsPage />);

      // Sort options should be hidden on mobile, visible on desktop
      const sortOptions = document.querySelector(".hidden.md\\:flex");
      expect(sortOptions).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should handle search input", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const searchInput = screen.getByPlaceholderText("Search tools...");
      await user.type(searchInput, "json");

      // Should show search results
      await waitFor(() => {
        expect(screen.getByText(/Results for "json"/)).toBeInTheDocument();
      });
    });

    it("should show search results when query is entered", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const searchInput = screen.getByPlaceholderText("Search tools...");
      await user.type(searchInput, "json");

      await waitFor(() => {
        expect(screen.getByText(/Results for "json"/)).toBeInTheDocument();
        expect(screen.getByText(/of .* tools/)).toBeInTheDocument();
      });
    });

    it("should show tool cards in search results", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const searchInput = screen.getByPlaceholderText("Search tools...");
      await user.type(searchInput, "json");

      await waitFor(() => {
        const toolCards = document.querySelectorAll(".hover\\:shadow-lg");
        expect(toolCards.length).toBeGreaterThan(0);
      });
    });

    it("should navigate to tool when clicked", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      // Search for a tool first
      const searchInput = screen.getByPlaceholderText("Search tools...");
      await user.type(searchInput, "json");

      await waitFor(() => {
        const toolCard = screen.getByText("JSON Formatter");
        expect(toolCard).toBeInTheDocument();
      });

      const toolCard = screen
        .getByText("JSON Formatter")
        .closest(".cursor-pointer");
      await user.click(toolCard!);

      expect(mockPush).toHaveBeenCalledWith("/tools/json/formatter");
    });

    it("should clear search when query is empty", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const searchInput = screen.getByPlaceholderText("Search tools...");
      await user.type(searchInput, "json");
      await user.clear(searchInput);

      // Should show default view again
      await waitFor(() => {
        expect(screen.getByText("Featured Categories")).toBeInTheDocument();
      });
    });
  });

  describe("Filter Functionality", () => {
    it("should open filters when toggle button is clicked", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const filterToggle = screen.getByLabelText("Toggle filters");
      await user.click(filterToggle);

      // Should show mobile filter overlay
      const filterOverlay = document.querySelector(".fixed.inset-0");
      expect(filterOverlay).toBeInTheDocument();
    });

    it("should close filters when overlay is clicked", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const filterToggle = screen.getByLabelText("Toggle filters");
      await user.click(filterToggle);

      const filterOverlay = document.querySelector(".fixed.inset-0");
      await user.click(filterOverlay!);

      // Overlay should be removed
      await waitFor(() => {
        expect(
          document.querySelector(".fixed.inset-0"),
        ).not.toBeInTheDocument();
      });
    });

    it("should show active filter count badge", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      // Apply a filter
      const filterToggle = screen.getByLabelText("Toggle filters");
      await user.click(filterToggle);

      // Find and click a category filter
      const categoryCheckbox = screen.getByLabelText(/JSON Processing/);
      await user.click(categoryCheckbox);

      // Should show filter count badge
      await waitFor(() => {
        const badge = screen.getByText("1");
        expect(badge).toBeInTheDocument();
      });
    });

    it("should highlight filter toggle when filters are active", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      // Apply a filter
      const filterToggle = screen.getByLabelText("Toggle filters");
      await user.click(filterToggle);

      const categoryCheckbox = screen.getByLabelText(/JSON Processing/);
      await user.click(categoryCheckbox);

      // Close filter panel
      const closeButton = screen.getByLabelText("Close");
      await user.click(closeButton);

      // Filter toggle should be highlighted
      expect(filterToggle).toHaveClass(/text-blue-600/);
    });
  });

  describe("Sorting Functionality", () => {
    it("should show mobile sort dropdown when button is clicked", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const sortButton = screen.getByLabelText("Sort options");
      await user.click(sortButton);

      // Should show mobile sort options
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Popular")).toBeInTheDocument();
      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("should change sort order when sort option is clicked", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const sortButton = screen.getByLabelText("Sort options");
      await user.click(sortButton);

      const popularSort = screen.getByText("Popular");
      await user.click(popularSort);

      // Should close mobile sort and apply sorting
      await waitFor(() => {
        expect(screen.queryByText("Name")).not.toBeInTheDocument();
      });
    });

    it("should highlight active sort option", async () => {
      customRender(<ToolsPage />);

      // Name sort should be active by default
      const nameSort = screen.getByText("Name");
      expect(nameSort).toBeInTheDocument();
    });
  });

  describe("Dark Mode", () => {
    it("should toggle dark mode when button is clicked", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const darkModeToggle = screen.getByLabelText("Toggle dark mode");
      await user.click(darkModeToggle);

      // Should add dark class to document
      expect(document.documentElement).toHaveClass("dark");
      expect(localStorage.setItem).toHaveBeenCalledWith("darkMode", "true");
    });

    it("should toggle back to light mode", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const darkModeToggle = screen.getByLabelText("Toggle dark mode");

      // Enable dark mode
      await user.click(darkModeToggle);

      // Disable dark mode
      await user.click(darkModeToggle);

      expect(document.documentElement).not.toHaveClass("dark");
      expect(localStorage.setItem).toHaveBeenCalledWith("darkMode", "false");
    });

    it("should detect system dark mode preference", () => {
      // Mock system dark mode
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      customRender(<ToolsPage />);

      // Should detect system preference and apply dark mode
      expect(document.documentElement).toHaveClass("dark");
    });
  });

  describe("Category Overview", () => {
    it("should render category cards", () => {
      customRender(<ToolsPage />);

      expect(screen.getByText("JSON Processing")).toBeInTheDocument();
      expect(screen.getByText("Code Execution")).toBeInTheDocument();
    });

    it("should show category tool counts", () => {
      customRender(<ToolsPage />);

      expect(screen.getByText("2 tools")).toBeInTheDocument(); // JSON Processing
      expect(screen.getByText("1 tools")).toBeInTheDocument(); // Code Execution
    });

    it("should show featured star for featured categories", () => {
      customRender(<ToolsPage />);

      const featuredStar = document.querySelector(".text-yellow-500");
      expect(featuredStar).toBeInTheDocument();
    });

    it('should navigate to category when "View All" is clicked', async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const viewAllButton = screen.getByText("View All");
      await user.click(viewAllButton);

      expect(mockPush).toHaveBeenCalledWith("/tools/json");
    });

    it("should limit displayed tools in category overview", () => {
      customRender(<ToolsPage />);

      // Should show limited number of tools (4 for featured, 8 for regular)
      const toolCards = document.querySelectorAll(".hover\\:shadow-lg");
      expect(toolCards.length).toBeGreaterThan(0);
      expect(toolCards.length).toBeLessThanOrEqual(12); // Total limit
    });

    it('should show "View all X tools" link when category has more tools', () => {
      customRender(<ToolsPage />);

      const viewAllLink = screen.getByText(/View all .* tools in/);
      expect(viewAllLink).toBeInTheDocument();
    });
  });

  describe("Tool Cards", () => {
    it("should render tool information correctly", () => {
      customRender(<ToolsPage />);

      expect(screen.getByText("JSON Formatter")).toBeInTheDocument();
      expect(screen.getByText("Code Executor")).toBeInTheDocument();
    });

    it("should show tool badges", () => {
      customRender(<ToolsPage />);

      // Should show difficulty badges
      expect(screen.getByText("beginner")).toBeInTheDocument();
      expect(screen.getByText("intermediate")).toBeInTheDocument();

      // Should show processing type badges
      expect(screen.getAllByText("client-side")).toHaveLength(mockTools.length);
    });

    it("should show new and popular badges", () => {
      customRender(<ToolsPage />);

      // Should show new badge
      expect(screen.getByText("New")).toBeInTheDocument();

      // Should show popular badge
      expect(screen.getAllByText("Popular")).toHaveLength(3); // 3 popular tools
    });

    it("should show tool tags", () => {
      customRender(<ToolsPage />);

      expect(screen.getByText("json")).toBeInTheDocument();
      expect(screen.getByText("formatter")).toBeInTheDocument();
      expect(screen.getByText("validator")).toBeInTheDocument();
    });

    it("should limit displayed tags", () => {
      customRender(<ToolsPage />);

      // Should show "+X" for tools with more than 3 tags
      const moreTagsBadges = screen.getAllByText(/\+\d/);
      expect(moreTagsBadges.length).toBeGreaterThan(0);
    });

    it("should navigate to tool when card is clicked", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const toolCard = screen
        .getByText("JSON Formatter")
        .closest(".cursor-pointer");
      await user.click(toolCard!);

      expect(mockPush).toHaveBeenCalledWith("/tools/json/formatter");
    });
  });

  describe("Responsive Design", () => {
    it("should hide desktop elements on mobile", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      customRender(<ToolsPage />);

      // Mobile elements should be visible
      expect(screen.getByLabelText("Sort options")).toBeInTheDocument();
      expect(screen.getByLabelText("Toggle filters")).toBeInTheDocument();

      // Desktop sort options should be hidden
      const desktopSort = document.querySelector(".hidden.md\\:flex");
      expect(desktopSort).toBeInTheDocument();
    });

    it("should show mobile filter overlay", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const filterToggle = screen.getByLabelText("Toggle filters");
      await user.click(filterToggle);

      const filterOverlay = document.querySelector(".xl\\:hidden");
      expect(filterOverlay).toBeInTheDocument();
    });

    it("should adapt layout for different screen sizes", () => {
      customRender(<ToolsPage />);

      // Should have responsive grid classes
      const grid = document.querySelector(".grid.grid-cols-1.sm\\:grid-cols-2");
      expect(grid).toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("should render all footer sections", () => {
      customRender(<ToolsPage />);

      expect(screen.getByText("Tools")).toBeInTheDocument();
      expect(screen.getByText("Resources")).toBeInTheDocument();
      expect(screen.getByText("Company")).toBeInTheDocument();
    });

    it("should render footer links", () => {
      customRender(<ToolsPage />);

      expect(screen.getByText("All Tools")).toBeInTheDocument();
      expect(screen.getByText("Documentation")).toBeInTheDocument();
      expect(screen.getByText("About")).toBeInTheDocument();
    });

    it("should have proper link structure", () => {
      customRender(<ToolsPage />);

      const links = document.querySelectorAll("a[href]");
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe("Active Filters Display", () => {
    it("should show active filters when filters are applied", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      // Apply filters
      const filterToggle = screen.getByLabelText("Toggle filters");
      await user.click(filterToggle);

      const categoryCheckbox = screen.getByLabelText(/JSON Processing/);
      await user.click(categoryCheckbox);

      // Should show active filters
      await waitFor(() => {
        expect(screen.getByText("Active filters:")).toBeInTheDocument();
      });
    });

    it("should allow removing individual filters", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      // Apply filters
      const filterToggle = screen.getByLabelText("Toggle filters");
      await user.click(filterToggle);

      const categoryCheckbox = screen.getByLabelText(/JSON Processing/);
      await user.click(categoryCheckbox);

      // Close filter panel
      const closeButton = screen.getByLabelText("Close");
      await user.click(closeButton);

      // Remove filter
      const removeButton = screen.getByLabelText("Close");
      await user.click(removeButton);

      // Should update filters
      await waitFor(() => {
        expect(screen.queryByText("Active filters:")).not.toBeInTheDocument();
      });
    });

    it("should allow clearing all filters", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      // Apply multiple filters
      const filterToggle = screen.getByLabelText("Toggle filters");
      await user.click(filterToggle);

      const categoryCheckbox = screen.getByLabelText(/JSON Processing/);
      await user.click(categoryCheckbox);

      // Close filter panel
      const closeButton = screen.getByLabelText("Close");
      await user.click(closeButton);

      // Clear all filters
      const clearAllButton = screen.getByText("Clear All");
      await user.click(clearAllButton);

      // Should clear all filters
      await waitFor(() => {
        expect(screen.queryByText("Active filters:")).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      customRender(<ToolsPage />);

      const h1 = screen.getByRole("heading", { level: 1 });
      const h2 = screen.getAllByRole("heading", { level: 2 });
      const h3 = screen.getAllByRole("heading", { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2.length).toBeGreaterThan(0);
      expect(h3.length).toBeGreaterThan(0);
    });

    it("should have proper ARIA labels", () => {
      customRender(<ToolsPage />);

      expect(screen.getByLabelText("Sort options")).toBeInTheDocument();
      expect(screen.getByLabelText("Toggle filters")).toBeInTheDocument();
      expect(screen.getByLabelText("Toggle dark mode")).toBeInTheDocument();
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement?.tagName).toBe("INPUT"); // Search input
    });

    it("should have proper button labels", () => {
      customRender(<ToolsPage />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-label");
      });
    });
  });

  describe("Performance", () => {
    it("should render efficiently with many tools", () => {
      const manyTools = Array(100)
        .fill(mockTools[0])
        .map((tool, index) => ({
          ...tool,
          id: `${tool.id}-${index}`,
          name: `${tool.name} ${index}`,
        }));

      vi.doMock("@/data/tools-data", () => ({
        toolsData: manyTools,
      }));

      customRender(<ToolsPage />);

      expect(
        screen.getByText("Professional Developer Tools"),
      ).toBeInTheDocument();
    });

    it("should handle rapid search input", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      const searchInput = screen.getByPlaceholderText("Search tools...");

      // Type quickly
      for (const char of "json formatter") {
        await user.keyboard(char);
      }

      // Should handle rapid input without crashing
      expect(searchInput).toHaveValue("json formatter");
    });
  });

  describe("Error Handling", () => {
    it("should handle navigation errors gracefully", async () => {
      const user = userEvent.setup();
      mockPush.mockImplementation(() => {
        throw new Error("Navigation failed");
      });

      customRender(<ToolsPage />);

      const toolCard = screen
        .getByText("JSON Formatter")
        .closest(".cursor-pointer");

      expect(async () => {
        await user.click(toolCard!);
      }).not.toThrow();
    });

    it("should handle localStorage errors", () => {
      const localStorageMock = {
        getItem: vi.fn(() => {
          throw new Error("Storage error");
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      expect(() => {
        customRender(<ToolsPage />);
      }).not.toThrow();
    });

    it("should handle missing tools data", () => {
      vi.doMock("@/data/tools-data", () => ({
        toolsData: [],
      }));

      customRender(<ToolsPage />);

      expect(
        screen.getByText("Professional Developer Tools"),
      ).toBeInTheDocument();
      expect(screen.getByText("0+ Tools")).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("should integrate search and filters workflow", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      // Search for tools
      const searchInput = screen.getByPlaceholderText("Search tools...");
      await user.type(searchInput, "json");

      await waitFor(() => {
        expect(screen.getByText(/Results for "json"/)).toBeInTheDocument();
      });

      // Apply filters
      const filterToggle = screen.getByLabelText("Toggle filters");
      await user.click(filterToggle);

      const categoryCheckbox = screen.getByLabelText(/JSON Processing/);
      await user.click(categoryCheckbox);

      // Should show filtered search results
      await waitFor(() => {
        expect(screen.getByText(/Results for "json"/)).toBeInTheDocument();
        expect(screen.getByText(/\(Filtered\)/)).toBeInTheDocument();
      });
    });

    it("should maintain state during interactions", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      // Enable dark mode
      const darkModeToggle = screen.getByLabelText("Toggle dark mode");
      await user.click(darkModeToggle);

      // Search for tools
      const searchInput = screen.getByPlaceholderText("Search tools...");
      await user.type(searchInput, "json");

      // Should maintain dark mode
      expect(document.documentElement).toHaveClass("dark");

      // Should show search results
      await waitFor(() => {
        expect(screen.getByText(/Results for "json"/)).toBeInTheDocument();
      });
    });

    it("should handle complete user journey", async () => {
      const user = userEvent.setup();
      customRender(<ToolsPage />);

      // 1. User searches for tools
      const searchInput = screen.getByPlaceholderText("Search tools...");
      await user.type(searchInput, "json");

      await waitFor(() => {
        expect(screen.getByText(/Results for "json"/)).toBeInTheDocument();
      });

      // 2. User clicks on a tool
      const toolCard = screen
        .getByText("JSON Formatter")
        .closest(".cursor-pointer");
      await user.click(toolCard!);

      // 3. Should navigate to tool page
      expect(mockPush).toHaveBeenCalledWith("/tools/json/formatter");
    });
  });
});

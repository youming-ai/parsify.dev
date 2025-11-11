/**
 * Page Object Model for Tools Homepage
 * Encapsulates all interactions and locators for the tools homepage
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { TOOL_CATEGORIES, SEARCH_QUERIES, VIEWPORTS } from '../fixtures/tools-data';

export class ToolsHomePage {
  readonly page: Page;

  // Header locators
  readonly header: Locator;
  readonly logo: Locator;
  readonly siteTitle: Locator;
  readonly siteSubtitle: Locator;
  readonly darkModeToggle: Locator;
  readonly searchInput: Locator;
  readonly filterToggle: Locator;
  readonly mobileSortToggle: Locator;

  // Navigation locators
  readonly breadcrumb: Locator;
  readonly categoryNavigation: Locator;
  readonly tabNavigation: Locator;
  readonly activeFilters: Locator;
  readonly clearAllFiltersButton: Locator;

  // Sort controls
  readonly sortOptions: Locator;
  readonly viewModeButtons: Locator;

  // Content locators
  readonly heroSection: Locator;
  readonly featuredCategories: Locator;
  readonly allCategories: Locator;
  readonly categorySections: Locator;
  readonly toolCards: Locator;
  readonly toolCard: (index: number) => Locator;

  // Tool card elements
  readonly getToolName: (card: Locator) => Locator;
  readonly getToolDescription: (card: Locator) => Locator;
  readonly getToolTags: (card: Locator) => Locator;
  readonly getToolCategory: (card: Locator) => Locator;
  readonly getToolDifficulty: (card: Locator) => Locator;
  readonly getTryToolButton: (card: Locator) => Locator;
  readonly getFavoriteButton: (card: Locator) => Locator;
  readonly getNewBadge: (card: Locator) => Locator;
  readonly getPopularBadge: (card: Locator) => Locator;

  // Filter locators
  readonly categoryFilters: Locator;
  readonly difficultyFilters: Locator;
  readonly processingTypeFilters: Locator;
  readonly tagFilters: Locator;

  // Empty states
  readonly noResultsMessage: Locator;
  readonly emptySearchMessage: Locator;
  readonly loadingIndicator: Locator;

  // Footer locators
  readonly footer: Locator;
  readonly footerLinks: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize header locators
    this.header = page.locator('header');
    this.logo = page.locator('[data-testid="logo"], .w-8.h-8.bg-blue-500');
    this.siteTitle = page.locator('h1');
    this.siteSubtitle = page.locator('p:has-text("Developer Tools")');
    this.darkModeToggle = page.locator('button[aria-label*="dark mode"], button:has-text("dark")');
    this.searchInput = page.locator('input[placeholder*="Search tools"], input[type="search"]');
    this.filterToggle = page.locator('button[aria-label*="filter"], button:has([data-testid="filter-icon"])');
    this.mobileSortToggle = page.locator('button[aria-label*="sort"], button:has([data-testid="sort-icon"])');

    // Initialize navigation locators
    this.breadcrumb = page.locator('[data-testid="breadcrumb"], nav[aria-label="breadcrumb"]');
    this.categoryNavigation = page.locator('[data-testid="category-navigation"]');
    this.tabNavigation = page.locator('[role="tablist"]');
    this.activeFilters = page.locator('[data-testid="active-filters"]');
    this.clearAllFiltersButton = page.locator('button:has-text("Clear all filters")');

    // Initialize sort controls
    this.sortOptions = page.locator('select[name="sort"], [data-testid="sort-options"]');
    this.viewModeButtons = page.locator('[data-testid="view-mode"]');

    // Initialize content locators
    this.heroSection = page.locator('[data-testid="hero-section"], .text-center');
    this.featuredCategories = page.locator('[data-testid="featured-categories"]');
    this.allCategories = page.locator('[data-testid="all-categories"]');
    this.categorySections = page.locator('[data-testid="category-section"]');
    this.toolCards = page.locator('[data-testid="tool-card"], .card:has(h3)');
    this.toolCard = (index: number) => this.toolCards.nth(index);

    // Initialize tool card element getters
    this.getToolName = (card: Locator) => card.locator('h3, [data-testid="tool-name"]');
    this.getToolDescription = (card: Locator) => card.locator('p, [data-testid="tool-description"]');
    this.getToolTags = (card: Locator) => card.locator('[data-testid="tool-tag"], .badge');
    this.getToolCategory = (card: Locator) => card.locator('[data-testid="tool-category"]');
    this.getToolDifficulty = (card: Locator) => card.locator('[data-testid="tool-difficulty"]');
    this.getTryToolButton = (card: Locator) => card.locator('button:has-text("Try Tool"), button:has-text("Open")');
    this.getFavoriteButton = (card: Locator) => card.locator('button[aria-label*="favorite"], button:has([data-testid="favorite-icon"])');
    this.getNewBadge = (card: Locator) => card.locator('.badge:has-text("New")');
    this.getPopularBadge = (card: Locator) => card.locator('.badge:has-text("Popular")');

    // Initialize filter locators
    this.categoryFilters = page.locator('[data-testid="category-filter"]');
    this.difficultyFilters = page.locator('[data-testid="difficulty-filter"]');
    this.processingTypeFilters = page.locator('[data-testid="processing-type-filter"]');
    this.tagFilters = page.locator('[data-testid="tag-filter"]');

    // Initialize empty states
    this.noResultsMessage = page.locator('[data-testid="no-results"], :text("No tools found")');
    this.emptySearchMessage = page.locator('[data-testid="empty-search"]');
    this.loadingIndicator = page.locator('[data-testid="loading"], .loading');

    // Initialize footer locators
    this.footer = page.locator('footer');
    this.footerLinks = page.locator('footer a');
  }

  // Navigation methods
  async goto(): Promise<void> {
    await this.page.goto('/tools');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.searchInput.waitFor({ state: 'visible' });
    await this.toolCards.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  // Search methods
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Wait for debounced search
    await this.page.waitForTimeout(300);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  async getSearchValue(): Promise<string> {
    return await this.searchInput.inputValue();
  }

  // Filter methods
  async toggleFilters(): Promise<void> {
    await this.filterToggle.click();
    await this.page.waitForTimeout(200);
  }

  async selectCategory(category: string): Promise<void> {
    const categoryButton = this.categoryFilters.locator(`button:has-text("${category}")`);
    await categoryButton.click();
    await this.page.waitForTimeout(300);
  }

  async selectDifficulty(difficulty: string): Promise<void> {
    const difficultyButton = this.difficultyFilters.locator(`button:has-text("${difficulty}")`);
    if (await difficultyButton.count() > 0) {
      await difficultyButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  async selectTag(tag: string): Promise<void> {
    const tagButton = this.tagFilters.locator(`button:has-text("${tag}")`);
    if (await tagButton.count() > 0) {
      await tagButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  async clearAllFilters(): Promise<void> {
    if (await this.clearAllFiltersButton.isVisible()) {
      await this.clearAllFiltersButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  // Sort methods
  async sortBy(option: string): Promise<void> {
    const sortSelect = this.sortOptions;
    if (await sortSelect.count() > 0) {
      await sortSelect.selectOption(option);
      await this.page.waitForTimeout(300);
    } else {
      // Try alternative sort method
      const sortButton = page.locator(`button:has-text("${option}")`);
      if (await sortButton.count() > 0) {
        await sortButton.click();
        await this.page.waitForTimeout(300);
      }
    }
  }

  // Tool interaction methods
  async getToolCount(): Promise<number> {
    return await this.toolCards.count();
  }

  async getVisibleToolCount(): Promise<number> {
    let count = 0;
    const totalCards = await this.toolCards.count();

    for (let i = 0; i < totalCards; i++) {
      const card = this.toolCards.nth(i);
      if (await card.isVisible()) {
        count++;
      }
    }

    return count;
  }

  async getToolCard(index: number): Promise<Locator> {
    return this.toolCard(index);
  }

  async getToolNameByIndex(index: number): Promise<string> {
    const card = this.toolCard(index);
    return await this.getToolName(card).textContent() || '';
  }

  async getToolDescriptionByIndex(index: number): Promise<string> {
    const card = this.toolCard(index);
    return await this.getToolDescription(card).textContent() || '';
  }

  async getToolTagsByIndex(index: number): Promise<string[]> {
    const card = this.toolCard(index);
    const tags = await this.getToolTags(card).allTextContents();
    return tags;
  }

  async tryToolByIndex(index: number): Promise<void> {
    const card = this.toolCard(index);
    const tryButton = this.getTryToolButton(card);
    await tryButton.click();
  }

  async tryToolByName(toolName: string): Promise<void> {
    const toolCard = this.toolCards.filter({ hasText: toolName }).first();
    if (await toolCard.count() > 0) {
      const tryButton = this.getTryToolButton(toolCard);
      await tryButton.click();
    }
  }

  async toggleFavoriteByIndex(index: number): Promise<void> {
    const card = this.toolCard(index);
    const favoriteButton = this.getFavoriteButton(card);
    if (await favoriteButton.count() > 0) {
      await favoriteButton.click();
      await this.page.waitForTimeout(200);
    }
  }

  async toggleFavoriteByName(toolName: string): Promise<void> {
    const toolCard = this.toolCards.filter({ hasText: toolName }).first();
    if (await toolCard.count() > 0) {
      const favoriteButton = this.getFavoriteButton(toolCard);
      if (await favoriteButton.count() > 0) {
        await favoriteButton.click();
        await this.page.waitForTimeout(200);
      }
    }
  }

  // Tab navigation methods
  async selectTab(tabName: string): Promise<void> {
    const tab = this.tabNavigation.locator(`[role="tab"]:has-text("${tabName}")`);
    await tab.click();
    await this.page.waitForTimeout(300);
  }

  async getActiveTab(): Promise<string> {
    const activeTab = this.tabNavigation.locator('[role="tab"][aria-selected="true"]');
    return await activeTab.textContent() || '';
  }

  // Category methods
  async getCategoryCount(): Promise<number> {
    return await this.categorySections.count();
  }

  async getCategoryNames(): Promise<string[]> {
    const categoryHeaders = this.categorySections.locator('h2, h3');
    const count = await categoryHeaders.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const name = await categoryHeaders.nth(i).textContent();
      if (name) names.push(name);
    }

    return names;
  }

  async viewAllInCategory(categoryName: string): Promise<void> {
    const viewAllButton = this.page.locator(`button:has-text("View All")`)
      .filter({ has: this.page.locator(`xpath=./ancestor::*[contains(text(), "${categoryName}")]`) });

    if (await viewAllButton.count() > 0) {
      await viewAllButton.click();
    }
  }

  // Dark mode methods
  async toggleDarkMode(): Promise<void> {
    await this.darkModeToggle.click();
    await this.page.waitForTimeout(300);
  }

  async isDarkMode(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
  }

  // Responsive methods
  async setViewport(viewportType: keyof typeof VIEWPORTS): Promise<void> {
    const viewport = VIEWPORTS[viewportType];
    await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
  }

  async isMobile(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width < 768 : false;
  }

  async isTablet(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width >= 768 && viewport.width < 1024 : false;
  }

  async isDesktop(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width >= 1024 : false;
  }

  // Performance methods
  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.goto();
    return Date.now() - startTime;
  }

  async measureSearchResponseTime(query: string): Promise<number> {
    const startTime = Date.now();
    await this.search(query);
    return Date.now() - startTime;
  }

  // Accessibility methods
  async checkKeyboardNavigation(): Promise<boolean> {
    await this.page.keyboard.press('Tab');
    const focused = await this.page.evaluate(() => {
      const element = document.activeElement;
      return element && ['INPUT', 'BUTTON', 'A', 'SELECT'].includes(element.tagName);
    });
    return focused;
  }

  async checkAriaLabels(): Promise<boolean> {
    const tabs = this.tabNavigation.locator('[role="tab"]');
    const count = await tabs.count();

    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      const hasRole = await tab.getAttribute('role') === 'tab';
      const hasAriaSelected = await tab.getAttribute('aria-selected') !== null;
      if (!hasRole || !hasAriaSelected) return false;
    }

    return true;
  }

  // State verification methods
  async hasSearchResults(): Promise<boolean> {
    return await this.getVisibleToolCount() > 0;
  }

  async hasNoResultsMessage(): Promise<boolean> {
    return await this.noResultsMessage.isVisible();
  }

  async hasActiveFilters(): Promise<boolean> {
    return await this.activeFilters.isVisible() &&
           (await this.activeFilters.locator('button, .badge').count()) > 0;
  }

  async isLoading(): Promise<boolean> {
    return await this.loadingIndicator.isVisible();
  }

  // Utility methods
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(500);
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await this.page.waitForTimeout(500);
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  async waitForToolCardAnimation(): Promise<void> {
    await this.page.waitForTimeout(300);
  }

  // Error handling methods
  async mockNetworkError(): Promise<void> {
    await this.page.route('**/*', route => route.abort());
  }

  async mockSlowNetwork(): Promise<void> {
    await this.page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      await route.continue();
    });
  }

  async clearMocking(): Promise<void> {
    await this.page.unroute('**/*');
  }
}

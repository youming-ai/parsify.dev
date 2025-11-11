/**
 * Keyboard Navigation Testing and Validation - T166 Implementation
 * Comprehensive testing for keyboard accessibility and navigation patterns
 */

import {
  KeyboardNavigationTestResult,
  AccessibilityViolation,
  AccessibilitySeverity,
  AccessibilityTestType,
  WCAGCategory
} from './accessibility-compliance-types';

interface FocusableElement {
  element: Element;
  selector: string;
  tabIndex: number;
  focusable: boolean;
  visible: boolean;
  interactive: boolean;
  position: {
    x: number;
    y: number;
  };
}

interface NavigationStep {
  element: string;
  accessible: boolean;
  focusable: boolean;
  tabIndex: number;
  position?: {
    x: number;
    y: number;
  };
  issues: string[];
}

interface KeyboardTrap {
  element: Element;
  type: 'modal' | 'custom' | 'overflow' | 'z-index';
  description: string;
  elementsTrapped: number;
  escapeMethods: string[];
}

class KeyboardNavigationTestingEngine {
  private readonly TAB_KEY = 'Tab';
  private readonly SHIFT_TAB = 'Shift+Tab';
  private readonly ENTER_KEY = 'Enter';
  private readonly SPACE_KEY = ' ';
  private readonly ESCAPE_KEY = 'Escape';
  private readonly ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  /**
   * Run comprehensive keyboard navigation tests for a tool
   */
  async runKeyboardNavigationTest(toolSlug: string): Promise<KeyboardNavigationTestResult> {
    const startTime = Date.now();
    const browsers = this.detectBrowsers();
    const navigationPath: NavigationStep[] = [];

    try {
      // Test keyboard accessibility features
      const [
        { issues: interactiveIssues, features: interactiveFeatures },
        { issues: focusIssues, features: focusFeatures },
        { issues: tabOrderIssues, features: tabOrderFeatures },
        { issues: skipLinkIssues, features: skipLinkFeatures },
        { issues: trapIssues, features: trapFeatures },
        { issues: focusManagementIssues, features: focusManagementFeatures },
        { issues: shortcutsIssues, features: shortcutsFeatures }
      ] = await Promise.all([
        this.testInteractiveAccessibility(toolSlug),
        this.testVisibleFocus(toolSlug),
        this.testLogicalTabOrder(toolSlug, navigationPath),
        this.testSkipLinks(toolSlug),
        this.testKeyboardTraps(toolSlug),
        this.testFocusManagement(toolSlug),
        this.testKeyboardShortcuts(toolSlug)
      ]);

      const allIssues = [
        ...interactiveIssues,
        ...focusIssues,
        ...tabOrderIssues,
        ...skipLinkIssues,
        ...trapIssues,
        ...focusManagementIssues,
        ...shortcutsIssues
      ];

      const features = {
        allInteractiveAccessible: interactiveFeatures.allInteractiveAccessible,
        visibleFocus: focusFeatures.visibleFocus,
        logicalTabOrder: tabOrderFeatures.logicalTabOrder,
        skipLinks: skipLinkFeatures.skipLinks,
        noKeyboardTraps: trapFeatures.noKeyboardTraps,
        focusManagement: focusManagementFeatures.focusManagement,
        shortcuts: shortcutsFeatures.shortcuts
      };

      const score = this.calculateKeyboardScore(features, allIssues);
      const recommendations = this.generateKeyboardRecommendations(allIssues, features);

      return {
        toolSlug,
        testedAt: new Date(),
        score,
        browsers,
        issues: allIssues,
        features,
        navigationPath,
        recommendations
      };

    } catch (error) {
      console.error(`Error running keyboard navigation test for ${toolSlug}:`, error);
      throw error;
    }
  }

  /**
   * Test that all interactive elements are keyboard accessible
   */
  private async testInteractiveAccessibility(toolSlug: string) {
    const issues: any[] = [];
    const interactiveElements = this.getInteractiveElements();

    interactiveElements.forEach(({ element, selector, focusable, visible, interactive }) => {
      if (interactive && visible && !focusable) {
        issues.push({
          type: 'keyboard_inaccessible',
          description: 'Interactive element is not keyboard accessible',
          severity: AccessibilitySeverity.SERIOUS,
          element: selector,
          steps: ['Try to Tab to this element', 'Observe that it cannot be focused', 'Element should be keyboard accessible']
        });
      }

      // Test custom interactive elements
      const hasClickHandler = element.hasAttribute('onclick') ||
                            element.hasAttribute('data-on-click') ||
                            Array.from(element.attributes).some(attr =>
                              attr.name.startsWith('on') && attr.name !== 'onload'
                            );

      if (hasClickHandler && !this.isElementFocusable(element)) {
        issues.push({
          type: 'click_handler_not_keyboard_accessible',
          description: 'Element with click handler is not keyboard accessible',
          severity: AccessibilitySeverity.SERIOUS,
          element: selector,
          steps: ['Add tabindex="0" or button role', 'Ensure keyboard events are handled', 'Test with Tab and Enter keys']
        });
      }

      // Test for disabled state accessibility
      if (element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true') {
        issues.push({
          type: 'disabled_element_missing_aria',
          description: 'Disabled element should have aria-disabled="true"',
          severity: AccessibilitySeverity.MODERATE,
          element: selector,
          steps: ['Add aria-disabled="true" to disabled element', 'Ensure screen readers announce disabled state']
        });
      }
    });

    const allInteractiveAccessible = interactiveElements.filter(el => el.interactive && el.visible).every(el => el.focusable);

    return {
      issues,
      features: { allInteractiveAccessible }
    };
  }

  /**
   * Test that focus is clearly visible
   */
  private async testVisibleFocus(toolSlug: string) {
    const issues: any[] = [];

    // Check for focus styles in CSS
    const styleSheets = Array.from(document.styleSheets);
    let hasFocusStyles = false;
    let hasFocusVisibleStyles = false;

    styleSheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules);
        rules.forEach(rule => {
          if (rule instanceof CSSStyleRule) {
            if (rule.selectorText?.includes(':focus')) {
              hasFocusStyles = true;
            }
            if (rule.selectorText?.includes(':focus-visible')) {
              hasFocusVisibleStyles = true;
            }
          }
        });
      } catch (e) {
        // Skip inaccessible stylesheets
      }
    });

    if (!hasFocusStyles) {
      issues.push({
        type: 'missing_focus_styles',
        description: 'No CSS focus styles found in stylesheets',
        severity: AccessibilitySeverity.SERIOUS,
        element: 'CSS',
        steps: ['Add :focus styles to CSS', 'Ensure focus is clearly visible', 'Test with keyboard navigation']
      });
    }

    if (!hasFocusVisibleStyles) {
      issues.push({
        type: 'missing_focus_visible_styles',
        description: 'Modern :focus-visible styles not found (recommended)',
        severity: AccessibilitySeverity.MODERATE,
        element: 'CSS',
        steps: ['Add :focus-visible styles for better UX', 'Use outline-offset for better visibility', 'Test with mouse and keyboard focus']
      });
    }

    // Test focus outline removal (anti-pattern)
    const focusableElements = this.getFocusableElements();
    focusableElements.forEach(({ element, selector }) => {
      const style = getComputedStyle(element);
      if (style.outlineWidth === '0px' || style.outlineStyle === 'none') {
        // Check if there are alternative focus indicators
        const hasAlternativeFocus =
          style.boxShadow !== 'none' ||
          style.border !== '0px none rgb(0, 0, 0)' ||
          element.hasAttribute('data-focus-visible') ||
          element.classList.toString().includes('focus');

        if (!hasAlternativeFocus) {
          issues.push({
            type: 'focus_outline_removed',
            description: 'Element has no visible focus indicator',
            severity: AccessibilitySeverity.SERIOUS,
            element: selector,
            steps: ['Add focus styles (outline, box-shadow, etc.)', 'Test focus visibility', 'Ensure contrast meets guidelines']
          });
        }
      }
    });

    const visibleFocus = hasFocusStyles || issues.filter(i => i.type === 'focus_outline_removed').length === 0;

    return {
      issues,
      features: { visibleFocus }
    };
  }

  /**
   * Test logical tab order
   */
  private async testLogicalTabOrder(toolSlug: string, navigationPath: NavigationStep[]) {
    const issues: any[] = [];
    const focusableElements = this.getFocusableElementsSorted();

    // Test source order vs visual order
    for (let i = 0; i < focusableElements.length; i++) {
      const element = focusableElements[i];
      const step: NavigationStep = {
        element: element.selector,
        accessible: element.focusable,
        focusable: element.focusable,
        tabIndex: element.tabIndex,
        position: element.position,
        issues: []
      };

      // Check tab order consistency
      if (i > 0) {
        const prevElement = focusableElements[i - 1];

        // Test for logical reading order
        if (element.tabIndex >= 0 && prevElement.tabIndex >= 0) {
          const sourceOrderConsistent = this.isInLogicalOrder(prevElement, element);

          if (!sourceOrderConsistent) {
            step.issues.push('Element appears before previous element in visual order');
            issues.push({
              type: 'illogical_tab_order',
              description: 'Tab order does not follow logical reading order',
              severity: AccessibilitySeverity.SERIOUS,
              element: element.selector,
              steps: [
                'Review visual layout',
                'Check DOM source order',
                'Reorder elements or adjust tabindex'
              ]
            });
          }
        }
      }

      // Check for tabindex issues
      if (element.tabIndex > 0) {
        step.issues.push(`Custom tabindex (${element.tabIndex}) detected`);
        issues.push({
          type: 'custom_tabindex',
          description: `Element has custom tabindex > 0: ${element.tabIndex}`,
          severity: AccessibilitySeverity.MODERATE,
          element: element.selector,
          steps: [
            'Remove custom tabindex if not needed',
            'Use DOM order instead',
            'Reserve tabindex > 0 for special cases only'
          ]
        });
      }

      navigationPath.push(step);
    }

    // Check for missing focusable elements in logical groups
    const navigationGroups = this.identifyNavigationGroups(focusableElements);
    navigationGroups.forEach((group, index) => {
      if (group.elements.length > 1) {
        const hasLogicalFlow = group.elements.every((el, i) => {
          if (i === 0) return true;
          const prevEl = group.elements[i - 1];
          return this.isInLogicalOrder(prevEl, el);
        });

        if (!hasLogicalFlow) {
          issues.push({
            type: 'group_tab_order_issue',
            description: `Navigation group ${index + 1} has illogical tab order`,
            severity: AccessibilitySeverity.MODERATE,
            element: group.elements[0].selector,
            steps: [
              'Identify the navigation group',
              'Reorder elements for logical flow',
              'Test tab order in group'
            ]
          });
        }
      }
    });

    const logicalTabOrder = issues.filter(i =>
      i.type === 'illogical_tab_order' || i.type === 'group_tab_order_issue'
    ).length === 0;

    return {
      issues,
      features: { logicalTabOrder }
    };
  }

  /**
   * Test for skip links (bypass blocks)
   */
  private async testSkipLinks(toolSlug: string) {
    const issues: any[] = [];
    const skipLinks = Array.from(document.querySelectorAll('a[href^="#"]')).filter(link => {
      const text = link.textContent?.toLowerCase() || '';
      const ariaLabel = link.getAttribute('aria-label')?.toLowerCase() || '';
      return text.includes('skip') ||
             text.includes('main') ||
             text.includes('content') ||
             text.includes('navigation') ||
             ariaLabel.includes('skip') ||
             ariaLabel.includes('main');
    });

    if (skipLinks.length === 0) {
      issues.push({
        type: 'missing_skip_links',
        description: 'Page is missing skip links to bypass navigation',
        severity: AccessibilitySeverity.MODERATE,
        element: 'body',
        steps: [
          'Add skip link at top of page',
          'Link should target main content area',
          'Make skip link visible when focused'
        ]
      });
    } else {
      skipLinks.forEach(skipLink => {
        const href = skipLink.getAttribute('href');
        const target = document.querySelector(href || '');

        if (!target) {
          issues.push({
            type: 'invalid_skip_link_target',
            description: `Skip link targets non-existent element: ${href}`,
            severity: AccessibilitySeverity.SERIOUS,
            element: this.getElementSelector(skipLink),
            steps: [
              'Ensure target element exists',
              'Use appropriate ID on target element',
              'Test skip link functionality'
            ]
          });
        }

        // Test skip link visibility
        const style = getComputedStyle(skipLink);
        if (style.position === 'absolute' && style.left === '-9999px') {
          issues.push({
            type: 'skip_link_not_focusable',
            description: 'Skip link is positioned off-screen and may not be focusable',
            severity: AccessibilitySeverity.SERIOUS,
            element: this.getElementSelector(skipLink),
            steps: [
              'Use proper focusable positioning',
              'Make skip link visible when focused',
              'Test with keyboard navigation'
            ]
          });
        }
      });
    }

    const skipLinks = issues.filter(i => i.type.startsWith('skip_link') || i.type.startsWith('missing_skip')).length === 0;

    return {
      issues,
      features: { skipLinks }
    };
  }

  /**
   * Test for keyboard traps
   */
  private async testKeyboardTraps(toolSlug: string) {
    const issues: any[] = [];
    const keyboardTraps: KeyboardTrap[] = [];

    // Test modals and dialogs
    const modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal, .popup');
    modals.forEach(modal => {
      const trap: KeyboardTrap = {
        element: modal,
        type: 'modal',
        description: 'Modal dialog',
        elementsTrapped: this.countFocusableElements(modal),
        escapeMethods: []
      };

      // Test for proper focus management
      const focusTraps = modal.querySelectorAll('[tabindex="-1"]');
      if (focusTraps.length === 0) {
        issues.push({
          type: 'modal_missing_focus_trap',
          description: 'Modal is missing focus trap (tabindex="-1")',
          severity: AccessibilitySeverity.SERIOUS,
          element: this.getElementSelector(modal),
          steps: [
            'Add tabindex="-1" to modal container',
            'Implement focus trapping logic',
            'Add Escape key handler'
          ]
        });
        trap.escapeMethods.push('Missing focus trap');
      }

      // Test for close functionality
      const closeButtons = modal.querySelectorAll('.close, [aria-label*="close"], button[onclick*="close"]');
      if (closeButtons.length === 0) {
        issues.push({
          type: 'modal_missing_close',
          description: 'Modal is missing accessible close mechanism',
          severity: AccessibilitySeverity.SERIOUS,
          element: this.getElementSelector(modal),
          steps: [
            'Add close button with proper label',
            'Implement Escape key handler',
            'Test keyboard close functionality'
          ]
        });
        trap.escapeMethods.push('Missing close button');
      }

      keyboardTraps.push(trap);
    });

    // Test custom dropdowns
    const dropdowns = document.querySelectorAll('.dropdown, [aria-expanded]');
    dropdowns.forEach(dropdown => {
      const isExpanded = dropdown.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        const focusableInDropdown = this.countFocusableElements(dropdown);
        if (focusableInDropdown > 0) {
          const trap: KeyboardTrap = {
            element: dropdown,
            type: 'custom',
            description: 'Custom dropdown',
            elementsTrapped: focusableInDropdown,
            escapeMethods: []
          };

          // Test for Escape key handling
          if (!dropdown.hasAttribute('data-escape-handler')) {
            issues.push({
              type: 'dropdown_missing_escape',
              description: 'Expanded dropdown may not handle Escape key',
              severity: AccessibilitySeverity.MODERATE,
              element: this.getElementSelector(dropdown),
              steps: [
                'Add Escape key handler',
                'Close dropdown on Escape',
                'Return focus to trigger element'
              ]
            });
            trap.escapeMethods.push('Missing Escape handler');
          }

          keyboardTraps.push(trap);
        }
      }
    });

    // Test for overflow:hidden that might trap focus
    const overflowContainers = document.querySelectorAll('[style*="overflow"]');
    overflowContainers.forEach(container => {
      const style = getComputedStyle(container);
      if (style.overflow === 'hidden' || style.overflowY === 'hidden' || style.overflowX === 'hidden') {
        const overflowElements = this.countFocusableElements(container);
        if (overflowElements > 0) {
          // Check if this is actually a trap by testing focus positions
          const containerRect = container.getBoundingClientRect();
          const containerFocusable = Array.from(container.querySelectorAll(this.focusableSelector));

          const elementsOutsideBounds = containerFocusable.filter(el => {
            const elRect = el.getBoundingClientRect();
            return elRect.top < containerRect.top ||
                   elRect.bottom > containerRect.bottom ||
                   elRect.left < containerRect.left ||
                   elRect.right > containerRect.right;
          });

          if (elementsOutsideBounds.length > 0) {
            issues.push({
              type: 'overflow_focus_trap',
              description: 'Container with overflow:hidden may trap keyboard focus',
              severity: AccessibilitySeverity.MODERATE,
              element: this.getElementSelector(container),
              steps: [
                'Review overflow usage',
                'Ensure focusable elements are visible',
                'Test keyboard navigation in container'
              ]
            });
          }
        }
      }
    });

    const noKeyboardTraps = issues.filter(i =>
      i.type.includes('trap') || i.type.includes('modal') || i.type.includes('dropdown')
    ).length === 0;

    return {
      issues,
      features: { noKeyboardTraps }
    };
  }

  /**
   * Test focus management
   */
  private async testFocusManagement(toolSlug: string) {
    const issues: any[] = [];

    // Test for focus management in dynamic content
    const dynamicContainers = document.querySelectorAll('[aria-live], [role="alert"], [role="status"]');
    dynamicContainers.forEach(container => {
      if (container.textContent && container.textContent.trim().length > 0) {
        // Test if live region is properly announced
        const politeness = container.getAttribute('aria-live') || 'polite';

        if (politeness === 'assertive') {
          issues.push({
            type: 'assertive_live_region',
            description: 'Assertive live region may interrupt screen readers',
            severity: AccessibilitySeverity.MODERATE,
            element: this.getElementSelector(container),
            steps: [
              'Review if assertive is necessary',
              'Consider using polite instead',
              'Test with screen readers'
            ]
          });
        }
      }
    });

    // Test for proper focus management in forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const requiredFields = form.querySelectorAll('[required]');
      if (requiredFields.length > 0) {
        const hasErrorSummary = form.querySelector('[role="alert"], .error-summary, .validation-summary');
        if (!hasErrorSummary) {
          issues.push({
            type: 'missing_error_summary',
            description: 'Form with required fields missing error summary for screen readers',
            severity: AccessibilitySeverity.MODERATE,
            element: this.getElementSelector(form),
            steps: [
              'Add error summary with role="alert"',
              'Link to first invalid field',
              'Update when validation changes'
            ]
          });
        }
      }
    });

    // Test for focus restoration
    const buttonsWithActions = document.querySelectorAll('button[onclick], button[data-action]');
    buttonsWithActions.forEach(button => {
      const onclick = button.getAttribute('onclick') || button.getAttribute('data-action');
      if (onclick && (onclick.includes('hide') || onclick.includes('remove') || onclick.includes('close'))) {
        issues.push({
          type: 'focus_not_restored',
          description: 'Button that hides content may not restore focus properly',
          severity: AccessibilitySeverity.MODERATE,
          element: this.getElementSelector(button),
          steps: [
            'Save focus before action',
            'Restore focus after action',
            'Test focus restoration'
          ]
        });
      }
    });

    // Test for focus indicators in custom components
    const customComponents = document.querySelectorAll('[role="tab"], [role="treeitem"], [role="option"]');
    customComponents.forEach(component => {
      const isFocusable = this.isElementFocusable(component);
      const hasAriaSelected = component.hasAttribute('aria-selected');

      if (!isFocusable) {
        issues.push({
          type: 'custom_component_not_focusable',
          description: 'Custom component with role is not keyboard focusable',
          severity: AccessibilitySeverity.SERIOUS,
          element: this.getElementSelector(component),
          steps: [
            'Add tabindex="0" to make focusable',
            'Add keyboard event handlers',
            'Test keyboard interaction'
          ]
        });
      }
    });

    const focusManagement = issues.filter(i =>
      i.type.includes('focus') ||
      i.type.includes('error') ||
      i.type.includes('custom_component')
    ).length === 0;

    return {
      issues,
      features: { focusManagement }
    };
  }

  /**
   * Test keyboard shortcuts
   */
  private async testKeyboardShortcuts(toolSlug: string) {
    const issues: any[] = [];

    // Test for accesskey attributes
    const elementsWithAccessKey = document.querySelectorAll('[accesskey]');
    elementsWithAccessKey.forEach(element => {
      const accessKey = element.getAttribute('accesskey');

      if (accessKey) {
        // Check if accesskey conflicts with browser shortcuts
        const conflictingKeys = ['F', 'E', 'D', 'A', 'B', 'H', 'L', 'P', 'R', 'S', 'T', 'V'];
        if (conflictingKeys.includes(accessKey.toUpperCase())) {
          issues.push({
            type: 'accesskey_conflict',
            description: `Accesskey "${accessKey}" may conflict with browser shortcuts`,
            severity: AccessibilitySeverity.MODERATE,
            element: this.getElementSelector(element),
            steps: [
              'Choose non-conflicting accesskey',
              'Document accesskeys for users',
              'Test in target browsers'
            ]
          });
        }

        // Check if accesskey is documented
        const hasDocumentation = element.hasAttribute('title') &&
                                element.getAttribute('title')?.toLowerCase().includes('accesskey');
        if (!hasDocumentation) {
          issues.push({
            type: 'undocumented_accesskey',
            description: 'Accesskey is not documented for users',
            severity: AccessibilitySeverity.MINOR,
            element: this.getElementSelector(element),
            steps: [
              'Add accesskey to title attribute',
              'Document accesskeys in help',
              'Consider keyboard shortcut alternatives'
            ]
          });
        }
      }
    });

    // Test for common keyboard patterns
    const searchInputs = document.querySelectorAll('input[type="search"], [role="searchbox"]');
    searchInputs.forEach(input => {
      // Test for / shortcut for search focus
      const hasSlashShortcut = document.body.addEventListener &&
                              !document.body.hasAttribute('data-search-shortcut-tested');
      if (hasSlashShortcut) {
        issues.push({
          type: 'missing_search_shortcut',
          description: 'Consider adding "/" shortcut to focus search input',
          severity: AccessibilitySeverity.INFO,
          element: this.getElementSelector(input),
          steps: [
            'Add / key handler for search focus',
            'Ensure focus goes to search input',
            'Test shortcut functionality'
          ]
        });
      }
    });

    // Test for proper keyboard handling in custom components
    const customInteractiveElements = document.querySelectorAll('[data-interactive="true"], [tabindex="0"]:not([role])');
    customInteractiveElements.forEach(element => {
      const hasKeyboardHandler =
        element.hasAttribute('onkeydown') ||
        element.hasAttribute('data-keydown') ||
        Array.from(element.attributes).some(attr =>
          attr.name.startsWith('on') && attr.name.includes('key')
        );

      if (!hasKeyboardHandler && element.textContent) {
        issues.push({
          type: 'custom_element_missing_keyboard_handler',
          description: 'Custom interactive element missing keyboard event handlers',
          severity: AccessibilitySeverity.MODERATE,
          element: this.getElementSelector(element),
          steps: [
            'Add keydown event handler',
            'Handle Enter and Space keys',
            'Test keyboard activation'
          ]
        });
      }
    });

    // Test for arrow key navigation in appropriate components
    const componentsNeedingArrows = document.querySelectorAll(
      '[role="tablist"], [role="menu"], [role="tree"], [role="grid"], [role="listbox"]'
    );
    componentsNeedingArrows.forEach(component => {
      const hasArrowKeyHandler =
        component.hasAttribute('data-arrow-keys') ||
        Array.from(component.attributes).some(attr =>
          attr.name.includes('arrow') || attr.name.includes('key')
        );

      if (!hasArrowKeyHandler) {
        issues.push({
          type: 'missing_arrow_key_navigation',
          description: 'Component should support arrow key navigation',
          severity: AccessibilitySeverity.MODERATE,
          element: this.getElementSelector(component),
          steps: [
            'Add arrow key event handlers',
            'Implement proper focus movement',
            'Test arrow key navigation'
          ]
        });
      }
    });

    const shortcuts = issues.length === 0;

    return {
      issues,
      features: { shortcuts }
    };
  }

  /**
   * Helper methods
   */
  private calculateKeyboardScore(features: any, issues: any[]): number {
    const featureCount = Object.keys(features).length;
    const passedFeatures = Object.values(features).filter(Boolean).length;

    let score = (passedFeatures / featureCount) * 100;

    // Deduct points for issues based on severity
    issues.forEach(issue => {
      switch (issue.severity) {
        case AccessibilitySeverity.CRITICAL:
          score -= 20;
          break;
        case AccessibilitySeverity.SERIOUS:
          score -= 15;
          break;
        case AccessibilitySeverity.MODERATE:
          score -= 10;
          break;
        case AccessibilitySeverity.MINOR:
          score -= 5;
          break;
      }
    });

    return Math.max(0, Math.round(score));
  }

  private generateKeyboardRecommendations(issues: any[], features: any): string[] {
    const recommendations: string[] = [];

    // Group issues by type
    const issueGroups = issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {});

    Object.entries(issueGroups).forEach(([type, typeIssues]) => {
      const frequency = typeIssues.length;
      const examples = typeIssues.slice(0, 2).map(i => i.element).join(', ');

      recommendations.push(
        `Fix ${frequency} ${type.replace(/_/g, ' ')} issue${frequency > 1 ? 's' : ''}. Examples: ${examples}`
      );
    });

    // Add positive reinforcement for passed features
    Object.entries(features).forEach(([feature, passed]) => {
      if (passed) {
        recommendations.push(`✓ Good ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()} implementation`);
      }
    });

    // Add general keyboard navigation best practices
    if (features.visibleFocus) {
      recommendations.push('Consider adding :focus-visible styles for better user experience');
    }

    if (!features.shortcuts) {
      recommendations.push('Implement common keyboard shortcuts like "/" for search');
    }

    return recommendations;
  }

  private getInteractiveElements(): FocusableElement[] {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([type="hidden"]):not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]',
      '[role="link"]',
      '[contenteditable="true"]',
      'summary',
      'iframe',
      'embed',
      'object'
    ];

    const elements: FocusableElement[] = [];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        const style = getComputedStyle(element);
        elements.push({
          element,
          selector: this.getElementSelector(element),
          tabIndex: parseInt(element.getAttribute('tabindex') || '0'),
          focusable: this.isElementFocusable(element),
          visible: style.display !== 'none' && style.visibility !== 'hidden' && this.isElementInViewport(element),
          interactive: this.isElementInteractive(element),
          position: this.getElementPosition(element)
        });
      });
    });

    return elements;
  }

  private getFocusableElements(): FocusableElement[] {
    return this.getInteractiveElements().filter(el => el.focusable && el.visible);
  }

  private getFocusableElementsSorted(): FocusableElement[] {
    return this.getFocusableElements().sort((a, b) => {
      // Sort by tabindex first, then source order
      if (a.tabIndex !== b.tabIndex) {
        return a.tabIndex - b.tabIndex;
      }
      return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  private focusableSelector = 'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"], summary, iframe, [contenteditable="true"]';

  private isElementFocusable(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const hasTabIndex = element.getAttribute('tabindex') !== null;

    const focusableTags = ['a', 'button', 'input', 'select', 'textarea', 'summary', 'iframe', 'embed', 'object'];
    const isFocusableTag = focusableTags.includes(tagName);

    if (hasTabIndex) {
      return element.getAttribute('tabindex') !== '-1';
    }

    if (isFocusableTag) {
      if (tagName === 'a') return (element as HTMLAnchorElement).href !== '';
      if (tagName === 'input') return (element as HTMLInputElement).type !== 'hidden';
      return (element as HTMLInputElement).disabled !== true;
    }

    const hasAriaRole = element.getAttribute('role') === 'button' ||
                        element.getAttribute('role') === 'link' ||
                        element.getAttribute('role') === 'textbox' ||
                        element.getAttribute('role') === 'combobox' ||
                        element.getAttribute('role') === 'listbox';

    return hasAriaRole || element.hasAttribute('contenteditable');
  }

  private isElementInteractive(element: Element): boolean {
    const hasClickHandler =
      element.hasAttribute('onclick') ||
      element.hasAttribute('data-on-click') ||
      Array.from(element.attributes).some(attr =>
        attr.name.startsWith('on') && attr.name !== 'onload'
      );

    const isInteractiveElement =
      ['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(element.tagName.toLowerCase());

    const hasInteractiveRole =
      ['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'listbox'].includes(
        element.getAttribute('role') || ''
      );

    return hasClickHandler || isInteractiveElement || hasInteractiveRole;
  }

  private isElementInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth &&
      style.display !== 'none' &&
      style.visibility !== 'hidden'
    );
  }

  private getElementPosition(element: Element): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `${element.tagName.toLowerCase()}.${element.className.split(' ').join('.')}`;
    return element.tagName.toLowerCase();
  }

  private isInLogicalOrder(element1: FocusableElement, element2: FocusableElement): boolean {
    // Simple heuristic: check if elements are in reading order
    const pos1 = element1.position;
    const pos2 = element2.position;

    // Same row: compare x position
    if (Math.abs(pos1.y - pos2.y) < 50) {
      return pos1.x <= pos2.x;
    }

    // Different rows: compare y position
    return pos1.y <= pos2.y;
  }

  private identifyNavigationGroups(elements: FocusableElement[]): Array<{ name: string; elements: FocusableElement[] }> {
    // Group elements that are visually close to each other
    const groups: Array<{ name: string; elements: FocusableElement[] }> = [];
    let currentGroup: FocusableElement[] = [];

    elements.forEach((element, index) => {
      if (index === 0) {
        currentGroup.push(element);
      } else {
        const prevElement = elements[index - 1];
        const distance = Math.sqrt(
          Math.pow(element.position.x - prevElement.position.x, 2) +
          Math.pow(element.position.y - prevElement.position.y, 2)
        );

        if (distance < 200) { // Threshold for grouping
          currentGroup.push(element);
        } else {
          if (currentGroup.length > 0) {
            groups.push({
              name: `Group ${groups.length + 1}`,
              elements: currentGroup
            });
          }
          currentGroup = [element];
        }
      }
    });

    if (currentGroup.length > 0) {
      groups.push({
        name: `Group ${groups.length + 1}`,
        elements: currentGroup
      });
    }

    return groups;
  }

  private countFocusableElements(container: Element): number {
    return container.querySelectorAll(this.focusableSelector).length;
  }

  private detectBrowsers(): string[] {
    const userAgent = navigator.userAgent;
    const browsers: string[] = [];

    if (userAgent.includes('Chrome')) browsers.push('Chrome');
    if (userAgent.includes('Firefox')) browsers.push('Firefox');
    if (userAgent.includes('Safari')) browsers.push('Safari');
    if (userAgent.includes('Edge')) browsers.push('Edge');

    return browsers.length > 0 ? browsers : ['Unknown'];
  }
}

export const keyboardNavigationTestingEngine = new KeyboardNavigationTestingEngine();
export { KeyboardNavigationTestingEngine };

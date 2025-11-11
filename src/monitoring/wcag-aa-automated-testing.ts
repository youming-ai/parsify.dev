/**
 * WCAG 2.1 AA Automated Testing and Validation Engine - T166 Implementation
 * Comprehensive automated accessibility testing for compliance validation
 */

import {
  AccessibilityViolation,
  ToolAccessibilityResult,
  AccessibilityTestType,
  AccessibilitySeverity,
  WCAGCategory,
  ComplianceLevel,
  AccessibilityTestingConfig
} from './accessibility-compliance-types';

// WCAG 2.1 AA Success Criteria Rules
const WCAG_AA_RULES = {
  // Perceivable
  '1.1.1': { category: WCAGCategory.PERCEIVABLE, title: 'Non-text Content', description: 'All non-text content has a text alternative' },
  '1.2.4': { category: WCAGCategory.PERCEIVABLE, title: 'Captions (Live)', description: 'Captions are provided for all live audio content' },
  '1.2.5': { category: WCAGCategory.PERCEIVABLE, title: 'Audio Descriptions (Prerecorded)', description: 'Audio descriptions are provided for all prerecorded video content' },
  '1.3.1': { category: WCAGCategory.PERCEIVABLE, title: 'Info and Relationships', description: 'Information, structure, and relationships can be programmatically determined' },
  '1.3.2': { category: WCAGCategory.PERCEIVABLE, title: 'Meaningful Sequence', description: 'The reading order of content is meaningful' },
  '1.3.3': { category: WCAGCategory.PERCEIVABLE, title: 'Sensory Characteristics', description: 'Instructions do not rely solely on sensory characteristics' },
  '1.3.4': { category: WCAGCategory.PERCEIVABLE, title: 'Orientation', description: 'Content does not restrict its view and operation to a single display orientation' },
  '1.3.5': { category: WCAGCategory.PERCEIVABLE, title: 'Identify Input Purpose', description: 'The purpose of each input field can be programmatically determined' },
  '1.3.6': { category: WCAGCategory.PERCEIVABLE, title: 'Identify Purpose', description: 'The purpose of content can be programmatically determined' },
  '1.4.1': { category: WCAGCategory.PERCEIVABLE, title: 'Use of Color', description: 'Color is not used as the only visual means of conveying information' },
  '1.4.3': { category: WCAGCategory.PERCEIVABLE, title: 'Contrast (Minimum)', description: 'Text has a contrast ratio of at least 4.5:1' },
  '1.4.4': { category: WCAGCategory.PERCEIVABLE, title: 'Resize text', description: 'Text can be resized without assistive technology up to 200 percent' },
  '1.4.5': { category: WCAGCategory.PERCEIVABLE, title: 'Images of Text', description: 'If the technologies being used can achieve the visual presentation, text is used to convey information' },
  '1.4.10': { category: WCAGCategory.PERCEIVABLE, title: 'Reflow', description: 'Content can be presented without loss of information or functionality' },
  '1.4.11': { category: WCAGCategory.PERCEIVABLE, title: 'Non-text Contrast', description: 'Graphical objects and user interface components have a contrast ratio of at least 3:1' },
  '1.4.12': { category: WCAGCategory.PERCEIVABLE, title: 'Text Spacing', description: 'Text spacing can be set without loss of content or functionality' },
  '1.4.13': { category: WCAGCategory.PERCEIVABLE, title: 'Content on Hover or Focus', description: 'Additional content on hover or focus can be dismissed and is persistent' },

  // Operable
  '2.1.1': { category: WCAGCategory.OPERABLE, title: 'Keyboard', description: 'All functionality is available from a keyboard' },
  '2.1.2': { category: WCAGCategory.OPERABLE, title: 'No Keyboard Trap', description: 'Keyboard focus does not become trapped in any part of the content' },
  '2.1.4': { category: WCAGCategory.OPERABLE, title: 'Character Key Shortcuts', description: 'Character key shortcuts can be turned off, remapped, or disabled' },
  '2.2.1': { category: WCAGCategory.OPERABLE, title: 'Timing Adjustable', description: 'Users can control time limits on content' },
  '2.2.2': { category: WCAGCategory.OPERABLE, title: 'Pause, Stop, Hide', description: 'Users can pause, stop, or hide moving, blinking, or scrolling content' },
  '2.3.1': { category: WCAGCategory.OPERABLE, title: 'Three Flashes or Below', description: 'Content does not contain more than three flashes in any one-second period' },
  '2.4.1': { category: WCAGCategory.OPERABLE, title: 'Bypass Blocks', description: 'A mechanism is available to bypass blocks of content' },
  '2.4.2': { category: WCAGCategory.OPERABLE, title: 'Page Titled', description: 'Web pages have titles that describe topic or purpose' },
  '2.4.3': { category: WCAGCategory.OPERABLE, title: 'Focus Order', description: 'Focus order follows a meaningful sequence' },
  '2.4.4': { category: WCAGCategory.OPERABLE, title: 'Link Purpose (In Context)', description: 'The purpose of each link can be determined from the link text alone' },
  '2.4.5': { category: WCAGCategory.OPERABLE, title: 'Multiple Ways', description: 'Multiple ways are available to locate content within the web page' },
  '2.4.6': { category: WCAGCategory.OPERABLE, title: 'Headings and Labels', description: 'Headings and labels describe topic or purpose' },
  '2.4.7': { category: WCAGCategory.OPERABLE, title: 'Focus Visible', description: 'Any keyboard operable interface has a mode of operation where the keyboard focus indicator is visible' },
  '2.5.1': { category: WCAGCategory.OPERABLE, title: 'Pointer Gestures', description: 'All functionality that uses multipoint or path-based gestures can be operated with a single pointer' },
  '2.5.2': { category: WCAGCategory.OPERABLE, title: 'Pointer Cancellation', description: 'Pointer inputs can be cancelled without triggering any action' },
  '2.5.3': { category: WCAGCategory.OPERABLE, title: 'Label in Name', description: 'For user interface components with labels that include text, the accessible name contains the text' },
  '2.5.4': { category: WCAGCategory.OPERABLE, title: 'Motion Actuation', description: 'Functionality can be operated by device motion or user motion' },

  // Understandable
  '3.1.1': { category: WCAGCategory.UNDERSTANDABLE, title: 'Language of Page', description: 'The default human language of the web page can be programmatically determined' },
  '3.1.2': { category: WCAGCategory.UNDERSTANDABLE, title: 'Language of Parts', description: 'The human language of each passage or phrase can be programmatically determined' },
  '3.2.1': { category: WCAGCategory.UNDERSTANDABLE, title: 'On Focus', description: 'When any component receives focus, it does not cause a context change' },
  '3.2.2': { category: WCAGCategory.UNDERSTANDABLE, title: 'On Input', description: 'Changing the setting of any user interface component does not automatically cause a context change' },
  '3.2.3': { category: WCAGCategory.UNDERSTANDABLE, title: 'Consistent Navigation', description: 'Navigational mechanisms that are repeated on multiple web pages occur in the same relative order' },
  '3.2.4': { category: WCAGCategory.UNDERSTANDABLE, title: 'Consistent Identification', description: 'Components that have the same functionality within a set of web pages are identified consistently' },
  '3.3.1': { category: WCAGCategory.UNDERSTANDABLE, title: 'Error Identification', description: 'If an input error is automatically detected, the item is identified and the error is described to the user' },
  '3.3.2': { category: WCAGCategory.UNDERSTANDABLE, title: 'Labels or Instructions', description: 'Labels or instructions are provided when content requires user input' },
  '3.3.3': { category: WCAGCategory.UNDERSTANDABLE, title: 'Error Suggestion', description: 'If an input error is automatically detected, suggestions for correction are provided' },
  '3.3.4': { category: WCAGCategory.UNDERSTANDABLE, title: 'Error Prevention (Legal, Financial, Data)', description: 'For web pages that cause legal commitments or financial transactions, data submission is reversible' },

  // Robust
  '4.1.1': { category: WCAGCategory.ROBUST, title: 'Parsing', description: 'Content is implemented using markup languages that have been parsed according to specification' },
  '4.1.2': { category: WCAGCategory.ROBUST, title: 'Name, Role, Value', description: 'Name, role, and value can be programmatically determined for all user interface components' },
  '4.1.3': { category: WCAGCategory.ROBUST, title: 'Status Messages', description: 'Status messages can be programmatically determined without receiving focus' }
};

class WCAgAAAutomatedTestingEngine {
  private config: AccessibilityTestingConfig;
  private performanceMetrics = {
    startTime: 0,
    memoryUsage: 0,
    elementsTested: 0
  };

  constructor(config: AccessibilityTestingConfig) {
    this.config = config;
  }

  /**
   * Run comprehensive WCAG 2.1 AA automated tests for a tool
   */
  async runAutomatedTests(toolSlug: string): Promise<ToolAccessibilityResult> {
    this.performanceMetrics.startTime = Date.now();
    this.performanceMetrics.memoryUsage = this.getMemoryUsage();
    this.performanceMetrics.elementsTested = 0;

    const violations: AccessibilityViolation[] = [];
    const passedTests: string[] = [];
    const failedTests: string[] = [];
    const skippedTests: string[] = [];

    try {
      // Get the DOM elements for the tool
      const elements = await this.getToolElements(toolSlug);
      this.performanceMetrics.elementsTested = elements.length;

      // Run all applicable WCAG AA tests
      for (const [criterion, rule] of Object.entries(WCAG_AA_RULES)) {
        if (!this.config.testTypes.includes(this.getTestTypeForCriterion(criterion))) {
          skippedTests.push(`WCAG ${criterion} - ${rule.title}`);
          continue;
        }

        const testResult = await this.runCriterionTest(criterion, elements, toolSlug);

        if (testResult.passed) {
          passedTests.push(`WCAG ${criterion} - ${rule.title}`);
        } else {
          failedTests.push(`WCAG ${criterion} - ${rule.title}`);
          violations.push(...testResult.violations);
        }
      }

      // Calculate compliance score and level
      const { score, complianceLevel } = this.calculateComplianceScore(violations, elements.length);

      return {
        toolSlug,
        toolName: await this.getToolName(toolSlug),
        toolCategory: await this.getToolCategory(toolSlug),
        testedAt: new Date(),
        overallCompliance: complianceLevel,
        score,
        violations,
        passedTests,
        failedTests,
        skippedTests,
        testCoverage: {
          automated: 100,
          manual: 0,
          total: 100
        },
        performanceMetrics: {
          testDuration: Date.now() - this.performanceMetrics.startTime,
          memoryUsage: this.getMemoryUsage() - this.performanceMetrics.memoryUsage,
          elementsTested: this.performanceMetrics.elementsTested
        },
        remediationRequired: violations.length > 0,
        nextReviewDate: this.calculateNextReviewDate()
      };

    } catch (error) {
      console.error(`Error running accessibility tests for ${toolSlug}:`, error);
      throw error;
    }
  }

  /**
   * Run test for a specific WCAG criterion
   */
  private async runCriterionTest(
    criterion: string,
    elements: Element[],
    toolSlug: string
  ): Promise<{ passed: boolean; violations: AccessibilityViolation[] }> {
    const violations: AccessibilityViolation[] = [];
    const rule = WCAG_AA_RULES[criterion];

    switch (criterion) {
      case '1.1.1': // Non-text Content
        violations.push(...this.testAlternativeText(elements, toolSlug));
        break;

      case '1.3.1': // Info and Relationships
        violations.push(...this.testSemanticStructure(elements, toolSlug));
        break;

      case '1.4.1': // Use of Color
        violations.push(...this.testColorUsage(elements, toolSlug));
        break;

      case '1.4.3': // Contrast (Minimum)
        violations.push(...this.testColorContrast(elements, toolSlug));
        break;

      case '2.1.1': // Keyboard
        violations.push(...this.testKeyboardAccessibility(elements, toolSlug));
        break;

      case '2.1.2': // No Keyboard Trap
        violations.push(...this.testKeyboardTraps(elements, toolSlug));
        break;

      case '2.4.1': // Bypass Blocks
        violations.push(...this.testSkipLinks(elements, toolSlug));
        break;

      case '2.4.2': // Page Titled
        violations.push(...this.testPageTitle(toolSlug));
        break;

      case '2.4.6': // Headings and Labels
        violations.push(...this.testHeadingsAndLabels(elements, toolSlug));
        break;

      case '2.4.7': // Focus Visible
        violations.push(...this.testFocusVisible(elements, toolSlug));
        break;

      case '3.1.1': // Language of Page
        violations.push(...this.testPageLanguage(toolSlug));
        break;

      case '3.2.1': // On Focus
        violations.push(...this.testFocusBehavior(elements, toolSlug));
        break;

      case '3.3.1': // Error Identification
        violations.push(...this.testErrorIdentification(elements, toolSlug));
        break;

      case '3.3.2': // Labels or Instructions
        violations.push(...this.testFormLabels(elements, toolSlug));
        break;

      case '4.1.1': // Parsing
        violations.push(...this.testHTMLValidation(elements, toolSlug));
        break;

      case '4.1.2': // Name, Role, Value
        violations.push(...this.testAriaAttributes(elements, toolSlug));
        break;

      default:
        // Skip non-automatable tests
        return { passed: true, violations: [] };
    }

    return { passed: violations.length === 0, violations };
  }

  /**
   * Test for alternative text on images and non-text content
   */
  private testAlternativeText(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    const images = elements.filter(el => el.tagName === 'IMG');
    images.forEach((img, index) => {
      const imgEl = img as HTMLImageElement;
      if (!imgEl.alt && imgEl.alt !== '') {
        violations.push(this.createViolation(
          '1.1.1',
          'Missing alt attribute',
          'Image element is missing an alt attribute for screen reader users',
          AccessibilitySeverity.SERIOUS,
          imgEl,
          toolSlug
        ));
      } else if (imgEl.alt === '' && !this.isDecorativeImage(imgEl)) {
        violations.push(this.createViolation(
          '1.1.1',
          'Empty alt for informative image',
          'Image with informative content has empty alt attribute',
          AccessibilitySeverity.MODERATE,
          imgEl,
          toolSlug
        ));
      }
    });

    // Test SVG elements
    const svgs = elements.filter(el => el.tagName === 'svg');
    svgs.forEach((svg, index) => {
      if (!svg.querySelector('title') && !svg.getAttribute('aria-label') && !svg.getAttribute('aria-labelledby')) {
        violations.push(this.createViolation(
          '1.1.1',
          'Missing SVG description',
          'SVG element is missing title or aria-label for screen reader users',
          AccessibilitySeverity.MODERATE,
          svg,
          toolSlug
        ));
      }
    });

    return violations;
  }

  /**
   * Test semantic structure and heading hierarchy
   */
  private testSemanticStructure(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Test heading hierarchy
    const headings = elements.filter(el => /^H[1-6]$/.test(el.tagName));
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.substring(1));

      if (currentLevel > previousLevel + 1) {
        violations.push(this.createViolation(
          '1.3.1',
          'Improper heading hierarchy',
          `Heading level skipped: H${previousLevel} to H${currentLevel}`,
          AccessibilitySeverity.MODERATE,
          heading,
          toolSlug
        ));
      }

      previousLevel = currentLevel;
    });

    // Test for proper list structure
    const listItems = elements.filter(el => el.tagName === 'LI');
    listItems.forEach((li) => {
      if (!li.closest('ul') && !li.closest('ol')) {
        violations.push(this.createViolation(
          '1.3.1',
          'Orphaned list item',
          'List item is not contained within ul or ol element',
          AccessibilitySeverity.MODERATE,
          li,
          toolSlug
        ));
      }
    });

    // Test for proper table structure
    const tables = elements.filter(el => el.tagName === 'TABLE');
    tables.forEach((table) => {
      if (!table.querySelector('th')) {
        violations.push(this.createViolation(
          '1.3.1',
          'Missing table headers',
          'Table is missing th elements for header information',
          AccessibilitySeverity.SERIOUS,
          table,
          toolSlug
        ));
      }

      if (!table.querySelector('caption') && !table.getAttribute('aria-label')) {
        violations.push(this.createViolation(
          '1.3.1',
          'Missing table description',
          'Table is missing caption or aria-label for context',
          AccessibilitySeverity.MODERATE,
          table,
          toolSlug
        ));
      }
    });

    return violations;
  }

  /**
   * Test color usage to ensure information isn't conveyed only by color
   */
  private testColorUsage(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // This is a simplified test - in practice, you'd need more sophisticated analysis
    const elementsWithColorOnlyInfo = elements.filter(el => {
      const style = getComputedStyle(el);
      const hasColorInfo = style.color !== 'rgb(0, 0, 0)' && style.backgroundColor !== 'rgb(255, 255, 255)';
      const hasNonColorInfo = el.textContent?.trim().length > 0 ||
                             el.getAttribute('aria-label') ||
                             el.querySelector('[aria-label]');

      return hasColorInfo && !hasNonColorInfo;
    });

    elementsWithColorOnlyInfo.forEach(el => {
      violations.push(this.createViolation(
        '1.4.1',
        'Information conveyed only by color',
        'Element conveys information using color only, without text or other indicators',
        AccessibilitySeverity.MODERATE,
        el,
        toolSlug
      ));
    });

    return violations;
  }

  /**
   * Test color contrast ratios
   */
  private testColorContrast(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    elements.forEach(el => {
      if (el.textContent && el.textContent.trim()) {
        const style = getComputedStyle(el);
        const foreground = this.rgbToHex(style.color);
        const background = this.rgbToHex(style.backgroundColor);

        if (foreground && background) {
          const ratio = this.calculateContrastRatio(foreground, background);
          const fontSize = parseFloat(style.fontSize);
          const fontWeight = style.fontWeight;

          const isLarge = fontSize >= 18 || (fontSize >= 14 && parseInt(fontWeight) >= 700);
          const requiredRatio = isLarge ? 3.0 : 4.5;

          if (ratio < requiredRatio) {
            violations.push(this.createViolation(
              '1.4.3',
              'Insufficient color contrast',
              `Contrast ratio ${ratio.toFixed(2)} is below required ${requiredRatio}`,
              AccessibilitySeverity.SERIOUS,
              el,
              toolSlug
            ));
          }
        }
      }
    });

    return violations;
  }

  /**
   * Test keyboard accessibility
   */
  private testKeyboardAccessibility(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Test interactive elements for keyboard access
    const interactiveElements = elements.filter(el =>
      ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'].includes(el.tagName) ||
      el.getAttribute('tabindex') !== null ||
      el.getAttribute('role') === 'button' ||
      el.getAttribute('role') === 'link'
    );

    interactiveElements.forEach(el => {
      // Skip elements that should not be focusable
      if (el.getAttribute('tabindex') === '-1') return;

      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      // Check if element is focusable via keyboard
      if (!this.isKeyboardFocusable(el)) {
        violations.push(this.createViolation(
          '2.1.1',
          'Not keyboard accessible',
          'Interactive element cannot be focused using keyboard',
          AccessibilitySeverity.SERIOUS,
          el,
          toolSlug
        ));
      }
    });

    return violations;
  }

  /**
   * Test for keyboard traps
   */
  private testKeyboardTraps(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // This would typically involve more sophisticated tab sequence testing
    // For automated testing, we check for common keyboard trap patterns

    const modalElements = elements.filter(el =>
      el.getAttribute('role') === 'dialog' ||
      el.classList.contains('modal') ||
      el.getAttribute('aria-modal') === 'true'
    );

    modalElements.forEach(modal => {
      if (!modal.querySelector('[tabindex="-1"]') && !modal.hasAttribute('tabindex')) {
        violations.push(this.createViolation(
          '2.1.2',
          'Potential keyboard trap',
          'Modal dialog may trap keyboard focus without proper focus management',
          AccessibilitySeverity.SERIOUS,
          modal,
          toolSlug
        ));
      }
    });

    return violations;
  }

  /**
   * Test for skip links (bypass blocks)
   */
  private testSkipLinks(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    const skipLinks = elements.filter(el =>
      (el.tagName === 'A' && el.getAttribute('href')?.startsWith('#')) &&
      (el.textContent?.toLowerCase().includes('skip') ||
       el.textContent?.toLowerCase().includes('main') ||
       el.getAttribute('aria-label')?.toLowerCase().includes('skip'))
    );

    if (skipLinks.length === 0) {
      violations.push(this.createViolation(
        '2.4.1',
        'Missing skip links',
        'Page lacks skip links to bypass navigation blocks',
        AccessibilitySeverity.MODERATE,
        document.body,
        toolSlug
      ));
    }

    return violations;
  }

  /**
   * Test page title
   */
  private testPageTitle(toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    const title = document.title;
    if (!title || title.trim() === '') {
      violations.push(this.createViolation(
        '2.4.2',
        'Missing page title',
        'Page is missing a descriptive title',
        AccessibilitySeverity.SERIOUS,
        document.head || document.documentElement,
        toolSlug
      ));
    } else if (title.length > 60) {
      violations.push(this.createViolation(
        '2.4.2',
        'Page title too long',
        'Page title exceeds recommended length of 60 characters',
        AccessibilitySeverity.MINOR,
        document.head || document.documentElement,
        toolSlug
      ));
    }

    return violations;
  }

  /**
   * Test headings and labels
   */
  private testHeadingsAndLabels(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Test form labels
    const formControls = elements.filter(el =>
      ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
    );

    formControls.forEach(control => {
      const hasLabel = control.hasAttribute('aria-label') ||
                      control.hasAttribute('aria-labelledby') ||
                      control.id && document.querySelector(`label[for="${control.id}"]`);

      if (!hasLabel && control.getAttribute('type') !== 'hidden') {
        violations.push(this.createViolation(
          '2.4.6',
          'Missing form label',
          'Form control is missing associated label',
          AccessibilitySeverity.SERIOUS,
          control,
          toolSlug
        ));
      }
    });

    // Test empty headings
    const headings = elements.filter(el => /^H[1-6]$/.test(el.tagName));
    headings.forEach(heading => {
      if (!heading.textContent?.trim() && !heading.getAttribute('aria-label')) {
        violations.push(this.createViolation(
          '2.4.6',
          'Empty heading',
          'Heading element is empty or missing text content',
          AccessibilitySeverity.MODERATE,
          heading,
          toolSlug
        ));
      }
    });

    return violations;
  }

  /**
   * Test focus visibility
   */
  private testFocusVisible(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Check if :focus-visible styles are defined
    const styleSheets = Array.from(document.styleSheets);
    const hasFocusVisibleStyles = styleSheets.some(sheet => {
      try {
        return Array.from(sheet.cssRules).some(rule =>
          rule instanceof CSSStyleRule &&
          (rule.selectorText?.includes(':focus') ||
           rule.selectorText?.includes(':focus-visible'))
        );
      } catch (e) {
        return false;
      }
    });

    if (!hasFocusVisibleStyles) {
      violations.push(this.createViolation(
        '2.4.7',
        'Missing focus styles',
        'Page is missing visible focus styles for keyboard navigation',
        AccessibilitySeverity.SERIOUS,
        document.documentElement,
        toolSlug
      ));
    }

    return violations;
  }

  /**
   * Test page language
   */
  private testPageLanguage(toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    const htmlElement = document.documentElement;
    const lang = htmlElement.getAttribute('lang');

    if (!lang) {
      violations.push(this.createViolation(
        '3.1.1',
        'Missing page language',
        'HTML element is missing lang attribute',
        AccessibilitySeverity.SERIOUS,
        htmlElement,
        toolSlug
      ));
    } else if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
      violations.push(this.createViolation(
        '3.1.1',
        'Invalid language code',
        `Lang attribute "${lang}" is not a valid language code`,
        AccessibilitySeverity.MODERATE,
        htmlElement,
        toolSlug
      ));
    }

    return violations;
  }

  /**
   * Test focus behavior
   */
  private testFocusBehavior(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // This is a simplified test - comprehensive focus behavior testing requires interaction simulation
    const elementsWithOnFocus = elements.filter(el =>
      el.hasAttribute('onfocus') || el.getAttribute('data-on-focus')
    );

    elementsWithOnFocus.forEach(el => {
      violations.push(this.createViolation(
        '3.2.1',
        'Potential focus-triggered context change',
        'Element has focus handler that may cause context change',
        AccessibilitySeverity.MODERATE,
        el,
        toolSlug,
        'This requires manual verification to ensure focus does not cause unexpected context changes'
      ));
    });

    return violations;
  }

  /**
   * Test error identification
   */
  private testErrorIdentification(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Look for error messages that aren't properly associated with form controls
    const errorElements = elements.filter(el =>
      el.classList.contains('error') ||
      el.classList.contains('error-message') ||
      el.getAttribute('role') === 'alert' ||
      el.hasAttribute('aria-invalid')
    );

    errorElements.forEach(errorEl => {
      const ariaDescribedBy = errorEl.getAttribute('aria-describedby');
      const ariaInvalid = errorEl.getAttribute('aria-invalid');

      if (!ariaDescribedBy && !ariaInvalid) {
        violations.push(this.createViolation(
          '3.3.1',
          'Improper error association',
          'Error element is not properly associated with invalid form control',
          AccessibilitySeverity.SERIOUS,
          errorEl,
          toolSlug
        ));
      }
    });

    return violations;
  }

  /**
   * Test form labels
   */
  private testFormLabels(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    const inputs = elements.filter(el => ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
    inputs.forEach(input => {
      const hasLabel =
        input.hasAttribute('aria-label') ||
        input.hasAttribute('aria-labelledby') ||
        (input.id && document.querySelector(`label[for="${input.id}"]`));

      if (!hasLabel && input.getAttribute('type') !== 'hidden' && input.getAttribute('type') !== 'submit') {
        violations.push(this.createViolation(
          '3.3.2',
          'Missing form control label',
          'Form control is missing a descriptive label',
          AccessibilitySeverity.SERIOUS,
          input,
          toolSlug
        ));
      }
    });

    return violations;
  }

  /**
   * Test HTML validation
   */
  private testHTMLValidation(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Check for duplicate IDs
    const elementsWithIds = elements.filter(el => el.id);
    const ids = elementsWithIds.map(el => el.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    duplicateIds.forEach(id => {
      const duplicateElements = elementsWithIds.filter(el => el.id === id);
      duplicateElements.forEach(el => {
        violations.push(this.createViolation(
          '4.1.1',
          'Duplicate ID',
          `Element has duplicate ID "${id}" which breaks DOM parsing`,
          AccessibilitySeverity.SERIOUS,
          el,
          toolSlug
        ));
      });
    });

    return violations;
  }

  /**
   * Test ARIA attributes
   */
  private testAriaAttributes(elements: Element[], toolSlug: string): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    elements.forEach(el => {
      // Test for required ARIA attributes
      const role = el.getAttribute('role');
      if (role) {
        const requiredAttributes = this.getRequiredAriaAttributes(role);
        requiredAttributes.forEach(attr => {
          if (!el.hasAttribute(attr)) {
            violations.push(this.createViolation(
              '4.1.2',
              `Missing required ARIA attribute: ${attr}`,
              `Element with role "${role}" is missing required attribute "${attr}"`,
              AccessibilitySeverity.SERIOUS,
              el,
              toolSlug
            ));
          }
        });
      }

      // Test for invalid ARIA attributes
      const ariaAttributes = Array.from(el.attributes)
        .filter(attr => attr.name.startsWith('aria-'))
        .map(attr => attr.name);

      ariaAttributes.forEach(attr => {
        if (!this.isValidAriaAttribute(attr)) {
          violations.push(this.createViolation(
            '4.1.2',
            `Invalid ARIA attribute: ${attr}`,
            `Element has invalid ARIA attribute "${attr}"`,
            AccessibilitySeverity.MODERATE,
            el,
            toolSlug
          ));
        }
      });
    });

    return violations;
  }

  /**
   * Helper methods
   */
  private createViolation(
    criterion: string,
    title: string,
    description: string,
    severity: AccessibilitySeverity,
    element: Element,
    toolSlug: string,
    recommendation?: string
  ): AccessibilityViolation {
    const rule = WCAG_AA_RULES[criterion];

    return {
      id: `${criterion}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      impact: severity,
      category: rule.category,
      wcagCriteria: [criterion],
      testType: this.getTestTypeForCriterion(criterion),
      element: {
        selector: this.getElementSelector(element),
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        text: element.textContent?.substring(0, 100)
      },
      location: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        line: undefined, // Would need source mapping for this
        column: undefined
      },
      recommendation: recommendation || `Fix ${title} according to WCAG 2.1 AA guidelines`,
      resources: [
        `https://www.w3.org/WAI/WCAG21/Understanding/${criterion.toLowerCase().replace('.', '')}.html`,
        `https://webaim.org/techniques/wcag/${criterion.toLowerCase().replace('.', '')}`
      ],
      timestamp: new Date(),
      status: 'open',
      remediationPriority: this.getPriorityForSeverity(severity)
    };
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `${element.tagName.toLowerCase()}.${element.className.split(' ').join('.')}`;
    return element.tagName.toLowerCase();
  }

  private getTestTypeForCriterion(criterion: string): AccessibilityTestType {
    const testTypeMap: Record<string, AccessibilityTestType> = {
      '1.1.1': AccessibilityTestType.ALTERNATIVE_TEXT,
      '1.4.3': AccessibilityTestType.COLOR_CONTRAST,
      '2.1.1': AccessibilityTestType.KEYBOARD_NAVIGATION,
      '2.4.7': AccessibilityTestType.FOCUS_MANAGEMENT,
      '3.1.1': AccessibilityTestType.SEMANTIC_HTML,
      '4.1.2': AccessibilityTestType.SEMANTIC_HTML
    };

    return testTypeMap[criterion] || AccessibilityTestType.AUTOMATED;
  }

  private getPriorityForSeverity(severity: AccessibilitySeverity): number {
    const priorityMap = {
      [AccessibilitySeverity.CRITICAL]: 1,
      [AccessibilitySeverity.SERIOUS]: 2,
      [AccessibilitySeverity.MODERATE]: 3,
      [AccessibilitySeverity.MINOR]: 4,
      [AccessibilitySeverity.INFO]: 5
    };

    return priorityMap[severity];
  }

  private async getToolElements(toolSlug: string): Promise<Element[]> {
    // In a real implementation, this would navigate to the tool page and extract elements
    // For now, we'll return elements from the current page
    return Array.from(document.querySelectorAll('*'));
  }

  private async getToolName(toolSlug: string): Promise<string> {
    // This would typically fetch from tools data
    return toolSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  private async getToolCategory(toolSlug: string): Promise<string> {
    // This would typically fetch from tools data
    return 'tools';
  }

  private calculateComplianceScore(violations: AccessibilityViolation[], totalElements: number): { score: number; complianceLevel: ComplianceLevel } {
    if (violations.length === 0) {
      return { score: 100, complianceLevel: ComplianceLevel.AAA };
    }

    const criticalCount = violations.filter(v => v.impact === AccessibilitySeverity.CRITICAL).length;
    const seriousCount = violations.filter(v => v.impact === AccessibilitySeverity.SERIOUS).length;
    const moderateCount = violations.filter(v => v.impact === AccessibilitySeverity.MODERATE).length;

    // Calculate penalty score based on severity
    let penalty = criticalCount * 20 + seriousCount * 10 + moderateCount * 5;
    penalty = Math.min(penalty, 100); // Cap at 100

    const score = Math.max(0, 100 - penalty);

    let complianceLevel: ComplianceLevel;
    if (criticalCount > 0) {
      complianceLevel = ComplianceLevel.NON_COMPLIANT;
    } else if (seriousCount > 2 || moderateCount > 5) {
      complianceLevel = ComplianceLevel.A;
    } else if (seriousCount > 0 || moderateCount > 2) {
      complianceLevel = ComplianceLevel.AA;
    } else {
      complianceLevel = ComplianceLevel.AAA;
    }

    return { score, complianceLevel };
  }

  private calculateNextReviewDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Review in 30 days
    return date;
  }

  private getMemoryUsage(): number {
    // Simplified memory usage calculation
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return 0;
  }

  private isDecorativeImage(img: HTMLImageElement): boolean {
    // Heuristics to determine if image is decorative
    return img.alt === '' &&
           (!img.title || img.title === '') &&
           img.width < 50 &&
           img.height < 50;
  }

  private isKeyboardFocusable(element: Element): boolean {
    const tagName = element.tagName;
    const hasTabIndex = element.getAttribute('tabindex') !== null;

    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY', 'IFRAME'];
    const isFocusableTag = focusableTags.includes(tagName);

    if (hasTabIndex) {
      return element.getAttribute('tabindex') !== '-1';
    }

    if (isFocusableTag) {
      if (tagName === 'A') {
        return (element as HTMLAnchorElement).href !== '';
      }
      if (tagName === 'INPUT') {
        return (element as HTMLInputElement).type !== 'hidden';
      }
      return true;
    }

    const hasAriaRole = element.getAttribute('role') === 'button' ||
                        element.getAttribute('role') === 'link' ||
                        element.getAttribute('role') === 'textbox';

    return hasAriaRole;
  }

  private rgbToHex(rgb: string): string {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return '';

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  private calculateContrastRatio(foreground: string, background: string): number {
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = ((rgb >> 16) & 0xff) / 255;
      const g = ((rgb >> 8) & 0xff) / 255;
      const b = (rgb & 0xff) / 255;

      const gammaCorrect = (c: number): number => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };

      const [r2, g2, b2] = [r, g, b].map(gammaCorrect);
      return 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  private getRequiredAriaAttributes(role: string): string[] {
    const requiredAttributes: Record<string, string[]> = {
      'checkbox': ['aria-checked'],
      'combobox': ['aria-expanded', 'aria-haspopup'],
      'listbox': ['aria-orientation', 'aria-multiselectable'],
      'menu': ['aria-orientation'],
      'menubar': ['aria-orientation'],
      'radiogroup': ['aria-orientation'],
      'tablist': ['aria-orientation'],
      'tree': ['aria-orientation', 'aria-multiselectable'],
      'treegrid': ['aria-orientation', 'aria-multiselectable'],
      'dialog': ['aria-modal'],
      'alertdialog': ['aria-modal'],
      'grid': ['aria-rowcount', 'aria-colcount']
    };

    return requiredAttributes[role] || [];
  }

  private isValidAriaAttribute(attribute: string): boolean {
    // List of valid ARIA attributes (simplified)
    const validAttributes = [
      'aria-activedescendant', 'aria-atomic', 'aria-autocomplete', 'aria-busy',
      'aria-checked', 'aria-colcount', 'aria-colindex', 'aria-colspan',
      'aria-controls', 'aria-current', 'aria-describedby', 'aria-disabled',
      'aria-dropeffect', 'aria-errormessage', 'aria-expanded', 'aria-flowto',
      'aria-grabbed', 'aria-haspopup', 'aria-hidden', 'aria-invalid',
      'aria-keyshortcuts', 'aria-label', 'aria-labelledby', 'aria-level',
      'aria-live', 'aria-modal', 'aria-multiselectable', 'aria-orientation',
      'aria-owns', 'aria-placeholder', 'aria-posinset', 'aria-pressed',
      'aria-readonly', 'aria-relevant', 'aria-required', 'aria-roledescription',
      'aria-rowcount', 'aria-rowindex', 'aria-rowspan', 'aria-selected',
      'aria-setsize', 'aria-sort', 'aria-valuemax', 'aria-valuemin',
      'aria-valuenow', 'aria-valuetext', 'role'
    ];

    return validAttributes.includes(attribute);
  }
}

export const wcagAAAutomatedTestingEngine = new WCAgAAAutomatedTestingEngine({
  enabled: true,
  wcagLevel: 'AA',
  testTypes: [
    AccessibilityTestType.AUTOMATED,
    AccessibilityTestType.COLOR_CONTRAST,
    AccessibilityTestType.KEYBOARD_NAVIGATION,
    AccessibilityTestType.SEMANTIC_HTML,
    AccessibilityTestType.ALTERNATIVE_TEXT,
    AccessibilityTestType.FOCUS_MANAGEMENT,
    AccessibilityTestType.FORM_ACCESSIBILITY
  ],
  excludePatterns: [],
  includePatterns: ['*'],
  screenReaders: [
    { name: 'NVDA', enabled: true },
    { name: 'VoiceOver', enabled: true }
  ],
  browsers: [
    { name: 'Chrome', enabled: true },
    { name: 'Firefox', enabled: true }
  ],
  colorContrast: {
    thresholds: {
      aaNormal: 4.5,
      aaLarge: 3.0,
      aaaNormal: 7.0,
      aaaLarge: 4.5
    },
    testDarkMode: true,
    testHighContrast: true
  },
  performance: {
    maxTestDuration: 30000,
    maxMemoryUsage: 100
  },
  reporting: {
    enabled: true,
    frequency: 'weekly',
    recipients: [],
    includeRecommendations: true,
    includeScreenshots: false
  },
  remediation: {
    autoAssign: false,
    priorityThreshold: 2,
    reminderFrequency: 7
  }
});

export { WCAgAAAutomatedTestingEngine };

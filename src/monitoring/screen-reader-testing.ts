/**
 * Screen Reader Testing and Compatibility Validation - T166 Implementation
 * Comprehensive testing for screen reader compatibility across different platforms
 */

import {
  ScreenReaderTestResult,
  AccessibilityViolation,
  AccessibilitySeverity,
  AccessibilityTestType,
  WCAGCategory
} from './accessibility-compliance-types';

interface ScreenReaderCommand {
  key: string;
  description: string;
  category: 'navigation' | 'reading' | 'interaction' | 'information';
}

interface SpeechOutput {
  text: string;
  timestamp: Date;
  element: string;
  confidence: number;
  properties: {
    role?: string;
    name?: string;
    state?: string;
    value?: string;
    description?: string;
  };
}

interface AccessibilityTree {
  element: string;
  role: string;
  name: string;
  description?: string;
  state?: string;
  value?: string;
  children: AccessibilityTree[];
}

class ScreenReaderTestingEngine {
  private readonly SCREEN_READERS = ['NVDA', 'JAWS', 'VoiceOver', 'TalkBack'];
  private readonly BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  private readonly OPERATING_SYSTEMS = ['Windows', 'macOS', 'iOS', 'Android'];

  private readonly COMMON_COMMANDS: Record<string, ScreenReaderCommand[]> = {
    'NVDA': [
      { key: 'Tab/Shift+Tab', description: 'Navigate between interactive elements', category: 'navigation' },
      { key: 'H/Shift+H', description: 'Navigate through headings', category: 'navigation' },
      { key: '1-6', description: 'Navigate to heading level 1-6', category: 'navigation' },
      { key: 'L/Shift+L', description: 'Navigate through lists', category: 'navigation' },
      { key: 'I/Shift+I', description: 'Navigate through form fields', category: 'navigation' },
      { key: 'B/Shift+B', description: 'Navigate through buttons', category: 'navigation' },
      { key: 'K/Shift+K', description: 'Navigate through links', category: 'navigation' },
      { key: 'T/Shift+T', description: 'Navigate through tables', category: 'navigation' },
      { key: 'G/Shift+G', description: 'Navigate through graphics', category: 'navigation' },
      { key: 'NVDA+F12', description: 'Read current window title', category: 'information' },
      { key: 'NVDA+F1', description: 'Read help for current object', category: 'information' },
      { key: 'NVDA+Space', description: 'Toggle speech mode on/off', category: 'reading' },
      { key: 'NVDA+Up/Down', description: 'Read current line', category: 'reading' },
      { key: 'NVDA+PageUp/PageDown', description: 'Read previous/next paragraph', category: 'reading' },
      { key: 'NVDA+Shift+Up/Down', description: 'Spell current word', category: 'reading' },
      { key: 'NVDA+Ctrl+Up/Down', description: 'Read current character', category: 'reading' },
      { key: 'Enter/Space', description: 'Activate current element', category: 'interaction' },
      { key: 'NVDA+Enter', description: 'Activate in browse mode', category: 'interaction' }
    ],
    'VoiceOver': [
      { key: 'VO+Right/Left', description: 'Navigate to next/previous element', category: 'navigation' },
      { key: 'VO+Ctrl+Right/Left', description: 'Navigate to next/previous item', category: 'navigation' },
      { key: 'VO+Cmd+Right/Left', description: 'Navigate to next/相同 type', category: 'navigation' },
      { key: 'VO+H', description: 'Navigate through headings', category: 'navigation' },
      { key: 'VO+L', description: 'Navigate through lists', category: 'navigation' },
      { key: 'VO+R', description: 'Navigate through form controls', category: 'navigation' },
      { key: 'VO+G', description: 'Navigate through graphics', category: 'navigation' },
      { key: 'VO+T', description: 'Navigate through tables', category: 'navigation' },
      { key: 'VO+I', description: 'Navigate through links', category: 'navigation' },
      { key: 'VO+B', description: 'Navigate through buttons', category: 'navigation' },
      { key: 'VO+Ctrl+Shift+H', description: 'Read heading hierarchy', category: 'information' },
      { key: 'VO+F3', description: 'Read window title', category: 'information' },
      { key: 'VO+Shift+Up/Down', description: 'Read current line', category: 'reading' },
      { key: 'VO+Up/Down', description: 'Read previous/next line', category: 'reading' },
      { key: 'VO+PageUp/PageDown', description: 'Read previous/next paragraph', category: 'reading' },
      { key: 'VO+Ctrl+Shift+U', description: 'Open rotor', category: 'navigation' },
      { key: 'Enter/Space', description: 'Activate current element', category: 'interaction' }
    ]
  };

  /**
   * Run comprehensive screen reader tests for a tool
   */
  async runScreenReaderTest(
    toolSlug: string,
    config: {
      screenReader: 'NVDA' | 'JAWS' | 'VoiceOver' | 'TalkBack';
      browser: 'Chrome' | 'Firefox' | 'Safari' | 'Edge';
      operatingSystem: 'Windows' | 'macOS' | 'iOS' | 'Android';
    }
  ): Promise<ScreenReaderTestResult> {
    const startTime = Date.now();

    try {
      // Initialize screen reader simulation
      const speechOutput: SpeechOutput[] = [];
      const accessibilityTree = await this.buildAccessibilityTree(toolSlug);

      // Test various screen reader scenarios
      const testResults = await Promise.all([
        this.testHeadingsStructure(toolSlug, config, speechOutput),
        this.testLinkPurpose(toolSlug, config, speechOutput),
        this.testFormAccessibility(toolSlug, config, speechOutput),
        this.testButtonPurpose(toolSlug, config, speechOutput),
        this.testImageAltText(toolSlug, config, speechOutput),
        this.testTableHeaders(toolSlug, config, speechOutput),
        this.testListStructure(toolSlug, config, speechOutput),
        this.testAriaLabels(toolSlug, config, speechOutput),
        this.testFocusOrder(toolSlug, config, speechOutput),
        this.testErrorMessages(toolSlug, config, speechOutput)
      ]);

      const issues = testResults.flatMap(result => result.issues);
      const features = this.aggregateFeatures(testResults);
      const score = this.calculateScore(features, issues);

      return {
        toolSlug,
        screenReader: config.screenReader,
        browser: config.browser,
        operatingSystem: config.operatingSystem,
        testedAt: new Date(),
        score,
        issues,
        features,
        transcription: this.generateTranscription(speechOutput),
        recommendations: this.generateRecommendations(issues, features)
      };

    } catch (error) {
      console.error(`Error running screen reader test for ${toolSlug}:`, error);
      throw error;
    }
  }

  /**
   * Test headings structure for screen reader compatibility
   */
  private async testHeadingsStructure(
    toolSlug: string,
    config: any,
    speechOutput: SpeechOutput[]
  ) {
    const issues: any[] = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    // Test heading hierarchy
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));

      if (level > previousLevel + 1) {
        issues.push({
          type: 'heading_hierarchy_skip',
          description: `Heading level skipped: H${previousLevel} to H${level}`,
          severity: AccessibilitySeverity.MODERATE,
          element: heading.tagName.toLowerCase(),
          workaround: 'Restructure headings to follow sequential order'
        });

        speechOutput.push({
          text: `Heading ${level}: ${heading.textContent || 'Empty heading'}. Warning: skipped heading level.`,
          timestamp: new Date(),
          element: this.getElementSelector(heading),
          confidence: 0.9,
          properties: {
            role: 'heading',
            name: heading.textContent || '',
            state: 'invalid_hierarchy'
          }
        });
      } else {
        speechOutput.push({
          text: `Heading ${level}: ${heading.textContent || 'Empty heading'}`,
          timestamp: new Date(),
          element: this.getElementSelector(heading),
          confidence: 0.95,
          properties: {
            role: 'heading',
            name: heading.textContent || '',
            state: 'valid_hierarchy'
          }
        });
      }

      previousLevel = level;

      // Test empty headings
      if (!heading.textContent?.trim() && !heading.getAttribute('aria-label')) {
        issues.push({
          type: 'empty_heading',
          description: 'Heading element is empty or missing text content',
          severity: AccessibilitySeverity.MODERATE,
          element: this.getElementSelector(heading),
          workaround: 'Add descriptive text to heading or use aria-label'
        });
      }
    });

    return { issues, features: { properHeadings: issues.length === 0 } };
  }

  /**
   * Test link purpose and accessibility
   */
  private async testLinkPurpose(
    toolSlug: string,
    config: any,
    speechOutput: SpeechOutput[]
  ) {
    const issues: any[] = [];
    const links = document.querySelectorAll('a[href]');

    links.forEach((link) => {
      const linkText = link.textContent?.trim() || link.getAttribute('aria-label') || '';

      // Test descriptive link text
      if (linkText.length === 0) {
        issues.push({
          type: 'empty_link_text',
          description: 'Link has no descriptive text',
          severity: AccessibilitySeverity.SERIOUS,
          element: this.getElementSelector(link),
          workaround: 'Add descriptive text using link content or aria-label'
        });

        speechOutput.push({
          text: 'Link. Warning: No link text available.',
          timestamp: new Date(),
          element: this.getElementSelector(link),
          confidence: 0.8,
          properties: {
            role: 'link',
            name: '',
            state: 'no_text'
          }
        });
      } else if (linkText.length < 3) {
        issues.push({
          type: 'ambiguous_link_text',
          description: 'Link text is too short to be descriptive',
          severity: AccessibilitySeverity.MODERATE,
          element: this.getElementSelector(link),
          workaround: 'Use more descriptive link text'
        });
      } else {
        speechOutput.push({
          text: `Link: ${linkText}. ${link.getAttribute('href')?.startsWith('http') ? 'External link' : 'Internal link'}`,
          timestamp: new Date(),
          element: this.getElementSelector(link),
          confidence: 0.9,
          properties: {
            role: 'link',
            name: linkText,
            state: 'text_available'
          }
        });
      }

      // Test for "click here" patterns
      if (/^(click|go|here|read more|learn more)$/i.test(linkText)) {
        issues.push({
          type: 'non_descriptive_link',
          description: `Link uses non-descriptive text: "${linkText}"`,
          severity: AccessibilitySeverity.MODERATE,
          element: this.getElementSelector(link),
          workaround: 'Use more descriptive link text that indicates link destination'
        });
      }
    });

    return { issues, features: { linkPurpose: issues.length === 0 } };
  }

  /**
   * Test form accessibility
   */
  private async testFormAccessibility(
    toolSlug: string,
    config: any,
    speechOutput: SpeechOutput[]
  ) {
    const issues: any[] = [];
    const formElements = document.querySelectorAll('input, select, textarea, button[type="submit"]');

    formElements.forEach((element) => {
      const tagName = element.tagName.toLowerCase();
      const elementType = (element as HTMLInputElement).type;
      const hasLabel = element.hasAttribute('aria-label') ||
                      element.hasAttribute('aria-labelledby') ||
                      (element.id && document.querySelector(`label[for="${element.id}"]`));

      if (!hasLabel && elementType !== 'hidden' && elementType !== 'submit') {
        issues.push({
          type: 'missing_form_label',
          description: `${tagName} element is missing associated label`,
          severity: AccessibilitySeverity.SERIOUS,
          element: this.getElementSelector(element),
          workaround: 'Add associated label, aria-label, or aria-labelledby'
        });

        speechOutput.push({
          text: `Form field. Warning: No label found.`,
          timestamp: new Date(),
          element: this.getElementSelector(element),
          confidence: 0.7,
          properties: {
            role: tagName,
            name: '',
            state: 'no_label'
          }
        });
      } else {
        const label = element.getAttribute('aria-label') ||
                     document.querySelector(`label[for="${element.id}"]`)?.textContent ||
                     element.getAttribute('placeholder') || '';

        speechOutput.push({
          text: `${this.getElementRole(element)}: ${label}. ${element.getAttribute('required') ? 'Required' : ''}`,
          timestamp: new Date(),
          element: this.getElementSelector(element),
          confidence: 0.9,
          properties: {
            role: this.getElementRole(element),
            name: label,
            state: element.getAttribute('required') ? 'required' : 'optional'
          }
        });
      }

      // Test form validation feedback
      if (element.hasAttribute('aria-invalid') && element.getAttribute('aria-invalid') === 'true') {
        const describedBy = element.getAttribute('aria-describedby');
        if (!describedBy || !document.querySelector(`#${describedBy}`)) {
          issues.push({
            type: 'missing_error_message',
            description: 'Invalid form element is missing associated error message',
            severity: AccessibilitySeverity.SERIOUS,
            element: this.getElementSelector(element),
            workaround: 'Add aria-describedby pointing to error message element'
          });
        }
      }
    });

    return { issues, features: { formLabels: issues.length === 0 } };
  }

  /**
   * Test button purpose and accessibility
   */
  private async testButtonPurpose(
    toolSlug: string,
    config: any,
    speechOutput: SpeechOutput[]
  ) {
    const issues: any[] = [];
    const buttons = document.querySelectorAll('button, [role="button"]');

    buttons.forEach((button) => {
      const buttonText = button.textContent?.trim() ||
                         button.getAttribute('aria-label') ||
                         button.getAttribute('title') || '';

      if (buttonText.length === 0) {
        issues.push({
          type: 'empty_button_text',
          description: 'Button has no descriptive text',
          severity: AccessibilitySeverity.SERIOUS,
          element: this.getElementSelector(button),
          workaround: 'Add descriptive text using button content, aria-label, or title'
        });

        speechOutput.push({
          text: 'Button. Warning: No button text available.',
          timestamp: new Date(),
          element: this.getElementSelector(button),
          confidence: 0.7,
          properties: {
            role: 'button',
            name: '',
            state: 'no_text'
          }
        });
      } else {
        speechOutput.push({
          text: `Button: ${buttonText}`,
          timestamp: new Date(),
          element: this.getElementSelector(button),
          confidence: 0.9,
          properties: {
            role: 'button',
            name: buttonText,
            state: 'text_available'
          }
        });
      }

      // Test for icon-only buttons
      if (buttonText.length === 0 && button.querySelector('svg, i.icon')) {
        issues.push({
          type: 'icon_only_button',
          description: 'Icon-only button is missing accessible name',
          severity: AccessibilitySeverity.SERIOUS,
          element: this.getElementSelector(button),
          workaround: 'Add aria-label describing button action'
        });
      }
    });

    return { issues, features: { buttonPurpose: issues.length === 0 } };
  }

  /**
   * Test image alt text for screen readers
   */
  private async testImageAltText(
    toolSlug: string,
    config: any,
    speechOutput: SpeechOutput[]
  ) {
    const issues: any[] = [];
    const images = document.querySelectorAll('img');

    images.forEach((img) => {
      const altText = img.getAttribute('alt');

      if (altText === null) {
        issues.push({
          type: 'missing_alt_attribute',
          description: 'Image is missing alt attribute',
          severity: AccessibilitySeverity.SERIOUS,
          element: this.getElementSelector(img),
          workaround: 'Add appropriate alt attribute to image'
        });

        speechOutput.push({
          text: 'Image. Warning: No alt text available.',
          timestamp: new Date(),
          element: this.getElementSelector(img),
          confidence: 0.6,
          properties: {
            role: 'img',
            name: '',
            state: 'no_alt'
          }
        });
      } else if (altText.length > 0) {
        speechOutput.push({
          text: `Image: ${altText}`,
          timestamp: new Date(),
          element: this.getElementSelector(img),
          confidence: 0.95,
          properties: {
            role: 'img',
            name: altText,
            state: 'alt_available'
          }
        });
      } else {
        // Empty alt text for decorative images
        speechOutput.push({
          text: 'Image. Decorative image.',
          timestamp: new Date(),
          element: this.getElementSelector(img),
          confidence: 0.9,
          properties: {
            role: 'img',
            name: '',
            state: 'decorative'
          }
        });
      }
    });

    // Test SVG elements
    const svgs = document.querySelectorAll('svg');
    svgs.forEach((svg) => {
      const title = svg.querySelector('title')?.textContent;
      const ariaLabel = svg.getAttribute('aria-label');
      const ariaLabelledBy = svg.getAttribute('aria-labelledby');

      if (!title && !ariaLabel && !ariaLabelledBy) {
        issues.push({
          type: 'missing_svg_description',
          description: 'SVG element is missing description for screen readers',
          severity: AccessibilitySeverity.MODERATE,
          element: this.getElementSelector(svg),
          workaround: 'Add title element or aria-label to SVG'
        });

        speechOutput.push({
          text: 'Graphic. Warning: No description available.',
          timestamp: new Date(),
          element: this.getElementSelector(svg),
          confidence: 0.7,
          properties: {
            role: 'img',
            name: '',
            state: 'no_description'
          }
        });
      } else {
        speechOutput.push({
          text: `Graphic: ${title || ariaLabel || 'Labeled graphic'}`,
          timestamp: new Date(),
          element: this.getElementSelector(svg),
          confidence: 0.9,
          properties: {
            role: 'img',
            name: title || ariaLabel || '',
            state: 'description_available'
          }
        });
      }
    });

    return { issues, features: { imageAltText: issues.length === 0 } };
  }

  /**
   * Test table headers and structure
   */
  private async testTableHeaders(
    toolSlug: string,
    config: any,
    speechOutput: SpeechOutput[]
  ) {
    const issues: any[] = [];
    const tables = document.querySelectorAll('table');

    tables.forEach((table) => {
      const headers = table.querySelectorAll('th');
      const hasHeaders = headers.length > 0;

      if (!hasHeaders) {
        issues.push({
          type: 'missing_table_headers',
          description: 'Table is missing header cells',
          severity: AccessibilitySeverity.SERIOUS,
          element: this.getElementSelector(table),
          workaround: 'Add th elements for table headers with appropriate scope attributes'
        });

        speechOutput.push({
          text: 'Table. Warning: No headers found.',
          timestamp: new Date(),
          element: this.getElementSelector(table),
          confidence: 0.6,
          properties: {
            role: 'table',
            name: '',
            state: 'no_headers'
          }
        });
      } else {
        speechOutput.push({
          text: `Table with ${headers.length} headers. ${table.rows.length} rows.`,
          timestamp: new Date(),
          element: this.getElementSelector(table),
          confidence: 0.9,
          properties: {
            role: 'table',
            name: '',
            state: 'headers_available'
          }
        });
      }

      // Test caption
      const caption = table.querySelector('caption');
      if (!caption && !table.getAttribute('aria-label')) {
        issues.push({
          type: 'missing_table_caption',
          description: 'Table is missing caption or aria-label for context',
          severity: AccessibilitySeverity.MODERATE,
          element: this.getElementSelector(table),
          workaround: 'Add caption element or aria-label to describe table purpose'
        });
      }

      // Test scope attributes
      headers.forEach((th) => {
        if (!th.hasAttribute('scope') && !th.hasAttribute('id')) {
          issues.push({
            type: 'missing_header_scope',
            description: 'Table header is missing scope or id attribute',
            severity: AccessibilitySeverity.MODERATE,
            element: this.getElementSelector(th),
            workaround: 'Add scope="row" or scope="col" to header'
          });
        }
      });
    });

    return { issues, features: { tableHeaders: issues.length === 0 } };
  }

  /**
   * Test list structure
   */
  private async testListStructure(
    toolSlug: string,
    config: any,
    speechOutput: SpeechOutput[]
  ) {
    const issues: any[] = [];
    const lists = document.querySelectorAll('ul, ol, dl');

    lists.forEach((list) => {
      const listItems = list.querySelectorAll('li');
      const tagName = list.tagName.toLowerCase();

      if (listItems.length === 0) {
        issues.push({
          type: 'empty_list',
          description: 'List contains no items',
          severity: AccessibilitySeverity.MINOR,
          element: this.getElementSelector(list),
          workaround: 'Remove empty list or add list items'
        });
      } else {
        speechOutput.push({
          text: `List with ${listItems.length} items. ${tagName === 'ul' ? 'Unordered' : 'Ordered'} list.`,
          timestamp: new Date(),
          element: this.getElementSelector(list),
          confidence: 0.95,
          properties: {
            role: tagName === 'ul' ? 'list' : tagName === 'ol' ? 'list' : 'list',
            name: `${listItems.length} items`,
            state: 'proper_structure'
          }
        });
      }

      // Test for proper nesting
      listItems.forEach((li) => {
        const nestedLists = li.querySelectorAll('ul, ol');
        nestedLists.forEach((nestedList) => {
          if (!nestedList.parentNode || nestedList.parentNode !== li) {
            issues.push({
              type: 'invalid_list_nesting',
              description: 'List is not properly nested within list item',
              severity: AccessibilitySeverity.MODERATE,
              element: this.getElementSelector(nestedList),
              workaround: 'Ensure lists are nested directly within li elements'
            });
          }
        });
      });
    });

    return { issues, features: { listStructure: issues.length === 0 } };
  }

  /**
   * Test ARIA labels and descriptions
   */
  private async testAriaLabels(
    toolSlug: string,
    config: any,
    speechOutput: SpeechOutput[]
  ) {
    const issues: any[] = [];
    const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');

    elementsWithAria.forEach((element) => {
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      const ariaDescribedBy = element.getAttribute('aria-describedby');

      // Test aria-labelledby
      if (ariaLabelledBy) {
        const labelledElement = document.getElementById(ariaLabelledBy);
        if (!labelledElement) {
          issues.push({
            type: 'invalid_aria_labelledby',
            description: `aria-labelledby references non-existent element: ${ariaLabelledBy}`,
            severity: AccessibilitySeverity.SERIOUS,
            element: this.getElementSelector(element),
            workaround: 'Ensure referenced element exists or remove invalid reference'
          });
        }
      }

      // Test aria-describedby
      if (ariaDescribedBy) {
        const describedElement = document.getElementById(ariaDescribedBy);
        if (!describedElement) {
          issues.push({
            type: 'invalid_aria_describedby',
            description: `aria-describedby references non-existent element: ${ariaDescribedBy}`,
            severity: AccessibilitySeverity.SERIOUS,
            element: this.getElementSelector(element),
            workaround: 'Ensure referenced element exists or remove invalid reference'
          });
        }
      }

      // Test empty aria-label
      if (ariaLabel === '') {
        issues.push({
          type: 'empty_aria_label',
          description: 'Element has empty aria-label attribute',
          severity: AccessibilitySeverity.MODERATE,
          element: this.getElementSelector(element),
          workaround: 'Provide meaningful aria-label or remove empty attribute'
        });
      }
    });

    return { issues, features: { ariaLabels: issues.length === 0 } };
  }

  /**
   * Test focus order for screen readers
   */
  private async testFocusOrder(
    toolSlug: string,
    config: any,
    speechOutput: SpeechOutput[]
  ) {
    const issues: any[] = [];
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'
    );

    // Test logical focus order by checking source order vs visual order
    const focusableArray = Array.from(focusableElements);

    for (let i = 0; i < focusableArray.length; i++) {
      const element = focusableArray[i];
      const elementRect = element.getBoundingClientRect();

      // Check if next focusable element is logically positioned after current one
      if (i < focusableArray.length - 1) {
        const nextElement = focusableArray[i + 1];
        const nextRect = nextElement.getBoundingClientRect();

        // Simple heuristic: check if elements are in logical reading order
        const sourceOrderCorrect = element.compareDocumentPosition(nextElement) & Node.DOCUMENT_POSITION_FOLLOWING;

        if (!sourceOrderCorrect) {
          issues.push({
            type: 'illogical_focus_order',
            description: 'Focus order does not match logical reading order',
            severity: AccessibilitySeverity.SERIOUS,
            element: this.getElementSelector(element),
            workaround: 'Reorder elements in DOM to match logical reading order'
          });
        }
      }

      speechOutput.push({
        text: `${this.getElementRole(element)}: ${this.getElementAccessibleName(element)}`,
        timestamp: new Date(),
        element: this.getElementSelector(element),
        confidence: 0.85,
        properties: {
          role: this.getElementRole(element),
          name: this.getElementAccessibleName(element),
          state: 'focusable'
        }
      });
    }

    return { issues, features: { focusOrder: issues.length === 0 } };
  }

  /**
   * Test error messages for screen readers
   */
  private async testErrorMessages(
    toolSlug: string,
    config: any,
    speechOutput: SpeechOutput[]
  ) {
    const issues: any[] = [];
    const errorElements = document.querySelectorAll(
      '.error, .error-message, [role="alert"], [aria-live="assertive"], [aria-invalid="true"]'
    );

    errorElements.forEach((errorElement) => {
      const errorText = errorElement.textContent?.trim();

      if (!errorText) {
        issues.push({
          type: 'empty_error_message',
          description: 'Error element is present but contains no error text',
          severity: AccessibilitySeverity.SERIOUS,
          element: this.getElementSelector(errorElement),
          workaround: 'Add descriptive error text to error element'
        });
      } else {
        speechOutput.push({
          text: `Error: ${errorText}`,
          timestamp: new Date(),
          element: this.getElementSelector(errorElement),
          confidence: 0.9,
          properties: {
            role: 'alert',
            name: errorText,
            state: 'error_present'
          }
        });
      }

      // Test if error message is properly associated with form control
      const ariaDescribedBy = errorElement.id ? document.querySelector(`[aria-describedby="${errorElement.id}"]`) : null;

      if (!ariaDescribedBy) {
        issues.push({
          type: 'unassociated_error',
          description: 'Error message is not associated with form control',
          severity: AccessibilitySeverity.MODERATE,
          element: this.getElementSelector(errorElement),
          workaround: 'Add aria-describedby to associated form control'
        });
      }
    });

    return { issues, features: { errorMessages: issues.length === 0 } };
  }

  /**
   * Build accessibility tree for the tool
   */
  private async buildAccessibilityTree(toolSlug: string): Promise<AccessibilityTree> {
    // This would typically create a comprehensive accessibility tree
    // For now, return a simplified structure
    return {
      element: 'body',
      role: 'document',
      name: document.title,
      children: []
    };
  }

  /**
   * Aggregate features from test results
   */
  private aggregateFeatures(testResults: any[]) {
    return testResults.reduce((acc, result) => ({
      ...acc,
      ...result.features
    }), {});
  }

  /**
   * Calculate screen reader compatibility score
   */
  private calculateScore(features: any, issues: any[]): number {
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

  /**
   * Generate transcription from speech output
   */
  private generateTranscription(speechOutput: SpeechOutput[]): string {
    return speechOutput.map(output => output.text).join('\n');
  }

  /**
   * Generate recommendations based on issues and features
   */
  private generateRecommendations(issues: any[], features: any): string[] {
    const recommendations: string[] = [];

    // Group issues by type
    const issueGroups = issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {});

    Object.entries(issueGroups).forEach(([type, typeIssues]) => {
      const frequency = typeIssues.length;
      const examples = typeIssues.slice(0, 3).map(i => i.element).join(', ');

      recommendations.push(
        `Fix ${frequency} ${type.replace(/_/g, ' ')} issues. Examples: ${examples}${frequency > 3 ? ` and ${frequency - 3} more` : ''}`
      );
    });

    // Add positive reinforcement for passed features
    Object.entries(features).forEach(([feature, passed]) => {
      if (passed) {
        recommendations.push(`✓ Good ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()} implementation`);
      }
    });

    return recommendations;
  }

  /**
   * Helper methods
   */
  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `${element.tagName.toLowerCase()}.${element.className.split(' ').join('.')}`;
    return element.tagName.toLowerCase();
  }

  private getElementRole(element: Element): string {
    const role = element.getAttribute('role');
    if (role) return role;

    const tagName = element.tagName.toLowerCase();
    const roleMap: Record<string, string> = {
      'a': 'link',
      'button': 'button',
      'input': 'textbox',
      'textarea': 'textbox',
      'select': 'combobox',
      'img': 'image',
      'h1': 'heading',
      'h2': 'heading',
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading'
    };

    return roleMap[tagName] || tagName;
  }

  private getElementAccessibleName(element: Element): string {
    return element.getAttribute('aria-label') ||
           element.getAttribute('title') ||
           element.getAttribute('alt') ||
           element.textContent?.substring(0, 50) || '';
  }
}

export const screenReaderTestingEngine = new ScreenReaderTestingEngine();
export { ScreenReaderTestingEngine };

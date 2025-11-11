/**
 * Visual Accessibility Testing - T166 Implementation
 * Comprehensive testing for color contrast, visual design, and accessibility
 */

import {
  ColorContrastTestResult,
  AccessibilityViolation,
  AccessibilitySeverity,
  AccessibilityTestType,
  WCAGCategory,
  ComplianceLevel
} from './accessibility-compliance-types';

interface ColorCombination {
  foreground: string;
  background: string;
  ratio: number;
  wcagLevel: ComplianceLevel;
  fontSize: 'small' | 'large';
  weight: 'normal' | 'bold';
  element: string;
  passed: boolean;
}

interface TextElement {
  element: Element;
  selector: string;
  text: string;
  foreground: string;
  background: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
  letterSpacing: number;
  isLargeText: boolean;
  isBold: boolean;
}

interface ColorScheme {
  backgroundColors: string[];
  textColors: string[];
  accentColors: string[];
  linkColors: string[];
  errorColors: string[];
  warningColors: string[];
  successColors: string[];
  infoColors: string[];
}

interface ColorPalette {
  name: string;
  type: 'primary' | 'secondary' | 'accent' | 'semantic';
  colors: Record<string, string>;
}

class VisualAccessibilityTestingEngine {
  private readonly WCAG_THRESHOLDS = {
    AA_NORMAL: 4.5,
    AA_LARGE: 3.0,
    AAA_NORMAL: 7.0,
    AAA_LARGE: 4.5,
    NON_TEXT: 3.0
  };

  private readonly COLOR_NAMES: Record<string, string> = {
    '#000000': 'Black',
    '#ffffff': 'White',
    '#ff0000': 'Red',
    '#00ff00': 'Lime',
    '#0000ff': 'Blue',
    '#ffff00': 'Yellow',
    '#ff00ff': 'Magenta',
    '#00ffff': 'Cyan',
    '#808080': 'Gray',
    '#c0c0c0': 'Silver',
    '#800000': 'Maroon',
    '#008000': 'Green',
    '#000080': 'Navy',
    '#808000': 'Olive',
    '#800080': 'Purple',
    '#008080': 'Teal'
  };

  /**
   * Run comprehensive visual accessibility tests for a tool
   */
  async runColorContrastTest(toolSlug: string): Promise<ColorContrastTestResult> {
    const startTime = Date.now();

    try {
      // Get all text elements and color combinations
      const textElements = this.getTextElements();
      const colorCombinations = this.getColorCombinations(textElements);

      // Analyze color schemes
      const colorScheme = this.analyzeColorScheme();

      // Test color contrast
      const combinations = await this.testColorContrast(textElements);
      const issues = this.analyzeContrastIssues(combinations);

      // Test special visual accessibility features
      const [darkModeCompliance, highContrastModeSupport, reducedMotionSupport] = await Promise.all([
        this.testDarkModeCompliance(toolSlug),
        this.testHighContrastModeSupport(),
        this.testReducedMotionSupport()
      ]);

      // Calculate overall score
      const score = this.calculateVisualScore(combinations, issues, {
        darkModeCompliance,
        highContrastModeSupport,
        reducedMotionSupport
      });

      // Generate recommendations
      const recommendations = this.generateVisualRecommendations(issues, {
        darkModeCompliance,
        highContrastModeSupport,
        reducedMotionSupport,
        colorScheme
      });

      return {
        toolSlug,
        testedAt: new Date(),
        score,
        combinations,
        issues,
        overallColorScheme: colorScheme,
        darkModeCompliance,
        lightModeCompliance: true, // Assuming current mode is light
        highContrastModeSupport,
        recommendations
      };

    } catch (error) {
      console.error(`Error running visual accessibility test for ${toolSlug}:`, error);
      throw error;
    }
  }

  /**
   * Get all text elements in the document
   */
  private getTextElements(): TextElement[] {
    const textElements: TextElement[] = [];
    const elements = document.querySelectorAll('*');

    elements.forEach(element => {
      const text = element.textContent?.trim();
      if (!text || text.length === 0) return;

      const style = getComputedStyle(element);
      const display = style.display;
      const visibility = style.visibility;

      // Skip non-visible elements
      if (display === 'none' || visibility === 'hidden') return;

      // Skip elements that are likely decorative
      if (this.isLikelyDecorativeElement(element, text, style)) return;

      const foreground = this.rgbToHex(style.color);
      const background = this.getEffectiveBackgroundColor(element);

      if (!foreground || !background) return;

      const fontSize = parseFloat(style.fontSize);
      const fontWeight = style.fontWeight;
      const lineHeight = parseFloat(style.lineHeight);
      const letterSpacing = parseFloat(style.letterSpacing);

      const isLargeText = this.isLargeText(fontSize);
      const isBold = this.isBoldText(fontWeight);

      textElements.push({
        element,
        selector: this.getElementSelector(element),
        text: text.substring(0, 100),
        foreground,
        background,
        fontSize,
        fontWeight,
        lineHeight,
        letterSpacing,
        isLargeText,
        isBold
      });
    });

    return textElements;
  }

  /**
   * Get all color combinations from text elements
   */
  private getColorCombinations(textElements: TextElement[]): Map<string, ColorCombination[]> {
    const combinations = new Map<string, ColorCombination[]>();

    textElements.forEach(textEl => {
      const ratio = this.calculateContrastRatio(textEl.foreground, textEl.background);
      const wcagLevel = this.getComplianceLevel(ratio, textEl.isLargeText);

      const combination: ColorCombination = {
        foreground: textEl.foreground,
        background: textEl.background,
        ratio,
        wcagLevel,
        fontSize: textEl.isLargeText ? 'large' : 'small',
        weight: textEl.isBold ? 'bold' : 'normal',
        element: textEl.selector,
        passed: wcagLevel !== ComplianceLevel.NON_COMPLIANT
      };

      const key = `${textEl.foreground}-${textEl.background}`;
      if (!combinations.has(key)) {
        combinations.set(key, []);
      }
      combinations.get(key)!.push(combination);
    });

    return combinations;
  }

  /**
   * Test color contrast for all text elements
   */
  private async testColorContrast(textElements: TextElement[]): Promise<ColorCombination[]> {
    const combinations: ColorCombination[] = [];

    textElements.forEach(textEl => {
      const ratio = this.calculateContrastRatio(textEl.foreground, textEl.background);
      const wcagLevel = this.getComplianceLevel(ratio, textEl.isLargeText);

      combinations.push({
        foreground: textEl.foreground,
        background: textEl.background,
        ratio,
        wcagLevel,
        fontSize: textEl.isLargeText ? 'large' : 'small',
        weight: textEl.isBold ? 'bold' : 'normal',
        element: textEl.selector,
        passed: wcagLevel !== ComplianceLevel.NON_COMPLIANT
      });
    });

    return combinations;
  }

  /**
   * Analyze contrast issues
   */
  private analyzeContrastIssues(combinations: ColorCombination[]): any[] {
    const issues: any[] = [];

    // Group by color combination
    const combinationGroups = combinations.reduce((acc, combo) => {
      const key = `${combo.foreground}-${combo.background}`;
      if (!acc[key]) {
        acc[key] = {
          foreground: combo.foreground,
          background: combo.background,
          ratio: combo.ratio,
          elements: []
        };
      }
      acc[key].elements.push(combo.element);
      return acc;
    }, {} as Record<string, any>);

    Object.values(combinationGroups).forEach((group: any) => {
      if (group.ratio < this.WCAG_THRESHOLDS.AA_NORMAL) {
        const severity = group.ratio < 3 ? AccessibilitySeverity.CRITICAL : AccessibilitySeverity.SERIOUS;

        issues.push({
          type: 'insufficient_color_contrast',
          description: `Color contrast ratio ${group.ratio.toFixed(2)} is below WCAG AA requirement of 4.5:1`,
          severity,
          elements: group.elements,
          suggestions: [
            `Increase contrast between ${this.getColorName(group.foreground)} and ${this.getColorName(group.background)}`,
            'Consider using darker text on lighter backgrounds or vice versa',
            'Ensure text remains readable for users with color vision deficiencies'
          ]
        });
      } else if (group.ratio < this.WCAG_THRESHOLDS.AA_LARGE && !this.isLargeTextGroup(group)) {
        issues.push({
          type: 'insufficient_contrast_for_normal_text',
          description: `Color contrast ratio ${group.ratio.toFixed(2)} is below AA requirement for normal text (4.5:1)`,
          severity: AccessibilitySeverity.MODERATE,
          elements: group.elements,
          suggestions: [
            'Increase text size to qualify as large text (>18pt or 14pt bold)',
            'Or improve contrast ratio to meet AA standards'
          ]
        });
      }
    });

    // Test for color-only information
    const colorOnlyElements = this.testColorOnlyInformation();
    issues.push(...colorOnlyElements);

    // Test for sufficient color differentiation
    const colorDiffElements = this.testColorDifferentiation();
    issues.push(...colorDiffElements);

    return issues;
  }

  /**
   * Analyze overall color scheme
   */
  private analyzeColorScheme(): ColorScheme {
    const colors = new Set<string>();
    const backgroundColors = new Set<string>();
    const textColors = new Set<string>();
    const linkColors = new Set<string>();
    const errorColors = new Set<string>();
    const warningColors = new Set<string>();
    const successColors = new Set<string>();
    const infoColors = new Set<string>();

    document.querySelectorAll('*').forEach(element => {
      const style = getComputedStyle(element);

      if (style.color && style.color !== 'rgba(0, 0, 0, 0)') {
        const color = this.rgbToHex(style.color);
        if (color) {
          colors.add(color);
          textColors.add(color);
        }
      }

      if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const bgColor = this.rgbToHex(style.backgroundColor);
        if (bgColor) {
          colors.add(bgColor);
          backgroundColors.add(bgColor);
        }
      }

      // Categorize by element type and class
      if (element.tagName === 'A' || element.getAttribute('role') === 'link') {
        const linkColor = this.rgbToHex(style.color);
        if (linkColor) linkColors.add(linkColor);
      }

      if (element.classList.contains('error') || element.classList.contains('invalid')) {
        const errorColor = this.rgbToHex(style.color || style.backgroundColor);
        if (errorColor) errorColors.add(errorColor);
      }

      if (element.classList.contains('warning')) {
        const warningColor = this.rgbToHex(style.color || style.backgroundColor);
        if (warningColor) warningColors.add(warningColor);
      }

      if (element.classList.contains('success') || element.classList.contains('valid')) {
        const successColor = this.rgbToHex(style.color || style.backgroundColor);
        if (successColor) successColors.add(successColor);
      }

      if (element.classList.contains('info')) {
        const infoColor = this.rgbToHex(style.color || style.backgroundColor);
        if (infoColor) infoColors.add(infoColor);
      }
    });

    return {
      backgroundColors: Array.from(backgroundColors),
      textColors: Array.from(textColors),
      accentColors: Array.from(colors).filter(color =>
        !backgroundColors.has(color) && !textColors.has(color)
      ),
      linkColors: Array.from(linkColors),
      errorColors: Array.from(errorColors),
      warningColors: Array.from(warningColors),
      successColors: Array.from(successColors),
      infoColors: Array.from(infoColors)
    };
  }

  /**
   * Test dark mode compliance
   */
  private async testDarkModeCompliance(toolSlug: string): Promise<boolean> {
    // This would typically test dark mode styles
    // For now, check for dark mode support indicators
    const hasDarkModeStyles =
      document.querySelector('[data-theme="dark"]') !== null ||
      document.querySelector('.dark') !== null ||
      Array.from(document.styleSheets).some(sheet => {
        try {
          return Array.from(sheet.cssRules).some(rule =>
            rule instanceof CSSMediaRule &&
            rule.media.mediaText.includes('prefers-color-scheme: dark')
          );
        } catch (e) {
          return false;
        }
      });

    return hasDarkModeStyles;
  }

  /**
   * Test high contrast mode support
   */
  private async testHighContrastModeSupport(): Promise<boolean> {
    // Check for high contrast mode styles
    const hasHighContrastStyles = Array.from(document.styleSheets).some(sheet => {
      try {
        return Array.from(sheet.cssRules).some(rule =>
          rule instanceof CSSMediaRule &&
          rule.media.mediaText.includes('prefers-contrast: high')
        );
      } catch (e) {
        return false;
      }
    });

    // Check for Windows high contrast mode support
    const hasWindowsHighContrast = Array.from(document.styleSheets).some(sheet => {
      try {
        return Array.from(sheet.cssRules).some(rule =>
          rule instanceof CSSMediaRule &&
          rule.media.mediaText.includes('-ms-high-contrast')
        );
      } catch (e) {
        return false;
      }
    });

    return hasHighContrastStyles || hasWindowsHighContrast;
  }

  /**
   * Test reduced motion support
   */
  private async testReducedMotionSupport(): Promise<boolean> {
    // Check for reduced motion preferences
    const hasReducedMotionStyles = Array.from(document.styleSheets).some(sheet => {
      try {
        return Array.from(sheet.cssRules).some(rule =>
          rule instanceof CSSMediaRule &&
          rule.media.mediaText.includes('prefers-reduced-motion')
        );
      } catch (e) {
        return false;
      }
    });

    return hasReducedMotionStyles;
  }

  /**
   * Test for color-only information
   */
  private testColorOnlyInformation(): any[] {
    const issues: any[] = [];

    // Test for elements that use only color to convey information
    const elementsWithColorOnlyInfo = document.querySelectorAll('*');

    elementsWithColorOnlyInfo.forEach(element => {
      const style = getComputedStyle(element);
      const hasColorInfo = style.color && style.color !== 'rgb(0, 0, 0)' && style.backgroundColor !== 'rgb(255, 255, 255)';
      const hasNonColorInfo =
        element.textContent?.trim().length > 0 ||
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        element.querySelector('svg, i.icon, .icon') === null;

      if (hasColorInfo && !hasNonColorInfo) {
        issues.push({
          type: 'color_only_information',
          description: 'Element conveys information using color only, without text or other indicators',
          severity: AccessibilitySeverity.MODERATE,
          elements: [this.getElementSelector(element)],
          suggestions: [
            'Add text labels or icons to supplement color information',
            'Use patterns or textures in addition to color',
            'Ensure information is accessible to colorblind users'
          ]
        });
      }
    });

    return issues;
  }

  /**
   * Test for color differentiation
   */
  private testColorDifferentiation(): any[] {
    const issues: any[] = [];

    // Test for insufficient color differentiation between interactive states
    const interactiveElements = document.querySelectorAll('a, button, input[type="button"], input[type="submit"]');

    interactiveElements.forEach(element => {
      const style = getComputedStyle(element);
      const color = this.rgbToHex(style.color);
      const backgroundColor = this.rgbToHex(style.backgroundColor);

      // Test hover states if available
      if (element.id) {
        const hoverSelector = `${this.getElementSelector(element)}:hover`;
        // In a real implementation, you'd need to simulate hover or check hover styles
      }
    });

    return issues;
  }

  /**
   * Calculate visual accessibility score
   */
  private calculateVisualScore(
    combinations: ColorCombination[],
    issues: any[],
    features: {
      darkModeCompliance: boolean;
      highContrastModeSupport: boolean;
      reducedMotionSupport: boolean;
    }
  ): number {
    const totalCombinations = combinations.length;
    const passedCombinations = combinations.filter(c => c.passed).length;
    const contrastScore = totalCombinations > 0 ? (passedCombinations / totalCombinations) * 100 : 100;

    // Deduct points for issues based on severity
    let penalty = 0;
    issues.forEach(issue => {
      switch (issue.severity) {
        case AccessibilitySeverity.CRITICAL:
          penalty += 25;
          break;
        case AccessibilitySeverity.SERIOUS:
          penalty += 15;
          break;
        case AccessibilitySeverity.MODERATE:
          penalty += 10;
          break;
        case AccessibilitySeverity.MINOR:
          penalty += 5;
          break;
      }
    });

    // Add points for accessibility features
    let bonus = 0;
    if (features.darkModeCompliance) bonus += 5;
    if (features.highContrastModeSupport) bonus += 10;
    if (features.reducedMotionSupport) bonus += 5;

    const score = Math.max(0, Math.min(100, contrastScore - penalty + bonus));
    return Math.round(score);
  }

  /**
   * Generate visual accessibility recommendations
   */
  private generateVisualRecommendations(
    issues: any[],
    features: {
      darkModeCompliance: boolean;
      highContrastModeSupport: boolean;
      reducedMotionSupport: boolean;
      colorScheme: ColorScheme;
    }
  ): string[] {
    const recommendations: string[] = [];

    // Group issues by type
    const issueGroups = issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(issueGroups).forEach(([type, typeIssues]) => {
      const frequency = typeIssues.length;
      const examples = typeIssues.slice(0, 3).map(i => i.elements[0]).join(', ');

      recommendations.push(
        `Fix ${frequency} ${type.replace(/_/g, ' ')} issue${frequency > 1 ? 's' : ''}. Examples: ${examples}`
      );
    });

    // Add recommendations for missing features
    if (!features.darkModeCompliance) {
      recommendations.push('Implement dark mode styles using prefers-color-scheme media query');
    }

    if (!features.highContrastModeSupport) {
      recommendations.push('Add high contrast mode support using prefers-contrast: high media query');
    }

    if (!features.reducedMotionSupport) {
      recommendations.push('Respect prefers-reduced-motion for users sensitive to motion');
    }

    // Add color palette recommendations
    const { colorScheme } = features;
    if (colorScheme.textColors.length > 8) {
      recommendations.push('Consider reducing the number of text colors for better consistency');
    }

    if (colorScheme.accentColors.length < 3) {
      recommendations.push('Consider adding more accent colors for visual hierarchy');
    }

    // Add general visual accessibility best practices
    recommendations.push('Ensure 4.5:1 contrast ratio for normal text and 3:1 for large text');
    recommendations.push('Use color sparingly and ensure information is not conveyed by color alone');
    recommendations.push('Test with color blindness simulators to ensure accessibility for colorblind users');
    recommendations.push('Consider providing alternative text indicators for color-coded information');

    return recommendations;
  }

  /**
   * Helper methods
   */
  private isLikelyDecorativeElement(element: Element, text: string, style: CSSStyleDeclaration): boolean {
    // Check for decorative patterns
    if (text.length < 3 && !/^[A-Za-z0-9]+$/.test(text)) return true;

    // Check for icon patterns
    if (element.querySelector('svg, i.icon, .icon')) return true;

    // Check for background patterns
    if (element.classList.contains('bg') || element.classList.contains('background')) return true;

    // Check for separator patterns
    if (/^[•·—–]/.test(text) || text.length === 1) return true;

    return false;
  }

  private getEffectiveBackgroundColor(element: Element): string {
    let currentElement = element;
    let backgroundColor: string | null = null;

    while (currentElement && currentElement !== document.body) {
      const style = getComputedStyle(currentElement);
      const bgColor = style.backgroundColor;

      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
        backgroundColor = this.rgbToHex(bgColor);
        break;
      }

      currentElement = currentElement.parentElement!;
    }

    // Fallback to body background
    if (!backgroundColor && currentElement === document.body) {
      const bodyStyle = getComputedStyle(document.body);
      backgroundColor = this.rgbToHex(bodyStyle.backgroundColor);
    }

    return backgroundColor || '#ffffff'; // Default to white
  }

  private rgbToHex(rgb: string): string {
    // Handle rgba values
    const rgbaMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!rgbaMatch) return '';

    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;

    if (a < 1) return ''; // Handle transparent colors

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

  private getComplianceLevel(ratio: number, isLargeText: boolean): ComplianceLevel {
    if (isLargeText) {
      if (ratio >= this.WCAG_THRESHOLDS.AAA_LARGE) return ComplianceLevel.AAA;
      if (ratio >= this.WCAG_THRESHOLDS.AA_LARGE) return ComplianceLevel.AA;
      if (ratio >= this.WCAG_THRESHOLDS.NON_TEXT) return ComplianceLevel.A;
    } else {
      if (ratio >= this.WCAG_THRESHOLDS.AAA_NORMAL) return ComplianceLevel.AAA;
      if (ratio >= this.WCAG_THRESHOLDS.AA_NORMAL) return ComplianceLevel.AA;
      if (ratio >= this.WCAG_THRESHOLDS.NON_TEXT) return ComplianceLevel.A;
    }

    return ComplianceLevel.NON_COMPLIANT;
  }

  private isLargeText(fontSize: number): boolean {
    // 18pt is 24px, 14pt bold is about 18.66px
    return fontSize >= 24 || fontSize >= 18.67;
  }

  private isBoldText(fontWeight: string): boolean {
    const weight = parseInt(fontWeight);
    return weight >= 700;
  }

  private isLargeTextGroup(group: any): boolean {
    return group.elements.some((element: string) => {
      const el = document.querySelector(element);
      if (!el) return false;
      const style = getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = style.fontWeight;
      return this.isLargeText(fontSize) || this.isBoldText(fontWeight);
    });
  }

  private getColorName(hex: string): string {
    const lowerHex = hex.toLowerCase();
    return this.COLOR_NAMES[lowerHex] || hex;
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `${element.tagName.toLowerCase()}.${element.className.split(' ').join('.')}`;
    return element.tagName.toLowerCase();
  }
}

export const visualAccessibilityTestingEngine = new VisualAccessibilityTestingEngine();
export { VisualAccessibilityTestingEngine };

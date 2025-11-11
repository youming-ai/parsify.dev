/**
 * Progress Accessibility Utilities
 * Comprehensive accessibility support for screen readers and assistive technologies
 */

import { ProgressOperation, ProgressStatus, ProgressUpdate } from '@/monitoring/progress-indicators-types';

// ============================================================================
// Accessibility Configuration
// ============================================================================

export interface AccessibilityConfig {
  // Screen reader announcements
  enableAnnouncements: boolean;
  announcementFrequency: number; // milliseconds
  announcePercentage: boolean;
  announceTimeRemaining: boolean;
  announceStepChanges: boolean;
  announceErrors: boolean;

  // Keyboard navigation
  enableKeyboardNavigation: boolean;
  enableFocusManagement: boolean;

  // Visual indicators
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  enableScreenReaderOnly: boolean;

  // Language and localization
  locale: string;
  messages: AccessibilityMessages;
}

export interface AccessibilityMessages {
  loading: string;
  processing: string;
  completed: string;
  failed: string;
  cancelled: string;
  paused: string;
  resumed: string;
  step: string;
  stepOf: string;
  percentComplete: string;
  timeRemaining: string;
  estimatedTime: string;
  error: string;
  warning: string;
  retry: string;
  cancel: string;
  pause: string;
  resume: string;
}

// ============================================================================
// Default Messages (English)
// ============================================================================

const DEFAULT_MESSAGES: AccessibilityMessages = {
  loading: 'Loading',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  paused: 'Paused',
  resumed: 'Resumed',
  step: 'Step',
  stepOf: 'of',
  percentComplete: 'percent complete',
  timeRemaining: 'time remaining',
  estimatedTime: 'Estimated time',
  error: 'Error',
  warning: 'Warning',
  retry: 'Retry',
  cancel: 'Cancel',
  pause: 'Pause',
  resume: 'Resume',
};

// ============================================================================
// Accessibility Manager
// ============================================================================

export class ProgressAccessibilityManager {
  private config: AccessibilityConfig;
  private announcementQueue: string[] = [];
  private announcementTimers: Map<string, NodeJS.Timeout> = new Map();
  private focusedElements: Map<string, HTMLElement> = new Map();
  private lastAnnouncements: Map<string, { message: string; timestamp: number }> = new Map();

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      enableAnnouncements: true,
      announcementFrequency: 5000,
      announcePercentage: true,
      announceTimeRemaining: true,
      announceStepChanges: true,
      announceErrors: true,
      enableKeyboardNavigation: true,
      enableFocusManagement: true,
      enableHighContrast: false,
      enableReducedMotion: false,
      enableScreenReaderOnly: true,
      locale: 'en-US',
      messages: DEFAULT_MESSAGES,
      ...config,
    };

    this.initializeAccessibilityFeatures();
    this.setupGlobalEventListeners();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Create accessible progress container
   */
  public createProgressContainer(operation: ProgressOperation): HTMLElement {
    const container = document.createElement('div');
    container.setAttribute('role', 'progressbar');
    container.setAttribute('aria-label', `${operation.name} progress`);
    container.setAttribute('aria-valuemin', '0');
    container.setAttribute('aria-valuemax', '100');
    container.setAttribute('aria-valuenow', Math.round(operation.progress));
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-busy', operation.status === 'running' ? 'true' : 'false');

    // Add keyboard navigation if enabled
    if (this.config.enableKeyboardNavigation) {
      container.setAttribute('tabindex', '0');
      this.addKeyboardNavigation(container, operation);
    }

    // Add high contrast styles if enabled
    if (this.config.enableHighContrast) {
      container.classList.add('progress-high-contrast');
    }

    // Add reduced motion styles if enabled
    if (this.config.enableReducedMotion) {
      container.classList.add('progress-reduced-motion');
    }

    return container;
  }

  /**
   * Update progress accessibility attributes
   */
  public updateProgressAccessibility(
    element: HTMLElement,
    operation: ProgressOperation,
    update?: ProgressUpdate
  ): void {
    // Update ARIA attributes
    element.setAttribute('aria-valuenow', Math.round(operation.progress));
    element.setAttribute('aria-busy', operation.status === 'running' ? 'true' : 'false');

    // Update status-specific attributes
    if (operation.status === 'completed') {
      element.setAttribute('aria-label', `${operation.name} completed`);
    } else if (operation.status === 'failed') {
      element.setAttribute('aria-label', `${operation.name} failed`);
      element.setAttribute('aria-invalid', 'true');
    } else if (operation.status === 'paused') {
      element.setAttribute('aria-label', `${operation.name} paused`);
    }

    // Make announcements if enabled
    if (this.config.enableAnnouncements) {
      this.makeProgressAnnouncement(operation, update);
    }
  }

  /**
   * Make accessibility announcement
   */
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcementId = `announcement_${Date.now()}`;

    // Add to queue
    this.announcementQueue.push({
      id: announcementId,
      message,
      priority,
      timestamp: Date.now(),
    });

    // Process queue
    this.processAnnouncementQueue();
  }

  /**
   * Create step indicator for screen readers
   */
  public createStepIndicator(
    operation: ProgressOperation,
    currentStep: number,
    totalSteps: number,
    stepName?: string
  ): HTMLElement {
    const indicator = document.createElement('div');
    indicator.setAttribute('role', 'status');
    indicator.setAttribute('aria-live', 'polite');

    const stepText = this.formatStepMessage(operation, currentStep, totalSteps, stepName);
    indicator.textContent = stepText;

    return indicator;
  }

  /**
   * Create error announcement
   */
  public announceError(operation: ProgressOperation, error: Error): void {
    if (!this.config.announceErrors) return;

    const errorMessage = this.formatErrorMessage(operation, error);
    this.announce(errorMessage, 'assertive');
  }

  /**
   * Create status change announcement
   */
  public announceStatusChange(
    operation: ProgressOperation,
    oldStatus: ProgressStatus,
    newStatus: ProgressStatus
  ): void {
    const statusMessage = this.formatStatusChangeMessage(operation, oldStatus, newStatus);
    this.announce(statusMessage, 'polite');
  }

  /**
   * Manage focus for progress updates
   */
  public manageFocus(operationId: string, element: HTMLElement): void {
    if (!this.config.enableFocusManagement) return;

    // Store current focus
    this.focusedElements.set(operationId, document.activeElement as HTMLElement);

    // Focus the progress element
    element.focus();
  }

  /**
   * Restore focus after progress completion
   */
  public restoreFocus(operationId: string): void {
    if (!this.config.enableFocusManagement) return;

    const previousFocus = this.focusedElements.get(operationId);
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }

    this.focusedElements.delete(operationId);
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private initializeAccessibilityFeatures(): void {
    // Create screen reader announcement region
    this.createAnnouncementRegion();

    // Detect user preferences
    this.detectUserPreferences();

    // Apply CSS classes for accessibility
    this.applyAccessibilityStyles();
  }

  private createAnnouncementRegion(): void {
    // Create polite announcement region
    const politeRegion = document.createElement('div');
    politeRegion.id = 'progress-announcements-polite';
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'sr-only';
    document.body.appendChild(politeRegion);

    // Create assertive announcement region
    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'progress-announcements-assertive';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    document.body.appendChild(assertiveRegion);
  }

  private detectUserPreferences(): void {
    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.config.enableReducedMotion = true;
    }

    // Detect high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.config.enableHighContrast = true;
    }

    // Detect screen reader usage (heuristic)
    this.detectScreenReader();
  }

  private detectScreenReader(): void {
    // Common screen reader detection patterns
    const hasScreenReader =
      window.speechSynthesis ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      window.location.search.includes('screenreader=true');

    if (hasScreenReader) {
      this.config.enableScreenReaderOnly = true;
    }
  }

  private applyAccessibilityStyles(): void {
    // Add CSS classes for accessibility features
    const root = document.documentElement;

    if (this.config.enableHighContrast) {
      root.classList.add('progress-high-contrast');
    }

    if (this.config.enableReducedMotion) {
      root.classList.add('progress-reduced-motion');
    }

    if (this.config.enableScreenReaderOnly) {
      root.classList.add('progress-screen-reader');
    }
  }

  private setupGlobalEventListeners(): void {
    // Listen for preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      this.config.enableReducedMotion = e.matches;
    });

    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addEventListener('change', (e) => {
      this.config.enableHighContrast = e.matches;
    });

    // Listen for keyboard shortcuts
    if (this.config.enableKeyboardNavigation) {
      document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
    }
  }

  private addKeyboardNavigation(element: HTMLElement, operation: ProgressOperation): void {
    element.addEventListener('keydown', (event) => {
      switch (event.key) {
        case ' ':
        case 'Enter':
          event.preventDefault();
          this.toggleOperationStatus(operation);
          break;
        case 'Escape':
          event.preventDefault();
          this.cancelOperation(operation);
          break;
        case 'p':
        case 'P':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.pauseOperation(operation);
          }
          break;
      }
    });
  }

  private handleGlobalKeydown(event: KeyboardEvent): void {
    // Global keyboard shortcuts for progress management
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'a':
          event.preventDefault();
          this.announceAllActiveOperations();
          break;
        case 's':
          event.preventDefault();
          this.stopAllAnnouncements();
          break;
      }
    }
  }

  private makeProgressAnnouncement(
    operation: ProgressOperation,
    update?: ProgressUpdate
  ): void {
    // Check if we should announce
    if (!this.shouldAnnounce(operation, update)) return;

    const announcement = this.formatProgressAnnouncement(operation, update);

    // Check for duplicate announcements
    const lastAnnouncement = this.lastAnnouncements.get(operation.id);
    if (lastAnnouncement &&
        lastAnnouncement.message === announcement &&
        Date.now() - lastAnnouncement.timestamp < this.config.announcementFrequency) {
      return;
    }

    this.announce(announcement, 'polite');
    this.lastAnnouncements.set(operation.id, {
      message: announcement,
      timestamp: Date.now(),
    });
  }

  private shouldAnnounce(operation: ProgressOperation, update?: ProgressUpdate): boolean {
    // Don't announce if disabled
    if (!this.config.enableAnnouncements) return false;

    // Always announce status changes
    if (update && update.step) return true;

    // Check percentage change threshold
    const oldProgress = this.lastAnnouncements.get(operation.id)?.timestamp
      ? operation.progress - 10 // Assume 10% progress since last announcement
      : 0;

    if (Math.abs(operation.progress - oldProgress) >= 10) {
      return true;
    }

    // Check time-based frequency
    const lastTime = this.lastAnnouncements.get(operation.id)?.timestamp || 0;
    if (Date.now() - lastTime >= this.config.announcementFrequency) {
      return true;
    }

    return false;
  }

  private formatProgressAnnouncement(
    operation: ProgressOperation,
    update?: ProgressUpdate
  ): string {
    const { messages } = this.config;
    let announcement = '';

    // Base operation name and status
    if (operation.status === 'completed') {
      announcement = `${operation.name} ${messages.completed}`;
    } else if (operation.status === 'failed') {
      announcement = `${operation.name} ${messages.failed}`;
    } else if (operation.status === 'paused') {
      announcement = `${operation.name} ${messages.paused}`;
    } else if (operation.status === 'running') {
      announcement = `${operation.name} ${messages.processing}`;

      // Add percentage if enabled
      if (this.config.announcePercentage) {
        announcement += `, ${Math.round(operation.progress)} ${messages.percentComplete}`;
      }

      // Add time remaining if enabled and available
      if (this.config.announceTimeRemaining && operation.eta) {
        const timeRemaining = this.formatTimeRemaining(operation.eta);
        announcement += `, ${timeRemaining} ${messages.timeRemaining}`;
      }

      // Add step information if available
      if (this.config.announceStepChanges && operation.stepName) {
        announcement += `, ${messages.step}: ${operation.stepName}`;
      }
    }

    return announcement;
  }

  private formatStepMessage(
    operation: ProgressOperation,
    currentStep: number,
    totalSteps: number,
    stepName?: string
  ): string {
    const { messages } = this.config;
    let message = `${operation.name} ${messages.step} ${currentStep} ${messages.stepOf} ${totalSteps}`;

    if (stepName) {
      message += `: ${stepName}`;
    }

    return message;
  }

  private formatErrorMessage(operation: ProgressOperation, error: Error): string {
    const { messages } = this.config;
    return `${messages.error} in ${operation.name}: ${error.message}`;
  }

  private formatStatusChangeMessage(
    operation: ProgressOperation,
    oldStatus: ProgressStatus,
    newStatus: ProgressStatus
  ): string {
    const { messages } = this.config;
    const statusMessages = {
      running: messages.processing,
      paused: messages.paused,
      completed: messages.completed,
      failed: messages.failed,
      cancelled: messages.cancelled,
    };

    const oldStatusMsg = statusMessages[oldStatus] || oldStatus;
    const newStatusMsg = statusMessages[newStatus] || newStatus;

    return `${operation.name} ${oldStatusMsg}, now ${newStatusMsg}`;
  }

  private formatTimeRemaining(eta: Date): string {
    const now = new Date();
    const diff = eta.getTime() - now.getTime();

    if (diff <= 0) return '0 minutes';

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  }

  private processAnnouncementQueue(): void {
    if (this.announcementQueue.length === 0) return;

    const announcement = this.announcementQueue.shift();
    if (!announcement) return;

    const regionId = announcement.priority === 'assertive'
      ? 'progress-announcements-assertive'
      : 'progress-announcements-polite';

    const region = document.getElementById(regionId);
    if (region) {
      region.textContent = announcement.message;

      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  private toggleOperationStatus(operation: ProgressOperation): void {
    // This would be connected to the progress manager
    console.log('Toggle status for operation:', operation.id);
  }

  private cancelOperation(operation: ProgressOperation): void {
    // This would be connected to the progress manager
    console.log('Cancel operation:', operation.id);
  }

  private pauseOperation(operation: ProgressOperation): void {
    // This would be connected to the progress manager
    console.log('Pause operation:', operation.id);
  }

  private announceAllActiveOperations(): void {
    // Announce all currently running operations
    console.log('Announce all active operations');
  }

  private stopAllAnnouncements(): void {
    // Clear all pending announcements
    this.announcementQueue.length = 0;

    // Clear announcement timers
    this.announcementTimers.forEach(timer => clearTimeout(timer));
    this.announcementTimers.clear();

    // Clear announcement regions
    const regions = ['progress-announcements-polite', 'progress-announcements-assertive'];
    regions.forEach(id => {
      const region = document.getElementById(id);
      if (region) {
        region.textContent = '';
      }
    });
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const accessibilityManager = new ProgressAccessibilityManager();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get accessible progress label
 */
export function getAccessibleProgressLabel(operation: ProgressOperation): string {
  const status = operation.status === 'running' ? 'processing' : operation.status;
  return `${operation.name} ${status}, ${Math.round(operation.progress)} percent complete`;
}

/**
 * Create accessible progress description
 */
export function getAccessibleProgressDescription(operation: ProgressOperation): string {
  let description = `${operation.name} is ${operation.status}`;

  if (operation.stepName) {
    description += `, current step: ${operation.stepName}`;
  }

  if (operation.eta) {
    const timeRemaining = accessibilityManager['formatTimeRemaining'](operation.eta);
    description += `, ${timeRemaining} remaining`;
  }

  if (operation.error) {
    description += `, error: ${operation.error.message}`;
  }

  return description;
}

/**
 * Announce progress change
 */
export function announceProgressChange(
  operation: ProgressOperation,
  previousProgress: number
): void {
  const progressChange = Math.abs(operation.progress - previousProgress);

  if (progressChange >= 5) { // Only announce significant changes
    const message = `${operation.name} is ${Math.round(operation.progress)} percent complete`;
    accessibilityManager.announce(message);
  }
}

/**
 * Create accessible progress container
 */
export function createAccessibleProgressContainer(operation: ProgressOperation): HTMLElement {
  return accessibilityManager.createProgressContainer(operation);
}

/**
 * Update progress accessibility
 */
export function updateProgressAccessibility(
  element: HTMLElement,
  operation: ProgressOperation,
  update?: ProgressUpdate
): void {
  accessibilityManager.updateProgressAccessibility(element, operation, update);
}

/**
 * Manage focus for progress operation
 */
export function manageProgressFocus(operationId: string, element: HTMLElement): void {
  accessibilityManager.manageFocus(operationId, element);
}

/**
 * Restore focus after progress completion
 */
export function restoreProgressFocus(operationId: string): void {
  accessibilityManager.restoreFocus(operationId);
}

/**
 * Help System Components Export
 * Central export point for all help system components
 */

// Core components
export { default as ContextAwareTooltip } from './context-aware-tooltip';
export { default as HelpModal } from './help-modal';
export { default as HelpSidebar } from './help-sidebar';
export { default as HelpOverlay } from './help-overlay';

// Provider and hooks
export { HelpSystemProvider, useHelpSystem } from './help-system-provider';

// Types and interfaces
export type {
	HelpSystemState,
	HelpSystemContextType,
} from './help-system-provider';

// Re-export from help system core
export { default as HelpSystemCore } from '@/lib/help-system';

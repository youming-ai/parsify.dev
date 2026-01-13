/**
 * Tool-specific constants
 */

import type { TOOL_CATEGORIES } from '../constants';

// Tool status types
export const TOOL_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

// Tool difficulty levels
export const TOOL_DIFFICULTY = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

// Tool processing types
export const TOOL_PROCESSING_TYPE = {
  CLIENT_SIDE: 'client-side',
  SERVER_SIDE: 'server-side',
  HYBRID: 'hybrid',
} as const;

// Tool security levels
export const TOOL_SECURITY = {
  LOCAL_ONLY: 'local-only',
  ENCRYPTED: 'encrypted',
  SECURE: 'secure',
} as const;

// Tool feature badges
export const TOOL_FEATURES = {
  OFFLINE: 'Offline',
  PRIVATE: 'Private',
  FAST: 'Fast',
  REAL_TIME: 'Real-Time',
  CUSTOMIZABLE: 'Customizable',
} as const;

// Export types
export type ToolStatus = (typeof TOOL_STATUS)[keyof typeof TOOL_STATUS];
export type ToolDifficulty = (typeof TOOL_DIFFICULTY)[keyof typeof TOOL_DIFFICULTY];
export type ToolProcessingType = (typeof TOOL_PROCESSING_TYPE)[keyof typeof TOOL_PROCESSING_TYPE];
export type ToolSecurity = (typeof TOOL_SECURITY)[keyof typeof TOOL_SECURITY];
export type ToolCategory = (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES];

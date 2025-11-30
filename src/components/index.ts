/**
 * Components Index
 * Centralized export for all application components
 */

// UI Components
export * from './ui';

// Layout Components
export { MainLayout } from './layout/main-layout';
export { Footer } from './layout/footer';
export { Header } from './layout/header';
export { Sidebar } from './layout/sidebar';

// Shared Components
export { ToolWrapper, ToolErrorBoundary } from './shared/ToolWrapper';

// Tool Components - File Upload
export { default as FileUpload } from './file-upload/file-upload-component';

// Export component types
export type * from '../types/components';

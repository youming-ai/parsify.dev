/**
 * Zustand Store Usage Examples
 *
 * This file demonstrates how to use the new Zustand stores for state management.
 */

import { useSessionStore, useToolStore } from '@/store';

// ============================================================================
// Tool Store Examples
// ============================================================================

/**
 * Example 1: Save tool state in a component
 */
export function JsonFormatterExample() {
  const { setToolState, getToolState } = useToolStore();

  const handleSave = (jsonData: string, config: { indent: number; sortKeys: boolean }) => {
    setToolState('json-formatter', { content: jsonData }, config, { title: 'My JSON Data' });
  };

  const handleLoad = () => {
    const state = getToolState('json-formatter');
    if (state) {
      console.log('Loaded data:', state.data);
      console.log('Config:', state.config);
    }
  };

  return null; // Component implementation
}

/**
 * Example 2: Update tool data incrementally
 */
export function IncrementalUpdateExample() {
  const { updateToolData } = useToolStore();

  const handleUpdate = () => {
    // This merges with existing data
    updateToolData('my-tool', {
      lastEdit: Date.now(),
      editCount: 5,
    });
  };

  return null;
}

/**
 * Example 3: Access tool state reactively
 */
export function ReactiveStateExample() {
  // This component will re-render when tool state changes
  const tools = useToolStore((state) => state.tools);
  const myToolState = tools['my-tool'];

  return (
    <div>
      {myToolState ? <pre>{JSON.stringify(myToolState.data, null, 2)}</pre> : <p>No data saved</p>}
    </div>
  );
}

// ============================================================================
// Session Store Examples
// ============================================================================

/**
 * Example 4: Manage user preferences
 */
export function PreferencesExample() {
  const { getPreferences, updatePreferences } = useSessionStore();

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme });
  };

  const preferences = getPreferences();
  console.log('Current theme:', preferences.theme);

  return null;
}

/**
 * Example 5: Session management
 */
export function SessionExample() {
  const { createNewSession, switchSession, getAllSessions } = useSessionStore();

  const handleCreateSession = () => {
    const sessionId = createNewSession('user-123');
    console.log('Created session:', sessionId);
  };

  const handleSwitchSession = (sessionId: string) => {
    const success = switchSession(sessionId);
    console.log('Switched:', success);
  };

  const sessions = getAllSessions();
  console.log('All sessions:', sessions);

  return null;
}

/**
 * Example 6: Backup and restore
 */
export function BackupExample() {
  const { createBackup, restoreFromBackup, getBackups } = useSessionStore();

  const handleBackup = () => {
    const backupJson = createBackup();
    // Save to file or send to server
    console.log('Backup created:', backupJson);
  };

  const handleRestore = (backupJson: string) => {
    try {
      restoreFromBackup(backupJson);
      console.log('Restored successfully');
    } catch (error) {
      console.error('Restore failed:', error);
    }
  };

  const backups = getBackups();
  console.log('Available backups:', backups.length);

  return null;
}

// ============================================================================
// Advanced Patterns
// ============================================================================

/**
 * Example 7: Selective re-rendering with selectors
 */
export function OptimizedComponent() {
  // Only re-renders when this specific tool's data changes
  const jsonFormatterData = useToolStore((state) => state.tools['json-formatter']?.data);

  return <div>{jsonFormatterData?.content}</div>;
}

/**
 * Example 8: Using multiple stores together
 */
export function CombinedStoresExample() {
  const { setToolState } = useToolStore();
  const { getPreferences } = useSessionStore();

  const handleSaveWithPreferences = (data: any) => {
    const prefs = getPreferences();

    setToolState('my-tool', data, {
      theme: prefs.theme,
      language: prefs.language,
    });
  };

  return null;
}

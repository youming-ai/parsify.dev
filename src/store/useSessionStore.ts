import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Session Store
 * Manages user sessions and preferences with localStorage persistence
 */

export interface SessionData {
  sessionId: string;
  userId?: string;
  createdAt: number;
  lastModified: number;
  globalConfig: Record<string, any>;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    autoSave: boolean;
    autoSaveInterval: number;
    compactMode: boolean;
    showPerformance: boolean;
  };
}

export interface BackupData {
  sessionId: string;
  timestamp: number;
  version: string;
  data: SessionData;
  checksum: string;
}

interface SessionStoreState {
  currentSession: SessionData | null;
  sessions: SessionData[];
  backups: BackupData[];

  // Session actions
  createNewSession: (userId?: string) => string;
  getCurrentSession: () => SessionData | null;
  switchSession: (sessionId: string) => boolean;
  deleteSession: (sessionId: string) => boolean;
  getAllSessions: () => SessionData[];

  // Config actions
  getGlobalConfig: () => Record<string, any>;
  setGlobalConfig: (config: Record<string, any>) => void;

  // Preferences actions
  getPreferences: () => SessionData['preferences'];
  updatePreferences: (preferences: Partial<SessionData['preferences']>) => void;

  // Backup actions
  createBackup: () => string;
  restoreFromBackup: (backupData: string) => void;
  getBackups: () => BackupData[];
  deleteBackup: (timestamp: number) => boolean;

  // Import/Export
  exportSession: () => string;
  importSession: (sessionData: string, merge?: boolean) => void;
}

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateChecksum = (data: any): string => {
  const dataString = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

const defaultPreferences: SessionData['preferences'] = {
  theme: 'system',
  language: 'en',
  autoSave: true,
  autoSaveInterval: 30,
  compactMode: false,
  showPerformance: false,
};

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessions: [],
      backups: [],

      createNewSession: (userId) => {
        const sessionId = generateSessionId();
        const newSession: SessionData = {
          sessionId,
          userId,
          createdAt: Date.now(),
          lastModified: Date.now(),
          globalConfig: {},
          preferences: { ...defaultPreferences },
        };

        set((state) => ({
          currentSession: newSession,
          sessions: [...state.sessions, newSession],
        }));

        return sessionId;
      },

      getCurrentSession: () => {
        return get().currentSession;
      },

      switchSession: (sessionId) => {
        const state = get();
        const targetSession = state.sessions.find((s) => s.sessionId === sessionId);

        if (!targetSession) {
          return false;
        }

        set({
          currentSession: {
            ...targetSession,
            lastModified: Date.now(),
          },
        });

        return true;
      },

      deleteSession: (sessionId) => {
        const state = get();
        const sessionExists = state.sessions.some((s) => s.sessionId === sessionId);

        if (!sessionExists) {
          return false;
        }

        set((state) => {
          const filteredSessions = state.sessions.filter((s) => s.sessionId !== sessionId);
          let newCurrentSession = state.currentSession;

          // If deleting current session, create a new one
          if (state.currentSession?.sessionId === sessionId) {
            const newSessionId = generateSessionId();
            newCurrentSession = {
              sessionId: newSessionId,
              createdAt: Date.now(),
              lastModified: Date.now(),
              globalConfig: {},
              preferences: { ...defaultPreferences },
            };
            filteredSessions.push(newCurrentSession);
          }

          return {
            sessions: filteredSessions,
            currentSession: newCurrentSession,
          };
        });

        return true;
      },

      getAllSessions: () => {
        return get().sessions;
      },

      getGlobalConfig: () => {
        return get().currentSession?.globalConfig || {};
      },

      setGlobalConfig: (config) => {
        set((state) => {
          if (!state.currentSession) {
            const sessionId = generateSessionId();
            const newSession: SessionData = {
              sessionId,
              createdAt: Date.now(),
              lastModified: Date.now(),
              globalConfig: config,
              preferences: { ...defaultPreferences },
            };
            return {
              currentSession: newSession,
              sessions: [...state.sessions, newSession],
            };
          }

          const updatedSession = {
            ...state.currentSession,
            globalConfig: { ...state.currentSession.globalConfig, ...config },
            lastModified: Date.now(),
          };

          return {
            currentSession: updatedSession,
            sessions: state.sessions.map((s) =>
              s.sessionId === updatedSession.sessionId ? updatedSession : s
            ),
          };
        });
      },

      getPreferences: () => {
        return get().currentSession?.preferences || { ...defaultPreferences };
      },

      updatePreferences: (preferences) => {
        set((state) => {
          if (!state.currentSession) {
            const sessionId = generateSessionId();
            const newSession: SessionData = {
              sessionId,
              createdAt: Date.now(),
              lastModified: Date.now(),
              globalConfig: {},
              preferences: { ...defaultPreferences, ...preferences },
            };
            return {
              currentSession: newSession,
              sessions: [...state.sessions, newSession],
            };
          }

          const updatedSession = {
            ...state.currentSession,
            preferences: { ...state.currentSession.preferences, ...preferences },
            lastModified: Date.now(),
          };

          return {
            currentSession: updatedSession,
            sessions: state.sessions.map((s) =>
              s.sessionId === updatedSession.sessionId ? updatedSession : s
            ),
          };
        });
      },

      createBackup: () => {
        const state = get();
        if (!state.currentSession) {
          throw new Error('No active session to backup');
        }

        const backupData: BackupData = {
          sessionId: state.currentSession.sessionId,
          timestamp: Date.now(),
          version: '1.0.0',
          data: structuredClone(state.currentSession),
          checksum: calculateChecksum(state.currentSession),
        };

        set((state) => ({
          backups: [...state.backups, backupData].slice(-10), // Keep only last 10 backups
        }));

        return JSON.stringify(backupData);
      },

      restoreFromBackup: (backupDataString) => {
        const backup: BackupData = JSON.parse(backupDataString);

        if (!backup.data || !backup.checksum) {
          throw new Error('Invalid backup format');
        }

        const currentChecksum = calculateChecksum(backup.data);
        if (currentChecksum !== backup.checksum) {
          throw new Error('Backup checksum validation failed');
        }

        set((state) => ({
          currentSession: {
            ...backup.data,
            lastModified: Date.now(),
          },
          sessions: state.sessions.map((s) =>
            s.sessionId === backup.data.sessionId ? { ...backup.data, lastModified: Date.now() } : s
          ),
        }));
      },

      getBackups: () => {
        return get().backups;
      },

      deleteBackup: (timestamp) => {
        const state = get();
        const backupExists = state.backups.some((b) => b.timestamp === timestamp);

        if (!backupExists) {
          return false;
        }

        set((state) => ({
          backups: state.backups.filter((b) => b.timestamp !== timestamp),
        }));

        return true;
      },

      exportSession: () => {
        const state = get();
        if (!state.currentSession) {
          throw new Error('No active session to export');
        }
        return JSON.stringify(state.currentSession, null, 2);
      },

      importSession: (sessionDataString, merge = false) => {
        const parsedData: SessionData = JSON.parse(sessionDataString);

        if (!parsedData || typeof parsedData !== 'object') {
          throw new Error('Invalid session data format');
        }

        set((state) => {
          if (merge && state.currentSession) {
            const mergedSession = {
              ...state.currentSession,
              globalConfig: {
                ...state.currentSession.globalConfig,
                ...parsedData.globalConfig,
              },
              preferences: {
                ...state.currentSession.preferences,
                ...parsedData.preferences,
              },
              lastModified: Date.now(),
            };

            return {
              currentSession: mergedSession,
              sessions: state.sessions.map((s) =>
                s.sessionId === mergedSession.sessionId ? mergedSession : s
              ),
            };
          }

          const importedSession = {
            ...parsedData,
            sessionId: parsedData.sessionId || generateSessionId(),
            lastModified: Date.now(),
          };

          return {
            currentSession: importedSession,
            sessions: [...state.sessions, importedSession],
          };
        });
      },
    }),
    {
      name: 'parsify-dev:session-storage',
      version: 1,
    }
  )
);

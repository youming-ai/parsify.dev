/**
 * Tool State Manager
 * Handles session persistence and configuration management for tools
 */

export interface ToolState {
  toolId: string;
  version: string;
  lastModified: number;
  data: any;
  config: Record<string, any>;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
    collaborators?: string[];
  };
}

export interface SessionData {
  sessionId: string;
  userId?: string;
  createdAt: number;
  lastModified: number;
  tools: Record<string, ToolState>;
  globalConfig: Record<string, any>;
  preferences: {
    theme: "light" | "dark" | "system";
    language: string;
    autoSave: boolean;
    autoSaveInterval: number; // seconds
    compactMode: boolean;
    showPerformance: boolean;
  };
}

export interface StateChangeEvent {
  type: "created" | "updated" | "deleted" | "restored";
  toolId: string;
  sessionId: string;
  timestamp: number;
  data?: any;
  previousData?: any;
}

export interface BackupData {
  sessionId: string;
  timestamp: number;
  version: string;
  data: SessionData;
  checksum: string;
}

export class ToolStateManager {
  private static instance: ToolStateManager;
  private currentSession: SessionData | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]>;
  private storageKeys = {
    currentSession: "parsify-dev:current-session",
    sessions: "parsify-dev:sessions",
    backups: "parsify-dev:backups",
    preferences: "parsify-dev:preferences",
  };
  private maxBackups: number = 10;
  private maxSessions: number = 50;
  private sessionTimeout: number = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    this.eventListeners = new Map();
    this.initializeFromStorage();
    this.startAutoSave();
    this.cleanupExpiredSessions();
  }

  public static getInstance(): ToolStateManager {
    if (!ToolStateManager.instance) {
      ToolStateManager.instance = new ToolStateManager();
    }
    return ToolStateManager.instance;
  }

  /**
   * Initialize from localStorage
   */
  private initializeFromStorage(): void {
    try {
      // Load current session
      const currentSessionData = localStorage.getItem(
        this.storageKeys.currentSession,
      );
      if (currentSessionData) {
        this.currentSession = JSON.parse(currentSessionData);
      } else {
        this.createNewSession();
      }

      // Load preferences if not in current session
      const preferencesData = localStorage.getItem(
        this.storageKeys.preferences,
      );
      if (preferencesData && this.currentSession) {
        const preferences = JSON.parse(preferencesData);
        this.currentSession.preferences = {
          ...this.currentSession.preferences,
          ...preferences,
        };
        this.saveSession();
      }
    } catch (error) {
      console.error("Failed to initialize from storage:", error);
      this.createNewSession();
    }
  }

  /**
   * Create a new session
   */
  public createNewSession(userId?: string): string {
    const sessionId = this.generateSessionId();

    this.currentSession = {
      sessionId,
      userId,
      createdAt: Date.now(),
      lastModified: Date.now(),
      tools: {},
      globalConfig: {},
      preferences: {
        theme: "system",
        language: "en",
        autoSave: true,
        autoSaveInterval: 30,
        compactMode: false,
        showPerformance: false,
      },
    };

    this.saveSession();
    this.emit("session:created", { sessionId, userId });
    return sessionId;
  }

  /**
   * Get current session
   */
  public getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Get tool state
   */
  public getToolState(toolId: string): ToolState | null {
    if (!this.currentSession) return null;
    return this.currentSession.tools[toolId] || null;
  }

  /**
   * Set tool state
   */
  public setToolState(
    toolId: string,
    data: any,
    config: Record<string, any> = {},
    metadata?: Partial<ToolState["metadata"]>,
  ): void {
    if (!this.currentSession) {
      this.createNewSession();
    }

    const previousData = this.currentSession!.tools[toolId];
    const toolState: ToolState = {
      toolId,
      version: "1.0.0",
      lastModified: Date.now(),
      data: this.cloneData(data),
      config: this.cloneData(config),
      metadata: metadata
        ? { ...previousData?.metadata, ...metadata }
        : previousData?.metadata,
    };

    this.currentSession!.tools[toolId] = toolState;
    this.currentSession!.lastModified = Date.now();

    this.saveSession();
    this.emit("state:changed", {
      type: previousData ? "updated" : "created",
      toolId,
      sessionId: this.currentSession!.sessionId,
      timestamp: Date.now(),
      data: toolState,
      previousData: previousData?.data,
    } as StateChangeEvent);
  }

  /**
   * Update tool data
   */
  public updateToolData(toolId: string, data: Partial<any>): void {
    const currentState = this.getToolState(toolId);
    if (!currentState) {
      this.setToolState(toolId, data);
      return;
    }

    const mergedData = this.mergeData(currentState.data, data);
    this.setToolState(
      toolId,
      mergedData,
      currentState.config,
      currentState.metadata,
    );
  }

  /**
   * Update tool config
   */
  public updateToolConfig(
    toolId: string,
    config: Partial<Record<string, any>>,
  ): void {
    const currentState = this.getToolState(toolId);
    if (!currentState) {
      this.setToolState(toolId, {}, config);
      return;
    }

    const mergedConfig = { ...currentState.config, ...config };
    this.setToolState(
      toolId,
      currentState.data,
      mergedConfig,
      currentState.metadata,
    );
  }

  /**
   * Delete tool state
   */
  public deleteToolState(toolId: string): boolean {
    if (!this.currentSession || !this.currentSession.tools[toolId]) {
      return false;
    }

    const previousData = this.currentSession.tools[toolId].data;
    delete this.currentSession.tools[toolId];
    this.currentSession.lastModified = Date.now();

    this.saveSession();
    this.emit("state:changed", {
      type: "deleted",
      toolId,
      sessionId: this.currentSession.sessionId,
      timestamp: Date.now(),
      previousData,
    } as StateChangeEvent);

    return true;
  }

  /**
   * Clear all tool states
   */
  public clearAllToolStates(): void {
    if (!this.currentSession) return;

    const toolIds = Object.keys(this.currentSession.tools);
    this.currentSession.tools = {};
    this.currentSession.lastModified = Date.now();

    this.saveSession();
    toolIds.forEach((toolId) => {
      this.emit("state:changed", {
        type: "deleted",
        toolId,
        sessionId: this.currentSession!.sessionId,
        timestamp: Date.now(),
      } as StateChangeEvent);
    });
  }

  /**
   * Get global configuration
   */
  public getGlobalConfig(): Record<string, any> {
    return this.currentSession?.globalConfig || {};
  }

  /**
   * Set global configuration
   */
  public setGlobalConfig(config: Record<string, any>): void {
    if (!this.currentSession) {
      this.createNewSession();
    }

    this.currentSession!.globalConfig = {
      ...this.currentSession!.globalConfig,
      ...config,
    };
    this.currentSession!.lastModified = Date.now();
    this.saveSession();
  }

  /**
   * Get user preferences
   */
  public getPreferences(): SessionData["preferences"] {
    return (
      this.currentSession?.preferences || {
        theme: "system",
        language: "en",
        autoSave: true,
        autoSaveInterval: 30,
        compactMode: false,
        showPerformance: false,
      }
    );
  }

  /**
   * Update user preferences
   */
  public updatePreferences(
    preferences: Partial<SessionData["preferences"]>,
  ): void {
    if (!this.currentSession) {
      this.createNewSession();
    }

    this.currentSession!.preferences = {
      ...this.currentSession!.preferences,
      ...preferences,
    };
    this.currentSession!.lastModified = Date.now();

    // Also save to localStorage for persistence across sessions
    localStorage.setItem(
      this.storageKeys.preferences,
      JSON.stringify(this.currentSession!.preferences),
    );
    this.saveSession();

    this.emit("preferences:updated", {
      preferences: this.currentSession!.preferences,
    });
  }

  /**
   * Export session data
   */
  public exportSession(): string {
    if (!this.currentSession) {
      throw new Error("No active session to export");
    }

    return JSON.stringify(this.currentSession, null, 2);
  }

  /**
   * Import session data
   */
  public importSession(sessionData: string, merge: boolean = false): void {
    try {
      const parsedData: SessionData = JSON.parse(sessionData);

      // Validate session data
      this.validateSessionData(parsedData);

      if (merge && this.currentSession) {
        // Merge with current session
        this.currentSession.tools = {
          ...this.currentSession.tools,
          ...parsedData.tools,
        };
        this.currentSession.globalConfig = {
          ...this.currentSession.globalConfig,
          ...parsedData.globalConfig,
        };
        this.currentSession.preferences = {
          ...this.currentSession.preferences,
          ...parsedData.preferences,
        };
        this.currentSession.lastModified = Date.now();
      } else {
        // Replace current session
        this.currentSession = {
          ...parsedData,
          sessionId: parsedData.sessionId || this.generateSessionId(),
          lastModified: Date.now(),
        };
      }

      this.saveSession();
      this.emit("session:imported", {
        sessionId: this.currentSession.sessionId,
        merged: merge,
      });
    } catch (error) {
      throw new Error(
        `Failed to import session: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create backup
   */
  public createBackup(): string {
    if (!this.currentSession) {
      throw new Error("No active session to backup");
    }

    const backupData: BackupData = {
      sessionId: this.currentSession.sessionId,
      timestamp: Date.now(),
      version: "1.0.0",
      data: this.cloneData(this.currentSession),
      checksum: this.calculateChecksum(this.currentSession),
    };

    // Save backup to localStorage
    const backups = this.getBackups();
    backups.push(backupData);

    // Keep only the most recent backups
    if (backups.length > this.maxBackups) {
      backups.splice(0, backups.length - this.maxBackups);
    }

    localStorage.setItem(this.storageKeys.backups, JSON.stringify(backups));
    return JSON.stringify(backupData);
  }

  /**
   * Restore from backup
   */
  public restoreFromBackup(backupData: string): void {
    try {
      const backup: BackupData = JSON.parse(backupData);

      // Validate backup
      if (!backup.data || !backup.checksum) {
        throw new Error("Invalid backup format");
      }

      // Verify checksum
      const currentChecksum = this.calculateChecksum(backup.data);
      if (currentChecksum !== backup.checksum) {
        throw new Error("Backup checksum validation failed");
      }

      this.currentSession = {
        ...backup.data,
        lastModified: Date.now(),
      };

      this.saveSession();
      this.emit("session:restored", {
        sessionId: this.currentSession.sessionId,
        backupTimestamp: backup.timestamp,
      });
    } catch (error) {
      throw new Error(
        `Failed to restore backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get available backups
   */
  public getBackups(): BackupData[] {
    try {
      const backupsData = localStorage.getItem(this.storageKeys.backups);
      return backupsData ? JSON.parse(backupsData) : [];
    } catch {
      return [];
    }
  }

  /**
   * Delete backup
   */
  public deleteBackup(timestamp: number): boolean {
    const backups = this.getBackups();
    const index = backups.findIndex((backup) => backup.timestamp === timestamp);

    if (index === -1) {
      return false;
    }

    backups.splice(index, 1);
    localStorage.setItem(this.storageKeys.backups, JSON.stringify(backups));
    return true;
  }

  /**
   * Start auto-save
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    const checkAutoSave = () => {
      if (this.currentSession?.preferences.autoSave) {
        this.saveSession();
      }
    };

    // Check every minute
    this.autoSaveTimer = setInterval(checkAutoSave, 60000);
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (!this.currentSession) return;

    try {
      localStorage.setItem(
        this.storageKeys.currentSession,
        JSON.stringify(this.currentSession),
      );

      // Also save to sessions list
      const sessions = this.getAllSessions();
      const existingIndex = sessions.findIndex(
        (s) => s.sessionId === this.currentSession!.sessionId,
      );

      if (existingIndex !== -1) {
        sessions[existingIndex] = { ...this.currentSession };
      } else {
        sessions.push({ ...this.currentSession });
      }

      // Keep only recent sessions
      if (sessions.length > this.maxSessions) {
        sessions.splice(0, sessions.length - this.maxSessions);
      }

      localStorage.setItem(this.storageKeys.sessions, JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }

  /**
   * Get all sessions
   */
  public getAllSessions(): SessionData[] {
    try {
      const sessionsData = localStorage.getItem(this.storageKeys.sessions);
      return sessionsData ? JSON.parse(sessionsData) : [];
    } catch {
      return [];
    }
  }

  /**
   * Switch to a different session
   */
  public switchSession(sessionId: string): boolean {
    const sessions = this.getAllSessions();
    const targetSession = sessions.find((s) => s.sessionId === sessionId);

    if (!targetSession) {
      return false;
    }

    // Save current session before switching
    if (this.currentSession) {
      this.saveSession();
    }

    this.currentSession = { ...targetSession, lastModified: Date.now() };
    this.saveSession();
    this.emit("session:switched", { sessionId });

    return true;
  }

  /**
   * Delete session
   */
  public deleteSession(sessionId: string): boolean {
    const sessions = this.getAllSessions();
    const index = sessions.findIndex((s) => s.sessionId === sessionId);

    if (index === -1) {
      return false;
    }

    sessions.splice(index, 1);
    localStorage.setItem(this.storageKeys.sessions, JSON.stringify(sessions));

    // If deleting current session, create a new one
    if (this.currentSession?.sessionId === sessionId) {
      this.createNewSession();
    }

    this.emit("session:deleted", { sessionId });
    return true;
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const sessions = this.getAllSessions();
    const now = Date.now();
    const validSessions = sessions.filter(
      (session) => now - session.lastModified < this.sessionTimeout,
    );

    if (validSessions.length !== sessions.length) {
      localStorage.setItem(
        this.storageKeys.sessions,
        JSON.stringify(validSessions),
      );
    }

    // Run cleanup every hour
    setTimeout(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  /**
   * Utility methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cloneData(data: any): any {
    if (data === null || data === undefined) return data;
    if (typeof data !== "object") return data;
    if (data instanceof Date) return new Date(data.getTime());
    if (Array.isArray(data)) return data.map((item) => this.cloneData(item));

    const cloned: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        cloned[key] = this.cloneData(data[key]);
      }
    }
    return cloned;
  }

  private mergeData(target: any, source: any): any {
    if (source === null || source === undefined) return target;
    if (typeof source !== "object") return source;

    if (Array.isArray(target) && Array.isArray(source)) {
      return [...target, ...source];
    }

    if (
      typeof target === "object" &&
      typeof source === "object" &&
      !Array.isArray(target)
    ) {
      return { ...target, ...source };
    }

    return source;
  }

  private calculateChecksum(data: any): string {
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private validateSessionData(data: any): void {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid session data format");
    }

    if (!data.tools || typeof data.tools !== "object") {
      throw new Error("Invalid tools data in session");
    }

    if (data.preferences && typeof data.preferences !== "object") {
      throw new Error("Invalid preferences data in session");
    }
  }

  /**
   * Event handling
   */
  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(
          `Error in state manager event listener for ${event}:`,
          error,
        );
      }
    });
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    this.eventListeners.clear();

    // Save final state
    if (this.currentSession) {
      this.saveSession();
    }
  }
}

export default ToolStateManager;

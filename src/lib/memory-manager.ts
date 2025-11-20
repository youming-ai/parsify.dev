/**
 * Memory Manager
 * Manages memory usage with 100MB limits and automatic cleanup
 */

export interface MemoryUsage {
  total: number; // bytes
  used: number; // bytes
  available: number; // bytes
  percentage: number; // 0-100
  limit: number; // bytes
  timestamp: number;
}

export interface MemoryAllocation {
  id: string;
  owner: string; // tool ID or system component
  type: "buffer" | "array" | "object" | "blob" | "canvas" | "wasm" | "other";
  size: number; // bytes
  data: any;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  persistent: boolean;
  metadata?: Record<string, any>;
}

export interface MemoryQuota {
  owner: string;
  limit: number; // bytes
  current: number; // bytes
  priority: "low" | "normal" | "high" | "critical";
}

export interface CleanupStrategy {
  type: "lru" | "lfu" | "fifo" | "priority" | "custom";
  targetReduction: number; // percentage
  maxAge?: number; // milliseconds
  preservePersistent?: boolean;
}

export interface MemoryPressureEvent {
  level: "normal" | "warning" | "critical" | "emergency";
  usage: MemoryUsage;
  timestamp: number;
  actions: string[];
}

export interface MemoryLeak {
  owner: string;
  type: string;
  size: number;
  duration: number; // milliseconds
  description: string;
}

export class MemoryManager {
  private allocations: Map<string, MemoryAllocation>;
  private quotas: Map<string, MemoryQuota>;
  private globalLimit: number;
  private currentUsage: number;
  private monitoringInterval: NodeJS.Timeout | null;
  private pressureThresholds: {
    warning: number; // percentage
    critical: number; // percentage
    emergency: number; // percentage
  };
  private eventListeners: Map<string, Function[]>;
  private leakDetection: Map<string, number>;
  private lastCleanup: number;
  private cleanupHistory: Array<{
    timestamp: number;
    strategy: CleanupStrategy;
    freedMemory: number;
    allocationsCleared: number;
  }>;

  private constructor() {
    this.allocations = new Map();
    this.quotas = new Map();
    this.globalLimit = 100 * 1024 * 1024; // 100MB
    this.currentUsage = 0;
    this.eventListeners = new Map();
    this.leakDetection = new Map();
    this.lastCleanup = Date.now();
    this.cleanupHistory = [];

    this.pressureThresholds = {
      warning: 70, // 70% of limit
      critical: 85, // 85% of limit
      emergency: 95, // 95% of limit
    };

    this.startMonitoring();
    this.setupMemoryListeners();
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Allocate memory
   */
  public allocate(
    owner: string,
    type: MemoryAllocation["type"],
    data: any,
    options: {
      persistent?: boolean;
      metadata?: Record<string, any>;
      quota?: number;
    } = {},
  ): string {
    const id = this.generateAllocationId();
    const size = this.calculateSize(data);

    // Check if allocation would exceed limits
    if (!this.canAllocate(owner, size, options.quota)) {
      throw new Error(`Memory allocation would exceed limits for ${owner}`);
    }

    const allocation: MemoryAllocation = {
      id,
      owner,
      type,
      size,
      data,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      persistent: options.persistent || false,
      metadata: options.metadata,
    };

    this.allocations.set(id, allocation);
    this.currentUsage += size;

    // Update owner quota
    this.updateOwnerQuota(owner, size);

    // Track potential leaks
    this.trackLeakDetection(owner, type, size);

    this.emit("memory:allocated", { allocation, owner, totalUsage: this.currentUsage });

    // Check memory pressure
    this.checkMemoryPressure();

    return id;
  }

  /**
   * Deallocate memory
   */
  public deallocate(id: string): boolean {
    const allocation = this.allocations.get(id);
    if (!allocation) {
      return false;
    }

    this.allocations.delete(id);
    this.currentUsage -= allocation.size;

    // Update owner quota
    this.updateOwnerQuota(allocation.owner, -allocation.size);

    // Clean up data
    this.cleanupData(allocation);

    // Remove from leak detection
    this.leakDetection.delete(id);

    this.emit("memory:deallocated", { allocation, totalUsage: this.currentUsage });
    return true;
  }

  /**
   * Access allocation (updates LRU)
   */
  public access(id: string): any | null {
    const allocation = this.allocations.get(id);
    if (!allocation) {
      return null;
    }

    allocation.lastAccessed = Date.now();
    allocation.accessCount++;

    return allocation.data;
  }

  /**
   * Get memory usage
   */
  public getMemoryUsage(): MemoryUsage {
    const memory = this.getBrowserMemory();

    return {
      total: this.globalLimit,
      used: this.currentUsage,
      available: this.globalLimit - this.currentUsage,
      percentage: (this.currentUsage / this.globalLimit) * 100,
      limit: this.globalLimit,
      timestamp: Date.now(),
      browserMemory: memory,
    } as MemoryUsage & { browserMemory: any };
  }

  /**
   * Get allocations by owner
   */
  public getAllocationsByOwner(owner: string): MemoryAllocation[] {
    return Array.from(this.allocations.values()).filter((a) => a.owner === owner);
  }

  /**
   * Get allocations by type
   */
  public getAllocationsByType(type: MemoryAllocation["type"]): MemoryAllocation[] {
    return Array.from(this.allocations.values()).filter((a) => a.type === type);
  }

  /**
   * Set quota for owner
   */
  public setQuota(
    owner: string,
    limit: number,
    priority: MemoryQuota["priority"] = "normal",
  ): void {
    this.quotas.set(owner, {
      owner,
      limit,
      current: this.getOwnerUsage(owner),
      priority,
    });

    this.emit("quota:set", { owner, limit, priority });
  }

  /**
   * Get quota for owner
   */
  public getQuota(owner: string): MemoryQuota | null {
    const quota = this.quotas.get(owner);
    if (!quota) {
      return null;
    }

    return {
      ...quota,
      current: this.getOwnerUsage(owner),
    };
  }

  /**
   * Execute cleanup strategy
   */
  public async cleanup(strategy: CleanupStrategy): Promise<{
    freedMemory: number;
    allocationsCleared: number;
    strategy: CleanupStrategy;
  }> {
    let freedMemory = 0;
    let allocationsCleared = 0;
    const clearedIds: string[] = [];

    // Get allocations to clear based on strategy
    const targets = this.getCleanupTargets(strategy);

    // Apply cleanup
    for (const allocation of targets) {
      if (allocation.persistent && strategy.preservePersistent) {
        continue;
      }

      const deallocated = this.deallocate(allocation.id);
      if (deallocated) {
        freedMemory += allocation.size;
        allocationsCleared++;
        clearedIds.push(allocation.id);
      }
    }

    // Record cleanup
    this.lastCleanup = Date.now();
    this.cleanupHistory.push({
      timestamp: this.lastCleanup,
      strategy,
      freedMemory,
      allocationsCleared,
    });

    // Maintain cleanup history size
    if (this.cleanupHistory.length > 100) {
      this.cleanupHistory.shift();
    }

    this.emit("memory:cleaned", {
      strategy,
      freedMemory,
      allocationsCleared,
      clearedIds,
      totalUsage: this.currentUsage,
    });

    return { freedMemory, allocationsCleared, strategy };
  }

  /**
   * Detect memory leaks
   */
  public detectLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];
    const now = Date.now();
    const leakThreshold = 5 * 60 * 1000; // 5 minutes

    // Check allocations that haven't been accessed recently
    for (const allocation of this.allocations.values()) {
      const idleTime = now - allocation.lastAccessed;

      if (idleTime > leakThreshold && !allocation.persistent) {
        leaks.push({
          owner: allocation.owner,
          type: allocation.type,
          size: allocation.size,
          duration: idleTime,
          description: `Allocation ${allocation.id} idle for ${Math.round(idleTime / 1000)}s`,
        });
      }
    }

    // Check owners with growing memory usage
    for (const [owner, quota] of this.quotas) {
      if (quota.current > quota.limit * 0.8) {
        const ownerAllocations = this.getAllocationsByOwner(owner);
        const totalSize = ownerAllocations.reduce((sum, a) => sum + a.size, 0);

        if (totalSize > quota.limit) {
          leaks.push({
            owner,
            type: "quota_exceeded",
            size: totalSize - quota.limit,
            duration: 0,
            description: `Owner ${owner} exceeded quota by ${this.formatBytes(totalSize - quota.limit)}`,
          });
        }
      }
    }

    return leaks;
  }

  /**
   * Get cleanup history
   */
  public getCleanupHistory(limit?: number): typeof this.cleanupHistory {
    let history = this.cleanupHistory;
    if (limit && limit > 0) {
      history = history.slice(-limit);
    }
    return history;
  }

  /**
   * Get memory pressure events
   */
  public getMemoryPressureEvents(_limit?: number): MemoryPressureEvent[] {
    // This would require storing pressure events
    // For now, return current pressure level
    const usage = this.getMemoryUsage();
    let level: MemoryPressureEvent["level"] = "normal";

    if (usage.percentage >= this.pressureThresholds.emergency) {
      level = "emergency";
    } else if (usage.percentage >= this.pressureThresholds.critical) {
      level = "critical";
    } else if (usage.percentage >= this.pressureThresholds.warning) {
      level = "warning";
    }

    return [
      {
        level,
        usage,
        timestamp: Date.now(),
        actions: this.getRecommendedActions(level, usage),
      },
    ];
  }

  /**
   * Force garbage collection if available
   */
  public forceGarbageCollection(): boolean {
    if (typeof window !== "undefined" && (window as any).gc) {
      (window as any).gc();
      this.emit("gc:forced");
      return true;
    }
    return false;
  }

  /**
   * Reset memory manager
   */
  public reset(): void {
    // Clear all non-persistent allocations
    const persistentIds = Array.from(this.allocations.entries())
      .filter(([_, allocation]) => allocation.persistent)
      .map(([id, _]) => id);

    for (const id of persistentIds) {
      this.allocations.delete(id);
    }

    this.allocations.clear();
    this.quotas.clear();
    this.currentUsage = 0;
    this.leakDetection.clear();
    this.cleanupHistory = [];

    this.emit("memory:reset");
  }

  /**
   * Get memory statistics
   */
  public getStatistics(): {
    totalAllocations: number;
    activeAllocations: number;
    memoryUsage: MemoryUsage;
    allocationsByType: Record<string, number>;
    allocationsByOwner: Record<string, number>;
    averageAllocationSize: number;
    largestAllocation: MemoryAllocation | null;
    cleanupHistory: typeof this.cleanupHistory;
  } {
    const allocations = Array.from(this.allocations.values());
    const allocationsByType = allocations.reduce(
      (acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const allocationsByOwner = allocations.reduce(
      (acc, a) => {
        acc[a.owner] = (acc[a.owner] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalSize = allocations.reduce((sum, a) => sum + a.size, 0);
    const averageSize = allocations.length > 0 ? totalSize / allocations.length : 0;
    const largestAllocation = allocations.reduce(
      (max, a) => (a.size > (max?.size || 0) ? a : max),
      null,
    );

    return {
      totalAllocations: allocations.length,
      activeAllocations: allocations.length,
      memoryUsage: this.getMemoryUsage(),
      allocationsByType,
      allocationsByOwner,
      averageAllocationSize: averageSize,
      largestAllocation,
      cleanupHistory: this.cleanupHistory,
    };
  }

  private checkMemoryPressure(): void {
    const usage = this.getMemoryUsage();
    let level: MemoryPressureEvent["level"] = "normal";
    let actions: string[] = [];

    if (usage.percentage >= this.pressureThresholds.emergency) {
      level = "emergency";
      actions = [
        "Force immediate cleanup",
        "Deallocate non-persistent memory",
        "Trigger garbage collection",
        "Alert user about memory issues",
      ];

      // Auto-cleanup for emergency
      this.performEmergencyCleanup();
    } else if (usage.percentage >= this.pressureThresholds.critical) {
      level = "critical";
      actions = [
        "Perform aggressive cleanup",
        "Deallocate old allocations",
        "Consider user notification",
      ];

      // Auto-cleanup for critical
      this.performCriticalCleanup();
    } else if (usage.percentage >= this.pressureThresholds.warning) {
      level = "warning";
      actions = [
        "Monitor memory usage",
        "Consider lightweight cleanup",
        "Prepare for potential issues",
      ];
    }

    if (level !== "normal") {
      this.emit("memory:pressure", {
        level,
        usage,
        actions,
        timestamp: Date.now(),
      });
    }
  }

  private performEmergencyCleanup(): void {
    const strategy: CleanupStrategy = {
      type: "priority",
      targetReduction: 50, // Free 50% of memory
      maxAge: 0, // Clear everything non-persistent
      preservePersistent: true,
    };

    this.cleanup(strategy);
  }

  private performCriticalCleanup(): void {
    const strategy: CleanupStrategy = {
      type: "lru",
      targetReduction: 30, // Free 30% of memory
      maxAge: 10 * 60 * 1000, // Clear allocations older than 10 minutes
      preservePersistent: true,
    };

    this.cleanup(strategy);
  }

  private getCleanupTargets(strategy: CleanupStrategy): MemoryAllocation[] {
    let candidates = Array.from(this.allocations.values());

    // Filter by age if specified
    if (strategy.maxAge) {
      const cutoff = Date.now() - strategy.maxAge;
      candidates = candidates.filter((a) => a.createdAt < cutoff);
    }

    // Sort based on strategy
    switch (strategy.type) {
      case "lru":
        candidates.sort((a, b) => a.lastAccessed - b.lastAccessed);
        break;
      case "lfu":
        candidates.sort((a, b) => a.accessCount - b.accessCount);
        break;
      case "fifo":
        candidates.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case "priority":
        candidates.sort((a, b) => {
          const aQuota = this.quotas.get(a.owner);
          const bQuota = this.quotas.get(b.owner);
          const aPriority = aQuota?.priority || "normal";
          const bPriority = bQuota?.priority || "normal";

          const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
          return (
            priorityOrder[aPriority as keyof typeof priorityOrder] -
            priorityOrder[bPriority as keyof typeof priorityOrder]
          );
        });
        break;
    }

    // Calculate target number to clear
    const targetMemory = this.currentUsage * (strategy.targetReduction / 100);
    let clearedMemory = 0;
    const targets: MemoryAllocation[] = [];

    for (const allocation of candidates) {
      if (clearedMemory >= targetMemory) break;
      targets.push(allocation);
      clearedMemory += allocation.size;
    }

    return targets;
  }

  private canAllocate(owner: string, size: number, quota?: number): boolean {
    // Check global limit
    if (this.currentUsage + size > this.globalLimit) {
      return false;
    }

    // Check owner quota
    const ownerQuota = this.quotas.get(owner);
    const limit = quota || ownerQuota?.limit || this.globalLimit;
    const current = this.getOwnerUsage(owner);

    return current + size <= limit;
  }

  private getOwnerUsage(owner: string): number {
    return Array.from(this.allocations.values())
      .filter((a) => a.owner === owner)
      .reduce((sum, a) => sum + a.size, 0);
  }

  private updateOwnerQuota(owner: string, delta: number): void {
    const quota = this.quotas.get(owner);
    if (quota) {
      quota.current = Math.max(0, quota.current + delta);
    }
  }

  private trackLeakDetection(owner: string, type: string, _size: number): void {
    const key = `${owner}:${type}`;
    this.leakDetection.set(key, (this.leakDetection.get(key) || 0) + 1);
  }

  private calculateSize(data: any): number {
    // Simplified size calculation
    if (data === null || data === undefined) return 0;

    if (typeof data === "string") return data.length * 2;
    if (typeof data === "number") return 8;
    if (typeof data === "boolean") return 4;
    if (typeof data === "object") {
      if (data instanceof ArrayBuffer) return data.byteLength;
      if (data instanceof Blob) return data.size;
      if (data instanceof ImageData) return data.data.length;
      if (Array.isArray(data)) return data.length * 8; // Rough estimate
      return JSON.stringify(data).length * 2; // Rough estimate
    }

    return 0;
  }

  private cleanupData(allocation: MemoryAllocation): void {
    // Specific cleanup based on type
    switch (allocation.type) {
      case "blob":
        if (allocation.data instanceof Blob) {
          URL.revokeObjectURL(URL.createObjectURL(allocation.data));
        }
        break;
      case "canvas":
        if (allocation.data instanceof HTMLCanvasElement) {
          allocation.width = 0;
          allocation.height = 0;
        }
        break;
      case "wasm":
        // WASM cleanup would be specific to the runtime
        break;
    }

    // Clear references
    if (allocation.data) {
      (allocation.data as any) = null;
    }
  }

  private getBrowserMemory(): any {
    if (typeof performance !== "undefined" && (performance as any).memory) {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  private getRecommendedActions(
    level: MemoryPressureEvent["level"],
    _usage: MemoryUsage,
  ): string[] {
    switch (level) {
      case "emergency":
        return [
          "Force immediate cleanup",
          "Clear all non-essential memory",
          "Alert user about critical memory usage",
          "Consider reloading the page",
        ];
      case "critical":
        return ["Perform aggressive cleanup", "Clear cached data", "Monitor memory usage closely"];
      case "warning":
        return ["Monitor memory usage", "Consider lightweight cleanup", "Optimize memory usage"];
      default:
        return [];
    }
  }

  private generateAllocationId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Event handling
   */
  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);
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
        console.error(`Error in memory manager event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.reset();
    this.eventListeners.clear();
    this.emit("memory:disposed");
  }
}

export default MemoryManager;

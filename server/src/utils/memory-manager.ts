/**
 * Memory Management Utilities
 */

export class MemoryManager {
  private static instance: MemoryManager;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPeriodicCleanup();
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Start periodic memory cleanup
   */
  private startPeriodicCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Perform memory cleanup
   */
  private performCleanup(): void {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memoryPercentage = (heapUsedMB / heapTotalMB) * 100;

    // If memory usage is high, force garbage collection
    if (memoryPercentage > 80) {
      if (global.gc) {
        global.gc();
        console.log(`🧹 Forced garbage collection. Memory usage: ${memoryPercentage.toFixed(2)}%`);
      } else {
        console.warn('⚠️ High memory usage detected but garbage collection not available');
      }
    }
  }

  /**
   * Get current memory statistics
   */
  public getMemoryStats(): {
    heapUsed: number;
    heapTotal: number;
    percentage: number;
    rss: number;
  } {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    
    return {
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      percentage: (heapUsedMB / heapTotalMB) * 100,
      rss: rssMB
    };
  }

  /**
   * Force immediate cleanup
   */
  public forceCleanup(): void {
    this.performCleanup();
  }

  /**
   * Stop memory manager
   */
  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
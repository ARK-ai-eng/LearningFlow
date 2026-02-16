// DB Performance Tracking
export class DbPerformanceTracker {
  private queryCount = 0;
  private totalDbTime = 0;
  private maxSingleQueryMs = 0;
  
  reset() {
    this.queryCount = 0;
    this.totalDbTime = 0;
    this.maxSingleQueryMs = 0;
  }
  
  trackQuery(durationMs: number) {
    this.queryCount++;
    this.totalDbTime += durationMs;
    if (durationMs > this.maxSingleQueryMs) {
      this.maxSingleQueryMs = durationMs;
    }
  }
  
  getStats() {
    return {
      queryCount: this.queryCount,
      totalDbTime: this.totalDbTime,
      maxSingleQueryMs: this.maxSingleQueryMs,
    };
  }
}

// Global tracker (wird pro Request zurückgesetzt)
export const dbTracker = new DbPerformanceTracker();

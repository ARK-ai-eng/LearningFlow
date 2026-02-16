// Performance-Logging für tRPC
interface Measurement {
  endpoint: string;
  totalMs: number;
  dbMs: number;
  queryCount: number;
  maxSingleQueryMs: number;
  timestamp: number;
}

export function createPerformanceLogger() {
  const measurements: Measurement[] = [];
  
  return {
    log(endpoint: string, totalMs: number, dbMs: number = 0, queryCount: number = 0, maxSingleQueryMs: number = 0) {
      measurements.push({ endpoint, totalMs, dbMs, queryCount, maxSingleQueryMs, timestamp: Date.now() });
      console.log(`[PERF] ${endpoint}: ${totalMs.toFixed(2)}ms (DB: ${dbMs.toFixed(2)}ms, Queries: ${queryCount}, Max: ${maxSingleQueryMs.toFixed(2)}ms)`);
    },
    
    getStats(endpoint: string) {
      const filtered = measurements.filter(m => m.endpoint === endpoint);
      if (filtered.length === 0) return null;
      
      const durations = filtered.map(m => m.totalMs).sort((a, b) => a - b);
      const dbTimes = filtered.map(m => m.dbMs);
      const queryCounts = filtered.map(m => m.queryCount);
      const maxQueryTimes = filtered.map(m => m.maxSingleQueryMs);
      const p50 = durations[Math.floor(durations.length * 0.5)];
      const p95 = durations[Math.floor(durations.length * 0.95)];
      const p99 = durations[Math.floor(durations.length * 0.99)];
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const avgDbMs = dbTimes.reduce((a, b) => a + b, 0) / dbTimes.length;
      const avgQueryCount = queryCounts.reduce((a, b) => a + b, 0) / queryCounts.length;
      const avgMaxQueryMs = maxQueryTimes.reduce((a, b) => a + b, 0) / maxQueryTimes.length;
      
      return { p50, p95, p99, avg, avgDbMs, avgQueryCount, avgMaxQueryMs, count: durations.length };
    },
    
    getAllStats() {
      const endpoints = Array.from(new Set(measurements.map(m => m.endpoint)));
      return endpoints.map(endpoint => ({
        endpoint,
        ...this.getStats(endpoint),
      }));
    },
  };
}

export const perfLogger = createPerformanceLogger();

import { dbTracker } from './db-performance';

/**
 * Wrapper für mysql2 Pool um Query-Zeiten zu messen
 */
export function wrapPool(pool: any) {
  const originalQuery = pool.query.bind(pool);
  const originalExecute = pool.execute.bind(pool);
  
  pool.query = async function(...args: any[]) {
    const startTime = process.hrtime.bigint();
    try {
      const result = await originalQuery(...args);
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      dbTracker.trackQuery(durationMs);
      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      dbTracker.trackQuery(durationMs);
      throw error;
    }
  };
  
  pool.execute = async function(...args: any[]) {
    const startTime = process.hrtime.bigint();
    try {
      const result = await originalExecute(...args);
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      dbTracker.trackQuery(durationMs);
      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      dbTracker.trackQuery(durationMs);
      throw error;
    }
  };
  
  return pool;
}

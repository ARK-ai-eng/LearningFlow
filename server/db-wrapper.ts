import { dbTracker } from "./db-performance";

/**
 * Wrapper für DB-Queries mit automatischem Performance-Tracking
 */
export async function trackQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  const startTime = process.hrtime.bigint();
  const result = await queryFn();
  const endTime = process.hrtime.bigint();
  const durationMs = Number(endTime - startTime) / 1_000_000;
  
  dbTracker.trackQuery(durationMs);
  
  return result;
}

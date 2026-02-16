import { readFileSync } from 'fs';

const logs = readFileSync('.manus-logs/devserver.log', 'utf-8');
const perfLines = logs.split('\n').filter(line => line.includes('[PERF]'));

const measurements = {};

perfLines.forEach(line => {
  const match = line.match(/\[PERF\] (.+?): ([\d.]+)ms \(DB: ([\d.]+)ms, Queries: (\d+)\)/);
  if (match) {
    const [_, endpoint, totalMs, dbMs, queries] = match;
    if (!measurements[endpoint]) measurements[endpoint] = [];
    measurements[endpoint].push({
      totalMs: parseFloat(totalMs),
      dbMs: parseFloat(dbMs),
      queries: parseInt(queries),
    });
  }
});

console.log('\n=== ALLE PERFORMANCE-MESSUNGEN ===\n');
console.log('| Endpoint | Count | P50 | P95 | P99 | AVG | Avg DB | Avg Queries |');
console.log('|----------|-------|-----|-----|-----|-----|--------|-------------|');

Object.entries(measurements).forEach(([endpoint, data]) => {
  const sorted = data.map(d => d.totalMs).sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const avgDb = data.reduce((a, b) => a + b.dbMs, 0) / data.length;
  const avgQueries = data.reduce((a, b) => a + b.queries, 0) / data.length;
  
  console.log(
    `| ${endpoint.padEnd(30)} | ${String(data.length).padEnd(5)} | ` +
    `${p50.toFixed(2).padStart(9)}ms | ${p95.toFixed(2).padStart(9)}ms | ` +
    `${p99.toFixed(2).padStart(9)}ms | ${avg.toFixed(2).padStart(9)}ms | ` +
    `${avgDb.toFixed(2).padStart(10)}ms | ${avgQueries.toFixed(1).padStart(11)} |`
  );
});

console.log('\n');

// Finde langsamsten Endpoint
const slowest = Object.entries(measurements).reduce((max, [endpoint, data]) => {
  const avg = data.reduce((a, b) => a + b.totalMs, 0) / data.length;
  if (!max || avg > max.avg) return { endpoint, avg, count: data.length };
  return max;
}, null);

if (slowest) {
  console.log(`🔴 LANGSAMSTER ENDPOINT: ${slowest.endpoint}`);
  console.log(`   AVG: ${slowest.avg.toFixed(2)}ms`);
  console.log(`   Count: ${slowest.count}`);
}

console.log('\n');

import { readFileSync } from 'fs';

const logs = readFileSync('.manus-logs/devserver.log', 'utf-8');
const perfLines = logs.split('\n').filter(line => line.includes('[PERF]'));

const measurements = {};

perfLines.forEach(line => {
  const match = line.match(/\[PERF\] (.+?): ([\d.]+)ms \(DB: ([\d.]+)ms, Queries: (\d+), Max: ([\d.]+)ms\)/);
  if (match) {
    const [_, endpoint, totalMs, dbMs, queries, maxMs] = match;
    if (!measurements[endpoint]) measurements[endpoint] = [];
    measurements[endpoint].push({
      totalMs: parseFloat(totalMs),
      dbMs: parseFloat(dbMs),
      queries: parseInt(queries),
      maxMs: parseFloat(maxMs),
    });
  }
});

console.log('\n=== DB-INTENSIVE PERFORMANCE RESULTS ===\n');
console.log('| Endpoint | Count | P50 | P95 | P99 | AVG | Avg DB | Avg Q | Max Q |');
console.log('|----------|-------|-----|-----|-----|-----|--------|-------|-------|');

Object.entries(measurements).forEach(([endpoint, data]) => {
  if (data.length < 5) return;
  
  const sorted = data.map(d => d.totalMs).sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const avgDb = data.reduce((a, b) => a + b.dbMs, 0) / data.length;
  const avgQueries = data.reduce((a, b) => a + b.queries, 0) / data.length;
  const avgMaxQuery = data.reduce((a, b) => a + b.maxMs, 0) / data.length;
  
  console.log(
    `| ${endpoint.padEnd(25)} | ${String(data.length).padEnd(5)} | ` +
    `${p50.toFixed(1).padStart(6)}ms | ${p95.toFixed(1).padStart(6)}ms | ` +
    `${p99.toFixed(1).padStart(6)}ms | ${avg.toFixed(1).padStart(6)}ms | ` +
    `${avgDb.toFixed(1).padStart(9)}ms | ${avgQueries.toFixed(1).padStart(5)} | ${avgMaxQuery.toFixed(1).padStart(6)}ms |`
  );
});

console.log('\n');

// Analyse: DB vs. Netzwerk vs. QueryCount vs. Node CPU
const analysis = Object.entries(measurements).map(([endpoint, data]) => {
  const avg = data.reduce((a, b) => a + b.totalMs, 0) / data.length;
  const avgDb = data.reduce((a, b) => a + b.dbMs, 0) / data.length;
  const avgQueries = data.reduce((a, b) => a + b.queries, 0) / data.length;
  const avgMaxQuery = data.reduce((a, b) => a + b.maxMs, 0) / data.length;
  
  const dbPercent = (avgDb / avg) * 100;
  const nodeCpuMs = avg - avgDb;
  
  return {
    endpoint,
    avg,
    avgDb,
    avgQueries,
    avgMaxQuery,
    dbPercent,
    nodeCpuMs,
    count: data.length,
  };
}).filter(a => a.count >= 10).sort((a, b) => b.avg - a.avg);

if (analysis.length > 0) {
  console.log('🔍 ENGPASS-ANALYSE:\n');
  
  analysis.forEach((a, i) => {
    if (i < 3) { // Top 3 langsamste Endpoints
      console.log(`${i + 1}. ${a.endpoint}`);
      console.log(`   Total: ${a.avg.toFixed(1)}ms | DB: ${a.avgDb.toFixed(1)}ms (${a.dbPercent.toFixed(1)}%) | Node CPU: ${a.nodeCpuMs.toFixed(1)}ms`);
      console.log(`   Queries: ${a.avgQueries.toFixed(1)} | Max Query: ${a.avgMaxQuery.toFixed(1)}ms`);
      
      // Dominanz-Analyse
      if (a.dbPercent > 70) {
        console.log(`   🔴 DB DOMINIERT (${a.dbPercent.toFixed(0)}%)`);
      } else if (a.avgQueries > 10) {
        console.log(`   🔴 QUERY-COUNT DOMINIERT (${a.avgQueries.toFixed(0)} Queries)`);
      } else if (a.nodeCpuMs > a.avgDb) {
        console.log(`   🔴 NODE CPU DOMINIERT (${a.nodeCpuMs.toFixed(1)}ms)`);
      } else {
        console.log(`   🟡 BALANCED`);
      }
      console.log('');
    }
  });
}

console.log('\n');

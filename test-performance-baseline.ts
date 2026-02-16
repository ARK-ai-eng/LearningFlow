/**
 * Performance Baseline Test
 * 
 * Führt 30 Requests pro Endpoint aus und berechnet P50/P95/P99
 */

import { perfLogger } from './server/performance-logger';

// Warte 5 Sekunden um sicherzustellen dass Server läuft
console.log('Warte 5 Sekunden auf Server-Start...');
await new Promise(resolve => setTimeout(resolve, 5000));

// Importiere tRPC Client
const { createTRPCProxyClient, httpBatchLink } = await import('@trpc/client');
const { default: superjson } = await import('superjson');

const client = createTRPCProxyClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      headers: {
        // SysAdmin Token (arton.ritter@aismarterflow.de)
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYXJ0b24ucml0dGVyQGFpc21hcnRlcmZsb3cuZGUiLCJyb2xlIjoic3lzYWRtaW4iLCJpYXQiOjE3Mzk1NzY1NTUsImV4cCI6MTc0MDE4MTM1NX0.SZwCmxNGJLHdP3Vxz-Kq8xGKxNfGPWq_oYcWQxCqJ8Y',
      },
    }),
  ],
}) as any;

async function runTests() {
  console.log('\n=== PERFORMANCE BASELINE TEST ===\n');
  
  // Test 1: auth.me (30 Requests)
  console.log('Test 1: auth.me (30 Requests)...');
  for (let i = 0; i < 30; i++) {
    try {
      await client.auth.me.query();
    } catch (error: any) {
      console.error(`  Request ${i + 1} failed:`, error.message);
    }
  }
  
  // Test 2: course.list (30 Requests)
  console.log('Test 2: course.list (30 Requests)...');
  for (let i = 0; i < 30; i++) {
    try {
      await client.course.list.query();
    } catch (error: any) {
      console.error(`  Request ${i + 1} failed:`, error.message);
    }
  }
  
  // Test 3: progress.getAll (30 Requests)
  console.log('Test 3: progress.getAll (30 Requests)...');
  for (let i = 0; i < 30; i++) {
    try {
      await client.progress.getAll.query();
    } catch (error: any) {
      console.error(`  Request ${i + 1} failed:`, error.message);
    }
  }
  
  console.log('\n=== TESTS COMPLETE ===\n');
  console.log('Performance Stats:\n');
  
  // Hole Stats vom Server
  const stats = perfLogger.getAllStats();
  
  // Formatiere Tabelle
  console.log('| Endpoint | Count | P50 | P95 | P99 | AVG | Avg DB | Avg Queries |');
  console.log('|----------|-------|-----|-----|-----|-----|--------|-------------|');
  
  stats.forEach((stat: any) => {
    if (!stat) return;
    console.log(
      `| ${stat.endpoint.padEnd(20)} | ${String(stat.count).padEnd(5)} | ` +
      `${stat.p50?.toFixed(1).padEnd(6)}ms | ${stat.p95?.toFixed(1).padEnd(6)}ms | ` +
      `${stat.p99?.toFixed(1).padEnd(6)}ms | ${stat.avg?.toFixed(1).padEnd(6)}ms | ` +
      `${stat.avgDbMs?.toFixed(1).padEnd(6)}ms | ${stat.avgQueryCount?.toFixed(1).padEnd(11)} |`
    );
  });
  
  console.log('\n');
  
  // Identifiziere Haupt-Engpass
  const slowest = stats.reduce((max: any, stat: any) => {
    if (!stat || !max) return stat || max;
    return (stat.p95 || 0) > (max.p95 || 0) ? stat : max;
  }, null);
  
  if (slowest) {
    console.log(`🔴 HAUPT-ENGPASS: ${slowest.endpoint}`);
    console.log(`   P95: ${slowest.p95?.toFixed(1)}ms`);
    console.log(`   Avg DB Time: ${slowest.avgDbMs?.toFixed(1)}ms (${((slowest.avgDbMs / slowest.avg) * 100).toFixed(1)}% of total)`);
    console.log(`   Avg Queries: ${slowest.avgQueryCount?.toFixed(1)}`);
  }
  
  process.exit(0);
}

runTests().catch(console.error);

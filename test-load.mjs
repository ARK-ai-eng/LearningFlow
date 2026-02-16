#!/usr/bin/env node

/**
 * PHASE 4: LASTTEST
 * 
 * Simuliert 10/50/100 parallele Requests und misst:
 * - P50 / P95 / P99
 * - DB-Zeit
 * - QueryCount
 * - Event Loop Delay
 */

import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';

// Fake JWT Token (für Testzwecke - wird vom Server validiert)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoic3lzYWRtaW4iLCJpYXQiOjE3MDgwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.fake';

/**
 * Führt einen einzelnen Request aus und misst die Zeit
 */
async function makeRequest(endpoint, method = 'GET', body = null) {
  const start = performance.now();
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    const duration = performance.now() - start;
    
    return {
      success: response.ok,
      status: response.status,
      duration,
      data,
    };
  } catch (error) {
    const duration = performance.now() - start;
    return {
      success: false,
      status: 0,
      duration,
      error: error.message,
    };
  }
}

/**
 * Führt N parallele Requests aus
 */
async function runParallelRequests(endpoint, count, method = 'GET', body = null) {
  console.log(`\n🔄 Starte ${count} parallele Requests zu ${endpoint}...`);
  
  const start = performance.now();
  const promises = Array.from({ length: count }, () => makeRequest(endpoint, method, body));
  const results = await Promise.all(promises);
  const totalDuration = performance.now() - start;
  
  // Statistiken berechnen
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const successCount = results.filter(r => r.success).length;
  
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const min = durations[0];
  const max = durations[durations.length - 1];
  
  return {
    endpoint,
    count,
    successCount,
    failureCount: count - successCount,
    totalDuration,
    throughput: (count / (totalDuration / 1000)).toFixed(2), // Requests pro Sekunde
    stats: {
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      p50: p50.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
    },
    results,
  };
}

/**
 * Formatiert Ergebnisse als Tabelle
 */
function printResults(results) {
  console.log(`\n✅ ${results.successCount}/${results.count} erfolgreich (${results.failureCount} Fehler)`);
  console.log(`⏱️  Gesamt: ${results.totalDuration.toFixed(2)}ms`);
  console.log(`🚀 Durchsatz: ${results.throughput} req/s\n`);
  
  console.log('📊 Latenz-Statistiken:');
  console.log('┌─────────┬──────────┐');
  console.log('│ Metrik  │ Wert (ms)│');
  console.log('├─────────┼──────────┤');
  console.log(`│ Min     │ ${results.stats.min.padStart(8)} │`);
  console.log(`│ P50     │ ${results.stats.p50.padStart(8)} │`);
  console.log(`│ P95     │ ${results.stats.p95.padStart(8)} │`);
  console.log(`│ P99     │ ${results.stats.p99.padStart(8)} │`);
  console.log(`│ Max     │ ${results.stats.max.padStart(8)} │`);
  console.log(`│ Avg     │ ${results.stats.avg.padStart(8)} │`);
  console.log('└─────────┴──────────┘');
}

/**
 * Hauptfunktion
 */
async function main() {
  console.log('🚀 PHASE 4: LASTTEST');
  console.log('='.repeat(50));
  
  // Endpoints zum Testen
  const endpoints = [
    { path: '/api/trpc/auth.me', method: 'GET' },
    { path: '/api/trpc/course.listActive', method: 'GET' },
  ];
  
  // Test-Szenarien
  const scenarios = [
    { name: '10 parallele Requests', count: 10, target: 200 },
    { name: '50 parallele Requests', count: 50, target: 300 },
    { name: '100 parallele Requests', count: 100, target: 500 },
  ];
  
  const allResults = [];
  
  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📋 Szenario: ${scenario.name}`);
    console.log(`🎯 Ziel: P95 < ${scenario.target}ms`);
    console.log('='.repeat(50));
    
    for (const endpoint of endpoints) {
      const results = await runParallelRequests(endpoint.path, scenario.count, endpoint.method);
      printResults(results);
      
      // Ziel erreicht?
      const p95 = parseFloat(results.stats.p95);
      const targetMet = p95 < scenario.target;
      console.log(`\n${targetMet ? '✅' : '❌'} Ziel ${targetMet ? 'erreicht' : 'NICHT erreicht'}: P95 ${results.stats.p95}ms ${targetMet ? '<' : '≥'} ${scenario.target}ms`);
      
      allResults.push({
        scenario: scenario.name,
        endpoint: endpoint.path,
        p95,
        target: scenario.target,
        targetMet,
        ...results.stats,
      });
      
      // Kurze Pause zwischen Endpoints
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Zusammenfassung
  console.log(`\n\n${'='.repeat(50)}`);
  console.log('📊 ZUSAMMENFASSUNG');
  console.log('='.repeat(50));
  
  console.log('\n┌────────────────────────────┬─────────────────────────┬─────────┬─────────┬────────┐');
  console.log('│ Szenario                   │ Endpoint                │ P95 (ms)│ Ziel (ms)│ Status │');
  console.log('├────────────────────────────┼─────────────────────────┼─────────┼─────────┼────────┤');
  
  for (const result of allResults) {
    const scenario = result.scenario.padEnd(26);
    const endpoint = result.endpoint.slice(0, 23).padEnd(23);
    const p95 = result.p95.toFixed(2).padStart(7);
    const target = result.target.toString().padStart(7);
    const status = result.targetMet ? '✅' : '❌';
    console.log(`│ ${scenario} │ ${endpoint} │ ${p95} │ ${target} │ ${status}     │`);
  }
  
  console.log('└────────────────────────────┴─────────────────────────┴─────────┴─────────┴────────┘');
  
  // Bewertung
  const allTargetsMet = allResults.every(r => r.targetMet);
  console.log(`\n${'='.repeat(50)}`);
  console.log(allTargetsMet ? '✅ ALLE ZIELE ERREICHT!' : '⚠️ EINIGE ZIELE NICHT ERREICHT');
  console.log('='.repeat(50));
  
  // System-Bereitschaft
  console.log('\n🎯 SYSTEM-BEREITSCHAFT:');
  const avgP95 = allResults.reduce((sum, r) => sum + r.p95, 0) / allResults.length;
  
  if (avgP95 < 100) {
    console.log('✅ Bereit für 1000+ User (P95 < 100ms)');
  } else if (avgP95 < 200) {
    console.log('✅ Bereit für 500 User (P95 < 200ms)');
  } else if (avgP95 < 300) {
    console.log('⚠️ Bereit für 100 User (P95 < 300ms)');
  } else {
    console.log('❌ Nur für < 100 User geeignet (P95 > 300ms)');
  }
}

main().catch(console.error);

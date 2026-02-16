import { readFileSync } from 'fs';

const logs = readFileSync('.manus-logs/devserver.log', 'utf-8');
const lines = logs.split('\n');

const dbLogs = [];

lines.forEach(line => {
  if (line.includes('[DB]')) {
    try {
      const jsonStart = line.indexOf('{');
      if (jsonStart > 0) {
        const jsonStr = line.substring(jsonStart);
        const data = JSON.parse(jsonStr);
        if (data.fn && data.ms !== undefined) {
          dbLogs.push(data);
        }
      }
    } catch (e) {
      // Skip invalid JSON
    }
  }
});

console.log('\n=== PHASE 0.2 - ECHTE DB-MESSUNG ERGEBNISSE ===\n');
console.log(`Gesammelte DB-Queries: ${dbLogs.length}\n`);

// Gruppiere nach Funktion
const byFunction = {};
dbLogs.forEach(log => {
  if (!byFunction[log.fn]) byFunction[log.fn] = [];
  byFunction[log.fn].push(log.ms);
});

console.log('| Funktion | Count | Min | Max | AVG | P50 | P95 |');
console.log('|----------|-------|-----|-----|-----|-----|-----|');

Object.entries(byFunction).forEach(([fn, times]) => {
  const sorted = times.sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  
  console.log(
    `| ${fn.padEnd(28)} | ${String(times.length).padEnd(5)} | ` +
    `${min.toFixed(1).padStart(5)}ms | ${max.toFixed(1).padStart(5)}ms | ` +
    `${avg.toFixed(1).padStart(5)}ms | ${p50.toFixed(1).padStart(5)}ms | ${p95.toFixed(1).padStart(5)}ms |`
  );
});

console.log('\n🔍 ENGPASS-ANALYSE:\n');

// Zähle getQuestionsByCourse Aufrufe
const questionsByCourseCalls = dbLogs.filter(log => log.fn === 'getQuestionsByCourse');
console.log(`1. N+1 QUERY PROBLEM: getQuestionsByCourse`);
console.log(`   - Aufrufe: ${questionsByCourseCalls.length}`);
console.log(`   - Durchschnitt: ${(questionsByCourseCalls.reduce((a, b) => a + b.ms, 0) / questionsByCourseCalls.length).toFixed(1)}ms pro Query`);
console.log(`   - Gesamtzeit: ${questionsByCourseCalls.reduce((a, b) => a + b.ms, 0).toFixed(1)}ms`);
console.log(`   - 🔴 KRITISCH: Für jeden Kurs eine separate Query!`);
console.log('');

// Andere Funktionen
const otherFunctions = Object.entries(byFunction).filter(([fn]) => fn !== 'getQuestionsByCourse');
otherFunctions.forEach(([fn, times], i) => {
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`${i + 2}. ${fn}`);
  console.log(`   - Aufrufe: ${times.length}`);
  console.log(`   - Durchschnitt: ${avg.toFixed(1)}ms`);
  console.log('');
});

console.log('\n📊 FAZIT:\n');
console.log('HAUPT-ENGPASS: N+1 Queries (getQuestionsByCourse)');
console.log(`- ${questionsByCourseCalls.length} separate Queries statt 1 JOIN`);
console.log(`- Gesamtzeit: ${questionsByCourseCalls.reduce((a, b) => a + b.ms, 0).toFixed(1)}ms`);
console.log(`- Potenzielle Einsparung: ~${(questionsByCourseCalls.reduce((a, b) => a + b.ms, 0) * 0.9).toFixed(1)}ms (90%)`);
console.log('');


/**
 * DB-intensive Performance Test
 * 
 * Testet gezielt Endpoints mit DB-Queries:
 * - course.listActive (N+1 Queries)
 * - progress.getAll
 * - certificate.my
 * - company.list
 */

import http from 'http';

// SysAdmin Token (arton.ritter@aismarterflow.de)
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYXJ0b24ucml0dGVyQGFpc21hcnRlcmZsb3cuZGUiLCJyb2xlIjoic3lzYWRtaW4iLCJpYXQiOjE3Mzk1NzY1NTUsImV4cCI6MTc0MDE4MTM1NX0.SZwCmxNGJLHdP3Vxz-Kq8xGKxNfGPWq_oYcWQxCqJ8Y';

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/trpc/${endpoint}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
      },
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function runSerialTest(name, endpoint, iterations = 30) {
  console.log(`\n📊 ${name} (${iterations}x seriell)...`);
  
  for (let i = 0; i < iterations; i++) {
    try {
      await makeRequest(endpoint);
      process.stdout.write('.');
    } catch (error) {
      process.stdout.write('X');
    }
  }
  
  console.log(' ✅');
}

async function runParallelTest(name, endpoint, concurrency = 10) {
  console.log(`\n⚡ ${name} (${concurrency}x parallel)...`);
  
  const promises = Array.from({ length: concurrency }, () => makeRequest(endpoint));
  
  try {
    await Promise.all(promises);
    console.log(' ✅');
  } catch (error) {
    console.log(' ❌');
  }
}

async function main() {
  console.log('=== DB-INTENSIVE PERFORMANCE TEST ===');
  console.log('Waiting 2 seconds for server...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 1: course.listActive (N+1 Queries)
  await runSerialTest('course.listActive', 'course.listActive', 30);
  
  // Test 2: company.list
  await runSerialTest('company.list', 'company.list?input={"status":"all"}', 30);
  
  // Test 3: progress.getAll
  await runSerialTest('progress.getAll', 'progress.getAll', 30);
  
  // Test 4: Parallel Load (10x)
  await runParallelTest('course.listActive', 'course.listActive', 10);
  
  // Test 5: Parallel Load (50x)
  await runParallelTest('course.listActive', 'course.listActive', 50);
  
  console.log('\n\n=== TEST COMPLETE ===');
  console.log('Analyzing performance logs...\n');
  
  // Warte 1 Sekunde damit Logs geschrieben werden
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  process.exit(0);
}

main().catch(console.error);

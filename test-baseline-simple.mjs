/**
 * Simple Performance Baseline Test mit direkten HTTP-Requests
 */

import http from 'http';

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

async function runTest(name, endpoint, iterations = 30) {
  console.log(`\nTesting: ${name} (${iterations} requests)...`);
  
  for (let i = 0; i < iterations; i++) {
    try {
      await makeRequest(endpoint);
      process.stdout.write('.');
    } catch (error) {
      process.stdout.write('X');
    }
  }
  
  console.log(' Done!');
}

async function main() {
  console.log('=== PERFORMANCE BASELINE TEST ===');
  console.log('Waiting 2 seconds for server...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await runTest('auth.me', 'auth.me');
  await runTest('course.list', 'course.list');
  await runTest('company.list', 'company.list');
  
  console.log('\n\n=== TEST COMPLETE ===');
  console.log('Check server logs for [PERF] entries:');
  console.log('  tail -100 .manus-logs/devserver.log | grep "[PERF]"\n');
  
  process.exit(0);
}

main().catch(console.error);

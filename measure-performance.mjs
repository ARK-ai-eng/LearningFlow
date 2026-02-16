import https from 'https';
import http from 'http';

const API_URL = 'https://3000-i4nbmutoxv9nfwmqk4ql2-4545cbf0.us2.manus.computer';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYXJ0b24ucml0dGVyQGFpc21hcnRlcmZsb3cuZGUiLCJyb2xlIjoic3lzYWRtaW4iLCJpYXQiOjE3Mzk1NzY1NTUsImV4cCI6MTc0MDE4MTM1NX0.SZwCmxNGJLHdP3Vxz-Kq8xGKxNfGPWq_oYcWQxCqJ8Y'; // Placeholder

function measureRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const startTime = process.hrtime.bigint();
    
    const url = new URL(endpoint, API_URL);
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000; // Convert to ms
        resolve({ duration, status: res.statusCode, data });
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function measureEndpoint(name, endpoint, iterations = 10) {
  console.log(`\n=== Measuring: ${name} ===`);
  const durations = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
      const { duration, status } = await measureRequest(endpoint);
      durations.push(duration);
      console.log(`  Request ${i + 1}: ${duration.toFixed(2)}ms (${status})`);
    } catch (error) {
      console.error(`  Request ${i + 1}: ERROR - ${error.message}`);
    }
  }
  
  durations.sort((a, b) => a - b);
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  
  console.log(`\n  P50: ${p50?.toFixed(2)}ms`);
  console.log(`  P95: ${p95?.toFixed(2)}ms`);
  console.log(`  P99: ${p99?.toFixed(2)}ms`);
  console.log(`  AVG: ${avg.toFixed(2)}ms`);
  
  return { p50, p95, p99, avg };
}

async function main() {
  console.log('=== PERFORMANCE BASELINE MEASUREMENT ===');
  console.log(`API URL: ${API_URL}`);
  console.log(`Iterations: 10 per endpoint\n`);
  
  // Measure critical endpoints
  await measureEndpoint('auth.me', '/api/trpc/auth.me');
  await measureEndpoint('course.listActive', '/api/trpc/course.listActive');
  await measureEndpoint('progress.my', '/api/trpc/progress.my');
  
  console.log('\n=== MEASUREMENT COMPLETE ===');
}

main().catch(console.error);

const http = require('http');

function request(opts) {
  return new Promise((resolve, reject) => {
    const req = http.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function main() {
  // Step 1: Login
  const data = JSON.stringify({ login: 'admin', password: 'admin123' });
  const loginRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
  , body: data });
  console.log('Login status:', loginRes.status);
  const cookies = (loginRes.headers['set-cookie'] || []).join('; ');
  console.log('Set-Cookie:', cookies);

  // Step 2: Check session with the cookie
  const sessRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/session',
    headers: { 'Cookie': cookies }
  });
  console.log('Session check status:', sessRes.status);
  console.log('Session response:', sessRes.body);

  // Step 3: Check session from a different "page" (different path)
  const sessRes2 = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/session',
    headers: { 'Cookie': cookies, 'Referer': 'http://localhost:3000/' }
  });
  console.log('Session check (from main page) status:', sessRes2.status);
  console.log('Session response:', sessRes2.body);

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });

const http = require('http');
const { runSql } = require('./mssql-adapter');

async function makeRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Login as admin
  const loginData = JSON.stringify({ login: 'admin', password: 'admin123' });
  const loginRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/admin/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
  }, loginData);
  console.log('Login:', loginRes.status);
  const cookie = (loginRes.headers['set-cookie'] || []).join('; ');

  // Try to create a new admin
  const createData = JSON.stringify({ login: 'testadmin', password: 'test123', superAdmin: false });
  const createRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/admin', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(createData), 'Cookie': cookie }
  }, createData);
  console.log('Create admin:', createRes.status, createRes.body);

  // Clean up - delete the test admin
  // First get all admins to find the id
  const allRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/admin/all',
    headers: { 'Cookie': cookie }
  });
  console.log('All admins:', allRes.body);

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });

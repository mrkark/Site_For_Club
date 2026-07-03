// MSSQL connection helper for Karate Club
// Install: npm install mssql
// Then set connection string in environment variable MSSQL_CONN_STR
//
// Example connection string:
// Server=localhost;Database=KarateClub;Trusted_Connection=true;TrustServerCertificate=true;

const sql = require('mssql');

const config = {
  connectionString: process.env.MSSQL_CONN_STR || 'Server=localhost;Database=KarateClub;Trusted_Connection=true;TrustServerCertificate=true;'
};

let pool = null;

async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config.connectionString);
  return pool;
}

async function queryAll(sqlQuery, params = []) {
  const p = await getPool();
  const request = p.request();
  params.forEach((val, i) => {
    request.input(`p${i}`, val);
  });
  const result = await request.query(sqlQuery);
  return result.recordset;
}

async function queryOne(sqlQuery, params = []) {
  const rows = await queryAll(sqlQuery, params);
  return rows.length > 0 ? rows[0] : null;
}

async function runSql(sqlQuery, params = []) {
  const p = await getPool();
  const request = p.request();
  params.forEach((val, i) => {
    request.input(`p${i}`, val);
  });
  const result = await request.query(sqlQuery);
  return { rowsAffected: result.rowsAffected[0] || 0 };
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = { getPool, queryAll, queryOne, runSql, closePool };

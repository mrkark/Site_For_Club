const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  database: process.env.DB_NAME || 'karate_club',
  user: process.env.DB_USER || 'mrkark',
  password: process.env.DB_PASSWORD || 'mrkark9000',
  charset: 'utf8mb4',
  ssl: process.env.DB_SSL === 'true' ? true : false,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
};


let pool = null;

async function getDb() {
  if (pool) return pool;
  pool = mysql.createPool(mysqlConfig);
  
  const connection = await pool.getConnection();
  await connection.query('SET NAMES utf8mb4');
  await connection.query('SET CHARACTER SET utf8mb4');
  await connection.query('SET collation_connection = utf8mb4_unicode_ci');
  connection.release();
    
  return pool;
}

function replaceParams(sqlQuery, params) {
  let i = 0;
  return sqlQuery.replace(/\?/g, () => `?`);
}

async function queryAll(sqlQuery, params = []) {
  const p = await getDb();
  const [rows] = await p.execute(sqlQuery, params);
  return rows;
}

async function queryOne(sqlQuery, params = []) {
  const rows = await queryAll(sqlQuery, params);
  return rows[0] || null;
}

async function runSql(sqlQuery, params = []) {
  const p = await getDb();
  const isInsert = sqlQuery.trim().toUpperCase().startsWith('INSERT');
  const [result] = await p.execute(sqlQuery, params);

  const changes = result.affectedRows || 0;
  let lastInsertRowid = 0;
  if (isInsert && result.insertId) {
    lastInsertRowid = parseInt(result.insertId, 10) || 0;
  }

  return { changes, lastInsertRowid };
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getDb, queryAll, queryOne, runSql, closePool };
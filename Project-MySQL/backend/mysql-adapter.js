const mysql = require('mysql2/promise');
const fs = require('fs');
const config = require('./config.json');
const dbConfig = config.database;

const mysqlConfig = {
  host: dbConfig.host || 'localhost',
  port: dbConfig.port || 3306,
  database: dbConfig.database || 'karate_club',
  user: dbConfig.user || 'karate_app',
  password: dbConfig.password || 'KarateClub2024!',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  ssl: dbConfig.ssl || false,
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
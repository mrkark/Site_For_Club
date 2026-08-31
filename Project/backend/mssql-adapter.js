const sql = require('mssql');
const fs = require('fs');
const config = require('./config.json');
const dbConfig = config.database;

const sqlConfig = {
  server: dbConfig.server || process.env.MSSQL_SERVER || 'localhost',
  database: dbConfig.database || process.env.MSSQL_DATABASE || 'KarateClub',
  authentication: {
    type: 'default',
    options: {
      userName: dbConfig.user || process.env.MSSQL_USER || 'karate_app',
      password: dbConfig.password || process.env.MSSQL_PASSWORD || 'KarateClub2024!'
    }
  },
  options: {
    encrypt: dbConfig.options?.encrypt ?? false,
    trustServerCertificate: dbConfig.options?.trustServerCertificate ?? true
  }
};

let pool = null;

async function getDb() {
  if (pool) return pool;
  pool = await sql.connect(sqlConfig);
  return pool;
}

function replaceParams(sqlQuery, params) {
  let i = 0;
  return sqlQuery.replace(/\?/g, () => `@p${i++}`);
}

async function queryAll(sqlQuery, params = []) {
  const p = await getDb();
  const r = p.request();
  const parsedSql = replaceParams(sqlQuery, params);
  params.forEach((v, i) => {
    if (v === null || v === undefined) {
      r.input(`p${i}`, sql.NVarChar(1), v);
    } else if (typeof v === 'string') {
      r.input(`p${i}`, sql.NVarChar(sql.MAX), v);
    } else if (typeof v === 'number') {
      r.input(`p${i}`, sql.Float, v);
    } else if (typeof v === 'boolean') {
      r.input(`p${i}`, sql.Bit, v);
    } else {
      r.input(`p${i}`, sql.NVarChar(sql.MAX), String(v));
    }
  });
  const result = await r.query(parsedSql);
  return result.recordset;
}

async function queryOne(sqlQuery, params = []) {
  const rows = await queryAll(sqlQuery, params);
  return rows[0] || null;
}

async function runSql(sqlQuery, params = []) {
  const p = await getDb();
  const r = p.request();
  const isInsert = sqlQuery.trim().toUpperCase().startsWith('INSERT');
  let parsedSql = replaceParams(sqlQuery, params);

  if (isInsert) {
    parsedSql += ';SELECT SCOPE_IDENTITY() AS _id';
  }

  params.forEach((v, i) => {
    if (v === null || v === undefined) {
      r.input(`p${i}`, sql.NVarChar(1), v);
    } else if (typeof v === 'string') {
      r.input(`p${i}`, sql.NVarChar(sql.MAX), v);
    } else if (typeof v === 'number') {
      r.input(`p${i}`, sql.Float, v);
    } else if (typeof v === 'boolean') {
      r.input(`p${i}`, sql.Bit, v);
    } else {
      r.input(`p${i}`, sql.NVarChar(sql.MAX), String(v));
    }
  });
  const result = await r.query(parsedSql);

  const changes = result.rowsAffected[0] || 0;
  let lastInsertRowid = 0;
  if (isInsert && result.recordset && result.recordset.length > 0) {
    lastInsertRowid = parseInt(result.recordset[0]._id, 10) || 0;
  }

  return { changes, lastInsertRowid };
}

module.exports = { getDb, queryAll, queryOne, runSql };

const path = require('path');
const fs = require('fs');

const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();

let db = null;

async function init() {
  if (DB_TYPE === 'mysql') {
    const mysql = require('mysql2/promise');
    const host = process.env.MYSQL_HOST || 'localhost';
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE || 'qr_entries';
    const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306;

    // Try to create the database if it doesn't exist (requires user privileges)
    try {
      const tmpConn = await mysql.createConnection({ host, user, password, port });
      await tmpConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci`);
      await tmpConn.end();
      console.log(`MySQL: ensured database '${database}' exists on ${host}:${port}`);
    } catch (err) {
      console.warn('MySQL: could not auto-create database (continuing):', err.message || err);
    }

    const pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    db = { type: 'mysql', pool };

    console.log(`MySQL: connecting as ${user}@${host}:${port} to database '${database}'`);

    // ensure table exists (simple migration)
    const createSql = `
      CREATE TABLE IF NOT EXISTS entries (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        role VARCHAR(50),
        name TEXT,
        nic VARCHAR(128),
        address TEXT,
        phone VARCHAR(64),
        designation VARCHAR(128),
        institution VARCHAR(256),
        scanned_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
    await pool.execute(createSql);

  } else {
    // default to sqlite
    const sqlite3 = require('sqlite3').verbose();
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = path.join(dataDir, 'entries.db');
    const sqlite = new sqlite3.Database(dbPath);

    // wrap sqlite methods in promises
    const run = (sql, params=[]) => new Promise((resolve, reject) => {
      sqlite.run(sql, params, function(err){
        if (err) return reject(err);
        resolve(this);
      });
    });
    const all = (sql, params=[]) => new Promise((resolve, reject) => {
      sqlite.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
    const get = (sql, params=[]) => new Promise((resolve, reject) => {
      sqlite.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    db = { type: 'sqlite', sqlite, run, all, get };

    // ensure table exists
    await run(`CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT,
      name TEXT,
      nic TEXT,
      address TEXT,
      phone TEXT,
      designation TEXT,
      institution TEXT,
      scanned_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
}

async function query(sql, params=[]) {
  if (!db) await init();
  if (db.type === 'mysql') {
    const [rows] = await db.pool.execute(sql, params);
    return rows;
  }
  // sqlite
  const trimmed = sql.trim().toLowerCase();
  if (trimmed.startsWith('select')) return db.all(sql, params);
  return db.run(sql, params);
}

async function close() {
  if (!db) return;
  if (db.type === 'mysql') {
    await db.pool.end();
  } else if (db.type === 'sqlite') {
    db.sqlite.close();
  }
  db = null;
}

module.exports = { init, query, close, get type(){ return db ? db.type : DB_TYPE } };

"use strict";

const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.MYSQL_HOST || "20.197.10.226",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "Kred@Pool123",
  database: process.env.MYSQL_DATABASE || "brahmand_admin",
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_POOL_SIZE || 10),
  queueLimit: 0,
  timezone: "Z",
  multipleStatements: false,
  connectTimeout: 20000
};

const pool = mysql.createPool(dbConfig);

async function pingDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  dbConfig,
  pingDatabase,
};


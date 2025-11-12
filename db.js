const { Pool } = require('pg');

const sslConfig = process.env.DATABASE_URL.includes('render.com')
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};

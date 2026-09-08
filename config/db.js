const { Pool } = require('pg');

const DEFAULT_DB_URL = 'postgres://postgres:lrh48me5dz3pqtgg214j@automat_postgres-db:5432/automat';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || DEFAULT_DB_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => console.error('⚠️ Error en PostgreSQL:', err.message));

module.exports = pool;

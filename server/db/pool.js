const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DATABASE_PRIVATE_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  console.error(
    'FATAL: No database connection string found.',
    'Set DATABASE_URL, DATABASE_PRIVATE_URL, or POSTGRES_URL.'
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  max: 10,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;

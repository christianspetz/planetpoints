const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`Migration ${file} completed`);
    }
    console.log('All migrations completed successfully');
  } catch (err) {
    console.error('Migration error:', err.message);
    throw err;
  }
}

module.exports = runMigrations;

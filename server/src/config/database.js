require('dotenv').config();
const { Pool, types } = require('pg');

// Parse PostgreSQL DATE (OID 1082) as plain string 'YYYY-MM-DD' to prevent timezone conversion shifts
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'absensi_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'fahmi123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection on startup
let dbConnected = false;
pool.connect((err, client, release) => {
  if (err) {
    console.error('⚠️  Gagal terhubung ke PostgreSQL:', err.message);
    console.error('   Database: ' + (process.env.DB_NAME || 'absensi_db'));
    console.error('   User: ' + (process.env.DB_USER || 'postgres'));
    console.error('   Periksa: PostgreSQL service running, database created');
    console.error('   Server tetap berjalan untuk development tanpa database');
  } else {
    console.log('✅ Terhubung ke PostgreSQL database:', process.env.DB_NAME || 'absensi_db');
    dbConnected = true;
    release();
  }
});

/**
 * Helper query function - returns rows (async)
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn('Slow query detected:', { text: text.substring(0, 100), duration });
    }
    return res;
  } catch (err) {
    console.error('Database query error:', err.message);
    throw err;
  }
}

/**
 * Get a client from pool for transactions
 */
async function getClient() {
  return pool.connect();
}

async function closeDatabase() {
  await pool.end();
}

module.exports = { pool, query, getClient, closeDatabase };

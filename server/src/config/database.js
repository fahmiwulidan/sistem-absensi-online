require('dotenv').config();
const { Pool, types } = require('pg');

// Parse PostgreSQL DATE (OID 1082) as plain string 'YYYY-MM-DD'
types.setTypeParser(1082, (val) => val);

// Konfigurasi Pool: Mengutamakan DATABASE_URL dari Neon/Vercel
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'absensi_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'fahmi123',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

// Test connection on startup
let dbConnected = false;
pool.connect((err, client, release) => {
  if (err) {
    console.error('⚠️ Gagal terhubung ke PostgreSQL:', err.message);
  } else {
    console.log('✅ Terhubung ke PostgreSQL database');
    dbConnected = true;
    release();
  }
});

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

async function getClient() {
  return pool.connect();
}

async function closeDatabase() {
  await pool.end();
}

module.exports = { pool, query, getClient, closeDatabase };

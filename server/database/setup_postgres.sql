-- ============================================
-- PostgreSQL Setup Script
-- Jalankan script ini sebagai superuser postgres
-- ============================================

-- 1. Buat user baru untuk aplikasi
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'absensi_user') THEN
    CREATE USER absensi_user WITH PASSWORD 'absensi123';
  END IF;
END
$$;

-- 2. Buat database
SELECT 'CREATE DATABASE absensi_db OWNER absensi_user' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'absensi_db')\gexec

-- 3. Grant privileges
GRANT ALL PRIVILEGES ON DATABASE absensi_db TO absensi_user;

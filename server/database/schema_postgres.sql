-- ============================================
-- Sistem Informasi Absensi Online Sekolah
-- PostgreSQL Database Schema
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables jika sudah ada (untuk fresh install)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS parent_student CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS teacher_subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS school_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- School Settings
-- ============================================
CREATE TABLE school_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Academic Years
-- ============================================
CREATE TABLE academic_years (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  semester INTEGER NOT NULL CHECK(semester IN (1, 2)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Teachers
-- ============================================
CREATE TABLE teachers (
  id SERIAL PRIMARY KEY,
  nip VARCHAR(30) UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  gender CHAR(1) CHECK(gender IN ('L', 'P')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Classes
-- ============================================
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  grade INTEGER NOT NULL CHECK(grade IN (10, 11, 12)),
  homeroom_teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
  academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Students
-- ============================================
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  nis VARCHAR(20) UNIQUE NOT NULL,
  nisn VARCHAR(20) UNIQUE,
  name VARCHAR(100) NOT NULL,
  gender CHAR(1) CHECK(gender IN ('L', 'P')),
  birth_place VARCHAR(50),
  birth_date DATE,
  address TEXT,
  phone VARCHAR(20),
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Parents
-- ============================================
CREATE TABLE parents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  relationship VARCHAR(10) CHECK(relationship IN ('Ayah', 'Ibu', 'Wali')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Parent-Student Relationship
-- ============================================
CREATE TABLE parent_student (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(parent_id, student_id)
);

-- ============================================
-- Subjects
-- ============================================
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Teacher-Subject Relationship
-- ============================================
CREATE TABLE teacher_subjects (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE(teacher_id, subject_id)
);

-- ============================================
-- Schedules
-- ============================================
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  room VARCHAR(30),
  academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Users (Authentication)
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK(role IN ('admin', 'guru', 'siswa', 'orangtua', 'kepsek')),
  ref_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Attendances
-- ============================================
CREATE TABLE attendances (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(10) NOT NULL CHECK(status IN ('hadir', 'izin', 'sakit', 'alpa')),
  notes TEXT,
  recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(schedule_id, student_id, date)
);

-- ============================================
-- Notifications
-- ============================================
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(10) DEFAULT 'info' CHECK(type IN ('info', 'warning', 'success', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_nis ON students(nis);
CREATE INDEX idx_students_active ON students(is_active);
CREATE INDEX idx_attendances_date ON attendances(date);
CREATE INDEX idx_attendances_student ON attendances(student_id);
CREATE INDEX idx_attendances_schedule ON attendances(schedule_id);
CREATE INDEX idx_attendances_status ON attendances(status);
CREATE INDEX idx_schedules_day ON schedules(day_of_week);
CREATE INDEX idx_schedules_teacher ON schedules(teacher_id);
CREATE INDEX idx_schedules_class ON schedules(class_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_parent_student_parent ON parent_student(parent_id);
CREATE INDEX idx_parent_student_student ON parent_student(student_id);

-- Permissions (optional)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

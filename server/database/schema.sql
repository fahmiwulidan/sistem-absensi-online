-- Sistem Informasi Absensi Online Sekolah
-- Database Schema for SQLite

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ============================================
-- School Settings (Configurable)
-- ============================================
CREATE TABLE IF NOT EXISTS school_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Academic Years
-- ============================================
CREATE TABLE IF NOT EXISTS academic_years (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  semester INTEGER NOT NULL CHECK(semester IN (1, 2)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Teachers
-- ============================================
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nip TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gender TEXT CHECK(gender IN ('L', 'P')),
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Classes
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK(grade IN (10, 11, 12)),
  homeroom_teacher_id INTEGER,
  academic_year_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
);

-- ============================================
-- Students
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nis TEXT UNIQUE NOT NULL,
  nisn TEXT UNIQUE,
  name TEXT NOT NULL,
  gender TEXT CHECK(gender IN ('L', 'P')),
  birth_place TEXT,
  birth_date DATE,
  address TEXT,
  phone TEXT,
  class_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- ============================================
-- Parents
-- ============================================
CREATE TABLE IF NOT EXISTS parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  relationship TEXT CHECK(relationship IN ('Ayah', 'Ibu', 'Wali')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Parent-Student Relationship (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS parent_student (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(parent_id, student_id)
);

-- ============================================
-- Subjects
-- ============================================
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Teacher-Subject Relationship (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE(teacher_id, subject_id)
);

-- ============================================
-- Schedules
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  room TEXT,
  academic_year_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
);

-- ============================================
-- Users (Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'guru', 'siswa', 'orangtua', 'kepsek')),
  ref_id INTEGER,
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Attendances
-- ============================================
CREATE TABLE IF NOT EXISTS attendances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('hadir', 'izin', 'sakit', 'alpa')),
  notes TEXT,
  recorded_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(schedule_id, student_id, date)
);

-- ============================================
-- Notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK(type IN ('info', 'warning', 'success', 'error')),
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(date);
CREATE INDEX IF NOT EXISTS idx_attendances_student ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_schedule ON attendances(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendances_status ON attendances(status);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_teacher ON schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedules_class ON schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON parent_student(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON parent_student(student_id);

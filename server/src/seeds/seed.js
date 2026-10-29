const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'database', 'absensi.db');
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'database', 'schema.sql');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

// Drop existing tables to ensure clean seeding without file lock issues on Windows
const existingTables = [
  'notifications', 'attendances', 'parent_student', 'parents',
  'students', 'schedules', 'teacher_subjects', 'classes',
  'teachers', 'subjects', 'academic_years', 'school_settings', 'users'
];
existingTables.forEach(table => {
  try { db.exec(`DROP TABLE IF EXISTS ${table}`); } catch (e) {}
});

db.pragma('foreign_keys = ON');

// Initialize schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);
console.log('✅ Schema database berhasil dibuat');

const hash = (pw) => bcrypt.hashSync(pw, 10);

// ============================================
// 1. Academic Year
// ============================================
db.prepare(`INSERT INTO academic_years (name, semester, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)`).run(
  '2024/2025', 1, '2024-07-15', '2024-12-20', 1
);
db.prepare(`INSERT INTO academic_years (name, semester, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)`).run(
  '2024/2025', 2, '2025-01-06', '2025-06-20', 0
);
console.log('✅ Tahun ajaran');

// ============================================
// 2. Subjects (10 mata pelajaran)
// ============================================
const subjects = [
  ['MTK', 'Matematika'], ['BIN', 'Bahasa Indonesia'], ['BIG', 'Bahasa Inggris'],
  ['FIS', 'Fisika'], ['KIM', 'Kimia'], ['BIO', 'Biologi'],
  ['SEJ', 'Sejarah'], ['EKO', 'Ekonomi'], ['PKN', 'PKn'],
  ['PJK', 'Pendidikan Jasmani'],
];
const insertSubject = db.prepare('INSERT INTO subjects (code, name) VALUES (?, ?)');
subjects.forEach(s => insertSubject.run(s[0], s[1]));
console.log('✅ Mata pelajaran');

// ============================================
// 3. Teachers (12 guru)
// ============================================
const teacherNames = [
  { nip: '198501012010011001', name: 'Ahmad Fauzi, S.Pd.', email: 'ahmad.fauzi@smahb.sch.id', phone: '081234567001', gender: 'L' },
  { nip: '198602022011012002', name: 'Siti Nurhaliza, M.Pd.', email: 'siti.nurhaliza@smahb.sch.id', phone: '081234567002', gender: 'P' },
  { nip: '198703032012011003', name: 'Budi Santoso, S.Pd.', email: 'budi.santoso@smahb.sch.id', phone: '081234567003', gender: 'L' },
  { nip: '198804042013012004', name: 'Dewi Sartika, S.Pd.', email: 'dewi.sartika@smahb.sch.id', phone: '081234567004', gender: 'P' },
  { nip: '198905052014011005', name: 'Eko Prasetyo, M.Pd.', email: 'eko.prasetyo@smahb.sch.id', phone: '081234567005', gender: 'L' },
  { nip: '199006062015012006', name: 'Fitri Handayani, S.Pd.', email: 'fitri.handayani@smahb.sch.id', phone: '081234567006', gender: 'P' },
  { nip: '199107072016011007', name: 'Gunawan Wibisono, S.Pd.', email: 'gunawan.w@smahb.sch.id', phone: '081234567007', gender: 'L' },
  { nip: '199208082017012008', name: 'Herlina Putri, M.Pd.', email: 'herlina.putri@smahb.sch.id', phone: '081234567008', gender: 'P' },
  { nip: '199309092018011009', name: 'Irfan Hakim, S.Pd.', email: 'irfan.hakim@smahb.sch.id', phone: '081234567009', gender: 'L' },
  { nip: '199410102019012010', name: 'Juwita Sari, S.Pd.', email: 'juwita.sari@smahb.sch.id', phone: '081234567010', gender: 'P' },
  { nip: '199511112020011011', name: 'Kurniawan Adi, S.Pd.', email: 'kurniawan@smahb.sch.id', phone: '081234567011', gender: 'L' },
  { nip: '199612122021012012', name: 'Linda Permata, S.Pd.', email: 'linda.permata@smahb.sch.id', phone: '081234567012', gender: 'P' },
];
const insertTeacher = db.prepare('INSERT INTO teachers (nip, name, email, phone, gender) VALUES (?, ?, ?, ?, ?)');
teacherNames.forEach(t => insertTeacher.run(t.nip, t.name, t.email, t.phone, t.gender));
console.log('✅ Guru');

// Teacher-Subject mapping (each teacher teaches 1-2 subjects)
const teacherSubjectMap = [
  [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6],
  [7, 7], [8, 8], [9, 9], [10, 10], [11, 1], [12, 2],
  [1, 4], [3, 5],
];
const insertTS = db.prepare('INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)');
teacherSubjectMap.forEach(ts => insertTS.run(ts[0], ts[1]));
console.log('✅ Guru-Mapel');

// ============================================
// 4. Classes (6 kelas)
// ============================================
const classesData = [
  { name: 'X-1', grade: 10, homeroom: 1 },
  { name: 'X-2', grade: 10, homeroom: 2 },
  { name: 'XI IPA 1', grade: 11, homeroom: 3 },
  { name: 'XI IPS 1', grade: 11, homeroom: 4 },
  { name: 'XII IPA 1', grade: 12, homeroom: 5 },
  { name: 'XII IPS 1', grade: 12, homeroom: 6 },
];
const insertClass = db.prepare('INSERT INTO classes (name, grade, homeroom_teacher_id, academic_year_id) VALUES (?, ?, ?, 1)');
classesData.forEach(c => insertClass.run(c.name, c.grade, c.homeroom));
console.log('✅ Kelas');

// ============================================
// 5. Students (30 per class = 180 total)
// ============================================
const firstNamesL = ['Ahmad', 'Budi', 'Cahyo', 'Dani', 'Eko', 'Fajar', 'Galih', 'Hadi', 'Ilham', 'Joko', 'Kurnia', 'Lukman', 'Muhammad', 'Naufal', 'Oki', 'Putra', 'Rizki', 'Surya', 'Taufik', 'Umar', 'Vino', 'Wahyu', 'Yusuf', 'Zaki', 'Adi', 'Bayu', 'Dimas', 'Farhan', 'Gilang', 'Hafiz'];
const firstNamesP = ['Aisyah', 'Bunga', 'Citra', 'Dian', 'Eka', 'Fitri', 'Gita', 'Hana', 'Indah', 'Jasmine', 'Kartika', 'Laila', 'Maya', 'Nadia', 'Oktavia', 'Putri', 'Rahma', 'Sari', 'Tari', 'Umi', 'Vera', 'Wulan', 'Yuni', 'Zahra', 'Anisa', 'Bella', 'Dewi', 'Fani', 'Gisella', 'Hesti'];
const lastNames = ['Pratama', 'Saputra', 'Wibowo', 'Hidayat', 'Nugraha', 'Permana', 'Ramadhan', 'Setiawan', 'Utama', 'Wijaya', 'Kusuma', 'Aditya', 'Hakim', 'Putra', 'Mahendra', 'Ardiansyah', 'Firmansyah', 'Wahyudi', 'Suryadi', 'Prasetya', 'Santoso', 'Rahmawati', 'Handayani', 'Lestari', 'Wulandari', 'Safitri', 'Anggraeni', 'Puspitasari', 'Oktaviani', 'Fitriani'];

const insertStudent = db.prepare('INSERT INTO students (nis, nisn, name, gender, birth_place, birth_date, address, phone, class_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

const cities = ['Jakarta', 'Bandung', 'Surabaya', 'Semarang', 'Yogyakarta', 'Tangerang', 'Bekasi', 'Depok', 'Bogor', 'Malang'];
let studentId = 0;

for (let classId = 1; classId <= 6; classId++) {
  for (let i = 0; i < 30; i++) {
    studentId++;
    const isL = i < 15;
    const firstName = isL ? firstNamesL[i] : firstNamesP[i - 15];
    const lastName = lastNames[(classId * 5 + i) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const gender = isL ? 'L' : 'P';
    const nis = `2024${String(classId).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`;
    const nisn = `00${String(2024000 + studentId).padStart(8, '0')}`;
    const city = cities[(classId + i) % cities.length];
    const birthYear = classId <= 2 ? 2008 : classId <= 4 ? 2007 : 2006;
    const birthMonth = String(((i % 12) + 1)).padStart(2, '0');
    const birthDay = String((i % 28) + 1).padStart(2, '0');
    const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;
    const phone = `0812${String(3456000 + studentId).padStart(7, '0')}`;
    const address = `Jl. ${lastName} No. ${studentId}, ${city}`;

    insertStudent.run(nis, nisn, name, gender, city, birthDate, address, phone, classId);
  }
}
console.log(`✅ Siswa (${studentId} siswa)`);

// ============================================
// 6. Parents (one per student, some shared)
// ============================================
const insertParent = db.prepare('INSERT INTO parents (name, phone, email, relationship) VALUES (?, ?, ?, ?)');
const insertPS = db.prepare('INSERT INTO parent_student (parent_id, student_id) VALUES (?, ?)');

const parentRelations = ['Ayah', 'Ibu', 'Wali'];
let parentId = 0;

// Create parents - some parents have multiple children
for (let sId = 1; sId <= 180; sId++) {
  // Every 6th student shares parent with previous student (siblings)
  if (sId % 6 === 0 && parentId > 0) {
    insertPS.run(parentId, sId);
  } else {
    parentId++;
    const rel = parentRelations[sId % 3];
    const prefix = rel === 'Ibu' ? 'Ibu ' : 'Bpk. ';
    const student = db.prepare('SELECT name FROM students WHERE id = ?').get(sId);
    const nameParts = student.name.split(' ');
    const parentName = `${prefix}${nameParts[nameParts.length - 1]}`;
    const email = `parent${parentId}@email.com`;
    const phone = `0813${String(7890000 + parentId).padStart(7, '0')}`;
    insertParent.run(parentName, phone, email, rel);
    insertPS.run(parentId, sId);
  }
}
console.log(`✅ Orang tua (${parentId} orang tua)`);

// ============================================
// 7. Schedules (full weekly timetable)
// ============================================
const timeSlots = [
  ['07:00', '07:45'], ['07:45', '08:30'], ['08:30', '09:15'],
  ['09:30', '10:15'], ['10:15', '11:00'], ['11:00', '11:45'],
  ['12:15', '13:00'], ['13:00', '13:45'],
];
const rooms = ['R-101', 'R-102', 'R-103', 'R-201', 'R-202', 'R-203', 'Lab IPA', 'Lab Komputer'];

// Distribute subjects across days for each class
const insertSchedule = db.prepare(
  'INSERT INTO schedules (day_of_week, start_time, end_time, subject_id, teacher_id, class_id, room, academic_year_id) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
);

// Teacher assignments per class
// Class 1 (X-1): teacher 1(MTK), 2(BIN), 3(BIG), 7(SEJ), 9(PKN), 10(PJK)
// Class 2 (X-2): teacher 11(MTK), 12(BIN), 3(BIG), 7(SEJ), 9(PKN), 10(PJK)
// Class 3 (XI IPA): teacher 1(MTK), 2(BIN), 3(BIG), 4(FIS), 5(KIM), 6(BIO)
// Class 4 (XI IPS): teacher 11(MTK), 12(BIN), 3(BIG), 7(SEJ), 8(EKO), 9(PKN)
// Class 5 (XII IPA): teacher 1(MTK,FIS), 2(BIN), 3(BIG,KIM), 5(KIM), 6(BIO)
// Class 6 (XII IPS): teacher 11(MTK), 12(BIN), 3(BIG), 7(SEJ), 8(EKO), 10(PJK)

const classSchedules = {
  1: [ // X-1
    { day: 1, slots: [[0, 1, 1], [1, 2, 2], [2, 3, 3], [3, 7, 7], [4, 9, 9]] },
    { day: 2, slots: [[0, 1, 1], [1, 10, 10], [2, 2, 2], [3, 3, 3], [4, 7, 7]] },
    { day: 3, slots: [[0, 9, 9], [1, 1, 1], [2, 10, 10], [3, 2, 2], [4, 3, 3]] },
    { day: 4, slots: [[0, 7, 7], [1, 9, 9], [2, 1, 1], [3, 10, 10], [4, 2, 2]] },
    { day: 5, slots: [[0, 3, 3], [1, 7, 7], [2, 9, 9], [3, 1, 1], [4, 10, 10]] },
  ],
  2: [ // X-2
    { day: 1, slots: [[0, 11, 1], [1, 12, 2], [2, 3, 3], [3, 7, 7], [4, 9, 9]] },
    { day: 2, slots: [[0, 11, 1], [1, 10, 10], [2, 12, 2], [3, 3, 3], [4, 7, 7]] },
    { day: 3, slots: [[0, 9, 9], [1, 11, 1], [2, 10, 10], [3, 12, 2], [4, 3, 3]] },
    { day: 4, slots: [[0, 7, 7], [1, 9, 9], [2, 11, 1], [3, 10, 10], [4, 12, 2]] },
    { day: 5, slots: [[0, 3, 3], [1, 7, 7], [2, 9, 9], [3, 11, 1], [4, 10, 10]] },
  ],
  3: [ // XI IPA 1
    { day: 1, slots: [[0, 1, 1], [1, 4, 4], [2, 5, 5], [3, 6, 6], [4, 2, 2]] },
    { day: 2, slots: [[0, 3, 3], [1, 1, 1], [2, 4, 4], [3, 5, 5], [4, 6, 6]] },
    { day: 3, slots: [[0, 2, 2], [1, 3, 3], [2, 1, 1], [3, 4, 4], [4, 5, 5]] },
    { day: 4, slots: [[0, 6, 6], [1, 2, 2], [2, 3, 3], [3, 1, 1], [4, 4, 4]] },
    { day: 5, slots: [[0, 5, 5], [1, 6, 6], [2, 2, 2], [3, 3, 3], [4, 1, 1]] },
  ],
  4: [ // XI IPS 1
    { day: 1, slots: [[0, 11, 1], [1, 7, 7], [2, 8, 8], [3, 9, 9], [4, 12, 2]] },
    { day: 2, slots: [[0, 3, 3], [1, 11, 1], [2, 7, 7], [3, 8, 8], [4, 9, 9]] },
    { day: 3, slots: [[0, 12, 2], [1, 3, 3], [2, 11, 1], [3, 7, 7], [4, 8, 8]] },
    { day: 4, slots: [[0, 9, 9], [1, 12, 2], [2, 3, 3], [3, 11, 1], [4, 7, 7]] },
    { day: 5, slots: [[0, 8, 8], [1, 9, 9], [2, 12, 2], [3, 3, 3], [4, 11, 1]] },
  ],
  5: [ // XII IPA 1
    { day: 1, slots: [[0, 1, 1], [1, 1, 4], [2, 5, 5], [3, 6, 6], [4, 2, 2]] },
    { day: 2, slots: [[0, 3, 3], [1, 1, 1], [2, 1, 4], [3, 5, 5], [4, 6, 6]] },
    { day: 3, slots: [[0, 2, 2], [1, 3, 3], [2, 1, 1], [3, 1, 4], [4, 5, 5]] },
    { day: 4, slots: [[0, 6, 6], [1, 2, 2], [2, 3, 3], [3, 1, 1], [4, 5, 5]] },
    { day: 5, slots: [[0, 5, 5], [1, 6, 6], [2, 2, 2], [3, 3, 3], [4, 1, 1]] },
  ],
  6: [ // XII IPS 1
    { day: 1, slots: [[0, 11, 1], [1, 7, 7], [2, 8, 8], [3, 10, 10], [4, 12, 2]] },
    { day: 2, slots: [[0, 3, 3], [1, 11, 1], [2, 7, 7], [3, 8, 8], [4, 10, 10]] },
    { day: 3, slots: [[0, 12, 2], [1, 3, 3], [2, 11, 1], [3, 7, 7], [4, 8, 8]] },
    { day: 4, slots: [[0, 10, 10], [1, 12, 2], [2, 3, 3], [3, 11, 1], [4, 7, 7]] },
    { day: 5, slots: [[0, 8, 8], [1, 10, 10], [2, 12, 2], [3, 3, 3], [4, 11, 1]] },
  ],
};

let scheduleCount = 0;
for (const [classId, days] of Object.entries(classSchedules)) {
  for (const dayData of days) {
    for (const [slotIdx, teacherId, subjectId] of dayData.slots) {
      const room = rooms[(parseInt(classId) - 1 + slotIdx) % rooms.length];
      insertSchedule.run(dayData.day, timeSlots[slotIdx][0], timeSlots[slotIdx][1], subjectId, teacherId, parseInt(classId), room);
      scheduleCount++;
    }
  }
}
console.log(`✅ Jadwal (${scheduleCount} jadwal)`);

// ============================================
// 8. Users (login accounts)
// ============================================
const insertUser = db.prepare('INSERT INTO users (username, email, password_hash, role, ref_id) VALUES (?, ?, ?, ?, ?)');

// Admin
insertUser.run('admin', 'admin@smahb.sch.id', hash('admin123'), 'admin', null);

// Kepala Sekolah
insertUser.run('kepsek', 'kepsek@smahb.sch.id', hash('kepsek123'), 'kepsek', null);

// Teacher users
for (let i = 1; i <= 12; i++) {
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(i);
  insertUser.run(`guru${i}`, teacher.email, hash('guru123'), 'guru', i);
}

// Student users (first 10 students for demo)
for (let i = 1; i <= 10; i++) {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(i);
  insertUser.run(`siswa${i}`, `siswa${i}@smahb.sch.id`, hash('siswa123'), 'siswa', i);
}

// Parent users (first 10 parents for demo)
for (let i = 1; i <= 10; i++) {
  const parent = db.prepare('SELECT * FROM parents WHERE id = ?').get(i);
  insertUser.run(`ortu${i}`, parent.email, hash('ortu123'), 'orangtua', i);
}
console.log('✅ User accounts');

// ============================================
// 9. Attendance data (1 month, ~20 school days)
// ============================================
const insertAttendance = db.prepare(
  'INSERT INTO attendances (schedule_id, student_id, date, status, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?)'
);

// Generate 20 school days of attendance
const schoolDays = [];
const startDate = new Date('2024-08-05');
let dayCount = 0;
while (dayCount < 20) {
  const dow = startDate.getDay();
  if (dow >= 1 && dow <= 5) {
    schoolDays.push({
      date: startDate.toISOString().split('T')[0],
      dayOfWeek: dow
    });
    dayCount++;
  }
  startDate.setDate(startDate.getDate() + 1);
}

const allSchedules = db.prepare('SELECT * FROM schedules').all();
const allStudentsByClass = {};
for (let cId = 1; cId <= 6; cId++) {
  allStudentsByClass[cId] = db.prepare('SELECT id FROM students WHERE class_id = ?').all(cId).map(s => s.id);
}

let attendanceCount = 0;
const statuses = ['hadir', 'hadir', 'hadir', 'hadir', 'hadir', 'hadir', 'hadir', 'hadir', 'izin', 'sakit', 'alpa'];
const notes = ['', '', '', '', '', 'Demam', 'Urusan keluarga', 'Sakit perut', 'Tanpa keterangan', 'Acara keluarga'];

for (const schoolDay of schoolDays) {
  const daySchedules = allSchedules.filter(s => s.day_of_week === schoolDay.dayOfWeek);
  
  for (const schedule of daySchedules) {
    const students = allStudentsByClass[schedule.class_id];
    if (!students) continue;
    
    for (const studentId of students) {
      const statusIdx = Math.floor(Math.random() * statuses.length);
      const status = statuses[statusIdx];
      const note = status !== 'hadir' ? notes[Math.floor(Math.random() * notes.length)] : null;
      
      try {
        insertAttendance.run(schedule.id, studentId, schoolDay.date, status, note, 3); // recorded by guru user id 3
        attendanceCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
  }
}
console.log(`✅ Absensi (${attendanceCount} record)`);

// ============================================
// 10. Notifications
// ============================================
const insertNotification = db.prepare('INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?)');

// Admin notifications
insertNotification.run(1, 'Selamat Datang', 'Selamat datang di Sistem Absensi Online SMA Harapan Bangsa.', 'success', 0);
insertNotification.run(1, 'Data Siswa Baru', 'Data 180 siswa berhasil diimport ke dalam sistem.', 'info', 1);
insertNotification.run(1, 'Laporan Bulanan', 'Laporan absensi bulan Agustus 2024 siap untuk diunduh.', 'info', 0);

// Teacher notifications
insertNotification.run(3, 'Jadwal Hari Ini', 'Anda memiliki 5 jadwal mengajar hari ini.', 'info', 0);
insertNotification.run(3, 'Absensi Berhasil', 'Absensi kelas X-1 mata pelajaran Matematika berhasil disimpan.', 'success', 1);
insertNotification.run(3, 'Siswa Tidak Hadir', 'Terdapat 3 siswa tidak hadir di kelas XI IPA 1.', 'warning', 0);

// Parent notifications
insertNotification.run(23, 'Informasi Kehadiran', 'Ananda Ahmad Pratama hadir di semua mata pelajaran hari ini.', 'success', 0);
insertNotification.run(23, 'Ketidakhadiran', 'Ananda Ahmad Pratama tercatat sakit pada mata pelajaran Matematika.', 'warning', 0);

// Student notifications
insertNotification.run(15, 'Jadwal Pelajaran', 'Jadwal pelajaran semester ini telah tersedia.', 'info', 0);
insertNotification.run(15, 'Persentase Kehadiran', 'Persentase kehadiran Anda bulan ini: 95%.', 'success', 1);

// Kepsek
insertNotification.run(2, 'Laporan Kehadiran', 'Tingkat kehadiran sekolah minggu ini: 92%.', 'info', 0);
insertNotification.run(2, 'Perhatian', 'Kelas XII IPS 1 memiliki tingkat kehadiran terendah minggu ini.', 'warning', 0);

console.log('✅ Notifikasi');

// ============================================
// School Settings
// ============================================
const insertSetting = db.prepare('INSERT INTO school_settings (key, value) VALUES (?, ?)');
insertSetting.run('school_name', 'SMA Harapan Bangsa');
insertSetting.run('school_address', 'Jl. Pendidikan No. 45, Kelurahan Sukamaju, Kecamatan Ciputat');
insertSetting.run('school_city', 'Tangerang Selatan');
insertSetting.run('school_province', 'Banten');
insertSetting.run('school_phone', '(021) 7401234');
insertSetting.run('school_email', 'info@smaharapanbangsa.sch.id');
insertSetting.run('school_principal', 'Dr. H. Ahmad Sudrajat, M.Pd.');
console.log('✅ Pengaturan sekolah');

db.close();
console.log('\n🎉 Seed data berhasil! Database siap digunakan.');
console.log('\n📋 Akun Login:');
console.log('  Admin     → admin / admin123');
console.log('  Kepsek    → kepsek / kepsek123');
console.log('  Guru      → guru1 / guru123 (guru1-guru12)');
console.log('  Siswa     → siswa1 / siswa123 (siswa1-siswa10)');
console.log('  Orang Tua → ortu1 / ortu123 (ortu1-ortu10)');

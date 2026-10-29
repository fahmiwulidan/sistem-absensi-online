require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool, getClient } = require('../config/database');

const SCHEMA_PATH = path.join(__dirname, '..', '..', 'database', 'schema_postgres.sql');

async function seed() {
  console.log('🔄 Memulai inisialisasi dan seeding database PostgreSQL...');
  const client = await getClient();

  try {
    // 1. Eksekusi skema database PostgreSQL
    console.log('📄 Membaca dan menjalankan schema_postgres.sql...');
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await client.query(schemaSql);
    console.log('✅ Skema tabel berhasil dibuat di absensi_db');

    const hash = (pw) => bcrypt.hashSync(pw, 10);

    // ============================================
    // 1. Academic Year
    // ============================================
    await client.query(`
      INSERT INTO academic_years (name, semester, start_date, end_date, is_active)
      VALUES 
        ('2024/2025', 1, '2024-07-15', '2024-12-20', true),
        ('2024/2025', 2, '2025-01-06', '2025-06-20', false)
    `);
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
    for (const [code, name] of subjects) {
      await client.query('INSERT INTO subjects (code, name) VALUES ($1, $2)', [code, name]);
    }
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
    for (const t of teacherNames) {
      await client.query(
        'INSERT INTO teachers (nip, name, email, phone, gender) VALUES ($1, $2, $3, $4, $5)',
        [t.nip, t.name, t.email, t.phone, t.gender]
      );
    }
    console.log('✅ Guru');

    // Teacher-Subject mapping
    const teacherSubjectMap = [
      [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6],
      [7, 7], [8, 8], [9, 9], [10, 10], [11, 1], [12, 2],
      [1, 4], [3, 5],
    ];
    for (const [tId, sId] of teacherSubjectMap) {
      await client.query('INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2)', [tId, sId]);
    }
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
    for (const c of classesData) {
      await client.query(
        'INSERT INTO classes (name, grade, homeroom_teacher_id, academic_year_id) VALUES ($1, $2, $3, 1)',
        [c.name, c.grade, c.homeroom]
      );
    }
    console.log('✅ Kelas');

    // ============================================
    // 5. Students (30 per class = 180 total)
    // ============================================
    const firstNamesL = ['Ahmad', 'Budi', 'Cahyo', 'Dani', 'Eko', 'Fajar', 'Galih', 'Hadi', 'Ilham', 'Joko', 'Kurnia', 'Lukman', 'Muhammad', 'Naufal', 'Oki', 'Putra', 'Rizki', 'Surya', 'Taufik', 'Umar', 'Vino', 'Wahyu', 'Yusuf', 'Zaki', 'Adi', 'Bayu', 'Dimas', 'Farhan', 'Gilang', 'Hafiz'];
    const firstNamesP = ['Aisyah', 'Bunga', 'Citra', 'Dian', 'Eka', 'Fitri', 'Gita', 'Hana', 'Indah', 'Jasmine', 'Kartika', 'Laila', 'Maya', 'Nadia', 'Oktavia', 'Putri', 'Rahma', 'Sari', 'Tari', 'Umi', 'Vera', 'Wulan', 'Yuni', 'Zahra', 'Anisa', 'Bella', 'Dewi', 'Fani', 'Gisella', 'Hesti'];
    const lastNames = ['Pratama', 'Saputra', 'Wibowo', 'Hidayat', 'Nugraha', 'Permana', 'Ramadhan', 'Setiawan', 'Utama', 'Wijaya', 'Kusuma', 'Aditya', 'Hakim', 'Putra', 'Mahendra', 'Ardiansyah', 'Firmansyah', 'Wahyudi', 'Suryadi', 'Prasetya', 'Santoso', 'Rahmawati', 'Handayani', 'Lestari', 'Wulandari', 'Safitri', 'Anggraeni', 'Puspitasari', 'Oktaviani', 'Fitriani'];
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

        await client.query(
          `INSERT INTO students (nis, nisn, name, gender, birth_place, birth_date, address, phone, class_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [nis, nisn, name, gender, city, birthDate, address, phone, classId]
        );
      }
    }
    console.log(`✅ Siswa (${studentId} siswa)`);

    // ============================================
    // 6. Parents
    // ============================================
    const parentRelations = ['Ayah', 'Ibu', 'Wali'];
    let parentId = 0;

    for (let sId = 1; sId <= 180; sId++) {
      if (sId % 6 === 0 && parentId > 0) {
        await client.query('INSERT INTO parent_student (parent_id, student_id) VALUES ($1, $2)', [parentId, sId]);
      } else {
        parentId++;
        const rel = parentRelations[sId % 3];
        const prefix = rel === 'Ibu' ? 'Ibu ' : 'Bpk. ';
        const stRes = await client.query('SELECT name FROM students WHERE id = $1', [sId]);
        const student = stRes.rows[0];
        const nameParts = student.name.split(' ');
        const parentName = `${prefix}${nameParts[nameParts.length - 1]}`;
        const email = `parent${parentId}@email.com`;
        const phone = `0813${String(7890000 + parentId).padStart(7, '0')}`;

        await client.query(
          'INSERT INTO parents (name, phone, email, relationship) VALUES ($1, $2, $3, $4)',
          [parentName, phone, email, rel]
        );
        await client.query('INSERT INTO parent_student (parent_id, student_id) VALUES ($1, $2)', [parentId, sId]);
      }
    }
    console.log(`✅ Orang tua (${parentId} orang tua)`);

    // ============================================
    // 7. Schedules
    // ============================================
    const timeSlots = [
      ['07:00', '07:45'], ['07:45', '08:30'], ['08:30', '09:15'],
      ['09:30', '10:15'], ['10:15', '11:00'], ['11:00', '11:45'],
      ['12:15', '13:00'], ['13:00', '13:45'],
    ];
    const rooms = ['R-101', 'R-102', 'R-103', 'R-201', 'R-202', 'R-203', 'Lab IPA', 'Lab Komputer'];

    const classSchedules = {
      1: [
        { day: 1, slots: [[0, 1, 1], [1, 2, 2], [2, 3, 3], [3, 7, 7], [4, 9, 9]] },
        { day: 2, slots: [[0, 1, 1], [1, 10, 10], [2, 2, 2], [3, 3, 3], [4, 7, 7]] },
        { day: 3, slots: [[0, 9, 9], [1, 1, 1], [2, 10, 10], [3, 2, 2], [4, 3, 3]] },
        { day: 4, slots: [[0, 7, 7], [1, 9, 9], [2, 1, 1], [3, 10, 10], [4, 2, 2]] },
        { day: 5, slots: [[0, 3, 3], [1, 7, 7], [2, 9, 9], [3, 1, 1], [4, 10, 10]] },
      ],
      2: [
        { day: 1, slots: [[0, 11, 1], [1, 12, 2], [2, 3, 3], [3, 7, 7], [4, 9, 9]] },
        { day: 2, slots: [[0, 11, 1], [1, 10, 10], [2, 12, 2], [3, 3, 3], [4, 7, 7]] },
        { day: 3, slots: [[0, 9, 9], [1, 11, 1], [2, 10, 10], [3, 12, 2], [4, 3, 3]] },
        { day: 4, slots: [[0, 7, 7], [1, 9, 9], [2, 11, 1], [3, 10, 10], [4, 12, 2]] },
        { day: 5, slots: [[0, 3, 3], [1, 7, 7], [2, 9, 9], [3, 11, 1], [4, 10, 10]] },
      ],
      3: [
        { day: 1, slots: [[0, 1, 1], [1, 4, 4], [2, 5, 5], [3, 6, 6], [4, 2, 2]] },
        { day: 2, slots: [[0, 3, 3], [1, 1, 1], [2, 4, 4], [3, 5, 5], [4, 6, 6]] },
        { day: 3, slots: [[0, 2, 2], [1, 3, 3], [2, 1, 1], [3, 4, 4], [4, 5, 5]] },
        { day: 4, slots: [[0, 6, 6], [1, 2, 2], [2, 3, 3], [3, 1, 1], [4, 4, 4]] },
        { day: 5, slots: [[0, 5, 5], [1, 6, 6], [2, 2, 2], [3, 3, 3], [4, 1, 1]] },
      ],
      4: [
        { day: 1, slots: [[0, 11, 1], [1, 7, 7], [2, 8, 8], [3, 9, 9], [4, 12, 2]] },
        { day: 2, slots: [[0, 3, 3], [1, 11, 1], [2, 7, 7], [3, 8, 8], [4, 9, 9]] },
        { day: 3, slots: [[0, 12, 2], [1, 3, 3], [2, 11, 1], [3, 7, 7], [4, 8, 8]] },
        { day: 4, slots: [[0, 9, 9], [1, 12, 2], [2, 3, 3], [3, 11, 1], [4, 7, 7]] },
        { day: 5, slots: [[0, 8, 8], [1, 9, 9], [2, 12, 2], [3, 3, 3], [4, 11, 1]] },
      ],
      5: [
        { day: 1, slots: [[0, 1, 1], [1, 1, 4], [2, 5, 5], [3, 6, 6], [4, 2, 2]] },
        { day: 2, slots: [[0, 3, 3], [1, 1, 1], [2, 1, 4], [3, 5, 5], [4, 6, 6]] },
        { day: 3, slots: [[0, 2, 2], [1, 3, 3], [2, 1, 1], [3, 1, 4], [4, 5, 5]] },
        { day: 4, slots: [[0, 6, 6], [1, 2, 2], [2, 3, 3], [3, 1, 1], [4, 5, 5]] },
        { day: 5, slots: [[0, 5, 5], [1, 6, 6], [2, 2, 2], [3, 3, 3], [4, 1, 1]] },
      ],
      6: [
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
          await client.query(
            `INSERT INTO schedules (day_of_week, start_time, end_time, subject_id, teacher_id, class_id, room, academic_year_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
            [dayData.day, timeSlots[slotIdx][0], timeSlots[slotIdx][1], subjectId, teacherId, parseInt(classId), room]
          );
          scheduleCount++;
        }
      }
    }
    console.log(`✅ Jadwal (${scheduleCount} jadwal)`);

    // ============================================
    // 8. Users
    // ============================================
    // Admin
    await client.query(
      'INSERT INTO users (username, email, password_hash, role, ref_id) VALUES ($1, $2, $3, $4, $5)',
      ['admin', 'admin@smahb.sch.id', hash('admin123'), 'admin', null]
    );

    // Kepsek
    await client.query(
      'INSERT INTO users (username, email, password_hash, role, ref_id) VALUES ($1, $2, $3, $4, $5)',
      ['kepsek', 'kepsek@smahb.sch.id', hash('kepsek123'), 'kepsek', null]
    );

    // Teacher users (1-12)
    for (let i = 1; i <= 12; i++) {
      const tRes = await client.query('SELECT * FROM teachers WHERE id = $1', [i]);
      const teacher = tRes.rows[0];
      await client.query(
        'INSERT INTO users (username, email, password_hash, role, ref_id) VALUES ($1, $2, $3, $4, $5)',
        [`guru${i}`, teacher.email, hash('guru123'), 'guru', i]
      );
    }

    // Student users (first 15 students)
    for (let i = 1; i <= 15; i++) {
      await client.query(
        'INSERT INTO users (username, email, password_hash, role, ref_id) VALUES ($1, $2, $3, $4, $5)',
        [`siswa${i}`, `siswa${i}@smahb.sch.id`, hash('siswa123'), 'siswa', i]
      );
    }

    // Parent users (first 15 parents)
    for (let i = 1; i <= 15; i++) {
      const pRes = await client.query('SELECT * FROM parents WHERE id = $1', [i]);
      const parent = pRes.rows[0];
      await client.query(
        'INSERT INTO users (username, email, password_hash, role, ref_id) VALUES ($1, $2, $3, $4, $5)',
        [`ortu${i}`, parent.email, hash('ortu123'), 'orangtua', i]
      );
    }
    console.log('✅ User accounts (admin, kepsek, guru1-12, siswa1-15, ortu1-15)');

    // ============================================
    // 9. Attendances (last 14 days up to today)
    // ============================================
    const allSchedulesRes = await client.query('SELECT * FROM schedules');
    const allSchedules = allSchedulesRes.rows;

    const allStudentsByClass = {};
    for (let cId = 1; cId <= 6; cId++) {
      const stRes = await client.query('SELECT id FROM students WHERE class_id = $1', [cId]);
      allStudentsByClass[cId] = stRes.rows.map(s => s.id);
    }

    const schoolDays = [];
    const now = new Date();
    for (let d = 14; d >= 0; d--) {
      const cur = new Date(now);
      cur.setDate(cur.getDate() - d);
      const dow = cur.getDay();
      if (dow >= 1 && dow <= 5) {
        schoolDays.push({
          date: cur.toISOString().split('T')[0],
          dayOfWeek: dow
        });
      }
    }

    const statuses = ['hadir', 'hadir', 'hadir', 'hadir', 'hadir', 'hadir', 'hadir', 'hadir', 'izin', 'sakit', 'alpa'];
    const notes = ['', '', '', '', '', 'Demam', 'Urusan keluarga', 'Sakit kepala', 'Tanpa keterangan', 'Keperluan keluarga'];
    let attendanceCount = 0;

    for (const schoolDay of schoolDays) {
      const daySchedules = allSchedules.filter(s => s.day_of_week === schoolDay.dayOfWeek);

      for (const schedule of daySchedules) {
        const students = allStudentsByClass[schedule.class_id];
        if (!students) continue;

        for (const sId of students) {
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const note = status !== 'hadir' ? notes[Math.floor(Math.random() * notes.length)] : null;

          try {
            await client.query(
              `INSERT INTO attendances (schedule_id, student_id, date, status, notes, recorded_by)
               VALUES ($1, $2, $3, $4, $5, 3)
               ON CONFLICT (schedule_id, student_id, date) DO NOTHING`,
              [schedule.id, sId, schoolDay.date, status, note]
            );
            attendanceCount++;
          } catch (e) {
            // Ignore duplicate
          }
        }
      }
    }
    console.log(`✅ Absensi (${attendanceCount} data absensi)`);

    // ============================================
    // 10. Notifications
    // ============================================
    const notifications = [
      [1, 'Selamat Datang', 'Selamat datang di Sistem Absensi Online SMA Harapan Bangsa.', 'success', false],
      [1, 'Database Terkoneksi', 'Sistem berhasil terkoneksi ke database PostgreSQL.', 'info', true],
      [1, 'Data Siswa & Guru', 'Data 180 siswa, 12 guru, dan 6 kelas siap digunakan.', 'info', false],
      [2, 'Laporan Kehadiran', 'Tingkat kehadiran sekolah rata-rata 93.5% minggu ini.', 'info', false],
      [3, 'Jadwal Hari Ini', 'Anda memiliki jadwal mengajar aktif hari ini.', 'info', false],
      [15, 'Informasi Absensi', 'Absensi kehadiran Anda telah dicatat dengan status Hadir.', 'success', false],
    ];
    for (const [uId, title, msg, type, isRead] of notifications) {
      await client.query(
        'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES ($1, $2, $3, $4, $5)',
        [uId, title, msg, type, isRead]
      );
    }
    console.log('✅ Notifikasi');

    // ============================================
    // 11. School Settings
    // ============================================
    const settings = [
      ['school_name', 'SMA Harapan Bangsa'],
      ['school_address', 'Jl. Pendidikan No. 45, Kelurahan Sukamaju, Kecamatan Ciputat'],
      ['school_city', 'Tangerang Selatan'],
      ['school_province', 'Banten'],
      ['school_phone', '(021) 7401234'],
      ['school_email', 'info@smaharapanbangsa.sch.id'],
      ['school_principal', 'Dr. H. Ahmad Sudrajat, M.Pd.'],
    ];
    for (const [key, value] of settings) {
      await client.query(
        `INSERT INTO school_settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value]
      );
    }
    console.log('✅ Pengaturan Sekolah');

    console.log('\n🎉 SEED DATA POSTGRESQL SUKSES!');
    console.log('====================================');
    console.log('📋 Akun Login untuk Semua Role:');
    console.log('  1. Admin       : admin     / admin123');
    console.log('  2. Guru        : guru1     / guru123 (guru1 s/d guru12)');
    console.log('  3. Siswa       : siswa1    / siswa123 (siswa1 s/d siswa15)');
    console.log('  4. Orang Tua   : ortu1     / ortu123 (ortu1 s/d ortu15)');
    console.log('  5. Kepsek      : kepsek    / kepsek123');
    console.log('====================================\n');
  } catch (err) {
    console.error('❌ Gagal seed PostgreSQL:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

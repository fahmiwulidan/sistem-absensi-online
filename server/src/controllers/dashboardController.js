const { query } = require('../config/database');

exports.admin = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const stRes = await query('SELECT COUNT(*) as count FROM students WHERE is_active = true');
    const totalStudents = parseInt(stRes.rows[0].count) || 0;

    const tcRes = await query('SELECT COUNT(*) as count FROM teachers WHERE is_active = true');
    const totalTeachers = parseInt(tcRes.rows[0].count) || 0;

    const clRes = await query('SELECT COUNT(*) as count FROM classes');
    const totalClasses = parseInt(clRes.rows[0].count) || 0;

    const todayStatsRes = await query(`
      SELECT 
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN status='hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
        COALESCE(SUM(CASE WHEN status='izin' THEN 1 ELSE 0 END), 0)::int as izin,
        COALESCE(SUM(CASE WHEN status='sakit' THEN 1 ELSE 0 END), 0)::int as sakit,
        COALESCE(SUM(CASE WHEN status='alpa' THEN 1 ELSE 0 END), 0)::int as alpa
      FROM attendances WHERE date = $1
    `, [today]);

    // Weekly attendance trend (last 7 days)
    const weeklyTrendRes = await query(`
      SELECT date,
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN status='hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
        COALESCE(SUM(CASE WHEN status='izin' THEN 1 ELSE 0 END), 0)::int as izin,
        COALESCE(SUM(CASE WHEN status='sakit' THEN 1 ELSE 0 END), 0)::int as sakit,
        COALESCE(SUM(CASE WHEN status='alpa' THEN 1 ELSE 0 END), 0)::int as alpa
      FROM attendances
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY date ORDER BY date
    `);

    // Recent activity
    const recentAttendancesRes = await query(`
      SELECT a.date, a.status, s.name as student_name, c.name as class_name, sub.name as subject_name
      FROM attendances a
      JOIN students s ON a.student_id = s.id
      JOIN schedules sc ON a.schedule_id = sc.id
      JOIN classes c ON sc.class_id = c.id
      JOIN subjects sub ON sc.subject_id = sub.id
      ORDER BY a.created_at DESC LIMIT 10
    `);

    res.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      todayAttendance: todayStatsRes.rows[0] || { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0 },
      weeklyTrend: weeklyTrendRes.rows,
      recentActivity: recentAttendancesRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.teacher = async (req, res) => {
  try {
    const teacherId = req.user.ref_id;
    const today = new Date();
    let dayOfWeek = today.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;
    const todayDate = today.toISOString().split('T')[0];

    // Today's schedules
    const todaySchedulesRes = await query(`
      SELECT sc.*, sub.name as subject_name, c.name as class_name,
        (SELECT COUNT(*)::int FROM attendances a WHERE a.schedule_id = sc.id AND a.date = $1) as attendance_count
      FROM schedules sc
      JOIN subjects sub ON sc.subject_id = sub.id
      JOIN classes c ON sc.class_id = c.id
      WHERE sc.teacher_id = $2 AND sc.day_of_week = $3
      ORDER BY sc.start_time
    `, [todayDate, teacherId, dayOfWeek]);

    // Attendance stats for teacher's classes (last 30 days)
    const statsRes = await query(`
      SELECT 
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN a.status='hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
        COALESCE(SUM(CASE WHEN a.status='izin' THEN 1 ELSE 0 END), 0)::int as izin,
        COALESCE(SUM(CASE WHEN a.status='sakit' THEN 1 ELSE 0 END), 0)::int as sakit,
        COALESCE(SUM(CASE WHEN a.status='alpa' THEN 1 ELSE 0 END), 0)::int as alpa
      FROM attendances a
      JOIN schedules sc ON a.schedule_id = sc.id
      WHERE sc.teacher_id = $1 AND a.date >= CURRENT_DATE - INTERVAL '30 days'
    `, [teacherId]);

    res.json({
      todaySchedules: todaySchedulesRes.rows,
      stats: statsRes.rows[0] || { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.student = async (req, res) => {
  try {
    const studentId = req.user.ref_id;
    const todayDate = new Date().toISOString().split('T')[0];

    const stRes = await query(`
      SELECT s.*, c.name as class_name, c.grade FROM students s
      LEFT JOIN classes c ON s.class_id = c.id WHERE s.id = $1
    `, [studentId]);
    const student = stRes.rows[0] || null;

    // Today's attendance
    const todayAttendanceRes = await query(`
      SELECT a.*, sub.name as subject_name, sc.start_time, sc.end_time
      FROM attendances a
      JOIN schedules sc ON a.schedule_id = sc.id
      JOIN subjects sub ON sc.subject_id = sub.id
      WHERE a.student_id = $1 AND a.date = $2
      ORDER BY sc.start_time
    `, [studentId, todayDate]);

    // Overall stats
    const statsRes = await query(`
      SELECT 
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN status='hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
        COALESCE(SUM(CASE WHEN status='izin' THEN 1 ELSE 0 END), 0)::int as izin,
        COALESCE(SUM(CASE WHEN status='sakit' THEN 1 ELSE 0 END), 0)::int as sakit,
        COALESCE(SUM(CASE WHEN status='alpa' THEN 1 ELSE 0 END), 0)::int as alpa
      FROM attendances WHERE student_id = $1
    `, [studentId]);
    const stats = statsRes.rows[0] || { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    stats.percentage = stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0;

    // Today's schedule
    let dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;
    let todaySchedule = [];
    if (student && student.class_id) {
      const scheduleRes = await query(`
        SELECT sc.*, sub.name as subject_name, t.name as teacher_name
        FROM schedules sc
        JOIN subjects sub ON sc.subject_id = sub.id
        JOIN teachers t ON sc.teacher_id = t.id
        WHERE sc.class_id = $1 AND sc.day_of_week = $2
        ORDER BY sc.start_time
      `, [student.class_id, dayOfWeek]);
      todaySchedule = scheduleRes.rows;
    }

    // Recent history
    const recentHistoryRes = await query(`
      SELECT a.*, sub.name as subject_name
      FROM attendances a
      JOIN schedules sc ON a.schedule_id = sc.id
      JOIN subjects sub ON sc.subject_id = sub.id
      WHERE a.student_id = $1
      ORDER BY a.date DESC, sc.start_time DESC LIMIT 20
    `, [studentId]);

    res.json({
      student,
      todayAttendance: todayAttendanceRes.rows,
      stats,
      todaySchedule,
      recentHistory: recentHistoryRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.parent = async (req, res) => {
  try {
    const parentId = req.user.ref_id;
    const todayDate = new Date().toISOString().split('T')[0];

    // Get children
    const childrenRes = await query(`
      SELECT s.*, c.name as class_name, c.grade
      FROM students s
      JOIN parent_student ps ON s.id = ps.student_id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE ps.parent_id = $1
    `, [parentId]);

    const childrenData = await Promise.all(
      childrenRes.rows.map(async (child) => {
        const todayAttendanceRes = await query(`
          SELECT a.*, sub.name as subject_name
          FROM attendances a
          JOIN schedules sc ON a.schedule_id = sc.id
          JOIN subjects sub ON sc.subject_id = sub.id
          WHERE a.student_id = $1 AND a.date = $2
        `, [child.id, todayDate]);

        const statsRes = await query(`
          SELECT COUNT(*)::int as total,
            COALESCE(SUM(CASE WHEN status='hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
            COALESCE(SUM(CASE WHEN status='izin' THEN 1 ELSE 0 END), 0)::int as izin,
            COALESCE(SUM(CASE WHEN status='sakit' THEN 1 ELSE 0 END), 0)::int as sakit,
            COALESCE(SUM(CASE WHEN status='alpa' THEN 1 ELSE 0 END), 0)::int as alpa
          FROM attendances WHERE student_id = $1
        `, [child.id]);
        const stats = statsRes.rows[0] || { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0 };
        stats.percentage = stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0;

        return { ...child, todayAttendance: todayAttendanceRes.rows, stats };
      })
    );

    res.json({ children: childrenData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.principal = async (req, res) => {
  try {
    const todayDate = new Date().toISOString().split('T')[0];

    const stRes = await query('SELECT COUNT(*) as count FROM students WHERE is_active = true');
    const totalStudents = parseInt(stRes.rows[0].count) || 0;

    const tcRes = await query('SELECT COUNT(*) as count FROM teachers WHERE is_active = true');
    const totalTeachers = parseInt(tcRes.rows[0].count) || 0;

    const clRes = await query('SELECT COUNT(*) as count FROM classes');
    const totalClasses = parseInt(clRes.rows[0].count) || 0;

    const todayStatsRes = await query(`
      SELECT COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN status='hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
        COALESCE(SUM(CASE WHEN status='izin' THEN 1 ELSE 0 END), 0)::int as izin,
        COALESCE(SUM(CASE WHEN status='sakit' THEN 1 ELSE 0 END), 0)::int as sakit,
        COALESCE(SUM(CASE WHEN status='alpa' THEN 1 ELSE 0 END), 0)::int as alpa
      FROM attendances WHERE date = $1
    `, [todayDate]);

    // Class stats
    const classStatsRes = await query(`
      SELECT c.id, c.name as class_name, c.grade,
        (SELECT COUNT(*)::int FROM students WHERE class_id = c.id AND is_active = true) as student_count,
        COUNT(a.id)::int as total_attendance,
        COALESCE(SUM(CASE WHEN a.status='hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
        COALESCE(SUM(CASE WHEN a.status='alpa' THEN 1 ELSE 0 END), 0)::int as alpa
      FROM classes c
      LEFT JOIN schedules sc ON c.id = sc.class_id
      LEFT JOIN attendances a ON sc.id = a.schedule_id AND a.date = $1
      GROUP BY c.id ORDER BY c.grade, c.name
    `, [todayDate]);

    // Monthly trend
    const monthlyTrendRes = await query(`
      SELECT TO_CHAR(date, 'YYYY-MM') as month,
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN status='hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
        COALESCE(SUM(CASE WHEN status='izin' THEN 1 ELSE 0 END), 0)::int as izin,
        COALESCE(SUM(CASE WHEN status='sakit' THEN 1 ELSE 0 END), 0)::int as sakit,
        COALESCE(SUM(CASE WHEN status='alpa' THEN 1 ELSE 0 END), 0)::int as alpa
      FROM attendances
      GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month
    `);

    // Weekly trend
    const weeklyTrendRes = await query(`
      SELECT date,
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN status='hadir' THEN 1 ELSE 0 END), 0)::int as hadir
      FROM attendances WHERE date >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY date ORDER BY date
    `);

    res.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      todayAttendance: todayStatsRes.rows[0] || { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0 },
      classStats: classStatsRes.rows,
      monthlyTrend: monthlyTrendRes.rows,
      weeklyTrend: weeklyTrendRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

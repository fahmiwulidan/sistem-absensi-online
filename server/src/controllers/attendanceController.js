const { query, getClient } = require('../config/database');

// POST /api/attendances/bulk — Save attendance for entire class
exports.bulkCreate = async (req, res) => {
  const client = await getClient();
  try {
    const { schedule_id, date, attendances } = req.body;

    if (!schedule_id || !date || !attendances || !Array.isArray(attendances)) {
      client.release();
      return res.status(400).json({ error: 'Data absensi tidak lengkap' });
    }

    await client.query('BEGIN');

    // If attendance already exists for this schedule+date, remove old records to allow update
    await client.query(
      'DELETE FROM attendances WHERE schedule_id = $1 AND date = $2',
      [schedule_id, date]
    );

    for (const item of attendances) {
      await client.query(
        `INSERT INTO attendances (schedule_id, student_id, date, status, notes, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [schedule_id, item.student_id, date, item.status, item.notes || null, req.user.id]
      );
    }

    // Get schedule info
    const schedRes = await client.query(`
      SELECT sc.*, sub.name as subject_name, c.name as class_name
      FROM schedules sc
      JOIN subjects sub ON sc.subject_id = sub.id
      JOIN classes c ON sc.class_id = c.id
      WHERE sc.id = $1
    `, [schedule_id]);
    const schedule = schedRes.rows[0];

    // Create notifications for absent students
    const absentStudents = attendances.filter(a => a.status !== 'hadir');
    for (const absent of absentStudents) {
      const stRes = await client.query('SELECT name FROM students WHERE id = $1', [absent.student_id]);
      const student = stRes.rows[0];

      const parentUsersRes = await client.query(`
        SELECT u.id FROM users u
        JOIN parents p ON u.ref_id = p.id AND u.role = 'orangtua'
        JOIN parent_student ps ON p.id = ps.parent_id
        WHERE ps.student_id = $1
      `, [absent.student_id]);

      const statusLabel = { izin: 'Izin', sakit: 'Sakit', alpa: 'Alpa' };
      for (const pu of parentUsersRes.rows) {
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
          [
            pu.id,
            'Informasi Kehadiran Anak',
            `${student?.name} tercatat ${statusLabel[absent.status] || absent.status} pada mata pelajaran ${schedule?.subject_name} (${schedule?.class_name}), tanggal ${date}.${absent.notes ? ' Keterangan: ' + absent.notes : ''}`,
            absent.status === 'alpa' ? 'warning' : 'info'
          ]
        );
      }
    }

    // Notify teacher - success
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
      [
        req.user.id,
        'Absensi Berhasil',
        `Absensi ${schedule?.class_name} - ${schedule?.subject_name} tanggal ${date} berhasil disimpan.`,
        'success'
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Absensi berhasil disimpan', count: attendances.length });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// GET /api/attendances — List with filters
exports.getAll = async (req, res) => {
  try {
    const { schedule_id, student_id, class_id, date, date_from, date_to, status, teacher_id } = req.query;

    let sql = `
      SELECT a.*, s.name as student_name, s.nis,
        sc.day_of_week, sc.start_time, sc.end_time,
        sub.name as subject_name, t.name as teacher_name,
        c.name as class_name, c.id as class_id
      FROM attendances a
      JOIN students s ON a.student_id = s.id
      JOIN schedules sc ON a.schedule_id = sc.id
      JOIN subjects sub ON sc.subject_id = sub.id
      JOIN teachers t ON sc.teacher_id = t.id
      JOIN classes c ON sc.class_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (schedule_id && schedule_id !== 'undefined' && !isNaN(parseInt(schedule_id))) {
      sql += ` AND a.schedule_id = $${idx++}`;
      params.push(parseInt(schedule_id));
    }
    if (student_id && student_id !== 'undefined' && !isNaN(parseInt(student_id))) {
      sql += ` AND a.student_id = $${idx++}`;
      params.push(parseInt(student_id));
    }
    if (class_id && class_id !== 'undefined' && !isNaN(parseInt(class_id))) {
      sql += ` AND c.id = $${idx++}`;
      params.push(parseInt(class_id));
    }
    if (date && date !== 'undefined' && date.trim()) {
      sql += ` AND a.date = $${idx++}`;
      params.push(date.trim());
    }
    if (date_from && date_from !== 'undefined' && date_from.trim()) {
      sql += ` AND a.date >= $${idx++}`;
      params.push(date_from.trim());
    }
    if (date_to && date_to !== 'undefined' && date_to.trim()) {
      sql += ` AND a.date <= $${idx++}`;
      params.push(date_to.trim());
    }
    if (status && status !== 'undefined' && status.trim()) {
      sql += ` AND a.status = $${idx++}`;
      params.push(status.trim());
    }
    if (teacher_id && teacher_id !== 'undefined' && !isNaN(parseInt(teacher_id))) {
      sql += ` AND sc.teacher_id = $${idx++}`;
      params.push(parseInt(teacher_id));
    }

    sql += ' ORDER BY a.date DESC, sc.start_time ASC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/attendances/:id — Update single attendance
exports.update = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const existing = await query('SELECT * FROM attendances WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Data absensi tidak ditemukan' });

    const row = existing.rows[0];
    const result = await query(
      `UPDATE attendances
       SET status = $1, notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status || row.status, notes !== undefined ? notes : row.notes, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/attendances/check/:scheduleId/:date
exports.check = async (req, res) => {
  try {
    const { scheduleId, date } = req.params;
    const existing = await query(
      'SELECT COUNT(*)::int as count FROM attendances WHERE schedule_id = $1 AND date = $2',
      [scheduleId, date]
    );

    if (existing.rows[0].count > 0) {
      const attendances = await query(`
        SELECT a.*, s.name as student_name, s.nis
        FROM attendances a
        JOIN students s ON a.student_id = s.id
        WHERE a.schedule_id = $1 AND a.date = $2
        ORDER BY s.name
      `, [scheduleId, date]);
      return res.json({ exists: true, attendances: attendances.rows });
    }

    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/attendances/recap — Recap with filters
exports.recap = async (req, res) => {
  try {
    const { class_id, student_id, date_from, date_to, subject_id, teacher_id } = req.query;

    let whereClause = '1=1';
    const params = [];
    let idx = 1;

    if (class_id && class_id !== 'undefined' && !isNaN(parseInt(class_id))) {
      whereClause += ` AND c.id = $${idx++}`;
      params.push(parseInt(class_id));
    }
    if (student_id && student_id !== 'undefined' && !isNaN(parseInt(student_id))) {
      whereClause += ` AND s.id = $${idx++}`;
      params.push(parseInt(student_id));
    }
    if (date_from && date_from !== 'undefined' && date_from.trim()) {
      whereClause += ` AND a.date >= $${idx++}`;
      params.push(date_from.trim());
    }
    if (date_to && date_to !== 'undefined' && date_to.trim()) {
      whereClause += ` AND a.date <= $${idx++}`;
      params.push(date_to.trim());
    }
    if (subject_id && subject_id !== 'undefined' && !isNaN(parseInt(subject_id))) {
      whereClause += ` AND sc.subject_id = $${idx++}`;
      params.push(parseInt(subject_id));
    }
    if (teacher_id && teacher_id !== 'undefined' && !isNaN(parseInt(teacher_id))) {
      whereClause += ` AND sc.teacher_id = $${idx++}`;
      params.push(parseInt(teacher_id));
    }

    const result = await query(`
      SELECT 
        s.id as student_id, s.name as student_name, s.nis,
        c.name as class_name,
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
        COALESCE(SUM(CASE WHEN a.status = 'izin' THEN 1 ELSE 0 END), 0)::int as izin,
        COALESCE(SUM(CASE WHEN a.status = 'sakit' THEN 1 ELSE 0 END), 0)::int as sakit,
        COALESCE(SUM(CASE WHEN a.status = 'alpa' THEN 1 ELSE 0 END), 0)::int as alpa
      FROM attendances a
      JOIN students s ON a.student_id = s.id
      JOIN schedules sc ON a.schedule_id = sc.id
      JOIN classes c ON sc.class_id = c.id
      WHERE ${whereClause}
      GROUP BY s.id, s.name, s.nis, c.name
      ORDER BY s.name
    `, params);

    const recapWithPercentage = result.rows.map(r => ({
      ...r,
      percentage: r.total > 0 ? Math.round((r.hadir / r.total) * 100) : 0,
    }));

    res.json(recapWithPercentage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/attendances/stats
exports.stats = async (req, res) => {
  try {
    const { date, date_from, date_to, class_id } = req.query;

    let whereClause = '1=1';
    const params = [];
    let idx = 1;

    if (date && date !== 'undefined' && date.trim()) {
      whereClause += ` AND a.date = $${idx++}`;
      params.push(date.trim());
    }
    if (date_from && date_from !== 'undefined' && date_from.trim()) {
      whereClause += ` AND a.date >= $${idx++}`;
      params.push(date_from.trim());
    }
    if (date_to && date_to !== 'undefined' && date_to.trim()) {
      whereClause += ` AND a.date <= $${idx++}`;
      params.push(date_to.trim());
    }
    if (class_id && class_id !== 'undefined' && !isNaN(parseInt(class_id))) {
      whereClause += ` AND sc.class_id = $${idx++}`;
      params.push(parseInt(class_id));
    }

    const statsRes = await query(`
      SELECT 
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
        COALESCE(SUM(CASE WHEN a.status = 'izin' THEN 1 ELSE 0 END), 0)::int as izin,
        COALESCE(SUM(CASE WHEN a.status = 'sakit' THEN 1 ELSE 0 END), 0)::int as sakit,
        COALESCE(SUM(CASE WHEN a.status = 'alpa' THEN 1 ELSE 0 END), 0)::int as alpa
      FROM attendances a
      JOIN schedules sc ON a.schedule_id = sc.id
      WHERE ${whereClause}
    `, params);

    const stats = statsRes.rows[0] || { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    stats.percentage = stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0;

    // Per-class stats
    const classStatsRes = await query(`
      SELECT 
        c.id as class_id, c.name as class_name, c.grade,
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
        COALESCE(SUM(CASE WHEN a.status = 'izin' THEN 1 ELSE 0 END), 0)::int as izin,
        COALESCE(SUM(CASE WHEN a.status = 'sakit' THEN 1 ELSE 0 END), 0)::int as sakit,
        COALESCE(SUM(CASE WHEN a.status = 'alpa' THEN 1 ELSE 0 END), 0)::int as alpa
      FROM attendances a
      JOIN schedules sc ON a.schedule_id = sc.id
      JOIN classes c ON sc.class_id = c.id
      WHERE ${whereClause}
      GROUP BY c.id, c.name, c.grade
      ORDER BY c.grade, c.name
    `, params);

    // Monthly stats
    const monthlyStatsRes = await query(`
      SELECT 
        TO_CHAR(a.date, 'YYYY-MM') as month,
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END), 0)::int as hadir,
        COALESCE(SUM(CASE WHEN a.status = 'izin' THEN 1 ELSE 0 END), 0)::int as izin,
        COALESCE(SUM(CASE WHEN a.status = 'sakit' THEN 1 ELSE 0 END), 0)::int as sakit,
        COALESCE(SUM(CASE WHEN a.status = 'alpa' THEN 1 ELSE 0 END), 0)::int as alpa
      FROM attendances a
      JOIN schedules sc ON a.schedule_id = sc.id
      WHERE ${whereClause}
      GROUP BY TO_CHAR(a.date, 'YYYY-MM')
      ORDER BY month
    `, params);

    res.json({
      ...stats,
      overall: stats,
      byClass: classStatsRes.rows,
      monthly: monthlyStatsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const { query } = require('../config/database');

const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

exports.getAll = async (req, res) => {
  try {
    const { class_id, teacher_id, day_of_week, academic_year_id } = req.query;

    let sql = `
      SELECT sc.*,
        sub.name as subject_name, sub.code as subject_code,
        t.name as teacher_name,
        c.name as class_name, c.grade
      FROM schedules sc
      JOIN subjects sub ON sc.subject_id = sub.id
      JOIN teachers t ON sc.teacher_id = t.id
      JOIN classes c ON sc.class_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (class_id && class_id !== 'undefined' && !isNaN(parseInt(class_id))) {
      sql += ` AND sc.class_id = $${idx++}`;
      params.push(parseInt(class_id));
    }
    if (teacher_id && teacher_id !== 'undefined' && !isNaN(parseInt(teacher_id))) {
      sql += ` AND sc.teacher_id = $${idx++}`;
      params.push(parseInt(teacher_id));
    }
    if (day_of_week && day_of_week !== 'undefined' && !isNaN(parseInt(day_of_week))) {
      sql += ` AND sc.day_of_week = $${idx++}`;
      params.push(parseInt(day_of_week));
    }
    if (academic_year_id && academic_year_id !== 'undefined' && !isNaN(parseInt(academic_year_id))) {
      sql += ` AND sc.academic_year_id = $${idx++}`;
      params.push(parseInt(academic_year_id));
    }

    sql += ' ORDER BY sc.day_of_week, sc.start_time';

    const result = await query(sql, params);
    const schedules = result.rows.map(s => ({ ...s, day_name: DAY_NAMES[s.day_of_week] }));
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getToday = async (req, res) => {
  try {
    const today = new Date();
    let dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    if (dayOfWeek === 0) dayOfWeek = 7; // No Sunday class

    const { teacher_id, class_id } = req.query;
    let sql = `
      SELECT sc.*,
        sub.name as subject_name, sub.code as subject_code,
        t.name as teacher_name,
        c.name as class_name, c.grade
      FROM schedules sc
      JOIN subjects sub ON sc.subject_id = sub.id
      JOIN teachers t ON sc.teacher_id = t.id
      JOIN classes c ON sc.class_id = c.id
      WHERE sc.day_of_week = $1
    `;
    const params = [dayOfWeek];
    let idx = 2;

    if (teacher_id) {
      sql += ` AND sc.teacher_id = $${idx++}`;
      params.push(teacher_id);
    }
    if (class_id) {
      sql += ` AND sc.class_id = $${idx++}`;
      params.push(class_id);
    }

    sql += ' ORDER BY sc.start_time';

    const result = await query(sql, params);
    const schedules = result.rows.map(s => ({ ...s, day_name: DAY_NAMES[s.day_of_week] }));
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await query(`
      SELECT sc.*, sub.name as subject_name, t.name as teacher_name, c.name as class_name
      FROM schedules sc
      JOIN subjects sub ON sc.subject_id = sub.id
      JOIN teachers t ON sc.teacher_id = t.id
      JOIN classes c ON sc.class_id = c.id
      WHERE sc.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
    const schedule = result.rows[0];
    res.json({ ...schedule, day_name: DAY_NAMES[schedule.day_of_week] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { day_of_week, start_time, end_time, subject_id, teacher_id, class_id, room, academic_year_id } = req.body;
    if (!day_of_week || !start_time || !end_time || !subject_id || !teacher_id || !class_id) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    const result = await query(`
      INSERT INTO schedules (day_of_week, start_time, end_time, subject_id, teacher_id, class_id, room, academic_year_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [day_of_week, start_time, end_time, subject_id, teacher_id, class_id, room || null, academic_year_id || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { day_of_week, start_time, end_time, subject_id, teacher_id, class_id, room, academic_year_id } = req.body;
    const existing = await query('SELECT * FROM schedules WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });

    const row = existing.rows[0];
    const result = await query(`
      UPDATE schedules
      SET day_of_week = $1, start_time = $2, end_time = $3, subject_id = $4,
          teacher_id = $5, class_id = $6, room = $7, academic_year_id = $8
      WHERE id = $9
      RETURNING *
    `, [
      day_of_week || row.day_of_week,
      start_time || row.start_time,
      end_time || row.end_time,
      subject_id || row.subject_id,
      teacher_id || row.teacher_id,
      class_id || row.class_id,
      room || row.room,
      academic_year_id || row.academic_year_id,
      req.params.id
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const check = await query('SELECT id FROM schedules WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });

    await query('DELETE FROM schedules WHERE id = $1', [req.params.id]);
    res.json({ message: 'Jadwal berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

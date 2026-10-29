const { query, getClient } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { search, is_active } = req.query;
    let sql = 'SELECT * FROM teachers WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      sql += ` AND (name ILIKE $${idx} OR nip ILIKE $${idx} OR email ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (is_active !== undefined) {
      sql += ` AND is_active = $${idx++}`;
      params.push(is_active === 'true' || is_active === '1' || is_active === true || is_active === 1);
    }
    sql += ' ORDER BY name ASC';

    const teachersResult = await query(sql, params);
    const teachers = teachersResult.rows;

    // Get subjects for all teachers in one query
    const subjectsResult = await query(`
      SELECT ts.teacher_id, s.id as subject_id, s.code, s.name
      FROM teacher_subjects ts
      JOIN subjects s ON ts.subject_id = s.id
    `);
    const teacherSubjects = subjectsResult.rows;

    const teachersWithSubjects = teachers.map(t => ({
      ...t,
      subjects: teacherSubjects.filter(ts => ts.teacher_id === t.id),
    }));

    res.json(teachersWithSubjects);
  } catch (err) {
    console.error('getAll teachers error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await query('SELECT * FROM teachers WHERE id = $1', [req.params.id]);
    const teacher = result.rows[0];
    if (!teacher) return res.status(404).json({ error: 'Guru tidak ditemukan' });

    const subjectsResult = await query(`
      SELECT s.* FROM subjects s
      JOIN teacher_subjects ts ON s.id = ts.subject_id
      WHERE ts.teacher_id = $1
    `, [req.params.id]);

    const classesResult = await query('SELECT * FROM classes WHERE homeroom_teacher_id = $1', [req.params.id]);

    res.json({ ...teacher, subjects: subjectsResult.rows, homeroomClasses: classesResult.rows });
  } catch (err) {
    console.error('getById teacher error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { nip, name, email, phone, gender, subject_ids } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama guru wajib diisi' });

    const result = await client.query(
      'INSERT INTO teachers (nip, name, email, phone, gender) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nip || null, name, email || null, phone || null, gender || null]
    );
    const teacher = result.rows[0];

    if (subject_ids && subject_ids.length > 0) {
      for (const sid of subject_ids) {
        await client.query(
          'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [teacher.id, sid]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(teacher);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('create teacher error:', err);
    if (err.code === '23505') return res.status(409).json({ error: 'NIP sudah terdaftar' });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.update = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { nip, name, email, phone, gender, is_active, subject_ids } = req.body;

    const existResult = await client.query('SELECT * FROM teachers WHERE id = $1', [req.params.id]);
    const existing = existResult.rows[0];
    if (!existing) return res.status(404).json({ error: 'Guru tidak ditemukan' });

    const result = await client.query(`
      UPDATE teachers SET nip=$1, name=$2, email=$3, phone=$4, gender=$5, is_active=$6, updated_at=NOW()
      WHERE id=$7 RETURNING *
    `, [
      nip ?? existing.nip, name ?? existing.name, email ?? existing.email,
      phone ?? existing.phone, gender ?? existing.gender,
      is_active !== undefined ? (is_active === true || is_active === 1 || is_active === '1' || is_active === 'true') : existing.is_active,
      req.params.id,
    ]);

    if (subject_ids !== undefined) {
      await client.query('DELETE FROM teacher_subjects WHERE teacher_id = $1', [req.params.id]);
      for (const sid of subject_ids) {
        await client.query(
          'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.params.id, sid]
        );
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('update teacher error:', err);
    if (err.code === '23505') return res.status(409).json({ error: 'NIP sudah terdaftar' });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await query('DELETE FROM teachers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Guru tidak ditemukan' });
    res.json({ message: 'Guru berhasil dihapus' });
  } catch (err) {
    console.error('delete teacher error:', err);
    res.status(500).json({ error: err.message });
  }
};

const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, t.name as homeroom_teacher_name, ay.name as academic_year_name,
      (SELECT COUNT(*)::int FROM students s WHERE s.class_id = c.id AND s.is_active = true) as student_count
      FROM classes c
      LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      ORDER BY c.grade, c.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, t.name as homeroom_teacher_name, ay.name as academic_year_name
      FROM classes c
      LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE c.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM students WHERE class_id = $1 AND is_active = true ORDER BY name',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, grade, homeroom_teacher_id, academic_year_id } = req.body;
    if (!name || !grade) return res.status(400).json({ error: 'Nama dan tingkat kelas wajib diisi' });

    const result = await query(
      `INSERT INTO classes (name, grade, homeroom_teacher_id, academic_year_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, grade, homeroom_teacher_id || null, academic_year_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, grade, homeroom_teacher_id, academic_year_id } = req.body;
    const existing = await query('SELECT * FROM classes WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Kelas tidak ditemukan' });

    const row = existing.rows[0];
    const result = await query(
      `UPDATE classes
       SET name = $1, grade = $2, homeroom_teacher_id = $3, academic_year_id = $4
       WHERE id = $5
       RETURNING *`,
      [
        name || row.name,
        grade || row.grade,
        homeroom_teacher_id !== undefined ? homeroom_teacher_id : row.homeroom_teacher_id,
        academic_year_id !== undefined ? academic_year_id : row.academic_year_id,
        req.params.id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const check = await query('SELECT id FROM classes WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Kelas tidak ditemukan' });

    const countRes = await query('SELECT COUNT(*)::int as count FROM students WHERE class_id = $1', [req.params.id]);
    if (countRes.rows[0].count > 0) {
      return res.status(400).json({ error: 'Kelas masih memiliki siswa. Pindahkan siswa terlebih dahulu.' });
    }

    await query('DELETE FROM classes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Kelas berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

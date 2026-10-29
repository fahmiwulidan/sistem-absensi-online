const { query } = require('../config/database');

// GET /api/students
exports.getAll = async (req, res) => {
  try {
    const { class_id, search, is_active } = req.query;

    let sql = `
      SELECT s.*, c.name as class_name, c.grade
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (class_id && class_id !== 'undefined' && class_id !== 'null' && !isNaN(parseInt(class_id))) {
      sql += ` AND s.class_id = $${idx++}`;
      params.push(parseInt(class_id));
    }
    if (search) {
      sql += ` AND (s.name ILIKE $${idx} OR s.nis ILIKE $${idx} OR s.nisn ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (is_active !== undefined) {
      sql += ` AND s.is_active = $${idx++}`;
      params.push(is_active === 'true' || is_active === '1' || is_active === true || is_active === 1);
    }

    sql += ' ORDER BY s.name ASC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getAll students error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/students/:id
exports.getById = async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*, c.name as class_name, c.grade
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
    `, [req.params.id]);

    const student = result.rows[0];
    if (!student) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }

    const parentsResult = await query(`
      SELECT p.* FROM parents p
      JOIN parent_student ps ON p.id = ps.parent_id
      WHERE ps.student_id = $1
    `, [req.params.id]);

    res.json({ ...student, parents: parentsResult.rows });
  } catch (err) {
    console.error('getById student error:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/students
exports.create = async (req, res) => {
  try {
    const { nis, nisn, name, gender, birth_place, birth_date, address, phone, class_id } = req.body;

    if (!nis || !name) {
      return res.status(400).json({ error: 'NIS dan nama siswa wajib diisi' });
    }

    const result = await query(`
      INSERT INTO students (nis, nisn, name, gender, birth_place, birth_date, address, phone, class_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [nis, nisn || null, name, gender || null, birth_place || null, birth_date || null, address || null, phone || null, class_id || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('create student error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'NIS atau NISN sudah terdaftar' });
    }
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/students/:id
exports.update = async (req, res) => {
  try {
    const existResult = await query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    const existing = existResult.rows[0];
    if (!existing) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }

    const { nis, nisn, name, gender, birth_place, birth_date, address, phone, class_id, is_active } = req.body;

    const result = await query(`
      UPDATE students SET
        nis = $1, nisn = $2, name = $3, gender = $4, birth_place = $5,
        birth_date = $6, address = $7, phone = $8, class_id = $9,
        is_active = $10, updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      nis ?? existing.nis,
      nisn ?? existing.nisn,
      name ?? existing.name,
      gender ?? existing.gender,
      birth_place ?? existing.birth_place,
      birth_date ?? existing.birth_date,
      address ?? existing.address,
      phone ?? existing.phone,
      class_id !== undefined ? class_id : existing.class_id,
      is_active !== undefined ? (is_active === true || is_active === 1 || is_active === '1' || is_active === 'true') : existing.is_active,
      req.params.id,
    ]);

    // Get with class name
    const final = await query(`
      SELECT s.*, c.name as class_name FROM students s
      LEFT JOIN classes c ON s.class_id = c.id WHERE s.id = $1
    `, [req.params.id]);
    res.json(final.rows[0]);
  } catch (err) {
    console.error('update student error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'NIS atau NISN sudah terdaftar' });
    }
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/students/:id
exports.delete = async (req, res) => {
  try {
    const result = await query('DELETE FROM students WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan' });
    }
    res.json({ message: 'Siswa berhasil dihapus' });
  } catch (err) {
    console.error('delete student error:', err);
    res.status(500).json({ error: err.message });
  }
};

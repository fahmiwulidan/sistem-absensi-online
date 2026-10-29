const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await query('SELECT * FROM academic_years ORDER BY name DESC, semester DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActive = async (req, res) => {
  try {
    const result = await query('SELECT * FROM academic_years WHERE is_active = true LIMIT 1');
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, semester, start_date, end_date, is_active } = req.body;
    if (!name || !semester || !start_date || !end_date) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    if (is_active) {
      await query('UPDATE academic_years SET is_active = false');
    }

    const result = await query(
      `INSERT INTO academic_years (name, semester, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, semester, start_date, end_date, !!is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, semester, start_date, end_date, is_active } = req.body;
    const existingRes = await query('SELECT * FROM academic_years WHERE id = $1', [req.params.id]);
    if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan' });
    const existing = existingRes.rows[0];

    if (is_active) {
      await query('UPDATE academic_years SET is_active = false');
    }

    const result = await query(
      `UPDATE academic_years
       SET name = $1, semester = $2, start_date = $3, end_date = $4, is_active = $5
       WHERE id = $6
       RETURNING *`,
      [
        name || existing.name,
        semester || existing.semester,
        start_date || existing.start_date,
        end_date || existing.end_date,
        is_active !== undefined ? !!is_active : existing.is_active,
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
    const check = await query('SELECT id FROM academic_years WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan' });

    await query('DELETE FROM academic_years WHERE id = $1', [req.params.id]);
    res.json({ message: 'Tahun ajaran berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

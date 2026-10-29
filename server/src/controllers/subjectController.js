const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await query('SELECT * FROM subjects ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await query('SELECT * FROM subjects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });

    const teachersResult = await query(
      `SELECT t.* FROM teachers t
       JOIN teacher_subjects ts ON t.id = ts.teacher_id
       WHERE ts.subject_id = $1`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], teachers: teachersResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Kode dan nama wajib diisi' });

    const result = await query(
      'INSERT INTO subjects (code, name) VALUES ($1, $2) RETURNING *',
      [code, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message.includes('unique') || err.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Kode mata pelajaran sudah ada' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { code, name } = req.body;
    const existing = await query('SELECT * FROM subjects WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });

    const row = existing.rows[0];
    const result = await query(
      'UPDATE subjects SET code = $1, name = $2 WHERE id = $3 RETURNING *',
      [code || row.code, name || row.name, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.message.includes('unique') || err.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Kode mata pelajaran sudah ada' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const check = await query('SELECT id FROM subjects WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });

    await query('DELETE FROM subjects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Mata pelajaran berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { role, search } = req.query;
    let sql = 'SELECT id, username, email, role, ref_id, is_active, last_login, created_at FROM users WHERE 1=1';
    const params = [];
    let idx = 1;

    if (role) {
      sql += ` AND role = $${idx++}`;
      params.push(role);
    }
    if (search) {
      sql += ` AND (username ILIKE $${idx} OR email ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, role, ref_id, is_active, last_login, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { username, email, password, role, ref_id } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, dan role wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role, ref_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, ref_id, is_active`,
      [username, email, hash, role, ref_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message.includes('unique') || err.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Username atau email sudah terdaftar' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { username, email, password, role, ref_id, is_active } = req.body;
    const existingRes = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (existingRes.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    const existing = existingRes.rows[0];

    let hash = existing.password_hash;
    if (password) hash = await bcrypt.hash(password, 10);

    const result = await query(
      `UPDATE users
       SET username = $1, email = $2, password_hash = $3, role = $4, ref_id = $5, is_active = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, username, email, role, ref_id, is_active`,
      [
        username || existing.username,
        email || existing.email,
        hash,
        role || existing.role,
        ref_id !== undefined ? ref_id : existing.ref_id,
        is_active !== undefined ? is_active : existing.is_active,
        req.params.id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.message.includes('unique') || err.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Username atau email sudah terdaftar' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri' });
    }
    const check = await query('SELECT id FROM users WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

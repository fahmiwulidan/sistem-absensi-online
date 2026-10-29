const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password diperlukan' });
    }

    const cleanUsername = username.trim();

    // Cari user berdasarkan username, email, NIS siswa, NIP guru, atau phone orangtua (case-insensitive)
    const result = await query(`
      SELECT u.* FROM users u
      LEFT JOIN students s ON u.ref_id = s.id AND u.role = 'siswa'
      LEFT JOIN teachers t ON u.ref_id = t.id AND u.role = 'guru'
      LEFT JOIN parents p ON u.ref_id = p.id AND u.role = 'orangtua'
      WHERE LOWER(u.username) = LOWER($1) OR LOWER(u.email) = LOWER($1) OR s.nis = $1 OR t.nip = $1 OR p.phone = $1
      LIMIT 1
    `, [cleanUsername]);

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Akun Anda tidak aktif. Hubungi admin.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Get profile data based on role
    let profile = null;
    if (user.role === 'guru' && user.ref_id) {
      const pr = await query('SELECT * FROM teachers WHERE id = $1', [user.ref_id]);
      profile = pr.rows[0] || null;
    } else if (user.role === 'siswa' && user.ref_id) {
      const pr = await query(`
        SELECT s.*, c.name as class_name, c.grade
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.id = $1
      `, [user.ref_id]);
      profile = pr.rows[0] || null;
    } else if (user.role === 'orangtua' && user.ref_id) {
      const pr = await query('SELECT * FROM parents WHERE id = $1', [user.ref_id]);
      profile = pr.rows[0] || null;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, ref_id: user.ref_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        ref_id: user.ref_id,
        profile,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat login' });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, role, ref_id, is_active, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];

    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    let profile = null;
    if (user.role === 'guru' && user.ref_id) {
      const pr = await query('SELECT * FROM teachers WHERE id = $1', [user.ref_id]);
      profile = pr.rows[0] || null;
    } else if (user.role === 'siswa' && user.ref_id) {
      const pr = await query(`
        SELECT s.*, c.name as class_name, c.grade
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.id = $1
      `, [user.ref_id]);
      profile = pr.rows[0] || null;
    } else if (user.role === 'orangtua' && user.ref_id) {
      const pr = await query('SELECT * FROM parents WHERE id = $1', [user.ref_id]);
      profile = pr.rows[0] || null;
    }

    res.json({ ...user, profile });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password lama dan baru diperlukan' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Password lama salah' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);

    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
};

exports.adminResetPassword = async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;
    if (!identifier || !newPassword) {
      return res.status(400).json({ error: 'Identitas user (username/NIS/NIP/email) dan password baru wajib diisi' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    const cleanId = identifier.trim();

    const result = await query(`
      SELECT u.id, u.username FROM users u
      LEFT JOIN students s ON u.ref_id = s.id AND u.role = 'siswa'
      LEFT JOIN teachers t ON u.ref_id = t.id AND u.role = 'guru'
      LEFT JOIN parents p ON u.ref_id = p.id AND u.role = 'orangtua'
      WHERE LOWER(u.username) = LOWER($1) OR LOWER(u.email) = LOWER($1) OR s.nis = $1 OR t.nip = $1 OR p.phone = $1
      LIMIT 1
    `, [cleanId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User, siswa, atau guru dengan identitas tersebut tidak ditemukan' });
    }

    const targetUser = result.rows[0];
    const hash = await bcrypt.hash(newPassword, 10);

    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, targetUser.id]);

    res.json({ message: `Password untuk akun "${targetUser.username}" berhasil di-reset` });
  } catch (err) {
    console.error('Admin reset password error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat mereset password' });
  }
};

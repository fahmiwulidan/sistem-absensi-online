const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { query } = require('../config/database');

// Verify JWT token middleware
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token autentikasi diperlukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await query(
      'SELECT id, username, email, role, ref_id, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Akun tidak aktif atau tidak ditemukan' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa' });
  }
}

// Role-based access control middleware
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke resource ini' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };

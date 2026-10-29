const { query, getClient } = require('../config/database');
const schoolConfig = require('../config/school');

exports.get = async (req, res) => {
  try {
    const result = await query('SELECT * FROM school_settings');
    const settingsObj = {};
    result.rows.forEach(s => { settingsObj[s.key] = s.value; });
    res.json({ ...schoolConfig, ...settingsObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const client = await getClient();
  try {
    const updates = req.body;
    await client.query('BEGIN');

    for (const [key, value] of Object.entries(updates)) {
      await client.query(
        `INSERT INTO school_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value)]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Pengaturan berhasil disimpan' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

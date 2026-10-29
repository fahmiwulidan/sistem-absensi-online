const { query, getClient } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT p.* FROM parents p WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      sql += ` AND (p.name ILIKE $${idx} OR p.phone ILIKE $${idx} OR p.email ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    sql += ' ORDER BY p.name';

    const parentsResult = await query(sql, params);
    const parents = parentsResult.rows;

    const psResult = await query(`
      SELECT ps.parent_id, s.id as student_id, s.name as student_name, s.nis, c.name as class_name
      FROM parent_student ps
      JOIN students s ON ps.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
    `);
    const parentStudents = psResult.rows;

    const parentsWithChildren = parents.map(p => ({
      ...p,
      children: parentStudents.filter(ps => ps.parent_id === p.id),
    }));

    res.json(parentsWithChildren);
  } catch (err) {
    console.error('getAll parents error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await query('SELECT * FROM parents WHERE id = $1', [req.params.id]);
    const parent = result.rows[0];
    if (!parent) return res.status(404).json({ error: 'Orang tua tidak ditemukan' });

    const childrenResult = await query(`
      SELECT s.*, c.name as class_name FROM students s
      JOIN parent_student ps ON s.id = ps.student_id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE ps.parent_id = $1
    `, [req.params.id]);

    res.json({ ...parent, children: childrenResult.rows });
  } catch (err) {
    console.error('getById parent error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { name, phone, email, relationship, student_ids } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama wajib diisi' });

    const result = await client.query(
      'INSERT INTO parents (name, phone, email, relationship) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone || null, email || null, relationship || null]
    );
    const parent = result.rows[0];

    if (student_ids && student_ids.length > 0) {
      for (const sid of student_ids) {
        await client.query(
          'INSERT INTO parent_student (parent_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [parent.id, sid]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(parent);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('create parent error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.update = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { name, phone, email, relationship, student_ids } = req.body;
    const existResult = await client.query('SELECT * FROM parents WHERE id = $1', [req.params.id]);
    const existing = existResult.rows[0];
    if (!existing) return res.status(404).json({ error: 'Orang tua tidak ditemukan' });

    const result = await client.query(
      'UPDATE parents SET name=$1, phone=$2, email=$3, relationship=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [name ?? existing.name, phone ?? existing.phone, email ?? existing.email, relationship ?? existing.relationship, req.params.id]
    );

    if (student_ids !== undefined) {
      await client.query('DELETE FROM parent_student WHERE parent_id = $1', [req.params.id]);
      for (const sid of student_ids) {
        await client.query(
          'INSERT INTO parent_student (parent_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.params.id, sid]
        );
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('update parent error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await query('DELETE FROM parents WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Orang tua tidak ditemukan' });
    res.json({ message: 'Data orang tua berhasil dihapus' });
  } catch (err) {
    console.error('delete parent error:', err);
    res.status(500).json({ error: err.message });
  }
};

const pool = require('../config/db');

// Get all subjects (default + user custom)
exports.getSubjects = async (req, res, next) => {
  try {
    const [subjects] = await pool.query(
      `SELECT * FROM subjects 
       WHERE is_default = TRUE OR user_id = ? 
       ORDER BY is_default DESC, name ASC`,
      [req.user.id]
    );
    res.json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
};

// Add custom subject
exports.addSubject = async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Subject name is required'
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM subjects WHERE name = ? AND (is_default = TRUE OR user_id = ?)',
      [name, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Subject already exists'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO subjects (name, icon, is_default, user_id) VALUES (?, ?, FALSE, ?)',
      [name, icon || '📖', req.user.id]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId, name, icon: icon || '📖', is_default: false }
    });
  } catch (error) {
    next(error);
  }
};

// Delete custom subject
exports.deleteSubject = async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM subjects WHERE id = ? AND user_id = ? AND is_default = FALSE',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) {
    next(error);
  }
};
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { sanitizeUser } = require('../utils/helpers');

// Get full profile
exports.getProfile = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.avatar, u.email_verified,
              u.email_verified_at, u.last_login_at, u.login_count, u.created_at,
              up.theme, up.preferred_mode, up.tts_enabled
       FROM users u
       LEFT JOIN user_preferences up ON u.id = up.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    // Get study summary
    const [stats] = await pool.query(
      `SELECT COUNT(DISTINCT subject_name) as subjects_studied,
              COALESCE(SUM(questions_asked), 0) as total_questions,
              COALESCE(SUM(time_spent_seconds), 0) as total_time
       FROM study_stats WHERE user_id = ?`,
      [req.user.id]
    );

    // Get MCQ summary
    const [mcqStats] = await pool.query(
      `SELECT COUNT(*) as quizzes_taken,
              COALESCE(AVG(score_percentage), 0) as avg_score
       FROM mcq_sessions 
       WHERE user_id = ? AND status = 'completed'`,
      [req.user.id]
    );

    const [savedMedia] = await pool.query(
      `SELECT COUNT(*) as count FROM generated_media WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        ...sanitizeUser(users[0]),
        email_verified: !!users[0].email_verified,
        stats: stats[0],
        mcqStats: mcqStats[0],
        savedMedia: savedMedia[0].count
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, avatar } = req.body;

    if (username) {
      // Check if username taken
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, req.user.id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Username already taken' });
      }
    }

    const updates = [];
    const values = [];

    if (username) { updates.push('username = ?'); values.push(username); }
    if (avatar !== undefined) { updates.push('avatar = ?'); values.push(avatar); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    values.push(req.user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
};

// Delete account
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password required to delete account' });
    }

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(password, users[0].password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [req.user.id]);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get study activity (for profile page chart)
exports.getActivity = async (req, res, next) => {
  try {
    const [activity] = await pool.query(
      `SELECT session_date, SUM(questions_asked) as questions, SUM(time_spent_seconds) as time_spent
       FROM study_stats
       WHERE user_id = ? AND session_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY session_date ORDER BY session_date`,
      [req.user.id]
    );

    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};
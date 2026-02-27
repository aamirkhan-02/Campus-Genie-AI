const pool = require('../config/db');

// Get all users
exports.getUsers = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at,
              COUNT(DISTINCT cs.id) as total_sessions,
              COALESCE(SUM(ss.questions_asked), 0) as total_questions
       FROM users u
       LEFT JOIN chat_sessions cs ON u.id = cs.user_id
       LEFT JOIN study_stats ss ON u.id = ss.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// Get usage statistics
exports.getUsageStats = async (req, res, next) => {
  try {
    const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
    
    const [totalSessions] = await pool.query('SELECT COUNT(*) as count FROM chat_sessions');
    
    const [totalMessages] = await pool.query('SELECT COUNT(*) as count FROM chat_messages');
    
    const [totalMedia] = await pool.query('SELECT COUNT(*) as count FROM generated_media');

    const [dailyActive] = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as count FROM study_stats 
       WHERE session_date = CURDATE()`
    );

    const [topSubjects] = await pool.query(
      `SELECT subject_name, SUM(questions_asked) as total_questions
       FROM study_stats GROUP BY subject_name 
       ORDER BY total_questions DESC LIMIT 10`
    );

    const [recentActivity] = await pool.query(
      `SELECT u.username, cs.title, cs.subject_name, cs.created_at
       FROM chat_sessions cs
       JOIN users u ON cs.user_id = u.id
       ORDER BY cs.created_at DESC LIMIT 20`
    );

    res.json({
      success: true,
      data: {
        total_users: totalUsers[0].count,
        total_sessions: totalSessions[0].count,
        total_messages: totalMessages[0].count,
        total_media: totalMedia[0].count,
        daily_active_users: dailyActive[0].count,
        top_subjects: topSubjects,
        recent_activity: recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get most asked questions
exports.getMostAskedQuestions = async (req, res, next) => {
  try {
    const [questions] = await pool.query(
      `SELECT cm.content, cs.subject_name, cs.mode, cm.created_at,
              u.username
       FROM chat_messages cm
       JOIN chat_sessions cs ON cm.session_id = cs.id
       JOIN users u ON cs.user_id = u.id
       WHERE cm.role = 'user'
       ORDER BY cm.created_at DESC LIMIT 50`
    );

    res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};
const pool = require('../config/db');
const gemini = require('../config/gemini');

// Get dashboard statistics
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Total questions asked
    const [totalQuestions] = await pool.query(
      `SELECT COALESCE(SUM(questions_asked), 0) as total 
       FROM study_stats WHERE user_id = ?`,
      [userId]
    );

    // Total sessions
    const [totalSessions] = await pool.query(
      'SELECT COUNT(*) as total FROM chat_sessions WHERE user_id = ?',
      [userId]
    );

    // Total time spent (in seconds)
    const [totalTime] = await pool.query(
      `SELECT COALESCE(SUM(time_spent_seconds), 0) as total 
       FROM study_stats WHERE user_id = ?`,
      [userId]
    );

    // Subjects studied
    const [subjectCount] = await pool.query(
      `SELECT COUNT(DISTINCT subject_name) as total 
       FROM study_stats WHERE user_id = ?`,
      [userId]
    );

    // Questions per subject
    const [subjectStats] = await pool.query(
      `SELECT subject_name, SUM(questions_asked) as questions, 
              SUM(time_spent_seconds) as time_spent
       FROM study_stats WHERE user_id = ? 
       GROUP BY subject_name 
       ORDER BY questions DESC`,
      [userId]
    );

    // Last 7 days activity
    const [weeklyActivity] = await pool.query(
      `SELECT session_date, SUM(questions_asked) as questions 
       FROM study_stats 
       WHERE user_id = ? AND session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY session_date 
       ORDER BY session_date ASC`,
      [userId]
    );

    // Recent sessions
    const [recentSessions] = await pool.query(
      `SELECT id, title, subject_name, mode, created_at 
       FROM chat_sessions 
       WHERE user_id = ? 
       ORDER BY updated_at DESC LIMIT 5`,
      [userId]
    );

    // Streak calculation
    const [streakData] = await pool.query(
      `SELECT DISTINCT session_date FROM study_stats 
       WHERE user_id = ? ORDER BY session_date DESC LIMIT 30`,
      [userId]
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const row of streakData) {
      const date = new Date(row.session_date);
      date.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);

      if (date.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      success: true,
      data: {
        total_questions: totalQuestions[0].total,
        total_sessions: totalSessions[0].total,
        total_time_seconds: totalTime[0].total,
        subjects_studied: subjectCount[0].total,
        current_streak: streak,
        subject_stats: subjectStats,
        weekly_activity: weeklyActivity,
        recent_sessions: recentSessions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get weak areas & AI suggestions
exports.getWeakAreas = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [stats] = await pool.query(
      `SELECT subject_name, SUM(questions_asked) as questions
       FROM study_stats WHERE user_id = ?
       GROUP BY subject_name ORDER BY questions ASC`,
      [userId]
    );

    // Get all default subjects
    const [allSubjects] = await pool.query(
      'SELECT name FROM subjects WHERE is_default = TRUE'
    );

    const studiedSubjects = stats.map(s => s.subject_name);
    const unstudied = allSubjects
      .filter(s => !studiedSubjects.includes(s.name))
      .map(s => s.name);

    const weakAreas = stats.filter(s => s.questions < 5).map(s => s.subject_name);

    // AI suggestions
    let aiSuggestions = [];
    if (stats.length > 0) {
      try {
        const result = await gemini.generateContent(
          `You are a study advisor. Based on the study data below, suggest 5 specific topics to focus on. Return ONLY a JSON array of strings, nothing else.
           Studied subjects: ${studiedSubjects.join(', ')}.
           Weak areas (few questions): ${weakAreas.join(', ')}.
           Not studied: ${unstudied.join(', ')}.`
        );

        try {
          const content = result.response.text();
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            aiSuggestions = JSON.parse(jsonMatch[0]);
          }
        } catch {
          aiSuggestions = ['Review weak areas', 'Practice coding problems',
            'Study system design', 'Work on aptitude', 'Review data structures'];
        }
      } catch {
        aiSuggestions = ['Start with fundamentals', 'Practice daily', 'Review weak areas'];
      }
    }

    res.json({
      success: true,
      data: {
        weak_areas: weakAreas,
        unstudied_subjects: unstudied,
        ai_suggestions: aiSuggestions,
        subject_distribution: stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update time spent
exports.updateTimeSpent = async (req, res, next) => {
  try {
    const { subject_name, seconds } = req.body;
    const today = new Date().toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO study_stats (user_id, subject_name, time_spent_seconds, session_date) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE time_spent_seconds = time_spent_seconds + ?`,
      [req.user.id, subject_name || 'General', seconds, today, seconds]
    );

    res.json({ success: true, message: 'Time updated' });
  } catch (error) {
    next(error);
  }
};
const pool = require('../config/db');
const gemini = require('../config/gemini');
const { getSystemPrompt } = require('../utils/aiPrompts');

// Create new chat session
exports.createSession = async (req, res, next) => {
  try {
    const { subject_name, mode } = req.body;

    // Get subject id if it exists
    const [subjects] = await pool.query(
      'SELECT id FROM subjects WHERE name = ?',
      [subject_name || 'General']
    );

    const subjectId = subjects.length > 0 ? subjects[0].id : null;

    const [result] = await pool.query(
      `INSERT INTO chat_sessions (user_id, subject_id, subject_name, mode, title) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, subjectId, subject_name || 'General', mode || 'normal',
      `${subject_name || 'General'} - New Chat`]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        subject_name: subject_name || 'General',
        mode: mode || 'normal',
        title: `${subject_name || 'General'} - New Chat`
      }
    });
  } catch (error) {
    next(error);
  }
};

// Send message and get AI response
exports.sendMessage = async (req, res, next) => {
  try {
    const { session_id, message, mode, subject } = req.body;

    let sessionId = session_id;

    // Create session if not provided
    if (!sessionId) {
      const [result] = await pool.query(
        `INSERT INTO chat_sessions (user_id, subject_name, mode, title) 
         VALUES (?, ?, ?, ?)`,
        [req.user.id, subject || 'General', mode || 'normal',
        message.substring(0, 100)]
      );
      sessionId = result.insertId;
    }

    // Save user message
    await pool.query(
      `INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)`,
      [sessionId, message]
    );

    // Get chat history for context (exclude the message we just saved)
    const [history] = await pool.query(
      `SELECT role, content FROM chat_messages 
       WHERE session_id = ? ORDER BY created_at ASC LIMIT 20`,
      [sessionId]
    );

    // Build Gemini chat history (all but the last user message)
    const systemPrompt = getSystemPrompt(mode || 'normal', subject);

    // Map history to Gemini format — 'assistant' → 'model', skip system messages
    const chatHistory = history
      .slice(0, -1) // exclude the current user message (already appended)
      .filter(h => h.role !== 'system')
      .map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));

    // Start a chat session with system instruction and history
    const chat = gemini.startChat({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7
      }
    });

    // Send the current user message
    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text();
    const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;

    // Save AI response
    await pool.query(
      `INSERT INTO chat_messages (session_id, role, content, tokens_used) 
       VALUES (?, 'assistant', ?, ?)`,
      [sessionId, aiResponse, tokensUsed]
    );

    // Update session title if it's the first message
    if (history.length <= 1) {
      const title = message.length > 80
        ? message.substring(0, 80) + '...'
        : message;
      await pool.query(
        'UPDATE chat_sessions SET title = ? WHERE id = ?',
        [title, sessionId]
      );
    }

    // Update study stats
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO study_stats (user_id, subject_name, questions_asked, session_date) 
       VALUES (?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE questions_asked = questions_asked + 1`,
      [req.user.id, subject || 'General', today]
    );

    res.json({
      success: true,
      data: {
        session_id: sessionId,
        message: aiResponse,
        tokens_used: tokensUsed
      }
    });
  } catch (error) {
    console.error('❌ Gemini API error:', error.message);

    // Gemini rate-limit / quota exceeded (429)
    const is429 = error.status === 429
      || error.message?.includes('[429')
      || error.message?.toLowerCase().includes('resource has been exhausted');

    if (is429) {
      return res.status(429).json({
        success: false,
        message: 'Gemini API rate limit reached. Wait a moment and try again.'
      });
    }
    if (error.status === 400 && error.message?.includes('API_KEY')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Gemini API key. Please check your configuration.'
      });
    }
    next(error);
  }
};

// Get session messages
exports.getSessionMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const [session] = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.user.id]
    );

    if (session.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    const [messages] = await pool.query(
      `SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC`,
      [sessionId]
    );

    res.json({
      success: true,
      data: { session: session[0], messages }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's chat sessions
exports.getSessions = async (req, res, next) => {
  try {
    const [sessions] = await pool.query(
      `SELECT cs.*, COUNT(cm.id) as message_count 
       FROM chat_sessions cs 
       LEFT JOIN chat_messages cm ON cs.id = cm.session_id 
       WHERE cs.user_id = ? 
       GROUP BY cs.id 
       ORDER BY cs.updated_at DESC 
       LIMIT 50`,
      [req.user.id]
    );

    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

// Delete session
exports.deleteSession = async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM chat_sessions WHERE id = ? AND user_id = ?',
      [req.params.sessionId, req.user.id]
    );
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
};

// Export chat as data (frontend will generate PDF)
exports.exportChat = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const [session] = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.user.id]
    );

    const [messages] = await pool.query(
      'SELECT role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );

    res.json({
      success: true,
      data: {
        title: session[0]?.title || 'Chat Export',
        subject: session[0]?.subject_name,
        mode: session[0]?.mode,
        messages,
        exported_at: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};
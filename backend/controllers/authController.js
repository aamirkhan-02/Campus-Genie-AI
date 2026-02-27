const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken, sanitizeUser } = require('../utils/helpers');

// Register
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check existing user
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // Create default preferences
    await pool.query(
      'INSERT INTO user_preferences (user_id) VALUES (?)',
      [result.insertId]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: { id: result.insertId, username, email, role: 'user' },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      `SELECT u.*, up.theme, up.preferred_mode, up.tts_enabled 
       FROM users u 
       LEFT JOIN user_preferences up ON u.id = up.user_id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: sanitizeUser(users[0])
    });
  } catch (error) {
    next(error);
  }
};

// Update preferences
exports.updatePreferences = async (req, res, next) => {
  try {
    const { theme, preferred_mode, tts_enabled } = req.body;

    await pool.query(
      `INSERT INTO user_preferences (user_id, theme, preferred_mode, tts_enabled) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE theme = ?, preferred_mode = ?, tts_enabled = ?`,
      [req.user.id, theme, preferred_mode, tts_enabled, theme, preferred_mode, tts_enabled]
    );

    res.json({ success: true, message: 'Preferences updated' });
  } catch (error) {
    next(error);
  }
};
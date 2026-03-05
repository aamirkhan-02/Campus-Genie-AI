const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { generateToken: generateJWT, sanitizeUser } = require('../utils/helpers');
const {
  generateOTP, generateToken, sendVerificationOTP,
  sendPasswordResetEmail, sendPasswordResetOTP, sendWelcomeEmail
} = require('../utils/emailService');
const { createNotification } = require('../utils/notificationHelper');

// ============================================
// REGISTER
// ============================================
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
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

    // Create user (email_verified = false)
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, email_verified) VALUES (?, ?, ?, FALSE)',
      [username, email, hashedPassword]
    );

    const userId = result.insertId;

    // Create default preferences
    await pool.query(
      'INSERT INTO user_preferences (user_id) VALUES (?)',
      [userId]
    ).catch(() => { });

    // Generate OTP and send verification email
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60000);

    await pool.query(
      `INSERT INTO otp_codes (user_id, email, otp_code, purpose, expires_at)
       VALUES (?, ?, ?, 'email_verify', ?)`,
      [userId, email, otp, expiresAt]
    );

    // Send OTP email
    try {
      await sendVerificationOTP(email, username, otp);
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
      // Still create account but warn about email
    }

    // Generate JWT token
    const token = generateJWT(userId);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email.',
      data: {
        user: {
          id: userId,
          username,
          email,
          role: 'user',
          email_verified: false
        },
        token,
        requiresVerification: true
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// VERIFY EMAIL OTP
// ============================================
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find valid OTP
    const [otpRecords] = await pool.query(
      `SELECT * FROM otp_codes 
       WHERE email = ? AND otp_code = ? AND purpose = 'email_verify' 
       AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.'
      });
    }

    const otpRecord = otpRecords[0];

    // Mark OTP as used
    await pool.query(
      'UPDATE otp_codes SET is_used = TRUE WHERE id = ?',
      [otpRecord.id]
    );

    // Mark email as verified
    await pool.query(
      'UPDATE users SET email_verified = TRUE, email_verified_at = NOW() WHERE id = ?',
      [otpRecord.user_id]
    );

    // Send welcome email
    const [user] = await pool.query(
      'SELECT username FROM users WHERE id = ?',
      [otpRecord.user_id]
    );

    if (user.length > 0) {
      sendWelcomeEmail(email, user[0].username).catch(() => { });
      // 🔔 Welcome notification
      createNotification(
        otpRecord.user_id,
        'welcome',
        '🎉 Welcome to Campus Genie AI!',
        `Your account is all set, ${user[0].username}! Start chatting with AI, practising MCQs, and tracking your study progress.`,
        '🎉'
      );
    }

    res.json({
      success: true,
      message: 'Email verified successfully! 🎉'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// RESEND VERIFICATION OTP
// ============================================
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const [users] = await pool.query(
      'SELECT id, username, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    const user = users[0];

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check rate limit (max 1 OTP per 60 seconds)
    const [recentOTP] = await pool.query(
      `SELECT id FROM otp_codes 
       WHERE user_id = ? AND purpose = 'email_verify' 
       AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)`,
      [user.id]
    );

    if (recentOTP.length > 0) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting a new OTP'
      });
    }

    // Invalidate old OTPs
    await pool.query(
      "UPDATE otp_codes SET is_used = TRUE WHERE user_id = ? AND purpose = 'email_verify' AND is_used = FALSE",
      [user.id]
    );

    // Generate new OTP
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60000);

    await pool.query(
      `INSERT INTO otp_codes (user_id, email, otp_code, purpose, expires_at)
       VALUES (?, ?, ?, 'email_verify', ?)`,
      [user.id, email, otp, expiresAt]
    );

    // Send email
    await sendVerificationOTP(email, user.username, otp);

    res.json({
      success: true,
      message: 'New OTP sent to your email'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGIN
// ============================================
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

    // Update login stats
    await pool.query(
      'UPDATE users SET last_login_at = NOW(), login_count = COALESCE(login_count, 0) + 1 WHERE id = ?',
      [user.id]
    );

    const token = generateJWT(user.id);

    res.json({
      success: true,
      message: user.email_verified ? 'Login successful' : 'Login successful. Please verify your email.',
      data: {
        user: {
          ...sanitizeUser(user),
          email_verified: !!user.email_verified
        },
        token,
        requiresVerification: !user.email_verified
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// FORGOT PASSWORD - SEND RESET EMAIL
// ============================================
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, method } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const [users] = await pool.query(
      'SELECT id, username, email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent reset instructions.'
      });
    }

    const user = users[0];

    // Rate limit: max 3 resets per hour
    const [recentResets] = await pool.query(
      `SELECT COUNT(*) as count FROM password_reset_tokens 
       WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [user.id]
    );

    if (recentResets[0].count >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many reset requests. Please try again in 1 hour.'
      });
    }

    if (method === 'otp') {
      // OTP method
      const otp = generateOTP();
      const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
      const expiresAt = new Date(Date.now() + expiryMinutes * 60000);

      await pool.query(
        `INSERT INTO otp_codes (user_id, email, otp_code, purpose, expires_at)
         VALUES (?, ?, ?, 'password_reset', ?)`,
        [user.id, email, otp, expiresAt]
      );

      await sendPasswordResetOTP(email, user.username, otp);

      // 🔔 Security notification
      createNotification(
        user.id,
        'security',
        '🔒 Password Reset Requested',
        'A password reset OTP was sent to your email. If this wasn\'t you, please contact support immediately.',
        '🔒'
      );

      return res.json({
        success: true,
        message: 'Password reset OTP sent to your email',
        data: { method: 'otp' }
      });
    } else {
      // Link method (default)
      const resetToken = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60000); // 1 hour

      // Invalidate old tokens
      await pool.query(
        'UPDATE password_reset_tokens SET is_used = TRUE WHERE user_id = ? AND is_used = FALSE',
        [user.id]
      );

      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, email, token, expires_at)
         VALUES (?, ?, ?, ?)`,
        [user.id, email, resetToken, expiresAt]
      );

      await sendPasswordResetEmail(email, user.username, resetToken);

      // 🔔 Security notification
      createNotification(
        user.id,
        'security',
        '🔒 Password Reset Requested',
        'A password reset link was sent to your email. If this wasn\'t you, please contact support immediately.',
        '🔒'
      );

      return res.json({
        success: true,
        message: 'Password reset link sent to your email',
        data: { method: 'link' }
      });
    }
  } catch (error) {
    next(error);
  }
};

// ============================================
// VERIFY RESET OTP
// ============================================
exports.verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const [otpRecords] = await pool.query(
      `SELECT * FROM otp_codes 
       WHERE email = ? AND otp_code = ? AND purpose = 'password_reset' 
       AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Generate a temporary reset token
    const tempToken = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 minutes

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, email, token, expires_at)
       VALUES (?, ?, ?, ?)`,
      [otpRecords[0].user_id, email, tempToken, expiresAt]
    );

    // Mark OTP as used
    await pool.query(
      'UPDATE otp_codes SET is_used = TRUE WHERE id = ?',
      [otpRecords[0].id]
    );

    res.json({
      success: true,
      message: 'OTP verified. You can now reset your password.',
      data: { resetToken: tempToken }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// RESET PASSWORD (with token)
// ============================================
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Find valid token
    const [tokens] = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = ? AND is_used = FALSE AND expires_at > NOW()
       LIMIT 1`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new one.'
      });
    }

    const resetRecord = tokens[0];

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, resetRecord.user_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET is_used = TRUE WHERE id = ?',
      [resetRecord.id]
    );

    // Invalidate all other reset tokens for this user
    await pool.query(
      'UPDATE password_reset_tokens SET is_used = TRUE WHERE user_id = ? AND is_used = FALSE',
      [resetRecord.user_id]
    );

    // 🔔 Security notification
    createNotification(
      resetRecord.user_id,
      'security',
      '🔑 Password Reset Successful',
      'Your password was reset successfully. If you did not do this, contact support immediately.',
      '🔑'
    );

    res.json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CHANGE PASSWORD (logged in user)
// ============================================
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user
    const [users] = await pool.query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    // 🔔 Security notification
    createNotification(
      req.user.id,
      'security',
      '🔑 Password Changed',
      'Your account password was changed successfully. If this wasn\'t you, contact support immediately.',
      '🔑'
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET CURRENT USER
// ============================================
exports.getMe = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      `SELECT u.*, up.theme, up.preferred_mode, up.tts_enabled 
       FROM users u 
       LEFT JOIN user_preferences up ON u.id = up.user_id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    const userData = sanitizeUser(users[0]);
    userData.email_verified = !!users[0].email_verified;

    res.json({ success: true, data: userData });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE PREFERENCES
// ============================================
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

// ============================================
// UPLOAD AVATAR
// ============================================
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Only JPG, PNG, and WebP are allowed (max 2 MB).'
      });
    }

    // Delete old avatar file if it exists
    const [users] = await pool.query('SELECT avatar FROM users WHERE id = ?', [req.user.id]);
    if (users[0]?.avatar) {
      const oldPath = path.join(__dirname, '..', users[0].avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);

    // 🔔 Profile notification
    createNotification(
      req.user.id,
      'profile',
      '🖼️ Profile Picture Updated',
      'Your profile picture has been updated successfully.',
      '🖼️'
    );

    res.json({
      success: true,
      message: 'Avatar updated',
      data: { avatar: avatarUrl }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REMOVE AVATAR
// ============================================
exports.removeAvatar = async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT avatar FROM users WHERE id = ?', [req.user.id]);

    if (users[0]?.avatar) {
      const filePath = path.join(__dirname, '..', users[0].avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query('UPDATE users SET avatar = NULL WHERE id = ?', [req.user.id]);

    res.json({ success: true, message: 'Avatar removed' });
  } catch (error) {
    next(error);
  }
};
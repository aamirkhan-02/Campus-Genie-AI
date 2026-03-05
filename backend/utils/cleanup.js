const pool = require('../config/db');

const cleanupExpiredData = async () => {
  try {
    // Delete expired OTPs
    const [otpResult] = await pool.query(
      'DELETE FROM otp_codes WHERE expires_at < NOW() OR is_used = TRUE'
    );

    // Delete expired reset tokens
    const [tokenResult] = await pool.query(
      'DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR is_used = TRUE'
    );

    console.log(`🧹 Cleanup: Removed ${otpResult.affectedRows} OTPs, ${tokenResult.affectedRows} tokens`);
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
};

module.exports = { cleanupExpiredData };
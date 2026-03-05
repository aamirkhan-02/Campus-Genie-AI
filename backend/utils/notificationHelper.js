const pool = require('../config/db');

/**
 * Creates a notification for a user.
 * Silently fails so it never breaks the main request flow.
 */
const createNotification = async (userId, type, title, message, icon = '🔔') => {
    try {
        await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, icon)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, type, title, message, icon]
        );
    } catch (err) {
        // Non-critical — log but never throw
        console.warn('⚠️  Notification insert failed:', err.message);
    }
};

module.exports = { createNotification };

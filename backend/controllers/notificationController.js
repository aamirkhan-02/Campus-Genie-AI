const pool = require('../config/db');

// GET /api/notifications
exports.getNotifications = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, type, title, message, icon, is_read, created_at
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 30`,
            [req.user.id]
        );
        res.json({ success: true, data: rows });
    } catch (error) { next(error); }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );
        res.json({ success: true, data: { count: rows[0].count } });
    } catch (error) { next(error); }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) { next(error); }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );
        res.json({ success: true });
    } catch (error) { next(error); }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
    try {
        await pool.query(
            `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) { next(error); }
};

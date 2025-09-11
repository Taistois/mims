"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * ===========================================
 * CREATE A NOTIFICATION
 * ===========================================
 * Roles: Admin and Insurance Staff only
 */
router.post("/", authMiddleware_1.verifyToken, (0, authMiddleware_1.authorizeRoles)("admin", "insurance_staff"), async (req, res) => {
    const { user_id, title, message } = req.body;
    try {
        const result = await db_1.default.query(`INSERT INTO notifications (user_id, title, message)
         VALUES ($1, $2, $3) RETURNING *`, [user_id, title, message]);
        res.json({
            message: "Notification created ✅",
            notification: result.rows[0],
        });
    }
    catch (err) {
        console.error("Notification Create Error:", err);
        res.status(500).json({ error: "Failed to create notification ❌" });
    }
});
/**
 * ===========================================
 * FETCH ALL NOTIFICATIONS FOR LOGGED-IN USER
 * ===========================================
 */
router.get("/", authMiddleware_1.verifyToken, async (req, res) => {
    const user = req.user;
    try {
        const result = await db_1.default.query(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`, [user.user_id]);
        res.json({
            message: "Notifications fetched ✅",
            notifications: result.rows,
        });
    }
    catch (err) {
        console.error("Fetch Notifications Error:", err);
        res.status(500).json({ error: "Failed to fetch notifications ❌" });
    }
});
/**
 * ===========================================
 * MARK NOTIFICATION AS READ
 * ===========================================
 * Users can only mark their own notifications
 */
router.put("/:id/read", authMiddleware_1.verifyToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        const result = await db_1.default.query(`UPDATE notifications 
       SET is_read = TRUE 
       WHERE notification_id = $1 AND user_id = $2 
       RETURNING *`, [id, user.user_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Notification not found ❌" });
        }
        res.json({
            message: "Notification marked as read ✅",
            notification: result.rows[0],
        });
    }
    catch (err) {
        console.error("Mark Read Error:", err);
        res.status(500).json({ error: "Failed to mark notification as read ❌" });
    }
});
/**
 * ===========================================
 * DELETE NOTIFICATION
 * ===========================================
 * Users can only delete their own notifications
 */
router.delete("/:id", authMiddleware_1.verifyToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        const result = await db_1.default.query(`DELETE FROM notifications 
       WHERE notification_id = $1 AND user_id = $2 
       RETURNING *`, [id, user.user_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Notification not found ❌" });
        }
        res.json({ message: "Notification deleted ✅" });
    }
    catch (err) {
        console.error("Delete Notification Error:", err);
        res.status(500).json({ error: "Failed to delete notification ❌" });
    }
});
exports.default = router;

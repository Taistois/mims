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
 * CREATE A POLICY
 * ===========================================
 * Roles allowed: admin, insurance_staff
 */
router.post("/", authMiddleware_1.verifyToken, (0, authMiddleware_1.authorizeRoles)("admin", "insurance_staff"), async (req, res) => {
    const { member_id, policy_type, premium_amount, coverage_amount, start_date, end_date } = req.body;
    try {
        const result = await db_1.default.query(`INSERT INTO policies (member_id, policy_type, premium_amount, coverage_amount, start_date, end_date) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`, [member_id, policy_type, premium_amount, coverage_amount, start_date, end_date]);
        res.json({ message: "Policy created ✅", policy: result.rows[0] });
    }
    catch (err) {
        console.error("Policy Create Error:", err);
        res.status(500).json({ error: "Failed to create policy ❌" });
    }
});
/**
 * ===========================================
 * GET ALL POLICIES
 * ===========================================
 * - Admin and staff can view ALL policies
 * - Members only see their own
 */
router.get("/", authMiddleware_1.verifyToken, async (req, res) => {
    const user = req.user;
    try {
        let query = `SELECT p.*, u.name, u.email, u.phone
                 FROM policies p
                 JOIN members m ON p.member_id = m.member_id
                 JOIN users u ON m.user_id = u.user_id`;
        let params = [];
        if (user.role === "member") {
            query += ` WHERE m.user_id = $1`;
            params = [user.user_id];
        }
        query += ` ORDER BY u.created_at DESC`;
        const result = await db_1.default.query(query, params);
        res.json(result.rows);
    }
    catch (err) {
        console.error("Policy Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch policies ❌" });
    }
});
/**
 * ===========================================
 * GET SINGLE POLICY
 * ===========================================
 * - Members can only view their own policy
 */
router.get("/:id", authMiddleware_1.verifyToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
        let query = `SELECT p.*, u.name, u.email, u.phone
                 FROM policies p
                 JOIN members m ON p.member_id = m.member_id
                 JOIN users u ON m.user_id = u.user_id
                 WHERE p.policy_id = $1`;
        let params = [id];
        if (user.role === "member") {
            query += ` AND m.user_id = $2`;
            params.push(user.user_id);
        }
        const result = await db_1.default.query(query, params);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Policy not found ❌" });
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error("Policy Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch policy ❌" });
    }
});
/**
 * ===========================================
 * UPDATE POLICY
 * ===========================================
 * Roles allowed: admin, insurance_staff
 */
router.put("/:id", authMiddleware_1.verifyToken, (0, authMiddleware_1.authorizeRoles)("admin", "insurance_staff"), async (req, res) => {
    const { id } = req.params;
    const { policy_type, premium_amount, coverage_amount, start_date, end_date, status } = req.body;
    try {
        const result = await db_1.default.query(`UPDATE policies 
         SET policy_type=$1, premium_amount=$2, coverage_amount=$3, start_date=$4, end_date=$5, status=$6
         WHERE policy_id=$7 
         RETURNING *`, [policy_type, premium_amount, coverage_amount, start_date, end_date, status, id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Policy not found ❌" });
        res.json({ message: "Policy updated ✅", policy: result.rows[0] });
    }
    catch (err) {
        console.error("Policy Update Error:", err);
        res.status(500).json({ error: "Failed to update policy ❌" });
    }
});
/**
 * ===========================================
 * DELETE (CANCEL) POLICY
 * ===========================================
 * Admin only
 */
router.delete("/:id", authMiddleware_1.verifyToken, (0, authMiddleware_1.authorizeRoles)("admin"), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query("DELETE FROM policies WHERE policy_id = $1 RETURNING *", [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Policy not found ❌" });
        res.json({ message: "Policy cancelled ✅", policy: result.rows[0] });
    }
    catch (err) {
        console.error("Policy Delete Error:", err);
        res.status(500).json({ error: "Failed to cancel policy ❌" });
    }
});
exports.default = router;

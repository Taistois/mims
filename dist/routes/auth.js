"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * ================================
 * REGISTER USER (Admin Only)
 * ================================
 * Only admins can register new users
 */
router.post("/register", authMiddleware_1.verifyToken, (0, authMiddleware_1.authorizeRoles)("admin"), async (req, res) => {
    const { name, email, phone, password, role } = req.body;
    try {
        // validate role
        const allowedRoles = ["admin", "member", "insurance_staff"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                error: "Invalid role. Must be admin, member, or insurance_staff."
            });
        }
        // hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // insert into DB
        const result = await db_1.default.query(`INSERT INTO users (name, email, phone, role, password_hash) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, name, email, phone, role, created_at`, [name, email, phone, role, hashedPassword]);
        res.json({ message: "User registered ✅", user: result.rows[0] });
    }
    catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: "User registration failed ❌" });
    }
});
/**
 * ================================
 * LOGIN
 * ================================
 * Login to get JWT token
 */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db_1.default.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid email or password ❌" });
        }
        const user = result.rows[0];
        // verify password
        const validPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: "Invalid email or password ❌" });
        }
        // generate token
        const token = jsonwebtoken_1.default.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET || "supersecretkey", { expiresIn: "1h" });
        res.json({
            message: "Login successful ✅",
            token,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Login failed ❌" });
    }
});
/**
 * ================================
 * GET ALL USERS (Admin Only)
 * ================================
 */
router.get("/users", authMiddleware_1.verifyToken, (0, authMiddleware_1.authorizeRoles)("admin"), async (req, res) => {
    try {
        const result = await db_1.default.query("SELECT user_id, name, email, phone, role, created_at FROM users");
        res.json(result.rows);
    }
    catch (err) {
        console.error("Fetch Users Error:", err);
        res.status(500).json({ error: "Failed to fetch users ❌" });
    }
});
/**
 * ================================
 * DELETE USER (Admin Only)
 * ================================
 */
router.delete("/users/:id", authMiddleware_1.verifyToken, (0, authMiddleware_1.authorizeRoles)("admin"), async (req, res) => {
    try {
        const result = await db_1.default.query("DELETE FROM users WHERE user_id = $1 RETURNING *", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found ❌" });
        }
        res.json({ message: "User deleted ✅" });
    }
    catch (err) {
        console.error("Delete User Error:", err);
        res.status(500).json({ error: "Failed to delete user ❌" });
    }
});
exports.default = router;

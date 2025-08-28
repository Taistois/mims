import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = Router();

/**
 * REGISTER
 */
router.post("/register", async (req, res) => {
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
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert into DB
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, role, password_hash) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, name, email, phone, role, created_at`,
      [name, email, phone, role, hashedPassword]
    );

    res.json({ message: "User registered ✅", user: result.rows[0] });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "User registration failed ❌" });
  }
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // check if user exists
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password ❌" });
    }

    const user = result.rows[0];

    // compare password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid email or password ❌" });
    }

    // generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful ✅",
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed ❌" });
  }
});

export default router;

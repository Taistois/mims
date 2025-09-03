import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * ===========================================
 * RECORD A PAYMENT
 * ===========================================
 * Roles Allowed: admin, insurance_staff
 */
router.post("/", verifyToken, authorizeRoles("admin", "insurance_staff"), async (req, res) => {
  const { claim_id, amount, payment_method } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO payments (claim_id, amount, payment_method) 
       VALUES ($1, $2, $3) RETURNING *`,
      [claim_id, amount, payment_method]
    );

    res.json({ message: "Payment recorded ✅", payment: result.rows[0] });
  } catch (err) {
    console.error("Payment Create Error:", err);
    res.status(500).json({ error: "Failed to record payment ❌" });
  }
});

/**
 * ===========================================
 * GET ALL PAYMENTS
 * ===========================================
 * - Admin and staff see all payments
 * - Members only see their own claim payments
 */
router.get("/", verifyToken, async (req, res) => {
  const user = (req as any).user;

  try {
    let query = `SELECT p.*, c.policy_id, c.member_id 
                 FROM payments p 
                 JOIN claims c ON p.claim_id = c.claim_id`;
    let params: any[] = [];

    if (user.role === "member") {
      query += ` WHERE c.member_id = (
                  SELECT member_id FROM members WHERE user_id = $1
                )`;
      params = [user.user_id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Payments Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch payments ❌" });
  }
});

/**
 * ===========================================
 * GET SINGLE PAYMENT
 * ===========================================
 */
router.get("/:id", verifyToken, async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  try {
    let query = `SELECT p.*, c.policy_id, c.member_id
                 FROM payments p 
                 JOIN claims c ON p.claim_id = c.claim_id
                 WHERE p.payment_id = $1`;
    let params: any[] = [id];

    if (user.role === "member") {
      query += ` AND c.member_id = (
                  SELECT member_id FROM members WHERE user_id = $2
                )`;
      params.push(user.user_id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment not found ❌" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch Payment Error:", err);
    res.status(500).json({ error: "Failed to fetch payment ❌" });
  }
});

/**
 * ===========================================
 * DELETE PAYMENT
 * ===========================================
 * Admin only
 */
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM payments WHERE payment_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment not found ❌" });
    }

    res.json({ message: "Payment deleted ✅" });
  } catch (err) {
    console.error("Delete Payment Error:", err);
    res.status(500).json({ error: "Failed to delete payment ❌" });
  }
});

export default router;

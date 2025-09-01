import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

// ✅ Record a payment for a claim
router.post("/", verifyToken, async (req, res) => {
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

// ✅ Get all payments
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM payments`);
    res.json(result.rows);
  } catch (err) {
    console.error("Payments Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch payments ❌" });
  }
});

export default router;

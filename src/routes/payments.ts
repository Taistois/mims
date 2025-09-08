import { Router } from "express";
import pool from "../config/db";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

/**
 * ===========================================
 * RECORD A PAYMENT + NOTIFY MEMBER
 * ===========================================
 * Roles Allowed: admin, insurance_staff
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "insurance_staff"),
  async (req, res) => {
    const { claim_id, amount, payment_method } = req.body;

    try {
      // 1️⃣ Ensure claim exists and is linked to a member
      const claimResult = await pool.query(
        `SELECT c.claim_id, c.member_id, u.user_id, u.name
         FROM claims c
         LEFT JOIN members m ON c.member_id = m.member_id
         LEFT JOIN users u ON m.user_id = u.user_id
         WHERE c.claim_id = $1`,
        [claim_id]
      );

      if (claimResult.rows.length === 0) {
        return res.status(404).json({ error: "Claim not found ❌" });
      }

      const claimData = claimResult.rows[0];

      // Check if the claim is linked to a valid member and user
      if (!claimData.member_id || !claimData.user_id) {
        return res
          .status(400)
          .json({ error: "Claim is not linked to a valid member ❌" });
      }

      // 2️⃣ Insert payment
      const paymentResult = await pool.query(
        `INSERT INTO payments (claim_id, amount, payment_method) 
         VALUES ($1, $2, $3) RETURNING *`,
        [claim_id, amount, payment_method]
      );

      const payment = paymentResult.rows[0];

      // 3️⃣ Create notification for the member
      await pool.query(
        `INSERT INTO notifications (user_id, title, message) 
         VALUES ($1, $2, $3)`,
        [
          claimData.user_id,
          "Claim Payment Processed",
          `Hello ${claimData.name}, a payment of ${amount} for your claim (ID: ${claim_id}) has been successfully recorded using ${payment_method}.`
        ]
      );

      res.json({ message: "Payment recorded ✅", payment });
    } catch (err) {
      console.error("Payment Create Error:", err);
      res.status(500).json({ error: "Failed to record payment ❌" });
    }
  }
);

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
    let query = `
      SELECT p.*, c.policy_id, c.member_id, u.name AS member_name
      FROM payments p
      JOIN claims c ON p.claim_id = c.claim_id
      LEFT JOIN members m ON c.member_id = m.member_id
      LEFT JOIN users u ON m.user_id = u.user_id
    `;
    let params: any[] = [];

    if (user.role === "member") {
      query += ` WHERE m.user_id = $1`;
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
    let query = `
      SELECT p.*, c.policy_id, c.member_id, u.name AS member_name
      FROM payments p
      JOIN claims c ON p.claim_id = c.claim_id
      LEFT JOIN members m ON c.member_id = m.member_id
      LEFT JOIN users u ON m.user_id = u.user_id
      WHERE p.payment_id = $1
    `;
    let params: any[] = [id];

    if (user.role === "member") {
      query += ` AND m.user_id = $2`;
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
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
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
  }
);

export default router;

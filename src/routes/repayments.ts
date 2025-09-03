import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * ===========================================
 * RECORD A REPAYMENT
 * ===========================================
 * Roles allowed: admin, insurance_staff
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "insurance_staff"),
  async (req, res) => {
    const { loan_id, amount, method } = req.body;

    try {
      // Check if loan exists
      const loanResult = await pool.query(
        "SELECT * FROM loans WHERE loan_id = $1",
        [loan_id]
      );
      if (loanResult.rows.length === 0) {
        return res.status(404).json({ error: "Loan not found ❌" });
      }

      // Insert repayment as a payment record
      const paymentResult = await pool.query(
        `INSERT INTO payments (loan_id, amount, method, status) 
         VALUES ($1, $2, $3, 'success') RETURNING *`,
        [loan_id, amount, method]
      );

      // Check total repaid vs loan amount
      const totalPaidResult = await pool.query(
        "SELECT SUM(amount) AS total_paid FROM payments WHERE loan_id = $1",
        [loan_id]
      );

      const totalPaid = totalPaidResult.rows[0].total_paid || 0;
      const loanAmount = loanResult.rows[0].amount;

      // If fully repaid, update loan status
      if (parseFloat(totalPaid) >= parseFloat(loanAmount)) {
        await pool.query(
          "UPDATE loans SET status = 'repaid' WHERE loan_id = $1",
          [loan_id]
        );
      }

      res.json({
        message: "Repayment recorded ✅",
        repayment: paymentResult.rows[0],
        totalPaid,
      });
    } catch (err) {
      console.error("Repayment Error:", err);
      res.status(500).json({ error: "Failed to record repayment ❌" });
    }
  }
);

/**
 * ===========================================
 * GET ALL REPAYMENTS FOR A LOAN
 * ===========================================
 * - Admin and staff → see all repayments
 * - Members → only see repayments for their own loan
 */
router.get("/:loan_id", verifyToken, async (req, res) => {
  const { loan_id } = req.params;
  const user = (req as any).user;

  try {
    let query = `
      SELECT p.*, l.member_id, u.name, u.email, u.phone
      FROM payments p
      JOIN loans l ON p.loan_id = l.loan_id
      JOIN members m ON l.member_id = m.member_id
      JOIN users u ON m.user_id = u.user_id
      WHERE p.loan_id = $1
    `;
    let params: any[] = [loan_id];

    // If user is a member, restrict to their loans
    if (user.role === "member") {
      query += " AND m.user_id = $2";
      params.push(user.user_id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No repayments found ❌" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Repayments Error:", err);
    res.status(500).json({ error: "Failed to fetch repayments ❌" });
  }
});

export default router;

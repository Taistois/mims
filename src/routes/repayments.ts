import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

// ✅ Record a repayment
router.post("/", verifyToken, async (req, res) => {
  const { loan_id, amount, method } = req.body;

  try {
    // check if loan exists
    const loanResult = await pool.query(
      "SELECT * FROM loans WHERE loan_id = $1",
      [loan_id]
    );
    if (loanResult.rows.length === 0) {
      return res.status(404).json({ error: "Loan not found ❌" });
    }

    // insert repayment as a payment record
    const paymentResult = await pool.query(
      `INSERT INTO payments (loan_id, amount, method, status) 
       VALUES ($1, $2, $3, 'success') RETURNING *`,
      [loan_id, amount, method]
    );

    // check total repaid vs loan amount
    const totalPaidResult = await pool.query(
      "SELECT SUM(amount) AS total_paid FROM payments WHERE loan_id = $1",
      [loan_id]
    );
    const totalPaid = totalPaidResult.rows[0].total_paid || 0;
    const loanAmount = loanResult.rows[0].amount;

    // if fully repaid, update loan status
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
});

// ✅ Get all repayments for a loan
router.get("/:loan_id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM payments WHERE loan_id = $1",
      [req.params.loan_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch repayments ❌" });
  }
});

export default router;

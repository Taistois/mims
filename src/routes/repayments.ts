import { Router } from "express";
import pool from "../config/db";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

/**
 * ===========================================
 * RECORD A REPAYMENT + NOTIFICATION
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
      // 1️⃣ Check if loan exists
      const loanResult = await pool.query(
        `SELECT l.*, m.user_id, u.name, u.email
         FROM loans l
         JOIN members m ON l.member_id = m.member_id
         JOIN users u ON m.user_id = u.user_id
         WHERE l.loan_id = $1`,
        [loan_id]
      );

      if (loanResult.rows.length === 0) {
        return res.status(404).json({ error: "Loan not found ❌" });
      }

      const loanData = loanResult.rows[0];

      // 2️⃣ Insert repayment into payments table
      const paymentResult = await pool.query(
        `INSERT INTO payments (loan_id, amount, method, status) 
         VALUES ($1, $2, $3, 'success') RETURNING *`,
        [loan_id, amount, method]
      );

      // 3️⃣ Calculate total repaid
      const totalPaidResult = await pool.query(
        "SELECT SUM(amount) AS total_paid FROM payments WHERE loan_id = $1",
        [loan_id]
      );

      const totalPaid = totalPaidResult.rows[0].total_paid || 0;
      const loanAmount = loanData.amount;

      // 4️⃣ If fully repaid, update loan status
      let updatedLoanStatus = loanData.status;
      if (parseFloat(totalPaid) >= parseFloat(loanAmount)) {
        updatedLoanStatus = "repaid";
        await pool.query(
          "UPDATE loans SET status = 'repaid' WHERE loan_id = $1",
          [loan_id]
        );
      }

      // 5️⃣ Create notification for the member
      await pool.query(
        `INSERT INTO notifications (user_id, title, message) 
         VALUES ($1, $2, $3)`,
        [
          loanData.user_id,
          "Loan Repayment Update",
          `Dear ${loanData.name}, a repayment of ${amount} has been recorded for your loan (ID: ${loan_id}). 
           Total paid so far: ${totalPaid}. ${updatedLoanStatus === "repaid" ? "Your loan is now fully repaid! 🎉" : ""}`
        ]
      );

      res.json({
        message: "Repayment recorded ✅",
        repayment: paymentResult.rows[0],
        totalPaid,
        loanStatus: updatedLoanStatus
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
 * - Members → only see repayments for their own loans
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

    // Restrict members to their own loans
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

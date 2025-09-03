import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * ================================
 * CREATE LOAN
 * ================================
 * Only admin and insurance staff can issue loans
 */
router.post("/", verifyToken, authorizeRoles("admin", "insurance_staff"), async (req, res) => {
  const { member_id, amount, interest_rate, duration } = req.body;

  try {
    // Calculate due_date based on duration (in months)
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + duration);

    const result = await pool.query(
      `INSERT INTO loans (member_id, amount, interest_rate, duration, status, due_date) 
       VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
      [member_id, amount, interest_rate, duration, dueDate]
    );

    res.json({ message: "Loan issued ✅", loan: result.rows[0] });
  } catch (err) {
    console.error("Loan Create Error:", err);
    res.status(500).json({ error: "Failed to issue loan ❌" });
  }
});

/**
 * ================================
 * GET ALL LOANS
 * ================================
 * - Admin and staff can see all loans
 * - Members can only see their own
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = (req as any).user;

    let query = "SELECT * FROM loans";
    let params: any[] = [];

    if (user.role === "member") {
      // Filter to only member's loans
      query = `
        SELECT l.* FROM loans l
        JOIN members m ON l.member_id = m.member_id
        WHERE m.user_id = $1
      `;
      params = [user.user_id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Loans Error:", err);
    res.status(500).json({ error: "Failed to fetch loans ❌" });
  }
});

/**
 * ================================
 * GET SINGLE LOAN
 * ================================
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM loans WHERE loan_id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Loan not found ❌" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch Loan Error:", err);
    res.status(500).json({ error: "Failed to fetch loan ❌" });
  }
});

/**
 * ================================
 * UPDATE LOAN STATUS
 * ================================
 * Only admin and insurance staff can approve, mark repaid, or default loans
 */
router.put("/:id/status", verifyToken, authorizeRoles("admin", "insurance_staff"), async (req, res) => {
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE loans SET status = $1 WHERE loan_id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Loan not found ❌" });

    res.json({ message: "Loan updated ✅", loan: result.rows[0] });
  } catch (err) {
    console.error("Update Loan Error:", err);
    res.status(500).json({ error: "Failed to update loan ❌" });
  }
});

/**
 * ================================
 * DELETE LOAN
 * ================================
 * Only admin can delete a loan
 */
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM loans WHERE loan_id = $1 RETURNING *", [
      req.params.id,
    ]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Loan not found ❌" });

    res.json({ message: "Loan deleted ✅" });
  } catch (err) {
    console.error("Delete Loan Error:", err);
    res.status(500).json({ error: "Failed to delete loan ❌" });
  }
});

export default router;

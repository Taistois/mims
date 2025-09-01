import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

// ✅ Create loan (admin/staff only)
router.post("/", verifyToken, async (req, res) => {
  const { member_id, amount, interest_rate, duration } = req.body;

  try {
    // calculate due_date based on duration (in months)
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

// ✅ Get all loans
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM loans");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch loans ❌" });
  }
});

// ✅ Get loan by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM loans WHERE loan_id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Loan not found ❌" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch loan ❌" });
  }
});

// ✅ Update loan status (approve / repaid / defaulted)
router.put("/:id/status", verifyToken, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE loans SET status = $1 WHERE loan_id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Loan not found ❌" });
    res.json({ message: "Loan updated ✅", loan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update loan ❌" });
  }
});

// ✅ Delete loan (admin only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM loans WHERE loan_id = $1 RETURNING *", [
      req.params.id,
    ]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Loan not found ❌" });
    res.json({ message: "Loan deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete loan ❌" });
  }
});

export default router;

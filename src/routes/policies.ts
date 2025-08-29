import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

// Create new policy
router.post("/", verifyToken, async (req, res) => {
  const { member_id, policy_type, premium_amount, coverage_amount, start_date, end_date } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO policies (member_id, policy_type, premium_amount, coverage_amount, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [member_id, policy_type, premium_amount, coverage_amount, start_date, end_date]
    );

    res.json({ message: "Policy created ✅", policy: result.rows[0] });
  } catch (err) {
    console.error("Policy Create Error:", err);
    res.status(500).json({ error: "Failed to create policy ❌" });
  }
});

// Get all policies
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM policies ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Policy Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch policies ❌" });
  }
});

// Get single policy
router.get("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM policies WHERE policy_id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Policy not found ❌" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Policy Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch policy ❌" });
  }
});

// Update policy
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { policy_type, premium_amount, coverage_amount, start_date, end_date, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE policies 
       SET policy_type=$1, premium_amount=$2, coverage_amount=$3, start_date=$4, end_date=$5, status=$6
       WHERE policy_id=$7 
       RETURNING *`,
      [policy_type, premium_amount, coverage_amount, start_date, end_date, status, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Policy not found ❌" });

    res.json({ message: "Policy updated ✅", policy: result.rows[0] });
  } catch (err) {
    console.error("Policy Update Error:", err);
    res.status(500).json({ error: "Failed to update policy ❌" });
  }
});

// Delete policy (Cancel)
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM policies WHERE policy_id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: "Policy not found ❌" });

    res.json({ message: "Policy cancelled ✅", policy: result.rows[0] });
  } catch (err) {
    console.error("Policy Delete Error:", err);
    res.status(500).json({ error: "Failed to cancel policy ❌" });
  }
});

export default router;

import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

// Update claim status (admin/staff only)
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // ✅ use "status" not "claim_status"

  try {
    const result = await pool.query(
      `UPDATE claims SET status = $1 WHERE claim_id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Claim not found ❌" });
    }

    res.json({ message: "Claim updated ✅", claim: result.rows[0] });
  } catch (err) {
    console.error("Update Claim Error:", err);
    res.status(500).json({ error: "Failed to update claim ❌" });
  }
});

export default router;

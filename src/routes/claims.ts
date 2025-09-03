import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * ================================
 * UPDATE CLAIM STATUS
 * ================================
 * Only admin and insurance staff can update claim statuses
 */
router.put("/:id", verifyToken, authorizeRoles("admin", "insurance_staff"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // ✅ must send { "status": "approved" } or similar

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

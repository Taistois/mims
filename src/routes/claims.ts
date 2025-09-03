import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * ================================
 * UPDATE CLAIM STATUS + NOTIFY MEMBER
 * ================================
 * Only admin and insurance staff can update claim statuses
 */
router.put("/:id", verifyToken, authorizeRoles("admin", "insurance_staff"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // ✅ must send { "status": "approved" } or similar

  try {
    // 1️⃣ Update claim
    const result = await pool.query(
      `UPDATE claims SET status = $1 WHERE claim_id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Claim not found ❌" });
    }

    const updatedClaim = result.rows[0];

    // 2️⃣ Find the user who owns this claim
    const claimOwner = await pool.query(
      `SELECT u.user_id, u.name, u.email 
       FROM claims c
       JOIN policies p ON c.policy_id = p.policy_id
       JOIN members m ON p.member_id = m.member_id
       JOIN users u ON m.user_id = u.user_id
       WHERE c.claim_id = $1`,
      [id]
    );

    if (claimOwner.rows.length > 0) {
      const user = claimOwner.rows[0];

      // 3️⃣ Create a notification for the claim owner
      await pool.query(
        `INSERT INTO notifications (user_id, title, message) 
         VALUES ($1, $2, $3)`,
        [
          user.user_id,
          `Claim Status Updated`,
          `Hello ${user.name}, your claim #${id} status has been updated to '${status}'.`
        ]
      );
    }

    // 4️⃣ Return success response
    res.json({ 
      message: "Claim updated ✅", 
      claim: updatedClaim 
    });

  } catch (err) {
    console.error("Update Claim Error:", err);
    res.status(500).json({ error: "Failed to update claim ❌" });
  }
});

export default router;

import { Router } from "express";
import pool from "../config/db";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

/**
 * ================================
 * CREATE CLAIM + NOTIFY ADMIN
 * ================================
 * - Members can create their own claims
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("member", "admin", "insurance_staff"),
  async (req, res) => {
    const { policy_id, description, claim_amount, claim_type } = req.body;
    const user = (req as any).user;

    try {
      // 1️⃣ Insert new claim
      const result = await pool.query(
        `INSERT INTO claims (policy_id, member_id, claim_type, description, claim_amount, status) 
         VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
        [policy_id, user.user_id, claim_type || "general", description, claim_amount]
      );

      const newClaim = result.rows[0];

      // 2️⃣ Notify admins and insurance staff
      const adminUsers = await pool.query(
        `SELECT user_id FROM users WHERE role IN ('admin', 'insurance_staff')`
      );

      for (const admin of adminUsers.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message) 
           VALUES ($1, $2, $3)`,
          [
            admin.user_id,
            "New Claim Submitted",
            `A new claim (ID: ${newClaim.claim_id}) was submitted by ${user.name || user.email}.`,
          ]
        );
      }

      res.status(201).json({
        message: "Claim submitted successfully ✅",
        claim: newClaim,
      });
    } catch (err) {
      console.error("Create Claim Error:", err);
      res.status(500).json({ error: "Failed to submit claim ❌" });
    }
  }
);

/**
 * ================================
 * GET ALL CLAIMS
 * ================================
 * - Admins and staff see ALL claims
 * - Members see ONLY their claims
 */
router.get("/", verifyToken, async (req, res) => {
  const user = (req as any).user;
  console.log("Authenticated User:", user); // DEBUG

  try {
    let query = `
      SELECT c.claim_id, c.policy_id, c.claim_type, c.claim_amount, c.status, c.submitted_at,
             c.description, u.name AS member_name, u.email
      FROM claims c
      JOIN members m ON c.member_id = m.member_id
      JOIN users u ON m.user_id = u.user_id
    `;
    const params: any[] = [];

    // ✅ Only filter for members
    if (user.role === "member") {
      query += ` WHERE m.user_id = $1`;
      params.push(user.user_id);
    }

    query += ` ORDER BY c.submitted_at DESC`;

    const result = await pool.query(query, params);

    console.log("Fetched Claims:", result.rows); // DEBUG
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Claims Error:", err);
    res.status(500).json({ error: "Failed to fetch claims ❌" });
  }
});

/**
 * ================================
 * UPDATE CLAIM STATUS
 * ================================
 * - Admin and insurance staff only
 */
router.put("/:id", verifyToken, authorizeRoles("admin", "insurance_staff"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // e.g., { "status": "approved" }

  try {
    const result = await pool.query(
      `UPDATE claims SET status = $1 WHERE claim_id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Claim not found ❌" });
    }

    const updatedClaim = result.rows[0];

    // Notify the claim owner
    const claimOwner = await pool.query(
      `SELECT u.user_id, u.name, u.email 
       FROM claims c
       JOIN members m ON c.member_id = m.member_id
       JOIN users u ON m.user_id = u.user_id
       WHERE c.claim_id = $1`,
      [id]
    );

    if (claimOwner.rows.length > 0) {
      const owner = claimOwner.rows[0];

      await pool.query(
        `INSERT INTO notifications (user_id, title, message) 
         VALUES ($1, $2, $3)`,
        [
          owner.user_id,
          "Claim Status Updated",
          `Hello ${owner.name}, your claim #${id} has been updated to '${status}'.`,
        ]
      );
    }

    res.json({
      message: "Claim updated successfully ✅",
      claim: updatedClaim,
    });
  } catch (err) {
    console.error("Update Claim Error:", err);
    res.status(500).json({ error: "Failed to update claim ❌" });
  }
});

export default router;

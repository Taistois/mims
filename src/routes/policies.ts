import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * ===========================================
 * CREATE A POLICY
 * ===========================================
 * Roles allowed: admin, insurance_staff
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "insurance_staff"),
  async (req, res) => {
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
  }
);

/**
 * ===========================================
 * GET ALL POLICIES
 * ===========================================
 * - Admin and staff can view ALL policies
 * - Members only see their own
 */
router.get("/", verifyToken, async (req, res) => {
  const user = (req as any).user;

  try {
    let query = `SELECT p.*, u.name, u.email, u.phone
                 FROM policies p
                 JOIN members m ON p.member_id = m.member_id
                 JOIN users u ON m.user_id = u.user_id`;
    let params: any[] = [];

    if (user.role === "member") {
      query += ` WHERE m.user_id = $1`;
      params = [user.user_id];
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Policy Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch policies ❌" });
  }
});

/**
 * ===========================================
 * GET SINGLE POLICY
 * ===========================================
 * - Members can only view their own policy
 */
router.get("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    let query = `SELECT p.*, u.name, u.email, u.phone
                 FROM policies p
                 JOIN members m ON p.member_id = m.member_id
                 JOIN users u ON m.user_id = u.user_id
                 WHERE p.policy_id = $1`;
    let params: any[] = [id];

    if (user.role === "member") {
      query += ` AND m.user_id = $2`;
      params.push(user.user_id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Policy not found ❌" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Policy Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch policy ❌" });
  }
});

/**
 * ===========================================
 * UPDATE POLICY
 * ===========================================
 * Roles allowed: admin, insurance_staff
 */
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "insurance_staff"),
  async (req, res) => {
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

      if (result.rows.length === 0)
        return res.status(404).json({ error: "Policy not found ❌" });

      res.json({ message: "Policy updated ✅", policy: result.rows[0] });
    } catch (err) {
      console.error("Policy Update Error:", err);
      res.status(500).json({ error: "Failed to update policy ❌" });
    }
  }
);

/**
 * ===========================================
 * DELETE (CANCEL) POLICY
 * ===========================================
 * Admin only
 */
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM policies WHERE policy_id = $1 RETURNING *", [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Policy not found ❌" });

    res.json({ message: "Policy cancelled ✅", policy: result.rows[0] });
  } catch (err) {
    console.error("Policy Delete Error:", err);
    res.status(500).json({ error: "Failed to cancel policy ❌" });
  }
});

export default router;

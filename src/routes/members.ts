import { Router } from "express";
import pool from "../config/db";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

/**
 * ===========================================
 * ADD NEW MEMBER
 * ===========================================
 * Roles Allowed: insurance_staff, admin
 */
router.post("/", verifyToken, authorizeRoles("insurance_staff", "admin"), async (req, res) => {
  const { user_id, national_id, address, date_of_birth } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO members (user_id, national_id, address, date_of_birth)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, national_id, address, date_of_birth]
    );
    res.json({ message: "Member registered ✅", member: result.rows[0] });
  } catch (err) {
    console.error("Member Register Error:", err);
    res.status(500).json({ error: "Failed to register member ❌" });
  }
});

/**
 * ===========================================
 * GET ALL MEMBERS
 * ===========================================
 * Roles Allowed: insurance_staff, admin
 */
router.get("/", verifyToken, authorizeRoles("insurance_staff", "admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u.name, u.email, u.phone, u.role 
       FROM members m 
       JOIN users u ON m.user_id = u.user_id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Members Error:", err);
    res.status(500).json({ error: "Failed to fetch members ❌" });
  }
});

/**
 * ===========================================
 * GET SINGLE MEMBER BY ID
 * ===========================================
 * - Staff/Admin can view any member
 * - Members can only view their own record
 */
router.get("/:id", verifyToken, async (req, res) => {
  const memberId = req.params.id;
  const user = (req as any).user;

  try {
    const result = await pool.query(
      `SELECT m.*, u.name, u.email, u.phone, u.role 
       FROM members m 
       JOIN users u ON m.user_id = u.user_id
       WHERE m.member_id = $1`,
      [memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Member not found ❌" });
    }

    const member = result.rows[0];

    // Restrict members to only view their own data
    if (user.role === "member" && member.user_id !== user.user_id) {
      return res.status(403).json({ error: "Forbidden: Cannot view other member’s data 🚫" });
    }

    res.json(member);
  } catch (err) {
    console.error("Fetch Member Error:", err);
    res.status(500).json({ error: "Failed to fetch member ❌" });
  }
});

/**
 * ===========================================
 * UPDATE MEMBER
 * ===========================================
 * Roles Allowed: insurance_staff, admin
 */
router.put("/:id", verifyToken, authorizeRoles("insurance_staff", "admin"), async (req, res) => {
  const memberId = req.params.id;
  const { address, date_of_birth } = req.body;

  try {
    const result = await pool.query(
      `UPDATE members 
       SET address=$1, date_of_birth=$2 
       WHERE member_id=$3 RETURNING *`,
      [address, date_of_birth, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Member not found ❌" });
    }

    res.json({ message: "Member updated ✅", member: result.rows[0] });
  } catch (err) {
    console.error("Update Member Error:", err);
    res.status(500).json({ error: "Failed to update member ❌" });
  }
});

/**
 * ===========================================
 * DELETE MEMBER
 * ===========================================
 * Roles Allowed: admin only
 */
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const memberId = req.params.id;

  try {
    const result = await pool.query(
      `DELETE FROM members WHERE member_id=$1 RETURNING *`,
      [memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Member not found ❌" });
    }

    res.json({ message: "Member deleted ✅" });
  } catch (err) {
    console.error("Delete Member Error:", err);
    res.status(500).json({ error: "Failed to delete member ❌" });
  }
});

export default router;

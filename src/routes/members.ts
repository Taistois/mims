import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";

const router = Router();

/**
 * Add new member (only insurance staff or admin can do this)
 */
router.post("/", verifyToken, verifyRole(["insurance_staff", "admin"]), async (req, res) => {
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
 * Get all members (only staff/admin)
 */
router.get("/", verifyToken, verifyRole(["insurance_staff", "admin"]), async (req, res) => {
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
 * Get single member by ID (member can view their own, staff/admin can view any)
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

    // If user is a member, they can only view their own profile
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
 * Update member (staff/admin only)
 */
router.put("/:id", verifyToken, verifyRole(["insurance_staff", "admin"]), async (req, res) => {
  const memberId = req.params.id;
  const { address, date_of_birth } = req.body;

  try {
    const result = await pool.query(
      `UPDATE members SET address=$1, date_of_birth=$2 
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
 * Delete member (admin only)
 */
router.delete("/:id", verifyToken, verifyRole(["admin"]), async (req, res) => {
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

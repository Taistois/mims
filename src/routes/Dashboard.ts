import { Router } from "express";
import pool from "../config/db";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const members = await pool.query("SELECT COUNT(*) as total FROM members");
    const policies = await pool.query("SELECT COUNT(*) as total FROM policies WHERE status = 'active'");
    const claims = await pool.query("SELECT COUNT(*) as total FROM claims WHERE status = 'pending'");
    const payments = await pool.query("SELECT SUM(amount) as total FROM payments");

    res.json({
      totalMembers: Number(members.rows[0].total),
      activePolicies: Number(policies.rows[0].total),
      pendingClaims: Number(claims.rows[0].total),
      totalPayments: Number(payments.rows[0].total) || 0,
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

export default router;

import { Router, Request, Response } from "express";
import pool from "../config/db"; // <-- PostgreSQL pool connection
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    // Example queries, adjust to match your actual table names
    const membersResult = await pool.query("SELECT COUNT(*) FROM members");
    const policiesResult = await pool.query("SELECT COUNT(*) FROM policies WHERE status = 'active'");
    const claimsResult = await pool.query("SELECT COUNT(*) FROM claims WHERE status = 'pending'");
    const paymentsResult = await pool.query("SELECT SUM(amount) FROM payments");

    res.json({
      totalMembers: membersResult.rows[0].count,
      activePolicies: policiesResult.rows[0].count,
      pendingClaims: claimsResult.rows[0].count,
      totalPayments: paymentsResult.rows[0].sum || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching dashboard data" });
  }
});

export default router;

import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

// ✅ Dashboard summary endpoint
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const queries = {
      totalMembers: `SELECT COUNT(*) FROM members`,
      totalPolicies: `SELECT COUNT(*) FROM policies`,
      claimsByStatus: `SELECT status, COUNT(*) FROM claims GROUP BY status`,
      loansByStatus: `SELECT status, COUNT(*) FROM loans GROUP BY status`,
      totalPayments: `SELECT SUM(amount) AS total FROM payments WHERE status = 'success'`,
    };

    const [
      membersResult,
      policiesResult,
      claimsResult,
      loansResult,
      paymentsResult
    ] = await Promise.all([
      pool.query(queries.totalMembers),
      pool.query(queries.totalPolicies),
      pool.query(queries.claimsByStatus),
      pool.query(queries.loansByStatus),
      pool.query(queries.totalPayments)
    ]);

    res.json({
      message: "Dashboard summary fetched ✅",
      data: {
        total_members: parseInt(membersResult.rows[0].count),
        total_policies: parseInt(policiesResult.rows[0].count),
        claims_by_status: claimsResult.rows,
        loans_by_status: loansResult.rows,
        total_payments: parseFloat(paymentsResult.rows[0].total || 0),
      }
    });
  } catch (err) {
    console.error("Dashboard Summary Error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard summary ❌" });
  }
});

export default router;

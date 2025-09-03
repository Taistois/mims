import { Router } from "express";
import pool from "../config/db.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * ===========================================
 * DASHBOARD SUMMARY
 * ===========================================
 * Only accessible by: admin, insurance_staff
 */
router.get(
  "/summary",
  verifyToken,
  authorizeRoles("admin", "insurance_staff"),
  async (req, res) => {
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
        paymentsResult,
      ] = await Promise.all([
        pool.query(queries.totalMembers),
        pool.query(queries.totalPolicies),
        pool.query(queries.claimsByStatus),
        pool.query(queries.loansByStatus),
        pool.query(queries.totalPayments),
      ]);

      res.json({
        message: "Dashboard summary fetched ✅",
        data: {
          total_members: parseInt(membersResult.rows[0].count),
          total_policies: parseInt(policiesResult.rows[0].count),
          claims_by_status: claimsResult.rows,
          loans_by_status: loansResult.rows,
          total_payments: parseFloat(paymentsResult.rows[0].total || 0),
        },
      });
    } catch (err) {
      console.error("Dashboard Summary Error:", err);
      res.status(500).json({ error: "Failed to fetch dashboard summary ❌" });
    }
  }
);

/**
 * ===========================================
 * DETAILED REPORTS
 * ===========================================
 */

// Members Report
router.get(
  "/members",
  verifyToken,
  authorizeRoles("admin", "insurance_staff"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT m.*, u.name, u.email, u.phone 
        FROM members m
        JOIN users u ON m.user_id = u.user_id
        ORDER BY m.created_at DESC
      `);
      res.json({ message: "Members report fetched ✅", data: result.rows });
    } catch (err) {
      console.error("Members Report Error:", err);
      res.status(500).json({ error: "Failed to fetch members report ❌" });
    }
  }
);

// Policies Report
router.get(
  "/policies",
  verifyToken,
  authorizeRoles("admin", "insurance_staff"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT p.*, m.national_id, u.name AS member_name
        FROM policies p
        JOIN members m ON p.member_id = m.member_id
        JOIN users u ON m.user_id = u.user_id
        ORDER BY p.start_date DESC
      `);
      res.json({ message: "Policies report fetched ✅", data: result.rows });
    } catch (err) {
      console.error("Policies Report Error:", err);
      res.status(500).json({ error: "Failed to fetch policies report ❌" });
    }
  }
);

// Claims Report
router.get(
  "/claims",
  verifyToken,
  authorizeRoles("admin", "insurance_staff"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT c.*, p.policy_type, m.national_id, u.name AS member_name
        FROM claims c
        JOIN policies p ON c.policy_id = p.policy_id
        JOIN members m ON p.member_id = m.member_id
        JOIN users u ON m.user_id = u.user_id
        ORDER BY c.created_at DESC
      `);
      res.json({ message: "Claims report fetched ✅", data: result.rows });
    } catch (err) {
      console.error("Claims Report Error:", err);
      res.status(500).json({ error: "Failed to fetch claims report ❌" });
    }
  }
);

// Loans Report
router.get(
  "/loans",
  verifyToken,
  authorizeRoles("admin", "insurance_staff"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT l.*, m.national_id, u.name AS member_name
        FROM loans l
        JOIN members m ON l.member_id = m.member_id
        JOIN users u ON m.user_id = u.user_id
        ORDER BY l.created_at DESC
      `);
      res.json({ message: "Loans report fetched ✅", data: result.rows });
    } catch (err) {
      console.error("Loans Report Error:", err);
      res.status(500).json({ error: "Failed to fetch loans report ❌" });
    }
  }
);

// Payments Report
router.get(
  "/payments",
  verifyToken,
  authorizeRoles("admin", "insurance_staff"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT pay.*, c.description AS claim_description, u.name AS processed_by
        FROM payments pay
        LEFT JOIN claims c ON pay.claim_id = c.claim_id
        LEFT JOIN users u ON c.user_id = u.user_id
        ORDER BY pay.payment_date DESC
      `);
      res.json({ message: "Payments report fetched ✅", data: result.rows });
    } catch (err) {
      console.error("Payments Report Error:", err);
      res.status(500).json({ error: "Failed to fetch payments report ❌" });
    }
  }
);

export default router;

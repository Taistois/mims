// tests/repayments.test.ts
import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

import app from "../src/app";
import pool from "../src/config/db";

let token: string;
let repaymentId: number;
let loanId: number;

describe("Repayments Module", () => {
  /**
   * ----------------------------------------
   * Setup: Login as admin before running repayment tests
   * ----------------------------------------
   */
  beforeAll(async () => {
    // 1️⃣ Login as admin
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@mims.com",
        password: "Adminpass123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;

    // 2️⃣ Get an approved loan
    const loanRes = await pool.query(
      `SELECT loan_id FROM loans WHERE status = 'approved' LIMIT 1`
    );

    if (loanRes.rows.length === 0) {
      throw new Error("No approved loan available for testing repayments");
    }

    loanId = loanRes.rows[0].loan_id;
  });

  /**
   * ----------------------------------------
   * Test: Record a repayment
   * ----------------------------------------
   */
  it("should record a repayment", async () => {
    const res = await request(app)
      .post("/repayments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        loan_id: loanId,
        amount: 5000,
        method: "mobile_money",
      });

    if (res.status !== 200) console.log("Record Repayment Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.repayment).toHaveProperty("repayment_id");
    expect(res.body.repayment.loan_id).toBe(loanId);

    repaymentId = res.body.repayment.repayment_id;
  });

  /**
   * ----------------------------------------
   * Test: Fetch repayments for a loan
   * ----------------------------------------
   */
  it("should fetch repayments for a loan", async () => {
    const res = await request(app)
      .get(`/repayments/${loanId}`)
      .set("Authorization", `Bearer ${token}`);

    if (res.status !== 200) console.log("Fetch Repayments Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  /**
   * ----------------------------------------
   * Cleanup: Remove test repayment after tests
   * ----------------------------------------
   */
  afterAll(async () => {
    if (repaymentId) {
      await pool.query("DELETE FROM repayments WHERE repayment_id = $1", [repaymentId]);
    }
    await pool.end();
  });
});

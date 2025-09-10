import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

import app from "../src/app";
import pool from "../src/config/db";

let token: string;
let validClaimId: number;
let paymentId: number;

describe("Payments Module", () => {
  /**
   * ----------------------------------------
   * Setup: Login as admin and pick an approved claim
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
    token = res.body.token;

    // 2️⃣ Select an approved claim with an amount
    const claimRes = await pool.query(
      `SELECT claim_id FROM claims WHERE status = 'approved' AND claim_amount IS NOT NULL LIMIT 1`
    );

    if (claimRes.rows.length === 0) {
      throw new Error("No approved claim available for testing payments");
    }

    validClaimId = claimRes.rows[0].claim_id;
  }, 20000);

  /**
   * ----------------------------------------
   * Test: Record a payment
   * ----------------------------------------
   */
  it("should record a payment", async () => {
    const res = await request(app)
      .post("/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        claim_id: validClaimId,
        amount: 2000, // or any test amount
        payment_method: "mobile_money",
      });

    console.log("Record Payment Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.payment).toHaveProperty("payment_id");
    expect(res.body.payment.claim_id).toBe(validClaimId);

    paymentId = res.body.payment.payment_id;
  });

  /**
   * ----------------------------------------
   * Test: Fetch all payments
   * ----------------------------------------
   */
  it("should fetch all payments", async () => {
    const res = await request(app)
      .get("/payments")
      .set("Authorization", `Bearer ${token}`);

    console.log("Fetch Payments Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  /**
   * ----------------------------------------
   * Test: Fetch single payment by ID
   * ----------------------------------------
   */
  it("should fetch single payment by ID", async () => {
    const res = await request(app)
      .get(`/payments/${paymentId}`)
      .set("Authorization", `Bearer ${token}`);

    console.log("Fetch Single Payment Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("payment_id", paymentId);
  });

  /**
   * ----------------------------------------
   * Cleanup: Delete test payment only
   * ----------------------------------------
   */
  afterAll(async () => {
    if (paymentId) {
      await pool.query("DELETE FROM payments WHERE payment_id = $1", [paymentId]);
    }
    await pool.end();
  });
});

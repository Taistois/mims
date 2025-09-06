// tests/payments.test.ts
import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

import app from "../src/index";
import pool from "../src/config/db";

let token: string;

describe("Payments Module", () => {
  /**
   * ----------------------------------------
   * Setup: Login as admin before running payments tests
   * ----------------------------------------
   */
  beforeAll(async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@mims.com", // seeded admin
        password: "Adminpass123",
      });

    if (res.status !== 200) console.log("Admin login failed:", res.body);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");

    token = res.body.token;
  });

  /**
   * ----------------------------------------
   * Test: Record a new payment
   * ----------------------------------------
   */
  it("should record a payment", async () => {
    const res = await request(app)
      .post("/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        claim_id: 1, // adjust if needed
        amount: 2000,
        payment_method: "mobile_money",
      });

    if (res.status !== 200) console.log("Record Payment Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.payment).toHaveProperty("payment_id");
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

    if (res.status !== 200) console.log("Fetch Payments Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  /**
   * ----------------------------------------
   * Cleanup: Close DB pool after tests
   * ----------------------------------------
   */
  afterAll(async () => {
    await pool.end();
  });
});

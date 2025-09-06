// tests/repayments.test.ts
import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

import app from "../src/index";
import pool from "../src/config/db";

let token: string;

describe("Repayments Module", () => {
  /**
   * ----------------------------------------
   * Setup: Login as admin before running repayment tests
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
   * Test: Record a repayment
   * ----------------------------------------
   */
  it("should record a repayment", async () => {
    const res = await request(app)
      .post("/repayments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        loan_id: 3, // adjust if necessary
        amount: 5000,
        method: "mobile_money",
      });

    if (res.status !== 200) console.log("Record Repayment Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.repayment).toHaveProperty("payment_id");
  });

  /**
   * ----------------------------------------
   * Test: Fetch repayments for a loan
   * ----------------------------------------
   */
  it("should fetch repayments for a loan", async () => {
    const res = await request(app)
      .get("/repayments/1") // adjust loan_id if needed
      .set("Authorization", `Bearer ${token}`);

    if (res.status !== 200) console.log("Fetch Repayments Response:", res.body);

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

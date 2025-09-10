// tests/policies.test.ts
import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

import app from "../src/app";
import pool from "../src/config/db";

let token: string;
let policyId: string;

describe("Policies Module", () => {
  /**
   * ----------------------------------------
   * Setup: Login as admin before running policy tests
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
   * Test: Create a new policy
   * ----------------------------------------
   */
  it("should create a new policy", async () => {
    const res = await request(app)
      .post("/policies")
      .set("Authorization", `Bearer ${token}`)
      .send({
        member_id: 4, // adjust if necessary
        policy_type: "health",
        premium_amount: 20000,
        coverage_amount: 500000,
        start_date: "2025-09-01",
        end_date: "2026-09-01",
      });

    if (res.status !== 200) console.log("Create Policy Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.policy).toHaveProperty("policy_id");
    policyId = res.body.policy.policy_id;
  });

  /**
   * ----------------------------------------
   * Test: Fetch all policies
   * ----------------------------------------
   */
  it("should fetch all policies", async () => {
    const res = await request(app)
      .get("/policies")
      .set("Authorization", `Bearer ${token}`);

    if (res.status !== 200) console.log("Fetch Policies Response:", res.body);

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

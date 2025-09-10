// tests/reports.test.ts
import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

import app from "../src/app";
import pool from "../src/config/db";

let token: string;

describe("Reports Module", () => {
  /**
   * ----------------------------------------
   * Setup: Login as admin before running report tests
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
   * Test: Fetch dashboard summary report
   * ----------------------------------------
   */
  it("should fetch dashboard summary", async () => {
    const res = await request(app)
      .get("/reports/summary")
      .set("Authorization", `Bearer ${token}`);

    if (res.status !== 200) console.log("Dashboard Summary Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("total_members");
    expect(res.body.data).toHaveProperty("total_policies");
    expect(res.body.data).toHaveProperty("claims_by_status");
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

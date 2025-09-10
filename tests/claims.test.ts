// tests/claims.test.ts
import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

import app from "../src/app";
import pool from "../src/config/db";

let token: string; // token for authorization
let claimId: string | number; // claim id for update

describe("Claims Module", () => {
  /**
   * ----------------------------------------
   * Setup: Admin login before running claims tests
   * ----------------------------------------
   */
  beforeAll(async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@mims.com",
        password: "Adminpass123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  }, 10000);

  /**
   * ----------------------------------------
   * Test: Create a new claim using existing policy
   * ----------------------------------------
   */
  it("should create a new claim", async () => {
    // Use existing policy_id with member_id assigned (policy_id = 3)
    const res = await request(app)
      .post("/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        policy_id: 3, // existing policy
        claim_amount: 2000,
        description: "Medical expenses for test",
      });

    if (res.status !== 201) console.log("Create Claim Response:", res.body);

    expect(res.status).toBe(201); // route returns 201 on creation
    expect(res.body.claim).toHaveProperty("claim_id");

    claimId = res.body.claim.claim_id;
  });

  /**
   * ----------------------------------------
   * Test: Update claim status
   * ----------------------------------------
   */
  it("should update claim status", async () => {
    const res = await request(app)
      .put(`/claims/${claimId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "approved" });

    if (res.status !== 200) console.log("Update Claim Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.claim.status).toBe("approved");
  });

  /**
   * ----------------------------------------
   * Cleanup: Remove test claim after tests
   * ----------------------------------------
   */
  afterAll(async () => {
    if (claimId) {
      await pool.query("DELETE FROM claims WHERE claim_id = $1", [claimId]);
    }
    await pool.end(); // Close DB pool
  });
});

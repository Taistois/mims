// tests/loans.test.ts
import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

import app from "../src/index";
import pool from "../src/config/db";

let token: string; // admin token for authorization
let loanId: string | number; // loan id for update

describe("Loans Module", () => {
  /**
   * ----------------------------------------
   * Setup: Admin login before running loans tests
   * ----------------------------------------
   */
  beforeAll(async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@mims.com", // seeded admin from auth tests
        password: "Adminpass123",
      });

    if (res.status !== 200) console.log("Admin login failed:", res.body);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");

    token = res.body.token;
  }, 10000); // increase timeout if needed

  /**
   * ----------------------------------------
   * Test: Create a new loan
   * ----------------------------------------
   */
  it("should create a new loan", async () => {
    const res = await request(app)
      .post("/loans")
      .set("Authorization", `Bearer ${token}`)
      .send({
        member_id: 4,
        amount: 50000,
        interest_rate: 10.0,
        duration: 12,
      });

    if (res.status !== 200) console.log("Create Loan Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.loan).toHaveProperty("loan_id");

    loanId = res.body.loan.loan_id;
  });

  /**
   * ----------------------------------------
   * Test: Update loan status
   * ----------------------------------------
   */
  it("should update loan status", async () => {
    const res = await request(app)
      .put(`/loans/${loanId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "approved" });

    if (res.status !== 200) console.log("Update Loan Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.loan.status).toBe("approved");
  });

  /**
   * ----------------------------------------
   * Cleanup: Remove test loans after tests
   * ----------------------------------------
   */
  afterAll(async () => {
    if (loanId) {
      await pool.query("DELETE FROM loans WHERE loan_id = $1", [loanId]);
    }
    await pool.end(); // Close DB pool
  });
});

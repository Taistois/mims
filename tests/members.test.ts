// tests/members.test.ts
import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

import app from "../src/index";
import pool from "../src/config/db";

let token: string;
let memberId: string | number;

describe("Members Module", () => {
  /**
   * ----------------------------------------
   * Setup: Admin login before running members tests
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
  }, 10000);

  /**
   * ----------------------------------------
   * Test: Register a new member
   * ----------------------------------------
   */
  it("should register a new member", async () => {
    const res = await request(app)
      .post("/members")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_id: 1,
        national_id: "MW123456",
        address: "Lilongwe, Malawi",
        date_of_birth: "1995-08-25",
      });

    if (res.status !== 200) console.log("Register Member Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.member).toHaveProperty("member_id");

    memberId = res.body.member.member_id;
  });

  /**
   * ----------------------------------------
   * Test: Fetch all members
   * ----------------------------------------
   */
  it("should fetch all members", async () => {
    const res = await request(app)
      .get("/members")
      .set("Authorization", `Bearer ${token}`);

    if (res.status !== 200) console.log("Fetch All Members Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  /**
   * ----------------------------------------
   * Test: Fetch a single member
   * ----------------------------------------
   */
  it("should fetch a single member", async () => {
    const res = await request(app)
      .get(`/members/${memberId}`)
      .set("Authorization", `Bearer ${token}`);

    if (res.status !== 200) console.log("Fetch Single Member Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("member_id", memberId);
  });

  /**
   * ----------------------------------------
   * Cleanup: Remove test member after tests
   * ----------------------------------------
   */
  afterAll(async () => {
    if (memberId) {
      await pool.query("DELETE FROM members WHERE member_id = $1", [memberId]);
    }
    await pool.end(); // Close DB pool
  });
});

// tests/auth.test.ts
import request from "supertest";
import dotenv from "dotenv";
dotenv.config(); // Ensure .env variables are loaded before tests

import app from "../src/app"; // Your main Express app
import pool from "../src/config/db";
import bcrypt from "bcrypt";

let adminToken: string; // Admin token
let memberToken: string; // Member token

describe("Auth Module", () => {
  /**
   * ----------------------------------------
   * Setup: Create a default admin before all tests
   * ----------------------------------------
   */
  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("Adminpass123", 10);

    // Upsert admin to ensure password is always correct
    await pool.query(
      `INSERT INTO users (name, email, phone, role, password_hash)
       VALUES ('Seed Admin', 'admin@mims.com', '099999999', 'admin', $1)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [hashedPassword]
    );

    // Login admin
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@mims.com", password: "Adminpass123" });

    if (res.status !== 200) {
      console.log("Admin login failed response:", res.body);
      throw new Error(
        `Admin login failed in beforeAll: ${res.status} ${JSON.stringify(res.body)}`
      );
    }

    adminToken = res.body.token;
  }, 10000); // 10s timeout in case DB is slow

  /**
   * ----------------------------------------
   * Test: Register a new member user
   * ----------------------------------------
   */
  it("should register a new member user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Member",
        email: "member@mims.com",
        phone: "0888888888",
        password: "member123",
        role: "member",
      });

    if (res.status !== 200) console.log("Register Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("user_id");
  });

  /**
   * ----------------------------------------
   * Test: Login with newly registered member
   * ----------------------------------------
   */
  it("should login and return a token", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "member@mims.com",
        password: "member123",
      });

    if (res.status !== 200) console.log("Login Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");

    memberToken = res.body.token; // Save member token
  });

  /**
   * ----------------------------------------
   * Test: Access a protected route
   * ----------------------------------------
   */
  it("should access a protected route with token", async () => {
    const res = await request(app)
      .get("/dashboard") // Ensure this route is protected
      .set("Authorization", `Bearer ${memberToken}`);

    if (res.status !== 200) console.log("Protected Route Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");
  });

  /**
   * ----------------------------------------
   * Cleanup: Remove test data after tests
   * ----------------------------------------
   */
  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = 'member@mims.com'");
    await pool.query("DELETE FROM users WHERE email = 'admin@mims.com' AND name = 'Seed Admin'");
    await pool.end(); // Close DB pool to prevent open handles
  });
});

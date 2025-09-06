// tests/auth.test.ts
import request from "supertest";
import app from "../src/index"; // Import your main express app
import pool from "../src/config/db";
import bcrypt from "bcrypt";

let adminToken: string; // Will store admin token for all tests

describe("Auth Module", () => {
  /**
   * ----------------------------------------
   * Setup: Create a default admin before all tests
   * ----------------------------------------
   */
  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash("Adminpass123", 10);

    // Insert admin user directly into DB if not exists
    await pool.query(
      `INSERT INTO users (name, email, phone, role, password_hash)
       VALUES ('Seed Admin', 'admin@mims.com', '099999999', 'admin', $1)
       ON CONFLICT (email) DO NOTHING`,
      [hashedPassword]
    );

    // Login admin to get token
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@mims.com", password: "Adminpass123" });

    adminToken = res.body.token;
  });

  /**
   * ----------------------------------------
   * Test: Register a new user (Admin required)
   * ----------------------------------------
   */
  it("should register a new member user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .set("Authorization", `Bearer ${adminToken}`) // ✅ Admin token required
      .send({
        name: "Test Member",
        email: "member@mims.com",
        phone: "0888888888",
        password: "member123",
        role: "member",
      });

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

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");

    // Save this token for the next test
    adminToken = res.body.token;
  });

  /**
   * ----------------------------------------
   * Test: Access a protected route
   * ----------------------------------------
   */
  it("should access a protected route with token", async () => {
    const res = await request(app)
      .get("/dashboard") // ✅ Your actual protected route
      .set("Authorization", `Bearer ${adminToken}`);

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
  });
});

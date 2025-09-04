// tests/auth.test.ts
import request from "supertest";
import app from "../src/index"; // keep .js if your source files are ESM JS

let token: string; // token variable scoped for this file

describe("Auth Module", () => {
  it("should register a new admin", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Admin",
        email: "admin@mims.com",
        phone: "099999999",
        password: "admin123",
        role: "admin",
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("user_id");
  });

  it("should login and return a token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@mims.com",
        password: "admin123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");

    token = res.body.token; // assign token for other tests in this file
  });

  it("should access a protected route with token", async () => {
    const res = await request(app)
      .get("/api/protected-route") // replace with your actual protected route
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

// NO export default token!

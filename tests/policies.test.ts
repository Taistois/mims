// tests/policies.test.ts
import request from "supertest";
import app from "../src/index";

let token: string;
let policyId: string;

describe("Policies Module", () => {
  // login before running policy tests
  beforeAll(async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@mims.com", // test admin credentials
        password: "admin123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  });

  it("should create a new policy", async () => {
    const res = await request(app)
      .post("/policies")
      .set("Authorization", `Bearer ${token}`)
      .send({
        member_id: 1,
        policy_type: "health",
        premium_amount: 20000,
        coverage_amount: 500000,
        start_date: "2025-09-01",
        end_date: "2026-09-01",
      });

    expect(res.status).toBe(200);
    expect(res.body.policy).toHaveProperty("policy_id");
    policyId = res.body.policy.policy_id;
  });

  it("should fetch all policies", async () => {
    const res = await request(app)
      .get("/policies")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

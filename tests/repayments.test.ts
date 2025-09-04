// tests/repayments.test.ts
import request from "supertest";
import app from "../src/index";

let token: string;

describe("Repayments Module", () => {
  // login before running repayment tests
  beforeAll(async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@mims.com", // test admin credentials
        password: "admin123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  });

  it("should record a repayment", async () => {
    const res = await request(app)
      .post("/api/repayments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        loan_id: 1,
        amount: 5000,
        method: "mobile_money",
      });

    expect(res.status).toBe(200);
    expect(res.body.repayment).toHaveProperty("payment_id");
  });

  it("should fetch repayments for a loan", async () => {
    const res = await request(app)
      .get("/api/repayments/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

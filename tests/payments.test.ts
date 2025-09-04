// tests/payments.test.ts
import request from "supertest";
import app from "../src/index";

let token: string;

describe("Payments Module", () => {
  // login before running payments tests
  beforeAll(async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@mims.com", // your test admin credentials
        password: "admin123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  });

  it("should record a payment", async () => {
    const res = await request(app)
      .post("/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        claim_id: 1,
        amount: 2000,
        payment_method: "mobile_money",
      });

    expect(res.status).toBe(200);
    expect(res.body.payment).toHaveProperty("payment_id");
  });

  it("should fetch all payments", async () => {
    const res = await request(app)
      .get("/payments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

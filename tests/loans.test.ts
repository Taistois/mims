// tests/loans.test.ts
import request from "supertest";
import app from "../src/index";

let token: string; // token for authorization
let loanId: string | number; // loan id for update

describe("Loans Module", () => {
  // login before running loans tests
  beforeAll(async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@mims.com", // your test admin credentials
        password: "admin123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");

    token = res.body.token;
  });

  it("should create a new loan", async () => {
    const res = await request(app)
      .post("/api/loans")
      .set("Authorization", `Bearer ${token}`)
      .send({
        member_id: 1,
        amount: 50000,
        interest_rate: 10.0,
        duration: 12,
      });

    expect(res.status).toBe(200);
    expect(res.body.loan).toHaveProperty("loan_id");
    loanId = res.body.loan.loan_id;
  });

  it("should update loan status", async () => {
    const res = await request(app)
      .put(`/api/loans/${loanId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "approved" });

    expect(res.status).toBe(200);
    expect(res.body.loan.status).toBe("approved");
  });
});

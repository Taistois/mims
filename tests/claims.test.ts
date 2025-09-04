// tests/claims.test.ts
import request from "supertest";
import app from "../src/index";

let token: string; // token for authorization
let claimId: string | number; // claim id for update

describe("Claims Module", () => {
  // login before running claims tests
  beforeAll(async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@mims.com", // use your test admin credentials
        password: "admin123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");

    token = res.body.token;
  });

  it("should create a new claim", async () => {
    const res = await request(app)
      .post("/claims")
      .set("Authorization", `Bearer ${token}`)
      .send({
        policy_id: 1,
        claim_amount: 2000,
        description: "Medical expenses",
      });

    expect(res.status).toBe(200);
    expect(res.body.claim).toHaveProperty("claim_id");
    claimId = res.body.claim.claim_id;
  });

  it("should update claim status", async () => {
    const res = await request(app)
      .put(`/claims/${claimId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "approved" });

    expect(res.status).toBe(200);
    expect(res.body.claim.status).toBe("approved");
  });
});

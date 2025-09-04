// tests/reports.test.ts
import request from "supertest";
import app from "../src/index";

let token: string;

describe("Reports Module", () => {
  // login before running report tests
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

  it("should fetch dashboard summary", async () => {
    const res = await request(app)
      .get("/api/reports/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("total_members");
    expect(res.body.data).toHaveProperty("total_policies");
    expect(res.body.data).toHaveProperty("claims_by_status");
  });
});

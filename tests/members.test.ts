// tests/members.test.ts
import request from "supertest";
import app from "../src/index";

let token: string;
let memberId: string | number;

describe("Members Module", () => {
  // login before running members tests
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

    expect(res.status).toBe(200);
    expect(res.body.member).toHaveProperty("member_id");
    memberId = res.body.member.member_id;
  });

  it("should fetch all members", async () => {
    const res = await request(app)
      .get("/members")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should fetch a single member", async () => {
    const res = await request(app)
      .get(`/members/${memberId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("member_id", memberId);
  });
});

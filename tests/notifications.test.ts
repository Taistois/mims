import request from "supertest";
import app from "../src/index";

export async function generateTestToken() {
  const res = await request(app)
    .post("/auth/login")
    .send({
      email: "testuser@example.com", // use your test user credentials
      password: "password123",
    });

  return res.body.token;
}
// helper to get a valid token

describe("Notifications Module", () => {
  let token: string;
  let notificationId: number;

  beforeAll(async () => {
    // Get a valid token for testing
    token = await generateTestToken();

    // Optionally, create a test notification to ensure it exists
    const res = await request(app)
      .post("/api/notifications")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Test notification" });

    notificationId = res.body.notification.id; // save for later
  });

  it("should fetch all notifications for user", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeDefined();
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  it("should mark a notification as read", async () => {
    const res = await request(app)
      .put(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.notification).toBeDefined();
    expect(res.body.notification.is_read).toBe(true);
  });
});

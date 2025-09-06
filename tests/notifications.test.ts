// tests/notifications.test.ts
import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

import app from "../src/index";
import pool from "../src/config/db";

async function generateTestToken() {
  const res = await request(app)
    .post("/auth/login")
    .send({
      email: "admin@mims.com", // seeded admin for testing
      password: "Adminpass123",
    });

  if (res.status !== 200) console.log("Token generation failed:", res.body);
  return res.body.token;
}

describe("Notifications Module", () => {
  let token: string;
  let notificationId: number;

  /**
   * ----------------------------------------
   * Setup: Get token and create a test notification
   * ----------------------------------------
   */
  beforeAll(async () => {
  token = await generateTestToken();

  const res = await request(app)
    .post("/api/notifications")
    .set("Authorization", `Bearer ${token}`)
    .send({ message: "Test notification" });

  if (res.status !== 200) console.error("Create Notification Response:", res.body);

  notificationId = res.body.data?.id || res.body.notification?.id;

  if (!notificationId) {
    throw new Error("Failed to create test notification; cannot continue tests");
  }
}, 10000);

  /**
   * ----------------------------------------
   * Test: Fetch all notifications for user
   * ----------------------------------------
   */
  it("should fetch all notifications for user", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    if (res.status !== 200) console.log("Fetch Notifications Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeDefined();
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  /**
   * ----------------------------------------
   * Test: Mark a notification as read
   * ----------------------------------------
   */
  it("should mark a notification as read", async () => {
    const res = await request(app)
      .put(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${token}`);

    if (res.status !== 200) console.log("Mark Notification Read Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.notification).toBeDefined();
    expect(res.body.notification.is_read).toBe(true);
  });

  /**
   * ----------------------------------------
   * Cleanup: Remove test notification after tests
   * ----------------------------------------
   */
  afterAll(async () => {
    if (notificationId) {
      await pool.query("DELETE FROM notifications WHERE id = $1", [notificationId]);
    }
    await pool.end(); // close DB pool
  });
});

import { Router } from "express";
import pool from "../config/db";

const router = Router();

// ✅ Create a new member
router.post("/", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const result = await pool.query(
      "INSERT INTO members (name, email, phone) VALUES ($1, $2, $3) RETURNING *",
      [name, email, phone]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating member:", error);
    res.status(500).json({ error: "Failed to create member" });
  }
});

// ✅ Get all members
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM members ORDER BY registration_date DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// ✅ Get single member
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM members WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Member not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching member:", error);
    res.status(500).json({ error: "Failed to fetch member" });
  }
});

// ✅ Update member
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const result = await pool.query(
      "UPDATE members SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *",
      [name, email, phone, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Member not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating member:", error);
    res.status(500).json({ error: "Failed to update member" });
  }
});

// ✅ Delete member
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM members WHERE id = $1 RETURNING *", [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: "Member not found" });
    res.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    res.status(500).json({ error: "Failed to delete member" });
  }
});

export default router;

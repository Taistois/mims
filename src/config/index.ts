import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "./config/db";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Test route
app.get("/", async (req, res) => {
  res.send("MIMS Backend Running 🚀");
});

// DB test
app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "DB Connected", time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

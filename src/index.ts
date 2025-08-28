import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Root test route
app.get("/", (req, res) => {
  res.send("MIMS Backend Running 🚀");
});

// ✅ Mount auth routes properly
app.use("/auth", authRoutes);

app.get("/dashboard", authenticateToken, (req, res) => {
  res.json({ message: "Welcome to the protected dashboard ✅", user: (req as any).user });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

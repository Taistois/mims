import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import { verifyToken } from "./middleware/authMiddleware.js";
import { verifyRole } from "./middleware/roleMiddleware.js"
import memberRoutes from "./routes/members.js";
import policyRoutes from "./routes/policies.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5000;

// Root route
app.get("/", (req, res) => {
  res.send("MIMS Backend Running 🚀");
});

// Auth routes
app.use("/auth", authRoutes);
app.use("/members", memberRoutes);
app.use("/policies", policyRoutes);

// ✅ Protected dashboard route
app.get("/dashboard", verifyToken, (req, res) => {
  res.json({
    message: "Welcome to the protected dashboard ✅",
    user: (req as any).user,
  });
});

// ✅ Admin-only route
app.get("/admin", verifyToken, verifyRole(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin 👑", user: (req as any).user });
});

// ✅ Insurance staff-only route
app.get("/staff", verifyToken, verifyRole(["insurance_staff"]), (req, res) => {
  res.json({ message: "Welcome Insurance Staff 📋", user: (req as any).user });
});

// ✅ Member-only route
app.get("/member", verifyToken, verifyRole(["member"]), (req, res) => {
  res.json({ message: "Welcome Member 🙋", user: (req as any).user });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

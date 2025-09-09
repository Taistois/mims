import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import "./config/validateEnv"; // ✅ Environment validation

// -----------------------------
// Routes & Middleware
// -----------------------------
import authRoutes from "./routes/auth";
import { verifyToken } from "./middleware/authMiddleware";
import { verifyRole } from "./middleware/roleMiddleware";
import memberRoutes from "./routes/members";
import policyRoutes from "./routes/policies";
import claimRoutes from "./routes/claims";
import paymentRoutes from "./routes/payments";
import loanRoutes from "./routes/loans";
import repaymentRoutes from "./routes/repayments";
import reportRoutes from "./routes/reports";
import notificationRoutes from "./routes/notifications";

// -----------------------------
// Load env variables quietly
// -----------------------------
dotenv.config({
  path: ".env",
  debug: process.env.NODE_ENV === "development",
  override: true,
});

const app = express();
export default app; // ✅ export app for tests

const httpServer = createServer(app);

// -----------------------------
// Secure CORS Setup
// -----------------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://mims-dashboard.vercel.app", // example frontend
  "https://your-production-domain.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS ❌"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// -----------------------------
// Socket.IO Setup
// -----------------------------
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  if (process.env.NODE_ENV === "development") console.log("User connected:", socket.id);

  socket.on("registerUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    if (process.env.NODE_ENV === "development") {
      console.log(`User ${userId} registered for notifications`);
    }
  });

  socket.on("disconnect", () => {
    if (process.env.NODE_ENV === "development") console.log("User disconnected:", socket.id);
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

// Utility to send notifications via socket
export const notifyUser = (userId: number, notification: any) => {
  const socketId = onlineUsers.get(userId);
  if (socketId) io.to(socketId).emit("notification", notification);
};

// -----------------------------
// Middleware
// -----------------------------
app.use(express.json());

const PORT = process.env.PORT || 8080;

// -----------------------------
// Root route
// -----------------------------
app.get("/", (req, res) => {
  res.send("MIMS Backend Running 🚀");
});

// ======================
// Main Routes
// ======================
app.use("/auth", authRoutes);
app.use("/members", memberRoutes);
app.use("/policies", policyRoutes);
app.use("/claims", claimRoutes);
app.use("/payments", paymentRoutes);
app.use("/loans", loanRoutes);
app.use("/repayments", repaymentRoutes);
app.use("/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes); // ✅ standardized path

// ======================
// Protected Test Routes
// ======================
app.get("/dashboard", verifyToken, (req, res) => {
  res.json({ message: "Welcome to the protected dashboard", user: (req as any).user });
});

app.get("/admin", verifyToken, verifyRole(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin 👑", user: (req as any).user });
});

app.get("/staff", verifyToken, verifyRole(["insurance_staff"]), (req, res) => {
  res.json({ message: "Welcome Insurance Staff 📋", user: (req as any).user });
});

app.get("/member", verifyToken, verifyRole(["member"]), (req, res) => {
  res.json({ message: "Welcome Member 🙋", user: (req as any).user });
});

// ======================
// Start Server
// ======================
if (process.env.NODE_ENV !== "test") {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// ======================
// Error Handling 
// ======================
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

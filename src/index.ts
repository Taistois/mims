import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

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

dotenv.config();

const app = express();
export default app; // ✅ export app for tests

const httpServer = createServer(app);

// ✅ Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*", // adjust to frontend URL in production
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Store connected users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("registerUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} registered for notifications`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
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
  if (socketId) {
    io.to(socketId).emit("notification", notification);
  }
};

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Root route
app.get("/", (req, res) => {
  res.send("MIMS Backend Running 🚀");
});

// ======================
// Routes
// ======================
app.use("/auth", authRoutes);
app.use("/members", memberRoutes);
app.use("/policies", policyRoutes);
app.use("/claims", claimRoutes);
app.use("/payments", paymentRoutes);
app.use("/loans", loanRoutes);
app.use("/repayments", repaymentRoutes);
app.use("/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);// ✅ standardized path

// ======================
// Protected test routes
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
// Only listen when not running tests
// ======================
if (process.env.NODE_ENV !== "test") {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

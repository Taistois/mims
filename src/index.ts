import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import { verifyToken } from "./middleware/authMiddleware.js";
import { verifyRole } from "./middleware/roleMiddleware.js"
import memberRoutes from "./routes/members.js";
import policyRoutes from "./routes/policies.js";
import claimRoutes from "./routes/claims.js";
import paymentRoutes from "./routes/payments.js";
import loanRoutes from "./routes/loans.js";
import repaymentRoutes from "./routes/repayments.js";
import reportRoutes from "./routes/reports.js";
import notificationRoutes from "./routes/notifications.js";

dotenv.config();
const app = express();
export default app;

const httpServer = createServer(app);

// ✅ Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*", // adjust to your frontend URL in production
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

// Auth routes
app.use("/auth", authRoutes);
app.use("/members", memberRoutes);
app.use("/policies", policyRoutes);
app.use("/claims", claimRoutes);
app.use("/payments", paymentRoutes);
app.use("/loans", loanRoutes);
app.use("/repayments", repaymentRoutes);
app.use("/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);

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

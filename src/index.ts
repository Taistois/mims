import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";

const PORT = process.env.PORT || 8080;
const httpServer = createServer(app);

// -----------------------------
// Socket.IO Setup
// -----------------------------
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://mims-dashboard.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const onlineUsers = new Map<number, string>();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("registerUser", (userId: number) => {
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

// -----------------------------
// Start the server
// -----------------------------
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// -----------------------------
// Global Error Handling
// -----------------------------
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

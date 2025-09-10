"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyUser = void 0;
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 8080;
const httpServer = (0, http_1.createServer)(app_1.default);
// -----------------------------
// Socket.IO Setup
// -----------------------------
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://mims-dashboard.vercel.app",
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});
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
const notifyUser = (userId, notification) => {
    const socketId = onlineUsers.get(userId);
    if (socketId) {
        io.to(socketId).emit("notification", notification);
    }
};
exports.notifyUser = notifyUser;
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

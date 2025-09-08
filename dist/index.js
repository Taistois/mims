"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyUser = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const auth_1 = __importDefault(require("./routes/auth"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const roleMiddleware_1 = require("./middleware/roleMiddleware");
const members_1 = __importDefault(require("./routes/members"));
const policies_1 = __importDefault(require("./routes/policies"));
const claims_1 = __importDefault(require("./routes/claims"));
const payments_1 = __importDefault(require("./routes/payments"));
const loans_1 = __importDefault(require("./routes/loans"));
const repayments_1 = __importDefault(require("./routes/repayments"));
const reports_1 = __importDefault(require("./routes/reports"));
const notifications_1 = __importDefault(require("./routes/notifications"));
// -----------------------------
// Load env variables quietly
// -----------------------------
dotenv_1.default.config({ path: ".env", debug: process.env.NODE_ENV === "development", override: true });
const app = (0, express_1.default)();
exports.default = app; // ✅ export app for tests
const httpServer = (0, http_1.createServer)(app);
// -----------------------------
// Setup Socket.IO
// -----------------------------
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // adjust to frontend URL in production
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});
// Store connected users
const onlineUsers = new Map();
io.on("connection", (socket) => {
    if (process.env.NODE_ENV === "development")
        console.log("User connected:", socket.id);
    socket.on("registerUser", (userId) => {
        onlineUsers.set(userId, socket.id);
        if (process.env.NODE_ENV === "development")
            console.log(`User ${userId} registered for notifications`);
    });
    socket.on("disconnect", () => {
        if (process.env.NODE_ENV === "development")
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
const notifyUser = (userId, notification) => {
    const socketId = onlineUsers.get(userId);
    if (socketId)
        io.to(socketId).emit("notification", notification);
};
exports.notifyUser = notifyUser;
// -----------------------------
// Middleware
// -----------------------------
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 5000;
// -----------------------------
// Root route
// -----------------------------
app.get("/", (req, res) => {
    res.send("MIMS Backend Running 🚀");
});
// ======================
// Routes
// ======================
app.use("/auth", auth_1.default);
app.use("/members", members_1.default);
app.use("/policies", policies_1.default);
app.use("/claims", claims_1.default);
app.use("/payments", payments_1.default);
app.use("/loans", loans_1.default);
app.use("/repayments", repayments_1.default);
app.use("/reports", reports_1.default);
app.use("/api/notifications", notifications_1.default); // ✅ standardized path
// ======================
// Protected test routes
// ======================
app.get("/dashboard", authMiddleware_1.verifyToken, (req, res) => {
    res.json({ message: "Welcome to the protected dashboard", user: req.user });
});
app.get("/admin", authMiddleware_1.verifyToken, (0, roleMiddleware_1.verifyRole)(["admin"]), (req, res) => {
    res.json({ message: "Welcome Admin 👑", user: req.user });
});
app.get("/staff", authMiddleware_1.verifyToken, (0, roleMiddleware_1.verifyRole)(["insurance_staff"]), (req, res) => {
    res.json({ message: "Welcome Insurance Staff 📋", user: req.user });
});
app.get("/member", authMiddleware_1.verifyToken, (0, roleMiddleware_1.verifyRole)(["member"]), (req, res) => {
    res.json({ message: "Welcome Member 🙋", user: req.user });
});
// ======================
// Only listen when not running tests
// ======================
if (process.env.NODE_ENV !== "test") {
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

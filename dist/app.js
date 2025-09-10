"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const roleMiddleware_1 = require("./middleware/roleMiddleware");
const errorHandler_1 = require("./middleware/errorHandler");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const members_1 = __importDefault(require("./routes/members"));
const policies_1 = __importDefault(require("./routes/policies"));
const claims_1 = __importDefault(require("./routes/claims"));
const payments_1 = __importDefault(require("./routes/payments"));
const loans_1 = __importDefault(require("./routes/loans"));
const repayments_1 = __importDefault(require("./routes/repayments"));
const reports_1 = __importDefault(require("./routes/reports"));
const notifications_1 = __importDefault(require("./routes/notifications"));
dotenv_1.default.config({ path: ".env" });
const app = (0, express_1.default)();
// -----------------------------
// Security & Middleware
// -----------------------------
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
// CORS configuration
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://mims-dashboard.vercel.app",
    "https://your-production-domain.com",
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("❌ Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
// Rate limiter (15 min, 100 requests per IP)
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
});
// -----------------------------
// Swagger Setup
// -----------------------------
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "MIMS API",
            version: "1.0.0",
            description: "API Documentation for MIMS Backend",
        },
    },
    apis: ["./src/routes/*.ts"],
};
const swaggerDocs = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocs));
// -----------------------------
// Root Health Check
// -----------------------------
app.get("/", (req, res) => {
    res.status(200).send("🚀 MIMS Backend Running Successfully!");
});
// -----------------------------
// Main Routes
// -----------------------------
app.use("/auth", apiLimiter, auth_1.default); // ✅ with rate limiter
app.use("/members", members_1.default);
app.use("/policies", policies_1.default);
app.use("/claims", claims_1.default);
app.use("/payments", payments_1.default);
app.use("/loans", loans_1.default);
app.use("/repayments", repayments_1.default);
app.use("/reports", reports_1.default);
app.use("/api/notifications", notifications_1.default);
// -----------------------------
// Protected Testing Routes
// -----------------------------
app.get("/dashboard", authMiddleware_1.verifyToken, (req, res) => {
    res.json({
        message: "Welcome to the protected dashboard",
        user: req.user,
    });
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
// -----------------------------
// Global Error Handler
// -----------------------------
app.use(errorHandler_1.errorHandler);
exports.default = app;

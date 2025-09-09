"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * =========================================
 * VERIFY TOKEN
 * =========================================
 * Checks if the request has a valid JWT token.
 * Attaches decoded user data to `req.user`.
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        res.status(401).json({ error: "Access denied. No token provided ❌" });
        return;
    }
    const token = authHeader.split(" ")[1]; // Format: Bearer <token>
    if (!token) {
        res.status(401).json({ error: "Invalid token format ❌" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded token data to request
        next();
    }
    catch (err) {
        console.error("JWT Verification Error:", err);
        res.status(401).json({ error: "Invalid or expired token ❌" });
    }
};
exports.verifyToken = verifyToken;
/**
 * =========================================
 * ROLE-BASED AUTHORIZATION
 * =========================================
 * Ensures that only users with the allowed roles
 * can access the protected route.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "Unauthorized: No user data found ❌" });
            return;
        }
        if (!allowedRoles.includes(user.role)) {
            res.status(403).json({ error: "Forbidden: Insufficient permissions ❌" });
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;

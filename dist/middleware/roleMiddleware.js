"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRole = void 0;
// Middleware factory: accepts an array of allowed roles
const verifyRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized ❌" });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({ error: "Forbidden: You don’t have access 🚫" });
        }
        next();
    };
};
exports.verifyRole = verifyRole;

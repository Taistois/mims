import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

/**
 * =========================================
 * VERIFY TOKEN
 * =========================================
 * Checks if the request has a valid JWT token.
 * Attaches decoded user data to `req.user`.
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = decoded; // Attach decoded token data to request
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    res.status(401).json({ error: "Invalid or expired token ❌" });
  }
};

/**
 * =========================================
 * ROLE-BASED AUTHORIZATION
 * =========================================
 * Ensures that only users with the allowed roles
 * can access the protected route.
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

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

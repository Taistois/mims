import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Access denied. No token provided ❌" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = decoded; // Attach decoded token to req
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token ❌" });
  }
};

// ✅ Role-based authorization
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ error: "Access denied. Insufficient permissions ❌" });
      return;
    }

    next();
  };
};

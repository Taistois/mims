import { Request, Response, NextFunction } from "express";

// Middleware factory: accepts an array of allowed roles
export const verifyRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized ❌" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: You don’t have access 🚫" });
    }

    next();
  };
};

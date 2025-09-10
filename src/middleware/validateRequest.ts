import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

/**
 * Example reusable validation chain
 */
export const userValidationRules = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

/**
 * Middleware to handle validation errors
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed ❌",
      errors: errors.array(),
    });
  }
  next();
};

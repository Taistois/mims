"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.userValidationRules = void 0;
const express_validator_1 = require("express-validator");
/**
 * Example reusable validation chain
 */
exports.userValidationRules = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
];
/**
 * Middleware to handle validation errors
 */
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "error",
            message: "Validation failed ❌",
            errors: errors.array(),
        });
    }
    next();
};
exports.validateRequest = validateRequest;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Example route
router.get("/test", (req, res) => res.send("Router working!"));
exports.default = router; // must be default export

import { Router } from "express";

const router = Router();

// Example route
router.get("/test", (req, res) => res.send("Router working!"));

export default router;  // must be default export

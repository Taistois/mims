import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { verifyToken } from "./middleware/authMiddleware";
import { verifyRole } from "./middleware/roleMiddleware";
import authRoutes from "./routes/auth";
import memberRoutes from "./routes/members";
import policyRoutes from "./routes/policies";
import claimRoutes from "./routes/claims";
import paymentRoutes from "./routes/payments";
import loanRoutes from "./routes/loans";
import repaymentRoutes from "./routes/repayments";
import reportRoutes from "./routes/reports";
import notificationRoutes from "./routes/notifications";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config({ path: ".env" });

const app = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(express.json());
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

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://mims-dashboard.vercel.app",
  "https://your-production-domain.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("❌ Not allowed by CORS"));
      }
      
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// -----------------------------
// Root Health Check
// -----------------------------
app.get("/", (req, res) => {
  res.status(200).send("🚀 MIMS Backend Running Successfully!");
});

// -----------------------------
// Main Routes
// -----------------------------
app.use("/auth", authRoutes);
app.use("/members", memberRoutes);
app.use("/policies", policyRoutes);
app.use("/claims", claimRoutes);
app.use("/payments", paymentRoutes);
app.use("/loans", loanRoutes);
app.use("/repayments", repaymentRoutes);
app.use("/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(errorHandler);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use("/auth", apiLimiter, authRoutes);
app.use("/auth", apiLimiter, authRoutes);

// -----------------------------
// Protected Testing Routes
// -----------------------------
app.get("/dashboard", verifyToken, (req, res) => {
  res.json({ message: "Welcome to the protected dashboard", user: (req as any).user });
});

app.get("/admin", verifyToken, verifyRole(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin 👑", user: (req as any).user });
});

app.get("/staff", verifyToken, verifyRole(["insurance_staff"]), (req, res) => {
  res.json({ message: "Welcome Insurance Staff 📋", user: (req as any).user });
});

app.get("/member", verifyToken, verifyRole(["member"]), (req, res) => {
  res.json({ message: "Welcome Member 🙋", user: (req as any).user });
});

export default app;

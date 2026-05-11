import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { authLimiter, logLimiter, dashboardLimiter } from "./middleware/rate-limit.js";
import { asyncHandler } from "./middleware/async-handler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import logRoutes from "./modules/logs/logs.routes.js";
import recommendationRoutes from "./modules/recommendations/recommendations.routes.js";
import checkinRoutes from "./modules/checkins/checkins.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import { requireAuth } from "./middleware/auth.js";
import { historyHandler } from "./modules/logs/logs.controller.js";
import { dashboardHandler } from "./modules/recommendations/recommendations.controller.js";

const app = express();

// ─── Global middleware ───
const allowedOrigins = env.CORS_ORIGIN.split(",").map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

// ─── Request logging (production) ───
if (env.NODE_ENV === "production") {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── Health check ───
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Routes with rate limiting ───
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", userRoutes);
app.use("/api/logs", logLimiter, logRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/admin", adminRoutes);
app.get("/api/history", requireAuth, asyncHandler(historyHandler));
app.get("/api/dashboard", requireAuth, dashboardLimiter, asyncHandler(dashboardHandler));

// ─── Error handling ───
app.use(notFound);
app.use(errorHandler);

export default app;

import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { ApiError } from "./utils/ApiError.js";
import authRoutes from "./routes/auth.routes.js";
import formRouter from "./routes/form.routes.js";
import responseRouter from "./routes/response.routes.js";
import insightsRouter from "./routes/insights.route.js";
import aiRouter from "./routes/ai.routes.js";

const app = express();

// ✅ CORS CONFIGURATION: Allow your Vercel frontend URLs safely
app.use(cors({
  origin: 'https://final-year-project-gamma-eight.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// API Base Health Check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "API is healthy", uptime: process.uptime() });
});
app.get("/health", (_req, res) => {
  res.json({ success: true, message: "API is healthy", uptime: process.uptime() });
});

// ✅ REGISTERED ROUTES (With /api prefix)
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRouter);
app.use("/api", responseRouter);
app.use("/api", insightsRouter);
app.use("/api/ai", aiRouter);

// ✅ FALLBACK ROUTES (Without /api prefix, handles legacy frontend calls)
app.use("/auth", authRoutes);
app.use("/forms", formRouter);
app.use("/", responseRouter);
app.use("/", insightsRouter);
app.use("/ai", aiRouter);

// 404 Route Catch-All
app.use((req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

app.post("/auth/register", (req, res) => {
    res.json({ message: "User registered successfully" });
});
// Global Error Handling Middleware
app.use((err, _req, res, _next) => {
  let error = err;

  if (error.name === "ValidationError") {
    const details = Object.values(error.errors).map((e) => e.message);
    error = ApiError.badRequest("Validation failed", details);
  } else if (error.name === "CastError") {
    error = ApiError.badRequest(`Invalid ${error.path}: ${error.value}`);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "field";
    error = ApiError.conflict(`${field} already exists`);
  } else if (!(error instanceof ApiError)) {
    error = ApiError.internal(error.message);
  }

  if (env.nodeEnv !== "production" && error.statusCode >= 500) {
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
  });
});

export default app;
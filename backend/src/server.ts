import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import itemsRouter from "./routes/items.js";
import claimsRouter from "./routes/claims.js";
import authRouter from "./routes/auth.js";
import { supabase } from "./config/supabase.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/items", itemsRouter);
app.use("/api/claims", claimsRouter);
app.use("/api/auth", authRouter);

// Health Check Endpoint
app.get("/api/health", async (_req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { count, error } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true });

    const latencyMs = Date.now() - startTime;

    if (error) {
      res.status(500).json({
        status: "degraded",
        database: "error",
        error: error.message,
        latencyMs,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      status: "healthy",
      service: "Findr Express Backend",
      port: PORT,
      database: "connected",
      totalItems: count ?? 0,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      status: "unhealthy",
      error: err.message || "Database connection error",
      timestamp: new Date().toISOString(),
    });
  }
});

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Findr REST API Backend",
    version: "1.0.0",
    docs: "/api/health",
    status: "running",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Findr Express Backend listening on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import auctionRoutes from "./routes/auctions";
import adminRoutes from "./routes/admin";

export function createApp() {
  const app = express();
  const rawOrigins = process.env.CORS_ORIGINS || "";
  const allowedOrigins = rawOrigins
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const corsMiddleware = cors({
    origin(origin, callback) {
      // Allow non-browser and same-origin calls without Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  app.use(corsMiddleware);
  app.options("*", corsMiddleware);
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/auctions", auctionRoutes);
  app.use("/api/admin", adminRoutes);

  return app;
}

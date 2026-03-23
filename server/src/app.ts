import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import auctionRoutes from "./routes/auctions";
import adminRoutes from "./routes/admin";

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/auctions", auctionRoutes);
  app.use("/api/admin", adminRoutes);

  return app;
}

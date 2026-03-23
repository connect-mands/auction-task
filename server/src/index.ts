import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { createApp } from "./app";

const port = Number(process.env.PORT) || 4000;
const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: true, methods: ["GET", "POST"] },
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join", (auctionId: string) => {
    if (typeof auctionId !== "string" || !auctionId.trim()) return;
    socket.join(`auction:${auctionId}`);
  });
  socket.on("leave", (auctionId: string) => {
    if (typeof auctionId !== "string") return;
    socket.leave(`auction:${auctionId}`);
  });
});

async function maybeRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return;
  try {
    const pub = createClient({ url });
    const sub = pub.duplicate();
    await Promise.all([pub.connect(), sub.connect()]);
    io.adapter(createAdapter(pub, sub));
    console.log("Socket.IO using Redis adapter");
  } catch (e) {
    console.warn("Redis adapter skipped:", e);
  }
}

maybeRedis().then(() => {
  httpServer.listen(port, () => {
    console.log(`API listening on ${port}`);
  });
});

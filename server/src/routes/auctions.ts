import { Router } from "express";
import type { Server as IoServer } from "socket.io";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { effectiveStatus, getAuctionById, listAuctions } from "../services/auctions";
import type { AuthedRequest } from "../middleware/requireAuth";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/time", (_req, res) => {
  res.json({ serverTime: new Date().toISOString() });
});

router.get("/", async (req, res) => {
  const q = z.enum(["ongoing", "upcoming", "completed"]).safeParse(req.query.bucket);
  const bucket = q.success ? q.data : "ongoing";
  try {
    const rows = await listAuctions(bucket);
    const now = new Date();
    const payload = rows.map((a) => {
      const status = effectiveStatus(a, now);
      const top = a.bids[0];
      return {
        id: a.id,
        status,
        startsAt: a.startsAt.toISOString(),
        endsAt: a.endsAt.toISOString(),
        item: {
          id: a.item.id,
          title: a.item.title,
          description: a.item.description,
          imageUrl: a.item.imageUrl,
          startingPrice: a.item.startingPrice.toString(),
        },
        currentHighestBid: top
          ? { amount: top.amount.toString(), bidderName: top.user.name, bidId: top.id }
          : null,
      };
    });
    res.json({ auctions: payload, serverTime: now.toISOString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load auctions" });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const a = await getAuctionById(id);
    if (!a) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const now = new Date();
    const status = effectiveStatus(a, now);
    const sortedBids = [...a.bids].sort((x, y) => Number(y.amount) - Number(x.amount));
    const top = sortedBids[0];
    res.json({
      auction: {
        id: a.id,
        status,
        startsAt: a.startsAt.toISOString(),
        endsAt: a.endsAt.toISOString(),
        item: {
          id: a.item.id,
          title: a.item.title,
          description: a.item.description,
          imageUrl: a.item.imageUrl,
          startingPrice: a.item.startingPrice.toString(),
        },
        currentHighestBid: top
          ? { amount: top.amount.toString(), bidderName: top.user.name, bidId: top.id }
          : null,
        recentBids: a.bids.slice(0, 20).map((b) => ({
          id: b.id,
          amount: b.amount.toString(),
          bidderName: b.user.name,
          at: b.createdAt.toISOString(),
        })),
      },
      serverTime: now.toISOString(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load auction" });
  }
});

const bidBody = z.object({ amount: z.coerce.number().positive() });

router.post("/:id/bids", requireAuth, async (req: AuthedRequest, res) => {
  const auctionId = req.params.id;
  const parsed = bidBody.safeParse(req.body);
  if (!parsed.success || !req.user) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const amount = parsed.data.amount;
  const userId = req.user.sub;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: { item: true },
      });
      if (!auction) return { type: "not_found" as const };

      const now = new Date();
      if (auction.endsAt <= now) return { type: "ended" as const };
      if (auction.startsAt > now) return { type: "not_started" as const };

      const top = await tx.bid.findFirst({
        where: { auctionId },
        orderBy: { amount: "desc" },
      });
      const floor = top ? Number(top.amount) : Number(auction.item.startingPrice);
      if (amount <= floor) return { type: "low" as const, floor };

      const bid = await tx.bid.create({
        data: { auctionId, userId, amount },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      await tx.auditLog.create({
        data: {
          auctionId,
          userId,
          action: "BID_PLACED",
          meta: { amount: bid.amount.toString(), bidId: bid.id },
        },
      });

      await tx.auction.update({
        where: { id: auctionId },
        data: { status: "LIVE" },
      });

      return { type: "ok" as const, bid };
    });

    if (result.type === "not_found") {
      res.status(404).json({ error: "Auction not found" });
      return;
    }
    if (result.type === "ended") {
      res.status(400).json({ error: "Auction has ended" });
      return;
    }
    if (result.type === "not_started") {
      res.status(400).json({ error: "Auction has not started yet" });
      return;
    }
    if (result.type === "low") {
      res.status(400).json({ error: `Bid must be higher than ${result.floor}` });
      return;
    }

    const { bid } = result;
    const io = req.app.get("io") as IoServer | undefined;
    if (io) {
      io.to(`auction:${auctionId}`).emit("bid:update", {
        auctionId,
        bid: {
          id: bid.id,
          amount: bid.amount.toString(),
          bidderName: bid.user.name,
          at: bid.createdAt.toISOString(),
        },
      });
    }

    res.status(201).json({
      bid: {
        id: bid.id,
        amount: bid.amount.toString(),
        bidderName: bid.user.name,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not place bid" });
  }
});

export default router;

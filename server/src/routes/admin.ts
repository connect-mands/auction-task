import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import type { AuthedRequest } from "../middleware/requireAuth";
import { requireAdmin, requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth, requireAdmin);

const itemBody = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  startingPrice: z.coerce.number().positive(),
});

router.get("/items", async (_req, res) => {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { auctions: true } } },
  });
  res.json({
    items: items.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      imageUrl: i.imageUrl,
      startingPrice: i.startingPrice.toString(),
      auctionCount: i._count.auctions,
    })),
  });
});

router.post("/items", async (req: AuthedRequest, res) => {
  const parsed = itemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { title, description, imageUrl, startingPrice } = parsed.data;
  const item = await prisma.item.create({
    data: {
      title,
      description,
      imageUrl: imageUrl || null,
      startingPrice,
      createdById: req.user.sub,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: req.user.sub,
      action: "ITEM_CREATED",
      meta: { itemId: item.id, title: item.title },
    },
  });
  res.status(201).json({
    item: {
      id: item.id,
      title: item.title,
      startingPrice: item.startingPrice.toString(),
    },
  });
});

const patchItem = itemBody.partial();

router.patch("/items/:id", async (req: AuthedRequest, res) => {
  const parsed = patchItem.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const data = parsed.data;
  const id = req.params.id;
  try {
    const item = await prisma.item.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
        ...(data.startingPrice !== undefined && { startingPrice: data.startingPrice }),
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.user.sub,
        action: "ITEM_UPDATED",
        meta: { itemId: id },
      },
    });
    res.json({ item: { id: item.id, title: item.title } });
  } catch {
    res.status(404).json({ error: "Item not found" });
  }
});

router.delete("/items/:id", async (req: AuthedRequest, res) => {
  const id = req.params.id;
  try {
    await prisma.item.delete({ where: { id } });
    if (req.user) {
      await prisma.auditLog.create({
        data: { userId: req.user.sub, action: "ITEM_DELETED", meta: { itemId: id } },
      });
    }
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Item not found" });
  }
});

const auctionBody = z.object({
  itemId: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

router.post("/auctions", async (req: AuthedRequest, res) => {
  const parsed = auctionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { itemId, startsAt, endsAt } = parsed.data;
  if (endsAt <= startsAt) {
    res.status(400).json({ error: "endsAt must be after startsAt" });
    return;
  }
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    res.status(400).json({ error: "Unknown item" });
    return;
  }
  const now = new Date();
  let status: "SCHEDULED" | "LIVE" | "ENDED" = "SCHEDULED";
  if (startsAt <= now && endsAt > now) status = "LIVE";
  if (endsAt <= now) status = "ENDED";

  const auction = await prisma.auction.create({
    data: {
      itemId,
      startsAt,
      endsAt,
      status,
    },
  });
  await prisma.auditLog.create({
    data: {
      auctionId: auction.id,
      userId: req.user.sub,
      action: "AUCTION_CREATED",
      meta: { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() },
    },
  });
  res.status(201).json({ auction: { id: auction.id, status: auction.status } });
});

router.get("/auctions", async (_req, res) => {
  const rows = await prisma.auction.findMany({
    orderBy: { createdAt: "desc" },
    include: { item: true },
  });
  const now = new Date();
  res.json({
    auctions: rows.map((a) => ({
      id: a.id,
      status: a.status,
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
      itemTitle: a.item.title,
    })),
    serverTime: now.toISOString(),
  });
});

router.delete("/auctions/:id", async (req: AuthedRequest, res) => {
  const id = req.params.id;
  try {
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          auctionId: id,
          userId: req.user.sub,
          action: "AUCTION_DELETED",
          meta: {},
        },
      });
    }
    await prisma.auction.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

export default router;

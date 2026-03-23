import { prisma } from "../lib/prisma";
import { resolveAuctionStatus } from "../auctionStatus";
import type { AuctionStatus, Prisma } from "@prisma/client";

const auctionInclude = {
  item: true,
  bids: {
    orderBy: { amount: "desc" as const },
    take: 1,
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.AuctionInclude;

export type AuctionWithMeta = Prisma.AuctionGetPayload<{ include: typeof auctionInclude }>;

export async function refreshStaleStatuses(now = new Date()) {
  await prisma.$executeRaw`
    UPDATE "Auction"
    SET status = 'ENDED'
    WHERE "endsAt" <= ${now} AND status <> 'ENDED'
  `;
  await prisma.$executeRaw`
    UPDATE "Auction"
    SET status = 'LIVE'
    WHERE "startsAt" <= ${now} AND "endsAt" > ${now} AND status = 'SCHEDULED'
  `;
}

export function effectiveStatus(
  row: { status: AuctionStatus; startsAt: Date; endsAt: Date },
  now: Date
): AuctionStatus {
  return resolveAuctionStatus(row.status, row.startsAt, row.endsAt, now);
}

export async function listAuctions(bucket: "ongoing" | "upcoming" | "completed") {
  await refreshStaleStatuses();
  const now = new Date();
  const rows = await prisma.auction.findMany({
    where:
      bucket === "upcoming"
        ? { startsAt: { gt: now } }
        : bucket === "ongoing"
          ? { startsAt: { lte: now }, endsAt: { gt: now } }
          : { endsAt: { lte: now } },
    include: auctionInclude,
    orderBy: bucket === "upcoming" ? { startsAt: "asc" } : { endsAt: "desc" },
  });
  return rows;
}

export async function getAuctionById(id: string) {
  await refreshStaleStatuses();
  return prisma.auction.findUnique({
    where: { id },
    include: {
      item: true,
      bids: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

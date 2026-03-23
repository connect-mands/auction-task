import type { AuctionStatus } from "@prisma/client";

/** Derive status from wall clock — keeps UI and rules aligned without a cron. */
export function resolveAuctionStatus(
  status: AuctionStatus,
  startsAt: Date,
  endsAt: Date,
  now: Date
): AuctionStatus {
  if (endsAt <= now) return "ENDED";
  if (startsAt > now) return "SCHEDULED";
  return "LIVE";
}

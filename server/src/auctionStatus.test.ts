import test from "node:test";
import assert from "node:assert/strict";
import { resolveAuctionStatus } from "./auctionStatus";

test("ended when past end", () => {
  const now = new Date("2025-01-15T12:00:00Z");
  const s = resolveAuctionStatus("LIVE", new Date("2025-01-14T10:00:00Z"), new Date("2025-01-15T11:00:00Z"), now);
  assert.equal(s, "ENDED");
});

test("scheduled when before start", () => {
  const now = new Date("2025-01-10T12:00:00Z");
  const s = resolveAuctionStatus("SCHEDULED", new Date("2025-01-20T10:00:00Z"), new Date("2025-01-21T10:00:00Z"), now);
  assert.equal(s, "SCHEDULED");
});

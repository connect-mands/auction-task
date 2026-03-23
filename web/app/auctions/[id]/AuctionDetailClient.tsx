"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useServerClock } from "@/lib/useServerClock";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { getToken } from "@/lib/auth";

type AuctionPayload = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  item: {
    title: string;
    description: string;
    imageUrl: string | null;
    startingPrice: string;
  };
  currentHighestBid: { amount: string; bidderName: string } | null;
  recentBids: { id: string; amount: string; bidderName: string; at: string }[];
};

export function AuctionDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const now = useServerClock();
  const [data, setData] = useState<AuctionPayload | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [bidInput, setBidInput] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ auction: AuctionPayload; serverTime: string }>(`/api/auctions/${id}`, { auth: false })
      .then((d) => {
        if (!cancelled) {
          setData(d.auction);
          setServerTime(d.serverTime);
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const s = getSocket();
    s.emit("join", id);
    function onUpdate(payload: {
      auctionId: string;
      bid: { id: string; amount: string; bidderName: string; at: string };
    }) {
      if (payload.auctionId !== id) return;
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentHighestBid: {
            amount: payload.bid.amount,
            bidderName: payload.bid.bidderName,
          },
          recentBids: [
            {
              id: payload.bid.id,
              amount: payload.bid.amount,
              bidderName: payload.bid.bidderName,
              at: payload.bid.at,
            },
            ...prev.recentBids.filter((b) => b.id !== payload.bid.id),
          ].slice(0, 20),
        };
      });
    }
    s.on("bid:update", onUpdate);
    return () => {
      s.emit("leave", id);
      s.off("bid:update", onUpdate);
    };
  }, [id]);

  async function placeBid(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!getToken()) {
      setMsg("Sign in to bid.");
      router.push(`/login?next=/auctions/${id}`);
      return;
    }
    const n = Number(bidInput);
    if (!Number.isFinite(n) || n <= 0) {
      setMsg("Enter a valid amount.");
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/auctions/${id}/bids`, {
        method: "POST",
        body: JSON.stringify({ amount: n }),
      });
      setBidInput("");
      setMsg("Bid recorded.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not bid");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return <p className="text-muted">Loading…</p>;
  }

  const end = new Date(data.endsAt).getTime();
  const left = end - now();
  const live = data.status === "LIVE" && left > 0;

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="space-y-3">
          {data.item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.item.imageUrl} alt="" className="w-full rounded-xl border border-[var(--border)] object-cover" />
          )}
          <h1 className="text-2xl font-semibold text-ink">{data.item.title}</h1>
          <p className="whitespace-pre-wrap text-muted">{data.item.description}</p>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between border-b border-[var(--border)] py-2">
              <dt className="text-muted">Starting price</dt>
              <dd>${data.item.startingPrice}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] py-2">
              <dt className="text-muted">Current high</dt>
              <dd className="font-medium">
                {data.currentHighestBid ? `$${data.currentHighestBid.amount}` : "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted">Status</dt>
              <dd>{data.status}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Place a bid</h2>
          {live ? (
            <form onSubmit={placeBid} className="mt-3 space-y-3">
              <label className="block text-sm">
                <span className="text-muted">Your bid (USD)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={bidInput}
                  onChange={(e) => setBidInput(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-ink"
                  placeholder="0.00"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-accent py-2 text-paper hover:opacity-95 disabled:opacity-50"
              >
                {busy ? "Sending…" : "Submit bid"}
              </button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-muted">This window is closed for bidding.</p>
          )}
          {msg && <p className="mt-2 text-sm text-ink">{msg}</p>}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted">Recent activity</h2>
          <ul className="mt-2 divide-y divide-[var(--border)]">
            {data.recentBids.length === 0 ? (
              <li className="py-2 text-sm text-muted">No bids yet.</li>
            ) : (
              data.recentBids.map((b) => (
                <li key={b.id} className="flex justify-between py-2 text-sm">
                  <span>
                    <span className="font-medium text-ink">{b.bidderName}</span>{" "}
                    <span className="text-muted">bid ${b.amount}</span>
                  </span>
                  <time className="text-muted" dateTime={b.at}>
                    {new Date(b.at).toLocaleTimeString()}
                  </time>
                </li>
              ))
            )}
          </ul>
        </div>

        {serverTime && (
          <p className="text-xs text-muted">Server clock (for your reference): {new Date(serverTime).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuctionCard, type CardAuction } from "@/components/AuctionCard";
import { apiFetch } from "@/lib/api";

type Bucket = "ongoing" | "upcoming" | "completed";

export default function AuctionsPage() {
  const [bucket, setBucket] = useState<Bucket>("ongoing");
  const [rows, setRows] = useState<CardAuction[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<{ auctions: CardAuction[] }>(`/api/auctions?bucket=${bucket}`, { auth: false })
      .then((d) => {
        if (!cancelled) {
          setRows(d.auctions);
          setErr(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Auction room</h1>
        <p className="mt-1 text-muted">Switch tabs to see what&apos;s running, queued, or finished.</p>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {(
          [
            ["ongoing", "Live now"],
            ["upcoming", "Upcoming"],
            ["completed", "Done"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setBucket(k)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              bucket === k ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {err && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>}

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
          <p className="text-muted">Nothing here yet.</p>
          <p className="mt-2 text-muted">
            If you are admin, create an item and schedule an auction from{" "}
            <Link href="/admin" className="text-accent">
              Admin panel
            </Link>
            . Then this list will show live/upcoming/completed lots.
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((a) => (
            <li key={a.id}>
              <AuctionCard a={a} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

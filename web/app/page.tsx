 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getToken()));
  }, []);

  return (
    <div className="space-y-8">
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          Live auctions without the noise.
        </h1>
        <p className="text-lg text-muted">
          Browse what&apos;s live, what&apos;s coming up, and what&apos;s settled. Bids push out to everyone in the room
          the moment they land.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/auctions"
            className="inline-flex rounded-lg bg-ink px-5 py-2.5 text-paper no-underline hover:bg-ink/90"
          >
            Open auction room
          </Link>
          {loggedIn ? (
            <Link
              href="/auctions"
              className="inline-flex rounded-lg border border-[var(--border)] px-5 py-2.5 text-ink no-underline hover:bg-black/5"
            >
              Continue bidding
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-flex rounded-lg border border-[var(--border)] px-5 py-2.5 text-ink no-underline hover:bg-black/5"
            >
              Create an account
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

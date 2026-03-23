"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "./config";

/** Keeps a rough offset so countdowns match the API clock. */
export function useServerClock() {
  const [skewMs, setSkewMs] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const r = await fetch(`${API_BASE}/api/auctions/time`);
        const j = (await r.json()) as { serverTime: string };
        const server = new Date(j.serverTime).getTime();
        const local = Date.now();
        if (!cancelled) setSkewMs(server - local);
      } catch {
        if (!cancelled) setSkewMs(0);
      }
    }
    sync();
    const id = setInterval(sync, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return useCallback(() => Date.now() + skewMs, [skewMs]);
}

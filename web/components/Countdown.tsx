"use client";

import { useEffect, useState } from "react";
import { useServerClock } from "@/lib/useServerClock";

type Props = { endsAtIso: string; status: string };

function fmt(ms: number) {
  if (ms <= 0) return "0:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function Countdown({ endsAtIso, status }: Props) {
  const now = useServerClock();
  const [label, setLabel] = useState("—");

  useEffect(() => {
    const end = new Date(endsAtIso).getTime();
    function tick() {
      const left = end - now();
      setLabel(fmt(left));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAtIso, now, status]);

  if (status === "ENDED") return <span className="text-muted">Closed</span>;
  return <span className="tabular-nums">{label}</span>;
}

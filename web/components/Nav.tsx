"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getToken, type User } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export function Nav() {
  const path = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setUser(null);
      return;
    }
    apiFetch<{ user: User }>("/api/auth/me", { method: "GET" })
      .then((r) => setUser(r.user))
      .catch(() => setUser(null));
  }, [path]);

  function logout() {
    clearToken();
    setUser(null);
    window.location.href = "/";
  }

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink no-underline">
          Lotline
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/auctions"
            className={`no-underline ${path === "/auctions" ? "text-accent" : "text-muted"}`}
          >
            Auctions
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`no-underline ${path === "/admin" ? "text-accent" : "text-muted"}`}
            >
              Admin
            </Link>
          )}
          {user ? (
            <>
              <span className="text-muted">{user.name}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-[var(--border)] px-2 py-1 text-ink hover:bg-black/5"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted no-underline">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-ink px-3 py-1.5 text-paper no-underline hover:bg-ink/90"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

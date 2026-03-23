"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken, type User } from "@/lib/auth";

type ItemRow = { id: string; title: string; startingPrice: string; auctionCount: number };

export default function AdminPage() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [auctions, setAuctions] = useState<{ id: string; itemTitle: string; status: string }[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startingPrice, setStartingPrice] = useState("10");
  const [itemId, setItemId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [note, setNote] = useState<string | null>(null);

  function load() {
    apiFetch<{ items: ItemRow[] }>("/api/admin/items")
      .then((r) => {
        setItems(r.items);
        if (!itemId && r.items[0]) setItemId(r.items[0].id);
      })
      .catch((e: Error) => setNote(e.message || "Admin access required."));
    apiFetch<{ auctions: { id: string; itemTitle: string; status: string }[] }>("/api/admin/auctions")
      .then((r) => setAuctions(r.auctions))
      .catch(() => {});
  }

  useEffect(() => {
    async function gateAndLoad() {
      if (!getToken()) {
        router.replace("/login?next=/admin");
        return;
      }
      try {
        const me = await apiFetch<{ user: User }>("/api/auth/me");
        if (me.user.role !== "ADMIN") {
          router.replace("/auctions");
          return;
        }
        setHasAdminAccess(true);
      } catch {
        clearToken();
        router.replace("/login?next=/admin");
        return;
      } finally {
        setCheckingAccess(false);
      }
      load();
    }
    gateAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + token gate only
  }, [router]);

  if (checkingAccess) {
    return <p className="text-sm text-muted">Checking admin access…</p>;
  }

  if (!hasAdminAccess) {
    return null;
  }

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    setNote(null);
    try {
      await apiFetch("/api/admin/items", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          imageUrl: imageUrl || undefined,
          startingPrice: Number(startingPrice),
        }),
      });
      setNote("Item saved.");
      setTitle("");
      setDescription("");
      setImageUrl("");
      load();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Error");
    }
  }

  async function createAuction(e: React.FormEvent) {
    e.preventDefault();
    setNote(null);
    if (!itemId || !startsAt || !endsAt) {
      setNote("Pick item and both times.");
      return;
    }
    try {
      await apiFetch("/api/admin/auctions", {
        method: "POST",
        body: JSON.stringify({
          itemId,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
        }),
      });
      setNote("Auction scheduled.");
      load();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Error");
    }
  }

  async function removeAuction(id: string) {
    if (!confirm("Delete this auction?")) return;
    await apiFetch(`/api/admin/auctions/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-muted">Items and schedules. Nothing fancy — just enough to run the room.</p>
      </div>

      {note && <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">{note}</p>}

      <section className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={createItem} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="font-medium">New item</h2>
          <label className="block text-sm">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded border border-[var(--border)] px-2 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="mt-1 w-full rounded border border-[var(--border)] px-2 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Image URL (optional)
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 w-full rounded border border-[var(--border)] px-2 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Starting price
            <input
              type="number"
              step="0.01"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              required
              className="mt-1 w-full rounded border border-[var(--border)] px-2 py-1.5"
            />
          </label>
          <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-paper">
            Save item
          </button>
        </form>

        <form onSubmit={createAuction} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="font-medium">Schedule auction</h2>
          <label className="block text-sm">
            Item
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="mt-1 w-full rounded border border-[var(--border)] px-2 py-1.5"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Starts
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
              className="mt-1 w-full rounded border border-[var(--border)] px-2 py-1.5"
            />
          </label>
          <label className="block text-sm">
            Ends
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
              className="mt-1 w-full rounded border border-[var(--border)] px-2 py-1.5"
            />
          </label>
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-paper">
            Create auction
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Auctions</h2>
        <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {auctions.length === 0 ? (
            <li className="p-3 text-sm text-muted">None yet.</li>
          ) : (
            auctions.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span>
                  {a.itemTitle} — <span className="text-muted">{a.status}</span>
                </span>
                <button type="button" onClick={() => removeAuction(a.id)} className="text-red-700 hover:underline">
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

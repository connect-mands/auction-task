import Link from "next/link";
import { Countdown } from "./Countdown";

export type CardAuction = {
  id: string;
  status: string;
  endsAt: string;
  item: {
    title: string;
    description: string;
    imageUrl: string | null;
    startingPrice: string;
  };
  currentHighestBid: { amount: string; bidderName: string } | null;
};

export function AuctionCard({ a }: { a: CardAuction }) {
  return (
    <article className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:shadow-md">
      <Link href={`/auctions/${a.id}`} className="block no-underline">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
          {a.item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.item.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <h2 className="text-base font-semibold leading-snug text-ink">{a.item.title}</h2>
          <p className="line-clamp-2 text-sm text-muted">{a.item.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="text-muted">High bid</span>
            <span className="font-medium">
              {a.currentHighestBid ? `$${a.currentHighestBid.amount}` : `$${a.item.startingPrice} start`}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-sm">
            <span className="text-muted">Time left</span>
            <Countdown endsAtIso={a.endsAt} status={a.status} />
          </div>
        </div>
      </Link>
    </article>
  );
}

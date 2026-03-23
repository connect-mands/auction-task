import Link from "next/link";
import { AuctionDetailClient } from "./AuctionDetailClient";

export default function AuctionPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <Link href="/auctions" className="text-sm text-muted no-underline hover:text-ink">
        ← Back to auction room
      </Link>
      <AuctionDetailClient id={params.id} />
    </div>
  );
}

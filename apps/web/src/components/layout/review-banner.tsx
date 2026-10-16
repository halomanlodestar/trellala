"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReviewCounts } from "@/hooks/use-review-counts";

/** One red line under the nav while conflicts or failed ingests are waiting. */
export function ReviewBanner() {
  const pathname = usePathname();
  const { data } = useReviewCounts();
  const count = (data?.conflicts ?? 0) + (data?.failed ?? 0);
  if (count === 0 || pathname.startsWith("/review")) return null;

  return (
    <div className="border-b border-destructive/30 bg-destructive/6">
      <Link href="/review" className="page-frame flex h-8 items-center gap-2 text-xs text-destructive">
        <span className="figures font-medium">{count}</span>
        {count === 1 ? "ingest item needs review" : "ingest items need review"}
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

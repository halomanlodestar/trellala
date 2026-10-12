"use client";

import type { ReviewCounts } from "@trellala/core/types";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useReviewCounts } from "@/hooks/use-review-counts";

type Props = { initial: ReviewCounts };

export function ReviewBannerLive({ initial }: Props) {
  const { data } = useReviewCounts(initial);
  if (data.conflicts + data.failed === 0) return null;
  return (
    <Link
      href="/review"
      className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-700 hover:bg-amber-500/15 dark:text-amber-400"
    >
      <ShieldAlert className="size-4" />
      {data.conflicts > 0 && <span>{data.conflicts} conflicts</span>}
      {data.conflicts > 0 && data.failed > 0 && <span>·</span>}
      {data.failed > 0 && <span>{data.failed} failed ingests</span>}
    </Link>
  );
}

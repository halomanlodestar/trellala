"use client";

import { useNow } from "@/hooks/use-now";
import { formatIst } from "@/lib/time";
import { cn } from "@/lib/utils";

type Props = { className?: string };

export function IstClock({ className }: Props) {
  const now = useNow(15_000);
  return (
    <span className={cn("figures text-xs", className)} suppressHydrationWarning>
      {formatIst(now, "EEE d MMM · HH:mm")} IST
    </span>
  );
}

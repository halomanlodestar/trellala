/** @format */

"use client";

import { Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNow } from "@/hooks/use-now";
import { formatIst, formatIstShort, relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";

type Props = { at: Date; className?: string; showIcon?: boolean };

/** IST time with a live countdown; turns amber inside 48h and red when overdue. */
export function Deadline({ at, className, showIcon = true }: Props) {
  const now = useNow();
  const hours = (at.getTime() - now.getTime()) / 36e5;
  const tone =
    hours < 0
      ? "text-destructive"
      : hours < 48
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm whitespace-nowrap tabular-nums",
            tone,
            className,
          )}
          suppressHydrationWarning
        >
          {showIcon && <Clock className="size-3.5" />}
          {relativeTime(at, now)}
        </span>
      </TooltipTrigger>
      <TooltipContent suppressHydrationWarning>
        {formatIst(at)} IST
      </TooltipContent>
    </Tooltip>
  );
}

export function IstTime({ at, short }: { at: Date; short?: boolean }) {
  return (
    <span className="tabular-nums">
      {short ? formatIstShort(at) : formatIst(at)}
    </span>
  );
}

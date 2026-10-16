"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNow } from "@/hooks/use-now";
import { countdown, formatIst, formatIstShort } from "@/lib/time";
import { cn } from "@/lib/utils";

type Props = { at: Date; className?: string; showDate?: boolean };

/** Mono countdown ("5h 40m"); ochre inside 48h, red once past. Full IST time on hover. */
export function Deadline({ at, className, showDate }: Props) {
  const now = useNow();
  const hours = (at.getTime() - now.getTime()) / 36e5;
  const tone = hours < 0 ? "text-destructive" : hours < 48 ? "text-soon" : "text-foreground";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("figures inline-flex flex-col items-end text-sm leading-tight whitespace-nowrap", className)} suppressHydrationWarning>
          <span className={tone}>{countdown(at, now)}</span>
          {showDate && <span className="text-[11px] text-muted-foreground">{formatIstShort(at)}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent suppressHydrationWarning>{formatIst(at)} IST</TooltipContent>
    </Tooltip>
  );
}

export function IstTime({ at, short }: { at: Date; short?: boolean }) {
  return <span className="figures">{short ? formatIstShort(at) : formatIst(at)}</span>;
}

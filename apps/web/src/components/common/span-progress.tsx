"use client";

import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

type Props = { span: { start: Date; end: Date } | null; className?: string };

/** How far "now" is through a hackathon's timeline: a hairline with an ink fill. */
export function SpanProgress({ span, className }: Props) {
  const now = useNow();
  if (!span) return null;
  const total = span.end.getTime() - span.start.getTime();
  const pct = total <= 0 ? (now >= span.end ? 100 : 0) : Math.min(100, Math.max(0, ((now.getTime() - span.start.getTime()) / total) * 100));
  return (
    <div className={cn("relative h-px w-full bg-border", className)} suppressHydrationWarning>
      <div className="absolute inset-y-0 left-0 h-px bg-foreground" style={{ width: `${pct}%` }} />
      <div className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" style={{ left: `${pct}%` }} />
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

type Props = { options: Record<string, string>; value: string; onChange: (value: string) => void };

/** Small-caps words, the chosen one underlined. Used for view switches. */
export function TextToggle({ options, value, onChange }: Props) {
  return (
    <div className="caps flex gap-3" role="group">
      {Object.entries(options).map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn("text-muted-foreground hover:text-foreground", value === v && "text-foreground underline decoration-2 underline-offset-[6px]")}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

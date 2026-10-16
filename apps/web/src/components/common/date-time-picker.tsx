"use client";

import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  /** "yyyy-MM-ddTHH:mm" in IST, or "" / null when empty. */
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  id?: string;
  invalid?: boolean;
  clearable?: boolean;
  placeholder?: string;
};

const QUICK_TIMES = ["09:00", "12:00", "18:00", "23:59"];

/** Date + time picker; values stay as naive IST strings (the schema reads them as IST). */
export function DateTimePicker({ value, onChange, id, invalid, clearable, placeholder = "Pick date" }: Props) {
  const [open, setOpen] = useState(false);
  const [datePart, timePart = "23:59"] = value ? value.split("T") : [];
  const date = datePart ? new Date(`${datePart}T00:00`) : undefined;
  const set = (d: string | undefined, t: string) => onChange(d ? `${d}T${t}` : null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={invalid}
            className={cn("w-full justify-start gap-2 font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="size-4" />
            {date ? `${format(date, "EEE, d MMM yyyy")} · ${timePart}` : placeholder}
          </Button>
        </PopoverTrigger>
        {clearable && value && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => onChange(null)}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(d) => set(d ? format(d, "yyyy-MM-dd") : undefined, timePart)}
          autoFocus
        />
        <div className="flex flex-col gap-2 border-t p-3">
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={timePart}
              className="h-8"
              onChange={(e) => e.target.value && set(datePart ?? format(new Date(), "yyyy-MM-dd"), e.target.value)}
            />
            <span className="text-xs text-muted-foreground">IST</span>
          </div>
          <div className="flex gap-1">
            {QUICK_TIMES.map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={t === timePart ? "secondary" : "ghost"}
                className="h-7 flex-1 px-2 text-xs"
                onClick={() => set(datePart ?? format(new Date(), "yyyy-MM-dd"), t)}
              >
                {t}
              </Button>
            ))}
          </div>
          <Button type="button" size="sm" onClick={() => setOpen(false)} disabled={!value}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

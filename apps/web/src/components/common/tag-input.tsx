/** @format */

"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  id?: string;
};

/** Free-text tags: Enter or comma adds, Backspace on empty removes the last. */
export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add tag",
  id,
}: Props) {
  const [draft, setDraft] = useState("");
  const listId = id ? `${id}-suggestions` : undefined;

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase();

    if (tag && !value.includes(tag)) onChange([...value, tag]);

    setDraft("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring/50">
      {value.map((t) => (
        <span
          key={t}
          className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs"
        >
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            onClick={() => onChange(value.filter((x) => x !== t))}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Input
        id={id}
        list={listId}
        value={draft}
        placeholder={value.length ? "" : placeholder}
        className="h-6 min-w-24 flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) add(v.slice(0, -1));
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
      />
      {listId && (
        <datalist id={listId}>
          {suggestions
            .filter((s) => !value.includes(s))
            .map((s) => (
              <option key={s} value={s} />
            ))}
        </datalist>
      )}
    </div>
  );
}

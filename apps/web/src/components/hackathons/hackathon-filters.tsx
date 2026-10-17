"use client";

import { HACKATHON_MODE_LABEL, HACKATHON_STAGE_LABEL, HACKATHON_TYPE_LABEL } from "@trellala/core/constants";
import { Search } from "lucide-react";
import { TextToggle } from "@/components/common/text-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { filterTrigger, filterTriggerActive, toggleChip } from "@/lib/styles";
import { cn } from "@/lib/utils";
import { TagFilter } from "./tag-filter";

type Props = { tags: string[]; people: { id: string; name: string }[] };

const ALL = "__all";

function FilterSelect({ param, label, options }: { param: string; label: string; options: Record<string, string> }) {
  const filters = useUrlFilters();
  const value = filters.get(param);
  return (
    <Select value={value ?? ALL} onValueChange={(v) => filters.set(param, v === ALL ? null : v)}>
      <SelectTrigger size="sm" className={cn(filterTrigger, value && filterTriggerActive)}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{`Any ${label.toLowerCase()}`}</SelectItem>
        {Object.entries(options).map(([v, text]) => (
          <SelectItem key={v} value={v}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const SORTS = { deadline: "By deadline", priority: "By priority", prize: "By prize", added: "By date added" };
const VIEWS = { list: "List", board: "Board", cards: "Cards" };

export function HackathonFilters({ tags, people }: Props) {
  const filters = useUrlFilters();
  const prize = filters.get("prize") === "true";
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      <label className="mr-2 flex items-center gap-2 border-b border-transparent focus-within:border-foreground">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          defaultValue={filters.get("q") ?? ""}
          placeholder="Search…"
          className="h-7 w-36 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onKeyDown={(e) => e.key === "Enter" && filters.set("q", e.currentTarget.value.trim() || null)}
          onBlur={(e) => filters.set("q", e.currentTarget.value.trim() || null)}
        />
      </label>
      <FilterSelect param="type" label="Type" options={HACKATHON_TYPE_LABEL} />
      <FilterSelect param="mode" label="Mode" options={HACKATHON_MODE_LABEL} />
      <FilterSelect param="stage" label="Stage" options={HACKATHON_STAGE_LABEL} />
      <FilterSelect param="member" label="Member" options={Object.fromEntries(people.map((p) => [p.id, p.name]))} />
      <TagFilter tags={tags} />
      <button type="button" aria-pressed={prize} onClick={() => filters.set("prize", prize ? null : "true")} className={cn(toggleChip, "ml-1")}>
        Prize
      </button>
      <div className="ml-auto flex items-center gap-3">
        <Select value={filters.get("sort") ?? "deadline"} onValueChange={(v) => filters.set("sort", v === "deadline" ? null : v)}>
          <SelectTrigger size="sm" className={filterTrigger}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {Object.entries(SORTS).map(([v, text]) => (
              <SelectItem key={v} value={v}>
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="h-4 w-px bg-border" aria-hidden />
        <TextToggle options={VIEWS} value={filters.get("view") ?? "list"} onChange={(v) => filters.set("view", v === "list" ? null : v)} />
      </div>
    </div>
  );
}

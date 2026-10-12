/** @format */

"use client";

import {
  HACKATHON_MODE_LABEL,
  HACKATHON_STAGE_LABEL,
  HACKATHON_TYPE_LABEL,
} from "@trellala/core/constants";
import { Columns3, Search, Table2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { TagFilter } from "./tag-filter";

type Props = { tags: string[]; people: { id: string; name: string }[] };

const ALL = "__all";

function FilterSelect({
  param,
  label,
  options,
}: {
  param: string;
  label: string;
  options: Record<string, string>;
}) {
  const filters = useUrlFilters();

  return (
    <Select
      value={filters.get(param) ?? ALL}
      onValueChange={(v) => filters.set(param, v === ALL ? null : v)}
    >
      <SelectTrigger size="sm" className="w-32">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{`All ${label.toLowerCase()}`}</SelectItem>
        {Object.entries(options).map(([value, text]) => (
          <SelectItem key={value} value={value}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const SORTS = {
  deadline: "Deadline",
  priority: "Priority",
  prize: "Prize",
  added: "Added",
};

export function HackathonFilters({ tags, people }: Props) {
  const filters = useUrlFilters();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={filters.get("q")}
          placeholder="Search"
          className="h-8 w-44 pl-8"
          onKeyDown={(e) =>
            e.key === "Enter" &&
            filters.set("q", e.currentTarget.value.trim() || null)
          }
          onBlur={(e) => filters.set("q", e.currentTarget.value.trim() || null)}
        />
      </div>
      <FilterSelect param="type" label="Types" options={HACKATHON_TYPE_LABEL} />
      <FilterSelect param="mode" label="Modes" options={HACKATHON_MODE_LABEL} />
      <FilterSelect
        param="stage"
        label="Stages"
        options={HACKATHON_STAGE_LABEL}
      />
      <FilterSelect
        param="member"
        label="Members"
        options={Object.fromEntries(people.map((p) => [p.id, p.name]))}
      />
      <TagFilter tags={tags} />
      <div className="ml-auto flex items-center gap-2">
        <Select
          value={filters.get("sort") ?? "deadline"}
          onValueChange={(v) =>
            filters.set("sort", v === "deadline" ? null : v)
          }
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORTS).map(([v, text]) => (
              <SelectItem key={v} value={v}>
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={filters.get("view") ?? "table"}
          onValueChange={(v) =>
            v && filters.set("view", v === "table" ? null : v)
          }
        >
          <ToggleGroupItem value="table" aria-label="Table">
            <Table2 />
          </ToggleGroupItem>
          <ToggleGroupItem value="board" aria-label="Board">
            <Columns3 />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}

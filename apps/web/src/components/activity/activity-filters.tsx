"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { filterTrigger, filterTriggerActive } from "@/lib/styles";
import { cn } from "@/lib/utils";

type Props = { people: { id: string; name: string }[] };

const ALL = "__all";
const ACTORS = { USER: "People", API_KEY: "API keys", SYSTEM: "System" };
const ACTIONS = ["hackathon", "team", "milestone", "ingest", "conflict", "api_key", "user"];

export function ActivityFilters({ people }: Props) {
  const filters = useUrlFilters();
  const bind = (key: string) => ({
    value: filters.get(key) ?? ALL,
    onValueChange: (v: string) => filters.set(key, v === ALL ? null : v),
  });
  const trigger = (key: string) => cn(filterTrigger, filters.get(key) && filterTriggerActive);

  return (
    <div className="flex flex-wrap gap-1">
      <Select {...bind("actorType")}>
        <SelectTrigger size="sm" className={trigger("actorType")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any actor</SelectItem>
          {Object.entries(ACTORS).map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select {...bind("actorUserId")}>
        <SelectTrigger size="sm" className={trigger("actorUserId")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Anyone</SelectItem>
          {people.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select {...bind("action")}>
        <SelectTrigger size="sm" className={trigger("action")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any action</SelectItem>
          {ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              {a}.*
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

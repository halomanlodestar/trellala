/** @format */

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlFilters } from "@/hooks/use-url-filters";

type Props = { people: { id: string; name: string }[] };

const ALL = "__all";
const ACTORS = { USER: "People", API_KEY: "API keys", SYSTEM: "System" };
const ACTIONS = [
  "hackathon",
  "team",
  "milestone",
  "ingest",
  "conflict",
  "api_key",
  "user",
];

export function ActivityFilters({ people }: Props) {
  const filters = useUrlFilters();
  const bind = (key: string) => ({
    value: filters.get(key) ?? ALL,
    onValueChange: (v: string) => filters.set(key, v === ALL ? null : v),
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Select {...bind("actorType")}>
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All actors</SelectItem>
          {Object.entries(ACTORS).map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select {...bind("actorUserId")}>
        <SelectTrigger size="sm" className="w-36">
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
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All actions</SelectItem>
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

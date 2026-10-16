"use client";

import "@svar-ui/react-gantt/all.css";
import { Gantt, type IApi, Willow, WillowDark } from "@svar-ui/react-gantt";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import type { GanttTask } from "@/types";

type Props = { tasks: GanttTask[]; range: { start: Date; end: Date }; now: Date };

const SCALES = [
  { unit: "month", step: 1, format: "MMMM yyyy" },
  { unit: "day", step: 1, format: (d: Date) => format(d, "d") },
];

const ZOOM = {
  level: 2,
  levels: [
    { minCellWidth: 160, maxCellWidth: 400, scales: [{ unit: "year", step: 1, format: "yyyy" }, { unit: "month", step: 1, format: "MMM" }] },
    { minCellWidth: 80, maxCellWidth: 200, scales: [{ unit: "month", step: 1, format: "MMMM yyyy" }, { unit: "week", step: 1, format: (d: Date) => `W${format(d, "w")}` }] },
    { minCellWidth: 28, maxCellWidth: 90, scales: SCALES },
    { minCellWidth: 40, maxCellWidth: 120, scales: [{ unit: "day", step: 1, format: (d: Date) => format(d, "EEE d MMM") }, { unit: "hour", step: 6, format: "HH:mm" }] },
  ],
};

/** SVAR Gantt: hackathons as summaries, milestones as diamonds, teams as bars. Click a row to open it. */
export function GanttView({ tasks, range, now }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const Theme = resolvedTheme === "dark" ? WillowDark : Willow;
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const markers = useMemo(() => [{ start: now, text: "Today", css: "trellala-today" }], [now]);

  const init = (api: IApi) => {
    api.on("select-task", ({ id }) => {
      const t = byId.get(String(id));
      if (!t) return;
      router.push(t.id.startsWith("t:") ? `/hackathons/${t.hackathonId}/teams/${t.id.slice(2)}` : `/hackathons/${t.hackathonId}`);
    });
  };

  return (
    <div className="trellala-gantt h-[calc(100svh-15rem)] min-h-[420px] overflow-hidden rounded-sm border border-rule bg-card">
      <Theme>
        <Gantt
          tasks={tasks}
          scales={SCALES}
          zoom={ZOOM}
          markers={markers}
          start={range.start}
          end={range.end}
          readonly
          cellHeight={38}
          scaleHeight={34}
          columns={[{ id: "text", header: "Hackathon", flexgrow: 1 }]}
          init={init}
        />
      </Theme>
    </div>
  );
}

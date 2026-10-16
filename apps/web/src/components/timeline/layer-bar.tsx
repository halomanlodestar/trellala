"use client";

import { toggleChip } from "@/lib/styles";
import { TIMELINE_LAYERS } from "@/lib/timeline";
import { cn } from "@/lib/utils";
import type { TimelineLayer, TimelineLayers } from "@/types";

type Props = { layers: TimelineLayers; onToggle: (key: TimelineLayer) => void; onReset: () => void };

export function LayerBar({ layers, onToggle, onReset }: Props) {
  return (
    <div role="group" aria-label="Layers" className="caps flex flex-wrap items-center gap-1.5">
      <span className="mr-1.5 text-muted-foreground">Layers</span>
      {TIMELINE_LAYERS.map(({ key, label }) => (
        <button key={key} type="button" aria-pressed={layers[key]} onClick={() => onToggle(key)} className={toggleChip}>
          {label}
        </button>
      ))}
      <button type="button" onClick={onReset} className={cn(toggleChip, "border-dashed before:hidden")}>
        Reset
      </button>
    </div>
  );
}

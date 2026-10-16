"use client";

import { useMemo, useSyncExternalStore } from "react";
import { TIMELINE_LAYER_DEFAULTS } from "@/lib/timeline";
import type { TimelineLayer, TimelineLayers } from "@/types";

const KEY = "trellala:timeline-layers";
const listeners = new Set<() => void>();
// Kept in memory too, so toggles still work when storage is blocked.
let memory: string | null = null;

function read(): string {
  if (memory !== null) return memory;
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function write(layers: TimelineLayers) {
  memory = JSON.stringify(layers);
  try {
    localStorage.setItem(KEY, memory);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function parse(raw: string): TimelineLayers {
  if (!raw) return TIMELINE_LAYER_DEFAULTS;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return TIMELINE_LAYER_DEFAULTS;
    const out = { ...TIMELINE_LAYER_DEFAULTS };
    for (const key of Object.keys(out) as TimelineLayer[]) {
      const v = (saved as Record<string, unknown>)[key];
      if (typeof v === "boolean") out[key] = v;
    }
    return out;
  } catch {
    return TIMELINE_LAYER_DEFAULTS;
  }
}

/** Which timeline layers are on, remembered per browser. The server always renders the defaults. */
export function useTimelineLayers() {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const layers = useMemo(() => parse(raw), [raw]);
  return {
    layers,
    toggle: (key: TimelineLayer) => write({ ...layers, [key]: !layers[key] }),
    reset: () => write(TIMELINE_LAYER_DEFAULTS),
  };
}

"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { HACKATHON_STAGE_LABEL, HACKATHON_STAGES } from "@trellala/core/constants";
import type { HackathonStage, HackathonSummary } from "@trellala/core/types";
import { type RefObject, useRef, useState } from "react";
import { useSetStage } from "@/hooks/use-set-stage";
import { cn } from "@/lib/utils";
import { HackathonCard } from "./hackathon-card";

type Props = { hackathons: HackathonSummary[] };

/** Stage board; drag a card to another column to change its stage. */
export function HackathonBoard({ hackathons }: Props) {
  const [moved, setMoved] = useState<Record<string, HackathonStage>>({});
  const [dragging, setDragging] = useState<HackathonSummary | null>(null);
  const setStage = useSetStage();
  // The card is a link: swallow the click that follows a drop.
  const lastDrop = useRef(0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const stageOf = (h: HackathonSummary) => moved[h.id] ?? h.stage;

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    lastDrop.current = Date.now();
    const h = hackathons.find((x) => x.id === active.id);
    const stage = over?.id as HackathonStage | undefined;
    if (!h || !stage || stage === stageOf(h)) return;
    const previous = stageOf(h);
    setMoved((m) => ({ ...m, [h.id]: stage }));
    setStage.mutate(
      { hackathonId: h.id, stage },
      { onError: () => setMoved((m) => ({ ...m, [h.id]: previous })) },
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setDragging(hackathons.find((h) => h.id === active.id) ?? null)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="grid gap-6 md:grid-cols-3">
        {HACKATHON_STAGES.map((stage) => (
          <BoardColumn key={stage} stage={stage} items={hackathons.filter((h) => stageOf(h) === stage)} lastDrop={lastDrop} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180 }}>
        {dragging && <HackathonCard hackathon={dragging} compact className="-rotate-1 border-rule shadow-lg" />}
      </DragOverlay>
    </DndContext>
  );
}

function BoardColumn({ stage, items, lastDrop }: { stage: HackathonStage; items: HackathonSummary[]; lastDrop: RefObject<number> }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section
      ref={setNodeRef}
      className={cn("flex min-h-40 flex-col gap-3 rounded-sm transition-colors", isOver && "bg-accent outline-1 outline-offset-4 outline-rule outline-dashed")}
    >
      <h2 className="caps flex items-center gap-3 border-b border-rule pb-2">
        {HACKATHON_STAGE_LABEL[stage]}
        <span className="figures ml-auto text-muted-foreground">{String(items.length).padStart(2, "0")}</span>
      </h2>
      {items.map((h) => (
        <BoardCard key={h.id} hackathon={h} lastDrop={lastDrop} />
      ))}
    </section>
  );
}

function BoardCard({ hackathon, lastDrop }: { hackathon: HackathonSummary; lastDrop: RefObject<number> }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: hackathon.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={cn("touch-none", isDragging && "opacity-30")}
      onClickCapture={(e) => {
        if (Date.now() - lastDrop.current < 250) e.preventDefault();
      }}
    >
      <HackathonCard hackathon={hackathon} compact />
    </div>
  );
}

"use client";

import type { QueueGroup } from "@trellala/core/types";
import { Coffee } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";
import type { QueueGroupMeta } from "@/types";
import { QueueItemCard } from "./queue-item-card";

const GROUPS: QueueGroupMeta = {
  overdue: { label: "Overdue", tone: "late" },
  today: { label: "Today", tone: "soon" },
  soon: { label: "Next 3 days", tone: "plain" },
  week: { label: "This week", tone: "plain" },
  later: { label: "Later", tone: "faint" },
};

type Props = { groups: QueueGroup[] };

export function QueueList({ groups }: Props) {
  // Items ticked off locally disappear right away; the server refresh catches up behind.
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const visible = groups.map((g) => ({ ...g, items: g.items.filter((i) => !hidden.has(i.id)) })).filter((g) => g.items.length > 0);

  if (visible.length === 0) return <EmptyState icon={Coffee} text="Nothing due. Enjoy it." />;

  return (
    <div className="flex flex-col gap-10">
      <AnimatePresence initial={false}>
        {visible.map((g) => {
          const meta = GROUPS[g.key];
          return (
            <motion.section key={g.key} layout exit={{ opacity: 0 }}>
              <h2
                className={cn(
                  "caps flex items-center gap-3 py-2",
                  meta.tone === "late" ? "text-destructive" : meta.tone === "soon" ? "text-soon" : "text-muted-foreground",
                )}
              >
                {meta.label}
                <span className={cn("h-px flex-1", meta.tone === "late" ? "bg-destructive/40" : "bg-rule/80")} />
                <span className="figures">{String(g.items.length).padStart(2, "0")}</span>
              </h2>
              <ol>
                <AnimatePresence initial={false}>
                  {g.items.map((item) => (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
                      className="border-b last:border-b-0"
                    >
                      <QueueItemCard
                        item={item}
                        tone={meta.tone}
                        onHide={() => setHidden((s) => new Set(s).add(item.id))}
                        onRestore={() =>
                          setHidden((s) => {
                            const n = new Set(s);
                            n.delete(item.id);
                            return n;
                          })
                        }
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
            </motion.section>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

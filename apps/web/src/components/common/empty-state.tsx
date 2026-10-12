/** @format */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = { icon: LucideIcon; text: string; action?: ReactNode };

export function EmptyState({ icon: Icon, text, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-14 text-muted-foreground">
      <Icon className="size-8" />
      <p className="text-sm">{text}</p>
      {action}
    </div>
  );
}

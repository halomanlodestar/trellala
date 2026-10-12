/** @format */

import type { NextAction } from "@trellala/core/types";
import { Deadline } from "@/components/common/deadline";

type Props = { action: NextAction | null };

export function NextActionCell({ action }: Props) {
  if (!action) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col">
      <span className="text-sm">{action.title}</span>
      <Deadline at={action.endsAt} className="text-xs" />
    </div>
  );
}

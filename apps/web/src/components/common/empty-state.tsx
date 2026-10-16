import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = { icon: LucideIcon; text: string; action?: ReactNode };

export function EmptyState({ icon: Icon, text, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 border-y py-16 text-center">
      <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
      <p className="font-serif text-2xl text-muted-foreground italic">{text}</p>
      {action}
    </div>
  );
}

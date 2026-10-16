import type { ReactNode } from "react";

type Props = { label: string; sub?: ReactNode; children: ReactNode };

/** One cell of the header's fact strip: caps label, large value, muted note. */
export function Fact({ label, sub, children }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-1 py-3 sm:px-4 sm:first:pl-0">
      <dt className="caps text-muted-foreground">{label}</dt>
      <dd className="truncate text-xl leading-tight">{children}</dd>
      {sub && <dd className="truncate text-xs text-muted-foreground">{sub}</dd>}
    </div>
  );
}

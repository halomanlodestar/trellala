import type { ReactNode } from "react";

type Props = { title: ReactNode; actions?: ReactNode; children?: ReactNode };

export function PageHeader({ title, actions, children }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

import type { ReactNode } from "react";

type Props = { children: ReactNode; actions?: ReactNode };

/** Serif section title sitting on the rule of the list beneath it. */
export function SectionHead({ children, actions }: Props) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3">
      <h2 className="font-serif text-2xl leading-none">{children}</h2>
      {actions}
    </div>
  );
}

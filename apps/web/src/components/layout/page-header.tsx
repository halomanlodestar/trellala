import type { ReactNode } from "react";

type Props = { title: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode };

/** Serif page title over a solid rule; filters (children) sit just under the rule. */
export function PageHeader({ title, description, actions, children }: Props) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-rule pb-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-serif text-4xl leading-[0.95] tracking-tight md:text-5xl">{title}</h1>
          {description && <p className="caps text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="border-b py-2.5">{children}</div>}
    </div>
  );
}

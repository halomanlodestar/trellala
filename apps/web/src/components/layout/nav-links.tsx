import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

type Props = { pathname?: string };

/** Nav links; `pathname` marks the active one (omitted in the static fallback). */
export function NavLinks({ pathname }: Props) {
  return (
    <nav className="-mx-1 flex min-w-0 items-center gap-0.5 overflow-x-auto">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = pathname !== undefined && (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              active && "bg-accent font-medium text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden lg:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

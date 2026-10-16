"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReviewCounts } from "@/hooks/use-review-counts";
import { cn } from "@/lib/utils";
import { isActive, NAV_ITEMS } from "./nav-items";

export function MastheadNav() {
  const pathname = usePathname();
  const { data } = useReviewCounts();
  const reviewCount = (data?.conflicts ?? 0) + (data?.failed ?? 0);

  return (
    <nav className="border-b">
      <ul className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 [scrollbar-width:none] md:px-8">
        {NAV_ITEMS.map(({ href, label, exact, badge }) => {
          const active = isActive(pathname, href, exact);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "caps -mb-px flex h-9 items-center gap-1.5 border-b-2 border-transparent text-muted-foreground transition-colors hover:text-foreground",
                  active && "border-foreground text-foreground",
                )}
              >
                {label}
                {badge === "review" && reviewCount > 0 && <span className="figures text-destructive">{reviewCount}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

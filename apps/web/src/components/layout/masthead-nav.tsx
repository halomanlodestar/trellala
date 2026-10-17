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
  return <NavLinks pathname={pathname} reviewCount={reviewCount} />;
}

/** Same nav with nothing highlighted: the prerendered shell until the pathname is known. */
export function MastheadNavFallback() {
  return <NavLinks pathname={null} reviewCount={0} />;
}

type Props = { pathname: string | null; reviewCount: number };

function NavLinks({ pathname, reviewCount }: Props) {
  return (
    <nav className="border-b">
      <ul className="page-frame flex gap-5 overflow-x-auto scrollbar-none">
        {NAV_ITEMS.map(({ href, label, exact, badge }) => {
          const active = pathname !== null && isActive(pathname, href, exact);
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

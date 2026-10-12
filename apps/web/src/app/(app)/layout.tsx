import { Trophy } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AppNav } from "@/components/layout/app-nav";
import { NavLinks } from "@/components/layout/nav-links";
import { ReviewBanner } from "@/components/layout/review-banner";
import { UserMenu } from "@/components/layout/user-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-1.5 font-semibold" aria-label="Trellala">
            <Trophy className="size-5" />
            <span className="hidden sm:inline">Trellala</span>
          </Link>
          <Suspense fallback={<NavLinks />}>
            <AppNav />
          </Suspense>
          <div className="ml-auto shrink-0">
            <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
      <Suspense fallback={null}>
        <ReviewBanner />
      </Suspense>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}

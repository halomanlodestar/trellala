import Link from "next/link";
import { Suspense } from "react";
import { CommandMenu } from "./command-menu";
import { IstClock } from "./ist-clock";
import { MastheadNav } from "./masthead-nav";
import { ReviewBanner } from "./review-banner";
import { UserMenu } from "./user-menu";

/** Newspaper-style masthead: wordmark + clock, a double rule, then the section nav. */
export function Masthead() {
  return (
    <header className="sticky top-0 z-30 bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 md:px-8">
        <Link href="/" className="font-serif text-[1.75rem] leading-none tracking-tight italic">
          Trellala
        </Link>
        <IstClock className="hidden text-muted-foreground md:block" />
        <div className="ml-auto flex items-center gap-2">
          <CommandMenu />
          <Suspense fallback={<span className="size-7" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="h-1 border-y border-rule" />
      </div>
      <MastheadNav />
      <ReviewBanner />
    </header>
  );
}

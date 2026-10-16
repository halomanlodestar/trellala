"use client";

import { HACKATHON_TYPE_LABEL } from "@trellala/core/constants";
import { Archive, Moon, Plus, Search, Sun, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkey";
import { useSearchIndex } from "@/hooks/use-search-index";
import { NAV_ITEMS } from "./nav-items";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: hackathons = [] } = useSearchIndex(open);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  useHotkey("k", toggle);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => setOpen(true)} aria-label="Search">
        <Search />
        <span className="hidden sm:inline">Search</span>
        <Kbd className="hidden border bg-transparent font-mono sm:inline-flex">⌘K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to…" />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup heading="Hackathons">
            {hackathons.map((h) => (
              <CommandItem key={h.id} value={`${h.name} ${h.tags.join(" ")} ${h.type}`} onSelect={() => go(`/hackathons/${h.id}`)}>
                {h.archived ? <Archive className="text-muted-foreground" /> : <Trophy />}
                <span className="truncate">{h.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{HACKATHON_TYPE_LABEL[h.type]}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Go to">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <CommandItem key={href} value={`go ${label}`} onSelect={() => go(href)}>
                <Icon /> {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem value="new hackathon" onSelect={() => go("/hackathons/new")}>
              <Plus /> New hackathon
            </CommandItem>
            <CommandItem
              value="toggle theme dark light"
              onSelect={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
            >
              {resolvedTheme === "dark" ? <Sun /> : <Moon />} Toggle theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

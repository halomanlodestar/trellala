import { Activity, Archive, CalendarRange, LayoutGrid, ListTodo, ShieldAlert, User, Users } from "lucide-react";
import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Queue", icon: ListTodo, exact: true },
  { href: "/hackathons", label: "Hackathons", icon: LayoutGrid },
  { href: "/timeline", label: "Timeline", icon: CalendarRange },
  { href: "/me", label: "My work", icon: User },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/review", label: "Review", icon: ShieldAlert, badge: "review" },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/people", label: "People", icon: Users },
];

export const isActive = (pathname: string | null, href: string, exact?: boolean) =>
  pathname !== null && (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

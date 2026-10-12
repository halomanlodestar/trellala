import { Activity, Archive, CalendarRange, LayoutList, ListTodo, ShieldAlert, User, Users } from "lucide-react";
import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Queue", icon: ListTodo, exact: true },
  { href: "/hackathons", label: "Hackathons", icon: LayoutList },
  { href: "/timeline", label: "Timeline", icon: CalendarRange },
  { href: "/me", label: "Mine", icon: User },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/review", label: "Review", icon: ShieldAlert },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/people", label: "People", icon: Users },
];

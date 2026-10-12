"use client";

import { usePathname } from "next/navigation";
import { NavLinks } from "./nav-links";

export function AppNav() {
  return <NavLinks pathname={usePathname()} />;
}

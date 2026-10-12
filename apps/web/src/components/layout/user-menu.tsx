import { getSessionUser } from "@/server/auth";
import { UserMenuDropdown } from "./user-menu-dropdown";

export async function UserMenu() {
  const user = await getSessionUser();
  return user ? <UserMenuDropdown user={user} /> : null;
}

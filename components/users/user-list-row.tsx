import { getTranslations } from "next-intl/server";

import { UserListRowPresentational } from "./user-list-row-presentational";
import type { UserRow } from "./types";

export interface UserListRowProps {
  user: UserRow;
  variant: "table" | "mobile";
}

export async function UserListRowView({ user, variant }: UserListRowProps) {
  const tUsers = await getTranslations("users");

  return (
    <UserListRowPresentational
      user={user}
      variant={variant}
      labels={{ role: tUsers(`roles.${user.roleType}`) }}
    />
  );
}

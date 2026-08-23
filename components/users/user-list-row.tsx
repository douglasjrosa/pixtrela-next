import { getTranslations } from "next-intl/server";

import { UserListRowPresentational } from "./user-list-row-presentational";
import type { UserRow } from "./types";

export interface UserListRowProps {
  user: UserRow;
  variant: "table" | "mobile";
  showCheckboxColumn?: boolean;
}

export async function UserListRowView({
  user,
  variant,
  showCheckboxColumn = false,
}: UserListRowProps) {
  const tUsers = await getTranslations("users");
  const tCommon = await getTranslations("common");

  return (
    <UserListRowPresentational
      user={user}
      variant={variant}
      labels={{
        role: tUsers(`roles.${user.roleType}`),
        selectRow: tCommon("selectRow", { name: user.name }),
        inactive: tUsers("inactive"),
      }}
      showCheckboxColumn={showCheckboxColumn}
    />
  );
}

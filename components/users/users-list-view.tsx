"use client";

import { useTranslations } from "next-intl";

import { UserListRow } from "./user-list-row";
import type { UserRow } from "./types";

export interface UsersListViewProps {
  users: UserRow[];
  manageableRoles: UserRow["roleType"][];
  onOpen: (user: UserRow) => void;
}

function canEditUser(
  user: UserRow,
  manageableRoles: UserRow["roleType"][],
): boolean {
  return manageableRoles.includes(user.roleType);
}

export function UsersListView({
  users,
  manageableRoles,
  onOpen,
}: UsersListViewProps) {
  const tUsers = useTranslations("users");

  if (users.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-sm">{tUsers("empty")}</p>
    );
  }

  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">{tUsers("name")}</th>
            <th>{tUsers("code")}</th>
            <th>{tUsers("role")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserListRow
              key={user.documentId}
              user={user}
              variant="table"
              canEdit={canEditUser(user, manageableRoles)}
              onOpen={onOpen}
            />
          ))}
        </tbody>
      </table>

      <ul className="md:hidden">
        {users.map((user) => (
          <UserListRow
            key={user.documentId}
            user={user}
            variant="mobile"
            canEdit={canEditUser(user, manageableRoles)}
            onOpen={onOpen}
          />
        ))}
      </ul>
    </>
  );
}

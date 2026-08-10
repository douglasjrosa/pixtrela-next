"use client";

import { useTranslations } from "next-intl";

import { ListEmptyMessage } from "@/components/ui/list-empty-message";

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
    return <ListEmptyMessage>{tUsers("empty")}</ListEmptyMessage>;
  }

  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b text-left">
            <th className="w-12 py-2 pr-3" aria-hidden />
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

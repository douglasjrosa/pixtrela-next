"use client";

import { cn } from "@/lib/utils";

import { UserListAvatar } from "./user-list-avatar";
import { useUserList } from "./user-list-context";
import type { UserRow } from "./types";

const CENTER_CELL_CLASS = "text-center";

export type UserListRowLabels = {
  role: string;
};

export interface UserListRowPresentationalProps {
  user: UserRow;
  variant: "table" | "mobile";
  labels: UserListRowLabels;
}

export function UserListRowPresentational({
  user,
  variant,
  labels,
}: UserListRowPresentationalProps) {
  const { openEdit, canEdit } = useUserList();
  const editable = canEdit(user);

  const nameNode = editable ? (
    <button
      type="button"
      className="text-left font-medium hover:underline"
      onClick={() => openEdit(user)}
    >
      {user.name}
    </button>
  ) : (
    <span className="font-medium">{user.name}</span>
  );

  if (variant === "table") {
    return (
      <tr className={cn("border-b", editable && "hover:bg-muted/40")}>
        <td className="w-12 py-2 pr-3">
          <UserListAvatar name={user.name} avatarUrl={user.avatarUrl} />
        </td>
        <td className="py-2">{nameNode}</td>
        <td className={CENTER_CELL_CLASS}>{user.code}</td>
        <td className={CENTER_CELL_CLASS}>{labels.role}</td>
      </tr>
    );
  }

  return (
    <li
      className={cn(
        "list-none border-b py-3",
        editable && "hover:bg-muted/40",
      )}
    >
      <div className="flex items-center gap-3">
        <UserListAvatar name={user.name} avatarUrl={user.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="text-base">{nameNode}</div>
          <div className="text-muted-foreground text-sm">{user.code}</div>
          <div className="text-muted-foreground text-sm">{labels.role}</div>
        </div>
      </div>
    </li>
  );
}

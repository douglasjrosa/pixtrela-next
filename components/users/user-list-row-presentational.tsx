"use client";

import { cn } from "@/lib/utils";
import { useListRowActivateInteraction } from "@/lib/ui/list-row-interaction";

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
  const { interactive, activate, ...a11yProps } = useListRowActivateInteraction(
    user.name,
    () => openEdit(user),
    editable,
  );

  if (variant === "table") {
    return (
      <tr
        className={cn(
          "border-b",
          interactive && "cursor-pointer hover:bg-muted/40",
        )}
        onClick={activate}
        {...a11yProps}
      >
        <td className="w-12 py-2 pr-3">
          <UserListAvatar name={user.name} avatarUrl={user.avatarUrl} />
        </td>
        <td className="py-2">
          <span className="font-medium">{user.name}</span>
        </td>
        <td className={CENTER_CELL_CLASS}>{user.code ?? "—"}</td>
        <td className={CENTER_CELL_CLASS}>{labels.role}</td>
      </tr>
    );
  }

  return (
    <li
      className={cn(
        "list-none border-b py-3",
        interactive && "cursor-pointer hover:bg-muted/40",
      )}
      onClick={activate}
      {...a11yProps}
    >
      <div className="flex items-center gap-3">
        <UserListAvatar name={user.name} avatarUrl={user.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="text-base font-medium">{user.name}</div>
          <div className="text-muted-foreground text-sm">
            {user.code ?? "—"}
          </div>
          <div className="text-muted-foreground text-sm">{labels.role}</div>
        </div>
      </div>
    </li>
  );
}

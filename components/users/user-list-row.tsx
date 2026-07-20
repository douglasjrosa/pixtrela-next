import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { UserRow } from "./types";

export interface UserListRowProps {
  user: UserRow;
  variant: "table" | "mobile";
  canEdit: boolean;
  onOpen: (user: UserRow) => void;
}

export function UserListRow({
  user,
  variant,
  canEdit,
  onOpen,
}: UserListRowProps) {
  const tUsers = useTranslations("users");
  const roleLabel = tUsers(`roles.${user.roleType}`);

  function openUser(): void {
    if (!canEdit) return;
    onOpen(user);
  }

  const interaction = canEdit
    ? {
        tabIndex: 0 as const,
        role: "link" as const,
        "aria-label": user.name,
        onClick: openUser,
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openUser();
          }
        },
      }
    : {};

  const rowClassName = cn(
    "border-b",
    canEdit &&
      "cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
  );

  if (variant === "table") {
    return (
      <tr {...interaction} className={rowClassName}>
        <td className="py-2">{user.name}</td>
        <td>{user.code}</td>
        <td>{roleLabel}</td>
      </tr>
    );
  }

  return (
    <li {...interaction} className={cn("list-none py-3", rowClassName)}>
      <div className="text-base font-medium">{user.name}</div>
      <div className="text-muted-foreground text-sm">{user.code}</div>
      <div className="text-muted-foreground text-sm">{roleLabel}</div>
    </li>
  );
}

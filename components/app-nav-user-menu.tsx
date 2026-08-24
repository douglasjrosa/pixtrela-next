"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { UserListAvatar } from "@/components/users/user-list-avatar";
import { cn } from "@/lib/utils";

export interface AppNavUserMenuProps {
  userName: string;
  avatarUrl?: string | null;
  profileHref?: string | null;
  onSignOut: () => void;
}

export function AppNavUserMenu({
  userName,
  avatarUrl,
  profileHref,
  onSignOut,
}: AppNavUserMenuProps) {
  const t = useTranslations();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent): void {
      const root = rootRef.current;
      if (!root?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function close(): void {
    setOpen(false);
  }

  function toggle(): void {
    setOpen((current) => !current);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className={
          "rounded-full ring-offset-background transition-shadow " +
          "hover:ring-2 hover:ring-ring hover:ring-offset-2 " +
          "focus-visible:outline-none focus-visible:ring-2 " +
          "focus-visible:ring-ring focus-visible:ring-offset-2"
        }
        aria-label={`${userName}, ${t("nav.openAccountMenu")}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={toggle}
      >
        <UserListAvatar name={userName} avatarUrl={avatarUrl} />
      </button>

      <div
        id={menuId}
        role="menu"
        aria-hidden={!open}
        className={cn(
          "absolute right-0 top-[calc(100%+0.25rem)] z-[70] min-w-[11rem] " +
            "overflow-hidden rounded-md border bg-background shadow-md " +
            "transition-all duration-200 ease-out origin-top",
          open
            ? "pointer-events-auto translate-y-0 scale-y-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-y-95 opacity-0",
        )}
      >
        <div className="border-b px-3 py-2">
          <p className="font-heading truncate text-sm font-semibold">
            {userName}
          </p>
        </div>
        {profileHref ? (
          <Link
            href={profileHref}
            role="menuitem"
            className={
              "flex min-h-10 items-center px-3 text-sm hover:bg-muted"
            }
            onClick={close}
          >
            {t("profile.title")}
          </Link>
        ) : null}
        <button
          type="button"
          role="menuitem"
          className={
            "flex min-h-10 w-full items-center px-3 text-left text-sm " +
            "hover:bg-muted"
          }
          onClick={() => {
            close();
            onSignOut();
          }}
        >
          {t("auth.signOut")}
        </button>
      </div>
    </div>
  );
}

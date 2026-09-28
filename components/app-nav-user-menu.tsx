"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { UserListAvatar } from "@/components/users/user-list-avatar";
import { APP_MENU_FONT_CLASS } from "@/lib/ui/app-menu-typography";
import { cn } from "@/lib/utils";

const ACCOUNT_MENU_ITEM_CLASS =
  `flex min-h-16 w-full items-center justify-center px-4 py-6 ${APP_MENU_FONT_CLASS} ` +
  "hover:bg-muted";

export interface AppNavUserMenuProps {
  userName: string;
  avatarUrl?: string | null;
  profileHref?: string | null;
  showSignOut?: boolean;
  accountExtras?: ReactNode;
  onSignOut: () => void;
}

export function AppNavUserMenu({
  userName,
  avatarUrl,
  profileHref,
  showSignOut = true,
  accountExtras = null,
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
    <>
      {open ? (
        <div
          data-testid="account-menu-backdrop"
          className="fixed inset-0 z-[65] bg-overlay/50"
          aria-hidden
          onClick={close}
        />
      ) : null}
      <div ref={rootRef} className="relative z-[70] shrink-0">
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
          "absolute right-0 top-[calc(100%+0.25rem)] min-w-80 " +
            "overflow-hidden rounded-md border bg-background shadow-md " +
            "transition-all duration-200 ease-out origin-top",
          open
            ? "pointer-events-auto translate-y-0 scale-y-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-y-95 opacity-0",
        )}
      >
        <div className="border-b px-4 py-3 text-center">
          <p
            className={cn(
              "font-heading truncate font-semibold uppercase",
              APP_MENU_FONT_CLASS,
            )}
          >
            {userName}
          </p>
        </div>
        {accountExtras ? (
          <div className="flex justify-center border-b px-4">{accountExtras}</div>
        ) : null}
        {profileHref ? (
          <Link
            href={profileHref}
            role="menuitem"
            className={cn(ACCOUNT_MENU_ITEM_CLASS, "text-center")}
            onClick={close}
          >
            {t("profile.title")}
          </Link>
        ) : null}
        {showSignOut ? (
          <button
            type="button"
            role="menuitem"
            className={cn(ACCOUNT_MENU_ITEM_CLASS, "text-center")}
            onClick={() => {
              close();
              onSignOut();
            }}
          >
            {t("auth.signOut")}
          </button>
        ) : null}
      </div>
    </div>
    </>
  );
}

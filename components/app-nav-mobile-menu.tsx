"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  isAppNavLinkActive,
  type AppNavLinkActiveOptions,
} from "@/lib/auth/is-app-nav-link-active";
import type { ResolvedNavItem } from "@/lib/auth/nav";
import { APP_NAV_LINK_SURFACE_CLASS } from "@/lib/ui/app-nav-link-styles";
import { APP_MENU_FONT_CLASS } from "@/lib/ui/app-menu-typography";
import { cn } from "@/lib/utils";

export interface AppNavMobileMenuProps {
  open: boolean;
  items: ResolvedNavItem[];
  onOpenChange: (open: boolean) => void;
  extras?: ReactNode;
  linkActiveOptions?: AppNavLinkActiveOptions;
}

function mobileNavLinkClass(isActive: boolean): string {
  return cn(
    "inline-flex min-h-12 w-full max-w-xs items-center justify-center " +
      `rounded-md px-4 py-3 font-medium transition-colors ${APP_MENU_FONT_CLASS}`,
    isActive
      ? APP_NAV_LINK_SURFACE_CLASS
      : "text-foreground hover:bg-muted/60",
  );
}

export function AppNavMobileMenu({
  open,
  items,
  onOpenChange,
  extras = null,
  linkActiveOptions,
}: AppNavMobileMenuProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onOpenChange(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  function close(): void {
    onOpenChange(false);
  }

  function linkIsActive(href: string): boolean {
    return isAppNavLinkActive(pathname, href, linkActiveOptions);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-start bg-overlay/50"
      role="presentation"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          "flex h-full w-full flex-col border-r bg-background shadow-lg " +
          "sm:max-w-sm"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex items-center justify-center border-b px-4 py-4">
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-4 size-10"
            aria-label={t("nav.closeMenu")}
            onClick={close}
          >
            <X className="size-6" aria-hidden />
          </Button>
          <h2
            id={titleId}
            className={cn("font-semibold uppercase", APP_MENU_FONT_CLASS)}
          >
            {t("nav.menuTitle")}
          </h2>
        </div>

        <nav
          className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-6"
          aria-label={t("nav.menuTitle")}
        >
          <ul className="flex w-full max-w-xs flex-col items-center gap-4">
            {items.map((item) => {
              const active = linkIsActive(item.href);
              return (
                <li key={item.href} className="flex w-full justify-center">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={mobileNavLinkClass(active)}
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {extras ? (
            <div className="mt-6 flex w-full max-w-xs justify-center border-t pt-6">
              {extras}
            </div>
          ) : null}
        </nav>
      </div>
    </div>
  );
}

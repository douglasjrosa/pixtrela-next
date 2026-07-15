"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { NavItem } from "@/lib/auth/nav";

export interface AppNavMobileMenuProps {
  open: boolean;
  items: NavItem[];
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
}

export function AppNavMobileMenu({
  open,
  items,
  onOpenChange,
  onSignOut,
}: AppNavMobileMenuProps) {
  const t = useTranslations();
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

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-black/50"
      role="presentation"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          "flex h-full w-full max-w-sm flex-col border-l bg-background " +
          "shadow-lg"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold">
            {t("nav.menuTitle")}
          </h2>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("nav.closeMenu")}
            onClick={close}
          >
            <X aria-hidden />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2" aria-label={t("nav.menuTitle")}>
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    "flex min-h-11 items-center rounded-md px-3 text-base " +
                    "hover:bg-muted"
                  }
                  onClick={close}
                >
                  {t(`nav.${item.labelKey}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t p-4">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full"
            onClick={onSignOut}
          >
            {t("auth.signOut")}
          </Button>
        </div>
      </div>
    </div>
  );
}

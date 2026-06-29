"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { KioskSessionExitButton } from "./kiosk-session-exit-button";

export interface KioskStaffHomeProps {
  userId: string;
  canSignOut: boolean;
}

export function KioskStaffHome({ userId, canSignOut }: KioskStaffHomeProps) {
  const t = useTranslations("kiosk");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <h1 className="text-xl font-semibold">{t("staffTitle")}</h1>
        <KioskSessionExitButton visible={canSignOut} />
      </header>
      <nav className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/kiosk/staff/${userId}/users`}
          className={cn(buttonVariants(), "justify-center")}
        >
          {t("usersPage")}
        </Link>
      </nav>
    </div>
  );
}

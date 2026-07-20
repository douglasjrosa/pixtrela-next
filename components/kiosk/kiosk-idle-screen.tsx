"use client";

import { Contact } from "lucide-react";
import { useTranslations } from "next-intl";

export function KioskIdleScreen() {
  const t = useTranslations("kiosk");

  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
      <Contact
        className="size-20 animate-pulse text-[var(--star-gold)]"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="max-w-xs text-lg font-medium leading-snug">{t("idleMessage")}</p>
    </div>
  );
}

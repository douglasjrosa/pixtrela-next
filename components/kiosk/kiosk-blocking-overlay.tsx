"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function KioskBlockingOverlay() {
  const t = useTranslations("kiosk");

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-background/70"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-5 shadow-lg">
        <Loader2
          className="size-10 animate-spin text-primary"
          aria-hidden
        />
        <p className="text-base font-medium">{t("actionLoading")}</p>
      </div>
    </div>
  );
}

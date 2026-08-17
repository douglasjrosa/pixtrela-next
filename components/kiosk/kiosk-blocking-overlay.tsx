"use client";

import { useTranslations } from "next-intl";

export function KioskBlockingOverlay() {
  const t = useTranslations("kiosk");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-5 shadow-lg">
        <span
          className="kiosk-blocking-spinner size-10 rounded-full border-4 border-primary/20 border-t-primary"
          aria-hidden
        />
        <p className="text-base font-medium">{t("actionLoading")}</p>
      </div>
    </div>
  );
}

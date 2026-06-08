"use client";

import { useTranslations } from "next-intl";

export function KioskIdleScreen() {
  const t = useTranslations("kiosk");

  return (
    <div
      role="status"
      className="flex items-center justify-center px-6 py-10 text-center"
    >
      <p className="text-lg font-medium">{t("idleMessage")}</p>
    </div>
  );
}

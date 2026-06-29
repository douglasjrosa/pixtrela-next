"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { LOGIN_PATH } from "@/lib/auth/colaborator-routes";

export interface KioskSessionExitButtonProps {
  visible: boolean;
}

export function KioskSessionExitButton({ visible }: KioskSessionExitButtonProps) {
  const t = useTranslations("kiosk");

  if (!visible) return null;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => signOut({ callbackUrl: LOGIN_PATH })}
    >
      {t("exitSession")}
    </Button>
  );
}

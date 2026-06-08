"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function ColaboratorHeader() {
  const t = useTranslations();

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <span className="font-bold">{t("app.name")}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        {t("auth.signOut")}
      </Button>
    </header>
  );
}

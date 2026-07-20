"use client";

import { Star } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function ColaboratorHeader() {
  const t = useTranslations();

  return (
    <header
      className={
        "relative z-10 flex items-center justify-between border-b " +
        "bg-card px-4 py-3 shadow-sm"
      }
    >
      <div className="flex items-center gap-2">
        <Star
          className="size-5 fill-[var(--star-gold)] text-[var(--star-gold)]"
          aria-hidden
        />
        <span className="text-lg font-bold">{t("app.name")}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="min-h-10 rounded-2xl"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        {t("auth.signOut")}
      </Button>
    </header>
  );
}

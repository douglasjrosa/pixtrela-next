"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

import { AppBrandLink } from "@/components/app-brand-link";
import { Button } from "@/components/ui/button";
import { buildProfilePath } from "@/lib/profile/profile-path";

export interface ColaboratorHeaderProps {
  userId?: string;
  homeHref?: string;
}

export function ColaboratorHeader({
  userId,
  homeHref = "/",
}: ColaboratorHeaderProps) {
  const t = useTranslations();

  return (
    <header
      className={
        "relative z-10 flex items-center justify-between border-b " +
        "bg-card px-4 py-3 shadow-sm"
      }
    >
      <div className="flex items-center gap-3">
        <AppBrandLink href={homeHref} nameClassName="text-lg" />
        {userId ? (
          <Link
            href={buildProfilePath(userId)}
            className="text-sm font-medium hover:underline"
          >
            {t("nav.profile")}
          </Link>
        ) : null}
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

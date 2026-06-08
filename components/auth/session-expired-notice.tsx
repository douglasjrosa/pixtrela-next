"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

import { SESSION_EXPIRED_QUERY } from "@/lib/auth/session";

export interface SessionExpiredNoticeProps {
  reason?: string;
}

export function SessionExpiredNotice({ reason }: SessionExpiredNoticeProps) {
  const t = useTranslations("auth");
  const isExpired = reason === SESSION_EXPIRED_QUERY;

  useEffect(() => {
    if (!isExpired) return;
    void signOut({ redirect: false });
  }, [isExpired]);

  if (!isExpired) return null;

  return (
    <p role="status" className="mb-4 text-sm text-muted-foreground">
      {t("sessionExpired")}
    </p>
  );
}

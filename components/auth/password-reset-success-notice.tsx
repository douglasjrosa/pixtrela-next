"use client";

import { useTranslations } from "next-intl";

export function PasswordResetSuccessNotice({
  reset,
}: {
  reset?: string;
}) {
  const t = useTranslations("auth");
  if (reset !== "success") return null;

  return (
    <p role="status" className="mb-4 text-sm text-muted-foreground">
      {t("resetPasswordSuccess")}
    </p>
  );
}

"use client";

import { Camera, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export interface KioskHomeChooserProps {
  onCamera: () => void;
  onPassword: () => void;
  message?: string | null;
  /** i18n namespace; defaults to kiosk. */
  messagesNamespace?: "kiosk" | "auth";
  onUsernameLogin?: () => void;
}

export function KioskHomeChooser({
  onCamera,
  onPassword,
  message,
  messagesNamespace = "kiosk",
  onUsernameLogin,
}: KioskHomeChooserProps) {
  const t = useTranslations(messagesNamespace);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-8 py-6">
      <p className="max-w-sm text-center text-lg font-medium leading-snug">
        {t("homeChooserHint")}
      </p>
      {message ? (
        <p role="status" className="text-center text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="flex h-36 flex-col gap-3 text-base"
          onClick={onCamera}
        >
          <Camera className="size-12" aria-hidden strokeWidth={1.5} />
          {t("homeChooserCamera")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex h-36 flex-col gap-3 text-base"
          onClick={onPassword}
        >
          <KeyRound className="size-12" aria-hidden strokeWidth={1.5} />
          {t("homeChooserPassword")}
        </Button>
      </div>
      {onUsernameLogin ? (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0"
          onClick={onUsernameLogin}
        >
          {t("homeChooserUsername")}
        </Button>
      ) : null}
    </div>
  );
}

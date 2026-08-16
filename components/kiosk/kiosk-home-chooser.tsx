"use client";

import { Camera, KeyRound, LogIn, Nfc } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { EntryAccessMethods } from "@/lib/business/entry-access";

const CHOOSER_BUTTON_CLASS = "flex h-36 flex-col gap-3 text-base";

export interface KioskHomeChooserProps {
  onCamera: () => void;
  onPassword: () => void;
  message?: string | null;
  /** i18n namespace; defaults to kiosk. */
  messagesNamespace?: "kiosk" | "auth";
  onUsernameLogin?: () => void;
  access?: EntryAccessMethods;
}

export function KioskHomeChooser({
  onCamera,
  onPassword,
  message,
  messagesNamespace = "kiosk",
  onUsernameLogin,
  access,
}: KioskHomeChooserProps) {
  const t = useTranslations(messagesNamespace);
  const showFace = access?.face ?? true;
  const showCode = access?.code ?? true;
  const showUsername = Boolean(onUsernameLogin) && (access?.username ?? true);
  const showNfc = access?.nfc ?? true;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-8">
      <p className="max-w-sm text-center text-lg font-medium leading-snug">
        {t("homeChooserHint")}
      </p>
      {message ? (
        <p role="status" className="text-center text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
      <div className="grid w-full gap-4 sm:grid-cols-2">
        {showFace ? (
          <Button
            type="button"
            variant="outline"
            className={CHOOSER_BUTTON_CLASS}
            onClick={onCamera}
          >
            <Camera className="size-12" aria-hidden strokeWidth={1.5} />
            {t("homeChooserCamera")}
          </Button>
        ) : null}
        {showCode ? (
          <Button
            type="button"
            variant="outline"
            className={CHOOSER_BUTTON_CLASS}
            onClick={onPassword}
          >
            <KeyRound className="size-12" aria-hidden strokeWidth={1.5} />
            {t("homeChooserPassword")}
          </Button>
        ) : null}
        {showUsername ? (
          <Button
            type="button"
            variant="outline"
            className={`${CHOOSER_BUTTON_CLASS} sm:col-span-2`}
            onClick={onUsernameLogin}
          >
            <LogIn className="size-12" aria-hidden strokeWidth={1.5} />
            {t("homeChooserUsername")}
          </Button>
        ) : null}
      </div>
      {showNfc ? (
        <div className="flex max-w-sm items-center justify-center gap-2 text-sm text-muted-foreground">
          <Nfc className="size-5 shrink-0" aria-hidden strokeWidth={1.75} />
          <p className="text-center leading-snug">{t("homeChooserNfcFooter")}</p>
        </div>
      ) : null}
    </div>
  );
}

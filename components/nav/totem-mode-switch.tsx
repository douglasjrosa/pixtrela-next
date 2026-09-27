"use client";

import { useId, useTransition } from "react";
import { useTranslations } from "next-intl";

import { setPersonalTotemMode } from "@/app/[documentId]/kiosk/actions";
import { SwitchField } from "@/components/ui/switch-field";

export interface TotemModeSwitchProps {
  enabled: boolean;
}

export function TotemModeSwitch({ enabled }: TotemModeSwitchProps) {
  const t = useTranslations("nav");
  const id = useId();
  const [pending, startTransition] = useTransition();

  return (
    <SwitchField
      id={id}
      label={t("totemMode")}
      checked={enabled}
      disabled={pending}
      onCheckedChange={(checked) => {
        startTransition(() => {
          void setPersonalTotemMode(checked);
        });
      }}
    />
  );
}

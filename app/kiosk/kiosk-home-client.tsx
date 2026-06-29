"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { KioskColaboratorForm } from "@/components/kiosk/kiosk-colaborator-form";
import { KioskIdleScreen } from "@/components/kiosk/kiosk-idle-screen";

import { identifyKioskUserByCode } from "./actions";

export function KioskHomeClient() {
  const t = useTranslations("kiosk");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<"invalidCredentials" | "forbidden" | null>(
    null,
  );

  async function handleSubmit(values: { code: number; password: string }): Promise<void> {
    setErrorKey(null);
    setPending(true);
    const result = await identifyKioskUserByCode(values.code, values.password);
    setPending(false);
    if (!result.ok) {
      setErrorKey(result.error);
      return;
    }
    router.replace(result.path);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <KioskIdleScreen />
      <div className="p-6">
        {errorKey ? (
          <p role="alert" className="mb-4 text-center text-sm text-destructive">
            {t(errorKey)}
          </p>
        ) : null}
        <KioskColaboratorForm onSubmit={handleSubmit} pending={pending} />
      </div>
    </div>
  );
}

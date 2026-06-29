import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { CurrencyForm } from "@/components/settings/currency-form";
import { KioskSessionIdleForm } from "@/components/settings/kiosk-session-idle-form";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { loadKioskSessionIdleSeconds } from "@/lib/strapi/kiosk-setting";

import { updateCurrencyPerSecond, updateKioskSessionIdleSeconds } from "./actions";

interface StrapiList<T> {
  data: T[];
}

interface CurrencyEntity {
  currencyPerSecond: number;
}

async function loadCurrencyPerSecond(): Promise<number> {
  try {
    const res = await strapiFetch<StrapiList<CurrencyEntity>>(
      "/currencies",
      { strapiCache: { tags: [STRAPI_TAGS.currencies], revalidate: 60 } },
      { fields: ["currencyPerSecond"], pagination: { pageSize: 1 } },
    );
    return Number(res.data[0]?.currencyPerSecond ?? 0);
  } catch (error) {
    rethrowIfNavigationError(error);
    return 0;
  }
}

export default async function SettingsPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const t = await getTranslations("settings");

  if (!canManageSettings(role)) {
    return <ForbiddenMessage />;
  }

  const [currencyPerSecond, sessionIdleSeconds] = await Promise.all([
    loadCurrencyPerSecond(),
    loadKioskSessionIdleSeconds(),
  ]);

  async function handleSaveCurrency(values: {
    currencyPerSecond: number;
  }): Promise<void> {
    "use server";
    await updateCurrencyPerSecond(values.currencyPerSecond);
  }

  async function handleSaveKioskSession(values: {
    sessionIdleSeconds: number;
  }): Promise<void> {
    "use server";
    await updateKioskSessionIdleSeconds(values.sessionIdleSeconds);
  }

  return (
    <section className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <CurrencyForm currencyPerSecond={currencyPerSecond} onSave={handleSaveCurrency} />
      <KioskSessionIdleForm
        sessionIdleSeconds={sessionIdleSeconds}
        onSave={handleSaveKioskSession}
      />
    </section>
  );
}

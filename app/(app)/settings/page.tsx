import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import {
  CurrencyForm,
  type CurrencyRate,
} from "@/components/settings/currency-form";
import { KioskSessionIdleForm } from "@/components/settings/kiosk-session-idle-form";
import {
  TaskAutomationForm,
  type StepOption,
} from "@/components/settings/task-automation-form";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import type { TaskAutomationFormInput } from "@/lib/schemas/task-automation";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { loadKioskSessionIdleSeconds } from "@/lib/strapi/kiosk-setting";
import { loadTaskAutomationSetting } from "@/lib/strapi/task-automation-setting";

import {
  updateCurrencyRates,
  updateKioskSessionIdleSeconds,
  updateTaskAutomationSetting,
} from "./actions";

interface StrapiList<T> {
  data: T[];
}

interface CurrencyEntity {
  documentId: string;
  name: string;
  title?: string | null;
  pluralTitle?: string | null;
  currencyPerSecond: number;
}

interface StepEntity {
  documentId: string;
  name: string;
}

async function loadCurrencies(): Promise<CurrencyRate[]> {
  try {
    const res = await strapiFetch<StrapiList<CurrencyEntity>>(
      "/currencies",
      { strapiCache: { tags: [STRAPI_TAGS.currencies], revalidate: 60 } },
      {
        fields: ["documentId", "name", "title", "pluralTitle", "currencyPerSecond"],
        sort: ["name:asc"],
        pagination: { pageSize: 100 },
      },
    );

    return res.data.map((currency) => ({
      documentId: currency.documentId,
      title: currency.title ?? "",
      pluralTitle: currency.pluralTitle ?? "",
      currencyPerSecond: Number(currency.currencyPerSecond ?? 0),
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

async function loadSteps(): Promise<StepOption[]> {
  try {
    const res = await strapiFetch<StrapiList<StepEntity>>(
      "/steps",
      { strapiCache: { tags: [STRAPI_TAGS.steps], revalidate: 60 } },
      {
        fields: ["documentId", "name"],
        sort: ["index:asc"],
        pagination: { pageSize: 100 },
      },
    );

    return res.data.map((step) => ({
      documentId: step.documentId,
      name: step.name,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function SettingsPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const t = await getTranslations("settings");

  if (!canManageSettings(role)) {
    return <ForbiddenMessage />;
  }

  const [currencies, sessionIdleSeconds, steps, taskAutomation] =
    await Promise.all([
      loadCurrencies(),
      loadKioskSessionIdleSeconds(),
      loadSteps(),
      loadTaskAutomationSetting(),
    ]);

  async function handleSaveCurrency(values: {
    rates: { documentId: string; currencyPerSecond: number }[];
  }): Promise<void> {
    "use server";
    await updateCurrencyRates(values.rates);
  }

  async function handleSaveKioskSession(values: {
    sessionIdleSeconds: number;
  }): Promise<void> {
    "use server";
    await updateKioskSessionIdleSeconds(values.sessionIdleSeconds);
  }

  async function handleSaveTaskAutomation(
    values: TaskAutomationFormInput,
  ): Promise<void> {
    "use server";
    await updateTaskAutomationSetting(values);
  }

  return (
    <section className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <CurrencyForm currencies={currencies} onSave={handleSaveCurrency} />
      <TaskAutomationForm
        steps={steps}
        defaultValues={taskAutomation}
        onSave={handleSaveTaskAutomation}
      />
      <KioskSessionIdleForm
        sessionIdleSeconds={sessionIdleSeconds}
        onSave={handleSaveKioskSession}
      />
    </section>
  );
}

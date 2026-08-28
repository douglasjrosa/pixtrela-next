"use client";

import { useTranslations } from "next-intl";

import { IntegrationSettingsFormFooter } from "@/components/settings/integration-settings-form-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IntegrationSettingsActionResult } from "@/lib/integrations/settings-action-result";

export function CrmConnectionForm({
  values,
  hasSavedConnection,
  saveAction,
  testAction,
}: {
  values: { baseUrl: string; webhookSecret: string };
  hasSavedConnection: boolean;
  saveAction: (formData: FormData) => Promise<IntegrationSettingsActionResult>;
  testAction: () => Promise<IntegrationSettingsActionResult>;
}) {
  const t = useTranslations("settings.crm");

  return (
    <form className="max-w-md space-y-4">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("help")}</p>

      <div className="space-y-2">
        <Label htmlFor="baseUrl">{t("baseUrl")}</Label>
        <Input
          id="baseUrl"
          name="baseUrl"
          type="url"
          defaultValue={values.baseUrl}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhookSecret">{t("webhookSecret")}</Label>
        <Input
          id="webhookSecret"
          name="webhookSecret"
          type="password"
          defaultValue={values.webhookSecret}
          required
        />
      </div>

      <IntegrationSettingsFormFooter
        hasSavedConnection={hasSavedConnection}
        saveAction={saveAction}
        testAction={testAction}
      />
    </form>
  );
}

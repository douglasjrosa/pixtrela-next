"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { IntegrationSettingsActionResult } from "@/lib/integrations/settings-action-result";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export interface IntegrationSettingsFormFooterProps {
  hasSavedConnection: boolean;
  saveAction: (formData: FormData) => Promise<IntegrationSettingsActionResult>;
  testAction?: () => Promise<IntegrationSettingsActionResult>;
}

export function IntegrationSettingsFormFooter({
  hasSavedConnection,
  saveAction,
  testAction,
}: IntegrationSettingsFormFooterProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("settings");
  const router = useRouter();
  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();

  function handleSave(formData: FormData): void {
    startSave(async () => {
      const result = await saveAction(formData);
      if (result.ok) {
        showSuccessToast(t("saved"));
        router.refresh();
        return;
      }
      showErrorToast(t("error"));
    });
  }

  function handleTest(): void {
    if (!testAction) return;
    startTest(async () => {
      const result = await testAction();
      if (result.ok) {
        showSuccessToast(t("testSuccess"));
        return;
      }
      showErrorToast(t("testFailed"));
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="submit"
        disabled={isSaving || isTesting}
        formAction={handleSave}
      >
        {tCommon("save")}
      </Button>
      {hasSavedConnection && testAction ? (
        <Button
          type="button"
          variant="outline"
          disabled={isSaving || isTesting}
          onClick={handleTest}
        >
          {t("testIntegration")}
        </Button>
      ) : null}
    </div>
  );
}

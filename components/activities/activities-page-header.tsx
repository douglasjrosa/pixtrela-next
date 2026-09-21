"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { createActivity } from "@/app/(app)/activities/actions";
import { AddNewButton } from "@/components/ui/add-new-button";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { ActivityFormOptions } from "@/lib/repos/activities";
import type { AdminActivityFormInput } from "@/lib/schemas/admin-activity";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { ActivityForm, buildCreateActivityDefaults } from "./activity-form";

const CREATE_FORM_ID = "create-activity-form";
const CREATE_TITLE_ID = "activity-form-title";

export interface ActivitiesPageHeaderProps {
  options: ActivityFormOptions;
}

export function ActivitiesPageHeader({ options }: ActivitiesPageHeaderProps) {
  const t = useTranslations("activities");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(values: AdminActivityFormInput): void {
    startTransition(async () => {
      try {
        await createActivity(values);
        showSuccessToast(t("saved"));
        setCreateOpen(false);
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-3">
      <h1 className="text-2xl font-bold max-[500px]:text-lg">{t("title")}</h1>
      <AddNewButton label={t("newActivity")} onClick={() => setCreateOpen(true)} />
      {createOpen ? (
        <FormModalShell
          open
          title={t("newActivity")}
          titleId={CREATE_TITLE_ID}
          onClose={() => setCreateOpen(false)}
          disabled={isPending}
          fillBody={false}
          footerEnd={
            <Button type="submit" form={CREATE_FORM_ID} disabled={isPending}>
              {tCommon("save")}
            </Button>
          }
        >
          <ActivityForm
            options={options}
            defaultValues={buildCreateActivityDefaults(options)}
            formId={CREATE_FORM_ID}
            isPending={isPending}
            onSubmit={handleSubmit}
            onInvalid={() => showErrorToast(t("validationError"))}
          />
        </FormModalShell>
      ) : null}
    </div>
  );
}

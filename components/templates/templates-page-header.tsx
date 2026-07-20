"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { createTemplate } from "@/app/(app)/templates/actions";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { TemplateForm, type TemplateFormValues } from "./template-form";

const CREATE_TEMPLATE_FORM_ID = "create-template-form";
const CREATE_TEMPLATE_TITLE_ID = "template-form-title";

interface CreateTemplateDialogProps {
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: TemplateFormValues) => void;
  onInvalid: () => void;
}

function CreateTemplateDialog({
  isPending,
  onClose,
  onSubmit,
  onInvalid,
}: CreateTemplateDialogProps) {
  const tCommon = useTranslations("common");
  const tTemplates = useTranslations("templates");

  return (
    <FormModalShell
      open
      title={tTemplates("newTemplate")}
      titleId={CREATE_TEMPLATE_TITLE_ID}
      onClose={onClose}
      disabled={isPending}
      footerEnd={
        <Button
          type="submit"
          form={CREATE_TEMPLATE_FORM_ID}
          disabled={isPending}
        >
          {tCommon("save")}
        </Button>
      }
    >
      <TemplateForm
        mode="create"
        defaultValues={{ name: "", code: "" }}
        layout="embedded"
        formId={CREATE_TEMPLATE_FORM_ID}
        formTitleId={CREATE_TEMPLATE_TITLE_ID}
        hideTitle
        hideActions
        isPending={isPending}
        onSubmit={onSubmit}
        onInvalid={onInvalid}
      />
    </FormModalShell>
  );
}

export function TemplatesPageHeader() {
  const tTemplates = useTranslations("templates");
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function closeCreate(): void {
    setCreateOpen(false);
  }

  function handleSubmit(values: TemplateFormValues): void {
    startTransition(async () => {
      try {
        await createTemplate(values);
        showSuccessToast(tTemplates("saved"));
        closeCreate();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTemplates("error"));
      }
    });
  }

  function handleInvalid(): void {
    showErrorToast(tTemplates("validationError"));
  }

  return (
    <div className="flex shrink-0 items-center justify-end gap-3">
      <Button type="button" variant="outline" onClick={() => setCreateOpen(true)}>
        {tTemplates("newTemplate")}
      </Button>

      {createOpen ? (
        <CreateTemplateDialog
          isPending={isPending}
          onClose={closeCreate}
          onSubmit={handleSubmit}
          onInvalid={handleInvalid}
        />
      ) : null}
    </div>
  );
}

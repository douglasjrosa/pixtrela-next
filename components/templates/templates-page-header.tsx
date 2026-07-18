"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { createTemplate } from "@/app/(app)/templates/actions";
import { Button } from "@/components/ui/button";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { TemplateForm, type TemplateFormValues } from "./template-form";

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
  const formTitleId = "template-form-title";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={formTitleId}
        className={
          "relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg " +
          "border bg-background p-4 shadow-lg"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          disabled={isPending}
          aria-label={tCommon("close")}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </Button>
        <TemplateForm
          mode="create"
          defaultValues={{ name: "", code: "" }}
          layout="embedded"
          formTitleId={formTitleId}
          isPending={isPending}
          onSubmit={onSubmit}
          onInvalid={onInvalid}
        />
      </div>
    </div>
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

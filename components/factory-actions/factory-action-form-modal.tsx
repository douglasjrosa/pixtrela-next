"use client";

import { useTranslations } from "next-intl";

import { FactoryActionForm } from "@/components/factory-actions/factory-action-form";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import type { FactoryActionFormInput } from "@/lib/schemas/factory-action";

export interface FactoryActionFormModalProps {
  open: boolean;
  title: string;
  formId: string;
  defaultValues: FactoryActionFormInput;
  saving?: boolean;
  showDelete?: boolean;
  onClose: () => void;
  onSave: (values: FactoryActionFormInput) => void;
  onDelete?: () => void;
}

export function FactoryActionFormModal({
  open,
  title,
  formId,
  defaultValues,
  saving = false,
  showDelete = false,
  onClose,
  onSave,
  onDelete,
}: FactoryActionFormModalProps) {
  const tCommon = useTranslations("common");

  return (
    <FormModalShell
      open={open}
      title={title}
      size="md"
      fillBody={false}
      disabled={saving}
      onClose={onClose}
      footerStart={
        showDelete && onDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={saving}
            onClick={onDelete}
          >
            {tCommon("delete")}
          </Button>
        ) : undefined
      }
      footerEnd={
        <Button type="submit" form={formId} disabled={saving}>
          {tCommon("save")}
        </Button>
      }
    >
      <FactoryActionForm
        key={formId}
        formId={formId}
        defaultValues={defaultValues}
        disabled={saving}
        onSubmit={onSave}
      />
    </FormModalShell>
  );
}

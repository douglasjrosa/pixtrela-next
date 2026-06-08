"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export interface TaskRowActionsProps {
  documentId: string;
  active: boolean;
  canDelete: boolean;
  onDeactivate: (documentId: string) => void;
  onDelete: (documentId: string) => void;
  pending?: boolean;
}

export function TaskRowActions({
  documentId,
  active,
  canDelete,
  onDeactivate,
  onDelete,
  pending,
}: TaskRowActionsProps) {
  const t = useTranslations("tasks.manage");

  return (
    <div className="flex gap-2">
      {active ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => onDeactivate(documentId)}
        >
          {t("deactivate")}
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => onDelete(documentId)}
        >
          {t("delete")}
        </Button>
      ) : null}
    </div>
  );
}

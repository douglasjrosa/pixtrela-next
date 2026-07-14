"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export interface SubTaskFormModalProps {
  open: boolean;
  title: string;
  titleId?: string;
  disabled?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function SubTaskFormModal({
  open,
  title,
  titleId = "subtask-form-modal-title",
  disabled = false,
  onClose,
  children,
}: SubTaskFormModalProps) {
  const tCommon = useTranslations("common");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      data-testid="subtask-form-modal-backdrop"
      onClick={disabled ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          "max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border " +
          "bg-background p-6 shadow-lg"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label={tCommon("close")}
              onClick={onClose}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

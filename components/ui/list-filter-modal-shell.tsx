"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export interface ListFilterModalShellProps {
  titleId: string;
  title: string;
  closeLabel?: string;
  disabled?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}

export function ListFilterModalShell({
  titleId,
  title,
  closeLabel,
  disabled = false,
  onClose,
  children,
  footer,
}: ListFilterModalShellProps) {
  const tCommon = useTranslations("common");
  const ariaClose = closeLabel ?? tCommon("close");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          "relative w-full max-w-md rounded-lg border bg-background p-4 " +
          "shadow-lg"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          disabled={disabled}
          aria-label={ariaClose}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </Button>

        <h2 id={titleId} className="mb-4 pr-10 text-lg font-semibold">
          {title}
        </h2>

        {children}

        <div className="mt-4 flex flex-wrap justify-end gap-2">{footer}</div>
      </div>
    </div>
  );
}

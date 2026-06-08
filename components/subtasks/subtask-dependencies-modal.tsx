"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SubTaskDependencyOption {
  documentId: string;
  name: string;
}

export interface SubTaskDependenciesModalProps {
  open: boolean;
  options: SubTaskDependencyOption[];
  selectedIds: string[];
  onClose: () => void;
  onConfirm: (dependencyIds: string[]) => void;
}

export function SubTaskDependenciesModal({
  open,
  options,
  selectedIds,
  onClose,
  onConfirm,
}: SubTaskDependenciesModalProps) {
  const tCommon = useTranslations("common");
  const tSubtasks = useTranslations("subtasks");
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (open) setDraftIds(selectedIds);
  }, [open, selectedIds]);

  if (!open) return null;

  function toggleDependency(documentId: string): void {
    setDraftIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  }

  const checkboxClass = cn(
    "size-4 rounded border border-input accent-primary",
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subtask-dependencies-title"
        className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm(draftIds);
            onClose();
          }}
        >
          <div className="space-y-1">
            <h2 id="subtask-dependencies-title" className="text-lg font-semibold">
              {tSubtasks("dependenciesTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tSubtasks("dependenciesDescription")}
            </p>
          </div>

          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground" role="status">
              {tSubtasks("dependenciesEmpty")}
            </p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
              {options.map((option) => {
                const inputId = `dependency-${option.documentId}`;
                const checked = draftIds.includes(option.documentId);

                return (
                  <li key={option.documentId}>
                    <label
                      htmlFor={inputId}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        className={checkboxClass}
                        checked={checked}
                        onChange={() => toggleDependency(option.documentId)}
                      />
                      <span>{option.name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit">{tCommon("save")}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

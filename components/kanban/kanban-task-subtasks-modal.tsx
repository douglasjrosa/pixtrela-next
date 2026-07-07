"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CardBadge } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BoardSubTaskSummary } from "./types";

export interface KanbanTaskSubtasksModalProps {
  open: boolean;
  taskName: string;
  subtasks: BoardSubTaskSummary[];
  loading: boolean;
  onClose: () => void;
  onSelect: (subtask: BoardSubTaskSummary) => void;
  onAddSubtask?: () => void;
}

export function KanbanTaskSubtasksModal({
  open,
  taskName,
  subtasks,
  loading,
  onClose,
  onSelect,
  onAddSubtask,
}: KanbanTaskSubtasksModalProps) {
  const tCommon = useTranslations("common");
  const tKanban = useTranslations("kanban");
  const tStatus = useTranslations("tasks.status");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-subtasks-title"
        className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-4">
          <h2 id="kanban-subtasks-title" className="text-lg font-semibold">
            {taskName}
          </h2>

          {loading ? (
            <p className="text-sm text-muted-foreground" role="status">
              {tKanban("loading")}
            </p>
          ) : subtasks.length === 0 ? (
            <p className="text-sm text-muted-foreground" role="status">
              {tKanban("subtasksEmpty")}
            </p>
          ) : (
            <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {subtasks.map((subtask) => (
                <li key={subtask.documentId}>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-auto w-full flex-col items-start gap-1.5 py-2.5",
                      "whitespace-normal",
                    )}
                    onClick={() => onSelect(subtask)}
                  >
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className="font-medium text-left">{subtask.name}</span>
                      <CardBadge className="shrink-0">{tStatus(subtask.status)}</CardBadge>
                    </span>
                    {subtask.assignedTo.length > 0 ? (
                      <span className="flex flex-wrap gap-1">
                        {subtask.assignedTo.map((assignee) => (
                          <CardBadge
                            key={assignee.documentId}
                            className="border-primary bg-primary text-primary-foreground"
                          >
                            {assignee.name}
                          </CardBadge>
                        ))}
                      </span>
                    ) : null}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end gap-2">
            {onAddSubtask ? (
              <Button type="button" onClick={onAddSubtask}>
                {tKanban("addSubtask")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

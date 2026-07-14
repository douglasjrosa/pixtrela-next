"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { SubTaskAssigneePicker } from "@/components/subtasks/subtask-assignee-picker";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { Button } from "@/components/ui/button";
import { CardBadge } from "@/components/ui/card";
import type { BoardSubTaskSummary } from "./types";

export interface KanbanTaskSubtasksModalProps {
  open: boolean;
  taskName: string;
  subtasks: BoardSubTaskSummary[];
  teams: TeamAssignmentOption[];
  loading: boolean;
  dirty: boolean;
  saving: boolean;
  onClose: () => void;
  onAssigneesChange: (
    subtask: BoardSubTaskSummary,
    assignedToIds: string[],
  ) => void;
  onSave: () => void;
  onAddSubtask?: () => void;
}

export function KanbanTaskSubtasksModal({
  open,
  taskName,
  subtasks,
  teams,
  loading,
  dirty,
  saving,
  onClose,
  onAssigneesChange,
  onSave,
  onAddSubtask,
}: KanbanTaskSubtasksModalProps) {
  const tCommon = useTranslations("common");
  const tKanban = useTranslations("kanban");
  const tStatus = useTranslations("tasks.status");
  const tSubtasks = useTranslations("subtasks");

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
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border bg-background p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          aria-label={tCommon("close")}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </Button>

        <div className="flex min-h-0 flex-1 flex-col space-y-4">
          <h2
            id="kanban-subtasks-title"
            className="pr-8 text-lg font-semibold"
          >
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
            <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {subtasks.map((subtask) => {
                const assignedIds = subtask.assignedTo.map(
                  (assignee) => assignee.documentId,
                );

                return (
                  <li
                    key={subtask.documentId}
                    className="rounded-lg border bg-background p-3"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <span className="font-medium">{subtask.name}</span>
                      <CardBadge className="shrink-0">
                        {tStatus(subtask.status)}
                      </CardBadge>
                    </div>
                    <SubTaskAssigneePicker
                      id={`kanban-subtask-assignees-${subtask.documentId}`}
                      label={tSubtasks("assignedTo")}
                      teams={teams}
                      value={assignedIds}
                      variant="rows"
                      disabled={saving}
                      onChange={(nextIds) => onAssigneesChange(subtask, nextIds)}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex shrink-0 justify-end gap-2">
            {onAddSubtask ? (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={onAddSubtask}
              >
                {tKanban("addSubtask")}
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={!dirty || saving}
              onClick={onSave}
            >
              {tCommon("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

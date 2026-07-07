"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { SubTaskAssigneePicker } from "@/components/subtasks/subtask-assignee-picker";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { Button } from "@/components/ui/button";

export interface KanbanSubtaskAssignModalProps {
  open: boolean;
  subtaskName: string;
  teams: TeamAssignmentOption[];
  assignedToIds: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (assignedToIds: string[]) => void;
}

export function KanbanSubtaskAssignModal({
  open,
  subtaskName,
  teams,
  assignedToIds,
  saving,
  onClose,
  onSave,
}: KanbanSubtaskAssignModalProps) {
  const tCommon = useTranslations("common");
  const tKanban = useTranslations("kanban");
  const tSubtasks = useTranslations("subtasks");
  const [draftIds, setDraftIds] = useState<string[]>(assignedToIds);

  useEffect(() => {
    if (open) setDraftIds(assignedToIds);
  }, [open, assignedToIds]);

  if (!open) return null;

  function handleSave(): void {
    onSave(draftIds);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-assign-title"
        className="w-full max-w-2xl rounded-lg border bg-background p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 id="kanban-assign-title" className="text-lg font-semibold">
              {tKanban("assignTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">{subtaskName}</p>
          </div>

          <SubTaskAssigneePicker
            id="kanban-subtask-assignees"
            label={tSubtasks("assignedTo")}
            teams={teams}
            value={draftIds}
            onChange={setDraftIds}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {tCommon("cancel")}
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {tCommon("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

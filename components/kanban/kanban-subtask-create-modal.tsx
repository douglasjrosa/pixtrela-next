"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { SubTaskInlineForm } from "@/components/subtasks/subtask-inline-form";
import type { SubTaskDependencyOption } from "@/components/subtasks/subtask-dependencies-modal";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { Button } from "@/components/ui/button";
import {
  subTaskFormSchema,
  type SubTaskFormInput,
} from "@/lib/schemas/sub-task";

const EMPTY_FORM: SubTaskFormInput = {
  name: "",
  qty: 1,
  expectedTime: 0,
  sharingType: "duration",
  maxSameTimeWorkers: 1,
  status: "waiting",
  activationStatus: "locked",
  reasonForDisabling: "",
  dependencyIds: [],
  assignedToIds: [],
};

export interface KanbanSubtaskCreateModalProps {
  open: boolean;
  taskName: string;
  teams: TeamAssignmentOption[];
  dependencyOptions: SubTaskDependencyOption[];
  saving: boolean;
  onClose: () => void;
  onCreate: (values: SubTaskFormInput) => void;
}

export function KanbanSubtaskCreateModal({
  open,
  taskName,
  teams,
  dependencyOptions,
  saving,
  onClose,
  onCreate,
}: KanbanSubtaskCreateModalProps) {
  const tCommon = useTranslations("common");
  const tKanban = useTranslations("kanban");
  const [draft, setDraft] = useState<SubTaskFormInput>(EMPTY_FORM);
  const [formKey, setFormKey] = useState("kanban-create-subtask-0");

  useEffect(() => {
    if (open) {
      setDraft(EMPTY_FORM);
      setFormKey(`kanban-create-subtask-${Date.now()}`);
    }
  }, [open]);

  if (!open) return null;

  function handleSave(): void {
    const parsed = subTaskFormSchema.safeParse(draft);
    if (!parsed.success) return;
    onCreate(parsed.data);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kanban-create-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-background p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 id="kanban-create-title" className="text-lg font-semibold">
              {tKanban("createTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">{taskName}</p>
          </div>

          <SubTaskInlineForm
            formKey={formKey}
            defaultValues={draft}
            teams={teams}
            dependencyOptions={dependencyOptions}
            isCreate
            hideHeading
            disabled={saving}
            onChange={setDraft}
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

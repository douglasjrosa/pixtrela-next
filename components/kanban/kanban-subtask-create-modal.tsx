"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { SubTaskInlineForm } from "@/components/subtasks/subtask-inline-form";
import type { SubTaskDependencyOption } from "@/components/subtasks/subtask-dependencies-modal";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { normalizeSubTaskCreateValues } from "@/lib/business/subtask-create-fields";
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
  activationStatus: "unlocked",
  reasonForDisabling: "",
  dependencyIds: [],
  assignedToIds: [],
};

export type KanbanSubtaskCreateOptions = {
  addToTemplate: boolean;
};

export interface KanbanSubtaskCreateModalProps {
  open: boolean;
  taskName: string;
  teams: TeamAssignmentOption[];
  dependencyOptions: SubTaskDependencyOption[];
  dependencyStatusSiblings?: Array<{
    documentId: string;
    status: SubTaskFormInput["status"];
  }>;
  saving: boolean;
  onClose: () => void;
  onCreate: (
    values: SubTaskFormInput,
    options: KanbanSubtaskCreateOptions,
  ) => void;
}

export function KanbanSubtaskCreateModal({
  open,
  taskName,
  teams,
  dependencyOptions,
  dependencyStatusSiblings = [],
  saving,
  onClose,
  onCreate,
}: KanbanSubtaskCreateModalProps) {
  const tCommon = useTranslations("common");
  const tKanban = useTranslations("kanban");
  const [draft, setDraft] = useState<SubTaskFormInput>(EMPTY_FORM);
  const [addToTemplate, setAddToTemplate] = useState(false);
  const [formKey, setFormKey] = useState("kanban-create-subtask-0");

  useEffect(() => {
    if (open) {
      setDraft(EMPTY_FORM);
      setAddToTemplate(false);
      setFormKey(`kanban-create-subtask-${Date.now()}`);
    }
  }, [open]);

  if (!open) return null;

  function handleSave(): void {
    const parsed = subTaskFormSchema.safeParse(draft);
    if (!parsed.success) return;
    onCreate(
      normalizeSubTaskCreateValues(parsed.data, dependencyStatusSiblings),
      { addToTemplate },
    );
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
        className={
          "relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border " +
          "bg-background p-6 shadow-lg"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          disabled={saving}
          aria-label={tCommon("close")}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </Button>

        <div className="space-y-4">
          <div className="space-y-1 pr-8">
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
            hideStatus
            hideActivationStatus
            hideAssignees
            disabled={saving}
            onChange={setDraft}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                id="kanban-add-to-template"
                type="checkbox"
                className="size-4 accent-primary"
                checked={addToTemplate}
                disabled={saving}
                onChange={(event) => setAddToTemplate(event.target.checked)}
              />
              <Label htmlFor="kanban-add-to-template" className="font-normal">
                {tKanban("addToTemplate")}
              </Label>
            </div>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {tCommon("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

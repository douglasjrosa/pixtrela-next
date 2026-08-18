"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { SubTaskInlineForm } from "@/components/subtasks/subtask-inline-form";
import type { SubTaskDependencyOption } from "@/components/subtasks/subtask-dependencies-modal";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { Button } from "@/components/ui/button";
import { FORM_MODAL_NESTED_OVERLAY_Z_CLASS } from "@/components/ui/form-modal-shell";
import { normalizeSubTaskCreateValues } from "@/lib/business/subtask-create-fields";
import {
  subTaskFormSchema,
  type SubTaskFormInput,
} from "@/lib/schemas/sub-task";
import { cn } from "@/lib/utils";

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
  onCreate: (values: SubTaskFormInput) => void;
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
  const [resetNonce, setResetNonce] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setResetNonce((nonce) => nonce + 1);
  }
  const [appliedResetNonce, setAppliedResetNonce] = useState(0);
  if (resetNonce !== appliedResetNonce) {
    setAppliedResetNonce(resetNonce);
    setDraft(EMPTY_FORM);
  }
  const formKey = `kanban-create-subtask-${resetNonce}`;

  if (!open) return null;

  function handleSave(): void {
    const parsed = subTaskFormSchema.safeParse(draft);
    if (!parsed.success) return;
    onCreate(
      normalizeSubTaskCreateValues(parsed.data, dependencyStatusSiblings),
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-overlay/50 p-4",
        FORM_MODAL_NESTED_OVERLAY_Z_CLASS,
      )}
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

          <div className="flex justify-end">
            <Button type="button" onClick={handleSave} disabled={saving}>
              {tCommon("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

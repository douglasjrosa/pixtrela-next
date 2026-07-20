"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  createSubTaskPreset,
  deleteSubTaskPreset,
  updateSubTaskPreset,
} from "@/app/(app)/sub-task-presets/actions";
import { SubTaskPresetFormModal } from "@/components/subtask-presets/subtask-preset-form-modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Duration } from "@/components/ui/duration";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { SubTaskPresetFormInput } from "@/lib/schemas/sub-task-preset";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export interface SubTaskPresetManagerProps {
  presets: SubTaskPreset[];
}

const EMPTY_FORM: SubTaskPresetFormInput = {
  name: "",
  sharingType: "qty",
  maxSameTimeWorkers: 2,
  expectedTime: 0,
};

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; preset: SubTaskPreset };

export function SubTaskPresetManager({ presets }: SubTaskPresetManagerProps) {
  const tCommon = useTranslations("common");
  const tPresets = useTranslations("subTaskPresets");
  const tSubtasks = useTranslations("subtasks");
  const tSharing = useTranslations("subtasks.sharingType");
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function closeModal(): void {
    setModal({ mode: "closed" });
    setDeleteOpen(false);
  }

  function handleSave(values: SubTaskPresetFormInput): void {
    startTransition(async () => {
      try {
        if (modal.mode === "create") {
          await createSubTaskPreset(values);
        } else if (modal.mode === "edit") {
          await updateSubTaskPreset(modal.preset.documentId, values);
        }
        showSuccessToast(tPresets("saved"));
        closeModal();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tPresets("error"));
      }
    });
  }

  function handleConfirmDelete(): void {
    if (modal.mode !== "edit") return;
    const documentId = modal.preset.documentId;
    startTransition(async () => {
      try {
        await deleteSubTaskPreset(documentId);
        showSuccessToast(tPresets("deleted"));
        closeModal();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tPresets("error"));
      }
    });
  }

  const formId =
    modal.mode === "edit"
      ? `preset-edit-${modal.preset.documentId}`
      : "preset-create";

  const defaultValues: SubTaskPresetFormInput =
    modal.mode === "edit"
      ? {
          name: modal.preset.name,
          sharingType: modal.preset.sharingType,
          maxSameTimeWorkers: modal.preset.maxSameTimeWorkers,
          expectedTime: modal.preset.expectedTime,
        }
      : EMPTY_FORM;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 max-[500px]:gap-2">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h2 className="text-xl font-semibold max-[500px]:text-base">
          {tPresets("title")}
        </h2>
        <Button
          type="button"
          size="icon"
          aria-label={tPresets("new")}
          onClick={() => setModal({ mode: "create" })}
        >
          <Plus aria-hidden />
        </Button>
      </div>

      {presets.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tPresets("empty")}</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">{tSubtasks("name")}</th>
                <th>{tSubtasks("sharingTypeLabel")}</th>
                <th>{tSubtasks("expectedTime")}</th>
              </tr>
            </thead>
            <tbody>
              {presets.map((preset) => (
                <tr key={preset.documentId} className="border-b">
                  <td className="py-2">
                    <button
                      type="button"
                      className="text-left hover:underline"
                      onClick={() => setModal({ mode: "edit", preset })}
                    >
                      {preset.name}
                    </button>
                  </td>
                  <td>{tSharing(preset.sharingType)}</td>
                  <td>
                    <Duration seconds={preset.expectedTime} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SubTaskPresetFormModal
        open={modal.mode !== "closed"}
        title={modal.mode === "edit" ? tCommon("edit") : tPresets("new")}
        formId={formId}
        defaultValues={defaultValues}
        saving={isPending}
        showDelete={modal.mode === "edit"}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={() => setDeleteOpen(true)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={tPresets("deleteTitle")}
        description={tPresets("deleteConfirm")}
        disabled={isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

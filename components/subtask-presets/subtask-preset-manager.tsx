"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  createSubTaskPreset,
  deleteSubTaskPreset,
  updateSubTaskPreset,
} from "@/app/(app)/sub-task-presets/actions";
import { SubTaskPresetFormModal } from "@/components/subtask-presets/subtask-preset-form-modal";
import { useRegisterTemplatesPageCreateAction } from "@/components/templates/templates-page-actions-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { SubTaskPresetFormInput } from "@/lib/schemas/sub-task-preset";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { SubTaskPresetListProvider } from "./subtask-preset-list-context";

export interface SubTaskPresetManagerProps {
  children: ReactNode;
}

const EMPTY_FORM: SubTaskPresetFormInput = {
  name: "",
  sharingType: "qty",
  maxSameTimeWorkers: 2,
  actionId: "",
  subTaskCategoryId: null,
};

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; preset: SubTaskPreset };

export function SubTaskPresetManager({ children }: SubTaskPresetManagerProps) {
  const tCommon = useTranslations("common");
  const tPresets = useTranslations("subTaskPresets");
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openCreate = useCallback(() => {
    setModal({ mode: "create" });
  }, []);

  useRegisterTemplatesPageCreateAction("subtasks", openCreate);

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
          actionId: modal.preset.actionId,
          subTaskCategoryId: modal.preset.subTaskCategoryId ?? null,
        }
      : EMPTY_FORM;

  const actionName = modal.mode === "edit" ? modal.preset.actionName : "";

  return (
    <SubTaskPresetListProvider
      openEdit={(preset) => setModal({ mode: "edit", preset })}
    >
      {children}

      <SubTaskPresetFormModal
        open={modal.mode !== "closed"}
        title={modal.mode === "edit" ? tCommon("edit") : tPresets("new")}
        formId={formId}
        defaultValues={defaultValues}
        actionName={actionName}
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
    </SubTaskPresetListProvider>
  );
}

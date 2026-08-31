"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  createFactoryAction,
  deleteFactoryAction,
  updateFactoryAction,
} from "@/app/(app)/factory-actions/actions";
import { FactoryActionFormModal } from "@/components/factory-actions/factory-action-form-modal";
import { useRegisterTemplatesPageCreateAction } from "@/components/templates/templates-page-actions-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { FactoryAction } from "@/lib/business/factory-action";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { FactoryActionFormInput } from "@/lib/schemas/factory-action";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { FactoryActionListProvider } from "./factory-action-list-context";

export interface FactoryActionManagerProps {
  children: ReactNode;
}

const EMPTY_FORM: FactoryActionFormInput = {
  name: "",
  description: "",
  unitTime: 1,
  qtyQuestion: "",
};

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; action: FactoryAction };

export function FactoryActionManager({ children }: FactoryActionManagerProps) {
  const tCommon = useTranslations("common");
  const tActions = useTranslations("factoryActions");
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openCreate = useCallback(() => {
    setModal({ mode: "create" });
  }, []);

  useRegisterTemplatesPageCreateAction("actions", openCreate);

  function closeModal(): void {
    setModal({ mode: "closed" });
    setDeleteOpen(false);
  }

  function handleSave(values: FactoryActionFormInput): void {
    startTransition(async () => {
      try {
        if (modal.mode === "create") {
          await createFactoryAction(values);
        } else if (modal.mode === "edit") {
          await updateFactoryAction(modal.action.documentId, values);
        }
        showSuccessToast(tActions("saved"));
        closeModal();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tActions("error"));
      }
    });
  }

  function handleConfirmDelete(): void {
    if (modal.mode !== "edit") return;
    const documentId = modal.action.documentId;
    startTransition(async () => {
      try {
        await deleteFactoryAction(documentId);
        showSuccessToast(tActions("deleted"));
        closeModal();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        const message =
          error instanceof Error && error.message === "actionInUse"
            ? tActions("inUse")
            : tActions("error");
        showErrorToast(message);
      }
    });
  }

  const formId =
    modal.mode === "edit"
      ? `action-edit-${modal.action.documentId}`
      : "action-create";

  const defaultValues: FactoryActionFormInput =
    modal.mode === "edit"
      ? {
          name: modal.action.name,
          description: modal.action.description,
          unitTime: modal.action.unitTime,
          qtyQuestion: modal.action.qtyQuestion,
        }
      : EMPTY_FORM;

  return (
    <FactoryActionListProvider
      openEdit={(action) => setModal({ mode: "edit", action })}
    >
      {children}

      <FactoryActionFormModal
        open={modal.mode !== "closed"}
        title={modal.mode === "edit" ? tCommon("edit") : tActions("new")}
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
        title={tActions("deleteTitle")}
        description={tActions("deleteConfirm")}
        disabled={isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </FactoryActionListProvider>
  );
}

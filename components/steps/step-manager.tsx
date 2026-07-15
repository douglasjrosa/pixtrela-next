"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { StepFormModal } from "@/components/steps/step-form-modal";
import { Button } from "@/components/ui/button";
import type { StepFormInput } from "@/lib/schemas/step";

export interface StepRow {
  documentId: string;
  name: string;
  index: number;
}

export interface StepManagerProps {
  steps: StepRow[];
  onCreate: (values: StepFormInput) => void | Promise<void>;
  onUpdate: (documentId: string, values: StepFormInput) => void | Promise<void>;
  onDelete: (documentId: string) => void | Promise<void>;
}

const EMPTY_FORM: StepFormInput = { name: "", index: 0 };

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; step: StepRow };

export function StepManager({
  steps,
  onCreate,
  onUpdate,
  onDelete,
}: StepManagerProps) {
  const tCommon = useTranslations("common");
  const tSteps = useTranslations("steps");
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function closeModal(): void {
    setModal({ mode: "closed" });
  }

  function handleSave(values: StepFormInput): void {
    startTransition(async () => {
      if (modal.mode === "edit") {
        await onUpdate(modal.step.documentId, values);
      } else if (modal.mode === "create") {
        await onCreate(values);
      }
      setMessage(tSteps("saved"));
      closeModal();
    });
  }

  function handleDelete(documentId: string): void {
    if (!window.confirm(tCommon("delete"))) return;
    startTransition(async () => {
      await onDelete(documentId);
      setMessage(tSteps("deleted"));
    });
  }

  const formKey =
    modal.mode === "edit"
      ? `step-edit-${modal.step.documentId}`
      : "step-create";

  const defaultValues: StepFormInput =
    modal.mode === "edit"
      ? { name: modal.step.name, index: modal.step.index }
      : EMPTY_FORM;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{tSteps("title")}</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setMessage(null);
            setModal({ mode: "create" });
          }}
        >
          {tSteps("newStep")}
        </Button>
      </div>

      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">{tSteps("name")}</th>
            <th>{tSteps("index")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => (
            <tr key={step.documentId} className="border-b">
              <td className="py-2">
                <button
                  type="button"
                  className="text-left hover:underline"
                  onClick={() => {
                    setMessage(null);
                    setModal({ mode: "edit", step });
                  }}
                >
                  {step.name}
                </button>
              </td>
              <td>{step.index}</td>
              <td>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(step.documentId)}
                >
                  {tCommon("delete")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <StepFormModal
        open={modal.mode !== "closed"}
        title={modal.mode === "edit" ? tCommon("edit") : tSteps("newStep")}
        formKey={formKey}
        defaultValues={defaultValues}
        saving={isPending}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  );
}

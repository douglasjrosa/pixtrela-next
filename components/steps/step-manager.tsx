"use client";

import { useEffect, useState, useTransition } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";

import { StepFormModal } from "@/components/steps/step-form-modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { reorderStepsByDrag } from "@/lib/business/step-order";
import type { StepNameFormInput } from "@/lib/schemas/step";

export interface StepRow {
  documentId: string;
  name: string;
  index: number;
}

export interface StepManagerProps {
  steps: StepRow[];
  onCreate: (values: StepNameFormInput) => void | Promise<void>;
  onUpdate: (documentId: string, values: StepNameFormInput) => void | Promise<void>;
  onReorder: (orderedDocumentIds: string[]) => void | Promise<void>;
  onDelete: (documentId: string) => void | Promise<void>;
}

const EMPTY_FORM: StepNameFormInput = { name: "" };
const STEP_DND_CONTEXT_ID = "step-manager-dnd";

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; step: StepRow };

/** Pure drag-end resolver for tests and StepManager. */
export function resolveStepReorder(
  items: StepRow[],
  activeId: unknown,
  overId: unknown,
): StepRow[] | null {
  if (typeof activeId !== "string" || typeof overId !== "string") return null;
  return reorderStepsByDrag(items, activeId, overId);
}

interface SortableStepRowProps {
  step: StepRow;
  dragLabel: string;
  openLabel: string;
  disabled: boolean;
  onOpen: (step: StepRow) => void;
}

function SortableStepRow({
  step,
  dragLabel,
  openLabel,
  disabled,
  onOpen,
}: SortableStepRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.documentId,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? "cursor-pointer border-b bg-muted/50 hover:bg-muted/30"
          : "cursor-pointer border-b hover:bg-muted/30"
      }
      onClick={() => onOpen(step)}
    >
      <td className="w-10 py-2">
        <button
          type="button"
          className="cursor-grab rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label={dragLabel}
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      </td>
      <td className="py-2">
        <span className="sr-only">{openLabel}</span>
        <span>{step.name}</span>
      </td>
    </tr>
  );
}

export function StepManager({
  steps,
  onCreate,
  onUpdate,
  onReorder,
  onDelete,
}: StepManagerProps) {
  const tCommon = useTranslations("common");
  const tSteps = useTranslations("steps");
  const [orderedSteps, setOrderedSteps] = useState(steps);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setOrderedSteps(steps);
  }, [steps]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function closeModal(): void {
    setModal({ mode: "closed" });
    setDeleteOpen(false);
  }

  function openEdit(step: StepRow): void {
    setMessage(null);
    setModal({ mode: "edit", step });
  }

  function handleSave(values: StepNameFormInput): void {
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

  function handleConfirmDelete(): void {
    if (modal.mode !== "edit") return;
    const documentId = modal.step.documentId;
    startTransition(async () => {
      await onDelete(documentId);
      setMessage(tSteps("deleted"));
      closeModal();
    });
  }

  function handleDragEnd(event: DragEndEvent): void {
    const nextOrder = resolveStepReorder(
      orderedSteps,
      event.active.id,
      event.over?.id,
    );
    if (!nextOrder) return;

    setOrderedSteps(nextOrder);
    startTransition(async () => {
      await onReorder(nextOrder.map((step) => step.documentId));
    });
  }

  const formKey =
    modal.mode === "edit"
      ? `step-edit-${modal.step.documentId}`
      : "step-create";

  const defaultValues: StepNameFormInput =
    modal.mode === "edit" ? { name: modal.step.name } : EMPTY_FORM;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{tSteps("title")}</h2>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
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

      <DndContext
        id={STEP_DND_CONTEXT_ID}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="w-10 py-2" aria-hidden />
              <th className="py-2">{tSteps("name")}</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={orderedSteps.map((step) => step.documentId)}
              strategy={verticalListSortingStrategy}
            >
              {orderedSteps.map((step) => (
                <SortableStepRow
                  key={step.documentId}
                  step={step}
                  dragLabel={tSteps("dragToReorder")}
                  openLabel={tSteps("openStep")}
                  disabled={isPending}
                  onOpen={openEdit}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>

      <StepFormModal
        open={modal.mode !== "closed"}
        title={modal.mode === "edit" ? tCommon("edit") : tSteps("newStep")}
        formKey={formKey}
        defaultValues={defaultValues}
        saving={isPending}
        showDelete={modal.mode === "edit"}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={() => setDeleteOpen(true)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={tSteps("deleteTitle")}
        description={tSteps("deleteConfirm")}
        disabled={isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

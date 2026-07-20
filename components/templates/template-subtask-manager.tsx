"use client";

import { useCallback, useEffect, useState } from "react";

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

import { Button } from "@/components/ui/button";
import { Duration } from "@/components/ui/duration";
import {
  applySequentialSubTaskIndices,
  reorderSubTasksByDrag,
} from "@/lib/business/subtask-order";
import {
  insertDraftTemplateSubTaskCloneAt,
  isDraftTemplateSubTaskRow,
  mergeServerTemplateSubTasksWithDrafts,
  templateRowToFormValues,
  type TemplateSubTaskRow,
} from "@/lib/business/template-subtask-map";
import { removeTemplateSubTaskAt } from "@/lib/business/template-subtask-remove";
import {
  remapTemplateDependencyIndexes,
  templateDependencyIndexToUiId,
} from "@/lib/business/template-subtask-dependency-refs";
import type { TemplateSubTaskFormInput } from "@/lib/schemas/template-sub-task";

import { SubTaskFormModal } from "../subtasks/subtask-form-modal";
import type { SubTaskDependencyOption } from "../subtasks/subtask-dependencies-modal";
import { TemplateSubTaskInlineForm } from "./template-subtask-inline-form";

export interface TemplateSubTaskManagerProps {
  subtasks: TemplateSubTaskRow[];
  templateName: string;
  onSubtasksChange: (subtasks: TemplateSubTaskRow[]) => void;
  disabled?: boolean;
}

const EMPTY_FORM: TemplateSubTaskFormInput = {
  name: "",
  qty: 1,
  expectedTime: 0,
  sharingType: "duration",
  maxSameTimeWorkers: 1,
  dependencyIds: [],
};

const NEW_SUBTASK_KEY = "new";
const TEMPLATE_DND_CONTEXT_ID = "template-subtask-manager-dnd";

export function resolveTemplateSubTaskReorder(
  items: TemplateSubTaskRow[],
  activeId: unknown,
  overId: unknown,
): TemplateSubTaskRow[] | null {
  if (typeof activeId !== "string" || typeof overId !== "string") return null;

  const reordered = reorderSubTasksByDrag(
    items.map((item) => ({ ...item, documentId: item.rowKey })),
    activeId,
    overId,
  );
  if (!reordered) return null;

  const itemByKey = new Map(items.map((item) => [item.rowKey, item]));
  return applySequentialSubTaskIndices(
    reordered.map((item, index) => {
      const original = itemByKey.get(item.documentId);
      if (!original) return item as unknown as TemplateSubTaskRow;
      return { ...original, index };
    }),
  );
}

function buildDependencyOptions(
  subtasks: TemplateSubTaskRow[],
  excludeRowKey?: string,
): SubTaskDependencyOption[] {
  return subtasks
    .filter(
      (item) =>
        item.rowKey !== excludeRowKey &&
        !item.isDraft &&
        !isDraftTemplateSubTaskRow(item.rowKey),
    )
    .map((item) => ({
      documentId: templateDependencyIndexToUiId(item.index),
      name: item.name,
    }));
}

function formValuesToDraftRow(
  values: TemplateSubTaskFormInput,
  index: number,
): TemplateSubTaskRow {
  return {
    rowKey: `draft:${crypto.randomUUID()}`,
    isDraft: true,
    name: values.name,
    qty: values.qty,
    index,
    expectedTime: values.expectedTime,
    sharingType: values.sharingType,
    maxSameTimeWorkers: values.maxSameTimeWorkers,
    dependencyIndexes: values.dependencyIds.map(Number),
  };
}

function applyFormValuesToRow(
  row: TemplateSubTaskRow,
  values: TemplateSubTaskFormInput,
): TemplateSubTaskRow {
  return {
    ...row,
    name: values.name,
    qty: values.qty,
    expectedTime: values.expectedTime,
    sharingType: values.sharingType,
    maxSameTimeWorkers: values.maxSameTimeWorkers,
    dependencyIndexes: values.dependencyIds.map(Number),
  };
}

interface SortableTemplateSubTaskRowProps {
  subtask: TemplateSubTaskRow;
  statusLabel: string;
  dragLabel: string;
  openLabel: string;
  disabled: boolean;
  onOpen: (rowKey: string) => void;
}

function SortableTemplateSubTaskRow({
  subtask,
  statusLabel,
  dragLabel,
  openLabel,
  disabled,
  onOpen,
}: SortableTemplateSubTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subtask.rowKey,
    disabled: subtask.isDraft === true || disabled,
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
      onClick={() => onOpen(subtask.rowKey)}
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
        <span>{subtask.name}</span>
      </td>
      <td>{subtask.qty}</td>
      <td>
        <Duration seconds={subtask.expectedTime} />
      </td>
      <td>
        <Duration seconds={0} />
      </td>
      <td>{statusLabel}</td>
    </tr>
  );
}

export function TemplateSubTaskManager({
  subtasks,
  templateName,
  onSubtasksChange,
  disabled = false,
}: TemplateSubTaskManagerProps) {
  const tSubtasks = useTranslations("subtasks");
  const tTasks = useTranslations("tasks");
  const tStatus = useTranslations("tasks.status");
  const [orderedSubtasks, setOrderedSubtasks] = useState(subtasks);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newSubtaskDraft, setNewSubtaskDraft] =
    useState<TemplateSubTaskFormInput>(EMPTY_FORM);
  const [message, setMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setOrderedSubtasks((current) => {
      const drafts = current.filter((item) => item.isDraft);
      if (drafts.length === 0) return subtasks;
      return mergeServerTemplateSubTasksWithDrafts(subtasks, drafts);
    });
  }, [subtasks]);

  function commitRows(rows: TemplateSubTaskRow[]): void {
    setOrderedSubtasks(rows);
    onSubtasksChange(rows);
  }

  function cancelRow(rowKey: string): void {
    if (isDraftTemplateSubTaskRow(rowKey)) {
      commitRows(
        applySequentialSubTaskIndices(
          orderedSubtasks
            .filter((item) => item.rowKey !== rowKey)
            .map((item, index) => ({ ...item, index })),
        ),
      );
    }
    if (editingKey === rowKey) {
      setEditingKey(null);
    }
  }

  function closeModal(): void {
    if (editingKey === NEW_SUBTASK_KEY) {
      if (newSubtaskDraft.name.trim()) {
        const draft = formValuesToDraftRow(
          newSubtaskDraft,
          orderedSubtasks.length,
        );
        commitRows(
          applySequentialSubTaskIndices([...orderedSubtasks, draft]),
        );
      }
      setNewSubtaskDraft(EMPTY_FORM);
    }
    setEditingKey(null);
  }

  function openRow(rowKey: string): void {
    setEditingKey(rowKey);
    setMessage(null);
  }

  function startCreate(): void {
    setNewSubtaskDraft(EMPTY_FORM);
    setEditingKey(NEW_SUBTASK_KEY);
    setMessage(null);
  }

  const handleRowChange = useCallback(
    (rowKey: string, values: TemplateSubTaskFormInput) => {
      setOrderedSubtasks((current) => {
        const next = current.map((row) =>
          row.rowKey === rowKey ? applyFormValuesToRow(row, values) : row,
        );
        onSubtasksChange(next);
        return next;
      });
    },
    [onSubtasksChange],
  );

  function handleClone(rowKey: string): void {
    const sourceIndex = orderedSubtasks.findIndex(
      (item) => item.rowKey === rowKey,
    );
    if (sourceIndex === -1) return;

    const next = insertDraftTemplateSubTaskCloneAt(
      orderedSubtasks,
      sourceIndex,
    );
    const draftKey = next[sourceIndex + 1]?.rowKey;
    commitRows(next);
    if (draftKey) {
      setEditingKey(draftKey);
    }
    setMessage(tSubtasks("cloned"));
  }

  function handleRemove(rowKey: string): void {
    const row = orderedSubtasks.find((item) => item.rowKey === rowKey);
    if (!row) return;

    if (row.isDraft || isDraftTemplateSubTaskRow(rowKey)) {
      cancelRow(rowKey);
      return;
    }

    if (!window.confirm(tSubtasks("removeSubtaskConfirm"))) return;

    commitRows(removeTemplateSubTaskAt(orderedSubtasks, rowKey));
    setMessage(tSubtasks("removed"));
    if (editingKey === rowKey) {
      setEditingKey(null);
    }
  }

  function handleDragEnd(event: DragEndEvent): void {
    const before = orderedSubtasks;
    const nextOrder = resolveTemplateSubTaskReorder(
      orderedSubtasks,
      event.active.id,
      event.over?.id,
    );
    if (!nextOrder) return;

    commitRows(remapTemplateDependencyIndexes(before, nextOrder));
  }

  const isCreatingNew = editingKey === NEW_SUBTASK_KEY;
  const editingSubtask = isCreatingNew
    ? null
    : orderedSubtasks.find((item) => item.rowKey === editingKey) ?? null;
  const isModalOpen = isCreatingNew || editingSubtask !== null;
  const modalTitle =
    isCreatingNew || editingSubtask?.isDraft
      ? tSubtasks("newSubtask")
      : tSubtasks("editSubtask");
  const waitingStatusLabel = tStatus("waiting");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tSubtasks("title")}</h1>
        <Button
          type="button"
          variant="outline"
          onClick={startCreate}
          disabled={disabled}
        >
          {tSubtasks("newSubtask")}
        </Button>
      </div>

      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      <DndContext
        id={TEMPLATE_DND_CONTEXT_ID}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="w-10 py-2" aria-hidden />
              <th className="py-2">{tSubtasks("name")}</th>
              <th>{tSubtasks("qty")}</th>
              <th>{tSubtasks("expectedTime")}</th>
              <th>{tSubtasks("timeSpent")}</th>
              <th>{tTasks("manage.status")}</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={orderedSubtasks.map((subtask) => subtask.rowKey)}
              strategy={verticalListSortingStrategy}
            >
              {orderedSubtasks.map((subtask) => (
                <SortableTemplateSubTaskRow
                  key={subtask.rowKey}
                  subtask={subtask}
                  statusLabel={waitingStatusLabel}
                  dragLabel={tSubtasks("dragToReorder")}
                  openLabel={tSubtasks("toggleSubtaskForm")}
                  disabled={disabled}
                  onOpen={openRow}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>

      <SubTaskFormModal
        open={isModalOpen}
        title={modalTitle}
        subtitle={templateName}
        disabled={disabled}
        onClose={closeModal}
        onClone={
          editingSubtask
            ? () => handleClone(editingSubtask.rowKey)
            : undefined
        }
        onRemove={
          editingSubtask
            ? () => handleRemove(editingSubtask.rowKey)
            : undefined
        }
      >
        {isCreatingNew ? (
          <TemplateSubTaskInlineForm
            formKey={NEW_SUBTASK_KEY}
            defaultValues={newSubtaskDraft}
            dependencyOptions={buildDependencyOptions(orderedSubtasks)}
            isCreate
            hideHeading
            plain
            disabled={disabled}
            onChange={setNewSubtaskDraft}
          />
        ) : null}
        {editingSubtask ? (
          <TemplateSubTaskInlineForm
            formKey={editingSubtask.rowKey}
            defaultValues={templateRowToFormValues(editingSubtask)}
            dependencyOptions={buildDependencyOptions(
              orderedSubtasks,
              editingSubtask.rowKey,
            )}
            currentRowKey={templateDependencyIndexToUiId(editingSubtask.index)}
            isCreate={editingSubtask.isDraft === true}
            hideHeading
            plain
            disabled={disabled}
            onChange={(values) =>
              handleRowChange(editingSubtask.rowKey, values)
            }
          />
        ) : null}
      </SubTaskFormModal>
    </div>
  );
}

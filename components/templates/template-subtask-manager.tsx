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
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
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

import { SubTaskCloneButton } from "../subtasks/subtask-clone-button";
import { SubTaskRemoveButton } from "../subtasks/subtask-remove-button";
import type { SubTaskDependencyOption } from "../subtasks/subtask-dependencies-modal";
import { TemplateSubTaskInlineForm } from "./template-subtask-inline-form";

export interface TemplateSubTaskManagerProps {
  subtasks: TemplateSubTaskRow[];
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

const TABLE_COLUMN_COUNT = 5;
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

function createEmptyDraftRow(index: number): TemplateSubTaskRow {
  return {
    rowKey: `draft:${crypto.randomUUID()}`,
    isDraft: true,
    name: "",
    qty: EMPTY_FORM.qty,
    index,
    expectedTime: EMPTY_FORM.expectedTime,
    sharingType: EMPTY_FORM.sharingType,
    maxSameTimeWorkers: EMPTY_FORM.maxSameTimeWorkers,
    dependencyIndexes: [],
  };
}

interface SortableTemplateSubTaskAccordionProps {
  subtask: TemplateSubTaskRow;
  isExpanded: boolean;
  dragLabel: string;
  toggleLabel: string;
  disabled: boolean;
  dependencyOptions: SubTaskDependencyOption[];
  onToggle: (rowKey: string) => void;
  onChange: (rowKey: string, values: TemplateSubTaskFormInput) => void;
  onCancel: (rowKey: string) => void;
  onClone: (rowKey: string) => void;
  onRemove: (rowKey: string) => void;
}

function SortableTemplateSubTaskAccordion({
  subtask,
  isExpanded,
  dragLabel,
  toggleLabel,
  disabled,
  dependencyOptions,
  onToggle,
  onChange,
  onCancel,
  onClone,
  onRemove,
}: SortableTemplateSubTaskAccordionProps) {
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

  const handleChange = useCallback(
    (values: TemplateSubTaskFormInput) => onChange(subtask.rowKey, values),
    [onChange, subtask.rowKey],
  );

  return (
    <tbody
      ref={setNodeRef}
      style={style}
      className={isDragging ? "bg-muted/50" : undefined}
    >
      <tr
        className="cursor-pointer border-b hover:bg-muted/30"
        onClick={() => onToggle(subtask.rowKey)}
        aria-expanded={isExpanded}
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
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className="sr-only">{toggleLabel}</span>
            <span>{subtask.name || "—"}</span>
          </div>
        </td>
        <td>{subtask.qty}</td>
        <td>
          <Duration seconds={subtask.expectedTime} />
        </td>
        <td className="w-20 py-2 text-right">
          <div className="flex justify-end">
            <SubTaskCloneButton
              onClick={() => onClone(subtask.rowKey)}
              disabled={disabled}
            />
            <SubTaskRemoveButton
              onClick={() => onRemove(subtask.rowKey)}
              disabled={disabled}
            />
          </div>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="border-b">
          <td colSpan={TABLE_COLUMN_COUNT} className="p-4">
            <TemplateSubTaskInlineForm
              formKey={subtask.rowKey}
              defaultValues={templateRowToFormValues(subtask)}
              dependencyOptions={dependencyOptions}
              currentRowKey={templateDependencyIndexToUiId(subtask.index)}
              isCreate={subtask.isDraft === true}
              disabled={disabled}
              onChange={handleChange}
              onCancel={() => onCancel(subtask.rowKey)}
            />
          </td>
        </tr>
      ) : null}
    </tbody>
  );
}

export function TemplateSubTaskManager({
  subtasks,
  onSubtasksChange,
  disabled = false,
}: TemplateSubTaskManagerProps) {
  const tSubtasks = useTranslations("subtasks");
  const tTemplates = useTranslations("templates");
  const [orderedSubtasks, setOrderedSubtasks] = useState(subtasks);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
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

  function collapsePanel(): void {
    setExpandedKey(null);
  }

  function applyRowUpdate(
    rowKey: string,
    values: TemplateSubTaskFormInput,
  ): TemplateSubTaskRow[] {
    return orderedSubtasks.map((row) =>
      row.rowKey === rowKey
        ? {
            ...row,
            name: values.name,
            qty: values.qty,
            expectedTime: values.expectedTime,
            sharingType: values.sharingType,
            maxSameTimeWorkers: values.maxSameTimeWorkers,
            dependencyIndexes: values.dependencyIds.map(Number),
          }
        : row,
    );
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
    collapsePanel();
  }

  function toggleRow(rowKey: string): void {
    setExpandedKey((current) => (current === rowKey ? null : rowKey));
    setMessage(null);
  }

  function startCreate(): void {
    const draft = createEmptyDraftRow(orderedSubtasks.length);
    const nextRows = applySequentialSubTaskIndices([
      ...orderedSubtasks,
      draft,
    ]);
    commitRows(nextRows);
    setExpandedKey(draft.rowKey);
    setMessage(null);
  }

  function handleChangeRow(
    rowKey: string,
    values: TemplateSubTaskFormInput,
  ): void {
    commitRows(applyRowUpdate(rowKey, values));
  }

  function handleClone(rowKey: string): void {
    const sourceIndex = orderedSubtasks.findIndex((item) => item.rowKey === rowKey);
    if (sourceIndex === -1) return;

    let draftKey: string | undefined;
    const next = insertDraftTemplateSubTaskCloneAt(orderedSubtasks, sourceIndex);
    draftKey = next[sourceIndex + 1]?.rowKey;
    commitRows(next);
    if (draftKey) {
      setExpandedKey(draftKey);
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

    const nextRows = removeTemplateSubTaskAt(orderedSubtasks, rowKey);
    commitRows(nextRows);
    setMessage(tSubtasks("removed"));
    collapsePanel();
  }

  function handleDragEnd(event: DragEndEvent): void {
    const before = orderedSubtasks;
    const nextOrder = resolveTemplateSubTaskReorder(
      orderedSubtasks,
      event.active.id,
      event.over?.id,
    );
    if (!nextOrder) return;

    const remapped = remapTemplateDependencyIndexes(before, nextOrder);
    commitRows(remapped);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{tTemplates("subtasks")}</h2>
        <Button type="button" variant="outline" onClick={startCreate} disabled={disabled}>
          {tTemplates("addSubtask")}
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
              <th className="w-20 py-2" aria-hidden />
            </tr>
          </thead>
          <SortableContext
            items={orderedSubtasks.map((subtask) => subtask.rowKey)}
            strategy={verticalListSortingStrategy}
          >
            {orderedSubtasks.map((subtask) => (
              <SortableTemplateSubTaskAccordion
                key={subtask.rowKey}
                subtask={subtask}
                dragLabel={tSubtasks("dragToReorder")}
                toggleLabel={tSubtasks("toggleSubtaskForm")}
                isExpanded={expandedKey === subtask.rowKey}
                disabled={disabled}
                dependencyOptions={buildDependencyOptions(
                  orderedSubtasks,
                  subtask.rowKey,
                )}
                onToggle={toggleRow}
                onChange={handleChangeRow}
                onCancel={cancelRow}
                onClone={handleClone}
                onRemove={handleRemove}
              />
            ))}
          </SortableContext>
        </table>
      </DndContext>
    </div>
  );
}

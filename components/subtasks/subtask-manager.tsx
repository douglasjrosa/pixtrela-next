"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

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
  insertDraftSubTaskCloneAt,
  isDraftSubTaskId,
  mergeServerSubtasksWithDrafts,
} from "@/lib/business/subtask-draft";
import { normalizeSubTaskCreateValues } from "@/lib/business/subtask-create-fields";
import { calculateSubTaskDisplayQty } from "@/lib/business/subtask-display-qty";
import { formatTaskDisplayTitle } from "@/lib/business/task-display-title";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

import { SubTaskFormModal } from "./subtask-form-modal";
import { SubTaskInlineForm } from "./subtask-inline-form";
import type { SubTaskDependencyOption } from "./subtask-dependencies-modal";

export interface UserOption {
  documentId: string;
  name: string;
}

export interface TeamAssignmentOption {
  documentId: string;
  name: string;
  members: UserOption[];
}

export interface SubTaskRow {
  documentId: string;
  name: string;
  qty: number;
  index: number;
  expectedTime: number;
  timeSpent: number;
  sharingType: SubTaskFormInput["sharingType"];
  maxSameTimeWorkers: number;
  status: SubTaskFormInput["status"];
  activationStatus: SubTaskFormInput["activationStatus"];
  reasonForDisabling?: string;
  dependencyIds?: string[];
  assignedToIds?: string[];
  /** Client-only clone; persisted when the user saves the task. */
  isDraft?: boolean;
}

export type SubTaskCreateOptions = {
  insertAtIndex?: number;
};

export interface SubTaskManagerProps {
  subtasks: SubTaskRow[];
  taskName: string;
  taskQty: number;
  teams: TeamAssignmentOption[];
  disabled?: boolean;
  onCreate: (
    values: SubTaskFormInput,
    options?: SubTaskCreateOptions,
  ) => void | Promise<void>;
  onUpdate: (documentId: string, values: SubTaskFormInput) => void | Promise<void>;
  onReorder?: (orderedDocumentIds: string[]) => void | Promise<void>;
  onDelete: (documentId: string) => void | Promise<void>;
}

export interface SubTaskManagerHandle {
  flushChanges: () => Promise<void>;
}

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

const NEW_SUBTASK_KEY = "new";
const SUBTASK_DND_CONTEXT_ID = "subtask-manager-dnd";

/** Pure drag-end resolver for tests and SubTaskManager. */
export function resolveSubTaskReorder(
  items: SubTaskRow[],
  activeId: unknown,
  overId: unknown,
): SubTaskRow[] | null {
  if (typeof activeId !== "string" || typeof overId !== "string") return null;
  return reorderSubTasksByDrag(items, activeId, overId);
}

function subTaskToFormValues(subtask: SubTaskRow): SubTaskFormInput {
  return {
    name: subtask.name,
    qty: subtask.qty,
    expectedTime: subtask.expectedTime,
    sharingType: subtask.sharingType,
    maxSameTimeWorkers: subtask.maxSameTimeWorkers,
    status: subtask.status,
    activationStatus: subtask.activationStatus ?? "locked",
    reasonForDisabling: subtask.reasonForDisabling ?? "",
    dependencyIds: subtask.dependencyIds ?? [],
    assignedToIds: subtask.assignedToIds ?? [],
  };
}

function applyFormValuesToRow(
  row: SubTaskRow,
  values: SubTaskFormInput,
): SubTaskRow {
  return {
    ...row,
    name: values.name,
    qty: values.qty,
    expectedTime: values.expectedTime,
    sharingType: values.sharingType,
    maxSameTimeWorkers: values.maxSameTimeWorkers,
    status: values.status,
    activationStatus: values.activationStatus,
    reasonForDisabling: values.reasonForDisabling,
    dependencyIds: values.dependencyIds,
    assignedToIds: values.assignedToIds,
  };
}

function subTaskFormValuesEqual(
  left: SubTaskFormInput,
  right: SubTaskFormInput,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getPersistedSubTaskStatusSiblings(
  subtasks: SubTaskRow[],
): Array<{ documentId: string; status: SubTaskFormInput["status"] }> {
  return subtasks
    .filter(
      (item) => !item.isDraft && !isDraftSubTaskId(item.documentId),
    )
    .map((item) => ({ documentId: item.documentId, status: item.status }));
}

function applyAutomaticCreateFields(
  values: SubTaskFormInput,
  subtasks: SubTaskRow[],
): SubTaskFormInput {
  return normalizeSubTaskCreateValues(
    values,
    getPersistedSubTaskStatusSiblings(subtasks),
  );
}

function buildDependencyOptions(
  subtasks: SubTaskRow[],
  excludeDocumentId?: string,
): SubTaskDependencyOption[] {
  return subtasks
    .filter(
      (item) =>
        item.documentId !== excludeDocumentId &&
        !item.isDraft &&
        !isDraftSubTaskId(item.documentId),
    )
    .map((item) => ({ documentId: item.documentId, name: item.name }));
}

interface SortableSubTaskRowProps {
  subtask: SubTaskRow;
  displayQty: number;
  statusLabel: string;
  dragLabel: string;
  openLabel: string;
  disabled: boolean;
  onOpen: (documentId: string) => void;
}

function SortableSubTaskRow({
  subtask,
  displayQty,
  statusLabel,
  dragLabel,
  openLabel,
  disabled,
  onOpen,
}: SortableSubTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subtask.documentId,
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
      onClick={() => onOpen(subtask.documentId)}
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
      <td>{displayQty}</td>
      <td>
        <Duration seconds={subtask.expectedTime} />
      </td>
      <td>
        <Duration seconds={subtask.timeSpent} />
      </td>
      <td>{statusLabel}</td>
    </tr>
  );
}

export const SubTaskManager = forwardRef<SubTaskManagerHandle, SubTaskManagerProps>(
  function SubTaskManager(
    {
      subtasks,
      taskName,
      taskQty,
      teams,
      disabled = false,
      onCreate,
      onUpdate,
      onReorder,
      onDelete,
    },
    ref,
  ) {
    const tSubtasks = useTranslations("subtasks");
    const tTasks = useTranslations("tasks");
    const tStatus = useTranslations("tasks.status");
    const [orderedSubtasks, setOrderedSubtasks] = useState(subtasks);
    const [removedDocumentIds, setRemovedDocumentIds] = useState<string[]>([]);
    const removedDocumentIdsRef = useRef(removedDocumentIds);
    removedDocumentIdsRef.current = removedDocumentIds;
    const flushInFlightRef = useRef(false);
    const persistedDraftIdsRef = useRef(new Set<string>());
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [newSubtaskDraft, setNewSubtaskDraft] =
      useState<SubTaskFormInput>(EMPTY_FORM);
    const [message, setMessage] = useState<string | null>(null);

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    useEffect(() => {
      setOrderedSubtasks((current) => {
        const drafts = current.filter(
          (item) =>
            item.isDraft &&
            !persistedDraftIdsRef.current.has(item.documentId),
        );
        const merged = mergeServerSubtasksWithDrafts(subtasks, drafts);
        const removed = new Set(removedDocumentIdsRef.current);
        return applySequentialSubTaskIndices(
          merged.filter((item) => !removed.has(item.documentId)),
        );
      });
    }, [subtasks]);

    const isBusy = disabled;

    function closeModal(): void {
      if (editingKey === NEW_SUBTASK_KEY) {
        setNewSubtaskDraft(EMPTY_FORM);
      }
      setEditingKey(null);
    }

    function cancelRow(documentId: string): void {
      if (isDraftSubTaskId(documentId)) {
        setOrderedSubtasks((current) =>
          applySequentialSubTaskIndices(
            current.filter((item) => item.documentId !== documentId),
          ),
        );
      }
      if (editingKey === documentId) {
        setEditingKey(null);
      }
    }

    function openRow(documentId: string): void {
      setEditingKey(documentId);
      setMessage(null);
    }

    function startCreate(): void {
      setNewSubtaskDraft(EMPTY_FORM);
      setEditingKey(NEW_SUBTASK_KEY);
      setMessage(null);
    }

    const handleRowChange = useCallback(
      (documentId: string, values: SubTaskFormInput) => {
        setOrderedSubtasks((current) =>
          current.map((row) =>
            row.documentId === documentId
              ? applyFormValuesToRow(row, values)
              : row,
          ),
        );
      },
      [],
    );

    const flushChanges = useCallback(async (): Promise<void> => {
      if (flushInFlightRef.current) return;
      flushInFlightRef.current = true;

      try {
        const idsToDelete = [...removedDocumentIds];
        for (const documentId of idsToDelete) {
          await onDelete(documentId);
        }
        if (idsToDelete.length > 0) {
          setRemovedDocumentIds([]);
        }

        const persistedIds = orderedSubtasks
          .filter(
            (row) => !row.isDraft && !isDraftSubTaskId(row.documentId),
          )
          .map((row) => row.documentId);
        const serverOrder = subtasks
          .map((row) => row.documentId)
          .filter((documentId) => !idsToDelete.includes(documentId));

        if (
          onReorder &&
          JSON.stringify(persistedIds) !== JSON.stringify(serverOrder)
        ) {
          await onReorder(persistedIds);
        }

        const flushedDraftIds: string[] = [];
        for (const row of orderedSubtasks) {
          const values = subTaskToFormValues(row);
          const isDraftRow =
            row.isDraft === true || isDraftSubTaskId(row.documentId);
          if (isDraftRow) {
            if (persistedDraftIdsRef.current.has(row.documentId)) {
              flushedDraftIds.push(row.documentId);
              continue;
            }
            await onCreate(
              applyAutomaticCreateFields(values, orderedSubtasks),
              { insertAtIndex: row.index },
            );
            persistedDraftIdsRef.current.add(row.documentId);
            flushedDraftIds.push(row.documentId);
            continue;
          }

          const original = subtasks.find(
            (item) => item.documentId === row.documentId,
          );
          if (!original) continue;

          if (!subTaskFormValuesEqual(values, subTaskToFormValues(original))) {
            await onUpdate(row.documentId, values);
          }
        }

        if (flushedDraftIds.length > 0) {
          const flushed = new Set(flushedDraftIds);
          setOrderedSubtasks((current) =>
            applySequentialSubTaskIndices(
              current.filter((row) => !flushed.has(row.documentId)),
            ),
          );
          if (editingKey != null && flushed.has(editingKey)) {
            setEditingKey(null);
          }
        }

        if (editingKey === NEW_SUBTASK_KEY && newSubtaskDraft.name.trim()) {
          await onCreate(
            applyAutomaticCreateFields(newSubtaskDraft, orderedSubtasks),
          );
          setNewSubtaskDraft(EMPTY_FORM);
          setEditingKey(null);
        }
      } finally {
        flushInFlightRef.current = false;
      }
    }, [
      orderedSubtasks,
      removedDocumentIds,
      subtasks,
      onCreate,
      onUpdate,
      onReorder,
      onDelete,
      editingKey,
      newSubtaskDraft,
    ]);

    useImperativeHandle(ref, () => ({ flushChanges }), [flushChanges]);

    function handleClone(documentId: string): void {
      const sourceIndex = orderedSubtasks.findIndex(
        (item) => item.documentId === documentId,
      );
      if (sourceIndex === -1) return;

      let draftId: string | undefined;
      setOrderedSubtasks((current) => {
        const next = insertDraftSubTaskCloneAt(current, sourceIndex);
        draftId = next[sourceIndex + 1]?.documentId;
        return next;
      });
      if (draftId) {
        setEditingKey(draftId);
      }
      setMessage(tSubtasks("cloned"));
    }

    function handleRemove(documentId: string): void {
      const row = orderedSubtasks.find((item) => item.documentId === documentId);
      if (!row) return;

      if (row.isDraft || isDraftSubTaskId(documentId)) {
        cancelRow(documentId);
        return;
      }

      if (!window.confirm(tSubtasks("removeSubtaskConfirm"))) return;

      setRemovedDocumentIds((current) =>
        current.includes(documentId) ? current : [...current, documentId],
      );
      setOrderedSubtasks((current) =>
        applySequentialSubTaskIndices(
          current.filter((item) => item.documentId !== documentId),
        ),
      );
      setMessage(tSubtasks("removed"));
      if (editingKey === documentId) {
        setEditingKey(null);
      }
    }

    function handleDragEnd(event: DragEndEvent): void {
      const nextOrder = resolveSubTaskReorder(
        orderedSubtasks,
        event.active.id,
        event.over?.id,
      );
      if (!nextOrder) return;

      setOrderedSubtasks(nextOrder);
    }

    const isCreatingNew = editingKey === NEW_SUBTASK_KEY;
    const editingSubtask = isCreatingNew
      ? null
      : orderedSubtasks.find((item) => item.documentId === editingKey) ?? null;
    const isModalOpen = isCreatingNew || editingSubtask !== null;
    const modalTitle = isCreatingNew || editingSubtask?.isDraft
      ? tSubtasks("newSubtask")
      : tSubtasks("editSubtask");
    const taskDisplayTitle = formatTaskDisplayTitle(taskQty, taskName);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{tSubtasks("title")}</h1>
          <Button
            type="button"
            variant="outline"
            onClick={startCreate}
            disabled={isBusy}
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
          id={SUBTASK_DND_CONTEXT_ID}
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
                items={orderedSubtasks.map((subtask) => subtask.documentId)}
                strategy={verticalListSortingStrategy}
              >
                {orderedSubtasks.map((subtask) => (
                  <SortableSubTaskRow
                    key={subtask.documentId}
                    subtask={subtask}
                    displayQty={calculateSubTaskDisplayQty(subtask.qty, taskQty)}
                    statusLabel={tStatus(subtask.status)}
                    dragLabel={tSubtasks("dragToReorder")}
                    openLabel={tSubtasks("toggleSubtaskForm")}
                    disabled={isBusy}
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
          subtitle={taskDisplayTitle}
          disabled={isBusy}
          onClose={closeModal}
          onClone={
            editingSubtask
              ? () => handleClone(editingSubtask.documentId)
              : undefined
          }
          onRemove={
            editingSubtask
              ? () => handleRemove(editingSubtask.documentId)
              : undefined
          }
        >
          {isCreatingNew ? (
            <SubTaskInlineForm
              formKey={NEW_SUBTASK_KEY}
              defaultValues={newSubtaskDraft}
              teams={teams}
              dependencyOptions={buildDependencyOptions(orderedSubtasks)}
              isCreate
              hideHeading
              hideStatus
              hideActivationStatus
              hideAssignees
              plain
              disabled={isBusy}
              onChange={(values) =>
                setNewSubtaskDraft(
                  applyAutomaticCreateFields(values, orderedSubtasks),
                )
              }
            />
          ) : null}
          {editingSubtask ? (
            <SubTaskInlineForm
              formKey={editingSubtask.documentId}
              defaultValues={subTaskToFormValues(editingSubtask)}
              teams={teams}
              dependencyOptions={buildDependencyOptions(
                orderedSubtasks,
                editingSubtask.documentId,
              )}
              currentDocumentId={
                editingSubtask.isDraft ? undefined : editingSubtask.documentId
              }
              isCreate={editingSubtask.isDraft === true}
              hideHeading
              hideStatus
              hideActivationStatus
              hideAssignees
              plain
              disabled={isBusy}
              onChange={(values) =>
                handleRowChange(
                  editingSubtask.documentId,
                  editingSubtask.isDraft
                    ? applyAutomaticCreateFields(values, orderedSubtasks)
                    : values,
                )
              }
            />
          ) : null}
        </SubTaskFormModal>
      </div>
    );
  },
);

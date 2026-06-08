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

import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";

import { useTranslations } from "next-intl";



import { Button } from "@/components/ui/button";
import { Duration } from "@/components/ui/duration";

import {

  reorderSubTasksByDrag,

} from "@/lib/business/subtask-order";

import { calculateSubTaskDisplayQty } from "@/lib/business/subtask-display-qty";

import { parseSubTaskDependencyIds } from "@/lib/business/subtask-dependencies";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

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

}



export interface SubTaskManagerProps {

  subtasks: SubTaskRow[];

  taskQty: number;

  teams: TeamAssignmentOption[];

  onCreate: (values: SubTaskFormInput) => void | Promise<void>;

  onUpdate: (documentId: string, values: SubTaskFormInput) => void | Promise<void>;

  onReorder?: (orderedDocumentIds: string[]) => void | Promise<void>;

}



const EMPTY_FORM: SubTaskFormInput = {

  name: "",

  qty: 1,

  expectedTime: 0,

  sharingType: "duration",

  maxSameTimeWorkers: 1,

  status: "queued",

  activationStatus: "locked",

  reasonForDisabling: "",

  dependencyIds: [],

  assignedToIds: [],

};



const NEW_SUBTASK_KEY = "new";

const TABLE_COLUMN_COUNT = 6;

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

function buildDependencyOptions(
  subtasks: SubTaskRow[],
  excludeDocumentId?: string,
): SubTaskDependencyOption[] {
  return subtasks
    .filter((item) => item.documentId !== excludeDocumentId)
    .map((item) => ({ documentId: item.documentId, name: item.name }));
}



interface SortableSubTaskAccordionProps {

  subtask: SubTaskRow;

  displayQty: number;

  statusLabel: string;

  dragLabel: string;

  toggleLabel: string;

  isExpanded: boolean;

  teams: TeamAssignmentOption[];

  dependencyOptions: SubTaskDependencyOption[];

  isPending: boolean;

  onToggle: (documentId: string) => void;

  onSubmit: (documentId: string, values: SubTaskFormInput) => void;

  onCancel: () => void;

}



function SortableSubTaskAccordion({

  subtask,

  displayQty,

  statusLabel,

  dragLabel,

  toggleLabel,

  isExpanded,

  teams,

  dependencyOptions,

  isPending,

  onToggle,

  onSubmit,

  onCancel,

}: SortableSubTaskAccordionProps) {

  const {

    attributes,

    listeners,

    setNodeRef,

    transform,

    transition,

    isDragging,

  } = useSortable({ id: subtask.documentId });



  const style = {

    transform: CSS.Transform.toString(transform),

    transition,

  };



  return (

    <tbody

      ref={setNodeRef}

      style={style}

      className={isDragging ? "bg-muted/50" : undefined}

    >

      <tr

        className="cursor-pointer border-b hover:bg-muted/30"

        onClick={() => onToggle(subtask.documentId)}

        aria-expanded={isExpanded}

      >

        <td className="w-10 py-2">

          <button

            type="button"

            className="cursor-grab rounded p-1 text-muted-foreground hover:text-foreground"

            aria-label={dragLabel}

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

            <span>{subtask.name}</span>

          </div>

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

      {isExpanded ? (

        <tr className="border-b">

          <td colSpan={TABLE_COLUMN_COUNT} className="p-4">

            <SubTaskInlineForm

              formKey={subtask.documentId}

              defaultValues={subTaskToFormValues(subtask)}

              teams={teams}

              dependencyOptions={dependencyOptions}

              currentDocumentId={subtask.documentId}

              isPending={isPending}

              onSubmit={(values) => onSubmit(subtask.documentId, values)}

              onCancel={onCancel}

            />

          </td>

        </tr>

      ) : null}

    </tbody>

  );

}



export function SubTaskManager({

  subtasks,

  taskQty,

  teams,

  onCreate,

  onUpdate,

  onReorder,

}: SubTaskManagerProps) {

  const tSubtasks = useTranslations("subtasks");

  const tTasks = useTranslations("tasks");

  const tStatus = useTranslations("tasks.status");

  const [orderedSubtasks, setOrderedSubtasks] = useState(subtasks);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const [message, setMessage] = useState<string | null>(null);



  const sensors = useSensors(

    useSensor(PointerSensor),

    useSensor(KeyboardSensor, {

      coordinateGetter: sortableKeyboardCoordinates,

    }),

  );



  useEffect(() => {

    setOrderedSubtasks(subtasks);

  }, [subtasks]);



  function collapsePanel(): void {

    setExpandedKey(null);

  }



  function toggleRow(documentId: string): void {

    setExpandedKey((current) => (current === documentId ? null : documentId));

    setMessage(null);

  }



  function startCreate(): void {

    setExpandedKey(NEW_SUBTASK_KEY);

    setMessage(null);

  }



  function handleCreate(values: SubTaskFormInput): void {

    startTransition(async () => {

      await onCreate(values);

      setMessage(tSubtasks("saved"));

      collapsePanel();

    });

  }



  function handleUpdate(documentId: string, values: SubTaskFormInput): void {

    startTransition(async () => {

      await onUpdate(documentId, values);

      setMessage(tSubtasks("saved"));

      collapsePanel();

    });

  }



  function handleDragEnd(event: DragEndEvent): void {

    const nextOrder = resolveSubTaskReorder(

      orderedSubtasks,

      event.active.id,

      event.over?.id,

    );

    if (!nextOrder || !onReorder) return;



    setOrderedSubtasks(nextOrder);

    startTransition(async () => {

      await onReorder(nextOrder.map((subtask) => subtask.documentId));

    });

  }



  const isNewExpanded = expandedKey === NEW_SUBTASK_KEY;



  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <h1 className="text-2xl font-bold">{tSubtasks("title")}</h1>

        <Button type="button" variant="outline" onClick={startCreate}>

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

          <SortableContext

            items={orderedSubtasks.map((subtask) => subtask.documentId)}

            strategy={verticalListSortingStrategy}

          >

            {orderedSubtasks.map((subtask) => (

              <SortableSubTaskAccordion

                key={subtask.documentId}

                subtask={subtask}

                displayQty={calculateSubTaskDisplayQty(subtask.qty, taskQty)}

                statusLabel={tStatus(subtask.status)}

                dragLabel={tSubtasks("dragToReorder")}

                toggleLabel={tSubtasks("toggleSubtaskForm")}

                isExpanded={expandedKey === subtask.documentId}

                teams={teams}

                dependencyOptions={buildDependencyOptions(
                  orderedSubtasks,
                  subtask.documentId,
                )}

                isPending={isPending}

                onToggle={toggleRow}

                onSubmit={handleUpdate}

                onCancel={collapsePanel}

              />

            ))}

          </SortableContext>

          {isNewExpanded ? (

            <tbody>

              <tr className="border-b">

                <td colSpan={TABLE_COLUMN_COUNT} className="p-4">

                  <SubTaskInlineForm

                    formKey={NEW_SUBTASK_KEY}

                    defaultValues={EMPTY_FORM}

                    teams={teams}

                    dependencyOptions={buildDependencyOptions(orderedSubtasks)}

                    isCreate

                    isPending={isPending}

                    onSubmit={handleCreate}

                    onCancel={collapsePanel}

                  />

                </td>

              </tr>

            </tbody>

          ) : null}

        </table>

      </DndContext>

    </div>

  );

}


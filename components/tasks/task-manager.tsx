"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  createTask,
  deactivateTask,
  deleteTask,
} from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { CardBadge } from "@/components/ui/card";
import { Duration } from "@/components/ui/duration";
import { formatDatePtBr } from "@/lib/format/datetime";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TaskFormInput } from "@/lib/schemas/task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { TaskForm } from "./task-form";
import { TaskRowActions } from "./task-row-actions";

export interface StepOption {
  documentId: string;
  name: string;
}

export interface TaskRow {
  documentId: string;
  name: string;
  qty: number;
  deliveryDate?: string | null;
  index: number;
  status: TaskFormInput["status"];
  active: boolean;
  templateTaskCode?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  totalExpectedTime: number;
  totalTimeSpent: number;
  step?: { documentId: string; name: string } | null;
}

export interface TaskManagerProps {
  tasks: TaskRow[];
  steps: StepOption[];
  canDelete: boolean;
}

const EMPTY_FORM: TaskFormInput = {
  name: "",
  qty: 1,
  deliveryDate: "",
  stepDocumentId: "",
  status: "queued",
  templateTaskCode: "",
};

export function TaskManager({ tasks, steps, canDelete }: TaskManagerProps) {
  const tManage = useTranslations("tasks.manage");
  const tStatus = useTranslations("tasks.status");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  function handleCreate(values: TaskFormInput): void {
    startTransition(async () => {
      try {
        await createTask(values);
        showSuccessToast(tManage("saved"));
        setFormKey((current) => current + 1);
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  function handleInvalidCreate(): void {
    showErrorToast(tManage("validationError"));
  }

  function handleDeactivate(documentId: string): void {
    if (!window.confirm(tManage("deactivateConfirm"))) return;
    startTransition(async () => {
      try {
        await deactivateTask(documentId);
        showSuccessToast(tManage("deactivated"));
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  function handleDelete(documentId: string): void {
    if (!window.confirm(tManage("deleteConfirm"))) return;
    startTransition(async () => {
      try {
        await deleteTask(documentId);
        showSuccessToast(tManage("deleted"));
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tManage("title")}</h1>
      </div>

      <TaskForm
        key={formKey}
        mode="create"
        defaultValues={EMPTY_FORM}
        steps={steps}
        isPending={isPending}
        onSubmit={handleCreate}
        onInvalid={handleInvalidCreate}
      />

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">{tManage("name")}</th>
            <th>{tManage("qty")}</th>
            <th>{tManage("deliveryDate")}</th>
            <th>{tManage("totalExpectedTime")}</th>
            <th>{tManage("totalTimeSpent")}</th>
            <th>{tManage("status")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.documentId} className="border-b">
              <td className="py-2">
                <Link
                  href={`/tasks/${task.documentId}`}
                  className="hover:underline"
                >
                  {task.name}
                </Link>
                {!task.active ? (
                  <CardBadge className="ml-2">{tManage("inactive")}</CardBadge>
                ) : null}
              </td>
              <td>{task.qty}</td>
              <td>{formatDatePtBr(task.deliveryDate)}</td>
              <td>
                <Duration seconds={task.totalExpectedTime} />
              </td>
              <td>
                <Duration seconds={task.totalTimeSpent} />
              </td>
              <td>{tStatus(task.status)}</td>
              <td className="space-x-2">
                <TaskRowActions
                  documentId={task.documentId}
                  active={task.active}
                  canDelete={canDelete}
                  onDeactivate={handleDeactivate}
                  onDelete={handleDelete}
                  pending={isPending}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

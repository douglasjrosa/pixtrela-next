"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { lookupTemplateNameByCode } from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { DeactivationReasonField } from "@/components/ui/deactivation-reason-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  taskDeactivationSchema,
  taskFormSchema,
  TASK_STATUSES,
  type TaskFormInput,
} from "@/lib/schemas/task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

export interface TaskFormProps {
  mode: "create" | "edit";
  defaultValues: TaskFormInput;
  isPending?: boolean;
  layout?: "standalone" | "embedded";
  formTitleId?: string;
  active?: boolean;
  reasonForDeactivation?: string | null;
  canDeactivate?: boolean;
  canDelete?: boolean;
  onSubmit: (values: TaskFormInput) => void;
  onInvalid?: () => void;
  onCancel?: () => void;
  onDeactivate?: (reasonForDeactivation: string) => void;
  onReactivate?: (reasonForDeactivation: string) => void;
  onDelete?: () => void;
  hideActions?: boolean;
  formId?: string;
}

export function TaskForm({
  mode,
  defaultValues,
  isPending = false,
  layout = "standalone",
  formTitleId = "task-form-title",
  active = true,
  reasonForDeactivation: savedReasonForDeactivation = "",
  canDeactivate = false,
  canDelete = false,
  onSubmit,
  onInvalid,
  onCancel,
  onDeactivate,
  onReactivate,
  onDelete,
  hideActions = false,
  formId,
}: TaskFormProps) {
  const tCommon = useTranslations("common");
  const tManage = useTranslations("tasks.manage");
  const tStatus = useTranslations("tasks.status");
  const [isLoadingTemplate, startLoadTemplate] = useTransition();
  const [isReasonPanelOpen, setIsReasonPanelOpen] = useState(false);
  const [reasonForDeactivation, setReasonForDeactivation] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema) as Resolver<TaskFormInput>,
    defaultValues,
  });

  function handleLoadTemplate(): void {
    const code = getValues("templateTaskCode")?.trim() ?? "";
    if (!code) {
      showErrorToast(tManage("loadTemplateMissingCode"));
      return;
    }

    startLoadTemplate(async () => {
      try {
        const template = await lookupTemplateNameByCode(code);
        setValue("name", template.name, { shouldValidate: true });
        showSuccessToast(tManage("loadTemplateSuccess"));
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("loadTemplateError"));
      }
    });
  }

  function closeReasonPanel(): void {
    setIsReasonPanelOpen(false);
    setReasonForDeactivation("");
    setReasonError(null);
  }

  function beginArchiveAction(): void {
    setIsReasonPanelOpen(true);
    setReasonError(null);
    setReasonForDeactivation(
      active ? "" : (savedReasonForDeactivation ?? ""),
    );
  }

  function confirmArchiveAction(): void {
    const parsed = taskDeactivationSchema.safeParse({
      reasonForDeactivation,
    });
    if (!parsed.success) {
      setReasonError(
        parsed.error.issues[0]?.message ?? tManage("validationError"),
      );
      return;
    }

    const reason = parsed.data.reasonForDeactivation.trim();
    setReasonError(null);
    if (active) {
      onDeactivate?.(reason);
      return;
    }
    onReactivate?.(reason);
  }

  const showArchive =
    mode === "edit" &&
    canDeactivate &&
    Boolean(active ? onDeactivate : onReactivate);
  const showDelete =
    mode === "edit" && !active && canDelete && Boolean(onDelete);

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        layout === "standalone" && "rounded-lg border p-4",
      )}
    >
      <h2
        id={formTitleId}
        className={cn(
          "text-lg font-semibold sm:col-span-2",
          layout === "embedded" && "pr-8",
        )}
      >
        {mode === "edit" ? tManage("editTask") : tManage("newTask")}
      </h2>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="templateTaskCode">{tManage("templateTaskCode")}</Label>
        <div className="flex gap-2">
          <Input
            id="templateTaskCode"
            className="flex-1"
            {...register("templateTaskCode")}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isLoadingTemplate || isPending}
            onClick={handleLoadTemplate}
          >
            {tManage("loadTemplate")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{tManage("name")}</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="qty">{tManage("qty")}</Label>
        <Input
          id="qty"
          type="number"
          min={1}
          {...register("qty", { valueAsNumber: true })}
        />
        {errors.qty ? (
          <p className="text-sm text-destructive">{errors.qty.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryDate">{tManage("deliveryDate")}</Label>
        <Input id="deliveryDate" type="date" {...register("deliveryDate")} />
        {errors.deliveryDate ? (
          <p className="text-sm text-destructive">
            {errors.deliveryDate.message}
          </p>
        ) : null}
      </div>

      <input type="hidden" {...register("stepDocumentId")} />

      {mode === "create" ? (
        <input type="hidden" {...register("status")} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor="status">{tManage("status")}</Label>
          <div className="flex gap-2">
            <select
              id="status"
              className={cn(
                "flex h-9 min-w-0 flex-1 rounded-md border border-input",
                "bg-transparent px-3 text-sm",
              )}
              {...register("status")}
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {tStatus(status)}
                </option>
              ))}
            </select>
            {showArchive ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isPending}
                aria-label={
                  active ? tManage("deactivate") : tManage("reactivate")
                }
                onClick={beginArchiveAction}
              >
                <Archive className="size-4" aria-hidden />
              </Button>
            ) : null}
            {showDelete ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                disabled={isPending}
                aria-label={tManage("delete")}
                onClick={onDelete}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {showArchive && isReasonPanelOpen ? (
        <>
          <DeactivationReasonField
            id="reasonForDeactivation"
            label={tManage("reasonForDeactivation")}
            value={reasonForDeactivation}
            disabled={isPending}
            errorMessage={reasonError}
            onChange={(next) => {
              setReasonForDeactivation(next);
              setReasonError(null);
            }}
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button
              type="button"
              variant={active ? "destructive" : "default"}
              disabled={isPending}
              onClick={confirmArchiveAction}
            >
              {active
                ? tManage("confirmDeactivate")
                : tManage("confirmReactivate")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={closeReasonPanel}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </>
      ) : null}

      {hideActions ? null : (
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={isPending}>
            {tCommon("save")}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              {tCommon("cancel")}
            </Button>
          ) : null}
        </div>
      )}
    </form>
  );
}

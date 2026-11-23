"use client";

import { Suspense, useState, useTransition, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { AddNewButton } from "@/components/ui/add-new-button";
import { Button } from "@/components/ui/button";
import { DatePtBrInput } from "@/components/ui/date-ptbr-input";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListPageActionsProvider } from "@/components/ui/list-page-actions-slot";
import { Textarea } from "@/components/ui/textarea";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  DEFAULT_WORKDAY_TIMEZONE,
  WORKDAY_TIMEZONE_OPTIONS,
  workdayFormSchema,
  type WorkdayFormInput,
} from "@/lib/schemas/workday";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import type { TargetOption, WorkdayRow } from "./types";
import { WorkdayListProvider } from "./workday-list-context";
import { WorkdaySlotsEditor } from "./workday-slots-editor";
import { WorkdayTargetPicker } from "./workday-target-picker";
import { WorkdaysToolbar } from "./workdays-toolbar";

export type { TargetOption, WorkdayRow } from "./types";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground";

export interface WorkdayManagerProps {
  teams: TargetOption[];
  users: TargetOption[];
  children: ReactNode;
  onCreate: (values: WorkdayFormInput) => void | Promise<void>;
  onUpdate: (
    documentId: string,
    values: WorkdayFormInput,
  ) => void | Promise<void>;
}

const EMPTY_FORM: WorkdayFormInput = {
  name: "",
  description: "",
  action: "work",
  scope: "global",
  timezone: DEFAULT_WORKDAY_TIMEZONE,
  validFrom: "",
  validUntil: "",
  teamIds: [],
  userIds: [],
  slots: [],
};

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function toFormValues(workday: WorkdayRow): WorkdayFormInput {
  return {
    name: workday.name,
    description: workday.description ?? "",
    action: workday.action,
    scope: workday.scope,
    timezone: workday.timezone || DEFAULT_WORKDAY_TIMEZONE,
    validFrom: toDateInputValue(workday.validFrom),
    validUntil: toDateInputValue(workday.validUntil),
    teamIds: workday.teams.map((team) => team.documentId),
    userIds: workday.users.map((user) => user.documentId),
    slots: workday.slots.map((slot) => ({
      isRecurrent: slot.isRecurrent,
      dayOfWeek: slot.dayOfWeek,
      date: slot.date,
      allDay: slot.allDay,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
    })),
  };
}

function resolveErrorMessage(
  code: string | undefined,
  t: ReturnType<typeof useTranslations<"workdays">>,
): string | undefined {
  if (!code) return undefined;
  if (code === "nameRequired") return t("validationNameRequired");
  if (code === "teamsRequired") return t("validationTeamsRequired");
  if (code === "usersRequired") return t("validationUsersRequired");
  if (code === "slotsRequired") return t("validationSlotsRequired");
  if (code === "validityOrder") return t("validationValidityOrder");
  return code;
}

interface WorkdayFormDialogProps {
  editingWorkday: WorkdayRow | null;
  teams: TargetOption[];
  users: TargetOption[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: WorkdayFormInput) => void;
}

function WorkdayFormDialog({
  editingWorkday,
  teams,
  users,
  isPending,
  onClose,
  onSubmit,
}: WorkdayFormDialogProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("workdays");
  const isEditing = editingWorkday !== null;
  const formId = "workday-form";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WorkdayFormInput>({
    resolver: zodResolver(workdayFormSchema),
    defaultValues: isEditing ? toFormValues(editingWorkday) : EMPTY_FORM,
  });

  const scope = useWatch({ control, name: "scope" }) ?? "global";
  const timezone = useWatch({ control, name: "timezone" }) ?? DEFAULT_WORKDAY_TIMEZONE;
  const timezoneList = WORKDAY_TIMEZONE_OPTIONS.includes(
    timezone as (typeof WORKDAY_TIMEZONE_OPTIONS)[number],
  )
    ? WORKDAY_TIMEZONE_OPTIONS
    : ([timezone, ...WORKDAY_TIMEZONE_OPTIONS] as const);

  return (
    <FormModalShell
      open
      size="xl"
      title={isEditing ? t("editWorkday") : t("newWorkday")}
      titleId="workday-form-title"
      onClose={onClose}
      disabled={isPending}
      footerEnd={
        <Button type="submit" form={formId} disabled={isPending}>
          {isEditing ? tCommon("save") : tCommon("create")}
        </Button>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="workday-name">{t("name")}</Label>
          <Input
            id="workday-name"
            placeholder={t("namePlaceholder")}
            disabled={isPending}
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-destructive">
              {resolveErrorMessage(errors.name.message, t)}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="workday-description">{t("description")}</Label>
          <Textarea
            id="workday-description"
            rows={2}
            placeholder={t("descriptionPlaceholder")}
            disabled={isPending}
            {...register("description")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workday-action">{t("action")}</Label>
          <select
            id="workday-action"
            disabled={isPending}
            className={SELECT_CLASS}
            {...register("action")}
          >
            <option value="work">{t("actionWork")}</option>
            <option value="off">{t("actionOff")}</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workday-scope">{t("scope")}</Label>
          <select
            id="workday-scope"
            disabled={isPending}
            className={SELECT_CLASS}
            {...register("scope")}
          >
            <option value="global">{t("scopeGlobal")}</option>
            <option value="team">{t("scopeTeam")}</option>
            <option value="user">{t("scopeUser")}</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workday-timezone">{t("timezone")}</Label>
          <select
            id="workday-timezone"
            disabled={isPending}
            className={SELECT_CLASS}
            {...register("timezone")}
          >
            {timezoneList.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="workday-valid-from">{t("validFrom")}</Label>
            <Controller
              name="validFrom"
              control={control}
              render={({ field }) => (
                <DatePtBrInput
                  id="workday-valid-from"
                  value={field.value ?? ""}
                  disabled={isPending}
                  allowEmpty
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workday-valid-until">{t("validUntil")}</Label>
            <Controller
              name="validUntil"
              control={control}
              render={({ field }) => (
                <DatePtBrInput
                  id="workday-valid-until"
                  value={field.value ?? ""}
                  disabled={isPending}
                  allowEmpty
                  onChange={field.onChange}
                />
              )}
            />
            {errors.validUntil ? (
              <p className="text-sm text-destructive">
                {resolveErrorMessage(errors.validUntil.message, t)}
              </p>
            ) : null}
          </div>
        </div>

        {scope === "team" ? (
          <div className="sm:col-span-2">
            <Controller
              name="teamIds"
              control={control}
              render={({ field }) => (
                <WorkdayTargetPicker
                  id="workday-team-ids"
                  label={t("teams")}
                  emptyLabel={t("noTeamsAvailable")}
                  options={teams}
                  value={field.value ?? []}
                  disabled={isPending}
                  error={resolveErrorMessage(errors.teamIds?.message, t)}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        ) : null}

        {scope === "user" ? (
          <div className="sm:col-span-2">
            <Controller
              name="userIds"
              control={control}
              render={({ field }) => (
                <WorkdayTargetPicker
                  id="workday-user-ids"
                  label={t("users")}
                  emptyLabel={t("noUsersAvailable")}
                  options={users}
                  value={field.value ?? []}
                  disabled={isPending}
                  error={resolveErrorMessage(errors.userIds?.message, t)}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <Controller
            name="slots"
            control={control}
            render={({ field }) => (
              <WorkdaySlotsEditor
                value={field.value ?? []}
                disabled={isPending}
                error={resolveErrorMessage(errors.slots?.message, t)}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </form>
    </FormModalShell>
  );
}

export function WorkdayManager({
  teams,
  users,
  children,
  onCreate,
  onUpdate,
}: WorkdayManagerProps) {
  const t = useTranslations("workdays");
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorkday, setEditingWorkday] = useState<WorkdayRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeForm(): void {
    setFormOpen(false);
    setEditingWorkday(null);
  }

  function startCreate(): void {
    setEditingWorkday(null);
    setFormOpen(true);
  }

  function startEdit(workday: WorkdayRow): void {
    setEditingWorkday(workday);
    setFormOpen(true);
  }

  function onSubmit(values: WorkdayFormInput): void {
    startTransition(async () => {
      try {
        if (editingWorkday) {
          await onUpdate(editingWorkday.documentId, values);
        } else {
          await onCreate(values);
        }
        showSuccessToast(t("saved"));
        closeForm();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  const formDialogKey = editingWorkday?.documentId ?? "new";

  return (
    <ListPageActionsProvider>
      <WorkdayListProvider openEdit={startEdit}>
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <Suspense fallback={null}>
            <WorkdaysToolbar
              trailingActions={
                <AddNewButton
                  label={t("newWorkday")}
                  disabled={isPending}
                  onClick={startCreate}
                />
              }
            />
          </Suspense>

          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>

        {formOpen ? (
          <WorkdayFormDialog
            key={formDialogKey}
            editingWorkday={editingWorkday}
            teams={teams}
            users={users}
            isPending={isPending}
            onClose={closeForm}
            onSubmit={onSubmit}
          />
        ) : null}
      </WorkdayListProvider>
    </ListPageActionsProvider>
  );
}

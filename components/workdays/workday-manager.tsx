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
import { Label } from "@/components/ui/label";
import { ListPageActionsProvider } from "@/components/ui/list-page-actions-slot";
import { Textarea } from "@/components/ui/textarea";
import type { Role } from "@/lib/auth/nav";
import { toCalendarDateKey } from "@/lib/business/datetime-timezone";
import {
  defaultWorkdayActionForRole,
  defaultWorkdayScope,
  isCivilDayWorkdayAction,
  isRecurrentWorkdayAction,
  LEADER_WORKDAY_ACTIONS,
  leaderPastFlipTarget,
  requiresWorkdayDescription,
  WORKDAY_ACTIONS,
  type WorkdayAction,
} from "@/lib/domain/workday-actions";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  DEFAULT_WORKDAY_TIMEZONE,
  WORKDAY_TIMEZONE_OPTIONS,
  workdayFormSchema,
  type WorkdayFormInput,
} from "@/lib/schemas/workday";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { WORKDAY_ACTION_MESSAGE_KEYS } from "@/lib/workdays/workday-action-labels";

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
  actorRole: Role;
  children: ReactNode;
  onCreate: (values: WorkdayFormInput) => void | Promise<void>;
  onUpdate: (
    documentId: string,
    values: WorkdayFormInput,
  ) => void | Promise<void>;
}

function emptyForm(role: Role): WorkdayFormInput {
  const action = defaultWorkdayActionForRole(role);
  return {
    description: "",
    action,
    scope: role === "leader" ? "user" : defaultWorkdayScope(action),
    timezone: DEFAULT_WORKDAY_TIMEZONE,
    validFrom: "",
    validUntil: "",
    teamIds: [],
    userIds: [],
    slots: [],
  };
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function toFormValues(workday: WorkdayRow): WorkdayFormInput {
  return {
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
  if (code === "teamsRequired") return t("validationTeamsRequired");
  if (code === "usersRequired") return t("validationUsersRequired");
  if (code === "slotsRequired") return t("validationSlotsRequired");
  if (code === "validityOrder") return t("validationValidityOrder");
  if (code === "descriptionRequired") return t("validationDescriptionRequired");
  if (code === "invalidScopeForAction") return t("validationScopeForAction");
  if (code === "recurrentSlotsRequired") return t("validationRecurrentSlots");
  if (code === "datedSingleSlotRequired") return t("validationDatedSingleSlot");
  if (code === "civilDayRequired") return t("validationCivilDay");
  if (code === "validityNotAllowed") return t("validationValidityNotAllowed");
  return code;
}

function actionOptionsForRole(role: Role): WorkdayAction[] {
  if (role === "leader") return [...LEADER_WORKDAY_ACTIONS];
  return [...WORKDAY_ACTIONS];
}

interface WorkdayFormDialogProps {
  editingWorkday: WorkdayRow | null;
  teams: TargetOption[];
  users: TargetOption[];
  actorRole: Role;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: WorkdayFormInput) => void;
}

function WorkdayFormDialog({
  editingWorkday,
  teams,
  users,
  actorRole,
  isPending,
  onClose,
  onSubmit,
}: WorkdayFormDialogProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("workdays");
  const isEditing = editingWorkday !== null;
  const isLeader = actorRole === "leader";
  const formId = "workday-form";
  const pastFlipTarget =
    isLeader && editingWorkday
      ? leaderPastFlipTarget(editingWorkday.action)
      : null;
  const existingDate = editingWorkday?.slots.find((slot) => slot.date)?.date;
  const todayIso = toCalendarDateKey(new Date(), DEFAULT_WORKDAY_TIMEZONE);
  const isPastFlip =
    pastFlipTarget !== null &&
    existingDate !== undefined &&
    existingDate < todayIso;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<WorkdayFormInput>({
    resolver: zodResolver(workdayFormSchema),
    defaultValues: isEditing ? toFormValues(editingWorkday) : emptyForm(actorRole),
  });

  const action = (useWatch({ control, name: "action" }) ??
    defaultWorkdayActionForRole(actorRole)) as WorkdayAction;
  const scope = useWatch({ control, name: "scope" }) ?? "global";
  const timezone =
    useWatch({ control, name: "timezone" }) ?? DEFAULT_WORKDAY_TIMEZONE;
  const timezoneList = WORKDAY_TIMEZONE_OPTIONS.includes(
    timezone as (typeof WORKDAY_TIMEZONE_OPTIONS)[number],
  )
    ? WORKDAY_TIMEZONE_OPTIONS
    : ([timezone, ...WORKDAY_TIMEZONE_OPTIONS] as const);

  const recurrent = isRecurrentWorkdayAction(action);
  const civilDay = isCivilDayWorkdayAction(action);
  const showScope = !isLeader && (action === "work" || action === "off");
  const showValidity = recurrent && !isLeader;
  const showTimezone = !isLeader;
  const lockFields = isPastFlip;
  const visibleActions = isPastFlip && pastFlipTarget && editingWorkday
    ? [editingWorkday.action, pastFlipTarget]
    : actionOptionsForRole(actorRole);

  function handleActionChange(next: WorkdayAction): void {
    setValue("action", next);
    if (lockFields) return;
    setValue("scope", isLeader ? "user" : defaultWorkdayScope(next));
    setValue("teamIds", []);
    if (!isLeader) setValue("userIds", []);
    setValue("validFrom", "");
    setValue("validUntil", "");
    setValue("slots", []);
    if (isLeader) setValue("timezone", DEFAULT_WORKDAY_TIMEZONE);
  }

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
        <div className="space-y-2">
          <Label htmlFor="workday-action">{t("action")}</Label>
          <select
            id="workday-action"
            disabled={isPending || (lockFields && !pastFlipTarget)}
            className={SELECT_CLASS}
            value={action}
            onChange={(event) =>
              handleActionChange(event.target.value as WorkdayAction)
            }
          >
            {visibleActions.map((item) => (
              <option key={item} value={item}>
                {t(WORKDAY_ACTION_MESSAGE_KEYS[item])}
              </option>
            ))}
          </select>
        </div>

        {showScope ? (
          <div className="space-y-2">
            <Label htmlFor="workday-scope">{t("scope")}</Label>
            <select
              id="workday-scope"
              disabled={isPending || lockFields}
              className={SELECT_CLASS}
              {...register("scope")}
            >
              <option value="global">{t("scopeGlobal")}</option>
              <option value="team">{t("scopeTeam")}</option>
              <option value="user">{t("scopeUser")}</option>
            </select>
          </div>
        ) : (
          <input type="hidden" {...register("scope")} />
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="workday-description">{t("description")}</Label>
          <Textarea
            id="workday-description"
            rows={2}
            placeholder={
              requiresWorkdayDescription(action)
                ? t("descriptionRequiredPlaceholder")
                : t("descriptionPlaceholder")
            }
            disabled={isPending}
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-sm text-destructive">
              {resolveErrorMessage(errors.description.message, t)}
            </p>
          ) : null}
        </div>

        {showTimezone ? (
          <div className="space-y-2">
            <Label htmlFor="workday-timezone">{t("timezone")}</Label>
            <select
              id="workday-timezone"
              disabled={isPending || lockFields}
              className={SELECT_CLASS}
              {...register("timezone")}
            >
              {timezoneList.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" {...register("timezone")} />
        )}

        {showValidity ? (
          <>
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
          </>
        ) : null}

        {scope === "team" && !isLeader ? (
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
                  disabled={isPending || lockFields}
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
                  disabled={isPending || lockFields}
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
                disabled={isPending || lockFields}
                recurrent={recurrent}
                civilDay={civilDay}
                singleDatedSlot={!recurrent}
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
  actorRole,
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
    if (!workday.editable) return;
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
            actorRole={actorRole}
            isPending={isPending}
            onClose={closeForm}
            onSubmit={onSubmit}
          />
        ) : null}
      </WorkdayListProvider>
    </ListPageActionsProvider>
  );
}

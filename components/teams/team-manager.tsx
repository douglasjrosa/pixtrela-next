"use client";

import { Suspense, useState, useTransition, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePtBrInput } from "@/components/ui/date-ptbr-input";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDatePtBr } from "@/lib/format/datetime";
import {
  DEFAULT_EXCHANGES_FIRST_DAY,
  DEFAULT_EXCHANGES_LAST_DAY,
  teamFormSchema,
  type TeamFormInput,
} from "@/lib/schemas/team";

import { TeamListProvider } from "./team-list-context";
import { TeamColaboratorPicker } from "./team-colaborator-picker";
import { TeamsToolbar } from "./teams-toolbar";
import type { TeamRow, UserOption } from "./types";

export type { TeamRow, UserOption } from "./types";

export interface TeamManagerProps {
  leaders: UserOption[];
  colaborators: UserOption[];
  children: ReactNode;
  onCreate: (values: TeamFormInput) => void | Promise<void>;
  onUpdate: (documentId: string, values: TeamFormInput) => void | Promise<void>;
  onArchive: (documentId: string) => void | Promise<void>;
  onHardDelete: (documentId: string) => void | Promise<void>;
  canDeactivate?: boolean;
  canDelete: boolean;
}

const EMPTY_FORM: TeamFormInput = {
  name: "",
  exchangesFirstDay: DEFAULT_EXCHANGES_FIRST_DAY,
  exchangesLastDay: DEFAULT_EXCHANGES_LAST_DAY,
  leaderDocumentId: "",
  colaboratorDocumentIds: [],
  untill: "",
};

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function toFormValues(team: TeamRow): TeamFormInput {
  return {
    name: team.name,
    exchangesFirstDay: team.exchangesFirstDay,
    exchangesLastDay: team.exchangesLastDay,
    leaderDocumentId: team.leader?.documentId ?? "",
    colaboratorDocumentIds:
      team.colaborators?.map((colaborator) => colaborator.documentId) ?? [],
    untill: toDateInputValue(team.untill),
  };
}

interface TeamFormDialogProps {
  editingTeam: TeamRow | null;
  leaders: UserOption[];
  colaborators: UserOption[];
  isPending: boolean;
  destructiveAction?: "archive" | "delete";
  onClose: () => void;
  onSubmit: (values: TeamFormInput) => void;
  onDestructiveAction?: () => void;
}

function TeamFormDialog({
  editingTeam,
  leaders,
  colaborators,
  isPending,
  destructiveAction,
  onClose,
  onSubmit,
  onDestructiveAction,
}: TeamFormDialogProps) {
  const tCommon = useTranslations("common");
  const tTeams = useTranslations("teams");
  const isEditing = editingTeam !== null;
  const formId = "team-form";
  const formTitleId = "team-form-title";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TeamFormInput>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: isEditing ? toFormValues(editingTeam) : EMPTY_FORM,
  });

  return (
    <FormModalShell
      open
      title={isEditing ? tTeams("editTeam") : tTeams("newTeam")}
      titleId={formTitleId}
      onClose={onClose}
      disabled={isPending}
      footerStart={
        destructiveAction && onDestructiveAction ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={onDestructiveAction}
          >
            {destructiveAction === "archive"
              ? tTeams("archive")
              : tCommon("delete")}
          </Button>
        ) : undefined
      }
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
          <Label htmlFor="name">{tTeams("name")}</Label>
          <Input id="name" disabled={isPending} {...register("name")} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="exchangesFirstDay">{tTeams("exchangesFirstDay")}</Label>
          <Input
            id="exchangesFirstDay"
            type="number"
            min={1}
            max={31}
            disabled={isPending}
            {...register("exchangesFirstDay", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exchangesLastDay">{tTeams("exchangesLastDay")}</Label>
          <Input
            id="exchangesLastDay"
            type="number"
            min={1}
            max={31}
            disabled={isPending}
            {...register("exchangesLastDay", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leaderDocumentId">{tTeams("leader")}</Label>
          <select
            id="leaderDocumentId"
            disabled={isPending}
            className={
              "flex h-9 w-full rounded-md border border-input " +
              "bg-transparent px-3 text-sm"
            }
            {...register("leaderDocumentId")}
          >
            <option value="" />
            {leaders.map((leader) => (
              <option key={leader.documentId} value={leader.documentId}>
                {leader.name}
              </option>
            ))}
          </select>
        </div>

        {editingTeam ? (
          <>
            <div className="space-y-2">
              <Label>{tTeams("since")}</Label>
              <p className="text-sm text-muted-foreground">
                {formatDatePtBr(editingTeam.since)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="untill">{tTeams("untill")}</Label>
              <Controller
                name="untill"
                control={control}
                render={({ field }) => (
                  <DatePtBrInput
                    id="untill"
                    value={field.value ?? ""}
                    disabled={isPending}
                    allowEmpty
                    onChange={field.onChange}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                {tTeams("untillHint")}
              </p>
            </div>
          </>
        ) : null}

        <div className="sm:col-span-2">
          <Controller
            name="colaboratorDocumentIds"
            control={control}
            render={({ field }) => (
              <TeamColaboratorPicker
                id="colaboratorDocumentIds"
                label={tTeams("colaborators")}
                colaborators={colaborators}
                value={field.value ?? []}
                disabled={isPending}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </form>
    </FormModalShell>
  );
}

export function TeamManager({
  leaders,
  colaborators,
  children,
  onCreate,
  onUpdate,
  onArchive,
  onHardDelete,
  canDeactivate = false,
  canDelete,
}: TeamManagerProps) {
  const tCommon = useTranslations("common");
  const tTeams = useTranslations("teams");
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const destructiveAction = editingTeam
    ? editingTeam.active
      ? canDeactivate
        ? ("archive" as const)
        : undefined
      : canDelete
        ? ("delete" as const)
        : undefined
    : undefined;

  function closeForm(): void {
    setFormOpen(false);
    setEditingTeam(null);
    setConfirmOpen(false);
  }

  function startCreate(): void {
    setEditingTeam(null);
    setMessage(null);
    setConfirmOpen(false);
    setFormOpen(true);
  }

  function startEdit(team: TeamRow): void {
    setEditingTeam(team);
    setMessage(null);
    setConfirmOpen(false);
    setFormOpen(true);
  }

  function onSubmit(values: TeamFormInput): void {
    startTransition(async () => {
      if (editingTeam) {
        await onUpdate(editingTeam.documentId, values);
      } else {
        await onCreate(values);
      }
      setMessage(tTeams("saved"));
      closeForm();
      router.refresh();
    });
  }

  function handleConfirmDestructive(): void {
    if (!editingTeam || !destructiveAction) return;
    startTransition(async () => {
      if (destructiveAction === "archive") {
        await onArchive(editingTeam.documentId);
        setMessage(tTeams("archived"));
      } else {
        await onHardDelete(editingTeam.documentId);
        setMessage(tTeams("deleted"));
      }
      closeForm();
      router.refresh();
    });
  }

  const formDialogKey = editingTeam?.documentId ?? "new";

  return (
    <TeamListProvider openEdit={startEdit}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 max-[500px]:gap-2">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h1 className="text-2xl font-bold max-[500px]:text-lg">
            {tTeams("title")}
          </h1>
          <Button
            type="button"
            size="icon-lg"
            aria-label={tTeams("newTeam")}
            onClick={startCreate}
          >
            <Plus aria-hidden />
          </Button>
        </div>

        <Suspense fallback={null}>
          <TeamsToolbar />
        </Suspense>

        {message ? (
          <p role="status" className="shrink-0 text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}

        {formOpen ? (
          <TeamFormDialog
            key={formDialogKey}
            editingTeam={editingTeam}
            leaders={leaders}
            colaborators={colaborators}
            isPending={isPending}
            destructiveAction={destructiveAction}
            onClose={closeForm}
            onSubmit={onSubmit}
            onDestructiveAction={
              destructiveAction ? () => setConfirmOpen(true) : undefined
            }
          />
        ) : null}

        <ConfirmDialog
          open={confirmOpen}
          title={
            destructiveAction === "archive"
              ? tTeams("archiveTitle")
              : tTeams("deleteTitle")
          }
          description={
            destructiveAction === "archive"
              ? tTeams("archiveConfirm")
              : tTeams("deleteConfirm")
          }
          confirmLabel={
            destructiveAction === "archive"
              ? tTeams("archive")
              : tCommon("delete")
          }
          disabled={isPending}
          onConfirm={handleConfirmDestructive}
          onClose={() => setConfirmOpen(false)}
        />

        {children}
      </div>
    </TeamListProvider>
  );
}

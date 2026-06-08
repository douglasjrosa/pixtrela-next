"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isTeamActive } from "@/lib/business/team-active";
import { formatDatePtBr } from "@/lib/format/datetime";
import {
  DEFAULT_EXCHANGES_FIRST_DAY,
  DEFAULT_EXCHANGES_LAST_DAY,
  teamFormSchema,
  type TeamFormInput,
} from "@/lib/schemas/team";
import { cn } from "@/lib/utils";

export interface UserOption {
  documentId: string;
  name: string;
}

export interface TeamRow {
  documentId: string;
  name: string;
  exchangesFirstDay: number;
  exchangesLastDay: number;
  since: string | null;
  untill: string | null;
  leader?: UserOption | null;
  colaborators?: UserOption[];
}

export interface TeamManagerProps {
  teams: TeamRow[];
  leaders: UserOption[];
  colaborators: UserOption[];
  onCreate: (values: TeamFormInput) => void | Promise<void>;
  onUpdate: (documentId: string, values: TeamFormInput) => void | Promise<void>;
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

export function TeamManager({
  teams,
  leaders,
  colaborators,
  onCreate,
  onUpdate,
}: TeamManagerProps) {
  const tCommon = useTranslations("common");
  const tTeams = useTranslations("teams");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormInput>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: EMPTY_FORM,
  });

  const editingTeam = editingId
    ? teams.find((team) => team.documentId === editingId)
    : null;

  function startCreate(): void {
    setEditingId(null);
    reset(EMPTY_FORM);
    setMessage(null);
  }

  function startEdit(team: TeamRow): void {
    setEditingId(team.documentId);
    reset({
      name: team.name,
      exchangesFirstDay: team.exchangesFirstDay,
      exchangesLastDay: team.exchangesLastDay,
      leaderDocumentId: team.leader?.documentId ?? "",
      colaboratorDocumentIds:
        team.colaborators?.map((colaborator) => colaborator.documentId) ?? [],
      untill: toDateInputValue(team.untill),
    });
    setMessage(null);
  }

  function onSubmit(values: TeamFormInput): void {
    startTransition(async () => {
      if (editingId) {
        await onUpdate(editingId, values);
      } else {
        await onCreate(values);
      }
      setMessage(tTeams("saved"));
      setEditingId(null);
      reset(EMPTY_FORM);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tTeams("title")}</h1>
        <Button type="button" variant="outline" onClick={startCreate}>
          {tTeams("newTeam")}
        </Button>
      </div>

      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">
          {editingId ? tCommon("edit") : tTeams("newTeam")}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="name">{tTeams("name")}</Label>
          <Input id="name" {...register("name")} />
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
            {...register("exchangesLastDay", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leaderDocumentId">{tTeams("leader")}</Label>
          <select
            id="leaderDocumentId"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
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
              <Input id="untill" type="date" {...register("untill")} />
              <p className="text-xs text-muted-foreground">{tTeams("untillHint")}</p>
            </div>
          </>
        ) : null}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="colaboratorDocumentIds">{tTeams("colaborators")}</Label>
          <select
            id="colaboratorDocumentIds"
            multiple
            className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            {...register("colaboratorDocumentIds")}
          >
            {colaborators.map((colaborator) => (
              <option key={colaborator.documentId} value={colaborator.documentId}>
                {colaborator.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={isPending}>
            {tCommon("save")}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={startCreate}>
              {tCommon("cancel")}
            </Button>
          ) : null}
        </div>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">{tTeams("name")}</th>
            <th>{tTeams("since")}</th>
            <th>{tTeams("untill")}</th>
            <th>{tTeams("status")}</th>
            <th>{tTeams("exchangesFirstDay")}</th>
            <th>{tTeams("exchangesLastDay")}</th>
            <th>{tTeams("leader")}</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const active = isTeamActive(team.untill);
            return (
              <tr
                key={team.documentId}
                className={cn("border-b", !active && "text-muted-foreground")}
              >
                <td className="py-2">
                  <button
                    type="button"
                    className="text-left hover:underline"
                    onClick={() => startEdit(team)}
                  >
                    {team.name}
                  </button>
                </td>
                <td>{formatDatePtBr(team.since)}</td>
                <td>{formatDatePtBr(team.untill)}</td>
                <td>{active ? tTeams("active") : tTeams("inactive")}</td>
                <td>{team.exchangesFirstDay}</td>
                <td>{team.exchangesLastDay}</td>
                <td>{team.leader?.name ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
